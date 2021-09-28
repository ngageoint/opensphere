goog.declareModuleId('os.file.mime.filter');

import * as mime from '../mime.js';
import * as xml from './xml.js';


/**
 * @type {string}
 */
export const TYPE = xml.TYPE + '; subtype=FILTER';

mime.register(TYPE, xml.createDetect(/^filters$/i, /\/state\//i), 0, xml.TYPE);
