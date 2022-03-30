goog.declareModuleId('plugin.electron.SettingsImportUI');

import AlertManager from '../../os/alert/alertmanager.js';
import * as Dispatcher from '../../os/dispatcher.js';
import {FileScheme} from '../../os/file/index.js';
import {detect} from '../../os/file/mime/jsonsettings.js';
import FileImportUI from '../../os/ui/im/fileimportui.js';
import {launchConfirm} from '../../os/ui/window/confirm.js';
import {launchConfirmText} from '../../os/ui/window/confirmtext.js';
import {EventType} from './electron.js';

/**
 * Confirm the label for a settings file.
 * @param {string} filePath The file path.
 * @param {?string} content The content.
 * @param {string=} opt_label The default label. If not provided, the file path will be used.
 */
const confirmLabel = (filePath, content, opt_label) => {
  launchConfirmText({
    confirm: (label) => {
      const file = /** @type {ElectronOS.SettingsFile} */ ({
        default: false,
        enabled: true,
        label,
        path: filePath
      });

      ElectronOS.addUserSettings(file, content).then(() => {
        Dispatcher.getInstance().dispatchEvent(EventType.UPDATE_SETTINGS);
      });
    },
    defaultValue: opt_label || filePath,
    prompt: 'Please choose a label for the settings file:',
    select: true,
    windowOptions: /** @type {!osx.window.WindowOptions} */ ({
      icon: 'fas fa-cogs',
      label: 'Choose Label',
      showClose: true
    })
  });
};


/**
 * Confirm if an existing local settings file should be replaced, or a new file saved.
 * @param {string} fileName The file name.
 * @param {?string} content The content.
 * @param {!ElectronOS.SettingsFile} existing The existing file config.
 */
const confirmReplaceLocal = (fileName, content, existing) => {
  const prompt = `The imported settings file already exists with the label "${existing.label}". Would you like to ` +
      'replace the existing file, or save as a new file?';
  launchConfirm({
    confirm: () => {
      // Replace the existing settings file.
      confirmLabel(fileName, content, existing.label);
    },
    cancel: () => {
      const newName = getUniqueSettingsFile(fileName);
      confirmLabel(newName, content);
    },
    prompt,
    yesText: 'Replace',
    yesIcon: 'fas fa-exchange-alt',
    yesButtonClass: 'btn-danger',
    noText: 'Save as New',
    noIcon: 'far fa-save',
    noButtonClass: 'btn-secondary',
    windowOptions: /** @type {!osx.window.WindowOptions} */ ({
      icon: 'fas fa-cogs',
      label: 'Settings File Already Exists',
      showClose: true
    })
  });
};


/**
 * Confirm if an existing remote settings file should be replaced.
 * @param {string} url The file URL.
 * @param {string} fileName The file name.
 * @param {!ElectronOS.SettingsFile} existing The existing file config.
 */
const confirmReplaceUrl = (url, fileName, existing) => {
  const prompt = `The imported settings file already exists with the label "${existing.label}". Would you like to ` +
      'replace the existing file?';
  launchConfirm({
    confirm: () => {
      // Replace the existing settings file.
      confirmLabel(url, null, existing.label);
    },
    prompt,
    yesText: 'Replace',
    yesIcon: 'fas fa-exchange-alt',
    yesButtonClass: 'btn-danger',
    windowOptions: /** @type {!osx.window.WindowOptions} */ ({
      icon: 'fas fa-cogs',
      label: 'Settings File Already Exists',
      showClose: true
    })
  });
};


/**
 * Get a unique settings file name.
 * @param {string} fileName The original file name.
 * @return {string} The unique name.
 */
const getUniqueSettingsFile = (fileName) => {
  const baseName = fileName.replace(/\.[^.]+$/, '');

  let i = 1;
  let newName = `${baseName}-${i}.json`;
  while (ElectronOS.getSettingsFile(newName)) {
    newName = `${baseName}-${++i}.json`;
  }

  return newName;
};


/**
 * UI to import settings files.
 */
export default class SettingsImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    file.convertContentToString();

    const content = /** @type {string} */ (file.getContent());
    const url = file.getUrl();

    // Internal settings files are prefixed with a '.', so remove those from the filename if present to avoid conflicts.
    const fileName = file.getFileName().replace(/^\.+/, '');

    if (content && url) {
      try {
        const parsed = JSON.parse(content);
        if (parsed && detect(null, file, parsed)) {
          if (url.startsWith(`${FileScheme.FILE}://`)) {
            this.importFile(fileName, content);
          } else {
            this.importUrl(url, fileName);
          }
        } else {
          this.alertInvalid();
        }
      } catch (e) {
        this.alertInvalid();
      }
    } else {
      this.alertInvalid();
    }
  }


  /**
   * Import a local settings file.
   * @param {string} fileName The file name.
   * @param {string} content The file content.
   * @protected
   */
  importFile(fileName, content) {
    if (content && fileName) {
      const existing = ElectronOS.getSettingsFile(fileName);
      if (existing) {
        confirmReplaceLocal(fileName, content, existing);
      } else {
        confirmLabel(fileName, content);
      }
    }
  }

  /**
   * Import a remote settings file.
   * @param {string} url The URL.
   * @param {string} fileName The file name.
   * @protected
   */
  importUrl(url, fileName) {
    if (url) {
      const existing = ElectronOS.getSettingsFile(url);
      if (existing) {
        confirmReplaceUrl(url, fileName, existing);
      } else {
        confirmLabel(url, null, fileName);
      }
    }
  }

  /**
   * Notify the user that the settings file was not valid.
   * @protected
   */
  alertInvalid() {
    AlertManager.getInstance().sendAlert('Imported file is not a valid settings file.');
  }
}
