goog.module('plugin.featureaction.mime');
goog.module.declareLegacyNamespace();

const mime = goog.require('os.file.mime');
const xml = goog.require('os.file.mime.xml');


/**
 * @type {string}
 */
const TYPE = xml.TYPE + '; subtype=FEATUREACTIONS';

mime.register(
    TYPE,
    xml.createDetect(/^featureActions$/, /\/state\//i),
    0, xml.TYPE);

exports = {
  TYPE
};
