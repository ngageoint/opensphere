goog.declareModuleId('plugin.electron.SettingsImportUI');

const Dispatcher = goog.require('os.Dispatcher');
const FileImportUI = goog.require('os.ui.im.FileImportUI');
const {launchConfirmText} = goog.require('os.ui.window.ConfirmTextUI');
const {launchConfirm} = goog.require('os.ui.window.ConfirmUI');
const {EventType} = goog.require('plugin.electron');


/**
 * Confirm the label for a settings file.
 * @param {string} fileName The file name.
 * @param {string} content The content.
 * @param {string=} opt_label The default label.
 */
const confirmLabel = (fileName, content, opt_label) => {
  launchConfirmText({
    confirm: (label) => {
      const file = /** @type {ElectronOS.SettingsFile} */ ({
        default: false,
        enabled: true,
        label,
        path: fileName
      });

      ElectronOS.addUserSettings(file, content).then(() => {
        Dispatcher.getInstance().dispatchEvent(EventType.UPDATE_SETTINGS);
      });
    },
    defaultValue: opt_label || fileName,
    prompt: 'Please choose a label for the settings file:',
    select: true,
    windowOptions: /** @type {!osx.window.WindowOptions} */ ({
      icon: 'fas fa-cogs',
      label: 'Choose Label'
    })
  });
};


/**
 * Confirm if an existing settings file should be replaced, or a new file saved.
 * @param {string} fileName The file name.
 * @param {string} content The content.
 * @param {!ElectronOS.SettingsFile} existing The existing file config.
 */
const confirmReplace = (fileName, content, existing) => {
  const prompt = `A settings file named <strong>${fileName}</strong> already exists. Would you like to replace the ` +
      'existing file, or save as a new file?';
  launchConfirm({
    confirm: () => {
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
      label: 'Settings File Already Exists'
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
    const fileName = file.getFileName();

    // Internal settings files are prefixed with a '.', so remove those from the filename if present to avoid conflicts.
    fileName.replace(/^\.+/, '');

    if (content && fileName) {
      const existing = ElectronOS.getSettingsFile(fileName);
      if (existing) {
        confirmReplace(fileName, content, existing);
      } else {
        confirmLabel(fileName, content);
      }
    }
  }
}
