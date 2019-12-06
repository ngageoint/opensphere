goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('os.data.RecordField');
goog.require('os.mock');
goog.require('os.source.Vector');
goog.require('os.webgl');
goog.require('plugin.cesium.sync.HeightReference');

describe('plugin.cesium.sync.HeightReference', () => {
  const {getHeightReference, isPrimitiveClassTypeChanging} = goog.module.get('plugin.cesium.sync.HeightReference');
  const primitiveUtils = goog.module.get('test.plugin.cesium.primitive');

  describe('getHeightReference', () => {
    const altModeField = os.data.RecordField.ALTITUDE_MODE;
    let geometry;
    let feature;
    let source;
    let layer;

    beforeEach(() => {
      geometry = new ol.geom.Point([0, 0]);
      feature = new ol.Feature(geometry);
      source = new os.source.Vector();
      layer = new ol.layer.Vector();

      layer.setSource(source);
      source.addFeature(feature);
    });

    it('should default to absolute', () => {
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.NONE);
    });

    it('should prefer altitude mode from the geometry', () => {
      geometry.set(altModeField, os.webgl.AltitudeMode.RELATIVE_TO_GROUND);
      feature.set(altModeField, os.webgl.AltitudeMode.ABSOLUTE);
      layer.set(altModeField, os.webgl.AltitudeMode.ABSOLUTE);
      source.setAltitudeMode(os.webgl.AltitudeMode.ABSOLUTE);

      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.RELATIVE_TO_GROUND);
    });

    it('should prefer altitude mode from the feature if not on the geometry', () => {
      feature.set(altModeField, os.webgl.AltitudeMode.CLAMP_TO_GROUND);
      layer.set(altModeField, os.webgl.AltitudeMode.ABSOLUTE);
      source.setAltitudeMode(os.webgl.AltitudeMode.ABSOLUTE);
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.CLAMP_TO_GROUND);
    });

    it('should prefer altitude mode the layer if not on the feature', () => {
      layer.set(altModeField, os.webgl.AltitudeMode.RELATIVE_TO_GROUND);
      source.setAltitudeMode(os.webgl.AltitudeMode.ABSOLUTE);
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.RELATIVE_TO_GROUND);
    });

    it('should prefer altitude mode from the source if not on the layer', () => {
      source.setAltitudeMode(os.webgl.AltitudeMode.CLAMP_TO_GROUND);
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.CLAMP_TO_GROUND);
    });

    it('should not check altitude mode from non-opensphere source implementations', () => {
      const otherSource = new ol.source.Vector();
      const otherLayer = new ol.layer.Vector();
      otherLayer.setSource(otherSource);
      expect(getHeightReference(otherLayer, feature, geometry)).toBe(Cesium.HeightReference.NONE);
    });

    it('should default to the first index in an altitude mode array', () => {
      geometry.set(altModeField, [os.webgl.AltitudeMode.CLAMP_TO_GROUND, os.webgl.AltitudeMode.RELATIVE_TO_GROUND]);
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.CLAMP_TO_GROUND);
    });

    it('should get the altitude mode at the given index', () => {
      geometry.set(altModeField, [os.webgl.AltitudeMode.CLAMP_TO_GROUND, os.webgl.AltitudeMode.RELATIVE_TO_GROUND]);
      expect(getHeightReference(layer, feature, geometry, 1)).toBe(Cesium.HeightReference.RELATIVE_TO_GROUND);
    });

    it('should default out of range indexes to absolute', () => {
      geometry.set(altModeField, [os.webgl.AltitudeMode.CLAMP_TO_GROUND, os.webgl.AltitudeMode.RELATIVE_TO_GROUND]);
      expect(getHeightReference(layer, feature, geometry, 2)).toBe(Cesium.HeightReference.NONE);
      expect(getHeightReference(layer, feature, geometry, -1)).toBe(Cesium.HeightReference.NONE);
    });
  });

  describe('isPrimitiveClassTypeChanging', () => {
    const heightReferences = [
      Cesium.HeightReference.NONE,
      Cesium.HeightReference.CLAMP_TO_GROUND,
      Cesium.HeightReference.RELATIVE_TO_GROUND];

    it('should never be true for billboards', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      heightReferences.forEach((heightReference) => {
        expect(isPrimitiveClassTypeChanging(heightReference, billboard)).toBe(false);
      });
    });

    it('should never be true for point primitives', () => {
      const point = primitiveUtils.createPointPrimitive([0, 0, 0]);
      heightReferences.forEach((heightReference) => {
        expect(isPrimitiveClassTypeChanging(heightReference, point)).toBe(false);
      });
    });

    it('should always be false for billboard collections', () => {
      const billboard = primitiveUtils.createBillboard([0, 0, 0]);
      const billboardCollection = new Cesium.BillboardCollection();
      billboardCollection.add(billboard);

      heightReferences.forEach((heightReference) => {
        expect(isPrimitiveClassTypeChanging(heightReference, billboardCollection)).toBe(false);
      });
    });

    it('should report changing when primitives move from clampToGround to something else', () => {
      const primitive = primitiveUtils.createGroundPrimitive([-2, -2, 2, 2]);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.CLAMP_TO_GROUND, primitive)).toBe(false);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.RELATIVE_TO_GROUND, primitive)).toBe(true);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.NONE, primitive)).toBe(true);
    });

    it('should report changes in primitive collections moving from clampToGround to something else', () => {
      const child = primitiveUtils.createGroundPrimitive([-2, -2, 2, 2]);
      const primitive = new Cesium.PrimitiveCollection();
      primitive.add(child);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.CLAMP_TO_GROUND, primitive)).toBe(false);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.RELATIVE_TO_GROUND, primitive)).toBe(true);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.NONE, primitive)).toBe(true);
    });

    it('should report changing when primitives move from something else to clampToGround', () => {
      const primitive = primitiveUtils.createPrimitive([-2, -2, 2, 2]);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.CLAMP_TO_GROUND, primitive)).toBe(true);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.RELATIVE_TO_GROUND, primitive)).toBe(false);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.NONE, primitive)).toBe(false);
    });

    it('should report changes in primitive collections moving from something else to clampToGround', () => {
      const child = primitiveUtils.createPrimitive([-2, -2, 2, 2]);
      const primitive = new Cesium.PrimitiveCollection();
      primitive.add(child);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.CLAMP_TO_GROUND, primitive)).toBe(true);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.RELATIVE_TO_GROUND, primitive)).toBe(false);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.NONE, primitive)).toBe(false);
    });

    it('should report changes when polylines move from clampToGround to something else', () => {
      const primitive = primitiveUtils.createGroundPolylinePrimitive([[0, 0], [10, 10]]);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.CLAMP_TO_GROUND, primitive)).toBe(false);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.RELATIVE_TO_GROUND, primitive)).toBe(true);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.NONE, primitive)).toBe(true);
    });

    it('should report changes when polylines move from something else to clampToGround', () => {
      const primitive = primitiveUtils.createPolyline([[0, 0], [10, 10]]);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.CLAMP_TO_GROUND, primitive)).toBe(true);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.RELATIVE_TO_GROUND, primitive)).toBe(false);
      expect(isPrimitiveClassTypeChanging(Cesium.HeightReference.NONE, primitive)).toBe(false);
    });
  });
});
