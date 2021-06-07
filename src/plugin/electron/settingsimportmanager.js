goog.declareModuleId('plugin.electron.settingsImportManager');

import SettingsImportUI from './settingsimportui';
import * as jsonMime from '../../os/file/mime/jsonsettings';

const ImportManager = goog.require('os.ui.im.ImportManager');

/**
 * Settings file import manager.
 * @type {!ImportManager}
 */
const manager = new ImportManager();
manager.registerImportDetails('User settings files.');
manager.registerImportUI(jsonMime.TYPE, new SettingsImportUI());

export default manager;
