goog.require('goog.object');
goog.require('os');

describe('os.mixin.closure', function() {
  var myFn = function() {};

  var testArray = function(arr) {
    expect(arr.testFn).toBeDefined();
    expect(arr.hasOwnProperty('testFn')).toBe(false);
    expect(goog.object.getCount(arr)).toBe(3);
    expect(goog.object.getKeys(arr).length).toBe(3);
    expect(goog.array.equals(arr, goog.object.getValues(arr)));
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
    expect(goog.array.equals(goog.object.getValues(obj), values));
    goog.object.forEach(obj, function(val, key) {
      expect(key).not.toBe('testFn');
    });
  };

  var compareArrays = function(arr1, arr2) {
    expect(goog.array.equals(arr1, arr2));
    expect(goog.array.equals(arr1, goog.object.getValues(arr2)));
  };

  var compareObjects = function(obj1, obj2) {
    expect(goog.object.equals(obj1, obj2));
    expect(goog.array.equals(goog.object.getKeys(obj1), goog.object.getKeys(obj2))).toBe(true);
    expect(goog.array.equals(goog.object.getValues(obj1), goog.object.getValues(obj2))).toBe(true);
  };

  it('works with array polyfills', function() {
    Array.prototype.testFn = myFn;

    var original = [1, 2, 3];
    testArray(original);

    // make sure clone ignores polyfills
    var clone = goog.array.clone(original);
    testArray(clone);
    compareArrays(original, clone);

    delete Array.prototype.testFn;
  });

  // any for-in loop on objects will fail if we use polyfills, so it's actually not supported by our code. we don't
  // currently have object polyfills, so this test is disabled.
  xit('works with object polyfills', function() {
    Object.prototype.testFn = myFn;
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
