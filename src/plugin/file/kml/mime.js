goog.provide('plugin.file.kml.mime');

goog.require('os.file.mime.xml');
goog.require('os.file.mime.zip');

/**
 * @const
 * @type {string}
 */
plugin.file.kml.mime.TYPE = 'application/vnd.google-earth.kml+xml';

os.file.mime.register(
    plugin.file.kml.mime.TYPE,
    os.file.mime.xml.createDetect(/^(document|folder|kml)$/i, /\/kml\//i),
    0, os.file.mime.xml.TYPE);


/**
 * @const
 * @type {string}
 */
plugin.file.kml.mime.KMZ_TYPE = 'application/vnd.google-earth.kmz';

os.file.mime.register(
    plugin.file.kml.mime.KMZ_TYPE,
    os.file.mime.zip.createDetect(/\.kml$/i),
    0, os.file.mime.zip.TYPE);
