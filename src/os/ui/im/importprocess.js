goog.provide('os.ui.im.ImportProcess');

goog.require('goog.async.Deferred');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.data.IUrlDescriptor');
goog.require('os.events.EventType');
goog.require('os.file');
goog.require('os.file.FileManager');
goog.require('os.file.FileStorage');
goog.require('os.storage.IDBStorage');
goog.require('os.ui.file.method.UrlMethod');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.im.ImportManager');
goog.require('os.ui.im.fileSupportDirective');
goog.require('os.ui.window');



/**
 * @constructor
 * @param {os.ui.im.ImportManager=} opt_im
 * @param {os.file.FileManager=} opt_fm
 * @template T
 */
os.ui.im.ImportProcess = function(opt_im, opt_fm) {
  /**
   * @type {os.file.File}
   * @protected
   */
  this.file = null;

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.im.ImportProcess.LOGGER_;

  /**
   * @type {os.file.IFileMethod}
   * @private
   */
  this.method_ = null;

  /**
   * @type {os.ui.im.ImportManager}
   * @private
   */
  this.im_ = opt_im || os.ui.im.ImportManager.getInstance();

  /**
   * @type {os.file.FileManager}
   * @private
   */
  this.fm_ = opt_fm || os.file.FileManager.getInstance();

  /**
   * If we are using a non-singleton File manager, ignore file storage
   * @type {boolean}
   * @private
   */
  this.checkFileStorage_ = opt_fm ? false : true;

  /**
   * @type {?goog.async.Deferred}
   * @private
   */
  this.deferred_ = null;

  /**
   * @type {?T}
   * @private
   */
  this.config_ = null;

  /**
   * If local file storage support has been checked.
   * @type {boolean}
   * @private
   */
  this.fileSupportChecked_ = false;
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.im.ImportProcess.LOGGER_ = goog.log.getLogger('os.ui.im.ImportProcess');


/**
 * @return {?T} The config to pass to the UI for edit or re-import cases
 */
os.ui.im.ImportProcess.prototype.getConfig = function() {
  return this.config_;
};


/**
 * @param {?T} value
 */
os.ui.im.ImportProcess.prototype.setConfig = function(value) {
  this.config_ = value;
};


/**
 * Begin the import process.
 * @return {!goog.async.Deferred} Callback fires when file is imported; errback fires when file fails to import
 */
os.ui.im.ImportProcess.prototype.begin = function() {
  this.deferred_ = new goog.async.Deferred();

  if (this.file) {
    this.processFile();
  } else if (this.method_) {
    this.method_.loadFile({
      'manager': this.im_
    });
  }

  return this.deferred_;
};


/**
 * Configures the import process based on event parameters.
 * @param {os.ui.im.ImportEvent} event
 */
os.ui.im.ImportProcess.prototype.setEvent = function(event) {
  this.file = event.file;
  this.fileSupportChecked_ = false;

  this.config_ = event.config;

  if (!this.file) {
    if (event && event.type == os.ui.im.ImportEventType.URL) {
      this.method_ = this.createUrlMethod();

      if (event.url) {
        this.method_.setUrl(event.url);
      }
    } else {
      this.method_ = this.fm_.getFileMethod();
    }

    if (this.method_) {
      this.method_.listenOnce(os.events.EventType.COMPLETE, this.onFileReady_, false, this);
      this.method_.listenOnce(os.events.EventType.CANCEL, this.onFileCancel_, false, this);
    }
  }
};


/**
 * Create URL method.  May be overridden by sub-classes.
 * @return {!os.file.IFileMethod}
 * @protected
 */
os.ui.im.ImportProcess.prototype.createUrlMethod = function() {
  return new os.ui.file.method.UrlMethod();
};


/**
 * Removes listeners and clears the file reference on the method.
 * @param {boolean=} opt_dispose If the method should be disposed
 * @private
 */
os.ui.im.ImportProcess.prototype.methodCleanup_ = function(opt_dispose) {
  if (this.method_) {
    if (opt_dispose) {
      this.method_.dispose();
      this.method_ = null;
    } else {
      this.method_.unlisten(os.events.EventType.COMPLETE, this.onFileReady_, false, this);
      this.method_.unlisten(os.events.EventType.CANCEL, this.onFileCancel_, false, this);
      this.method_.clearFile();
    }
  }
};


/**
 * Process the loaded file.
 * @protected
 */
os.ui.im.ImportProcess.prototype.processFile = function() {
  if (this.file) {
    this.fm_.getContentType(this.file, this.onFileType.bind(this));
  }
};


/**
 * Handle file type available.
 * @param {?string} type
 * @protected
 */
os.ui.im.ImportProcess.prototype.onFileType = function(type) {
  if (type && this.file) {
    goog.log.info(this.log, 'Detected file with type "' + type + '"');

    if (this.isLocalImport()) {
      if (this.fileExists()) {
        this.onFileExists();
      } else {
        this.importFile();
      }
    } else if (this.urlExists()) {
      this.onUrlExists();
    } else {
      this.importFile();
    }
  } else {
    this.invalidFiletype();
  }
};


/**
 * Cleanup and throw error if we cannot detect the file type
 */
os.ui.im.ImportProcess.prototype.invalidFiletype = function() {
  this.abortImport('Could not determine the file type for "' + this.file.getFileName() + '".');
};


/**
 * Look up and launch the import UI for the provided file type.
 * @param {T=} opt_config Configuration to pass to the UI for re-import cases
 * @return {null} Returning undefined results in causing errors in Deferreds
 * @protected
 */
os.ui.im.ImportProcess.prototype.importFile = function(opt_config) {
  if (opt_config) {
    this.setConfig(opt_config);
  }

  if (this.file) {
    var type = this.file.getType();
    var ui = this.im_.getImportUI(type);
    if (ui) {
      if (this.isLocalImport() && this.checkFileStorage_ && ui.requiresStorage && !this.fileSupportChecked_ &&
          !os.file.FileStorage.getInstance().isPersistent()) {
        // notify the user that file storage is not supported and their file will be lost on refresh
        this.fileSupportChecked_ = true;
        os.ui.im.launchFileSupport(this.file).then(this.onFileSupportSuccess_, this.onFileSupportFailure_, this);
        return null;
      }

      if (ui.requiresStorage && !this.file.getContent()) {
        // this indicates that we need to read the entire file into memory
        var deferred = this.file.loadContent();
        if (deferred) {
          deferred.addCallbacks(this.importFile, this.abortImport, this);
          return null;
        }
      }

      if (this.deferred_) {
        this.deferred_.callback(this.file);
      }

      try {
        ui.launchUI(this.file, this.getConfig());
      } catch (e) {
        this.invalidFiletype();
      }
    } else {
      this.abortImport('No import UI was registered for file type "' + type + '"!');
    }
  } else {
    this.abortImport('Unable to import file!');
  }

  return null;
};


/**
 * Handle file support dialog success.
 * @param {string=} opt_url The URL if the file was uploaded
 * @private
 */
os.ui.im.ImportProcess.prototype.onFileSupportSuccess_ = function(opt_url) {
  // if a string was provided, it's the URL to the uploaded file. update the file with the new URL.
  if (opt_url && this.file) {
    this.file.setUrl(opt_url);

    var config = this.getConfig();
    if (config && config['descriptor']) {
      var descriptor = config['descriptor'];
      if (os.implements(descriptor, os.data.IUrlDescriptor.ID)) {
        descriptor.setUrl(opt_url);
      }
    }
  }

  // continue importing the file
  this.importFile();
};


/**
 * Handle file support dialog failure/cancel.
 * @param {*} errorMsg The failure/cancel message
 * @private
 */
os.ui.im.ImportProcess.prototype.onFileSupportFailure_ = function(errorMsg) {
  if (errorMsg === os.events.EventType.CANCEL) {
    // cancelled by user
    this.onFileCancel_();
  } else {
    // something failed, so report the error
    this.abortImport(typeof errorMsg == 'string' ? errorMsg : undefined);
  }
};


/**
 * Aborts the import process and alerts the user to what happened.
 * @param {string=} opt_msg Optional detailed error message
 * @return {null} Returning undefined results in causing errors in Deferreds
 * @protected
 */
os.ui.im.ImportProcess.prototype.abortImport = function(opt_msg) {
  var msg = opt_msg;
  if (!msg) {
    // create a generic default message
    msg = 'Failed to import file';
    if (this.file) {
      var detail = this.file.getFileName() || this.file.getUrl();
      if (detail) {
        msg += ' "' + detail + '"';
      }
    }
    msg += '!';
  }

  goog.log.error(this.log, msg);
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);

  if (this.deferred_) {
    this.deferred_.errback(opt_msg);
  }

  this.methodCleanup_();
  return null;
};


/**
 * Check if the file is being loaded locally or remotely
 * @return {boolean} If file the file is being loaded locally
 * @protected
 */
os.ui.im.ImportProcess.prototype.isLocalImport = function() {
  return os.file.isLocal(this.file);
};


/**
 * Handle the file being ready for import.
 * @param {goog.events.Event} event
 * @private
 */
os.ui.im.ImportProcess.prototype.onFileReady_ = function(event) {
  this.file = this.method_.getFile();
  this.fileSupportChecked_ = false;

  this.methodCleanup_();

  if (this.file) {
    this.processFile();
  } else {
    this.abortImport('Failed loading file!');
  }
};


/**
 * Handle the user canceling import from the import method.
 * @param {goog.events.Event=} opt_event
 * @private
 */
os.ui.im.ImportProcess.prototype.onFileCancel_ = function(opt_event) {
  goog.log.info(this.log, 'Import cancelled by user.');
  this.methodCleanup_(true);
};


/**
 * Check if a local file is already loaded in the application.
 * @return {boolean}
 * @protected
 */
os.ui.im.ImportProcess.prototype.fileExists = function() {
  if (this.file && this.checkFileStorage_) {
    return os.file.FileStorage.getInstance().fileExists(this.file);
  }

  return false;
};


/**
 * Check if a remote file is already loaded in the application.
 * @return {boolean}
 * @protected
 */
os.ui.im.ImportProcess.prototype.urlExists = function() {
  return false;
};


/**
 * Alerts the user that a matching local file is already loaded in the application.
 * @protected
 */
os.ui.im.ImportProcess.prototype.onFileExists = function() {
  this.abortImport('File named "' + this.file.getFileName() + '" already exists!');
};


/**
 * Alerts the user that a matching remote file is already loaded in the application.
 * @protected
 */
os.ui.im.ImportProcess.prototype.onUrlExists = function() {
  this.abortImport('File with URL "' + this.file.getUrl() + '" already exists!');
};
