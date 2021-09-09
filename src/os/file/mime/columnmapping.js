goog.module('os.file.mime.columnmapping');

const mime = goog.require('os.file.mime');
const xml = goog.require('os.file.mime.xml');


/**
 * @type {string}
 */
const TYPE = xml.TYPE + '; subtype=COLUMNMAPPING';

mime.register(TYPE, xml.createDetect(/^columnmappings$/i, null), 0, xml.TYPE);

exports = {
  TYPE
};
