goog.module('plugin.file.gpx.mime');

const mime = goog.require('os.file.mime');

const xml = goog.require('os.file.mime.xml');


/**
 * @type {string}
 */
const TYPE = 'application/vnd.gpx+xml';

mime.register(
    TYPE,
    xml.createDetect(/^gpx$/i, /\/gpx\//i),
    0, xml.TYPE);

exports = {
  TYPE
};
