goog.declareModuleId('os.ui.windowCommonOptionalElements');

/**
 * Common selectors for elements which are optionally considered for positioning application UI's.
 * Individual applicatoins may append items to this array as needed, and any positioning logic should determine
 * whether or not to use these optional elements on a case-by-case basis.
 * For example, some fixed, overlaying panels may not want to consider these elements, but other inline panels do.
 * @type {!Array<!string>}
 */
const windowCommonOptionalElements = [];

export default windowCommonOptionalElements;
