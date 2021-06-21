goog.module('os.column.ColumnMappingManager');
goog.module.declareLegacyNamespace();

const Deferred = goog.require('goog.async.Deferred');
const Delay = goog.require('goog.async.Delay');
const log = goog.require('goog.log');
const {COLUMN_MAPPINGS_STORAGE_KEY} = goog.require('os');
const ColumnMapping = goog.require('os.column.ColumnMapping');
const ColumnMappingEventType = goog.require('os.column.ColumnMappingEventType');
const Settings = goog.require('os.config.Settings');
const CollectionManager = goog.require('os.data.CollectionManager');

const ColumnMappingEvent = goog.requireType('os.column.ColumnMappingEvent');
const IColumnMapping = goog.requireType('os.column.IColumnMapping');


/**
 * Manages column mappings.
 *
 * @extends {CollectionManager<IColumnMapping>}
 */
class ColumnMappingManager extends CollectionManager {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {goog.log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {Object<string, string>}
     * @private
     */
    this.layerColumnMap_ = {};

    /**
     * @type {Delay}
     * @private
     */
    this.changeDelay_ = new Delay(this.onChangeDelay_, 100, this);

    this.load();
  }

  /**
   * @inheritDoc
   */
  getId(item) {
    return item.getId() || '';
  }

  /**
   * Saves the mappings.
   *
   * @return {!goog.async.Deferred}
   */
  save() {
    log.info(this.log, 'Saving column associations.');
    var mappings = this.getAll();
    var toSave = [];
    for (var i = 0, ii = mappings.length; i < ii; i++) {
      toSave.push(mappings[i].persist());
    }

    Settings.getInstance().set(COLUMN_MAPPINGS_STORAGE_KEY, toSave);
    return Deferred.succeed();
  }

  /**
   * Loads the mappings.
   *
   * @return {!goog.async.Deferred<Array<IColumnMapping>>}
   */
  load() {
    log.info(this.log, 'Loading column associations...');
    var mappings = Settings.getInstance().get(COLUMN_MAPPINGS_STORAGE_KEY);
    return Deferred.succeed(mappings).addCallback(this.onMappingsLoaded_, this);
  }

  /**
   * Parses and adds mappings loaded from storage.
   *
   * @param {Object} data
   * @return {Array<!IColumnMapping>}
   * @private
   */
  onMappingsLoaded_(data) {
    var mappings = this.parseMappings_(data);
    this.bulkAdd(mappings);
    log.info(this.log, 'Loaded ' + mappings.length + ' associations(s) from storage.');

    return mappings;
  }

  /**
   * Parses and creates a set of mappings from a persisted list.
   *
   * @param {string|Object} data
   * @return {Array<!IColumnMapping>}
   * @private
   */
  parseMappings_(data) {
    var mappings = [];

    if (data) {
      var arr = /** @type {Array} */ (typeof data === 'string' ? JSON.parse(data) : data);
      for (var i = 0, ii = arr.length; i < ii; i++) {
        var value = /** @type {!Object} */ (arr[i]);
        var cm = new ColumnMapping();
        cm.restore(value);
        mappings.push(cm);
      }
    }

    return mappings;
  }

  /**
   * Adds an array of mappings.
   *
   * @param {Array<IColumnMapping>} mappings
   */
  bulkAdd(mappings) {
    for (var i = 0, ii = mappings.length; i < ii; i++) {
      this.add(mappings[i]);
    }
  }

  /**
   * @inheritDoc
   */
  add(mapping) {
    var columns = mapping.getColumns();
    var id = mapping.getId();

    for (var i = 0, ii = columns.length; i < ii; i++) {
      this.addManagedColumn_(columns[i], id);
    }

    mapping.listen(ColumnMappingEventType.COLUMN_ADDED, this.onColumnAdded_, false, this);
    mapping.listen(ColumnMappingEventType.COLUMN_REMOVED, this.onColumnRemoved_, false, this);

    this.onChange();

    return super.add(mapping);
  }

  /**
   * @inheritDoc
   */
  remove(itemOrId) {
    var mapping = this.get(itemOrId);
    if (mapping) {
      var columns = mapping.getColumns();
      for (var i = 0, ii = columns.length; i < ii; i++) {
        this.removeManagedColumn_(columns[i]);
      }

      mapping.unlisten(ColumnMappingEventType.COLUMN_ADDED, this.onColumnAdded_, false, this);
      mapping.unlisten(ColumnMappingEventType.COLUMN_REMOVED, this.onColumnRemoved_, false, this);
    }

    this.onChange();

    return super.remove(mapping);
  }

  /**
   * Handler for when a column is added to a managed column mapping.
   *
   * @param {ColumnMappingEvent} event
   * @private
   */
  onColumnAdded_(event) {
    var mapping = /** @type {ColumnMapping} */ (event.target);
    var id = mapping.getId();
    var column = event.getColumn();
    if (column) {
      this.addManagedColumn_(column, id);
    }
  }

  /**
   * Handler for when a column is removed from a managed column mapping.
   *
   * @param {ColumnMappingEvent} event
   * @private
   */
  onColumnRemoved_(event) {
    var column = event.getColumn();
    if (column) {
      this.removeManagedColumn_(column);
    }
  }

  /**
   * Deregisters a managed column.
   *
   * @param {osx.column.ColumnModel} column
   * @param {string} id
   * @private
   */
  addManagedColumn_(column, id) {
    // register this mapping as the owner of its respective columns
    var hash = ColumnMappingManager.hashColumn(column);
    this.layerColumnMap_[hash] = id;
  }

  /**
   * Deregisters a managed column.
   *
   * @param {osx.column.ColumnModel} column
   * @private
   */
  removeManagedColumn_(column) {
    // deregister this mapping as the owner of its respective columns
    var hash = ColumnMappingManager.hashColumn(column);
    delete this.layerColumnMap_[hash];
  }

  /**
   * Takes a hashed column/layer ID and attempts to get the owner ID from the layerColumnMap_. Returns the mapping
   * that owns that column/layer pair if there is one, and null if not.
   *
   * @param {string|osx.column.ColumnModel} hashOrModel
   * @return {?IColumnMapping}
   */
  getOwnerMapping(hashOrModel) {
    var id = null;

    if (typeof hashOrModel === 'string') {
      id = this.layerColumnMap_[hashOrModel];
    } else {
      var hash = ColumnMappingManager.hashColumn(hashOrModel);
      id = this.layerColumnMap_[hash];
    }

    return this.get(id);
  }

  /**
   * Starts the change delay.
   */
  onChange() {
    this.changeDelay_.start();
  }

  /**
   * Handles change delay. Saves the mappings and fires a change event to notify external clients.
   *
   * @private
   */
  onChangeDelay_() {
    this.save();
    this.dispatchEvent(ColumnMappingEventType.MAPPINGS_CHANGE);
  }

  /**
   * Clears the mapping manager and returns the remove mappings
   *
   * @return {Array<IColumnMapping>} The removed mappings
   */
  clear() {
    var mappings = this.getAll();
    var removed = [];

    for (var i = 0, ii = mappings.length; i < ii; i++) {
      this.remove(mappings[i]);
      removed.push(mappings[i]);
    }

    return removed;
  }

  /**
   * Constructs a column hash, used to keep track of which column/layer pairs are in use.
   *
   * @param {osx.column.ColumnModel} column
   * @return {string}
   */
  static hashColumn(column) {
    return ColumnMappingManager.hashLayerColumn(column['layer'], column['column']);
  }

  /**
   * Hashes a layer name and a column name.
   *
   * @param {string} layerName
   * @param {string} columnName
   * @return {string}
   */
  static hashLayerColumn(layerName, columnName) {
    return layerName + '#' + columnName;
  }

  /**
   * Get the global instance.
   * @return {!ColumnMappingManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new ColumnMappingManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ColumnMappingManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {ColumnMappingManager|undefined}
 */
let instance;


/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.column.ColumnMappingManager');


exports = ColumnMappingManager;
