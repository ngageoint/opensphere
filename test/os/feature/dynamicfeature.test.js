goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.feature.DynamicFeature');


describe('os.feature.DynamicFeature', function() {
  it('initializes properly', function() {
    var df = new os.feature.DynamicFeature();
    expect(df instanceof ol.Feature).toBe(true);
    expect(df.initFn).toBe(goog.nullFunction);
    expect(df.disposeFn).toBe(goog.nullFunction);
    expect(df.updateFn).toBe(goog.nullFunction);

    var initFn = function() {};
    var disposeFn = function() {};
    var updateFn = function() {};
    var point = new ol.geom.Point([5, 10]);

    df = new os.feature.DynamicFeature(point, initFn, disposeFn, updateFn);
    expect(df.getGeometry()).toBe(point);
    expect(df.initFn).toBe(initFn);
    expect(df.disposeFn).toBe(disposeFn);
    expect(df.updateFn).toBe(updateFn);

    var props = {
      geometry: point,
      key1: 'value1',
      key2: 'value2'
    };

    df = new os.feature.DynamicFeature(props, initFn, disposeFn, updateFn);
    expect(df.getGeometry()).toBe(point);
    expect(df.get('key1')).toBe('value1');
    expect(df.get('key2')).toBe('value2');
    expect(df.initFn).toBe(initFn);
    expect(df.disposeFn).toBe(disposeFn);
    expect(df.updateFn).toBe(updateFn);
  });

  it('calls dynamic functions with the correct parameters', function() {
    var testFns = {
      init: function() {},
      dispose: function() {},
      update: function() {}
    };

    spyOn(testFns, 'init');
    spyOn(testFns, 'dispose');
    spyOn(testFns, 'update');

    var now = Date.now();

    var df = new os.feature.DynamicFeature(undefined, testFns.init, testFns.dispose, testFns.update);
    df.initDynamic();
    df.disposeDynamic(true);
    df.updateDynamic(now);

    expect(testFns.init).toHaveBeenCalledWith(df);
    expect(testFns.dispose).toHaveBeenCalledWith(df, true);
    expect(testFns.update).toHaveBeenCalledWith(df, now);
  });

  it('clones properly', function() {
    var initFn = function() {};
    var disposeFn = function() {};
    var updateFn = function() {};

    var point = new ol.geom.Point([5, 10]);
    var props = {
      geometry: point,
      key1: 'value1',
      key2: 'value2'
    };

    var df = new os.feature.DynamicFeature(props, initFn, disposeFn, updateFn);
    var clone = df.clone();
    expect(clone instanceof os.feature.DynamicFeature).toBe(true);
    expect(clone.getGeometry()).not.toBe(point);
    expect(clone.getGeometry().getCoordinates()).toEqual(point.getCoordinates());
    expect(clone.get('key1')).toBe('value1');
    expect(clone.get('key2')).toBe('value2');
    expect(clone.initFn).toBe(initFn);
    expect(clone.disposeFn).toBe(disposeFn);
    expect(clone.updateFn).toBe(updateFn);
  });
});
