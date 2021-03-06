goog.provide('os.ui.im.ImportManager');
goog.provide('os.ui.im.ImporterConfig');

goog.require('goog.array');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.im.Importer');
goog.require('os.ui.im.IImportUI');
goog.require('os.ui.im.ImportEvent');


/**
 * @typedef {{
 *   importer: string,
 *   parser: string
 * }}
 */
os.ui.im.ImporterConfig;



/**
 * Handles importing files and urls. Each layer type can register a corresponding import
 * UI. If the loaded file has a layer type, then the UI for that layer type is launched.
 *
 * @constructor
 */
os.ui.im.ImportManager = function() {
  /**
   * The default import UI.
   * @type {os.ui.im.IImportUI}
   * @private
   */
  this.defaultImportUI_ = null;

  /**
   * Registered import UI's by type.
   * @type {Object<string, os.ui.im.IImportUI>}
   * @private
   */
  this.importUIs_ = {};

  /**
   * @type {Object<string, osx.import.ServerType>}
   * @private
   */
  this.serverTypes_ = {};

  /**
   * @type {Object<string, function(new:os.im.IImporter, ...)>}
   * @private
   */
  this.importers_ = {};

  /**
   * @type {Object<string, function(new:os.parse.IParser, ...)>}
   * @private
   */
  this.parsers_ = {};

  /**
   * @type {!Array<string>}
   * @private
   */
  this.details_ = [];

  /**
   * @type {!Array<string>}
   * @private
   */
  this.dataTypes_ = [];

  this.registerImporter(os.ui.im.ImportManager.DEFAULT_IMPORTER, os.im.Importer);
};
goog.addSingletonGetter(os.ui.im.ImportManager);


/**
 * The logger.
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.ui.im.ImportManager.LOGGER_ = goog.log.getLogger('os.ui.im.ImportManager');


/**
 * The default importer key.
 * @type {string}
 * @const
 */
os.ui.im.ImportManager.DEFAULT_IMPORTER = 'default';


/**
 * Get the default import UI.
 * @return {os.ui.im.IImportUI} The UI.
 */
os.ui.im.ImportManager.prototype.getDefaultImportUI = function() {
  return this.defaultImportUI_;
};


/**
 * Set the default import UI.
 * @param {os.ui.im.IImportUI} value The UI.
 */
os.ui.im.ImportManager.prototype.setDefaultImportUI = function(value) {
  this.defaultImportUI_ = value;
};


/**
 * Get a registered import UI.
 *
 * @param {?string} type
 * @return {os.ui.im.IImportUI}
 */
os.ui.im.ImportManager.prototype.getImportUI = function(type) {
  if (type) {
    type = type.toLowerCase();

    if (type in this.importUIs_) {
      return this.importUIs_[type];
    }
  }

  return null;
};


/**
 * Get a registered server type.
 *
 * @param {?string} type
 * @return {?osx.import.ServerType}
 */
os.ui.im.ImportManager.prototype.getServerType = function(type) {
  if (type) {
    type = type.toLowerCase();

    if (type in this.serverTypes_) {
      return this.serverTypes_[type];
    }
  }

  return null;
};


/**
 * Get all registered server types.
 *
 * @return {Object<string, osx.import.ServerType>}
 */
os.ui.im.ImportManager.prototype.getServerTypes = function() {
  return this.serverTypes_;
};


/**
 * Get all registered import details for the application.
 *
 * @return {!Array<string>}
 */
os.ui.im.ImportManager.prototype.getImportDetails = function() {
  var details = this.details_.slice();
  if (this.dataTypes_.length > 0) {
    details.unshift('Supported data formats: ' + this.dataTypes_.join(', ') + '.');
  }

  return details;
};


/**
 * Get an importer registered with the application.
 *
 * @param {string} type The importer type
 * @param {?=} opt_options Importer options
 * @return {os.im.IImporter}
 */
os.ui.im.ImportManager.prototype.getImporter = function(type, opt_options) {
  if (type) {
    type = type.toLowerCase();

    if (type in this.importers_) {
      return new this.importers_[type](opt_options);
    }
  }

  goog.log.warning(os.ui.im.ImportManager.LOGGER_, 'Unknown importer type "' + type + '", using default importer.');
  return new os.im.Importer(opt_options);
};


/**
 * Get all the importers
 *
 * @return {Array<os.ui.im.IImportUI>}
 */
os.ui.im.ImportManager.prototype.getImporters = function() {
  var importers = [];
  goog.object.forEach(this.importUIs_, function(importer) {
    importers.push(importer);
  });
  goog.array.removeDuplicates(importers, null, function(importer) {
    return importer.launchUI.toString();
  });
  return importers;
};


/**
 * Get a parser registered with the application.
 *
 * @param {string} type The parser type
 * @param {?=} opt_options Parser options
 * @return {os.parse.IParser}
 */
os.ui.im.ImportManager.prototype.getParser = function(type, opt_options) {
  if (type) {
    type = type.toLowerCase();

    if (type in this.parsers_) {
      return new this.parsers_[type](opt_options);
    }
  }

  return null;
};


/**
 * Registers detail text for an import type that will be displayed to the user in a list of supported types.
 *
 * @param {string} details The import type detail text.
 * @param {boolean=} opt_isData If this is for a data type. These will be combined when displayed to the user.
 */
os.ui.im.ImportManager.prototype.registerImportDetails = function(details, opt_isData) {
  if (opt_isData) {
    this.dataTypes_.push(details);
    this.dataTypes_.sort(goog.array.defaultCompare);
  } else {
    this.details_.push(details);
    this.details_.sort(goog.array.defaultCompare);
  }
};


/**
 * Register an import UI launcher.
 *
 * @param {string} type The import type
 * @param {os.ui.im.IImportUI} ui The import UI
 */
os.ui.im.ImportManager.prototype.registerImportUI = function(type, ui) {
  type = type.toLowerCase();

  if (type in this.importUIs_) {
    // log a warning, but allow it.
    var msg = 'The import UI "' + type + '" has already been registered with the import manager!';
    goog.log.warning(os.ui.im.ImportManager.LOGGER_, msg);
  }

  this.importUIs_[type] = ui;
};


/**
 * Register a server type.
 *
 * @param {string} type The server type
 * @param {osx.import.ServerType} options The options associated with the server type
 */
os.ui.im.ImportManager.prototype.registerServerType = function(type, options) {
  type = type.toLowerCase();

  if (type in this.serverTypes_) {
    // log a warning, but allow it.
    var msg = 'The import UI "' + type + '" has already been registered with the import manager!';
    goog.log.warning(os.ui.im.ImportManager.LOGGER_, msg);
  }

  this.serverTypes_[type] = options;
};


/**
 * Register an importer class.
 *
 * @param {string} type The importer type
 * @param {function(new:os.im.IImporter, ...?)} clazz The importer class
 */
os.ui.im.ImportManager.prototype.registerImporter = function(type, clazz) {
  type = type.toLowerCase();

  if (type in this.importers_) {
    var msg = 'The importer type "' + type + '" has already been registered with the import manager!';
    goog.log.info(os.ui.im.ImportManager.LOGGER_, msg);
  } else {
    this.importers_[type] = clazz;
  }
};


/**
 * Register an parser class.
 *
 * @param {string} type The parser type
 * @param {function(new:os.parse.IParser, ...?)} clazz The parser class
 */
os.ui.im.ImportManager.prototype.registerParser = function(type, clazz) {
  type = type.toLowerCase();

  if (type in this.parsers_) {
    var msg = 'The parser type "' + type + '" has already been registered with the import manager!';
    goog.log.info(os.ui.im.ImportManager.LOGGER_, msg);
  } else {
    this.parsers_[type] = clazz;
  }
};


/**
 * Unregister an import UI.
 *
 * @param {string} type
 * @param {os.ui.im.IImportUI=} opt_ui
 */
os.ui.im.ImportManager.prototype.unregisterImportUI = function(type, opt_ui) {
  type = type.toLowerCase();

  if (type in this.importUIs_) {
    if ((opt_ui && this.importUIs_[type] === opt_ui) || !opt_ui) {
      delete this.importUIs_[type];
    }
  }
};


/**
 * Unregister a server type.
 *
 * @param {string} type
 * @param {osx.import.ServerType} options
 */
os.ui.im.ImportManager.prototype.unregisterServerType = function(type, options) {
  type = type.toLowerCase();

  if (type in this.serverTypes_) {
    if ((options && this.serverTypes_[type] === options) || !options) {
      delete this.serverTypes_[type];
    }
  }
};
