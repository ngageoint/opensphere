goog.require('goog.storage.mechanism.HTML5LocalStorage');
goog.require('os.storage.AsyncStorageWrapper');
goog.require('os.storage.HTML5LocalStorage');
goog.require('os.storage.ObjectMechanism');
goog.require('os.storage.PrefixedMechanism');
goog.require('os.storage.mock');
goog.require('os.storage.mock.AsyncStorage');


/**
 * Run async storage wrapper tests with the provided storage mechanism.
 * @param {!goog.storage.mechanism.Mechanism} mechanism The storage mechanism
 * @param {string} type The mechanism type name
 */
os.storage.runAsyncWrapperTests = function(mechanism, type) {
  var describeLabel = 'using mechanism ' + type;
  describe(describeLabel, function() {
    var storage = new os.storage.AsyncStorageWrapper(mechanism);

    it('should initialize immediately', function() {
      storage.init().addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'callback to fire');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
      });
    });

    // run all interface tests
    os.storage.runAsyncSetTests(storage);
    os.storage.runAsyncGetTests(storage);
    os.storage.runAsyncGetAllTests(storage);
    os.storage.runAsyncReplaceTests(storage);
    os.storage.runAsyncRemoveTests(storage);
    os.storage.runAsyncClearTests(storage);
    os.storage.runAsyncDisposeTests(storage);
  });
};


describe('os.storage.AsyncStorageWrapper', function() {
  // run tests with available mechanisms
  var prefixNs = 'os.storage.asyncTest';
  var mechanism = new os.storage.PrefixedMechanism(new os.storage.ObjectMechanism(), prefixNs);
  os.storage.runAsyncWrapperTests(mechanism, 'os.storage.ObjectMechanism');

  mechanism = new os.storage.PrefixedMechanism(new os.storage.HTML5LocalStorage(), prefixNs);
  os.storage.runAsyncWrapperTests(mechanism, 'os.storage.HTML5LocalStorage');

  it('throws an error if a mechanism is provided that does not implement os.storage.IMechanism', function() {
    var useClosureMechanism = function() {
      var mechanism = goog.storage.mechanism.mechanismfactory.create(prefixNs);
      new os.storage.AsyncStorageWrapper(mechanism);
    };

    expect(useClosureMechanism).toThrow();
  });
});
