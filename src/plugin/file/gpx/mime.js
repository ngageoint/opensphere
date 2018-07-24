goog.provide('plugin.file.gpx.mime');

goog.require('os.file.mime.xml');

/**
 * @type {string}
 * @const
 */
plugin.file.gpx.mime.TYPE = 'application/vnd.gpx+xml';

os.file.mime.register(
    plugin.file.gpx.mime.TYPE,
    os.file.mime.xml.createDetect(/^gpx$/i, /\/gpx\//i),
    0, os.file.mime.xml.TYPE);
