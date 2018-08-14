goog.provide('os.ui.im.DuplicateImportProcess');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.data.ActivateDescriptor');
goog.require('os.ui.im.FileExistsChoice');
goog.require('os.ui.im.ImportProcess');
goog.require('os.ui.im.URLExistsChoice');
goog.require('os.ui.im.fileExistsDirective');
goog.require('os.ui.im.urlExistsDirective');



/**
 * Import process that detects and handles duplicate files by asking the user what to do.
 * @extends {os.ui.im.ImportProcess}
 * @constructor
 */
os.ui.im.DuplicateImportProcess = function() {
  os.ui.im.DuplicateImportProcess.base(this, 'constructor');
  this.log = os.ui.im.DuplicateImportProcess.LOGGER_;
};
goog.inherits(os.ui.im.DuplicateImportProcess, os.ui.im.ImportProcess);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.im.DuplicateImportProcess.LOGGER_ = goog.log.getLogger('os.ui.im.DuplicateImportProcess');


/**
 * @inheritDoc
 */
os.ui.im.DuplicateImportProcess.prototype.fileExists = function() {
  if (this.file) {
    return os.ui.im.DuplicateImportProcess.base(this, 'fileExists') && this.urlExists();
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.im.DuplicateImportProcess.prototype.urlExists = function() {
  if (this.file) {
    var url = this.file.getUrl();
    return !!url && this.getDescriptorByUrl(url) != null;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.im.DuplicateImportProcess.prototype.onFileExists = function() {
  var file = /** @type {!os.file.File} */ (this.file);
  os.ui.im.launchFileExists(file, this.onDuplicateFileChoice_.bind(this));
};


/**
 * @inheritDoc
 */
os.ui.im.DuplicateImportProcess.prototype.onUrlExists = function() {
  var url = /** @type {string} */ (this.file.getUrl());
  var current = this.getDescriptorByUrl(url);
  var title = /** @type {string} */ (current.getTitle());
  os.ui.im.launchURLExists(url, title, this.onDuplicateUrlChoice_.bind(this));
};


/**
 * @param {os.ui.im.FileExistsChoice} choice
 * @private
 */
os.ui.im.DuplicateImportProcess.prototype.onDuplicateFileChoice_ = function(choice) {
  var file = /** @type {!os.file.File} */ (this.file);

  if (choice == os.ui.im.FileExistsChoice.SAVE_NEW) {
    // user chose to save a new file, so find a filename that doesn't exist in storage yet
    os.file.FileStorage.getInstance().setUniqueFileName(file);
    this.importFile();
  } else if (choice == os.ui.im.FileExistsChoice.REPLACE) {
    // user chose to replace the existing file, so persist it and reload the descriptor when finished
    os.file.FileStorage.getInstance().storeFile(file, true)
        .addCallbacks(this.onPersistComplete, this.onPersistError_, this);
  } else if (choice == os.ui.im.FileExistsChoice.REPLACE_AND_IMPORT) {
    this.reimport();
  } else {
    this.abortImport('Unknown choice for duplicate file: ' + choice);
  }
};


/**
 * Handler for file persist when the user chooses to replace an existing file.
 * @protected
 */
os.ui.im.DuplicateImportProcess.prototype.onPersistComplete = function() {
  var url = /** @type {string} */ (this.file.getUrl());
  var desc = /** @type {os.data.IDataDescriptor} */ (this.getDescriptorByUrl(url));

  if (desc) {
    // refresh the descriptor to reload the file with existing configuration. don't create a command if the descriptor
    // was previously active since the final state isn't changing.
    var wasActive = desc.isActive();
    desc.setActive(false);

    var cmd = new os.data.ActivateDescriptor(desc);
    if (wasActive) {
      cmd.execute();
    } else {
      os.commandStack.addCommand(cmd);
    }
  }
};


/**
 * @param {goog.db.Error} error
 * @private
 */
os.ui.im.DuplicateImportProcess.prototype.onPersistError_ = function(error) {
  this.abortImport('Failed to store local file "' + this.file.getFileName() + '"! Cancelling import.');
};


/**
 * @param {os.ui.im.URLExistsChoice} choice
 * @private
 */
os.ui.im.DuplicateImportProcess.prototype.onDuplicateUrlChoice_ = function(choice) {
  var url = /** @type {string} */ (this.file.getUrl());
  if (choice == os.ui.im.URLExistsChoice.ACTIVATE) {
    var current = this.getDescriptorByUrl(url);
    current.setActive(true);
  } else if (choice == os.ui.im.URLExistsChoice.REIMPORT) {
    this.reimport();
  } else if (choice == os.ui.im.URLExistsChoice.CREATE_NEW) {
    this.importFile();
  } else {
    this.abortImport('Unknown choice for duplicate URL: ' + choice);
  }
};


/**
 * Launches the import dialog using the previous import configuration.
 * @protected
 */
os.ui.im.DuplicateImportProcess.prototype.reimport = function() {
  this.importFile();
};


/**
 * Gets a data descriptor matching the provided URL.
 * @param {string} url The URL to match against
 * @return {?os.data.IDataDescriptor}
 */
os.ui.im.DuplicateImportProcess.prototype.getDescriptorByUrl = function(url) {
  var descriptors = os.dataManager.getDescriptors();
  for (var i = 0, n = descriptors.length; i < n; i++) {
    if (descriptors[i].matchesURL(url)) {
      return descriptors[i];
    }
  }

  return null;
};
