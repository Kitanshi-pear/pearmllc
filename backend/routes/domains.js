const express = require('express');
const router = express.Router();
const { Domain } = require('../models');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region: 'us-east-1' });

const acm = new AWS.ACM({ region: 'us-east-1' });
const route53 = new AWS.Route53();
const cloudfront = new AWS.CloudFront();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// === 1. Create Domain
router.post('/', async (req, res) => {
  try {
    const { url, sslEnabled } = req.body;
    const domainName = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const userId = req.user?.id || 1;

    const domain = await Domain.create({
      user_id: userId,
      domain: domainName,
      status: sslEnabled ? 'pending' : 'active',
      ssl_expiry: null,
      reissue_only: false
    });

    res.status(201).json(domain);
  } catch (error) {
    console.error('Error creating domain:', error);
    res.status(500).json({ error: 'Domain creation failed', details: error.message });
  }
});

// === 2. Request ACM Certificate
router.post('/:id/provision', async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    // Request certificate
    const certRequest = await acm.requestCertificate({
      DomainName: domain.domain,
      ValidationMethod: 'DNS',
      IdempotencyToken: uuidv4().replace(/-/g, '').slice(0, 32),
    }).promise();

    const certArn = certRequest.CertificateArn;
    await sleep(5000); // Allow ACM to generate validation record

    // Fetch certificate details
    const certDetails = await acm.describeCertificate({ CertificateArn: certArn }).promise();
    const record = certDetails.Certificate.DomainValidationOptions?.[0]?.ResourceRecord;
    const notAfter = certDetails.Certificate.NotAfter;

    if (!record) {
      return res.status(500).json({ error: 'ACM CNAME record not ready yet' });
    }

    // Update domain record
    await domain.update({
      certificate_arn: certArn,
      cname_acm_name: record.Name,
      cname_acm_value: record.Value,
      ssl_expiry: notAfter,
      renew_eligible: true,
      status: 'verifying'
    });

    console.log('Domain updated with ACM details:', domain.toJSON());

    res.json({
      message: 'Certificate requested. Add the following DNS record.',
      cname: { name: record.Name, value: record.Value },
      ssl_expiry: notAfter
    });

  } catch (error) {
    console.error('ACM provisioning error:', error);
    res.status(500).json({
      error: 'ACM provisioning failed',
      details: error.message
    });
  }
});

router.post('/:id/use-eligible-certificate', async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    let certs = [];
    let nextToken = null;

    // Step 1: List all issued certs
    do {
      const result = await acm.listCertificates({
        CertificateStatuses: ['ISSUED'],
        NextToken: nextToken,
      }).promise();

      certs = certs.concat(result.CertificateSummaryList);
      nextToken = result.NextToken;
    } while (nextToken);

    // Step 2: Filter certs matching domain name
    const matchingCerts = certs.filter(cert => cert.DomainName === domain.domain);

    // Step 3: Find eligible one
    let eligibleCert = null;
    for (const cert of matchingCerts) {
      const details = await acm.describeCertificate({ CertificateArn: cert.CertificateArn }).promise();
      const certificate = details.Certificate;

      if (certificate.RenewalEligibility === 'ELIGIBLE') {
        eligibleCert = certificate;
        break;
      }
    }

    if (!eligibleCert) {
      return res.status(404).json({ error: 'No eligible certificate found for domain' });
    }

    // Step 4: Update domain with eligible cert
    await domain.update({
      certificate_arn: eligibleCert.CertificateArn,
      ssl_expiry: eligibleCert.NotAfter,
      status: 'active'
    });

    res.json({
      message: 'Eligible certificate applied successfully.',
      certificateArn: eligibleCert.CertificateArn,
      notAfter: eligibleCert.NotAfter
    });

  } catch (error) {
    console.error('Error using eligible certificate:', error);
    res.status(500).json({ error: 'Failed to apply eligible certificate', details: error.message });
  }
});

router.get('/:id/eligible-certificates', async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    // List all certificates
    let certs = [];
    let nextToken = null;

    do {
      const result = await acm.listCertificates({
        CertificateStatuses: ['ISSUED'],
        NextToken: nextToken,
      }).promise();

      certs = certs.concat(result.CertificateSummaryList);
      nextToken = result.NextToken;
    } while (nextToken);

    // Filter by domain match
    const matchingCerts = certs.filter(cert => cert.DomainName === domain.domain);

    // Describe and filter by RenewalEligibility
    const eligibleCerts = [];
    for (const cert of matchingCerts) {
      const details = await acm.describeCertificate({ CertificateArn: cert.CertificateArn }).promise();
      const certificate = details.Certificate;

      if (certificate.RenewalEligibility === 'ELIGIBLE') {
        eligibleCerts.push(certificate);
      }
    }

    res.json({
      domain: domain.domain,
      eligibleCertificates: eligibleCerts,
    });

  } catch (error) {
    console.error('Error fetching eligible certificates:', error);
    res.status(500).json({ error: 'Failed to get eligible certificates', details: error.message });
  }
});

router.get('/:id/certificates', async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    // Fetch all ACM certificates
    let certs = [];
    let nextToken = null;

    do {
      const result = await acm.listCertificates({
        CertificateStatuses: ['PENDING_VALIDATION', 'ISSUED', 'INACTIVE', 'EXPIRED', 'VALIDATION_TIMED_OUT', 'REVOKED', 'FAILED'],
        NextToken: nextToken,
        Includes: {
          keyTypes: ['RSA_2048', 'RSA_4096', 'EC_prime256v1'],
        }
      }).promise();

      certs = certs.concat(result.CertificateSummaryList);
      nextToken = result.NextToken;
    } while (nextToken);

    // Filter certs by domain name match
    const filtered = certs.filter(cert => cert.DomainName === domain.domain);

    // Optionally: fetch detailed info about each cert
    const detailedCerts = await Promise.all(filtered.map(async (cert) => {
      const details = await acm.describeCertificate({ CertificateArn: cert.CertificateArn }).promise();
      return details.Certificate;
    }));

    res.json({ domain: domain.domain, certificates: detailedCerts });
  } catch (err) {
    console.error('Error listing certificates:', err);
    res.status(500).json({ error: 'Failed to list certificates', details: err.message });
  }
});


// === 3. Poll ACM + Deploy CloudFront
router.post('/:id/deploy', async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain?.certificate_arn) {
      return res.status(404).json({ error: 'Certificate not found for domain' });
    }

    const certData = await acm.describeCertificate({ CertificateArn: domain.certificate_arn }).promise();
    const status = certData.Certificate.Status;

    if (status !== 'ISSUED') {
      return res.status(400).json({ error: `Certificate not ready. Current status: ${status}` });
    }

    const distConfig = {
      DistributionConfig: {
        CallerReference: uuidv4(),
        Comment: `CloudFront distribution for ${domain.domain}`,  // Add a meaningful comment
        Aliases: { Quantity: 1, Items: [domain.domain] },
        Origins: {
          Quantity: 1,
          Items: [{
            Id: 'redirector',
            DomainName: domain.domain,
            CustomOriginConfig: {
              HTTPPort: 80,
              HTTPSPort: 443,
              OriginProtocolPolicy: 'https-only'
            }
          }]
        },
        DefaultCacheBehavior: {
          TargetOriginId: 'redirector',
          ViewerProtocolPolicy: 'redirect-to-https',
          ForwardedValues: {
            QueryString: true,
            Cookies: { Forward: 'none' }
          },
          MinTTL: 0
        },
        ViewerCertificate: {
          ACMCertificateArn: domain.certificate_arn,
          SSLSupportMethod: 'sni-only',
          MinimumProtocolVersion: 'TLSv1.2_2021'
        },
        Enabled: true
      }
    };
    
    const dist = await cloudfront.createDistribution(distConfig).promise();

    // Update domain with CloudFront info
    await domain.update({
      status: 'active',
      cloudfront_domain: dist.Distribution.DomainName,
    });

    res.json({
      message: 'CloudFront distribution deployed!',
      cloudfront_domain: dist.Distribution.DomainName
    });
  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({ error: 'CloudFront deployment failed', details: error.message });
  }
});

// === 4. Get DNS CNAME Record
router.get('/:id/dns-records', async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    res.json({
      cname_acm: {
        name: domain.cname_acm_name,
        value: domain.cname_acm_value
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get DNS records', details: error.message });
  }
});

// === 5. Auto Add CNAME to Route 53
// === Auto Add CNAME to Route 53 (with auto-create zone)
router.post('/:id/auto-route53', async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);

    if (!domain?.cname_acm_name || !domain?.cname_acm_value) {
      return res.status(404).json({ error: 'CNAME record not ready yet' });
    }

    // Main domain for routing
    const mainDomain = 'pearmllc.onrender.com';
    const trackSubdomain = `track.${domain.domain}`;

    // Step 1: List all hosted zones
    const zonesData = await route53.listHostedZones().promise();
    const zones = zonesData.HostedZones;

    // Step 2: Find or create hosted zone
    const rootDomain = domain.domain.split('.').slice(-2).join('.');
    let matchedZone = zones.find(z => z.Name.replace(/\.$/, '') === rootDomain);

    if (!matchedZone) {
      console.log(`Hosted zone not found for ${rootDomain}, creating...`);
      const created = await route53.createHostedZone({
        Name: rootDomain,
        CallerReference: `${Date.now()}-${rootDomain}`,
      }).promise();

      matchedZone = created.HostedZone;
      console.log(`Hosted zone created: ${matchedZone.Id}`);
    }

    // Step 3: Add ACM validation CNAME record
    await route53.changeResourceRecordSets({
      HostedZoneId: matchedZone.Id,
      ChangeBatch: {
        Changes: [{
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: domain.cname_acm_name, // ACM validation CNAME record
            Type: 'CNAME',
            TTL: 300,
            ResourceRecords: [{ Value: domain.cname_acm_value }]
          }
        }, {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: trackSubdomain, // CNAME for track subdomain
            Type: 'CNAME',
            TTL: 300,
            ResourceRecords: [{ Value: mainDomain }] // Pointing to pearmllc.onrender.com
          }
        }]
      }
    }).promise();

    // Step 4: Respond with both CNAME records
    res.json({
      message: 'CNAME records created and added successfully',
      records: [
        {
          cname_name: domain.cname_acm_name,  // ACM validation CNAME record
          cname_value: domain.cname_acm_value
        },
        {
          cname_name: trackSubdomain,  // track subdomain CNAME record
          cname_value: mainDomain // Main domain pointing to pearmllc.onrender.com
        }
      ]
    });

  } catch (error) {
    console.error('Route53 error:', error);
    res.status(500).json({
      error: 'Failed to add record to Route 53',
      details: error.message
    });
  }
});


// === 6. List All Domains
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const domains = await Domain.findAll({ where: { user_id: userId } });

    const data = domains.map((d, i) => ({
      serial_no: i + 1,
      id: d.id,
      url: `https://${d.domain}`,
      created_at: d.created_at,
      ssl_expiry: d.ssl_expiry,
      reissue_only: d.reissue_only,
      sslEnabled: d.status !== 'active',
      status: d.status,
      cname_acm_name: d.cname_acm_name,
      cname_acm_value: d.cname_acm_value,
      cloudfront_domain: d.cloudfront_domain
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list domains', details: error.message });
  }
});

// === 7. Delete Domain
router.delete('/:id/delete', async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    await domain.destroy();
    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete domain', details: error.message });
  }
});

// === 8. Get Single Domain
router.get('/:id', async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    res.json(domain);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch domain', details: error.message });
  }
});

module.exports = router;
