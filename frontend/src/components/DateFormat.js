import moment from 'moment-timezone';

// Constants for date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATE_FORMAT_HOUR_SECONDS = 'YYYY-MM-DD HH:mm:ss';
export const DATE_FORMAT_DISPLAY = 'MMM DD, YYYY';

/**
 * DateFormatter class for handling date operations across the application
 */
class DateFormatter {
  constructor(timezone = null) {
    // Default to user's timezone if not specified
    this.timezone = timezone || moment.tz.guess();
  }

  /**
   * Sets the timezone to use for date operations
   * @param {string} timezone - Timezone identifier (e.g., 'America/New_York')
   */
  setTimezone(timezone) {
    this.timezone = timezone;
  }

  /**
   * Gets the current timezone
   * @returns {string} Current timezone
   */
  getTimezone() {
    return this.timezone;
  }

  /**
   * Format a date using the specified format
   * @param {Date|string|moment} date - The date to format
   * @param {string} format - The format to use (defaults to DATE_FORMAT)
   * @returns {string} Formatted date string
   */
  format(date, format = DATE_FORMAT) {
    if (!date) return '';
    return this.getCorrectDate(date).format(format);
  }

  /**
   * Format a date including time
   * @param {Date|string|moment} date - The date to format
   * @returns {string} Formatted date with time
   */
  formatWithTime(date) {
    if (!date) return '';
    return this.getCorrectDate(date).format(DATE_FORMAT_HOUR_SECONDS);
  }

  /**
   * Format a date for display
   * @param {Date|string|moment} date - The date to format
   * @returns {string} Formatted date for display
   */
  formatForDisplay(date) {
    if (!date) return '';
    return this.getCorrectDate(date).format(DATE_FORMAT_DISPLAY);
  }

  /**
   * Get a moment date object with correct timezone
   * @param {Date|string|moment} date - The date to process
   * @returns {moment} Moment date object with correct timezone
   */
  getCorrectDate(date) {
    const parsedDate = moment(date);
    if (this.timezone && !parsedDate.isUTC()) {
      return parsedDate.tz(this.timezone);
    }
    return parsedDate;
  }

  /**
   * Prepare a date for API requests
   * @param {Date|string|moment} date - The date to prepare
   * @returns {string} Formatted date string for API
   */
  prepareDate(date) {
    if (!date || (typeof date === 'object' && !Object.keys(date).length)) {
      return '';
    }
    return this.format(date);
  }

  /**
   * Get date for comparison (with time)
   * @param {Date|string|moment} date - The date to format
   * @returns {string} Formatted date with time for comparison
   */
  getDateForComparison(date) {
    return this.formatWithTime(date);
  }

  /**
   * Generate a date range for a specified period
   * @param {string} period - The period ('today', 'yesterday', 'this_week', etc.)
   * @returns {Object} Object with startDate and endDate
   */
  getDateRange(period) {
    switch (period) {
      case 'today':
        return {
          startDate: this.getCorrectDate(moment()).startOf('day'),
          endDate: this.getCorrectDate(moment()).endOf('day')
        };
      case 'yesterday':
        return {
          startDate: this.getCorrectDate(moment().subtract(1, 'day')).startOf('day'),
          endDate: this.getCorrectDate(moment().subtract(1, 'day')).endOf('day')
        };
      case 'this_week':
        return {
          startDate: this.getCorrectDate(moment()).startOf('isoweek'),
          endDate: this.getCorrectDate(moment()).endOf('isoweek')
        };
      case 'last_seven_days':
        return {
          startDate: this.getCorrectDate(moment().subtract(6, 'days')).startOf('day'),
          endDate: this.getCorrectDate(moment()).endOf('day')
        };
      case 'last_week':
        return {
          startDate: this.getCorrectDate(moment().subtract(1, 'week')).startOf('isoweek'),
          endDate: this.getCorrectDate(moment().subtract(1, 'week')).endOf('isoweek')
        };
      case 'this_month':
        return {
          startDate: this.getCorrectDate(moment()).startOf('month'),
          endDate: this.getCorrectDate(moment()).endOf('month')
        };
      case 'last_thirty_days':
        return {
          startDate: this.getCorrectDate(moment().subtract(29, 'days')).startOf('day'),
          endDate: this.getCorrectDate(moment()).endOf('day')
        };
      case 'last_month':
        return {
          startDate: this.getCorrectDate(moment().subtract(1, 'month')).startOf('month'),
          endDate: this.getCorrectDate(moment().subtract(1, 'month')).endOf('month')
        };
      default:
        // Default to today
        return {
          startDate: this.getCorrectDate(moment()).startOf('day'),
          endDate: this.getCorrectDate(moment()).endOf('day')
        };
    }
  }

  /**
   * Get a custom date range
   * @param {Date|string|moment} startDate - The start date
   * @param {Date|string|moment} endDate - The end date
   * @returns {Object} Object with startDate and endDate
   */
  getCustomDateRange(startDate, endDate) {
    return {
      startDate: this.getCorrectDate(startDate).startOf('day'),
      endDate: this.getCorrectDate(endDate).endOf('day')
    };
  }

  /**
   * Prepare date data for API request
   * @param {Object} dateOptions - Date options object with startDate and endDate
   * @returns {Object} Object with formatted date_from, date_to, and time_interval
   */
  prepareRequestDateData(dateOptions) {
    if (!dateOptions) return {};

    return {
      date_from: this.prepareDate(dateOptions.startDate),
      date_to: this.prepareDate(dateOptions.endDate),
      time_interval: dateOptions.timeInterval || '',
    };
  }
}

export default DateFormatter;