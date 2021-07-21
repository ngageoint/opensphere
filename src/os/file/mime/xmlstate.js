goog.module('os.file.mime.xmlstate');
goog.module.declareLegacyNamespace();

const mime = goog.require('os.file.mime');
const xml = goog.require('os.file.mime.xml');


/**
 * @type {string}
 */
const TYPE = xml.TYPE + '; subtype=STATE';

mime.register(TYPE, xml.createDetect(/^state$/i, /\/state\//i), 0, xml.TYPE);

exports = {
  TYPE
};
