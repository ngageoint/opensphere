goog.provide('os.file.mime.columnmapping');

goog.require('os.file.mime.xml');

/**
 * @const
 * @type {string}
 */
os.file.mime.columnmapping.TYPE = os.file.mime.xml.TYPE + '; subtype=COLUMNMAPPING';

os.file.mime.register(
    os.file.mime.columnmapping.TYPE,
    os.file.mime.xml.createDetect(/^columnmappings$/i, null),
    0, os.file.mime.xml.TYPE);
