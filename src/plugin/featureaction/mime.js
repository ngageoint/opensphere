goog.declareModuleId('plugin.featureaction.mime');

const mime = goog.require('os.file.mime');
const xml = goog.require('os.file.mime.xml');


/**
 * @type {string}
 */
export const TYPE = xml.TYPE + '; subtype=FEATUREACTIONS';

mime.register(TYPE, xml.createDetect(/^featureActions$/, /\/state\//i), 0, xml.TYPE);
