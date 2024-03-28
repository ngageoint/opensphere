goog.declareModuleId('plugin.featureaction.mime');

import * as xml from '../../os/file/mime/xml.js';
import * as mime from '../../os/file/mime.js';


/**
 * @type {string}
 */
export const TYPE = xml.TYPE + '; subtype=FEATUREACTIONS';

mime.register(TYPE, xml.createDetect(/^featureActions$/, /\/state\//i), 0, xml.TYPE);
