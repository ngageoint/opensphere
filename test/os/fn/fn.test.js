goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.geom.Point');
goog.require('os.fn');
goog.require('os.layer.Vector');
goog.require('os.source.Vector');
goog.require('plugin.xyz.XYZLayerConfig');

describe('os.fn', function() {
  it('should filter falsey', function() {
    var list = [1, true, 'thing', {label: 'Test'}, /matchy/i, [0], 0, false, null, undefined, ''].
      filter(os.fn.filterFalsey);

    expect(list.length).toBe(6);
    expect(list).toContain(1);
    expect(list).toContain(true);
    expect(list).toContain('thing');
  });

  it('should reduce a combined extent from layers', function() {
    var layers = [];
    var source = new os.source.Vector();
    source.setId('a');
    var layer = new os.layer.Vector();
    layer.setSource(source);
    source.addFeature(new ol.Feature(new ol.geom.Point([0, 0])));
    source.addFeature(new ol.Feature(new ol.geom.Point([1, 1])));
    layers.push(layer);

    // this one should be ignored
    var config = new plugin.xyz.XYZLayerConfig();
    layers.push(config.createLayer({
      url: '/{z}/{y}/{x}.png',
      extent: [2, 2, 3, 3],
      extentProjection: os.proj.EPSG4326
    }));

    source = new os.source.Vector();
    source.setId('b');
    layer = new os.layer.Vector();
    layer.setSource(source);
    source.addFeature(new ol.Feature(new ol.geom.Point([-1, -1])));
    source.addFeature(new ol.Feature(new ol.geom.Point([-2, -2])));
    layers.push(layer);

    var extent = layers.reduce(os.fn.reduceExtentFromLayers, ol.extent.createEmpty());
    expect(extent[0]).toBe(-2);
    expect(extent[1]).toBe(-2);
    expect(extent[2]).toBe(1);
    expect(extent[3]).toBe(1);
  });
});
