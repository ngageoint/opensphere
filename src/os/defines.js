goog.module('os.defines');
goog.module.declareLegacyNamespace();


/**
 * @define {string} The root namespace for DB and storage keys
 */
goog.define('os.NAMESPACE', 'opensphere');


/**
 * @define {string} The path to this project
 */
goog.define('os.ROOT', '../opensphere/');


/**
 * @define {string} The path to this project
 */
goog.define('ROOT', './');


/**
 * @define {string} The settings file
 */
goog.define('os.SETTINGS', '.build/settings-debug.json');


/**
 * @define {string} The DB name for settings storage
 */
goog.define('os.SETTINGS_DB_NAME', os.NAMESPACE + '.settings');


/**
 * @define {string} The database name used to transfer between apps
 */
goog.define('os.SHARED_FILE_DB_NAME', 'com.bitsys.db');
