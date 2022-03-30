goog.require('goog.async.Delay');
goog.require('goog.dispose');
goog.require('os.data.RecordField');
goog.require('os.layer.Vector');
goog.require('os.proj');
goog.require('os.webgl.AltitudeMode');
goog.require('plugin.cesium');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.primitive');
goog.require('test.plugin.cesium.primitive');
goog.require('test.plugin.cesium.scene');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';
import {get} from 'ol/src/proj.js';
import Style from 'ol/src/style/Style.js';
import {getUid} from 'ol/src/util.js';

describe('plugin.cesium.primitive', () => {
  const dispose = goog.module.get('goog.dispose');
  const Delay = goog.module.get('goog.async.Delay');

  const {default: RecordField} = goog.module.get('os.data.RecordField');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osProj = goog.module.get('os.proj');
  const {default: AltitudeMode} = goog.module.get('os.webgl.AltitudeMode');

  const {GeometryInstanceId} = goog.module.get('plugin.cesium');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const syncUtils = goog.module.get('plugin.cesium.primitive');
  const primitiveUtils = goog.module.get('test.plugin.cesium.primitive');
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');

  describe('getPrimitive', () => {
    it('should retrieve the primitive', () => {
      const scene = getFakeScene();
      const layer = new VectorLayer();
      const context = new VectorContext(scene, layer, get(osProj.EPSG4326));

      const geometry = new Point([0, 0]);
      const feature = new Feature(geometry);
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);

      context.geometryToCesiumMap[getUid(geometry)] = billboard;
      context.addFeaturePrimitive(feature, billboard);
      context.addOLReferences(billboard, feature, geometry);

      expect(syncUtils.getPrimitive(feature, geometry, undefined, context)).toBe(billboard);
    });
  });

  describe('shouldUpdatePrimitive', () => {
    let feature;
    let geometry;
    let style;
    let layer;
    let context;
    let scene;

    beforeEach(() => {
      geometry = new Point([0, 0]);
      feature = new Feature(geometry);
      style = new Style();
      layer = new VectorLayer();
      scene = getFakeScene();
      context = new VectorContext(scene, layer, get(osProj.EPSG4326));
    });

    it('should allow updates on everything for unchanged altitude modes', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const pointPrimitive = primitiveUtils.createPointPrimitive([0, 0]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      [billboard, primitive, pointPrimitive, polyline].forEach((item) =>
        expect(syncUtils.shouldUpdatePrimitive(feature, geometry, style, context, item)).toBe(true));
    });

    it('should allow updates on billboards changing altitude modes', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      geometry.set(RecordField.ALTITUDE_MODE, AltitudeMode.CLAMP_TO_GROUND);
      expect(syncUtils.shouldUpdatePrimitive(feature, geometry, style, context, billboard)).toBe(true);
    });

    it('should not allow updates on other items changing altitude modes', () => {
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      geometry.set(RecordField.ALTITUDE_MODE, AltitudeMode.CLAMP_TO_GROUND);
      [primitive, polyline].forEach((item) =>
        expect(syncUtils.shouldUpdatePrimitive(feature, geometry, style, context, item)).toBe(false));
    });
  });

  describe('updatePrimitive', () => {
    let feature;
    let geometry;
    let style;
    let layer;
    let context;
    let scene;

    let isDestroyed;
    let getGeometryInstanceAttributes;
    let primitive;
    let material;

    beforeEach(() => {
      geometry = new Point([0, 0]);
      feature = new Feature(geometry);
      style = new Style();
      layer = new VectorLayer();
      scene = getFakeScene();
      context = new VectorContext(scene, layer, get(osProj.EPSG4326));

      // switch the delay to 1ms so that we don't have to wait so long to test
      // multiple tries
      const oldStart = Delay.prototype.start;
      spyOn(Delay.prototype, 'start').andCallFake(function(interval) {
        oldStart.call(this, 1);
      });

      isDestroyed = false;
      getGeometryInstanceAttributes = () => null;
      material = null;

      primitive = {
        getGeometryInstanceAttributes,
        isDestroyed: () => isDestroyed,
        appearance: {
          material
        }
      };
    });

    it('should skip updates on items that don\'t pass shouldUpdatePrimitive', () => {
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      geometry.set(RecordField.ALTITUDE_MODE, AltitudeMode.CLAMP_TO_GROUND);
      [primitive, polyline].forEach((item) =>
        expect(syncUtils.updatePrimitive(feature, geometry, style, context, item)).toBe(false));
    });

    it('should retry updating primitives for a maximum of 20 tries before giving up', () => {
      runs(() => {
        expect(syncUtils.updatePrimitive(feature, geometry, style, context, primitive)).toBe(true);
        expect(primitive.updateRetries).toBe(1);
        expect(primitive.dirty).toBe(false);
      });

      waitsFor(() => primitive.updateRetries == 20, 200, '20 retries');

      let waitFinished = false;
      runs(() => {
        expect(primitive.updateRetries).toBe(20);
        setInterval(() => waitFinished = true, 10);
      });

      waitsFor(() => waitFinished, 20);

      runs(() => {
        expect(primitive.updateRetries).toBe(20);
        expect(primitive.dirty).toBe(false);
      });
    });

    it('should stop retrying when the primitive is ready', () => {
      runs(() => {
        expect(syncUtils.updatePrimitive(feature, geometry, style, context, primitive)).toBe(true);
        expect(primitive.updateRetries).toBe(1);
      });

      waitsFor(() => primitive.updateRetries >= 5, '5 retries');

      let waitFinished = false;
      runs(() => {
        primitive.ready = true;
        setInterval(() => waitFinished = true, 10);
      });

      waitsFor(() => waitFinished, 20);

      runs(() => {
        expect(primitive.updateRetries).toBe(0);
        expect(primitive.dirty).toBe(false);
      });
    });

    it('should stop retrying disposed primitives and mark them for removal', () => {
      primitive.ready = true;
      dispose(feature);
      expect(syncUtils.updatePrimitive(feature, geometry, style, context, primitive)).toBe(true);
      expect(primitive.dirty).toBe(true);
    });

    it('should stop retrying destroyed primitives and mark them for removal', () => {
      primitive.ready = true;
      isDestroyed = true;
      expect(syncUtils.updatePrimitive(feature, geometry, style, context, primitive)).toBe(true);
      expect(primitive.dirty).toBe(true);
    });
  });

  describe('deletePrimitive', () => {
    it('should delete the primitive', () => {
      const scene = getFakeScene();
      const layer = new VectorLayer();
      const context = new VectorContext(scene, layer, get(osProj.EPSG4326));

      const geometry = new Point([0, 0]);
      const feature = new Feature(geometry);
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);

      context.geometryToCesiumMap[getUid(geometry)] = billboard;
      context.addFeaturePrimitive(feature, billboard);
      context.addOLReferences(billboard, feature, geometry);

      expect(syncUtils.deletePrimitive(feature, geometry, undefined, context, billboard)).toBe(true);
      expect(syncUtils.getPrimitive(feature, geometry, undefined, context)).toBe(undefined);
    });
  });

  describe('createColoredPrimitive', () => {
    const MockPrimitive = function(options) {
      this.options = options;
    };

    const geometry = new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromDegrees(-5, -5, 5, 5)
    });

    const color = Cesium.Color.BLUE;

    it('should create a primitive', () => {
      const result = syncUtils.createColoredPrimitive(geometry, color);
      expect(result instanceof Cesium.Primitive).toBe(true);
    });

    it('should clone the appearance options', () => {
      spyOn(Cesium, 'PerInstanceColorAppearance');
      syncUtils.createColoredPrimitive(geometry, color);
      expect(Cesium.PerInstanceColorAppearance.mostRecentCall.args[0]).not.toBe(syncUtils.BASE_PRIMITIVE_OPTIONS);
      expect(Cesium.PerInstanceColorAppearance.mostRecentCall.args[0]).toEqual(syncUtils.BASE_PRIMITIVE_OPTIONS);
    });

    it('should assume a geometry ID rather than an outline', () => {
      const result = syncUtils.createColoredPrimitive(geometry, color, undefined, undefined, MockPrimitive);
      expect(result.options.geometryInstances.id).toBe(GeometryInstanceId.GEOM);
    });

    it('should use an outline ID when an outline is provided', () => {
      const result = syncUtils.createColoredPrimitive(geometry, color, 3, undefined, MockPrimitive);
      expect(result.options.geometryInstances.id).toBe(GeometryInstanceId.GEOM_OUTLINE);
    });

    it('should add the line width to the appearance renderState', () => {
      spyOn(Cesium, 'PerInstanceColorAppearance');
      syncUtils.createColoredPrimitive(geometry, color, 1);
      expect(Cesium.PerInstanceColorAppearance.mostRecentCall.args[0].renderState.lineWidth).toBe(1);
    });

    it('should clamp the line width to the minimum supported width', () => {
      spyOn(Cesium, 'PerInstanceColorAppearance');
      syncUtils.createColoredPrimitive(geometry, color, Cesium.ContextLimits.minimumAliasedLineWidth - 1);
      expect(Cesium.PerInstanceColorAppearance.mostRecentCall.args[0].renderState.lineWidth)
          .toBe(Cesium.ContextLimits.minimumAliasedLineWidth);
    });

    it('should clamp the line width to the maximum supported width', () => {
      spyOn(Cesium, 'PerInstanceColorAppearance');
      syncUtils.createColoredPrimitive(geometry, color, Cesium.ContextLimits.maximumAliasedLineWidth + 1);
      expect(Cesium.PerInstanceColorAppearance.mostRecentCall.args[0].renderState.lineWidth)
          .toBe(Cesium.ContextLimits.maximumAliasedLineWidth);
    });

    it('should support custom instance creation functions', () => {
      const customCreate = (id, geometry, color) => ({id, geometry, color});
      const result = syncUtils.createColoredPrimitive(geometry, color, undefined, customCreate, MockPrimitive);
      expect(result.options.geometryInstances).toEqual({
        id: GeometryInstanceId.GEOM,
        geometry,
        color
      });
    });
  });

  const {isGroundPrimitive, isPrimitiveShown, setPrimitiveShown} = goog.module.get('plugin.cesium.primitive');

  describe('isGroundPrimitive', () => {
    it('should not detect normal primitives as ground primitives', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const pointPrimitive = primitiveUtils.createPointPrimitive([0, 0]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      expect(isGroundPrimitive(primitive)).toBe(false);
      expect(isGroundPrimitive(pointPrimitive)).toBe(false);
      expect(isGroundPrimitive(billboard)).toBe(false);
      expect(isGroundPrimitive(polyline)).toBe(false);

      const primitiveCollection = new Cesium.PrimitiveCollection();
      expect(isGroundPrimitive(primitiveCollection)).toBe(false);
      primitiveCollection.add(primitive);
      expect(isGroundPrimitive(primitiveCollection)).toBe(false);

      const billboardCollection = new Cesium.BillboardCollection();
      expect(isGroundPrimitive(billboardCollection)).toBe(false);
      billboardCollection.add(billboard);
      expect(isGroundPrimitive(billboardCollection)).toBe(false);

      const polylineCollection = new Cesium.PolylineCollection();
      expect(isGroundPrimitive(polylineCollection)).toBe(false);
      polylineCollection.add(polyline);
      expect(isGroundPrimitive(polylineCollection)).toBe(false);
    });

    it('should detect ground primitives', () => {
      const groundPrimitive = primitiveUtils.createGroundPrimitive([0, 0, 10, 10]);
      expect(isGroundPrimitive(groundPrimitive)).toBe(true);
      const groundPolyline = primitiveUtils.createGroundPolylinePrimitive([[0, 0], [10, 10]]);
      expect(isGroundPrimitive(groundPolyline)).toBe(true);

      // Should return false for collections regardless of content
      const primitiveCollection = new Cesium.PrimitiveCollection();
      expect(isGroundPrimitive(primitiveCollection)).toBe(false);
      primitiveCollection.add(groundPrimitive);
      expect(isGroundPrimitive(primitiveCollection)).toBe(false);
      primitiveCollection.removeAll();
      primitiveCollection.add(groundPolyline);
      expect(isGroundPrimitive(primitiveCollection)).toBe(false);
    });
  });

  describe('isPrimitiveShown', () => {
    it('should read generic primitives directly', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const pointPrimitive = primitiveUtils.createPointPrimitive([0, 0]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      const genericPrimitives = [billboard, primitive, pointPrimitive, polyline];

      genericPrimitives.forEach((item) => {
        item.show = true;
        expect(isPrimitiveShown(item)).toBe(item.show);
        item.show = false;
        expect(isPrimitiveShown(item)).toBe(item.show);
      });

      expect(isPrimitiveShown([])).toBe(true);
      expect(isPrimitiveShown(genericPrimitives)).toBe(false);
      billboard.show = true;
      expect(isPrimitiveShown(genericPrimitives)).toBe(true);
    });

    it('should default primitive collections to shown', () => {
      const billboardCollection = new Cesium.BillboardCollection();
      const polylineCollection = new Cesium.PolylineCollection();

      const collections = [billboardCollection, polylineCollection];
      collections.forEach((collection) => {
        expect(isPrimitiveShown(collection)).toBe(true);
      });
    });

    it('should get the shown value of collections', () => {
      const billboardCollection = new Cesium.BillboardCollection();
      const polylineCollection = new Cesium.PolylineCollection();

      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      billboard.show = false;
      billboardCollection.add(billboard);

      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);
      polyline.show = false;
      polylineCollection.add(polyline);

      const collections = [billboardCollection, polylineCollection];
      collections.forEach((collection) => {
        expect(isPrimitiveShown(collection)).toBe(true);

        collection.show = false;
        expect(isPrimitiveShown(collection)).toBe(false);
      });
    });
  });

  describe('setPrimitiveShown', () => {
    it('should set generic primitives directly', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const pointPrimitive = primitiveUtils.createPointPrimitive([0, 0]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      // We are considering anything which directly implements a "show" field as "generic"
      const primitiveCollection = new Cesium.PrimitiveCollection();
      primitiveCollection.add(primitive);

      const genericPrimitives = [billboard, primitive, pointPrimitive, polyline, primitiveCollection];

      genericPrimitives.forEach((item) => {
        setPrimitiveShown(item, false);
        expect(isPrimitiveShown(item)).toBe(false);
        setPrimitiveShown(item, true);
        expect(isPrimitiveShown(item)).toBe(true);
      });

      setPrimitiveShown(genericPrimitives, false);
      expect(isPrimitiveShown(genericPrimitives)).toBe(false);
      setPrimitiveShown(genericPrimitives, true);
      expect(isPrimitiveShown(genericPrimitives)).toBe(true);
    });

    it('should set the shown value of collections', () => {
      const billboardCollection = new Cesium.BillboardCollection();
      const billboard1 = primitiveUtils.createBillboard([0, 0, 0]);
      const billboard2 = primitiveUtils.createBillboard([1, 1, 1]);
      billboardCollection.add(billboard1);
      billboardCollection.add(billboard2);

      const polylineCollection = new Cesium.PolylineCollection();
      const polyline1 = primitiveUtils.createPolyline([[0, 0], [10, 10]]);
      const polyline2 = primitiveUtils.createPolyline([[-20, 20], [10, 10]]);
      polylineCollection.add(polyline1);
      polylineCollection.add(polyline2);

      const collections = [billboardCollection, polylineCollection];
      collections.forEach((collection) => {
        setPrimitiveShown(collection, false);
        expect(isPrimitiveShown(collection)).toBe(false);
        for (let i = 0, n = collection.length; i < n; i++) {
          expect(isPrimitiveShown(collection.get(i))).toBe(true);
        }

        setPrimitiveShown(collection, true);
        expect(isPrimitiveShown(collection)).toBe(true);
        for (let i = 0, n = collection.length; i < n; i++) {
          expect(isPrimitiveShown(collection.get(i))).toBe(true);
        }
      });
    });
  });
});
