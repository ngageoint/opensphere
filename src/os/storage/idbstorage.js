goog.provide('os.storage.IDBStorage');
goog.provide('os.storage.IDBStorage.ErrorType');

goog.require('goog.async.Deferred');
goog.require('goog.db');
goog.require('goog.db.Cursor');
goog.require('goog.db.Error');
goog.require('goog.db.IndexedDb');
goog.require('goog.db.KeyRange');
goog.require('goog.db.Transaction');
goog.require('goog.db.Transaction.TransactionMode');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.storage.AsyncStorage');



/**
 * Mechanism for storing data to IndexedDB.
 *
 * @param {string} storeName The object store name in the database
 * @param {string=} opt_dbName The database name to use
 * @param {number=} opt_version The database version
 *
 * @extends {os.storage.AsyncStorage<T>}
 * @constructor
 * @template T
 */
os.storage.IDBStorage = function(storeName, opt_dbName, opt_version) {
  os.storage.IDBStorage.base(this, 'constructor');

  /**
   * @type {?goog.db.IndexedDb}
   * @private
   */
  this.db_ = null;

  /**
   * The IndexedDB name
   * @type {string}
   * @private
   */
  this.dbName_ = opt_dbName || os.SHARED_DB_NAME;

  /**
   * The IndexedDB version
   * @type {number}
   * @private
   */
  this.dbVersion_ = opt_version != null ? opt_version : os.storage.IDBStorage.DEFAULT_VERSION_;

  /**
   * The object store name in the database
   * @type {string}
   * @private
   */
  this.storeName_ = storeName;

  /**
   * The deferred object used during initialization.
   * @type {?goog.async.Deferred}
   * @protected
   */
  this.initDeferred = null;

  /**
   * Deferred cache for error reporting.
   * @type {!Object<string, !goog.async.Deferred>}
   * @private
   */
  this.errors_ = {};

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.storage.IDBStorage.LOGGER_;
};
goog.inherits(os.storage.IDBStorage, os.storage.AsyncStorage);


/**
 * @enum {string}
 */
os.storage.IDBStorage.ErrorType = {
  UNSUPPORTED: 'idb:unsupported',
  UNKNOWN: 'idb:unknown'
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.storage.IDBStorage.LOGGER_ = goog.log.getLogger('os.storage.IDBStorage');


/**
 * The database version. This should only be incremented if the database structure changes and needs to be migrated.
 * @type {number}
 * @const
 * @private
 */
os.storage.IDBStorage.DEFAULT_VERSION_ = 1;


/**
 * Error used when IDB is not supported by the browser.
 * @type {string}
 * @const
 */
os.storage.IDBStorage.NOT_SUPPORTED =
    'Uh oh! Your browser does not support storing data with an in-browser database. To use this feature, please ' +
    'upgrade to a modern browser (we recommend Chrome 28+, FF24+, or IE10+).';


/**
 * Generic error.
 * @type {string}
 * @const
 */
os.storage.IDBStorage.UNKNOWN_ERROR = 'There has been an error accessing the in-browser database. For assistance, ' +
    'use the "Help" menu to contact support.';


/**
 * @inheritDoc
 */
os.storage.IDBStorage.prototype.disposeInternal = function() {
  os.storage.IDBStorage.base(this, 'disposeInternal');

  if (this.initDeferred) {
    this.initDeferred.cancel();
  }

  if (this.db_ && this.db_.isOpen()) {
    this.db_.close();
  }

  this.db_ = null;
};


/**
 * @inheritDoc
 */
os.storage.IDBStorage.prototype.init = function() {
  var deferred;
  if (Modernizr.indexeddb) {
    deferred = this.initDeferred = goog.db.openDatabase(this.dbName_, this.dbVersion_,
        this.onUpgradeNeeded_.bind(this),
        this.onBlocked_.bind(this))
    .addCallbacks(this.onDbReady_, this.onDbOpenError_, this);
  } else {
    deferred = new goog.async.Deferred();
    deferred.errback(this.getErrorMessage(os.storage.IDBStorage.ErrorType.UNSUPPORTED));
  }

  return deferred;
};


/**
 * Handle database successfully opening.
 * @param {goog.db.IndexedDb} db
 * @private
 */
os.storage.IDBStorage.prototype.onDbReady_ = function(db) {
  goog.log.fine(this.log, 'Successfully opened database ' + db.getName());
  this.db_ = db;
  this.initDeferred = null;
};


/**
 * Handle database open error.
 * @param {goog.db.Error} error
 * @return {goog.db.Error}
 * @private
 */
os.storage.IDBStorage.prototype.onDbOpenError_ = function(error) {
  var msg = 'Error opening database:';
  goog.log.error(this.log, msg, error);
  return error;
};


/**
 * @param {!goog.db.IndexedDb.VersionChangeEvent} event
 * @private
 */
os.storage.IDBStorage.prototype.onBlocked_ = function(event) {
  goog.log.error(this.log, 'IDB store blocked from upgrading to version ' + this.dbVersion_ + '!');
};


/**
 * Creates the object store.
 * @param {!goog.db.IndexedDb.VersionChangeEvent} event The event
 * @param {!goog.db.IndexedDb} db The IndexedDB instance
 * @param {!goog.db.Transaction} tx The transaction object
 * @private
 */
os.storage.IDBStorage.prototype.onUpgradeNeeded_ = function(event, db, tx) {
  goog.log.fine(this.log, 'Upgrading database from ' + event.oldVersion + ' to ' + event.newVersion);
  db.createObjectStore(this.storeName_);
};


/**
 * @inheritDoc
 */
os.storage.IDBStorage.prototype.get = function(key) {
  if (this.initDeferred) {
    return this.initDeferred.addCallback(goog.partial(this.getInternal_, key), this);
  }

  if (Modernizr.indexeddb) {
    return this.getInternal_(key);
  }

  return this.getErrorDeferred(os.storage.IDBStorage.ErrorType.UNSUPPORTED);
};


/**
 * Retrieves an item from the database.
 * @param {string} key Database key to retrieve.
 * @return {!goog.async.Deferred} The deferred get request.
 * @private
 */
os.storage.IDBStorage.prototype.getInternal_ = function(key) {
  if (this.db_) {
    return this.db_.createTransaction([this.storeName_],
        goog.db.Transaction.TransactionMode.READ_ONLY)
        .objectStore(this.storeName_)
        .get(key)
        .addCallback(this.deserializeItem, this);
  } else {
    return this.getErrorDeferred(os.storage.IDBStorage.ErrorType.UNSUPPORTED);
  }
};


/**
 * @inheritDoc
 */
os.storage.IDBStorage.prototype.getAll = function() {
  if (this.initDeferred) {
    return this.initDeferred.addCallback(this.getAllInternal_, this);
  }

  if (Modernizr.indexeddb) {
    return this.getAllInternal_();
  }

  return this.getErrorDeferred(os.storage.IDBStorage.ErrorType.UNSUPPORTED);
};


/**
 * Retrieves all items from the database.
 * @return {!goog.async.Deferred} The deferred get request.
 * @private
 */
os.storage.IDBStorage.prototype.getAllInternal_ = function() {
  if (this.db_) {
    return this.db_.createTransaction([this.storeName_],
        goog.db.Transaction.TransactionMode.READ_ONLY)
        .objectStore(this.storeName_)
        .getAll()
        .addCallback(this.deserializeItems, this);
  } else {
    return this.getErrorDeferred(os.storage.IDBStorage.ErrorType.UNSUPPORTED);
  }
};


/**
 * @inheritDoc
 */
os.storage.IDBStorage.prototype.set = function(key, item, opt_replace) {
  if (this.initDeferred) {
    return this.initDeferred.addCallback(goog.partial(this.setInternal_, key, item, opt_replace), this);
  }

  if (Modernizr.indexeddb) {
    return this.setInternal_(key, item, opt_replace);
  }

  return this.getErrorDeferred(os.storage.IDBStorage.ErrorType.UNSUPPORTED);
};


/**
 * Stores an item in the database.
 * @param {string} key The item key
 * @param {T} item The item to insert into the database
 * @param {boolean=} opt_replace If the item should be replaced in the store.
 * @return {!goog.async.Deferred} The deferred store request. The result will be the found item if the item
 *   already existed in the database.
 * @private
 */
os.storage.IDBStorage.prototype.setInternal_ = function(key, item, opt_replace) {
  if (this.isError()) {
    return this.getErrorDeferred(os.storage.IDBStorage.ErrorType.UNSUPPORTED);
  }

  var tx = this.db_.createTransaction([this.storeName_],
      goog.db.Transaction.TransactionMode.READ_WRITE);
  var store = tx.objectStore(this.storeName_);
  var cursor = store.openCursor(goog.db.KeyRange.bound(key, key));
  var foundItem = null;
  var listenKey = goog.events.listen(cursor, goog.db.Cursor.EventType.NEW_DATA, function() {
    if (!foundItem) {
      foundItem = this.deserializeItem(cursor.getValue());
    }
    cursor.next();
  }, false, this);

  goog.events.listenOnce(cursor, goog.db.Cursor.EventType.COMPLETE, function() {
    goog.events.unlistenByKey(listenKey);

    if (!foundItem) {
      // if the key wasn't found then store the item
      store.add(this.serializeItem(item), key)
          .addCallback(goog.partial(this.onItemAdded, key), this);
    } else if (opt_replace) {
      // replace the existing item if the flag is set
      store.put(this.serializeItem(item), key);
    }
  }, false, this);

  return tx.wait();
};


/**
 * @inheritDoc
 */
os.storage.IDBStorage.prototype.remove = function(key) {
  if (this.initDeferred) {
    return this.initDeferred.addCallback(goog.partial(this.removeInternal_, key), this);
  }

  if (Modernizr.indexeddb) {
    return this.removeInternal_(key);
  }

  return this.getErrorDeferred(os.storage.IDBStorage.ErrorType.UNSUPPORTED);
};


/**
 * Deletes an item from storage.
 * @param {string} key The key to remove
 * @return {!goog.async.Deferred} The deferred delete request.
 * @private
 */
os.storage.IDBStorage.prototype.removeInternal_ = function(key) {
  if (this.isError()) {
    return this.getErrorDeferred(os.storage.IDBStorage.ErrorType.UNKNOWN);
  }

  var tx = this.db_.createTransaction([this.storeName_], goog.db.Transaction.TransactionMode.READ_WRITE);
  tx.objectStore(this.storeName_).remove(key).addCallback(goog.partial(this.onItemRemoved, key), this);
  return tx.wait();
};


/**
 * Deserializes an item from the database.
 * @param {*} data
 * @return {T}
 *
 * @template T
 */
os.storage.IDBStorage.prototype.deserializeItem = function(data) {
  // default to assuming the data doesn't need to be changed to/from IDB
  return data;
};


/**
 * Deserializes an item from the database.
 * @param {Array<*>} data
 * @return {T}
 * @protected
 *
 * @template T
 */
os.storage.IDBStorage.prototype.deserializeItems = function(data) {
  var items = [];
  if (data && data.length > 0) {
    for (var i = 0, n = data.length; i < n; i++) {
      var item = this.deserializeItem(data[i]);
      if (item != null) {
        items.push(item);
      }
    }
  }

  return items;
};


/**
 * Serializes an item to store in the database.
 * @param {T} item
 * @return {*}
 *
 * @template T
 */
os.storage.IDBStorage.prototype.serializeItem = function(item) {
  // default to assuming the data doesn't need to be changed to/from IDB
  return item;
};


/**
 * Handle successful clear of the object store.
 * @protected
 */
os.storage.IDBStorage.prototype.onObjectStoreCleared = function() {
  goog.log.info(this.log, 'Cleared object store "' + this.storeName_ + '".');
};


/**
 * Handle successful insertion of an item into the database.
 * @param {string} key Key of the inserted item.
 * @protected
 */
os.storage.IDBStorage.prototype.onItemAdded = function(key) {
  goog.log.info(this.log, 'Added item "' + key + '" to the database.');
};


/**
 * Handle successful deletion of an item from the database.
 * @param {string} key Key of the deleted item.
 * @protected
 */
os.storage.IDBStorage.prototype.onItemRemoved = function(key) {
  goog.log.info(this.log, 'Removed item "' + key + '" from the database.');
};


/**
 * @inheritDoc
 */
os.storage.IDBStorage.prototype.clear = function() {
  if (this.initDeferred) {
    return this.initDeferred.addCallback(this.clearInternal_, this);
  }

  if (Modernizr.indexeddb) {
    return this.clearInternal_();
  }

  return this.getErrorDeferred(os.storage.IDBStorage.ErrorType.UNSUPPORTED);
};


/**
 * Clears the object store.
 * @return {!goog.async.Deferred} The deferred clear request.
 * @private
 */
os.storage.IDBStorage.prototype.clearInternal_ = function() {
  return this.db_.createTransaction([this.storeName_], goog.db.Transaction.TransactionMode.READ_WRITE)
      .objectStore(this.storeName_)
      .clear()
      .addCallback(this.onObjectStoreCleared, this);
};


/**
 * Delete the database.
 */
os.storage.IDBStorage.prototype.deleteDatabase = function() {
  if (Modernizr.indexeddb) {
    if (this.db_ && this.db_.isOpen()) {
      this.db_.close();
    }

    goog.db.deleteDatabase(this.dbName_, this.onDeleteDbBlocked_)
        .addCallbacks(this.onDeleteDb_, this.onDeleteDbFail_);
  }
};


/**
 * Callback for successful database deletion.
 * @private
 */
os.storage.IDBStorage.prototype.onDeleteDb_ = function() {
  goog.log.fine(this.log, 'Successfully deleted database ' + this.dbName_);
};


/**
 * Callback for failed database deletion.
 * @param {Error} e
 * @private
 */
os.storage.IDBStorage.prototype.onDeleteDbFail_ = function(e) {
  goog.log.error(this.log, 'Error deleting database ' + this.dbName_, e);
};


/**
 * Callback for deleting database is blocked with open connections.
 * @private
 */
os.storage.IDBStorage.prototype.onDeleteDbBlocked_ = function() {
  goog.log.error(this.log, 'Can not delete database ' + this.dbName_ + ' with open connections.');
};


/**
 * Determine if database is in an error state.
 * @return {boolean}
 */
os.storage.IDBStorage.prototype.isError = function() {
  return !this.db_ && (!this.initDeferred || this.initDeferred.hasFired());
};


/**
 * Send an error alert
 * @param {string} msg The error message
 * @protected
 */
os.storage.IDBStorage.prototype.alertError = function(msg) {
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
};


/**
 * Returns a deferred indicating IDB is not supported by the browser.
 * @param {string} type The error type.
 * @return {!goog.async.Deferred}
 * @protected
 */
os.storage.IDBStorage.prototype.getErrorDeferred = function(type) {
  var msg = this.getErrorMessage(type);
  if (!(type in this.errors_)) {
    this.errors_[type] = new goog.async.Deferred();
    this.errors_[type].errback(msg);
  }

  this.alertError(msg);

  return this.errors_[type];
};


/**
 * Get the error message to display for a particular error type.
 * @param {string} type The error type.
 * @return {string}
 * @protected
 */
os.storage.IDBStorage.prototype.getErrorMessage = function(type) {
  switch (type) {
    case os.storage.IDBStorage.ErrorType.UNSUPPORTED:
      return os.storage.IDBStorage.NOT_SUPPORTED;
    default:
      return os.storage.IDBStorage.UNKNOWN_ERROR;
  }
};
