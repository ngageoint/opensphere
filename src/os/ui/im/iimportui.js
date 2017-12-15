goog.provide('os.ui.im.IImportUI');
goog.require('os.file.File');



/**
 * Interface for file/url import UI's.
 * @interface
 * @template T
 */
os.ui.im.IImportUI = function() {};


/**
 * If the import UI needs to store local files.
 * @type {boolean}
 */
os.ui.im.IImportUI.prototype.requiresStorage;


/**
 * Title of the import ui used in the anytype import chooser
 * @return {string}
 */
os.ui.im.IImportUI.prototype.getTitle;


/**
 * Launches the import UI for a given file.
 * @param {os.file.File} file The file being imported by the UI
 * @param {T=} opt_config Optional import configuration
 */
os.ui.im.IImportUI.prototype.launchUI;


/**
 * Merges one import configuration into another.
 * @param {T} from The import configuration to merge from
 * @param {T} to The import configuration to merge to
 */
os.ui.im.IImportUI.prototype.mergeConfig;
