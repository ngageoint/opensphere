goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.proj');
goog.require('ol.style.Style');
goog.require('os.data.RecordField');
goog.require('os.layer.Vector');
goog.require('os.proj');
goog.require('os.webgl');
goog.require('plugin.cesium');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync');
goog.require('test.plugin.cesium.primitive');
goog.require('test.plugin.cesium.scene');

describe('plugin.cesium.sync', () => {
  const syncUtils = goog.module.get('plugin.cesium.sync');
  const primitiveUtils = goog.module.get('test.plugin.cesium.primitive');
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');

  describe('getPrimitive', () => {
    it('should retrieve the primitive', () => {
      const scene = getFakeScene();
      const layer = new os.layer.Vector();
      const context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));

      const geometry = new ol.geom.Point([0, 0]);
      const feature = new ol.Feature(geometry);
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);

      context.geometryToCesiumMap[ol.getUid(geometry)] = billboard;
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
      geometry = new ol.geom.Point([0, 0]);
      feature = new ol.Feature(geometry);
      style = new ol.style.Style();
      layer = new os.layer.Vector();
      scene = getFakeScene();
      context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));
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
      geometry.set(os.data.RecordField.ALTITUDE_MODE, os.webgl.AltitudeMode.CLAMP_TO_GROUND);
      expect(syncUtils.shouldUpdatePrimitive(feature, geometry, style, context, billboard)).toBe(true);
    });

    it('should not allow updates on other items changing altitude modes', () => {
      const primitive = primitiveUtils.createPrimitive([-5, -5, 5, 5]);
      const polyline = primitiveUtils.createPolyline([[0, 0], [10, 10]]);

      geometry.set(os.data.RecordField.ALTITUDE_MODE, os.webgl.AltitudeMode.CLAMP_TO_GROUND);
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
      geometry = new ol.geom.Point([0, 0]);
      feature = new ol.Feature(geometry);
      style = new ol.style.Style();
      layer = new os.layer.Vector();
      scene = getFakeScene();
      context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));

      // switch the delay to 1ms so that we don't have to wait so long to test
      // multiple tries
      const oldStart = goog.async.Delay.prototype.start;
      spyOn(goog.async.Delay.prototype, 'start').andCallFake(function(interval) {
        oldStart.call(this, 1);
      });

      isDestroyed = false;
      isDisposed = false;
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

      geometry.set(os.data.RecordField.ALTITUDE_MODE, os.webgl.AltitudeMode.CLAMP_TO_GROUND);
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

      waitsFor(() => primitive.updateRetries == 5, 1000, '5 retries');

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
      goog.dispose(feature);
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
      const layer = new os.layer.Vector();
      const context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));

      const geometry = new ol.geom.Point([0, 0]);
      const feature = new ol.Feature(geometry);
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);

      context.geometryToCesiumMap[ol.getUid(geometry)] = billboard;
      context.addFeaturePrimitive(feature, billboard);
      context.addOLReferences(billboard, feature, geometry);

      expect(syncUtils.deletePrimitive(feature, geometry, undefined, context, billboard)).toBe(true);
      expect(syncUtils.getPrimitive(feature, geometry, undefined, context)).toBe(null);
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
      expect(result.options.geometryInstances.id).toBe(plugin.cesium.GeometryInstanceId.GEOM);
    });

    it('should use an outline ID when an outline is provided', () => {
      const result = syncUtils.createColoredPrimitive(geometry, color, 3, undefined, MockPrimitive);
      expect(result.options.geometryInstances.id).toBe(plugin.cesium.GeometryInstanceId.GEOM_OUTLINE);
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
        id: plugin.cesium.GeometryInstanceId.GEOM,
        geometry,
        color
      });
    });
  });
});
