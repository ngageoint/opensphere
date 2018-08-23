goog.provide('os.column.ColumnMappingManager');

goog.require('goog.async.Delay');
goog.require('os.column.ColumnMapping');
goog.require('os.column.ColumnMappingEventType');
goog.require('os.column.IColumnMapping');
goog.require('os.data.CollectionManager');



/**
 * Manages column mappings.
 * @extends {os.data.CollectionManager<os.column.IColumnMapping>}
 * @constructor
 */
os.column.ColumnMappingManager = function() {
  os.column.ColumnMappingManager.base(this, 'constructor');

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.column.ColumnMappingManager.LOGGER_;

  /**
   * @type {Object<string, string>}
   * @private
   */
  this.layerColumnMap_ = {};

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.changeDelay_ = new goog.async.Delay(this.onChangeDelay_, 100, this);
};
goog.inherits(os.column.ColumnMappingManager, os.data.CollectionManager);
goog.addSingletonGetter(os.column.ColumnMappingManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.column.ColumnMappingManager.LOGGER_ = goog.log.getLogger('os.column.ColumnMappingManager');


/**
 * @define {string} The storage key used for column mappings.
 */
goog.define('os.COLUMN_MAPPINGS_STORAGE_KEY', 'columnMappings');


/**
 * @inheritDoc
 */
os.column.ColumnMappingManager.prototype.getId = function(item) {
  return item.getId() || '';
};


/**
 * Saves the mappings.
 * @return {!goog.async.Deferred}
 */
os.column.ColumnMappingManager.prototype.save = function() {
  goog.log.info(this.log, 'Saving column associations.');
  var mappings = this.getAll();
  var toSave = [];
  for (var i = 0, ii = mappings.length; i < ii; i++) {
    toSave.push(mappings[i].persist());
  }

  os.settings.set(os.COLUMN_MAPPINGS_STORAGE_KEY, toSave);
  return goog.async.Deferred.succeed();
};


/**
 * Loads the mappings.
 * @return {!goog.async.Deferred<Array<os.column.IColumnMapping>>}
 */
os.column.ColumnMappingManager.prototype.load = function() {
  goog.log.info(this.log, 'Loading column associations...');
  var mappings = os.settings.get(os.COLUMN_MAPPINGS_STORAGE_KEY);
  return goog.async.Deferred.succeed(mappings).addCallback(this.onMappingsLoaded_, this);
};


/**
 * Parses and adds mappings loaded from storage.
 * @param {Object} data
 * @return {Array<!os.column.IColumnMapping>}
 * @private
 */
os.column.ColumnMappingManager.prototype.onMappingsLoaded_ = function(data) {
  var mappings = this.parseMappings_(data);
  this.bulkAdd(mappings);
  goog.log.info(this.log, 'Loaded ' + mappings.length + ' associations(s) from storage.');

  return mappings;
};


/**
 * Parses and creates a set of mappings from a persisted list.
 * @param {string|Object} data
 * @return {Array<!os.column.IColumnMapping>}
 * @private
 */
os.column.ColumnMappingManager.prototype.parseMappings_ = function(data) {
  var mappings = [];

  if (data) {
    var arr = /** @type {Array} */ (typeof data === 'string' ? JSON.parse(data) : data);
    for (var i = 0, ii = arr.length; i < ii; i++) {
      var value = /** @type {!Object} */ (arr[i]);
      var cm = new os.column.ColumnMapping();
      cm.restore(value);
      mappings.push(cm);
    }
  }

  return mappings;
};


/**
 * Adds an array of mappings.
 * @param {Array<os.column.IColumnMapping>} mappings
 */
os.column.ColumnMappingManager.prototype.bulkAdd = function(mappings) {
  for (var i = 0, ii = mappings.length; i < ii; i++) {
    this.add(mappings[i]);
  }
};


/**
 * @inheritDoc
 */
os.column.ColumnMappingManager.prototype.add = function(mapping) {
  var columns = mapping.getColumns();
  var id = mapping.getId();

  for (var i = 0, ii = columns.length; i < ii; i++) {
    this.addManagedColumn_(columns[i], id);
  }

  mapping.listen(os.column.ColumnMappingEventType.COLUMN_ADDED, this.onColumnAdded_, false, this);
  mapping.listen(os.column.ColumnMappingEventType.COLUMN_REMOVED, this.onColumnRemoved_, false, this);

  this.onChange();

  return os.column.ColumnMappingManager.base(this, 'add', mapping);
};


/**
 * @inheritDoc
 */
os.column.ColumnMappingManager.prototype.remove = function(itemOrId) {
  var mapping = this.get(itemOrId);
  if (mapping) {
    var columns = mapping.getColumns();
    for (var i = 0, ii = columns.length; i < ii; i++) {
      this.removeManagedColumn_(columns[i]);
    }

    mapping.unlisten(os.column.ColumnMappingEventType.COLUMN_ADDED, this.onColumnAdded_, false, this);
    mapping.unlisten(os.column.ColumnMappingEventType.COLUMN_REMOVED, this.onColumnRemoved_, false, this);
  }

  this.onChange();

  return os.column.ColumnMappingManager.base(this, 'remove', mapping);
};


/**
 * Handler for when a column is added to a managed column mapping.
 * @param {os.column.ColumnMappingEvent} event
 * @private
 */
os.column.ColumnMappingManager.prototype.onColumnAdded_ = function(event) {
  var mapping = /** @type {os.column.ColumnMapping} */ (event.target);
  var id = mapping.getId();
  var column = event.getColumn();
  if (column) {
    this.addManagedColumn_(column, id);
  }
};


/**
 * Handler for when a column is removed from a managed column mapping.
 * @param {os.column.ColumnMappingEvent} event
 * @private
 */
os.column.ColumnMappingManager.prototype.onColumnRemoved_ = function(event) {
  var column = event.getColumn();
  if (column) {
    this.removeManagedColumn_(column);
  }
};


/**
 * Deregisters a managed column.
 * @param {os.column.ColumnModel} column
 * @param {string} id
 * @private
 */
os.column.ColumnMappingManager.prototype.addManagedColumn_ = function(column, id) {
  // register this mapping as the owner of its respective columns
  var hash = os.column.ColumnMappingManager.hashColumn(column);
  this.layerColumnMap_[hash] = id;
};


/**
 * Deregisters a managed column.
 * @param {os.column.ColumnModel} column
 * @private
 */
os.column.ColumnMappingManager.prototype.removeManagedColumn_ = function(column) {
  // deregister this mapping as the owner of its respective columns
  var hash = os.column.ColumnMappingManager.hashColumn(column);
  delete this.layerColumnMap_[hash];
};


/**
 * Takes a hashed column/layer ID and attempts to get the owner ID from the layerColumnMap_. Returns the mapping
 * that owns that column/layer pair if there is one, and null if not.
 * @param {string|os.column.ColumnModel} hashOrModel
 * @return {?os.column.IColumnMapping}
 */
os.column.ColumnMappingManager.prototype.getOwnerMapping = function(hashOrModel) {
  var id = null;

  if (typeof hashOrModel === 'string') {
    id = this.layerColumnMap_[hashOrModel];
  } else {
    var hash = os.column.ColumnMappingManager.hashColumn(hashOrModel);
    id = this.layerColumnMap_[hash];
  }

  return this.get(id);
};


/**
 * Starts the change delay.
 */
os.column.ColumnMappingManager.prototype.onChange = function() {
  this.changeDelay_.start();
};


/**
 * Handles change delay. Saves the mappings and fires a change event to notify external clients.
 * @private
 */
os.column.ColumnMappingManager.prototype.onChangeDelay_ = function() {
  this.save();
  this.dispatchEvent(os.column.ColumnMappingEventType.MAPPINGS_CHANGE);
};


/**
 * Clears the mapping manager and returns the remove mappings
 * @return {Array<os.column.IColumnMapping>} The removed mappings
 */
os.column.ColumnMappingManager.prototype.clear = function() {
  var mappings = this.getAll();
  var removed = [];

  for (var i = 0, ii = mappings.length; i < ii; i++) {
    this.remove(mappings[i]);
    removed.push(mappings[i]);
  }

  return removed;
};


/**
 * Constructs a column hash, used to keep track of which column/layer pairs are in use.
 * @param {os.column.ColumnModel} column
 * @return {string}
 */
os.column.ColumnMappingManager.hashColumn = function(column) {
  return os.column.ColumnMappingManager.hashLayerColumn(column['layer'], column['column']);
};


/**
 * Hashes a layer name and a column name.
 * @param {string} layerName
 * @param {string} columnName
 * @return {string}
 */
os.column.ColumnMappingManager.hashLayerColumn = function(layerName, columnName) {
  return layerName + '#' + columnName;
};
