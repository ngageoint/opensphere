/**
 * @fileoverview Base tests for any classes extending os.storage.AsyncStorage.
 */
goog.provide('os.storage.mock');
goog.provide('os.storage.mock.AsyncStorage');

/**
 * Timeout to use in waitsFor calls.
 * @type {number}
 * @const
 */
os.storage.mock.WAIT_TIMEOUT = 5000;

/**
 * The last callback value.
 * @type {*}
 */
os.storage.mock.lastValue = undefined;

/**
 * The last error encountered by a storage test.
 * @type {string|undefined}
 */
os.storage.mock.lastError = undefined;

/**
 * The number of callbacks fired.
 * @type {number}
 */
os.storage.mock.cbCount = 0;

/**
 * The number of errbacks fired.
 * @type {number}
 */
os.storage.mock.ebCount = 0;

/**
 * Mock deferred callback handler.
 * @param {*} val The value
 */
os.storage.mock.incrementCb = function(val) {
  os.storage.mock.cbCount++;
  os.storage.mock.lastValue = val;
};

/**
 * Mock deferred errback handler.
 * @param {string|undefined} e The error
 */
os.storage.mock.incrementEb = function(e) {
  os.storage.mock.ebCount++;
  os.storage.mock.lastError = e;
};

/**
 * @type {Object}
 */
os.storage.asyncValueMap = {
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
  os.storage.mock.cbCount = 0;
  os.storage.mock.ebCount = 0;
  os.storage.mock.lastError = undefined;
  os.storage.mock.lastValue = undefined;
});


/**
 * Base set tests for all asynchronous storage classes.
 * @param {os.storage.AsyncStorage} storage The asynchronous storage object
 */
os.storage.runAsyncSetTests = function(storage) {
  describe('set', function() {
    it('should set values in storage', function() {
      storage.set('stringKey', os.storage.asyncValueMap['stringKey'])
          .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'string to be stored');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);

        os.storage.mock.cbCount = 0;
        os.storage.mock.ebCount = 0;

        storage.set('numKey', os.storage.asyncValueMap['numKey'])
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'number to be stored');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);

        os.storage.mock.cbCount = 0;
        os.storage.mock.ebCount = 0;

        storage.set('boolKey', os.storage.asyncValueMap['boolKey'])
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'boolean to be stored');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);

        os.storage.mock.cbCount = 0;
        os.storage.mock.ebCount = 0;

        storage.set('objectKey', os.storage.asyncValueMap['objectKey'])
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'object to be stored');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
      });
    });
  });
};


/**
 * Base get tests for all asynchronous storage classes.
 * @param {os.storage.AsyncStorage} storage The asynchronous storage object
 */
os.storage.runAsyncGetTests = function(storage) {
  describe('get', function() {
    it('should get values from storage', function() {
      storage.get('stringKey')
          .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);

      waitsFor(function() {
        return os.storage.mock.lastValue != null;
      }, 'string to be retrieved');

      runs(function() {
        expect(os.storage.mock.lastValue).toBe(os.storage.asyncValueMap['stringKey']);

        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;
        os.storage.mock.lastValue = undefined;

        storage.get('numKey')
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.lastValue != null;
      }, 'number to be retrieved');

      runs(function() {
        expect(os.storage.mock.lastValue).toBe(os.storage.asyncValueMap['numKey']);

        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;
        os.storage.mock.lastValue = undefined;

        storage.get('boolKey')
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.lastValue != null;
      }, 'boolean to be retrieved');

      runs(function() {
        expect(os.storage.mock.lastValue).toBe(os.storage.asyncValueMap['boolKey']);

        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;
        os.storage.mock.lastValue = undefined;

        storage.get('objectKey')
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.lastValue != null;
      }, 'object to be retrieved');

      runs(function() {
        for (var key in os.storage.asyncValueMap['objectKey']) {
          expect(os.storage.mock.lastValue[key]).toBe(os.storage.asyncValueMap['objectKey'][key]);
        }

        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;
        os.storage.mock.lastValue = undefined;

        storage.get('notAKey')
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'absent key to be retrieved');

      runs(function() {
        expect(os.storage.mock.lastValue).toBeUndefined();
      });
    });
  });
};


/**
 * Base get tests for all asynchronous storage classes.
 * @param {os.storage.AsyncStorage} storage The asynchronous storage object
 * @param {boolean=} opt_supportsInterface If {@link os.storage.IMechanism} is supported.
 */
os.storage.runAsyncGetAllTests = function(storage, opt_supportsInterface) {
  var supportsInterface = opt_supportsInterface != null ? opt_supportsInterface : true;
  if (supportsInterface) {
    describe('get all', function() {
      it('should get all values from the storage', function() {
        storage.getAll()
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);

        waitsFor(function() {
          return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
        }, 'values to be retrieved');

        runs(function() {
          expect(os.storage.mock.ebCount).toBe(0);
          expect(os.storage.mock.lastValue).not.toBeNull();
          expect(os.storage.mock.lastValue.length).toBe(goog.object.getCount(os.storage.asyncValueMap));
        });
      });
    });
  }
};


/**
 * Base replace tests for all asynchronous storage classes.
 * @param {os.storage.AsyncStorage} storage The asynchronous storage object
 */
os.storage.runAsyncReplaceTests = function(storage) {
  describe('replace', function() {
    it('should only replace values when specified', function() {
      storage.set('numKey', 9000)
          .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'set to complete');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;

        storage.get('numKey')
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'get to complete');

      runs(function() {
        // value shouldn't change
        expect(os.storage.mock.lastValue).toBe(os.storage.asyncValueMap['numKey']);

        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;
        os.storage.mock.lastValue = undefined;

        storage.set('numKey', 9000, false)
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'set to complete');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;

        storage.get('numKey')
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'get to complete');

      runs(function() {
        // value shouldn't change
        expect(os.storage.mock.lastValue).toBe(os.storage.asyncValueMap['numKey']);

        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;
        os.storage.mock.lastValue = undefined;

        storage.set('numKey', 9000, true)
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'set to complete');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;

        storage.get('numKey')
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'get to complete');

      runs(function() {
        // value should change
        expect(os.storage.mock.lastValue).toBe(9000);
      });
    });
  });
};


/**
 * Base remove tests for all asynchronous storage classes.
 * @param {os.storage.AsyncStorage} storage The asynchronous storage object
 */
os.storage.runAsyncRemoveTests = function(storage) {
  describe('remove', function() {
    it('should remove keys from the database', function() {
      storage.remove('stringKey')
          .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      storage.remove('numKey')
          .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);

      waitsFor(function() {
        return os.storage.mock.cbCount > 1 || os.storage.mock.ebCount > 0;
      }, 'remove calls to complete');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(2);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;

        storage.get('stringKey')
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'get to complete');

      runs(function() {
        expect(os.storage.mock.lastValue).toBeUndefined();

        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;
        os.storage.mock.lastValue = undefined;

        storage.get('numKey')
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'get to complete');

      runs(function() {
        expect(os.storage.mock.lastValue).toBeUndefined();

        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;
        os.storage.mock.lastValue = undefined;
      });
    });
  });
};


/**
 * Base clear tests for all asynchronous storage classes.
 * @param {os.storage.AsyncStorage} storage The asynchronous storage object
 */
os.storage.runAsyncClearTests = function(storage) {
  describe('clear', function() {
    it('should clear storage', function() {
      storage.clear()
          .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'clear to complete');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        os.storage.mock.cbCount = os.storage.mock.ebCount = 0;

        storage.getAll()
            .addCallbacks(os.storage.mock.incrementCb, os.storage.mock.incrementEb);
      });

      waitsFor(function() {
        return os.storage.mock.cbCount > 0 || os.storage.mock.ebCount > 0;
      }, 'getAll to complete');

      runs(function() {
        expect(os.storage.mock.cbCount).toBe(1);
        expect(os.storage.mock.ebCount).toBe(0);
        expect(os.storage.mock.lastValue).not.toBeNull();
        expect(os.storage.mock.lastValue.length).toBe(0);
      });
    });
  });
};
