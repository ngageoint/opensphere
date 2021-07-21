goog.module('os.file.mime.filter');
goog.module.declareLegacyNamespace();

const mime = goog.require('os.file.mime');
const xml = goog.require('os.file.mime.xml');


/**
 * @type {string}
 */
const TYPE = xml.TYPE + '; subtype=FILTER';

mime.register(TYPE, xml.createDetect(/^filters$/i, /\/state\//i), 0, xml.TYPE);

exports = {
  TYPE
};
