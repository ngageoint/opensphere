goog.declareModuleId('os.net.HandlerType');

/**
 * Enumeration of identifiers for the different handler types.
 * @enum {string}
 */
const HandlerType = {
  LOCAL: 'local',
  SAME_DOMAIN: 'sameDomain',
  EXT_DOMAIN: 'extDomain',
  PROXY: 'proxy',
  CREDENTIALS: 'credentials'
};

export default HandlerType;
