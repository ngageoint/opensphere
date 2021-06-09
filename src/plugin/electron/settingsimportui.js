goog.declareModuleId('plugin.electron.SettingsImportUI');

const Dispatcher = goog.require('os.Dispatcher');
const FileImportUI = goog.require('os.ui.im.FileImportUI');
const {launchConfirmText} = goog.require('os.ui.window.ConfirmTextUI');
const {EventType} = goog.require('plugin.electron');


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
    if (content && fileName) {
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
        defaultValue: fileName,
        prompt: 'Please choose a label for the settings file:',
        select: true,
        windowOptions: /** @type {!osx.window.WindowOptions} */ ({
          icon: 'fas fa-cogs',
          label: 'Choose Label'
        })
      });
    }
  }
}
