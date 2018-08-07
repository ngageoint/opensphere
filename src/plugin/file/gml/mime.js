goog.provide('plugin.file.gml.mime');

goog.require('os.file.mime.xml');

/**
 * @type {string}
 * @const
 */
plugin.file.gml.mime.TYPE = 'application/gml+xml';

os.file.mime.register(
    plugin.file.gml.mime.TYPE,
    os.file.mime.xml.createDetect(/^(gml|featurecollection)$/i, /\/(gml|wfs)/i),
    0, os.file.mime.xml.TYPE);
