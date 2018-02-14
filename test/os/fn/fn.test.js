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
    expect(extent[2]).toBe(3);
    expect(extent[3]).toBe(3);
  });

  it('should reduce a combined extent from geometries', function() {
    var extent = [
      new ol.geom.Point([-1, -1]),
      new ol.geom.Point([-2, -2])].reduce(os.fn.reduceExtentFromGeometries, ol.extent.createEmpty());

    expect(extent[0]).toBe(-2);
    expect(extent[1]).toBe(-2);
    expect(extent[2]).toBe(-1);
    expect(extent[3]).toBe(-1);
  });

  it('should map layers to sources', function() {
    var source1 = new os.source.Vector();
    var layer1 = new os.layer.Vector();
    layer1.setSource(source1);

    var source2 = new ol.layer.Image();
    var layer2 = new os.layer.Image({});
    layer2.setSource(source2);

    var sources = [layer1, null, layer2, undefined].map(os.fn.mapLayerToSource);

    expect(sources[0]).toBe(source1);
    expect(sources[1]).toBe(undefined);
    expect(sources[2]).toBe(source2);
    expect(sources[3]).toBe(undefined);
  });

  it('should map a features to geometries', function() {
    var f1 = new ol.Feature();
    var g1 = new ol.geom.Point([1, 1]);
    f1.setGeometry(g1);

    var f2 = new ol.Feature();
    var g2 = new ol.geom.Point([2, 2]);
    f2.setGeometry(g2);

    var geoms = [f1, null, f2, undefined].map(os.fn.mapFeatureToGeometry);

    expect(geoms[0]).toBe(g1);
    expect(geoms[1]).toBe(undefined);
    expect(geoms[2]).toBe(g2);
    expect(geoms[3]).toBe(undefined);
  });

  it('should map nodes to layers', function() {
    var node1 = new os.data.LayerNode();
    var layer1 = new os.layer.Tile();
    node1.setLayer(layer1);

    var node2 = new os.data.LayerNode();
    var layer2 = new os.layer.Vector();
    node2.setLayer(layer2);

    var node3 = new os.structs.TreeNode();
    var layers = [node1, null, node2, undefined, node3].map(os.fn.mapNodeToLayer);

    expect(layers[0]).toBe(layer1);
    expect(layers[1]).toBe(undefined);
    expect(layers[2]).toBe(layer2);
    expect(layers[3]).toBe(undefined);
    expect(layers[4]).toBe(undefined);
  });
});
