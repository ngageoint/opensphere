goog.declareModuleId('os.file.mime.xmlstate');

import * as mime from '../mime.js';
import * as xml from './xml.js';


/**
 * @type {string}
 */
export const TYPE = xml.TYPE + '; subtype=STATE';

mime.register(TYPE, xml.createDetect(/^state$/i, /\/state\//i), 0, xml.TYPE);
