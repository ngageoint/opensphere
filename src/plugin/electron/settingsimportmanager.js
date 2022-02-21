goog.declareModuleId('plugin.electron.settingsImportManager');

import * as jsonMime from '../../os/file/mime/jsonsettings';
import ImportManager from '../../os/ui/im/importmanager.js';
import SettingsImportUI from './settingsimportui';

/**
 * Reusable settings import UI for the module.
 * @type {!SettingsImportUI}
 */
const importUi = new SettingsImportUI();

/**
 * Settings file import manager.
 * @type {!ImportManager}
 */
const manager = new ImportManager();
manager.registerImportDetails('User settings files.');
manager.registerImportUI(jsonMime.TYPE, importUi);
manager.setDefaultImportUI(importUi);

export default manager;
