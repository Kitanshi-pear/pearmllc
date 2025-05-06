import React, { useState, useEffect } from 'react';
import moment from 'moment-timezone';
import {
  Box,
  Typography,
  Button,
  Popover,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faChevronLeft,
  faChevronRight,
  faExchangeAlt,
} from '@fortawesome/free-solid-svg-icons';

// Constants from your system
const DATE_FORMAT = 'YYYY-MM-DD';
const DATE_FORMAT_HOUR_SECONDS = 'YYYY-MM-DD HH:mm:ss';

// Time ranges similar to what's in your paste.txt file
const generateRanges = (formatMessage, timeZone) => [
  {
    label: formatMessage ? formatMessage({ id: 'daterangepicker.today' }) : 'Today',
    startDate: timeZone ? moment().tz(timeZone).startOf('day') : moment().startOf('day'),
    endDate: timeZone ? moment().tz(timeZone).endOf('day') : moment().endOf('day'),
    rangeKey: 'today',
    timeInterval: '',
  },
  {
    label: formatMessage ? formatMessage({ id: 'daterangepicker.yesterday' }) : 'Yesterday',
    startDate: timeZone ? moment().tz(timeZone).subtract(1, 'day').startOf('day') : moment().subtract(1, 'day').startOf('day'),
    endDate: timeZone ? moment().tz(timeZone).subtract(1, 'day').endOf('day') : moment().subtract(1, 'day').endOf('day'),
    rangeKey: 'yesterday',
    timeInterval: '',
  },
  {
    label: formatMessage ? formatMessage({ id: 'daterangepicker.this_week' }) : 'This Week',
    startDate: timeZone ? moment().tz(timeZone).startOf('isoweek') : moment().startOf('isoweek'),
    endDate: timeZone ? moment().tz(timeZone).endOf('isoweek') : moment().endOf('isoweek'),
    rangeKey: 'this_week',
    timeInterval: '',
  },
  {
    label: formatMessage ? formatMessage({ id: 'daterangepicker.last_seven_days' }) : 'Last 7 Days',
    startDate: timeZone ? moment().tz(timeZone).subtract(6, 'days').startOf('day') : moment().subtract(6, 'days').startOf('day'),
    endDate: timeZone ? moment().tz(timeZone).endOf('day') : moment().endOf('day'),
    rangeKey: 'last_seven_days',
    timeInterval: '',
  },
  {
    label: formatMessage ? formatMessage({ id: 'daterangepicker.last_week' }) : 'Last Week',
    startDate: timeZone ? moment().tz(timeZone).subtract(1, 'week').startOf('isoweek') : moment().subtract(1, 'week').startOf('isoweek'),
    endDate: timeZone ? moment().tz(timeZone).subtract(1, 'week').endOf('isoweek') : moment().subtract(1, 'week').endOf('isoweek'),
    rangeKey: 'last_week',
    timeInterval: '',
  },
  {
    label: formatMessage ? formatMessage({ id: 'daterangepicker.this_month' }) : 'This Month',
    startDate: timeZone ? moment().tz(timeZone).startOf('month') : moment().startOf('month'),
    endDate: timeZone ? moment().tz(timeZone).endOf('month') : moment().endOf('month'),
    rangeKey: 'this_month',
    timeInterval: '',
  },
  {
    label: formatMessage ? formatMessage({ id: 'daterangepicker.last_thirty_days' }) : 'Last 30 Days',
    startDate: timeZone ? moment().tz(timeZone).subtract(29, 'days').startOf('day') : moment().subtract(29, 'days').startOf('day'),
    endDate: timeZone ? moment().tz(timeZone).endOf('day') : moment().endOf('day'),
    rangeKey: 'last_thirty_days',
    timeInterval: '',
  },
  {
    label: formatMessage ? formatMessage({ id: 'daterangepicker.last_month' }) : 'Last Month',
    startDate: timeZone ? moment().tz(timeZone).subtract(1, 'month').startOf('month') : moment().subtract(1, 'month').startOf('month'),
    endDate: timeZone ? moment().tz(timeZone).subtract(1, 'month').endOf('month') : moment().subtract(1, 'month').endOf('month'),
    rangeKey: 'last_month',
    timeInterval: '',
  },
];

// Helper functions from paste.txt
const getCorrectDate = (date, tz = '') => {
  const parsedDate = moment(date);
  if (tz && !parsedDate.isUTC()) {
    return parsedDate.tz(tz);
  }
  return parsedDate;
};

const prepareDate = (date) => {
  if (!date || !moment.isMoment(date)) {
    return '';
  }
  return date.format(DATE_FORMAT);
};

const DateRangePicker = ({ onDateRangeChange }) => {
  // Default timezone to browser's timezone if none specified
  const [timeZone, setTimeZone] = useState(moment.tz.guess());
  const [ranges, setRanges] = useState(generateRanges(null, timeZone));
  const [selectedRange, setSelectedRange] = useState(ranges[0]); // Default to Today
  const [anchorEl, setAnchorEl] = useState(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  
  // Timezone options
  const timezoneOptions = moment.tz.names().map(tz => ({
    value: tz,
    label: tz
  }));
  
  useEffect(() => {
    // Update ranges when timezone changes
    setRanges(generateRanges(null, timeZone));
    
    // Update selected range with new timezone
    if (selectedRange) {
      const updatedRanges = generateRanges(null, timeZone);
      const rangeWithSameKey = updatedRanges.find(r => r.rangeKey === selectedRange.rangeKey);
      if (rangeWithSameKey) {
        setSelectedRange(rangeWithSameKey);
        
        // Notify parent component about date range change
        if (onDateRangeChange) {
          onDateRangeChange({
            startDate: prepareDate(rangeWithSameKey.startDate),
            endDate: prepareDate(rangeWithSameKey.endDate),
            label: rangeWithSameKey.label,
            timeInterval: rangeWithSameKey.timeInterval
          });
        }
      }
    }
  }, [timeZone]);
  
  // Handle date picker popup open
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle date picker popup close
  const handleClose = () => {
    setAnchorEl(null);
    setShowCustomRange(false);
  };

  // Handle preset range selection
  const handleRangeSelect = (range) => {
    setSelectedRange(range);
    
    // Notify parent component about date range change
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: prepareDate(range.startDate),
        endDate: prepareDate(range.endDate),
        label: range.label,
        timeInterval: range.timeInterval
      });
    }
    
    handleClose();
  };
  
  // Handle custom range selection
  const handleCustomRangeSelect = () => {
    try {
      const startDate = moment(customStartDate);
      const endDate = moment(customEndDate);
      
      if (startDate.isValid() && endDate.isValid() && !endDate.isBefore(startDate)) {
        const customRange = {
          label: 'Custom Range',
          startDate: getCorrectDate(startDate, timeZone).startOf('day'),
          endDate: getCorrectDate(endDate, timeZone).endOf('day'),
          rangeKey: 'custom',
          timeInterval: '',
        };
        
        setSelectedRange(customRange);
        
        // Notify parent component about date range change
        if (onDateRangeChange) {
          onDateRangeChange({
            startDate: prepareDate(customRange.startDate),
            endDate: prepareDate(customRange.endDate),
            label: customRange.label,
            timeInterval: customRange.timeInterval
          });
        }
        
        handleClose();
      }
    } catch (error) {
      console.error('Error setting custom date range:', error);
    }
  };
  
  // Navigate to previous period
  const handlePrevious = () => {
    if (!selectedRange) return;
    
    const { startDate, endDate, rangeKey } = selectedRange;
    let duration = endDate.diff(startDate, 'days') + 1;
    
    const newStartDate = moment(startDate).subtract(duration, 'days');
    const newEndDate = moment(endDate).subtract(duration, 'days');
    
    const newRange = {
      ...selectedRange,
      startDate: newStartDate,
      endDate: newEndDate,
      label: `${rangeKey !== 'custom' ? selectedRange.label : 'Custom'} (Previous)`,
    };
    
    setSelectedRange(newRange);
    
    // Notify parent component about date range change
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: prepareDate(newRange.startDate),
        endDate: prepareDate(newRange.endDate),
        label: newRange.label,
        timeInterval: newRange.timeInterval
      });
    }
  };
  
  // Navigate to next period
  const handleNext = () => {
    if (!selectedRange) return;
    
    const { startDate, endDate, rangeKey } = selectedRange;
    let duration = endDate.diff(startDate, 'days') + 1;
    
    const newStartDate = moment(startDate).add(duration, 'days');
    const newEndDate = moment(endDate).add(duration, 'days');
    
    // Don't allow going into the future
    if (newEndDate.isAfter(moment())) {
      return;
    }
    
    const newRange = {
      ...selectedRange,
      startDate: newStartDate,
      endDate: newEndDate,
      label: `${rangeKey !== 'custom' ? selectedRange.label : 'Custom'} (Next)`,
    };
    
    setSelectedRange(newRange);
    
    // Notify parent component about date range change
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: prepareDate(newRange.startDate),
        endDate: prepareDate(newRange.endDate),
        label: newRange.label,
        timeInterval: newRange.timeInterval
      });
    }
  };
  
  // Swap start and end dates
  const handleSwapDates = () => {
    if (!selectedRange) return;
    
    const newRange = {
      ...selectedRange,
      startDate: selectedRange.endDate,
      endDate: selectedRange.startDate,
      label: `${selectedRange.label} (Swapped)`,
    };
    
    if (newRange.startDate.isAfter(newRange.endDate)) {
      const temp = newRange.startDate;
      newRange.startDate = newRange.endDate;
      newRange.endDate = temp;
    }
    
    setSelectedRange(newRange);
    
    // Notify parent component about date range change
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: prepareDate(newRange.startDate),
        endDate: prepareDate(newRange.endDate),
        label: newRange.label,
        timeInterval: newRange.timeInterval
      });
    }
  };
  
  // Timezone change handler
  const handleTimezoneChange = (event) => {
    setTimeZone(event.target.value);
  };
  
  // Toggle custom range input visibility
  const toggleCustomRange = () => {
    setShowCustomRange(!showCustomRange);
    if (!showCustomRange) {
      setCustomStartDate(prepareDate(moment().subtract(6, 'days')));
      setCustomEndDate(prepareDate(moment()));
    }
  };
  
  const open = Boolean(anchorEl);
  const id = open ? 'date-range-popover' : undefined;
  
  return (
    <Box className="max-w-full p-4 bg-white font-sans text-gray-800">
      <Box className="flex space-x-2 mb-6 flex-wrap">
        <Button
          variant="outlined"
          className="flex items-center w-48 justify-start"
          sx={{ borderColor: "#d1d5db", textTransform: "none", height: 40 }}
          onClick={handleClick}
        >
          <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <Typography variant="caption" color="text.secondary" sx={{ userSelect: "none" }}>
              {selectedRange ? `${prepareDate(selectedRange.startDate)} - ${prepareDate(selectedRange.endDate)}` : 'Select date range'}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "400" }}>
              {selectedRange ? selectedRange.label : 'Today'}
            </Typography>
          </Box>
          <FontAwesomeIcon
            icon={faCalendarAlt}
            style={{ marginLeft: "auto", color: "#374151", fontSize: "1.125rem" }}
          />
        </Button>
        <Button
          variant="outlined"
          sx={{ borderColor: "#d1d5db", minWidth: 40, px: 1, height: 40 }}
          aria-label="Previous"
          onClick={handlePrevious}
        >
          <FontAwesomeIcon icon={faChevronLeft} style={{ color: "#374151" }} />
        </Button>
        <Button
          variant="outlined"
          sx={{ borderColor: "#d1d5db", minWidth: 40, px: 1, height: 40 }}
          aria-label="Next"
          onClick={handleNext}
        >
          <FontAwesomeIcon icon={faChevronRight} style={{ color: "#374151" }} />
        </Button>
        <Button
          sx={{
            bgcolor: "#d1d5db",
            "&:hover": { bgcolor: "#9ca3af" },
            minWidth: 40,
            width: 40,
            height: 40,
            borderRadius: "9999px",
            ml: 2,
          }}
          aria-label="Swap Dates"
          onClick={handleSwapDates}
        >
          <FontAwesomeIcon icon={faExchangeAlt} style={{ color: "#374151" }} />
        </Button>
        <Box
          sx={{
            border: "1px solid #d1d5db",
            borderRadius: 1,
            px: 2,
            py: 1,
            width: 240,
            ml: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ userSelect: "none" }}>
            Time zone
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: "600" }}>
            {timeZone}
          </Typography>
        </Box>
      </Box>
      
      {/* Date Range Popover */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 400 }}>
          <Typography variant="h6" gutterBottom>
            Select Date Range
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="timezone-label">Timezone</InputLabel>
                <Select
                  labelId="timezone-label"
                  value={timeZone}
                  label="Timezone"
                  onChange={handleTimezoneChange}
                >
                  {timezoneOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Preset date ranges */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Preset Ranges
              </Typography>
              <Grid container spacing={1}>
                {ranges.map((range) => (
                  <Grid item xs={6} key={range.rangeKey}>
                    <Button
                      fullWidth
                      variant={selectedRange && selectedRange.rangeKey === range.rangeKey ? 'contained' : 'outlined'}
                      color="primary"
                      size="small"
                      onClick={() => handleRangeSelect(range)}
                      sx={{ justifyContent: 'left', textTransform: 'none' }}
                    >
                      {range.label}
                    </Button>
                  </Grid>
                ))}
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant={showCustomRange ? 'contained' : 'outlined'}
                    color="primary"
                    size="small"
                    onClick={toggleCustomRange}
                    sx={{ justifyContent: 'left', textTransform: 'none' }}
                  >
                    Custom Range
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            
            {/* Custom date range inputs */}
            {showCustomRange && (
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Custom Date Range
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={handleCustomRangeSelect}
                    >
                      Apply Custom Range
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Box>
      </Popover>
    </Box>
  );
};

export default DateRangePicker;