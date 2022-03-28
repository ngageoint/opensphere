goog.require('goog.db');
goog.require('goog.object');
goog.require('os.storage.IDBStorage');
goog.require('os.storage.mock');

describe('os.storage.IDBStorage', function() {
  const {deleteDatabase} = goog.module.get('goog.db');
  const {default: IDBStorage} = goog.module.get('os.storage.IDBStorage');

  const mock = goog.module.get('os.storage.mock');

  var dbName = 'os.test.db';
  var storeName = 'idbTestStore';
  var version = 1;
  var idb;

  var openDb = function() {
    runs(function() {
      Modernizr.indexeddb = true;
      idb = new IDBStorage(storeName, dbName, version);
      expect(idb.isError()).toBe(true);

      idb.init().addCallbacks(mock.incrementCb, mock.incrementEb);
    });

    waitsFor(function() {
      return mock.getCallbackCount() > 0 || mock.getErrbackCount() > 0;
    }, 'initialization to complete');

    runs(function() {
      expect(idb.db_).not.toBeNull();
      expect(idb.db_.getVersion()).toBe(version);
      expect(idb.initDeferred).toBeNull();
      expect(idb.isError()).toBe(false);

      var objectStores = idb.db_.getObjectStoreNames();
      expect(objectStores).not.toBeNull();
      expect(objectStores.length).toBe(1);
      expect(objectStores[0]).toBe(storeName);
    });
  };

  var closeDb = function() {
    var db;
    runs(function() {
      if (idb) {
        // keep a reference because disposing should null it
        db = idb.db_;
        expect(db.isOpen()).toBe(true);
        idb.dispose();
      }
    });

    waitsFor(function() {
      return !idb || !db || !db.isOpen();
    }, 'connection to close');

    runs(function() {
      expect(idb.db_).toBeNull();
      expect(db.isOpen()).toBe(false);
      expect(idb.isError()).toBe(true);

      idb = undefined;
    });
  };

  it('should initialize the test suite', function() {
    runs(function() {
      deleteDatabase(dbName, mock.incrementEb).addCallbacks(mock.incrementCb, mock.incrementEb);
    });

    waitsFor(function() {
      return mock.getCallbackCount() > 0 || mock.getErrbackCount() > 0;
    }, 'database to be deleted, or error');

    runs(function() {
      expect(mock.getCallbackCount()).toBe(1);
      expect(mock.getErrbackCount()).toBe(0);

      mock.setCallbackCount(0);
      mock.setErrbackCount(0);
    });
  });

  it('should connect to an IndexedDB instance and create an object store', function() {
    openDb();
  });

  it('should close the database connection when disposed', function() {
    closeDb();
  });

  it('should upgrade the database on open if needed', function() {
    version++;
    openDb();
  });

  it('should detect if IndexedDB is supported and return an error if not', function() {
    runs(function() {
      Modernizr.indexeddb = false;
      idb.set('testKey', 'testValue').addCallbacks(mock.incrementCb, mock.incrementEb);
    });

    waitsFor(function() {
      return mock.getCallbackCount() > 0 || mock.getErrbackCount() > 0;
    }, 'error to be reported');

    runs(function() {
      expect(mock.getCallbackCount()).toBe(0);
      expect(mock.getErrbackCount()).toBe(1);
      expect(mock.getLastError()).toBe(IDBStorage.NOT_SUPPORTED);

      mock.setCallbackCount(0);
      mock.setErrbackCount(0);
      mock.setLastError(null);

      idb.get('testKey').addCallbacks(mock.incrementCb, mock.incrementEb);
    });

    waitsFor(function() {
      return mock.getCallbackCount() > 0 || mock.getErrbackCount() > 0;
    }, 'error to be reported');

    runs(function() {
      expect(mock.getCallbackCount()).toBe(0);
      expect(mock.getErrbackCount()).toBe(1);
      expect(mock.getLastError()).toBe(IDBStorage.NOT_SUPPORTED);

      mock.setCallbackCount(0);
      mock.setErrbackCount(0);
      mock.setLastError(null);

      idb.getAll().addCallbacks(mock.incrementCb, mock.incrementEb);
    });

    waitsFor(function() {
      return mock.getCallbackCount() > 0 || mock.getErrbackCount() > 0;
    }, 'error to be reported');

    runs(function() {
      expect(mock.getCallbackCount()).toBe(0);
      expect(mock.getErrbackCount()).toBe(1);
      expect(mock.getLastError()).toBe(IDBStorage.NOT_SUPPORTED);

      mock.setCallbackCount(0);
      mock.setErrbackCount(0);
      mock.setLastError(null);

      idb.remove('testKey').addCallbacks(mock.incrementCb, mock.incrementEb);
    });

    waitsFor(function() {
      return mock.getCallbackCount() > 0 || mock.getErrbackCount() > 0;
    }, 'error to be reported');

    runs(function() {
      expect(mock.getCallbackCount()).toBe(0);
      expect(mock.getErrbackCount()).toBe(1);
      expect(mock.getLastError()).toBe(IDBStorage.NOT_SUPPORTED);

      mock.setCallbackCount(0);
      mock.setErrbackCount(0);
      mock.setLastError(null);

      idb.clear().addCallbacks(mock.incrementCb, mock.incrementEb);
    });

    waitsFor(function() {
      return mock.getCallbackCount() > 0 || mock.getErrbackCount() > 0;
    }, 'error to be reported');

    runs(function() {
      expect(mock.getCallbackCount()).toBe(0);
      expect(mock.getErrbackCount()).toBe(1);
      expect(mock.getLastError()).toBe(IDBStorage.NOT_SUPPORTED);

      mock.setCallbackCount(0);
      mock.setErrbackCount(0);
      mock.setLastError(null);

      Modernizr.indexeddb = true;
    });
  });

  it('should pass async storage tests', function() {
    // run interface tests for set/get
    mock.runAsyncSetTests(idb);
    mock.runAsyncGetTests(idb);
    mock.runAsyncGetAllTests(idb);

    // run interface tests for replace/remove
    mock.runAsyncReplaceTests(idb);
    mock.runAsyncRemoveTests(idb);
    mock.runAsyncClearTests(idb);

    // run interface tests for dispose
    mock.runAsyncDisposeTests(idb);
  });
});
