goog.declareModuleId('os.ui.im.ImportProcess');

import AnyTypeImportUI from '../file/anytypeimportui.js';
import UrlMethod from '../file/method/urlmethod.js';
import {launchFileSupport} from './filesupport.js';
import ImportEventType from './importeventtype.js';
import ImportManager from './importmanager.js';

const Deferred = goog.require('goog.async.Deferred');
const log = goog.require('goog.log');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const IUrlDescriptor = goog.require('os.data.IUrlDescriptor');
const EventType = goog.require('os.events.EventType');
const {isLocal} = goog.require('os.file');
const FileManager = goog.require('os.file.FileManager');
const FileStorage = goog.require('os.file.FileStorage');
const osImplements = goog.require('os.implements');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const OSFile = goog.requireType('os.file.File');
const IFileMethod = goog.requireType('os.file.IFileMethod');
const {default: ImportEvent} = goog.requireType('os.ui.im.ImportEvent');


/**
 * @template T
 */
export default class ImportProcess {
  /**
   * Constructor.
   * @param {ImportManager=} opt_im
   * @param {FileManager=} opt_fm
   */
  constructor(opt_im, opt_fm) {
    /**
     * @type {OSFile}
     * @protected
     */
    this.file = null;

    /**
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {IFileMethod}
     * @private
     */
    this.method_ = null;

    /**
     * @type {ImportManager}
     * @private
     */
    this.im_ = opt_im || ImportManager.getInstance();

    /**
     * @type {FileManager}
     * @private
     */
    this.fm_ = opt_fm || FileManager.getInstance();

    /**
     * If we are using a non-singleton File manager, ignore file storage
     * @type {boolean}
     * @private
     */
    this.checkFileStorage_ = opt_fm ? false : true;

    /**
     * @type {?Deferred}
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
  }

  /**
   * @return {?T} The config to pass to the UI for edit or re-import cases
   */
  getConfig() {
    return this.config_;
  }

  /**
   * @param {?T} value
   */
  setConfig(value) {
    this.config_ = value;
  }

  /**
   * Begin the import process.
   *
   * @return {!Deferred} Callback fires when file is imported; errback fires when file fails to import
   */
  begin() {
    this.deferred_ = new Deferred();

    if (this.file) {
      this.processFile();
    } else if (this.method_) {
      this.method_.loadFile({
        'manager': this.im_
      });
    }

    return this.deferred_;
  }

  /**
   * Configures the import process based on event parameters.
   *
   * @param {ImportEvent} event
   */
  setEvent(event) {
    this.file = event.file;
    this.fileSupportChecked_ = false;

    this.config_ = event.config;

    if (!this.file) {
      if (event && event.type == ImportEventType.URL) {
        this.method_ = this.createUrlMethod();

        if (event.url) {
          this.method_.setUrl(event.url);
        }
      } else {
        this.method_ = this.fm_.getFileMethod();
      }

      if (this.method_) {
        this.method_.listenOnce(EventType.COMPLETE, this.onFileReady_, false, this);
        this.method_.listenOnce(EventType.CANCEL, this.onFileCancel_, false, this);
      }
    }
  }

  /**
   * Create URL method.  May be overridden by sub-classes.
   *
   * @return {!UrlMethod}
   * @protected
   */
  createUrlMethod() {
    return new UrlMethod();
  }

  /**
   * Removes listeners and clears the file reference on the method.
   *
   * @param {boolean=} opt_dispose If the method should be disposed
   * @private
   */
  methodCleanup_(opt_dispose) {
    if (this.method_) {
      if (opt_dispose) {
        this.method_.dispose();
        this.method_ = null;
      } else {
        this.method_.unlisten(EventType.COMPLETE, this.onFileReady_, false, this);
        this.method_.unlisten(EventType.CANCEL, this.onFileCancel_, false, this);
        this.method_.clearFile();
      }
    }
  }

  /**
   * Process the loaded file.
   *
   * @protected
   */
  processFile() {
    if (this.file) {
      this.fm_.getContentType(this.file, this.onFileType.bind(this));
    }
  }

  /**
   * Handle file type available.
   *
   * @param {?string} type
   * @protected
   */
  onFileType(type) {
    if (type && this.file) {
      log.info(this.log, 'Detected file with type "' + type + '"');

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
  }

  /**
   * Cleanup and throw error if we cannot detect the file type
   */
  invalidFiletype() {
    this.abortImport('Could not determine the file type for "' + this.file.getFileName() + '".');
  }

  /**
   * Look up and launch the import UI for the provided file type.
   *
   * @param {T=} opt_config Configuration to pass to the UI for re-import cases
   * @return {null} Returning undefined results in causing errors in Deferreds
   * @protected
   */
  importFile(opt_config) {
    if (opt_config) {
      this.setConfig(opt_config);
    }

    if (this.file) {
      var type = this.file.getType();
      var ui = this.im_.getImportUI(type);
      if (ui) {
        if (this.isLocalImport() && this.checkFileStorage_ && ui.requiresStorage && !this.fileSupportChecked_ &&
            !FileStorage.getInstance().isPersistent()) {
          // notify the user that file storage is not supported and their file will be lost on refresh
          this.fileSupportChecked_ = true;
          launchFileSupport(this.file).then(this.onFileSupportSuccess_, this.onFileSupportFailure_, this);
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
        const defaultUi = this.im_.getDefaultImportUI();
        if (defaultUi) {
          defaultUi.launchUI(this.file);
        } else {
          log.error(this.log, `No import UI was registered for type "${type}". Falling back to generic import.`);
          var anyType = new AnyTypeImportUI();
          anyType.launchUI(this.file);
        }
      }
    } else {
      this.abortImport('Unable to import file!');
    }

    return null;
  }

  /**
   * Handle file support dialog success.
   *
   * @param {string=} opt_url The URL if the file was uploaded
   * @private
   */
  onFileSupportSuccess_(opt_url) {
    // if a string was provided, it's the URL to the uploaded file. update the file with the new URL.
    if (opt_url && this.file) {
      this.file.setUrl(opt_url);

      var config = this.getConfig();
      if (config && config['descriptor']) {
        var descriptor = config['descriptor'];
        if (osImplements(descriptor, IUrlDescriptor.ID)) {
          descriptor.setUrl(opt_url);
        }
      }
    }

    // continue importing the file
    this.importFile();
  }

  /**
   * Handle file support dialog failure/cancel.
   *
   * @param {*} errorMsg The failure/cancel message
   * @private
   */
  onFileSupportFailure_(errorMsg) {
    if (errorMsg === EventType.CANCEL) {
      // cancelled by user
      this.onFileCancel_();
    } else {
      // something failed, so report the error
      this.abortImport(typeof errorMsg == 'string' ? errorMsg : undefined);
    }
  }

  /**
   * Aborts the import process and alerts the user to what happened.
   *
   * @param {string=} opt_msg Optional detailed error message
   * @return {null} Returning undefined results in causing errors in Deferreds
   * @protected
   */
  abortImport(opt_msg) {
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

    log.error(this.log, msg);
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);

    if (this.deferred_) {
      this.deferred_.errback(opt_msg);
    }

    this.methodCleanup_();
    return null;
  }

  /**
   * Check if the file is being loaded locally or remotely
   *
   * @return {boolean} If file the file is being loaded locally
   * @protected
   */
  isLocalImport() {
    return isLocal(this.file);
  }

  /**
   * Handle the file being ready for import.
   *
   * @param {GoogEvent} event
   * @private
   */
  onFileReady_(event) {
    this.file = this.method_.getFile();
    this.fileSupportChecked_ = false;

    this.methodCleanup_();

    if (this.file) {
      this.processFile();
    } else {
      this.abortImport('Failed loading file!');
    }
  }

  /**
   * Handle the user canceling import from the import method.
   *
   * @param {GoogEvent=} opt_event
   * @private
   */
  onFileCancel_(opt_event) {
    log.info(this.log, 'Import cancelled by user.');
    this.methodCleanup_(true);
  }

  /**
   * Check if a local file is already loaded in the application.
   *
   * @return {boolean}
   * @protected
   */
  fileExists() {
    if (this.file && this.checkFileStorage_) {
      return FileStorage.getInstance().fileExists(this.file);
    }

    return false;
  }

  /**
   * Check if a remote file is already loaded in the application.
   *
   * @return {boolean}
   * @protected
   */
  urlExists() {
    return false;
  }

  /**
   * Alerts the user that a matching local file is already loaded in the application.
   *
   * @protected
   */
  onFileExists() {
    this.abortImport('File named "' + this.file.getFileName() + '" already exists!');
  }

  /**
   * Alerts the user that a matching remote file is already loaded in the application.
   *
   * @protected
   */
  onUrlExists() {
    this.abortImport('File with URL "' + this.file.getUrl() + '" already exists!');
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.im.ImportProcess');
