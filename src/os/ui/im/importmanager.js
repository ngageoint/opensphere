goog.module('os.ui.im.ImportManager');
goog.module.declareLegacyNamespace();

const {defaultCompare, removeDuplicates} = goog.require('goog.array');
const log = goog.require('goog.log');
const {forEach} = goog.require('goog.object');
const Importer = goog.require('os.im.Importer');

const Logger = goog.requireType('goog.log.Logger');
const IImporter = goog.requireType('os.im.IImporter');
const IParser = goog.requireType('os.parse.IParser');
const IImportUI = goog.requireType('os.ui.im.IImportUI');


/**
 * Handles importing files and urls. Each layer type can register a corresponding import
 * UI. If the loaded file has a layer type, then the UI for that layer type is launched.
 */
class ImportManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * The default import UI.
     * @type {IImportUI}
     * @private
     */
    this.defaultImportUI_ = null;

    /**
     * Registered import UI's by type.
     * @type {Object<string, IImportUI>}
     * @private
     */
    this.importUIs_ = {};

    /**
     * @type {Object<string, osx.import.ServerType>}
     * @private
     */
    this.serverTypes_ = {};

    /**
     * @type {Object<string, function(new:IImporter, ...)>}
     * @private
     */
    this.importers_ = {};

    /**
     * @type {Object<string, function(new:IParser, ...)>}
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

    this.registerImporter(ImportManager.DEFAULT_IMPORTER, Importer);
  }

  /**
   * Get the default import UI.
   * @return {IImportUI} The UI.
   */
  getDefaultImportUI() {
    return this.defaultImportUI_;
  }

  /**
   * Set the default import UI.
   * @param {IImportUI} value The UI.
   */
  setDefaultImportUI(value) {
    this.defaultImportUI_ = value;
  }

  /**
   * Get a registered import UI.
   *
   * @param {?string} type
   * @return {IImportUI}
   */
  getImportUI(type) {
    if (type) {
      type = type.toLowerCase();

      if (type in this.importUIs_) {
        return this.importUIs_[type];
      }
    }

    return null;
  }

  /**
   * Get a registered server type.
   *
   * @param {?string} type
   * @return {?osx.import.ServerType}
   */
  getServerType(type) {
    if (type) {
      type = type.toLowerCase();

      if (type in this.serverTypes_) {
        return this.serverTypes_[type];
      }
    }

    return null;
  }

  /**
   * Get all registered server types.
   *
   * @return {Object<string, osx.import.ServerType>}
   */
  getServerTypes() {
    return this.serverTypes_;
  }

  /**
   * Get all registered import details for the application.
   *
   * @return {!Array<string>}
   */
  getImportDetails() {
    var details = this.details_.slice();
    if (this.dataTypes_.length > 0) {
      details.unshift('Supported data formats: ' + this.dataTypes_.join(', ') + '.');
    }

    return details;
  }

  /**
   * Get an importer registered with the application.
   *
   * @param {string} type The importer type
   * @param {?=} opt_options Importer options
   * @return {IImporter}
   */
  getImporter(type, opt_options) {
    if (type) {
      type = type.toLowerCase();

      if (type in this.importers_) {
        return new this.importers_[type](opt_options);
      }
    }

    log.warning(logger, 'Unknown importer type "' + type + '", using default importer.');
    return new Importer(opt_options);
  }

  /**
   * Get all the importers
   *
   * @return {Array<IImportUI>}
   */
  getImporters() {
    var importers = [];
    forEach(this.importUIs_, function(importer) {
      importers.push(importer);
    });
    removeDuplicates(importers, null, function(importer) {
      return importer.launchUI.toString();
    });
    return importers;
  }

  /**
   * Get a parser registered with the application.
   *
   * @param {string} type The parser type
   * @param {?=} opt_options Parser options
   * @return {IParser}
   */
  getParser(type, opt_options) {
    if (type) {
      type = type.toLowerCase();

      if (type in this.parsers_) {
        return new this.parsers_[type](opt_options);
      }
    }

    return null;
  }

  /**
   * Registers detail text for an import type that will be displayed to the user in a list of supported types.
   *
   * @param {string} details The import type detail text.
   * @param {boolean=} opt_isData If this is for a data type. These will be combined when displayed to the user.
   */
  registerImportDetails(details, opt_isData) {
    if (opt_isData) {
      this.dataTypes_.push(details);
      this.dataTypes_.sort(defaultCompare);
    } else {
      this.details_.push(details);
      this.details_.sort(defaultCompare);
    }
  }

  /**
   * Register an import UI launcher.
   *
   * @param {string} type The import type
   * @param {IImportUI} ui The import UI
   */
  registerImportUI(type, ui) {
    type = type.toLowerCase();

    if (type in this.importUIs_) {
      // log a warning, but allow it.
      var msg = 'The import UI "' + type + '" has already been registered with the import manager!';
      log.warning(logger, msg);
    }

    this.importUIs_[type] = ui;
  }

  /**
   * Register a server type.
   *
   * @param {string} type The server type
   * @param {osx.import.ServerType} options The options associated with the server type
   */
  registerServerType(type, options) {
    type = type.toLowerCase();

    if (type in this.serverTypes_) {
      // log a warning, but allow it.
      var msg = 'The import UI "' + type + '" has already been registered with the import manager!';
      log.warning(logger, msg);
    }

    this.serverTypes_[type] = options;
  }

  /**
   * Register an importer class.
   *
   * @param {string} type The importer type
   * @param {function(new:IImporter, ...?)} clazz The importer class
   */
  registerImporter(type, clazz) {
    type = type.toLowerCase();

    if (type in this.importers_) {
      var msg = 'The importer type "' + type + '" has already been registered with the import manager!';
      log.info(logger, msg);
    } else {
      this.importers_[type] = clazz;
    }
  }

  /**
   * Register an parser class.
   *
   * @param {string} type The parser type
   * @param {function(new:IParser, ...?)} clazz The parser class
   */
  registerParser(type, clazz) {
    type = type.toLowerCase();

    if (type in this.parsers_) {
      var msg = 'The parser type "' + type + '" has already been registered with the import manager!';
      log.info(logger, msg);
    } else {
      this.parsers_[type] = clazz;
    }
  }

  /**
   * Unregister an import UI.
   *
   * @param {string} type
   * @param {IImportUI=} opt_ui
   */
  unregisterImportUI(type, opt_ui) {
    type = type.toLowerCase();

    if (type in this.importUIs_) {
      if ((opt_ui && this.importUIs_[type] === opt_ui) || !opt_ui) {
        delete this.importUIs_[type];
      }
    }
  }

  /**
   * Unregister a server type.
   *
   * @param {string} type
   * @param {osx.import.ServerType} options
   */
  unregisterServerType(type, options) {
    type = type.toLowerCase();

    if (type in this.serverTypes_) {
      if ((options && this.serverTypes_[type] === options) || !options) {
        delete this.serverTypes_[type];
      }
    }
  }

  /**
   * Get the global instance.
   * @return {!ImportManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new ImportManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ImportManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {ImportManager|undefined}
 */
let instance;

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.im.ImportManager');

/**
 * The default importer key.
 * @type {string}
 * @const
 */
ImportManager.DEFAULT_IMPORTER = 'default';

exports = ImportManager;
