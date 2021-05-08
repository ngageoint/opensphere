goog.module('os.ui.query.ActiveEntries');
goog.module.declareLegacyNamespace();

/**
 * @typedef {{
 *   entries: !Array<!Object<string, string|boolean>>,
 *   includes: !Array<!Object<string, string|boolean>>,
 *   excludes: !Array<!Object<string, string|boolean>>
 * }}
 */
let ActiveEntries;

exports = ActiveEntries;
