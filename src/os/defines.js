goog.provide('os.defines');
goog.provide('os.worker');


/**
 * @define {string} The root namespace for DB and storage keys
 */
goog.define('os.NAMESPACE', 'opensphere');


/**
 * @define {string} The path to this project
 */
goog.define('os.ROOT', '../opensphere/');


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


/**
 * @define {string} The path to os workers.
 *
 * Override this in compiled mode using --define os.worker.DIR='something/else', or to override in uncompiled mode
 * use:
 * <pre>
 *   var CLOSURE_UNCOMPILED_DEFINES = {'os.worker.DIR': 'something/else'};
 * </pre>
 *
 * Note the above must be executed prior to loading base.js.
 */
goog.define('os.worker.DIR', 'src/worker/');
