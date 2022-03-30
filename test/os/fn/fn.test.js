goog.require('os.data.LayerNode');
goog.require('os.fn');
goog.require('os.layer.Image');
goog.require('os.layer.Tile');
goog.require('os.layer.Vector');
goog.require('os.proj');
goog.require('os.source.Vector');
goog.require('os.structs.TreeNode');
goog.require('plugin.xyz.XYZLayerConfig');

import {createEmpty} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';
import olSourceImage from 'ol/src/source/Image.js';

describe('os.fn', function() {
  const {default: LayerNode} = goog.module.get('os.data.LayerNode');
  const fn = goog.module.get('os.fn');
  const {default: Image} = goog.module.get('os.layer.Image');
  const {default: Tile} = goog.module.get('os.layer.Tile');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osProj = goog.module.get('os.proj');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const {default: TreeNode} = goog.module.get('os.structs.TreeNode');
  const {default: XYZLayerConfig} = goog.module.get('plugin.xyz.XYZLayerConfig');

  it('should filter falsey', function() {
    var list = [1, true, 'thing', {label: 'Test'}, /matchy/i, [0], 0, false, null, undefined, '']
        .filter(fn.filterFalsey);

    expect(list.length).toBe(6);
    expect(list).toContain(1);
    expect(list).toContain(true);
    expect(list).toContain('thing');
  });

  it('should reduce a combined extent from layers', function() {
    var layers = [];
    var source = new VectorSource();
    source.setId('a');
    var layer = new VectorLayer();
    layer.setSource(source);
    source.addFeature(new Feature(new Point([0, 0])));
    source.addFeature(new Feature(new Point([1, 1])));
    layers.push(layer);

    var config = new XYZLayerConfig();
    layers.push(config.createLayer({
      url: '/{z}/{y}/{x}.png',
      extent: [2, 2, 3, 3],
      extentProjection: osProj.EPSG4326
    }));

    source = new VectorSource();
    source.setId('b');
    layer = new VectorLayer();
    layer.setSource(source);
    source.addFeature(new Feature(new Point([-1, -1])));
    source.addFeature(new Feature(new Point([-2, -2])));
    layers.push(layer);

    var extent = layers.reduce(fn.reduceExtentFromLayers, createEmpty());
    expect(extent[0]).toBe(-2);
    expect(extent[1]).toBe(-2);
    expect(extent[2]).toBe(3);
    expect(extent[3]).toBe(3);
  });

  it('should reduce a combined extent from geometries', function() {
    var extent = [
      new Point([-1, -1]),
      new Point([-2, -2])].reduce(fn.reduceExtentFromGeometries, createEmpty());

    expect(extent[0]).toBe(-2);
    expect(extent[1]).toBe(-2);
    expect(extent[2]).toBe(-1);
    expect(extent[3]).toBe(-1);
  });

  it('should map layers to sources', function() {
    var source1 = new VectorSource({});
    var layer1 = new VectorLayer({
      source: source1
    });

    var source2 = new olSourceImage({});
    var layer2 = new Image({
      source: source2
    });

    var sources = [layer1, null, layer2, undefined].map(fn.mapLayerToSource);

    expect(sources[0]).toBe(source1);
    expect(sources[1]).toBe(undefined);
    expect(sources[2]).toBe(source2);
    expect(sources[3]).toBe(undefined);
  });

  it('should map a features to geometries', function() {
    var f1 = new Feature();
    var g1 = new Point([1, 1]);
    f1.setGeometry(g1);

    var f2 = new Feature();
    var g2 = new Point([2, 2]);
    f2.setGeometry(g2);

    var geoms = [f1, null, f2, undefined].map(fn.mapFeatureToGeometry);

    expect(geoms[0]).toBe(g1);
    expect(geoms[1]).toBe(undefined);
    expect(geoms[2]).toBe(g2);
    expect(geoms[3]).toBe(undefined);
  });

  it('should map nodes to layers', function() {
    var node1 = new LayerNode();
    var layer1 = new Tile();
    node1.setLayer(layer1);

    var node2 = new LayerNode();
    var layer2 = new VectorLayer();
    node2.setLayer(layer2);

    var node3 = new TreeNode();
    var layers = [node1, null, node2, undefined, node3].map(fn.mapNodeToLayer);

    expect(layers[0]).toBe(layer1);
    expect(layers[1]).toBe(undefined);
    expect(layers[2]).toBe(layer2);
    expect(layers[3]).toBe(undefined);
    expect(layers[4]).toBe(undefined);
  });
});
