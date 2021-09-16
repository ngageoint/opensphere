goog.module('os.storage.IDBStorage');

const Deferred = goog.require('goog.async.Deferred');
const {deleteDatabase, openDatabase} = goog.require('goog.db');
const Cursor = goog.require('goog.db.Cursor');
const KeyRange = goog.require('goog.db.KeyRange');
const TransactionMode = goog.require('goog.db.Transaction.TransactionMode');
const {listen, listenOnce, unlistenByKey} = goog.require('goog.events');
const log = goog.require('goog.log');
const {SHARED_DB_NAME} = goog.require('os');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const AsyncStorage = goog.require('os.storage.AsyncStorage');

const DBError = goog.requireType('goog.db.Error');
const IndexedDb = goog.requireType('goog.db.IndexedDb');
const Transaction = goog.requireType('goog.db.Transaction');
const Logger = goog.requireType('goog.log.Logger');


/**
 * Mechanism for storing data to IndexedDB.
 *
 *
 * @extends {AsyncStorage<T>}
 * @template T
 */
class IDBStorage extends AsyncStorage {
  /**
   * Constructor.
   * @param {string} storeName The object store name in the database
   * @param {string=} opt_dbName The database name to use
   * @param {number=} opt_version The database version
   */
  constructor(storeName, opt_dbName, opt_version) {
    super();

    /**
     * @type {?IndexedDb}
     * @private
     */
    this.db_ = null;

    /**
     * The IndexedDB name
     * @type {string}
     * @private
     */
    this.dbName_ = opt_dbName || SHARED_DB_NAME;

    /**
     * The IndexedDB version
     * @type {number}
     * @private
     */
    this.dbVersion_ = opt_version != null ? opt_version : IDBStorage.DEFAULT_VERSION_;

    /**
     * The object store name in the database
     * @type {string}
     * @private
     */
    this.storeName_ = storeName;

    /**
     * The deferred object used during initialization.
     * @type {?Deferred}
     * @protected
     */
    this.initDeferred = null;

    /**
     * Deferred cache for error reporting.
     * @type {!Object<string, !Deferred>}
     * @private
     */
    this.errors_ = {};

    /**
     * @type {Logger}
     * @protected
     */
    this.log = IDBStorage.LOGGER_;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.initDeferred) {
      this.initDeferred.cancel();
    }

    if (this.db_ && this.db_.isOpen()) {
      this.db_.close();
    }

    this.db_ = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    var deferred;
    if (Modernizr.indexeddb == true) {
      deferred = this.initDeferred = openDatabase(this.dbName_, this.dbVersion_,
          this.onUpgradeNeeded_.bind(this),
          this.onBlocked_.bind(this))
          .addCallbacks(this.onDbReady_, this.onDbOpenError_, this);
    } else {
      deferred = new Deferred();
      deferred.errback(this.getErrorMessage(IDBStorage.ErrorType.UNSUPPORTED));
    }

    return deferred;
  }

  /**
   * Handle database successfully opening.
   *
   * @param {IndexedDb} db
   * @private
   */
  onDbReady_(db) {
    log.fine(this.log, 'Successfully opened database ' + db.getName());
    this.db_ = db;
    this.initDeferred = null;
  }

  /**
   * Handle database open error.
   *
   * @param {DBError} error
   * @return {DBError}
   * @private
   */
  onDbOpenError_(error) {
    var msg = 'Error opening database:';
    log.error(this.log, msg, error);
    return error;
  }

  /**
   * @param {!IndexedDb.VersionChangeEvent} event
   * @private
   */
  onBlocked_(event) {
    log.error(this.log, 'IDB store blocked from upgrading to version ' + this.dbVersion_ + '!');
  }

  /**
   * Creates the object store.
   *
   * @param {!IndexedDb.VersionChangeEvent} event The event
   * @param {!IndexedDb} db The IndexedDB instance
   * @param {!Transaction} tx The transaction object
   * @private
   */
  onUpgradeNeeded_(event, db, tx) {
    log.fine(this.log, 'Upgrading database from ' + event.oldVersion + ' to ' + event.newVersion);

    // create the object store if it doesn't exist in the DB
    var storeNames = db.getObjectStoreNames();
    if (!storeNames || !storeNames.contains(this.storeName_)) {
      db.createObjectStore(this.storeName_);
    }
  }

  /**
   * @inheritDoc
   */
  get(key) {
    if (this.initDeferred) {
      return this.initDeferred.addCallback(goog.partial(this.getInternal_, key), this);
    }

    if (Modernizr.indexeddb == true) {
      return this.getInternal_(key);
    }

    return this.getErrorDeferred(IDBStorage.ErrorType.UNSUPPORTED);
  }

  /**
   * Retrieves an item from the database.
   *
   * @param {string} key Database key to retrieve.
   * @return {!Deferred} The deferred get request.
   * @private
   */
  getInternal_(key) {
    if (this.db_) {
      return this.db_.createTransaction([this.storeName_],
          TransactionMode.READ_ONLY)
          .objectStore(this.storeName_)
          .get(key)
          .addCallback(this.deserializeItem, this);
    } else {
      return this.getErrorDeferred(IDBStorage.ErrorType.UNSUPPORTED);
    }
  }

  /**
   * @inheritDoc
   */
  getAll() {
    if (this.initDeferred) {
      return this.initDeferred.addCallback(this.getAllInternal_, this);
    }

    if (Modernizr.indexeddb == true) {
      return this.getAllInternal_();
    }

    return this.getErrorDeferred(IDBStorage.ErrorType.UNSUPPORTED);
  }

  /**
   * Retrieves all items from the database.
   *
   * @return {!Deferred} The deferred get request.
   * @private
   */
  getAllInternal_() {
    if (this.db_) {
      return this.db_.createTransaction([this.storeName_],
          TransactionMode.READ_ONLY)
          .objectStore(this.storeName_)
          .getAll()
          .addCallback(this.deserializeItems, this);
    } else {
      return this.getErrorDeferred(IDBStorage.ErrorType.UNSUPPORTED);
    }
  }

  /**
   * @inheritDoc
   */
  set(key, item, opt_replace) {
    if (this.initDeferred) {
      return this.initDeferred.addCallback(goog.partial(this.setInternal_, key, item, opt_replace), this);
    }

    if (Modernizr.indexeddb == true) {
      return this.setInternal_(key, item, opt_replace);
    }

    return this.getErrorDeferred(IDBStorage.ErrorType.UNSUPPORTED);
  }

  /**
   * Stores an item in the database.
   *
   * @param {string} key The item key
   * @param {T} item The item to insert into the database
   * @param {boolean=} opt_replace If the item should be replaced in the store.
   * @return {!Deferred} The deferred store request. The result will be the found item if the item
   *   already existed in the database.
   * @private
   */
  setInternal_(key, item, opt_replace) {
    if (this.isError()) {
      return this.getErrorDeferred(IDBStorage.ErrorType.UNSUPPORTED);
    }

    var tx = this.db_.createTransaction([this.storeName_],
        TransactionMode.READ_WRITE);
    var store = tx.objectStore(this.storeName_);
    var cursor = store.openCursor(KeyRange.bound(key, key));
    var foundItem = null;
    var listenKey = listen(cursor, Cursor.EventType.NEW_DATA, () => {
      if (!foundItem) {
        foundItem = this.deserializeItem(cursor.getValue());
      }
      cursor.next();
    }, false);

    listenOnce(cursor, Cursor.EventType.COMPLETE, () => {
      unlistenByKey(listenKey);

      if (!foundItem) {
        // if the key wasn't found then store the item
        store.add(this.serializeItem(item), key)
            .addCallback(goog.partial(this.onItemAdded, key), this);
      } else if (opt_replace) {
        // replace the existing item if the flag is set
        store.put(this.serializeItem(item), key);
      }
    }, false);

    return tx.wait();
  }

  /**
   * @inheritDoc
   */
  remove(key) {
    if (this.initDeferred) {
      return this.initDeferred.addCallback(goog.partial(this.removeInternal_, key), this);
    }

    if (Modernizr.indexeddb == true) {
      return this.removeInternal_(key);
    }

    return this.getErrorDeferred(IDBStorage.ErrorType.UNSUPPORTED);
  }

  /**
   * Deletes an item from storage.
   *
   * @param {string} key The key to remove
   * @return {!Deferred} The deferred delete request.
   * @private
   */
  removeInternal_(key) {
    if (this.isError()) {
      return this.getErrorDeferred(IDBStorage.ErrorType.UNKNOWN);
    }

    var tx = this.db_.createTransaction([this.storeName_], TransactionMode.READ_WRITE);
    tx.objectStore(this.storeName_).remove(key).addCallback(goog.partial(this.onItemRemoved, key), this);
    return tx.wait();
  }

  /**
   * Deserializes an item from the database.
   *
   * @param {*} data
   * @return {T}
   *
   * @template T
   */
  deserializeItem(data) {
    // default to assuming the data doesn't need to be changed to/from IDB
    return data;
  }

  /**
   * Deserializes an item from the database.
   *
   * @param {Array<*>} data
   * @return {T}
   * @protected
   *
   * @template T
   */
  deserializeItems(data) {
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
  }

  /**
   * Serializes an item to store in the database.
   *
   * @param {T} item
   * @return {*}
   *
   * @template T
   */
  serializeItem(item) {
    // default to assuming the data doesn't need to be changed to/from IDB
    return item;
  }

  /**
   * Handle successful clear of the object store.
   *
   * @protected
   */
  onObjectStoreCleared() {
    log.info(this.log, 'Cleared object store "' + this.storeName_ + '".');
  }

  /**
   * Handle successful insertion of an item into the database.
   *
   * @param {string} key Key of the inserted item.
   * @protected
   */
  onItemAdded(key) {
    log.info(this.log, 'Added item "' + key + '" to the database.');
  }

  /**
   * Handle successful deletion of an item from the database.
   *
   * @param {string} key Key of the deleted item.
   * @protected
   */
  onItemRemoved(key) {
    log.info(this.log, 'Removed item "' + key + '" from the database.');
  }

  /**
   * @inheritDoc
   */
  clear() {
    if (this.initDeferred) {
      return this.initDeferred.addCallback(this.clearInternal_, this);
    }

    if (Modernizr.indexeddb == true) {
      return this.clearInternal_();
    }

    return this.getErrorDeferred(IDBStorage.ErrorType.UNSUPPORTED);
  }

  /**
   * Clears the object store.
   *
   * @return {!Deferred} The deferred clear request.
   * @private
   */
  clearInternal_() {
    return this.db_.createTransaction([this.storeName_], TransactionMode.READ_WRITE)
        .objectStore(this.storeName_)
        .clear()
        .addCallback(this.onObjectStoreCleared, this);
  }

  /**
   * Delete the database.
   */
  deleteDatabase() {
    if (Modernizr.indexeddb == true) {
      if (this.db_ && this.db_.isOpen()) {
        this.db_.close();
      }

      deleteDatabase(this.dbName_, this.onDeleteDbBlocked_).addCallbacks(this.onDeleteDb_, this.onDeleteDbFail_);
    }
  }

  /**
   * Callback for successful database deletion.
   *
   * @private
   */
  onDeleteDb_() {
    log.fine(this.log, 'Successfully deleted database ' + this.dbName_);
  }

  /**
   * Callback for failed database deletion.
   *
   * @param {DBError} e
   * @private
   */
  onDeleteDbFail_(e) {
    log.error(this.log, 'Error deleting database ' + this.dbName_, e);
  }

  /**
   * Callback for deleting database is blocked with open connections.
   *
   * @private
   */
  onDeleteDbBlocked_() {
    log.error(this.log, 'Can not delete database ' + this.dbName_ + ' with open connections.');
  }

  /**
   * Determine if database is in an error state.
   *
   * @return {boolean}
   */
  isError() {
    return !this.db_ && (!this.initDeferred || this.initDeferred.hasFired());
  }

  /**
   * Send an error alert
   *
   * @param {string} msg The error message
   * @protected
   */
  alertError(msg) {
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
  }

  /**
   * Returns a deferred indicating IDB is not supported by the browser.
   *
   * @param {string} type The error type.
   * @return {!Deferred}
   * @protected
   */
  getErrorDeferred(type) {
    var msg = this.getErrorMessage(type);
    if (!(type in this.errors_)) {
      this.errors_[type] = new Deferred();
      this.errors_[type].errback(msg);
    }

    this.alertError(msg);

    return this.errors_[type];
  }

  /**
   * Get the error message to display for a particular error type.
   *
   * @param {string} type The error type.
   * @return {string}
   * @protected
   */
  getErrorMessage(type) {
    switch (type) {
      case IDBStorage.ErrorType.UNSUPPORTED:
        return IDBStorage.NOT_SUPPORTED;
      default:
        return IDBStorage.UNKNOWN_ERROR;
    }
  }
}


/**
 * @enum {string}
 */
IDBStorage.ErrorType = {
  UNSUPPORTED: 'idb:unsupported',
  UNKNOWN: 'idb:unknown'
};


/**
 * Logger
 * @type {Logger}
 * @const
 * @private
 */
IDBStorage.LOGGER_ = log.getLogger('os.storage.IDBStorage');


/**
 * The database version. This should only be incremented if the database structure changes and needs to be migrated.
 * @type {number}
 * @const
 * @private
 */
IDBStorage.DEFAULT_VERSION_ = 1;


/**
 * Error used when IDB is not supported by the browser.
 * @type {string}
 * @const
 */
IDBStorage.NOT_SUPPORTED =
    'Uh oh! Your browser does not support storing data with an in-browser database. To use this feature, please ' +
    'upgrade to a modern browser (we recommend Chrome 28+, FF24+, or IE10+).';


/**
 * Generic error.
 * @type {string}
 * @const
 */
IDBStorage.UNKNOWN_ERROR = 'There has been an error accessing the in-browser database. For assistance, ' +
    'use the "Help" menu to contact support.';


exports = IDBStorage;
