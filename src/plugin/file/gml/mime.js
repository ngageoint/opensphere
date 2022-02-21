goog.declareModuleId('plugin.file.gml.mime');

import * as mime from '../../../os/file/mime.js';
import * as xml from '../../../os/file/mime/xml.js';


/**
 * @type {string}
 */
export const TYPE = 'application/gml+xml';

mime.register(
    TYPE,
    xml.createDetect(/^(gml|featurecollection)$/i, /\/(gml|wfs)/i),
    0, xml.TYPE);
