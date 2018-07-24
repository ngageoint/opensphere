goog.provide('os.file.mime.filter');

goog.require('os.file.mime.xml');

/**
 * @const
 * @type {string}
 */
os.file.mime.filter.TYPE = os.file.mime.xml.TYPE + '; subtype=FILTER';

os.file.mime.register(
    os.file.mime.filter.TYPE,
    os.file.mime.xml.createDetect(/^filters$/i, /\/state\//i),
    0, os.file.mime.xml.TYPE);
