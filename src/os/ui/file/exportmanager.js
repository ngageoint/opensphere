goog.provide('os.ui.exportManager');
goog.provide('os.ui.file.ExportManager');
goog.require('goog.events.EventTarget');
goog.require('goog.events.Listenable');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.ex.ExportOptions');
goog.require('os.ui.file.exportDialogDirective');
goog.require('os.ui.window');
goog.require('os.ui.window.confirmDirective');



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
 * @param {!(Array.<!os.ex.IExportMethod>|os.ex.IExportMethod)} method The method or array of methods
 */
os.ui.file.ExportManager.prototype.registerExportMethod = function(method) {
  if (goog.isArray(method)) {
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
 * @param {!(Array.<!os.ex.IPersistenceMethod>|os.ex.IPersistenceMethod)} method The method or array of methods
 */
os.ui.file.ExportManager.prototype.registerPersistenceMethod = function(method) {
  if (goog.isArray(method)) {
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
 * @param {boolean=} opt_getAll Whether to get all methods, whether supported or not
 * @return {!Array.<!os.ex.IPersistenceMethod>} The methods
 */
os.ui.file.ExportManager.prototype.getPersistenceMethods = function(opt_getAll) {
  var methods = [];
  for (var i = 0, n = this.persisters_.length; i < n; i++) {
    if (this.persisters_[i].isSupported() || opt_getAll) {
      methods.push(new this.persisters_[i].constructor());
    }
  }

  return methods;
};


/**
 * Launches a dialog to export items from the application
 * @param {Array.<*>} items The items to export
 * @param {Array.<string>} fields The fields to export from each item
 * @param {string} title The title of the export source, or the file name when the methods are provided
 * @param {os.ex.IExportMethod=} opt_exporter The export method to use
 * @param {os.ex.IPersistenceMethod=} opt_persister The persistence method to use
 */
os.ui.file.ExportManager.prototype.exportItems = function(items, fields, title, opt_exporter, opt_persister) {
  if (!goog.isDefAndNotNull(items) || items.length == 0) {
    goog.log.error(os.ui.file.ExportManager.LOGGER_, 'No data was supplied for the export.');
    return;
  }

  if (goog.isDefAndNotNull(opt_exporter) && goog.isDefAndNotNull(opt_persister)) {
    this.doExport_(items, fields, title, opt_exporter, opt_persister);
  } else if (this.exporters_.length > 0 && this.persisters_.length > 0) {
    this.launchExportDialog_(items, fields, title, opt_exporter, opt_persister);
  } else if (this.exporters_.length == 0) {
    goog.log.error(os.ui.file.ExportManager.LOGGER_,
        'There are no export methods defined. Can not export "' + title + '".');
  } else if (this.persisters_.length == 0) {
    goog.log.error(os.ui.file.ExportManager.LOGGER_,
        'There are no persistence methods defined. Can not export "' + title + '".');
  }
};


/**
 * Exports the data.
 * @param {Array.<*>} items The items to export
 * @param {Array.<string>} fields The fields to export from each item
 * @param {string} title The title of the export source, or the file name when the methods are provided
 * @param {os.ex.IExportMethod} exporter The export method to use
 * @param {os.ex.IPersistenceMethod} persister The persistence method to use
 * @private
 */
os.ui.file.ExportManager.prototype.doExport_ = function(items, fields, title, exporter, persister) {
  exporter.setItems(items);
  exporter.setFields(fields);
  exporter.setName(title);

  try {
    if (exporter.isAsync()) {
      // this typecast is entirely to make the compiler happy
      var et = /** @type {goog.events.EventTarget} */ (exporter);
      et.listen(os.events.EventType.COMPLETE, goog.partial(this.onExportComplete_, exporter, persister), false, this);
      et.listen(os.events.EventType.ERROR, this.onExportError_, false, this);

      exporter.process();
    } else {
      exporter.process();
      this.onExportComplete_(exporter, persister);
    }
  } catch (e) {
    var msg = 'Failed exporting "' + title + '" to ' + exporter.getLabel() + ': ' + e.message;
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR, os.ui.file.ExportManager.LOGGER_);
    exporter.dispose();
  }
};


/**
 * Finishes the export when the exporter output is ready.
 * @param {os.ex.IExportMethod} exporter The export method
 * @param {os.ex.IPersistenceMethod} persister The persistence method
 * @param {goog.events.Event=} opt_event The complete event
 * @private
 */
os.ui.file.ExportManager.prototype.onExportComplete_ = function(exporter, persister, opt_event) {
  var result = exporter.getOutput();
  var name = exporter.getName();
  var extension = '.' + exporter.getExtension();
  exporter.dispose();

  if (result && name) {
    // append the extension if it hasn't been already
    if (!goog.string.endsWith(name, extension) && extension.length > 1) {
      name += extension;
    }

    persister.save(name, result, exporter.getMimeType());
  } else {
    var msg = 'Failed exporting "' + exporter.getName() + '" to ' + exporter.getLabel() +
        '. Exporter result was empty.';
    os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR, os.ui.file.ExportManager.LOGGER_);
  }
};


/**
 * Handle exporter error.
 * @param {goog.events.Event} event The event
 * @private
 */
os.ui.file.ExportManager.prototype.onExportError_ = function(event) {
  // just do clean up - the exporter will handle reporting the error to the user/log
  goog.dispose(event.target);
};


/**
 * Launches a dialog that allows the user to choose which export/persistence method to use. If the persister/exporter
 * is provided, the picker will not be present on the export dialog.
 * @param {Array.<*>} items The items to export
 * @param {Array.<string>} fields The fields to export from each item
 * @param {string} title The title of the export source
 * @param {os.ex.IExportMethod=} opt_exporter The export method to use
 * @param {os.ex.IPersistenceMethod=} opt_persister The persistence method to use
 * @private
 */
os.ui.file.ExportManager.prototype.launchExportDialog_ = function(items, fields, title, opt_exporter, opt_persister) {
  if (items && items.length > 0) {
    var windowId = 'exportDialog';
    if (os.ui.window.exists(windowId)) {
      os.ui.window.bringToFront(windowId);
    } else {
      var scopeOptions = {
        'options': /** @type {os.ex.ExportOptions} */ ({
          exporter: opt_exporter,
          fields: fields,
          items: items,
          persister: opt_persister,
          title: title
        }),
        'exporters': this.getExportMethods(),
        'persisters': this.getPersistenceMethods()
      };

      var windowOptions = {
        'id': windowId,
        'label': 'Export: ' + title,
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
 * @param {!(os.ex.IExportMethod|os.ex.IPersistenceMethod)} a
 * @param {!(os.ex.IExportMethod|os.ex.IPersistenceMethod)} b
 * @return {number}
 * @private
 */
os.ui.file.ExportManager.sortByLabel_ = function(a, b) {
  return goog.array.defaultCompare(a.getLabel(), b.getLabel());
};
