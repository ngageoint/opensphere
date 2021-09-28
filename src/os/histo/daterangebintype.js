goog.declareModuleId('os.histo.DateRangeBinType');

/**
 * Provide the bin types that are capable of binning overlapping time ranges
 * @enum {boolean}
 */
const DateRangeBinType = {
  'Hour of Day': true,
  'Hour of Week': true,
  'Hour of Month': true,
  'Hour of Year': true,
  'Day of Week': true,
  'Month of Year': true,
  'Unique': false,
  'Minute': false,
  'Hour': false,
  'Day': false,
  'Week': false,
  'Month': false,
  'Year': false
};

export default DateRangeBinType;
