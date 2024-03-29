goog.declareModuleId('plugin.file.gml.mime');

import * as xml from '../../../os/file/mime/xml.js';
import * as mime from '../../../os/file/mime.js';


/**
 * @type {string}
 */
export const TYPE = 'application/gml+xml';

mime.register(
    TYPE,
    xml.createDetect(/^(gml|featurecollection)$/i, /\/(gml|wfs)/i),
    0, xml.TYPE);
