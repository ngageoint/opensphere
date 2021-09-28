goog.declareModuleId('os.config.storage.SettingsWritableStorageType');

/**
 * @enum {string}
 */
const SettingsWritableStorageType = {
  LOCAL: 'local', // local to the user's machine
  REMOTE: 'remote' // saved off to a server somewhere
};

export default SettingsWritableStorageType;
