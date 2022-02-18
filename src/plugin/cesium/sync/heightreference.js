goog.declareModuleId('plugin.cesium.sync.HeightReference');

import RecordField from '../../../os/data/recordfield.js';
import implementz from '../../../os/implements.js';
import ISource from '../../../os/source/isource.js';
import AltitudeMode from '../../../os/webgl/altitudemode.js';


/**
 * @param {!OLVectorLayer} layer
 * @param {!Feature} feature Ol3 feature
 * @param {!Geometry} geometry
 * @param {number=} opt_index Index into altitudeModes array for multi geoms
 * @return {!Cesium.HeightReference}
 */
export const getHeightReference = (layer, feature, geometry, opt_index) => {
  let altitudeMode = getAltitudeModeFromItems(layer, feature, geometry);
  altitudeMode = getAltitudeModeFromArray(altitudeMode, opt_index);
  return getHeightReferenceFromAltitudeMode(altitudeMode);
};


/**
 * @param {!OLVectorLayer} layer
 * @param {!Feature} feature Ol3 feature
 * @param {!Geometry} geometry
 * @return {AltitudeMode|Array<AltitudeMode>|undefined}
 */
const getAltitudeModeFromItems = (layer, feature, geometry) => {
  const altModeField = RecordField.ALTITUDE_MODE;
  let altitudeMode = /** @type {AltitudeMode|Array<AltitudeMode>|undefined} */ (
    geometry.get(altModeField) ||
    feature.get(altModeField) ||
    layer.get(altModeField));

  if (!altitudeMode) {
    const source = layer.getSource();
    if (source && implementz(source, ISource.ID)) {
      altitudeMode = /** @type {VectorSource} */ (source).getAltitudeMode();
    }
  }

  return altitudeMode;
};


/**
 * @param {AltitudeMode|Array<AltitudeMode>|undefined} altitudeMode
 * @param {number=} opt_index
 * @return {!AltitudeMode|undefined}
 */
const getAltitudeModeFromArray = (altitudeMode, opt_index) => {
  opt_index = opt_index || 0;
  if (Array.isArray(altitudeMode) && opt_index >= 0 && opt_index < altitudeMode.length) {
    altitudeMode = altitudeMode[opt_index];
  }

  return altitudeMode;
};


/**
 * @param {AltitudeMode|undefined} altitudeMode
 * @return {!Cesium.HeightReference} defaults to Cesium.HeightReference.NONE
 */
const getHeightReferenceFromAltitudeMode = (altitudeMode) => {
  let heightReference = Cesium.HeightReference.NONE;

  if (altitudeMode) {
    if (altitudeMode === AltitudeMode.CLAMP_TO_GROUND) {
      heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    } else if (altitudeMode === AltitudeMode.RELATIVE_TO_GROUND) {
      heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
    }
  }

  return heightReference;
};


/**
 * @param {Cesium.HeightReference} newHeightReference
 * @param {Cesium.PrimitiveLike|null} primitive
 * @return {boolean}
 */
export const isPrimitiveClassTypeChanging = (newHeightReference, primitive) => {
  return ((newHeightReference !== Cesium.HeightReference.CLAMP_TO_GROUND &&
    (primitive instanceof Cesium.GroundPolylinePrimitive || primitive instanceof Cesium.GroundPrimitive)) ||
    (newHeightReference === Cesium.HeightReference.CLAMP_TO_GROUND &&
    (primitive instanceof Cesium.Polyline || primitive instanceof Cesium.Primitive)));
};
