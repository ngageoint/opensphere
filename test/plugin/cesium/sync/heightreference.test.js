goog.require('os.data.RecordField');
goog.require('os.mock');
goog.require('os.source.Vector');
goog.require('os.webgl');
goog.require('os.webgl.AltitudeMode');
goog.require('plugin.cesium.sync.HeightReference');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';
import OLVectorLayer from 'ol/src/layer/Vector.js';
import OLVectorSource from 'ol/src/source/Vector.js';
import * as primitiveUtils from '../primitive.mock.js';

describe('plugin.cesium.sync.HeightReference', () => {
  const {default: RecordField} = goog.module.get('os.data.RecordField');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const {default: AltitudeMode} = goog.module.get('os.webgl.AltitudeMode');
  const {getHeightReference, isPrimitiveClassTypeChanging} = goog.module.get('plugin.cesium.sync.HeightReference');

  describe('getHeightReference', () => {
    const altModeField = RecordField.ALTITUDE_MODE;
    let geometry;
    let feature;
    let source;
    let layer;

    beforeEach(() => {
      geometry = new Point([0, 0]);
      feature = new Feature(geometry);
      source = new VectorSource();
      layer = new OLVectorLayer();

      layer.setSource(source);
      source.addFeature(feature);
    });

    it('should default to absolute', () => {
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.NONE);
    });

    it('should prefer altitude mode from the geometry', () => {
      geometry.set(altModeField, AltitudeMode.RELATIVE_TO_GROUND);
      feature.set(altModeField, AltitudeMode.ABSOLUTE);
      layer.set(altModeField, AltitudeMode.ABSOLUTE);
      source.setAltitudeMode(AltitudeMode.ABSOLUTE);

      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.RELATIVE_TO_GROUND);
    });

    it('should prefer altitude mode from the feature if not on the geometry', () => {
      feature.set(altModeField, AltitudeMode.CLAMP_TO_GROUND);
      layer.set(altModeField, AltitudeMode.ABSOLUTE);
      source.setAltitudeMode(AltitudeMode.ABSOLUTE);
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.CLAMP_TO_GROUND);
    });

    it('should prefer altitude mode the layer if not on the feature', () => {
      layer.set(altModeField, AltitudeMode.RELATIVE_TO_GROUND);
      source.setAltitudeMode(AltitudeMode.ABSOLUTE);
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.RELATIVE_TO_GROUND);
    });

    it('should prefer altitude mode from the source if not on the layer', () => {
      source.setAltitudeMode(AltitudeMode.CLAMP_TO_GROUND);
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.CLAMP_TO_GROUND);
    });

    it('should not check altitude mode from non-opensphere source implementations', () => {
      const otherSource = new OLVectorSource();
      const otherLayer = new OLVectorLayer();
      otherLayer.setSource(otherSource);
      expect(getHeightReference(otherLayer, feature, geometry)).toBe(Cesium.HeightReference.NONE);
    });

    it('should default to the first index in an altitude mode array', () => {
      geometry.set(altModeField, [AltitudeMode.CLAMP_TO_GROUND, AltitudeMode.RELATIVE_TO_GROUND]);
      expect(getHeightReference(layer, feature, geometry)).toBe(Cesium.HeightReference.CLAMP_TO_GROUND);
    });

    it('should get the altitude mode at the given index', () => {
      geometry.set(altModeField, [AltitudeMode.CLAMP_TO_GROUND, AltitudeMode.RELATIVE_TO_GROUND]);
      expect(getHeightReference(layer, feature, geometry, 1)).toBe(Cesium.HeightReference.RELATIVE_TO_GROUND);
    });

    it('should default out of range indexes to absolute', () => {
      geometry.set(altModeField, [AltitudeMode.CLAMP_TO_GROUND, AltitudeMode.RELATIVE_TO_GROUND]);
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

    it('should report changing when primitives move from something else to clampToGround', () => {
      const primitive = primitiveUtils.createPrimitive([-2, -2, 2, 2]);
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
