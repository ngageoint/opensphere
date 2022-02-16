goog.require('goog.object');
goog.require('os');

describe('os.mixin.closure', function() {
  var myFn = function() {};

  var testArray = function(arr) {
    expect(arr.testFn).toBeDefined();
    expect(arr.hasOwnProperty('testFn')).toBe(false);
    expect(goog.object.getCount(arr)).toBe(3);
    expect(goog.object.getKeys(arr).length).toBe(3);
    expect(arr.length === goog.object.getValues(arr).length &&
        arr.every((el, i) => el === goog.object.getValues(arr)[i]));
    goog.object.forEach(arr, function(val, key) {
      expect(key).not.toBe('testFn');
    });
  };

  var testObject = function(obj, values) {
    expect(obj.testFn).toBeDefined();
    expect(obj.hasOwnProperty('testFn')).toBe(false);
    expect(goog.object.getCount(obj)).toBe(3);
    expect(goog.object.getKeys(obj).length).toBe(3);
    expect(goog.object.getValues(obj).length).toBe(3);
    expect(values.length === goog.object.getValues(obj).length &&
        values.every((el, i) => el === goog.object.getValues(obj)[i]));
    goog.object.forEach(obj, function(val, key) {
      expect(key).not.toBe('testFn');
    });
  };

  var compareArrays = function(arr1, arr2) {
    expect(arr1.length === arr2.length && arr1.every((el, i) => el === arr2[i]));
    expect(arr1.length === goog.object.getValues(arr2).length &&
        arr1.every((el, i) => el === goog.object.getValues(arr2)[i]));
  };

  var compareObjects = function(obj1, obj2) {
    expect(goog.object.equals(obj1, obj2));
    var obj1Keys = goog.object.getKeys(obj1);
    var obj2Keys = goog.object.getKeys(obj2);
    expect(obj1Keys.length === obj2Keys.length && obj1Keys.every((el, i) => el === obj2Keys[i])).toBe(true);
    var obj1Values = goog.object.getValues(obj1);
    var obj2Values = goog.object.getValues(obj2);
    expect(obj1Values.length === obj2Values.length && obj1Values.every((el, i) => el === obj2Values[i])).toBe(true);
  };

  it('works with array polyfills', function() {
    Array.prototype.testFn = myFn; // eslint-disable-line no-extend-native

    var original = [1, 2, 3];
    testArray(original);

    // make sure clone ignores polyfills
    var clone = Array.from(original);
    testArray(clone);
    compareArrays(original, clone);

    delete Array.prototype.testFn;
  });

  // any for-in loop on objects will fail if we use polyfills, so it's actually not supported by our code. we don't
  // currently have object polyfills, so this test is disabled.
  xit('works with object polyfills', function() {
    Object.prototype.testFn = myFn; // eslint-disable-line no-extend-native
    expect(goog.object.isEmpty({})).toBe(true);

    var original = {
      prop1: 'test',
      prop2: 42,
      prop3: true
    };
    expect(goog.object.isEmpty(original)).toBe(false);
    testObject(original, ['test', 42, true]);

    // make sure clone ignores polyfills
    var clone = goog.object.clone(original);
    testObject(clone, ['test', 42, true]);
    compareObjects(original, clone);

    // make sure unsafeClone ignores polyfills
    var unsafeClone = goog.object.unsafeClone(original);
    testObject(unsafeClone, ['test', 42, true]);
    compareObjects(original, unsafeClone);
    compareObjects(clone, unsafeClone);

    delete Object.prototype.testFn;
  });
});
