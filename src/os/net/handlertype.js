goog.module('os.net.HandlerType');


/**
 * Enumeration of identifiers for the different handler types.
 * @enum {string}
 */
exports = {
  LOCAL: 'local',
  SAME_DOMAIN: 'sameDomain',
  EXT_DOMAIN: 'extDomain',
  PROXY: 'proxy',
  CREDENTIALS: 'credentials'
};
