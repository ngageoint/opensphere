goog.declareModuleId('os.net.Request.STATUS_CODE_MSG');

const HttpStatusName = goog.require('goog.net.HttpStatusName');

/**
 * @type {!Object<number, string>}
 * @deprecated Please use goog.net.HttpStatusName instead.
 */
const STATUS_CODE_MSG = HttpStatusName;

export default STATUS_CODE_MSG;
