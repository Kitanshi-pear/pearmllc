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

// Import the DateFormatter to ensure consistent date formatting
import DateFormatter from './DateFormat';

// Create date formatter instance
const dateFormatter = new DateFormatter();

const DateRange = ({ onDateRangeChange }) => {
  // Initialize with browser's timezone
  const [timeZone, setTimeZone] = useState(moment.tz.guess());
  
  // Predefined date ranges
  const dateRanges = [
    {
      label: 'Today',
      startDate: dateFormatter.getDateRange('today').startDate,
      endDate: dateFormatter.getDateRange('today').endDate,
      rangeKey: 'today',
      timeInterval: '',
    },
    {
      label: 'Yesterday',
      startDate: dateFormatter.getDateRange('yesterday').startDate,
      endDate: dateFormatter.getDateRange('yesterday').endDate,
      rangeKey: 'yesterday',
      timeInterval: '',
    },
    {
      label: 'This Week',
      startDate: dateFormatter.getDateRange('this_week').startDate,
      endDate: dateFormatter.getDateRange('this_week').endDate,
      rangeKey: 'this_week',
      timeInterval: '',
    },
    {
      label: 'Last 7 Days',
      startDate: dateFormatter.getDateRange('last_seven_days').startDate,
      endDate: dateFormatter.getDateRange('last_seven_days').endDate,
      rangeKey: 'last_seven_days',
      timeInterval: '',
    },
    {
      label: 'Last Week',
      startDate: dateFormatter.getDateRange('last_week').startDate,
      endDate: dateFormatter.getDateRange('last_week').endDate,
      rangeKey: 'last_week',
      timeInterval: '',
    },
    {
      label: 'This Month',
      startDate: dateFormatter.getDateRange('this_month').startDate,
      endDate: dateFormatter.getDateRange('this_month').endDate,
      rangeKey: 'this_month',
      timeInterval: '',
    },
    {
      label: 'Last 30 Days',
      startDate: dateFormatter.getDateRange('last_thirty_days').startDate,
      endDate: dateFormatter.getDateRange('last_thirty_days').endDate,
      rangeKey: 'last_thirty_days',
      timeInterval: '',
    },
    {
      label: 'Last Month',
      startDate: dateFormatter.getDateRange('last_month').startDate,
      endDate: dateFormatter.getDateRange('last_month').endDate,
      rangeKey: 'last_month',
      timeInterval: '',
    },
  ];

  const [selectedRange, setSelectedRange] = useState(dateRanges[0]); // Default to Today
  const [anchorEl, setAnchorEl] = useState(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  
  // Timezone options
  const timezoneOptions = moment.tz.names().map(tz => ({
    value: tz,
    label: tz
  }));

  // Update date ranges when timezone changes
  useEffect(() => {
    // Set the timezone in the dateFormatter
    dateFormatter.setTimezone(timeZone);
    
    // Notify parent component about initial date range selection
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: dateFormatter.prepareDate(selectedRange.startDate),
        endDate: dateFormatter.prepareDate(selectedRange.endDate),
        label: selectedRange.label,
        timeInterval: selectedRange.timeInterval
      });
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
        startDate: dateFormatter.prepareDate(range.startDate),
        endDate: dateFormatter.prepareDate(range.endDate),
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
          startDate: dateFormatter.getCorrectDate(startDate),
          endDate: dateFormatter.getCorrectDate(endDate),
          rangeKey: 'custom',
          timeInterval: '',
        };
        
        setSelectedRange(customRange);
        
        // Notify parent component about date range change
        if (onDateRangeChange) {
          onDateRangeChange({
            startDate: dateFormatter.prepareDate(customRange.startDate),
            endDate: dateFormatter.prepareDate(customRange.endDate),
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
        startDate: dateFormatter.prepareDate(newRange.startDate),
        endDate: dateFormatter.prepareDate(newRange.endDate),
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
        startDate: dateFormatter.prepareDate(newRange.startDate),
        endDate: dateFormatter.prepareDate(newRange.endDate),
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
      startDate: selectedRange.endDate.clone(),
      endDate: selectedRange.startDate.clone(),
      label: `${selectedRange.label} (Swapped)`,
    };
    
    if (newRange.startDate.isAfter(newRange.endDate)) {
      const temp = newRange.startDate.clone();
      newRange.startDate = newRange.endDate.clone();
      newRange.endDate = temp;
    }
    
    setSelectedRange(newRange);
    
    // Notify parent component about date range change
    if (onDateRangeChange) {
      onDateRangeChange({
        startDate: dateFormatter.prepareDate(newRange.startDate),
        endDate: dateFormatter.prepareDate(newRange.endDate),
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
      setCustomStartDate(dateFormatter.prepareDate(moment().subtract(6, 'days')));
      setCustomEndDate(dateFormatter.prepareDate(moment()));
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
              {selectedRange ? `${dateFormatter.formatForDisplay(selectedRange.startDate)} - ${dateFormatter.formatForDisplay(selectedRange.endDate)}` : 'Select date range'}
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
        <Button
          variant="outlined"
          className="flex items-center w-48 justify-start"
          sx={{ borderColor: "#d1d5db", textTransform: "none", height: 40 }}
          onClick={handleClick}
        >
          <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <Typography variant="caption" color="text.secondary" sx={{ userSelect: "none" }}>
              {selectedRange ? `${dateFormatter.formatForDisplay(selectedRange.startDate)} - ${dateFormatter.formatForDisplay(selectedRange.endDate)}` : 'Select date range'}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "400" }}>
              {selectedRange ? selectedRange.label : 'Today'}
            </Typography>
          </Box>
        </Button>
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
                {dateRanges.map((range) => (
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

export default DateRange;