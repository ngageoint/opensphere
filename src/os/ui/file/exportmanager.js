goog.module('os.ui.file.ExportManager');
goog.module.declareLegacyNamespace();

const {defaultCompare} = goog.require('goog.array');
const dispose = goog.require('goog.dispose');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const Settings = goog.require('os.config.Settings');
const DataManager = goog.require('os.data.DataManager');
const EventType = goog.require('os.events.EventType');
const {getLocalUrl} = goog.require('os.file');
const OSFile = goog.require('os.file.File');
const FileStorage = goog.require('os.file.FileStorage');
const ImportManager = goog.require('os.ui.im.ImportManager');
const osWindow = goog.require('os.ui.window');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const ExportOptions = goog.requireType('os.ex.ExportOptions');
const IExportMethod = goog.requireType('os.ex.IExportMethod');
const IPersistenceMethod = goog.requireType('os.ex.IPersistenceMethod');


/**
 */
class ExportManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The export methods supported by the application
     * @type {Array<!IExportMethod>}
     * @private
     */
    this.exporters_ = [];

    /**
     * The persistence methods supported by the application
     * @type {Array<!IPersistenceMethod>}
     * @private
     */
    this.persisters_ = [];
  }

  /**
   * Adds an export method to the manager
   *
   * @param {!(Array<!IExportMethod>|IExportMethod)} method The method or array of methods
   */
  registerExportMethod(method) {
    if (Array.isArray(method)) {
      for (var i = 0, n = method.length; i < n; i++) {
        this.registerExportMethod(method[i]);
      }
    } else if (this.exporters_.indexOf(method) == -1) {
      this.exporters_.push(method);
      this.exporters_.sort(ExportManager.sortByLabel_);
    } else {
      log.fine(logger,
          'Attempted adding duplicate export method: ' + method.getLabel());
    }
  }

  /**
   * Get the export methods available to the application. Creates new instances of the methods so multiple consumers
   * don't step on one another.
   *
   * @return {!Array<!IExportMethod>} The methods
   */
  getExportMethods() {
    var methods = [];
    for (var i = 0, n = this.exporters_.length; i < n; i++) {
      methods.push(new this.exporters_[i].constructor());
    }

    return methods;
  }

  /**
   * Adds a persistence method to the manager
   *
   * @param {!(Array<!IPersistenceMethod>|IPersistenceMethod)} method The method or array of methods
   */
  registerPersistenceMethod(method) {
    if (Array.isArray(method)) {
      for (var i = 0, n = method.length; i < n; i++) {
        this.registerPersistenceMethod(method[i]);
      }
    } else if (this.persisters_.indexOf(method) == -1) {
      this.persisters_.push(method);
      this.persisters_.sort(ExportManager.sortByLabel_);
    } else {
      log.fine(logger, 'Attempted adding duplicate persistence method: ' +
          method.getLabel());
    }
  }

  /**
   * Get the supported persistence methods available to the application.
   *
   * @param {boolean=} opt_getAll Whether to get all methods, whether supported or not
   * @return {!Array<!IPersistenceMethod>} The methods
   */
  getPersistenceMethods(opt_getAll) {
    var methods = [];
    var settings = Settings.getInstance();
    var enabledMethods = /** @type {Object<string, boolean>} */ (settings.get('ex.enabledPersisters', {}));

    for (var i = 0, n = this.persisters_.length; i < n; i++) {
      var p = this.persisters_[i];
      // return the method only if it is supported and not explicitly disabled in the map (or all are request)
      if (p.isSupported() && enabledMethods[p.getLabel()] !== false || opt_getAll) {
        methods.push(new p.constructor());
      }
    }

    return methods;
  }

  /**
   * Launches a dialog to export items from the application
   *
   * @param {ExportOptions} options The export options.
   */
  exportItems(options) {
    if (options.items == null || options.items.length == 0) {
      log.error(logger, 'No data was supplied for the export.');
      return;
    }

    if (options.exporter != null) {
      this.doExport_(options);
    } else if (this.exporters_.length > 0 && this.persisters_.length > 0) {
      this.launchExportDialog_(options);
    } else if (this.exporters_.length == 0) {
      log.error(logger,
          'There are no export methods defined. Can not export "' + options.title + '".');
    } else if (this.persisters_.length == 0) {
      log.error(logger,
          'There are no persistence methods defined. Can not export "' + options.title + '".');
    }
  }

  /**
   * Exports the data.
   *
   * @param {ExportOptions} options The export options.
   * @private
   *
   * @suppress {checkTypes}
   */
  doExport_(options) {
    const exporter = options.exporter;
    exporter.setItems(options.items);
    exporter.setFields(options.fields);
    exporter.setName(options.title || 'New Export');

    try {
      if (exporter.isAsync()) {
        // this typecast is entirely to make the compiler happy
        var et = /** @type {EventTarget} */ (exporter);
        et.listen(EventType.COMPLETE, this.onExportComplete_.bind(this, options), false, this);
        et.listen(EventType.ERROR, this.onExportError_, false, this);

        exporter.process();
      } else {
        exporter.process();
        this.onExportComplete_(options);
      }
    } catch (e) {
      var msg = 'Failed exporting "' + options.title + '" to ' + exporter.getLabel() + ': ' + e.message;
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR, logger);
      exporter.dispose();
    }
  }

  /**
   * Finishes the export when the exporter output is ready.
   *
   * @param {ExportOptions} options The export options.
   * @param {GoogEvent=} opt_event The complete event
   * @private
   */
  async onExportComplete_(options, opt_event) {
    const exporter = options.exporter;
    var result = exporter.getOutput();
    var name = exporter.getName();
    exporter.dispose();

    if (result && name) {
      if (!options.keepTitle) {
        // append the extension if it hasn't been already
        var extension = '.' + exporter.getExtension();
        if (!name.endsWith(extension) && extension.length > 1) {
          name += extension;
        }
      }

      if (options.persister) {
        options.persister.save(name, result, exporter.getMimeType());
      } else {
        try {
          if (result instanceof Blob) {
            result = await result.arrayBuffer();
          }

          const file = new OSFile();
          file.setFileName(name);
          file.setUrl(getLocalUrl(name));
          file.setContent(result);
          file.setContentType(exporter.getMimeType());

          const fs = FileStorage.getInstance();

          if (!options.keepTitle) {
            // ensure we don't have a name collision
            // when true, we are overriding the file in storage, so don't set a unique name
            fs.setUniqueFileName(file);
          }

          // always replace. if we got here the application should have done duplicate file detection already.
          fs.storeFile(file, true).addCallbacks(this.onFileSuccess_.bind(this, file, options), this.onFileError_, this);
        } catch (e) {
          log.error(logger, 'Error exporting file to storage. Details: ' + e.message, e);
        }
      }
    } else {
      var msg = `Failed exporting "${name}" to ${exporter.getLabel()}. Exporter result was empty.`;
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR, logger);
    }
  }

  /**
   * Handle exporter error.
   *
   * @param {GoogEvent} event The event
   * @private
   */
  onExportError_(event) {
    // just do clean up - the exporter will handle reporting the error to the user/log
    dispose(event.target);
  }

  /**
   * Handler for file storage success.
   * @param {!OSFile} file The file to store.
   * @param {ExportOptions} options The export options.
   * @private
   */
  onFileSuccess_(file, options) {
    if (options.createDescriptor) {
      const dm = DataManager.getInstance();
      const descriptors = dm.getDescriptors();
      const url = file.getUrl() || '';
      let descriptor = null;

      if (url) {
        descriptor = descriptors.find((d) => d.matchesURL(url));
        options['descriptor'] = descriptor;
      }

      options['defaultImport'] = true;

      const importUI = ImportManager.getInstance().getImportUI(options.exporter.getMimeType());

      if (importUI) {
        importUI.launchUI(file, options);
      } else {
        log.error(logger, 'Failed to find import method for exported file.');
      }
    }
  }

  /**
   * Handler for file storage error.
   * @param {*} error
   * @private
   */
  onFileError_(error) {
    let msg = 'Unable to store state file locally.';
    if (typeof error === 'string') {
      msg += ' Error: ' + error;
    }

    log.error(logger, msg);
  }

  /**
   * Launches a dialog that allows the user to choose which export/persistence method to use. If the persister/exporter
   * is provided, the picker will not be present on the export dialog.
   *
   * @param {ExportOptions} options The export options.
   * @private
   */
  launchExportDialog_(options) {
    if (options.items && options.items.length > 0) {
      var windowId = 'exportDialog';
      if (osWindow.exists(windowId)) {
        osWindow.bringToFront(windowId);
      } else {
        var scopeOptions = {
          'options': options,
          'exporters': this.getExportMethods(),
          'persisters': this.getPersistenceMethods()
        };

        var windowOptions = {
          'id': windowId,
          'label': 'Export: ' + options.title,
          'icon': 'fa fa-download',
          'x': 'center',
          'y': 'center',
          'width': '400',
          'min-width': '400',
          'max-width': '800',
          'height': 'auto',
          'min-height': '250',
          'max-height': '600',
          'modal': 'true',
          'show-close': 'true'
        };

        var template = '<exportdialog></exportdialog>';
        osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
      }
    }
  }

  /**
   * Sorts exporters/persisters by label.
   *
   * @param {!(IExportMethod|IPersistenceMethod)} a
   * @param {!(IExportMethod|IPersistenceMethod)} b
   * @return {number}
   * @private
   */
  static sortByLabel_(a, b) {
    return defaultCompare(a.getLabel(), b.getLabel());
  }

  /**
   * Get the global instance.
   * @return {!ExportManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new ExportManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ExportManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {ExportManager|undefined}
 */
let instance;

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.file.ExportManager');

exports = ExportManager;
