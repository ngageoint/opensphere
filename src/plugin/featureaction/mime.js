goog.provide('plugin.featureaction.mime');

goog.require('os.file.mime');
goog.require('os.file.mime.xml');

/**
 * @type {string}
 * @const
 */
plugin.featureaction.mime.TYPE = os.file.mime.xml.TYPE + '; subtype=FEATUREACTIONS';

os.file.mime.register(
    plugin.featureaction.mime.TYPE,
    os.file.mime.xml.createDetect(/^featureActions$/, /\/state\//i),
    0, os.file.mime.xml.TYPE);
