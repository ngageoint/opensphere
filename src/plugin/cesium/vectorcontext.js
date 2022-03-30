goog.declareModuleId('plugin.cesium.VectorContext');

import {remove} from 'ol/src/array.js';
import {getUid} from 'ol/src/util.js';

import * as objectUtils from '../../os/object/object.js';
import {isGroundPrimitive, isPrimitiveShown, setPrimitiveShown} from './primitive.js';

const Throttle = goog.require('goog.async.Throttle');
const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');

const IDisposable = goog.requireType('goog.disposable.IDisposable');


/**
 * Logger for plugin.cesium.VectorContext
 * @type {log.Logger}
 * @const
 */
const LOGGER = log.getLogger('plugin.cesium.VectorContext');


/**
 * Maintains references to all Cesium primitives
 * @implements {IDisposable}
 */
export default class VectorContext {
  /**
   * @param {!Cesium.Scene} scene The Cesium scene
   * @param {!OLVectorLayer} layer The OL3 layer
   * @param {!(Projection|string)} projection The map projection
   */
  constructor(scene, layer, projection) {
    /**
     * @type {boolean}
     * @private
     */
    this.disposed_ = false;

    /**
     * Cesium Billboards
     * @type {Cesium.BillboardCollection}
     */
    this.billboards = new Cesium.BillboardCollection({
      scene: scene
    });

    /**
     * Cesium Labels
     * @type {Cesium.LabelCollection}
     */
    this.labels = new Cesium.LabelCollection({
      scene: scene
    });

    /**
     * Cesium polylines.
     * @type {Cesium.PolylineCollection}
     */
    this.polylines = new Cesium.PolylineCollection();

    /**
     * The OL3 vector layer
     * @type {!OLVectorLayer}
     */
    this.layer = layer;

    /**
     * The map projection
     * @type {!(Projection|string)}
     */
    this.projection = projection;

    /**
     * Map of OL features to Cesium primitives/billboards.
     * @type {Object<number, (Array<!Cesium.PrimitiveLike>|undefined)>}
     */
    this.featureToCesiumMap = {};

    /**
     * Map of OL geometries to Cesium primitives/billboards.
     * @type {Object<number, (!Array<Cesium.PrimitiveLike>|Cesium.PrimitiveLike|undefined)>}
     * @protected
     */
    this.geometryToCesiumMap = {};

    /**
     * Map of OL geometries to Cesium label.
     * @type {Object<number, (Cesium.Label|undefined)>}
     * @protected
     */
    this.geometryToLabelMap = {};

    /**
     * Map of shown values for feature visibility events that did not have a feature to primitive
     * mapping at the time of the event.
     * @type {Object<number, boolean|undefined>}
     */
    this.featureToShownMap = {};

    /**
     * The Cesium scene.
     * @type {Cesium.Scene}
     */
    this.scene = scene;

    /**
     * Throttle for billboard cleanup.
     * @type {Throttle}
     */
    this.billboardCleanupThrottle = new Throttle(this.onBillboardCleanup, 500, this);

    /**
     * The generic primitive collection
     * @type {!Cesium.PrimitiveCollection}
     */
    this.primitives = new Cesium.PrimitiveCollection();

    /**
     * The primitive collection for primitives going to scene.groundPrimitives
     * @type {!Cesium.PrimitiveCollection}
     */
    this.groundPrimitives = new Cesium.PrimitiveCollection();

    scene.primitives.add(this.primitives);
    scene.groundPrimitives.add(this.groundPrimitives);

    // Generally Cesium prefers wide scene trees over deep ones. However, none
    // of these collections support the show property, and therefore they need
    // to be under something that does in order to properly control visibility.
    this.noShowCollections = new Cesium.PrimitiveCollection();
    this.noShowCollections.add(this.billboards);
    this.noShowCollections.add(this.labels);
    this.noShowCollections.add(this.polylines);
    scene.primitives.add(this.noShowCollections);

    /**
     * The default eye offset
     * @type {!Cesium.Cartesian3}
     */
    this.eyeOffset = new Cesium.Cartesian3(0.0, 0.0, 0.0);

    /**
     * The default eye offset
     * @type {!Cesium.Cartesian3}
     */
    this.labelEyeOffset = new Cesium.Cartesian3(0.0, 0.0, 0.0);
  }


  /**
   * @inheritDoc
   */
  dispose() {
    if (!this.isDisposed()) {
      dispose(this.billboardCleanupThrottle);

      try {
        this.billboards.destroyPrimitives = true;
        this.labels.destroyPrimitives = true;
        this.polylines.destroyPrimitives = true;

        this.disposeCollection_(this.noShowCollections);
        this.disposeCollection_(this.groundPrimitives);
        this.disposeCollection_(this.primitives);
      } catch (e) {
        log.error(LOGGER, 'Failed disposing vector context', e);
      } finally {
        this.disposed_ = true;
      }
    }
  }


  /**
   * @param {?Cesium.CollectionLike} collection
   * @private
   */
  disposeCollection_(collection) {
    if (collection) {
      collection.destroyPrimitives = true;
      this.scene.primitives.remove(collection);
      this.scene.groundPrimitives.remove(collection);
    }
  }


  /**
   * @inheritDoc
   */
  isDisposed() {
    return this.disposed_;
  }


  /**
   * Clean unused keys from maps.
   */
  pruneMaps() {
    this.featureToCesiumMap = objectUtils.prune(this.featureToCesiumMap);
    this.geometryToCesiumMap = objectUtils.prune(this.geometryToCesiumMap);
    this.geometryToLabelMap = objectUtils.prune(this.geometryToLabelMap);
    this.featureToShownMap = objectUtils.prune(this.featureToShownMap);

    this.scene.context.cleanupPickIds();
  }


  /**
   * Sets references to OpenLayers objects on a Cesium primitive.
   *
   * @param {Cesium.PrimitiveLike} primitive
   * @param {!Feature} feature The OL3 feature
   * @param {!Geometry} geometry The OL3 geometry
   */
  addOLReferences(primitive, feature, geometry) {
    if (primitive) {
      primitive.olLayer = this.layer;
      primitive.olFeature = feature;
      primitive.olGeometry = geometry;
      primitive.geomRevision = geometry.getRevision();
    }
  }


  /**
   * Removes references to OpenLayers objects from a Cesium primitive.
   *
   * @param {Cesium.PrimitiveLike} primitive
   * @protected
   */
  removeOLReferences(primitive) {
    if (primitive) {
      primitive.olLayer = undefined;
      primitive.olFeature = undefined;
      primitive.olGeometry = undefined;
    }
  }


  /**
   * Marks all primitives for a feature as dirty.
   *
   * @param {!Feature} feature The OL3 feature
   */
  markDirty(feature) {
    const primitives = this.featureToCesiumMap[feature.getUid()];
    if (primitives) {
      for (let i = 0, n = primitives.length; i < n; i++) {
        primitives[i].dirty = true;
      }
    }
  }


  /**
   * Removes all dirty primitives for a feature as dirty.
   *
   * @param {!Feature} feature The OL3 feature
   */
  removeDirty(feature) {
    const primitives = this.featureToCesiumMap[feature.getUid()];
    if (primitives) {
      let i = primitives.length;
      while (i--) {
        if (primitives[i].dirty) {
          this.removePrimitive(primitives[i]);
        }
      }
    }
  }


  /**
   * Cleans up Cesium objects created for a feature.
   *
   * @param {!Feature} feature the OL3 feature
   */
  cleanup(feature) {
    const featureId = feature.getUid();
    const primitives = this.featureToCesiumMap[featureId];
    if (primitives) {
      this.featureToCesiumMap[featureId] = undefined;
      this.featureToShownMap[featureId] = undefined;

      for (let i = 0, n = primitives.length; i < n; i++) {
        this.removePrimitive(primitives[i]);
      }
    }

    this.billboardCleanupThrottle.fire();
  }


  /**
   * Throttled call to debounce cleanup of billboards after removals occur.
   */
  onBillboardCleanup() {
    this.billboards._billboardsToUpdate.length = this.billboards.length;
  }


  /**
   * Adds a billboard to the collection.
   *
   * @param {!Cesium.optionsBillboardCollectionAdd} options The billboard configuration
   * @param {!Feature} feature The OL3 feature tied to the billboard
   * @param {!Geometry} geometry The billboard's geometry
   * @return {?Cesium.Billboard}
   */
  addBillboard(options, feature, geometry) {
    if (!feature.isDisposed()) {
      const billboard = this.billboards.add(options);
      this.updateGeometryMap_(geometry, billboard);
      this.addFeaturePrimitive(feature, billboard);
      this.addOLReferences(billboard, feature, geometry);
      return billboard;
    }

    return null;
  }

  /**
   * @param {Geometry} geometry
   * @param {!Array<Cesium.PrimitiveLike>|Cesium.PrimitiveLike} item
   * @private
   */
  updateGeometryMap_(geometry, item) {
    const geometryId = getUid(geometry);
    let existing = this.geometryToCesiumMap[geometryId];

    // this is messier than [existing, item].filter(filterFalsey).flat(2); but
    // should be way faster (plus this way doesn't require the map value to be
    // an array)
    if (Array.isArray(item)) {
      if (existing) {
        if (!Array.isArray(existing)) {
          existing = [existing];
        }

        Array.prototype.push.apply(existing, item);
        this.geometryToCesiumMap[geometryId] = existing;
      } else {
        this.geometryToCesiumMap[geometryId] = item;
      }
    } else if (existing) {
      if (Array.isArray(existing)) {
        existing[existing.length] = item;
      } else {
        this.geometryToCesiumMap[geometryId] = [existing, item];
      }
    } else {
      this.geometryToCesiumMap[geometryId] = item;
    }
  }

  /**
   * Adds a polyline to the collection.
   *
   * @param {!Cesium.PolylineOptions} options The polyline options.
   * @param {!Feature} feature The OL3 feature tied to the primitive
   * @param {!Geometry} geometry The primitive's geometry
   */
  addPolyline(options, feature, geometry) {
    if (!feature.isDisposed()) {
      const polyline = this.polylines.add(options);
      this.updateGeometryMap_(geometry, polyline);
      this.addFeaturePrimitive(feature, polyline);
      this.addOLReferences(polyline, feature, geometry);
    }
  }


  /**
   * Adds a primitive to the collection.
   *
   * @param {Cesium.PrimitiveLike} primitive The Cesium primitive
   * @param {!Feature} feature The OL3 feature tied to the primitive
   * @param {!Geometry} geometry The primitive's geometry
   */
  addPrimitive(primitive, feature, geometry) {
    if (!feature.isDisposed()) {
      if (isGroundPrimitive(primitive)) {
        this.groundPrimitives.add(primitive);
      } else {
        this.primitives.add(primitive);
      }

      this.updateGeometryMap_(geometry, primitive);
      this.addFeaturePrimitive(feature, primitive);
      this.addOLReferences(primitive, feature, geometry);
    }
  }


  /**
   * Adds a label to the collection.
   *
   * @param {!Cesium.optionsLabelCollection} options The label configuration
   * @param {!Feature} feature The feature tied to the label
   * @param {!Geometry} geometry The billboard's geometry
   */
  addLabel(options, feature, geometry) {
    if (!feature.isDisposed()) {
      // add the label to the collection
      const label = this.labels.add(options);
      this.geometryToLabelMap[getUid(geometry)] = label;
      this.addFeaturePrimitive(feature, label);
      this.addOLReferences(label, feature, geometry);
    }
  }


  /**
   * Remove a primitive from the collection.
   *
   * @param {!Cesium.PrimitiveLike} primitive The primitive
   */
  removePrimitive(primitive) {
    const geomId = getUid(primitive.olGeometry);
    this.removeFeaturePrimitive(primitive.olFeature, primitive);
    this.removeOLReferences(primitive);

    if (primitive instanceof Cesium.Label) {
      this.labels.remove(primitive);
      this.geometryToLabelMap[geomId] = undefined;
    } else {
      if (primitive instanceof Cesium.Billboard) {
        this.billboards.remove(primitive);
      } else if (primitive instanceof Cesium.Polyline) {
        this.polylines.remove(primitive);
      } else if (isGroundPrimitive(primitive)) {
        this.groundPrimitives.remove(primitive);
      } else {
        this.primitives.remove(primitive);
      }

      this.geometryToCesiumMap[geomId] = undefined;
    }
  }


  /**
   * Adds a primitive to the map for a feature.
   *
   * @param {!Feature} feature The OL3 feature
   * @param {!Cesium.PrimitiveLike} primitive The Cesium primitive
   * @protected
   */
  addFeaturePrimitive(feature, primitive) {
    const featureId = feature.getUid();
    let shown = this.featureToShownMap[featureId];
    shown = shown != null ? shown : isPrimitiveShown(primitive);

    setPrimitiveShown(primitive, shown);
    this.featureToCesiumMap[featureId] = this.featureToCesiumMap[featureId] || [];
    this.featureToCesiumMap[featureId].push(primitive);

    this.featureToShownMap[featureId] = shown;
  }


  /**
   * Removes a primitive from the map for a feature.
   *
   * @param {Feature} feature The OL3 feature
   * @param {!Cesium.PrimitiveLike} primitive
   * @protected
   */
  removeFeaturePrimitive(feature, primitive) {
    if (feature) {
      const primitives = this.featureToCesiumMap[feature.getUid()];
      if (primitives) {
        remove(primitives, primitive);
      }
    }
  }


  /**
   * Get the Cesium label for the provided geometry, if it exists.
   *
   * @param {!Geometry} geometry The geometry.
   * @return {?Cesium.Label}
   */
  getLabelForGeometry(geometry) {
    return this.geometryToLabelMap[getUid(geometry)] || null;
  }


  /**
   * Get the Cesium primitive/billboard for the provided geometry, if it exists.
   *
   * @param {!Geometry} geometry The geometry.
   * @return {!Array<Cesium.PrimitiveLike>|Cesium.PrimitiveLike|undefined}
   */
  getPrimitiveForGeometry(geometry) {
    return this.geometryToCesiumMap[getUid(geometry)];
  }


  /**
   * @param {boolean} shown
   */
  setVisibility(shown) {
    setPrimitiveShown(this.noShowCollections, shown);
    setPrimitiveShown(this.primitives, shown);
    setPrimitiveShown(this.groundPrimitives, shown);
  }


  /**
   * @param {!Cesium.Cartesian3} eyeOffset
   */
  setEyeOffset(eyeOffset) {
    if (eyeOffset.z !== this.eyeOffset.z) {
      this.eyeOffset = eyeOffset;
      this.updateBillboardEyeOffsets_();
    }
  }


  /**
   * @private
   */
  updateBillboardEyeOffsets_() {
    for (let i = 0, n = this.billboards.length; i < n; i++) {
      const billboard = this.billboards.get(i);
      if (billboard) {
        billboard.eyeOffset = this.eyeOffset;
      }
    }
  }


  /**
   * @param {!Cesium.Cartesian3} eyeOffset
   */
  setLabelEyeOffset(eyeOffset) {
    if (eyeOffset.z !== this.labelEyeOffset.z) {
      this.labelEyeOffset = eyeOffset;
      this.updateLabelEyeOffsets_();
    }
  }


  /**
   * @private
   */
  updateLabelEyeOffsets_() {
    for (let i = 0, n = this.labels.length; i < n; i++) {
      const label = this.labels.get(i);
      if (label) {
        label.eyeOffset = this.labelEyeOffset;
      }
    }
  }


  /**
   * @param {!Feature} feature
   * @return {boolean}
   */
  isFeatureShown(feature) {
    const featureId = feature.getUid();
    const shown = this.featureToShownMap[featureId];
    return shown == null ? true : shown;
  }
}
