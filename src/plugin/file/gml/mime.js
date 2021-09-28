goog.declareModuleId('plugin.file.gml.mime');

const mime = goog.require('os.file.mime');

const xml = goog.require('os.file.mime.xml');


/**
 * @type {string}
 */
export const TYPE = 'application/gml+xml';

mime.register(
    TYPE,
    xml.createDetect(/^(gml|featurecollection)$/i, /\/(gml|wfs)/i),
    0, xml.TYPE);
