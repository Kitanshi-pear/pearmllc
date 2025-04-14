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

    const certRequest = await acm.requestCertificate({
      DomainName: domain.domain,
      ValidationMethod: 'DNS',
      IdempotencyToken: uuidv4().replace(/-/g, '').slice(0, 32),
    }).promise();
    
    const certArn = certRequest.CertificateArn;
    
    await sleep(5000);
    
    const certDetails = await acm.describeCertificate({ CertificateArn: certArn }).promise();
    const record = certDetails.Certificate.DomainValidationOptions?.[0]?.ResourceRecord;
    
    if (!record) return res.status(500).json({ error: 'ACM CNAME record not ready yet' });
    
    await domain.update({
      certificate_arn: certArn, // <=== make sure this line exists
      cname_acm_name: record.Name,
      cname_acm_value: record.Value,
      status: 'verifying'
    });
    console.log('Domain updated with ACM details:', domain.toJSON());    

    res.json({
      message: 'Certificate requested. Add the following DNS record.',
      cname: { name: record.Name, value: record.Value }
    });
  } catch (error) {
    console.error('ACM provisioning error:', error);
    res.status(500).json({ error: 'ACM provisioning failed', details: error.message });
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
        Comment: '', // <-- ✅ Add this line
        Aliases: { Quantity: 1, Items: [domain.domain] },
        Origins: {
          Quantity: 1,
          Items: [{
            Id: 'redirector',
            DomainName: 'pearmllc.onrender.com',
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
          TrustedSigners: { Enabled: false, Quantity: 0 },
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

    await domain.update({
      status: 'active',
      cloudfront_domain: dist.Distribution.DomainName,
      ssl_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
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

    const rootDomain = domain.domain.split('.').slice(-2).join('.');

    // List all hosted zones
    const zonesData = await route53.listHostedZones().promise();
    const zones = zonesData.HostedZones;

    // Find zone matching root domain
    let matchedZone = zones.find(z => z.Name.replace(/\.$/, '') === rootDomain);

    // Auto-create if not found
    if (!matchedZone) {
      console.log(`Hosted zone not found for ${rootDomain}, creating...`);
      const created = await route53.createHostedZone({
        Name: rootDomain,
        CallerReference: `${Date.now()}-${rootDomain}`,
      }).promise();

      matchedZone = created.HostedZone;
      console.log(`Hosted zone created: ${matchedZone.Id}`);
    }

    // Create or update the CNAME record
    await route53.changeResourceRecordSets({
      HostedZoneId: matchedZone.Id,
      ChangeBatch: {
        Changes: [{
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: domain.cname_acm_name,
            Type: 'CNAME',
            TTL: 300,
            ResourceRecords: [{ Value: domain.cname_acm_value }]
          }
        }]
      }
    }).promise();

    res.json({ message: 'CNAME record added to Route 53 successfully' });

  } catch (error) {
    console.error('Route 53 error:', error);
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
