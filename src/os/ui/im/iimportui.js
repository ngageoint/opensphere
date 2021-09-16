goog.module('os.ui.im.IImportUI');

const OSFile = goog.requireType('os.file.File');


/**
 * Interface for file/url import UI's.
 *
 * @interface
 * @template T
 */
class IImportUI {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * If the import UI needs to store local files.
     * @type {boolean}
     */
    this.requiresStorage;
  }

  /**
   * Title of the import ui used in the anytype import chooser
   * @return {string}
   */
  getTitle() {}

  /**
   * Launches the import UI for a given file.
   * @param {OSFile} file The file being imported by the UI
   * @param {T=} opt_config Optional import configuration
   */
  launchUI(file, opt_config) {}

  /**
   * Merges one import configuration into another.
   * @param {T} from The import configuration to merge from
   * @param {T} to The import configuration to merge to
   */
  mergeConfig(from, to) {}

  /**
   * Gets the default config for the import UI.
   * @param {OSFile} file The file being imported by the UI
   * @param {T} config The base import configuration
   * @return {!T} config The default import config for the UI.
   */
  getDefaultConfig(file, config) {}

  /**
   * Handles the default import path, skipping the UI.
   * @param {OSFile} file The file being imported by the UI
   * @param {T} config The import configuration
   */
  handleDefaultImport(file, config) {}
}

exports = IImportUI;
