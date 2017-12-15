goog.require('os.storage');
goog.require('os.storage.IDBStorage');
goog.require('os.storage.mock');
goog.require('os.storage.mock.AsyncStorage');
goog.require('goog.object');


describe('os.storage.IDBStorage', function() {
  var storeName = os.SHARED_STORE_NAME;
  var idb = new os.storage.IDBStorage(storeName);

  it('should connect to an IndexedDB instance and create an object store', function() {
    var cleared = false;
    var onClear = function() {
      cleared = true;
    };
    var clearDeferred = null;
    expect(idb.isError()).toBe(true);

    idb.init().addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);

    waitsFor(function() {
      return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
    }, 'initialization to complete');

    runs(function() {
      expect(idb.db_).not.toBeNull();
      expect(idb.initDeferred).toBeNull();
      expect(idb.isError()).toBe(false);

      var objectStores = idb.db_.getObjectStoreNames();
      expect(objectStores).not.toBeNull();
      expect(objectStores.length).toBe(1);
      expect(objectStores[0]).toBe(storeName);

      clearDeferred = idb.clear();
      clearDeferred.addCallback(onClear);
    });

    waitsFor(function() {
      return cleared;
    }, 'IDB to clear');
  });

  it('should detect if IndexedDB is supported and return an error if not', function() {
    Modernizr.indexeddb = false;

    idb.set('testKey', 'testValue').addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);

    waitsFor(function() {
      return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
    }, 'error to be reported');

    runs(function() {
      expect(os.storage.mock.cbCount).toBe(0);
      expect(os.storage.mock.ebCount).toBe(1);
      expect(os.storage.mock.lastError).toBe(os.storage.IDBStorage.NOT_SUPPORTED);

      os.storage.mock.cbCount = 0;
      os.storage.mock.ebCount = 0;
      os.storage.mock.lastError = null;

      idb.get('testKey').addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
    });

    waitsFor(function() {
      return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
    }, 'error to be reported');

    runs(function() {
      expect(os.storage.mock.cbCount).toBe(0);
      expect(os.storage.mock.ebCount).toBe(1);
      expect(os.storage.mock.lastError).toBe(os.storage.IDBStorage.NOT_SUPPORTED);

      os.storage.mock.cbCount = 0;
      os.storage.mock.ebCount = 0;
      os.storage.mock.lastError = null;

      idb.getAll().addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
    });

    waitsFor(function() {
      return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
    }, 'error to be reported');

    runs(function() {
      expect(os.storage.mock.cbCount).toBe(0);
      expect(os.storage.mock.ebCount).toBe(1);
      expect(os.storage.mock.lastError).toBe(os.storage.IDBStorage.NOT_SUPPORTED);

      os.storage.mock.cbCount = 0;
      os.storage.mock.ebCount = 0;
      os.storage.mock.lastError = null;

      idb.remove('testKey').addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
    });

    waitsFor(function() {
      return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
    }, 'error to be reported');

    runs(function() {
      expect(os.storage.mock.cbCount).toBe(0);
      expect(os.storage.mock.ebCount).toBe(1);
      expect(os.storage.mock.lastError).toBe(os.storage.IDBStorage.NOT_SUPPORTED);

      os.storage.mock.cbCount = 0;
      os.storage.mock.ebCount = 0;
      os.storage.mock.lastError = null;

      idb.clear().addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
    });

    waitsFor(function() {
      return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
    }, 'error to be reported');

    runs(function() {
      expect(os.storage.mock.cbCount).toBe(0);
      expect(os.storage.mock.ebCount).toBe(1);
      expect(os.storage.mock.lastError).toBe(os.storage.IDBStorage.NOT_SUPPORTED);

      os.storage.mock.cbCount = 0;
      os.storage.mock.ebCount = 0;
      os.storage.mock.lastError = null;

      Modernizr.indexeddb = true;
    });
  });

  // run interface tests for set/get
  os.storage.runAsyncSetTests(idb);
  os.storage.runAsyncGetTests(idb);
  os.storage.runAsyncGetAllTests(idb);

  // run interface tests for replace/remove
  os.storage.runAsyncReplaceTests(idb);
  os.storage.runAsyncRemoveTests(idb);
  os.storage.runAsyncClearTests(idb);

  it('should close the database connection when disposed', function() {
    // keep a reference because disposing should null it
    var db = idb.db_;
    expect(db.isOpen()).toBe(true);
    idb.dispose();

    waitsFor(function() {
      return !db.isOpen();
    }, 'connection to close');

    runs(function() {
      expect(idb.db_).toBeNull();
      expect(db.isOpen()).toBe(false);
      expect(idb.isError()).toBe(true);
    });
  });
});
