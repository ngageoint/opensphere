goog.require('goog.storage.mechanism.HTML5LocalStorage');
goog.require('goog.storage.mechanism.mechanismfactory');
goog.require('os.storage.AsyncStorageWrapper');
goog.require('os.storage.HTML5LocalStorage');
goog.require('os.storage.ObjectMechanism');
goog.require('os.storage.PrefixedMechanism');
goog.require('os.storage.mock');

describe('os.storage.AsyncStorageWrapper', function() {
  const mechanismfactory = goog.module.get('goog.storage.mechanism.mechanismfactory');
  const AsyncStorageWrapper = goog.module.get('os.storage.AsyncStorageWrapper');
  const HTML5LocalStorage = goog.module.get('os.storage.HTML5LocalStorage');
  const ObjectMechanism = goog.module.get('os.storage.ObjectMechanism');
  const PrefixedMechanism = goog.module.get('os.storage.PrefixedMechanism');

  const mock = goog.module.get('os.storage.mock');

  /**
   * Run async storage wrapper tests with the provided storage mechanism.
   * @param {!goog.storage.mechanism.Mechanism} mechanism The storage mechanism
   * @param {string} type The mechanism type name
   */
  const runAsyncWrapperTests = function(mechanism, type) {
    var describeLabel = 'using mechanism ' + type;
    describe(describeLabel, function() {
      var storage = new AsyncStorageWrapper(mechanism);

      it('should initialize immediately', function() {
        storage.init().addCallbacks(mock.incrementCb, mock.incrementEb);

        waitsFor(function() {
          return mock.getCallbackCount() > 0 || mock.getErrbackCount() > 0;
        }, 'callback to fire');

        runs(function() {
          expect(mock.getCallbackCount()).toBe(1);
          expect(mock.getErrbackCount()).toBe(0);
        });
      });

      // run all interface tests
      mock.runAsyncSetTests(storage);
      mock.runAsyncGetTests(storage);
      mock.runAsyncGetAllTests(storage);
      mock.runAsyncReplaceTests(storage);
      mock.runAsyncRemoveTests(storage);
      mock.runAsyncClearTests(storage);
      mock.runAsyncDisposeTests(storage);
    });
  };

  // run tests with available mechanisms
  var prefixNs = 'os.storage.asyncTest';
  var mechanism = new PrefixedMechanism(new ObjectMechanism(), prefixNs);
  runAsyncWrapperTests(mechanism, 'os.storage.ObjectMechanism');

  mechanism = new PrefixedMechanism(new HTML5LocalStorage(), prefixNs);
  runAsyncWrapperTests(mechanism, 'os.storage.HTML5LocalStorage');

  it('throws an error if a mechanism is provided that does not implement os.storage.IMechanism', function() {
    var useClosureMechanism = function() {
      var mechanism = mechanismfactory.create(prefixNs);
      new AsyncStorageWrapper(mechanism);
    };

    expect(useClosureMechanism).toThrow();
  });
});
