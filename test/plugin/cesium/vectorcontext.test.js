goog.require('goog.dispose');
goog.require('os.layer.Vector');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.primitive');
goog.require('test.plugin.cesium.primitive');
goog.require('test.plugin.cesium.scene');

import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import Point from 'ol/src/geom/Point.js';
import {fromExtent} from 'ol/src/geom/Polygon.js';
import {get} from 'ol/src/proj.js';
import {getUid} from 'ol/src/util.js';

describe('plugin.cesium.VectorContext', () => {
  const dispose = goog.module.get('goog.dispose');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osProj = goog.module.get('os.proj');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {isPrimitiveShown} = goog.module.get('plugin.cesium.primitive');
  const primitiveUtils = goog.module.get('test.plugin.cesium.primitive');
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');

  let layer;
  let scene;
  let context;

  beforeEach(() => {
    layer = new VectorLayer();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, get(osProj.EPSG4326));
  });

  describe('constructor', () => {
    it('should add the collections to the scene', () => {
      expect(context.noShowCollections.contains(context.billboards)).toBe(true);
      expect(context.noShowCollections.contains(context.labels)).toBe(true);
      expect(context.noShowCollections.contains(context.polylines)).toBe(true);
      expect(scene.primitives.contains(context.noShowCollections)).toBe(true);
      expect(scene.primitives.contains(context.primitives)).toBe(true);
      expect(scene.groundPrimitives.contains(context.groundPrimitives)).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should remove the collections from the scene', () => {
      context.dispose();

      expect(scene.primitives.contains(context.noShowCollections)).toBe(false);
      expect(scene.primitives.contains(context.primitives)).toBe(false);
      expect(scene.groundPrimitives.contains(context.groundPrimitives)).toBe(false);
    });

    it('should set destroyPrimitives when disposing collections', () => {
      context.dispose();

      expect(context.billboards.destroyPrimitives).toBe(true);
      expect(context.labels.destroyPrimitives).toBe(true);
      expect(context.polylines.destroyPrimitives).toBe(true);
      expect(context.primitives.destroyPrimitives).toBe(true);
      expect(context.groundPrimitives.destroyPrimitives).toBe(true);
    });
  });

  describe('isDiposed', () => {
    it('should return the proper disposed state', () => {
      expect(context.isDisposed()).toBe(false);
      context.dispose();
      expect(context.isDisposed()).toBe(true);
      context.dispose();
      expect(context.isDisposed()).toBe(true);
    });
  });

  describe('pruneMaps', () => {
    it('should prune undefined values from maps', () => {
      const maps = [
        context.featureToCesiumMap,
        context.geometryToCesiumMap,
        context.geometryToLabelMap,
        context.featureToShownMap];

      ['a', 'b', 'c'].forEach((key) => {
        maps.forEach((map) => {
          map[key] = undefined;
        });
      });

      context.pruneMaps();
      expect(Object.keys(context.featureToCesiumMap).length).toBe(0);
      expect(Object.keys(context.geometryToCesiumMap).length).toBe(0);
      expect(Object.keys(context.geometryToLabelMap).length).toBe(0);
      expect(Object.keys(context.featureToShownMap).length).toBe(0);
    });

    it('should clean up pick ids', () => {
      spyOn(scene.context, 'cleanupPickIds');
      context.pruneMaps();
      expect(scene.context.cleanupPickIds).toHaveBeenCalled();
    });
  });

  describe('addOLReferences', () => {
    let feature;
    let geometry;

    beforeEach(() => {
      geometry = new Point([0, 0]);
      feature = new Feature(geometry);
    });

    it('should handle undefined primitives', () => {
      expect(() => context.addOLReferences(null, feature, geometry)).not.toThrow();
    });

    it('should add references to the OpenLayers items on the primitive', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [5, 5], [0, 5]]);
      const rectangle = primitiveUtils.createPrimitive([-5, -5, 5, 5]);

      [billboard, polyline, rectangle].forEach((primitive) => {
        context.addOLReferences(primitive, feature, geometry);
        expect(primitive.olLayer).toBe(context.layer);
        expect(primitive.olFeature).toBe(feature);
        expect(primitive.olGeometry).toBe(geometry);
        expect(primitive.geomRevision).toBe(geometry.getRevision());
      });
    });
  });

  describe('removeOLReferences', () => {
    let feature;
    let geometry;

    beforeEach(() => {
      geometry = new Point([0, 0]);
      feature = new Feature(geometry);
    });

    it('should handle undefined primitives', () => {
      expect(() => context.removeOLReferences(null, feature, geometry)).not.toThrow();
    });

    it('should remove references to the OpenLayers items on the primitive', () => {
      let billboard = primitiveUtils.createBillboard([0, 0, 0]);
      let polyline = primitiveUtils.createPolyline([[0, 0], [5, 5], [0, 5]]);
      const rectangle = primitiveUtils.createPrimitive([-5, -5, 5, 5]);

      const billboardCollection = new Cesium.BillboardCollection();
      billboard = billboardCollection.add(billboard);

      const polylineCollection = new Cesium.PolylineCollection();
      polyline = polylineCollection.add(polyline);

      const primitiveCollection = new Cesium.PrimitiveCollection();
      primitiveCollection.add(rectangle);

      context.addOLReferences(billboardCollection, feature, geometry);
      context.addOLReferences(polylineCollection, feature, geometry);
      context.addOLReferences(primitiveCollection, feature, geometry);

      context.removeOLReferences(billboardCollection);
      context.removeOLReferences(polylineCollection);
      context.removeOLReferences(primitiveCollection);

      [billboardCollection, polylineCollection, primitiveCollection,
        billboard, polyline, rectangle].forEach((primitive, i) => {
        expect(primitive.olLayer).toBe(undefined);
        expect(primitive.olFeature).toBe(undefined);
        expect(primitive.olGeometry).toBe(undefined);
      });
    });
  });

  describe('markDirty', () => {
    let feature;
    beforeEach(() => {
      feature = new Feature(new Point([0, 0]));
    });

    it('should handle no associated primitives', () => {
      expect(() => context.markDirty(feature)).not.toThrow();
    });

    it('should mark associated items as dirty', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      context.featureToCesiumMap[feature.getUid()] = [billboard];
      context.markDirty(feature);
      expect(billboard.dirty).toBe(true);
    });
  });

  describe('removeDirty', () => {
    let feature;
    beforeEach(() => {
      feature = new Feature(new Point([0, 0]));
    });

    it('should handle no associated primitives', () => {
      expect(() => context.removeDirty(feature)).not.toThrow();
    });

    it('should remove items which are dirty', () => {
      const nasty = primitiveUtils.createBillboard([0, 0, 0]);
      nasty.dirty = true;
      const clean = primitiveUtils.createBillboard([0, 0, 0]);
      context.featureToCesiumMap[feature.getUid()] = [clean, nasty];
      spyOn(context, 'removePrimitive').andCallFake(() => undefined);
      context.removeDirty(feature);
      expect(context.removePrimitive.callCount).toBe(1);
      expect(context.removePrimitive.mostRecentCall.args[0]).toBe(nasty);
    });
  });

  describe('cleanup', () => {
    let feature;
    beforeEach(() => {
      feature = new Feature(new Point([0, 0]));
    });

    it('should handle no associated primitives', () => {
      expect(() => context.cleanup(feature)).not.toThrow();
    });

    it('should set references for its items to undefined and remove the items', () => {
      const billboard1 = primitiveUtils.createBillboard([0, 0, 0]);
      const billboard2 = primitiveUtils.createBillboard([0, 0, 0]);
      context.featureToCesiumMap[feature.getUid()] = [billboard1, billboard2];
      context.featureToShownMap[feature.getUid()] = [true, false];


      spyOn(context, 'removePrimitive').andCallFake(() => undefined);
      context.cleanup(feature);
      expect(context.featureToCesiumMap[feature.getUid()]).toBe(undefined);
      expect(context.featureToShownMap[feature.getUid()]).toBe(undefined);
      expect(context.removePrimitive.callCount).toBe(2);
    });
  });

  describe('addBillboard', () => {
    let feature;
    let geometry;

    beforeEach(() => {
      geometry = new Point([0, 0]);
      feature = new Feature(geometry);
    });

    it('should add a billboard properly', () => {
      const billboardOptions = primitiveUtils.createBillboard([0, 0, 0]);
      spyOn(context, 'addFeaturePrimitive').andReturn(undefined);
      spyOn(context, 'addOLReferences').andReturn(undefined);
      spyOn(context.billboards, 'add').andCallThrough();

      context.addBillboard(billboardOptions, feature, geometry);

      expect(context.billboards.add).toHaveBeenCalledWith(billboardOptions);
      expect(context.billboards.length).toBe(1);

      const billboard = context.billboards.get(0);
      expect(context.geometryToCesiumMap[getUid(geometry)]).toBe(billboard);
      expect(context.addFeaturePrimitive).toHaveBeenCalledWith(feature, billboard);
      expect(context.addOLReferences).toHaveBeenCalledWith(billboard, feature, geometry);
    });

    it('should not add a disposed feature', () => {
      const billboardOptions = primitiveUtils.createBillboard([0, 0, 0]);
      dispose(feature);
      context.addBillboard(billboardOptions, feature, geometry);
      expect(context.billboards.length).toBe(0);
      expect(context.geometryToCesiumMap[getUid(geometry)]).toBe(undefined);
    });
  });

  describe('addPolyline', () => {
    let feature;
    let geometry;

    beforeEach(() => {
      geometry = new LineString([[0, 0], [5, 5]]);
      feature = new Feature(geometry);
    });

    it('should add a polyline properly', () => {
      const polylineOptions = primitiveUtils.createPolyline(geometry.getCoordinates());
      spyOn(context, 'addFeaturePrimitive').andReturn(undefined);
      spyOn(context, 'addOLReferences').andReturn(undefined);
      spyOn(context.polylines, 'add').andCallThrough();

      context.addPolyline(polylineOptions, feature, geometry);

      expect(context.polylines.add).toHaveBeenCalledWith(polylineOptions);
      expect(context.polylines.length).toBe(1);

      const polyline = context.polylines.get(0);
      expect(context.geometryToCesiumMap[getUid(geometry)]).toBe(polyline);
      expect(context.addFeaturePrimitive).toHaveBeenCalledWith(feature, polyline);
      expect(context.addOLReferences).toHaveBeenCalledWith(polyline, feature, geometry);
    });

    it('should not add a disposed feature', () => {
      const polylineOptions = primitiveUtils.createPolyline(geometry.getCoordinates());
      dispose(feature);
      context.addPolyline(polylineOptions, feature, geometry);
      expect(context.polylines.length).toBe(0);
      expect(context.geometryToCesiumMap[getUid(geometry)]).toBe(undefined);
    });
  });

  describe('addPrimitive', () => {
    let feature;
    let geometry;

    beforeEach(() => {
      geometry = fromExtent([-5, -5, 5, 5]);
      feature = new Feature(geometry);
    });

    it('should add a primitive properly', () => {
      const primitive = primitiveUtils.createPrimitive(geometry.getExtent());
      spyOn(context, 'addFeaturePrimitive').andReturn(undefined);
      spyOn(context, 'addOLReferences').andReturn(undefined);
      spyOn(context.primitives, 'add').andCallThrough();

      context.addPrimitive(primitive, feature, geometry);

      expect(context.primitives.add).toHaveBeenCalledWith(primitive);
      expect(context.primitives.length).toBe(1);

      const addedPrimitive = context.primitives.get(0);
      expect(addedPrimitive).toBe(primitive);
      expect(context.geometryToCesiumMap[getUid(geometry)]).toBe(primitive);
      expect(context.addFeaturePrimitive).toHaveBeenCalledWith(feature, primitive);
      expect(context.addOLReferences).toHaveBeenCalledWith(primitive, feature, geometry);
    });

    it('should not add a disposed feature', () => {
      const primitive = primitiveUtils.createPrimitive(geometry.getExtent());
      dispose(feature);
      context.addPrimitive(primitive, feature, geometry);
      expect(context.primitives.length).toBe(0);
      expect(context.geometryToCesiumMap[getUid(geometry)]).toBe(undefined);
    });

    it('should add ground primitives to the correct collection', () => {
      const primitive = primitiveUtils.createGroundPrimitive(geometry.getExtent());
      spyOn(context, 'addFeaturePrimitive').andReturn(undefined);
      spyOn(context, 'addOLReferences').andReturn(undefined);
      spyOn(context.primitives, 'add').andCallThrough();
      spyOn(context.groundPrimitives, 'add').andCallThrough();

      context.addPrimitive(primitive, feature, geometry);

      expect(context.primitives.add).not.toHaveBeenCalled();
      expect(context.groundPrimitives.add).toHaveBeenCalledWith(primitive);
    });
  });

  describe('addLabel', () => {
    let feature;
    let geometry;

    beforeEach(() => {
      geometry = new Point([0, 0]);
      feature = new Feature(geometry);
    });

    it('should add a label properly', () => {
      const labelOptions = primitiveUtils.createLabelOptions();
      spyOn(context, 'addFeaturePrimitive').andReturn(undefined);
      spyOn(context, 'addOLReferences').andReturn(undefined);
      spyOn(context.labels, 'add').andCallThrough();

      context.addLabel(labelOptions, feature, geometry);

      expect(context.labels.add).toHaveBeenCalledWith(labelOptions);
      expect(context.labels.length).toBe(1);

      const label = context.labels.get(0);
      expect(context.geometryToLabelMap[getUid(geometry)]).toBe(label);
      expect(context.addFeaturePrimitive).toHaveBeenCalledWith(feature, label);
      expect(context.addOLReferences).toHaveBeenCalledWith(label, feature, geometry);
    });

    it('should not add a disposed feature', () => {
      const labelOptions = primitiveUtils.createLabelOptions();
      dispose(feature);
      context.addLabel(labelOptions, feature, geometry);
      expect(context.labels.length).toBe(0);
      expect(context.geometryToLabelMap[getUid(geometry)]).toBe(undefined);
    });
  });

  describe('removePrimitive', () => {
    let feature;
    let geometry;

    beforeEach(() => {
      geometry = new Point([0, 0]);
      feature = new Feature(geometry);
    });

    it('should remove each item type', () => {
      const billboardOptions = primitiveUtils.createBillboard([0, 0]);
      const labelOptions = primitiveUtils.createLabelOptions();
      const polylineOptions = primitiveUtils.createPolyline([[0, 0], [5, 5]]);
      const groundPrimitive = primitiveUtils.createGroundPrimitive([-5, -5, 5, 5]);
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);

      const billboard = context.billboards.add(billboardOptions);
      const label = context.labels.add(labelOptions);
      const polyline = context.polylines.add(polylineOptions);
      context.primitives.add(primitive);
      context.groundPrimitives.add(groundPrimitive);

      [billboard, label, polyline, groundPrimitive, primitive].forEach((item) => {
        context.addOLReferences(item, feature, geometry);
        context.addFeaturePrimitive(feature, item);
        context.geometryToCesiumMap[getUid(geometry)] = item;

        context.removePrimitive(item);

        if (item instanceof Cesium.Label) {
          expect(context.geometryToLabelMap[getUid(geometry)]).toBe(undefined);
        } else {
          expect(context.geometryToCesiumMap[getUid(geometry)]).toBe(undefined);
        }

        expect(context.featureToCesiumMap[feature.getUid()].length).toBe(0);
      });

      expect(context.billboards.length).toBe(0);
      expect(context.labels.length).toBe(0);
      expect(context.polylines.length).toBe(0);
      expect(context.primitives.length).toBe(0);
      expect(context.groundPrimitives.length).toBe(0);
    });
  });

  describe('getLabelForGeometry', () => {
    const geometry = new Point([0, 0]);

    it('should return null by default', () => {
      expect(context.getLabelForGeometry(geometry)).toBe(null);
    });

    it('should return a label if one exists', () => {
      const feature = new Feature(geometry);
      const labelOptions = primitiveUtils.createLabelOptions();
      context.addLabel(labelOptions, feature, geometry);

      const label = context.getLabelForGeometry(geometry);
      expect(label).toBeTruthy();
      expect(label instanceof Cesium.Label).toBe(true);
    });
  });

  describe('getPrimitiveForGeometry', () => {
    const geometry = new Point([0, 0]);

    it('should return undefined by default', () => {
      expect(context.getPrimitiveForGeometry(geometry)).toBe(undefined);
    });

    it('should return the primitive for the geometry if one exists', () => {
      const billboardOptions = primitiveUtils.createBillboard([0, 0, 0]);
      const feature = new Feature(geometry);
      context.addBillboard(billboardOptions, feature, geometry);
      const billboard = context.billboards.get(0);

      expect(context.getPrimitiveForGeometry(geometry)).toBe(billboard);
    });
  });

  describe('setVisibility', () => {
    it('should change the visibility of each collection', () => {
      const billboardOptions = primitiveUtils.createBillboard([0, 0]);
      const labelOptions = primitiveUtils.createLabelOptions();
      const polylineOptions = primitiveUtils.createPolyline([[0, 0], [5, 5]]);
      const groundPrimitive = primitiveUtils.createGroundPrimitive([-5, -5, 5, 5]);
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);

      context.billboards.add(billboardOptions);
      context.labels.add(labelOptions);
      context.polylines.add(polylineOptions);
      context.primitives.add(primitive);
      context.groundPrimitives.add(groundPrimitive);

      [true, false, true].forEach((visible) => {
        context.setVisibility(visible);
        expect(isPrimitiveShown(context.noShowCollections)).toBe(visible);
        expect(isPrimitiveShown(context.primitives)).toBe(visible);
        expect(isPrimitiveShown(context.groundPrimitives)).toBe(visible);
      });
    });
  });


  describe('eyeOffset', () => {
    it('should update billboard eyeOffsets', () => {
      const billboardOptions = primitiveUtils.createBillboard([0, 0]);
      const billboard = context.billboards.add(billboardOptions);

      const newEyeOffset = new Cesium.Cartesian3(0, 0, 1000);
      context.setEyeOffset(newEyeOffset);

      expect(context.eyeOffset).toEqual(newEyeOffset);
      expect(billboard.eyeOffset).toEqual(newEyeOffset);
    });

    it('should not update billboard eyeOffsets for same values', () => {
      const originalEyeOffset = context.eyeOffset;
      const newEyeOffset = new Cesium.Cartesian3(0, 0, 0);
      context.setEyeOffset(newEyeOffset);
      expect(context.eyeOffset).toBe(originalEyeOffset);
      expect(context.eyeOffset).not.toBe(newEyeOffset);
    });


    it('should update label eyeOffsets', () => {
      const labelOptions = primitiveUtils.createLabelOptions();
      const label = context.labels.add(labelOptions);

      const newEyeOffset = new Cesium.Cartesian3(0, 0, 1000);
      context.setLabelEyeOffset(newEyeOffset);

      expect(context.labelEyeOffset).toEqual(newEyeOffset);
      expect(label.eyeOffset).toEqual(newEyeOffset);
    });

    it('should not update label eyeOffsets for same values', () => {
      const originalEyeOffset = context.labelEyeOffset;
      const newEyeOffset = new Cesium.Cartesian3(0, 0, 0);
      context.setLabelEyeOffset(newEyeOffset);
      expect(context.labelEyeOffset).toBe(originalEyeOffset);
      expect(context.labelEyeOffset).not.toBe(newEyeOffset);
    });
  });

  describe('isFeatureShown', () => {
    const feature = new Feature();

    it('should default to true', () => {
      expect(context.isFeatureShown(feature)).toBe(true);
    });

    it('should report the value in the shown map if it exists', () => {
      context.featureToShownMap[feature.getUid()] = false;
      expect(context.isFeatureShown(feature)).toBe(false);
    });
  });
});
