goog.declareModuleId('os.net.BaseServerModifier');

import Settings from '../config/settings.js';
import URLModifier from './urlmodifier.js';


/**
 * @param {string} server
 */
export const configure = function(server) {
  if (server) {
    var config = {};
    config[Settings.getInstance().get('baseServerRegex', '^\\/([^\\/].*)$')] = server.replace(/\/$/, '') + '/$1';
    URLModifier.configure(config);
  } else {
    URLModifier.configure();
  }
};
