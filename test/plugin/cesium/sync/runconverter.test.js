goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.runConverter');
goog.require('test.plugin.cesium.primitive');
goog.require('test.plugin.cesium.scene');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';
import {get} from 'ol/src/proj.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.cesium.sync.runConverter', () => {
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osProj = goog.module.get('os.proj');
  const {runConverter} = goog.module.get('plugin.cesium.sync.runConverter');
  const primitiveUtils = goog.module.get('test.plugin.cesium.primitive');
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');

  let feature;
  let geometry;
  let style;
  let layer;
  let scene;
  let context;

  beforeEach(() => {
    geometry = new Point([0, 0]);
    feature = new Feature(geometry);
    style = new Style();
    layer = new VectorLayer();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, get(osProj.EPSG4326));
  });

  it('should create the primitive if it does not exist', () => {
    const billboard = primitiveUtils.createBillboard([0, 0]);

    const converter = {
      create: (feature, geometry, style, context) => {
        context.addBillboard(billboard, feature, geometry);
        return true;
      },
      retrieve: () => undefined,
      update: () => false,
      delete: () => false
    };

    spyOn(converter, 'create').andCallThrough();
    spyOn(converter, 'retrieve').andCallThrough();
    spyOn(converter, 'update').andCallThrough();
    spyOn(converter, 'delete').andCallThrough();

    runConverter(converter, feature, geometry, style, context);

    expect(converter.create).toHaveBeenCalled();
    expect(converter.retrieve).toHaveBeenCalled();
    expect(converter.update).not.toHaveBeenCalled();
    expect(converter.delete).not.toHaveBeenCalled();

    expect(context.billboards.length).toBe(1);
  });

  it('should update the primitive if it exists', () => {
    const billboardOptions = primitiveUtils.createBillboard([0, 0]);
    context.addBillboard(billboardOptions, feature, geometry);
    const billboard = context.billboards.get(0);

    const converter = {
      create: () => false,
      retrieve: () => billboard,
      update: () => {
        billboard.dirty = false;
        return true;
      },
      delete: () => false
    };

    spyOn(converter, 'create').andCallThrough();
    spyOn(converter, 'retrieve').andCallThrough();
    spyOn(converter, 'update').andCallThrough();
    spyOn(converter, 'delete').andCallThrough();

    runConverter(converter, feature, geometry, style, context);

    expect(converter.create).not.toHaveBeenCalled();
    expect(converter.retrieve).toHaveBeenCalled();
    expect(converter.update).toHaveBeenCalled();
    expect(converter.delete).not.toHaveBeenCalled();

    expect(billboard.dirty).toBe(false);
  });

  it('should delete the primitive and recreate it if the update was unsuccessful', () => {
    const billboardOptions = primitiveUtils.createBillboard([0, 0]);
    context.addBillboard(billboardOptions, feature, geometry);
    const billboard = context.billboards.get(0);

    const converter = {
      create: () => {
        context.addBillboard(billboard, feature, geometry);
        return true;
      },
      retrieve: () => billboard,
      update: () => false,
      delete: () => {
        context.removePrimitive(billboard);
        return true;
      }
    };

    spyOn(converter, 'create').andCallThrough();
    spyOn(converter, 'retrieve').andCallThrough();
    spyOn(converter, 'update').andCallThrough();
    spyOn(converter, 'delete').andCallThrough();

    runConverter(converter, feature, geometry, style, context);

    expect(converter.create).toHaveBeenCalled();
    expect(converter.retrieve).toHaveBeenCalled();
    expect(converter.update).toHaveBeenCalled();
    expect(converter.delete).toHaveBeenCalled();

    expect(context.billboards.length).toBe(1);
    const newBillboard = context.billboards.get(0);
    expect(billboard).not.toBe(newBillboard);
  });
});
