goog.module('os.defines');
goog.module.declareLegacyNamespace();

const os = goog.require('os');

/**
 * @define {string} The root namespace for DB and storage keys
 */
os.NAMESPACE = goog.define('os.NAMESPACE', 'opensphere');


/**
 * @define {string} The path to this project
 */
os.ROOT = goog.define('os.ROOT', '../opensphere/');


/**
 * @define {string} The path to this project
 */
os.APP_ROOT = goog.define('os.APP_ROOT', './');


/**
 * @define {string} The settings file
 */
os.SETTINGS = goog.define('os.SETTINGS', '.build/settings-debug.json');


/**
 * @define {string} The DB name for settings storage
 */
os.SETTINGS_DB_NAME = goog.define('os.SETTINGS_DB_NAME', os.NAMESPACE + '.settings');


/**
 * @define {string} The database name used to transfer between apps
 */
os.SHARED_FILE_DB_NAME = goog.define('os.SHARED_FILE_DB_NAME', 'com.bitsys.db');
