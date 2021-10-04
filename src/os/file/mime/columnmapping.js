goog.declareModuleId('os.file.mime.columnmapping');

import * as mime from '../mime.js';
import * as xml from './xml.js';


/**
 * @type {string}
 */
export const TYPE = xml.TYPE + '; subtype=COLUMNMAPPING';

mime.register(TYPE, xml.createDetect(/^columnmappings$/i, null), 0, xml.TYPE);
