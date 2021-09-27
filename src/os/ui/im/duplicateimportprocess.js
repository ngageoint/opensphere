goog.declareModuleId('os.ui.im.DuplicateImportProcess');

import {launchFileExists} from './fileexists.js';
import FileExistsChoice from './fileexistschoice.js';
import ImportProcess from './importprocess.js';
import {launchURLExists} from './urlexists.js';
import URLExistsChoice from './urlexistschoice.js';

const {getLogger} = goog.require('goog.log');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const ActivateDescriptor = goog.require('os.data.ActivateDescriptor');
const DataManager = goog.require('os.data.DataManager');
const FileStorage = goog.require('os.file.FileStorage');

const DBError = goog.requireType('goog.db.Error');
const Logger = goog.requireType('goog.log.Logger');
const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const OSFile = goog.requireType('os.file.File');


/**
 * Import process that detects and handles duplicate files by asking the user what to do.
 */
export default class DuplicateImportProcess extends ImportProcess {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
  }

  /**
   * @inheritDoc
   */
  fileExists() {
    if (this.file) {
      return super.fileExists() && this.urlExists();
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  urlExists() {
    if (this.file) {
      var url = this.file.getUrl();
      return !!url && this.getDescriptorByUrl(url) != null;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  onFileExists() {
    var file = /** @type {!OSFile} */ (this.file);
    launchFileExists(file, this.onDuplicateFileChoice_.bind(this));
  }

  /**
   * @inheritDoc
   */
  onUrlExists() {
    var url = /** @type {string} */ (this.file.getUrl());
    var current = this.getDescriptorByUrl(url);
    var title = /** @type {string} */ (current.getTitle());
    launchURLExists(url, title, this.onDuplicateUrlChoice_.bind(this));
  }

  /**
   * @param {FileExistsChoice} choice
   * @private
   */
  onDuplicateFileChoice_(choice) {
    var file = /** @type {!OSFile} */ (this.file);

    if (choice == FileExistsChoice.SAVE_NEW) {
      // user chose to save a new file, so find a filename that doesn't exist in storage yet
      FileStorage.getInstance().setUniqueFileName(file);
      this.importFile();
    } else if (choice == FileExistsChoice.REPLACE) {
      // user chose to replace the existing file, so persist it and reload the descriptor when finished
      FileStorage.getInstance().storeFile(file, true)
          .addCallbacks(this.onPersistComplete, this.onPersistError_, this);
    } else if (choice == FileExistsChoice.REPLACE_AND_IMPORT) {
      this.reimport();
    } else {
      this.abortImport('Unknown choice for duplicate file: ' + choice);
    }
  }

  /**
   * Handler for file persist when the user chooses to replace an existing file.
   *
   * @protected
   */
  onPersistComplete() {
    var url = /** @type {string} */ (this.file.getUrl());
    var desc = /** @type {IDataDescriptor} */ (this.getDescriptorByUrl(url));

    if (desc) {
      // refresh the descriptor to reload the file with existing configuration. don't create a command if the descriptor
      // was previously active since the final state isn't changing.
      var wasActive = desc.isActive();
      desc.setActive(false);

      var cmd = new ActivateDescriptor(desc);
      if (wasActive) {
        cmd.execute();
      } else {
        CommandProcessor.getInstance().addCommand(cmd);
      }
    }
  }

  /**
   * @param {DBError} error
   * @private
   */
  onPersistError_(error) {
    this.abortImport('Failed to store local file "' + this.file.getFileName() + '"! Cancelling import.');
  }

  /**
   * @param {URLExistsChoice} choice
   * @private
   */
  onDuplicateUrlChoice_(choice) {
    var url = /** @type {string} */ (this.file.getUrl());
    if (choice == URLExistsChoice.ACTIVATE) {
      var current = this.getDescriptorByUrl(url);
      current.setActive(true);
    } else if (choice == URLExistsChoice.REIMPORT) {
      this.reimport();
    } else if (choice == URLExistsChoice.CREATE_NEW) {
      this.importFile();
    } else {
      this.abortImport('Unknown choice for duplicate URL: ' + choice);
    }
  }

  /**
   * Launches the import dialog using the previous import configuration.
   *
   * @protected
   */
  reimport() {
    this.importFile();
  }

  /**
   * Gets a data descriptor matching the provided URL.
   *
   * @param {string} url The URL to match against
   * @return {?IDataDescriptor}
   */
  getDescriptorByUrl(url) {
    var descriptors = DataManager.getInstance().getDescriptors();
    for (var i = 0, n = descriptors.length; i < n; i++) {
      if (descriptors[i].matchesURL(url)) {
        return descriptors[i];
      }
    }

    return null;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = getLogger('os.ui.im.DuplicateImportProcess');
