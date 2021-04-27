goog.provide('os.ui.exportManager');
goog.provide('os.ui.file.ExportManager');

goog.require('goog.events.EventTarget');
goog.require('goog.events.Listenable');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.data.DataManager');
goog.require('os.ex.ExportOptions');
goog.require('os.file.File');
goog.require('os.file.FileStorage');
goog.require('os.ui.window');



/**
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.ui.file.ExportManager = function() {
  os.ui.file.ExportManager.base(this, 'constructor');

  /**
   * The export methods supported by the application
   * @type {Array.<!os.ex.IExportMethod>}
   * @private
   */
  this.exporters_ = [];

  /**
   * The persistence methods supported by the application
   * @type {Array.<!os.ex.IPersistenceMethod>}
   * @private
   */
  this.persisters_ = [];
};
goog.inherits(os.ui.file.ExportManager, goog.events.EventTarget);
goog.addSingletonGetter(os.ui.file.ExportManager);


/**
 * Global export manager reference.
 * @type {os.ui.file.ExportManager}
 */
os.ui.exportManager = os.ui.file.ExportManager.getInstance();


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.ExportManager.LOGGER_ = goog.log.getLogger('os.ui.file.ExportManager');


/**
 * Adds an export method to the manager
 *
 * @param {!(Array.<!os.ex.IExportMethod>|os.ex.IExportMethod)} method The method or array of methods
 */
os.ui.file.ExportManager.prototype.registerExportMethod = function(method) {
  if (Array.isArray(method)) {
    for (var i = 0, n = method.length; i < n; i++) {
      this.registerExportMethod(method[i]);
    }
  } else if (this.exporters_.indexOf(method) == -1) {
    this.exporters_.push(method);
    this.exporters_.sort(os.ui.file.ExportManager.sortByLabel_);
  } else {
    goog.log.fine(os.ui.file.ExportManager.LOGGER_,
        'Attempted adding duplicate export method: ' + method.getLabel());
  }
};


/**
 * Get the export methods available to the application. Creates new instances of the methods so multiple consumers
 * don't step on one another.
 *
 * @return {!Array.<!os.ex.IExportMethod>} The methods
 */
os.ui.file.ExportManager.prototype.getExportMethods = function() {
  var methods = [];
  for (var i = 0, n = this.exporters_.length; i < n; i++) {
    methods.push(new this.exporters_[i].constructor());
  }

  return methods;
};


/**
 * Adds a persistence method to the manager
 *
 * @param {!(Array.<!os.ex.IPersistenceMethod>|os.ex.IPersistenceMethod)} method The method or array of methods
 */
os.ui.file.ExportManager.prototype.registerPersistenceMethod = function(method) {
  if (Array.isArray(method)) {
    for (var i = 0, n = method.length; i < n; i++) {
      this.registerPersistenceMethod(method[i]);
    }
  } else if (this.persisters_.indexOf(method) == -1) {
    this.persisters_.push(method);
    this.persisters_.sort(os.ui.file.ExportManager.sortByLabel_);
  } else {
    goog.log.fine(os.ui.file.ExportManager.LOGGER_, 'Attempted adding duplicate persistence method: ' +
        method.getLabel());
  }
};


/**
 * Get the supported persistence methods available to the application.
 *
 * @param {boolean=} opt_getAll Whether to get all methods, whether supported or not
 * @return {!Array.<!os.ex.IPersistenceMethod>} The methods
 */
os.ui.file.ExportManager.prototype.getPersistenceMethods = function(opt_getAll) {
  var methods = [];
  var enabledMethods = /** @type {Object<string, boolean>} */ (os.settings.get('ex.enabledPersisters', {}));

  for (var i = 0, n = this.persisters_.length; i < n; i++) {
    var p = this.persisters_[i];
    // return the method only if it is supported and not explicitly disabled in the map (or all are request)
    if (p.isSupported() && enabledMethods[p.getLabel()] !== false || opt_getAll) {
      methods.push(new p.constructor());
    }
  }

  return methods;
};


/**
 * Launches a dialog to export items from the application
 *
 * @param {os.ex.ExportOptions} options The export options.
 */
os.ui.file.ExportManager.prototype.exportItems = function(options) {
  if (options.items == null || options.items.length == 0) {
    goog.log.error(os.ui.file.ExportManager.LOGGER_, 'No data was supplied for the export.');
    return;
  }

  if (options.exporter != null) {
    this.doExport_(options);
  } else if (this.exporters_.length > 0 && this.persisters_.length > 0) {
    this.launchExportDialog_(options);
  } else if (this.exporters_.length == 0) {
    goog.log.error(os.ui.file.ExportManager.LOGGER_,
        'There are no export methods defined. Can not export "' + options.title + '".');
  } else if (this.persisters_.length == 0) {
    goog.log.error(os.ui.file.ExportManager.LOGGER_,
        'There are no persistence methods defined. Can not export "' + options.title + '".');
  }
};


/**
 * Exports the data.
 *
 * @param {os.ex.ExportOptions} options The export options.
 * @private
 *
 * @suppress {checkTypes}
 */
os.ui.file.ExportManager.prototype.doExport_ = function(options) {
  const exporter = options.exporter;
  exporter.setItems(options.items);
  exporter.setFields(options.fields);
  exporter.setName(options.title || 'New Export');

  try {
    if (exporter.isAsync()) {
      // this typecast is entirely to make the compiler happy
      var et = /** @type {goog.events.EventTarget} */ (exporter);
      et.listen(os.events.EventType.COMPLETE, this.onExportComplete_.bind(this, options), false, this);
      et.listen(os.events.EventType.ERROR, this.onExportError_, false, this);

      exporter.process();
    } else {
      exporter.process();
      this.onExportComplete_(options);
    }
  } catch (e) {
    var msg = 'Failed exporting "' + options.title + '" to ' + exporter.getLabel() + ': ' + e.message;
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR, os.ui.file.ExportManager.LOGGER_);
    exporter.dispose();
  }
};


/**
 * Finishes the export when the exporter output is ready.
 *
 * @param {os.ex.ExportOptions} options The export options.
 * @param {goog.events.Event=} opt_event The complete event
 * @private
 */
os.ui.file.ExportManager.prototype.onExportComplete_ = async function(options, opt_event) {
  const exporter = options.exporter;
  var result = exporter.getOutput();
  var name = exporter.getName();
  exporter.dispose();

  if (result && name) {
    if (!options.keepTitle) {
      // append the extension if it hasn't been already
      var extension = '.' + exporter.getExtension();
      if (!goog.string.endsWith(name, extension) && extension.length > 1) {
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

        const file = new os.file.File();
        file.setFileName(name);
        file.setUrl(os.file.getLocalUrl(name));
        file.setContent(result);
        file.setContentType(exporter.getMimeType());

        const fs = os.file.FileStorage.getInstance();

        if (!options.keepTitle) {
          // ensure we don't have a name collision
          // when true, we are overriding the file in storage, so don't set a unique name
          fs.setUniqueFileName(file);
        }

        // always replace. if we got here the application should have done duplicate file detection already.
        fs.storeFile(file, true).addCallbacks(this.onFileSuccess_.bind(this, file, options), this.onFileError_, this);
      } catch (e) {
        goog.log.error(this.log, 'Error exporting file to storage. Details: ' + e.message, e);
      }
    }
  } else {
    var msg = `Failed exporting "${name}" to ${exporter.getLabel()}. Exporter result was empty.`;
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR, os.ui.file.ExportManager.LOGGER_);
  }
};


/**
 * Handle exporter error.
 *
 * @param {goog.events.Event} event The event
 * @private
 */
os.ui.file.ExportManager.prototype.onExportError_ = function(event) {
  // just do clean up - the exporter will handle reporting the error to the user/log
  goog.dispose(event.target);
};


/**
 * Handler for file storage success.
 * @param {!os.file.File} file The file to store.
 * @param {os.ex.ExportOptions} options The export options.
 * @private
 */
os.ui.file.ExportManager.prototype.onFileSuccess_ = function(file, options) {
  if (options.createDescriptor) {
    const dm = os.data.DataManager.getInstance();
    const descriptors = dm.getDescriptors();
    const url = file.getUrl() || '';
    let descriptor = null;

    if (url) {
      descriptor = descriptors.find((d) => d.matchesURL(url));
      options['descriptor'] = descriptor;
    }

    options['defaultImport'] = true;

    const importUI = os.ui.im.ImportManager.getInstance().getImportUI(options.exporter.getMimeType());

    if (importUI) {
      importUI.launchUI(file, options);
    } else {
      goog.log.error(this.log, 'Failed to find import method for exported file.');
    }
  }
};


/**
 * Handler for file storage error.
 * @param {*} error
 * @private
 */
os.ui.file.ExportManager.prototype.onFileError_ = function(error) {
  let msg = 'Unable to store state file locally.';
  if (typeof error === 'string') {
    msg += ' Error: ' + error;
  }

  goog.log.error(this.log, msg);
};


/**
 * Launches a dialog that allows the user to choose which export/persistence method to use. If the persister/exporter
 * is provided, the picker will not be present on the export dialog.
 *
 * @param {os.ex.ExportOptions} options The export options.
 * @private
 */
os.ui.file.ExportManager.prototype.launchExportDialog_ = function(options) {
  if (options.items && options.items.length > 0) {
    var windowId = 'exportDialog';
    if (os.ui.window.exists(windowId)) {
      os.ui.window.bringToFront(windowId);
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
      os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
    }
  }
};


/**
 * Sorts exporters/persisters by label.
 *
 * @param {!(os.ex.IExportMethod|os.ex.IPersistenceMethod)} a
 * @param {!(os.ex.IExportMethod|os.ex.IPersistenceMethod)} b
 * @return {number}
 * @private
 */
os.ui.file.ExportManager.sortByLabel_ = function(a, b) {
  return goog.array.defaultCompare(a.getLabel(), b.getLabel());
};
