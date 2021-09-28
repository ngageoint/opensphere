goog.declareModuleId('os.ex.ExportOptions');

const {default: IExportMethod} = goog.requireType('os.ex.IExportMethod');
const {default: IPersistenceMethod} = goog.requireType('os.ex.IPersistenceMethod');


/**
 * @typedef {{
 *   allData: (Array|undefined),
 *   selectedData: (Array|undefined),
 *   activeData: (Array|undefined),
 *   additionalOptions: (boolean),
 *   exporter: (IExportMethod|undefined),
 *   fields: Array.<string>,
 *   items: Array.<*>,
 *   persister: (IPersistenceMethod|undefined),
 *   sources: (Array.<*>|undefined),
 *   title: (string|undefined),
 *   keepTitle: (boolean|undefined),
 *   createDescriptor: (boolean|undefined)
 * }}
 */
let ExportOptions;

export default ExportOptions;
