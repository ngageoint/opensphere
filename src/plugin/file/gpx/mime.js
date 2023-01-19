goog.declareModuleId('plugin.file.gpx.mime');

import * as xml from '../../../os/file/mime/xml.js';
import * as mime from '../../../os/file/mime.js';


/**
 * @type {string}
 */
export const TYPE = 'application/vnd.gpx+xml';

mime.register(
    TYPE,
    xml.createDetect(/^gpx$/i, /\/gpx\//i),
    0, xml.TYPE);
