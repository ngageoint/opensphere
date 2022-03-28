/**
 * @fileoverview Base tests for any classes extending AsyncStorage.
 */
goog.module('os.storage.mock');

const {getCount} = goog.require('goog.object');


/**
 * The last callback value.
 * @type {*}
 */
let lastValue = undefined;

/**
 * Get the last value.
 * @return {number}
 */
const getLastValue = () => lastValue;

/**
 * Set the last value.
 * @param {string|undefined} value The value.
 */
const setLastValue = (value) => {
  lastValue = value;
};

/**
 * The last error encountered by a storage test.
 * @type {string|undefined}
 */
let lastError = undefined;

/**
 * Get the last error.
 * @return {number}
 */
const getLastError = () => lastError;

/**
 * Set the last error.
 * @param {string|undefined} value The value.
 */
const setLastError = (value) => {
  lastError = value;
};

/**
 * The number of callbacks fired.
 * @type {number}
 */
let cbCount = 0;

/**
 * Get the callback count.
 * @return {number}
 */
const getCallbackCount = () => cbCount;

/**
 * Set the callback count.
 * @param {number} value The value.
 */
const setCallbackCount = (value) => {
  cbCount = value;
};

/**
 * The number of errbacks fired.
 * @type {number}
 */
let ebCount = 0;

/**
 * Get the errback count.
 * @return {number}
 */
const getErrbackCount = () => ebCount;

/**
 * Set the errback count.
 * @param {number} value The value.
 */
const setErrbackCount = (value) => {
  ebCount = value;
};

/**
 * Mock deferred callback handler.
 * @param {*} val The value
 */
const incrementCb = function(val) {
  cbCount++;
  lastValue = val;
};

/**
 * Mock deferred errback handler.
 * @param {string|undefined} e The error
 */
const incrementEb = function(e) {
  ebCount++;
  lastError = e;
};

/**
 * @type {Object}
 */
const asyncValueMap = {
  'stringKey': 'storage string test value',
  'numKey': 42,
  'boolKey': true,
  'objectKey': {
    'luggageCombo': 12345,
    'jamType': 'the raspberries',
    'isSchwartzEqual': true
  }
};

beforeEach(function() {
  cbCount = 0;
  ebCount = 0;
  lastError = undefined;
  lastValue = undefined;
});

/**
 * Base set tests for all asynchronous storage classes.
 * @param {AsyncStorage} storage The asynchronous storage object
 */
const runAsyncSetTests = function(storage) {
  describe('set', function() {
    it('should set values in storage', function() {
      runs(function() {
        storage.set('stringKey', asyncValueMap['stringKey']).addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'string to be stored');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);

        cbCount = 0;
        ebCount = 0;

        storage.set('numKey', asyncValueMap['numKey']).addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'number to be stored');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);

        cbCount = 0;
        ebCount = 0;

        storage.set('boolKey', asyncValueMap['boolKey']).addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'boolean to be stored');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);

        cbCount = 0;
        ebCount = 0;

        storage.set('objectKey', asyncValueMap['objectKey']).addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'object to be stored');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
      });
    });
  });
};

/**
 * Base get tests for all asynchronous storage classes.
 * @param {AsyncStorage} storage The asynchronous storage object
 */
const runAsyncGetTests = function(storage) {
  describe('get', function() {
    it('should get values from storage', function() {
      runs(function() {
        storage.get('stringKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return lastValue != null;
      }, 'string to be retrieved');

      runs(function() {
        expect(lastValue).toBe(asyncValueMap['stringKey']);

        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;
        lastValue = undefined;

        storage.get('numKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return lastValue != null;
      }, 'number to be retrieved');

      runs(function() {
        expect(lastValue).toBe(asyncValueMap['numKey']);

        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;
        lastValue = undefined;

        storage.get('boolKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return lastValue != null;
      }, 'boolean to be retrieved');

      runs(function() {
        expect(lastValue).toBe(asyncValueMap['boolKey']);

        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;
        lastValue = undefined;

        storage.get('objectKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return lastValue != null;
      }, 'object to be retrieved');

      runs(function() {
        for (var key in asyncValueMap['objectKey']) {
          expect(lastValue[key]).toBe(asyncValueMap['objectKey'][key]);
        }

        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;
        lastValue = undefined;

        storage.get('notAKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'absent key to be retrieved');

      runs(function() {
        expect(lastValue).toBeFalsy();
      });
    });
  });
};

/**
 * Base get tests for all asynchronous storage classes.
 * @param {AsyncStorage} storage The asynchronous storage object
 * @param {boolean=} opt_supportsInterface If {@link os.storage.IMechanism} is supported.
 */
const runAsyncGetAllTests = function(storage, opt_supportsInterface) {
  var supportsInterface = opt_supportsInterface != null ? opt_supportsInterface : true;
  if (supportsInterface) {
    describe('get all', function() {
      it('should get all values from the storage', function() {
        runs(function() {
          storage.getAll().addCallbacks(incrementCb, incrementEb);
        });

        waitsFor(function() {
          return cbCount > 0 || ebCount > 0;
        }, 'values to be retrieved');

        runs(function() {
          expect(ebCount).toBe(0);
          expect(lastValue).toBeTruthy();
          expect(lastValue.length).toBe(getCount(asyncValueMap));
        });
      });
    });
  }
};

/**
 * Base replace tests for all asynchronous storage classes.
 * @param {AsyncStorage} storage The asynchronous storage object
 */
const runAsyncReplaceTests = function(storage) {
  describe('replace', function() {
    it('should only replace values when specified', function() {
      runs(function() {
        storage.set('numKey', 9000).addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'set to complete');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;

        storage.get('numKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'get to complete');

      runs(function() {
        // value shouldn't change
        expect(lastValue).toBe(asyncValueMap['numKey']);

        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;
        lastValue = undefined;

        storage.set('numKey', 9000, false).addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'set to complete');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;

        storage.get('numKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'get to complete');

      runs(function() {
        // value shouldn't change
        expect(lastValue).toBe(asyncValueMap['numKey']);

        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;
        lastValue = undefined;

        storage.set('numKey', 9000, true).addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'set to complete');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;

        storage.get('numKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'get to complete');

      runs(function() {
        // value should change
        expect(lastValue).toBe(9000);
      });
    });
  });
};

/**
 * Base remove tests for all asynchronous storage classes.
 * @param {AsyncStorage} storage The asynchronous storage object
 */
const runAsyncRemoveTests = function(storage) {
  describe('remove', function() {
    it('should remove keys from the database', function() {
      runs(function() {
        storage.remove('stringKey').addCallbacks(incrementCb, incrementEb);
        storage.remove('numKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 1 || ebCount > 0;
      }, 'remove calls to complete');

      runs(function() {
        expect(cbCount).toBe(2);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;

        storage.get('stringKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'get to complete');

      runs(function() {
        expect(lastValue).toBeFalsy();

        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;
        lastValue = undefined;

        storage.get('numKey').addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'get to complete');

      runs(function() {
        expect(lastValue).toBeFalsy();

        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;
        lastValue = undefined;
      });
    });
  });
};

/**
 * Base clear tests for all asynchronous storage classes.
 * @param {AsyncStorage} storage The asynchronous storage object
 */
const runAsyncClearTests = function(storage) {
  describe('clear', function() {
    it('should clear storage', function() {
      runs(function() {
        storage.clear().addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'clear to complete');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        cbCount = ebCount = 0;

        storage.getAll().addCallbacks(incrementCb, incrementEb);
      });

      waitsFor(function() {
        return cbCount > 0 || ebCount > 0;
      }, 'getAll to complete');

      runs(function() {
        expect(cbCount).toBe(1);
        expect(ebCount).toBe(0);
        expect(lastValue).toBeTruthy();
        expect(lastValue.length).toBe(0);
      });
    });
  });
};

/**
 * Base dispose tests for all asynchronous storage classes.
 * @param {AsyncStorage} storage The asynchronous storage object
 */
const runAsyncDisposeTests = function(storage) {
  describe('dispose', function() {
    it('should dispose the database', function() {
      runs(function() {
        storage.dispose();
      });

      waitsFor(function() {
        return storage.isDisposed();
      });
    });
  });
};

exports = {
  getLastValue,
  setLastValue,
  getLastError,
  setLastError,
  getCallbackCount,
  setCallbackCount,
  getErrbackCount,
  setErrbackCount,
  incrementCb,
  incrementEb,
  asyncValueMap,
  runAsyncSetTests,
  runAsyncGetTests,
  runAsyncGetAllTests,
  runAsyncReplaceTests,
  runAsyncRemoveTests,
  runAsyncClearTests,
  runAsyncDisposeTests
};
