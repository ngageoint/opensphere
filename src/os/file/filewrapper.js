goog.declareModuleId('os.file.FileWrapper');

const {default: OSFile} = goog.requireType('os.file.File');

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   valid: boolean,
 *   enabled: boolean,
 *   msg: (string|undefined),
 *   file: OSFile
 * }}
 */
let FileWrapper;

export default FileWrapper;
