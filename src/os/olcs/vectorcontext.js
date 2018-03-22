goog.provide('os.olcs.VectorContext');

goog.require('goog.disposable.IDisposable');
goog.require('goog.log');



/**
 * Maintains references to all Cesium primitives
 * @param {!Cesium.Scene} scene The Cesium scene
 * @param {!ol.layer.Vector} layer The OL3 layer
 * @param {!(ol.proj.Projection|string)} projection The map projection
 * @implements {goog.disposable.IDisposable}
 * @constructor
 */
os.olcs.VectorContext = function(scene, layer, projection) {
  /**
   * The logger to use for the source.
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.olcs.VectorContext.LOGGER_;

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
   * @type {!ol.layer.Vector}
   */
  this.layer = layer;

  /**
   * The map projection
   * @type {!(ol.proj.Projection|string)}
   */
  this.projection = projection;

  /**
   * Map of OL features to Cesium primitives/billboards.
   * @type {Object<number, (Array<!Cesium.PrimitiveLike>|undefined)>}
   */
  this.featureToCesiumMap = {};

  /**
   * Map of OL geometries to Cesium primitives/billboards.
   * @type {Object<number, (Cesium.PrimitiveLike|undefined)>}
   * @protected
   */
  this.geometryToCesiumMap = {};

  /**
   * Map of OL geometries to Cesium labels.
   * @type {Object<number, (Array<!Cesium.Label>|undefined)>}
   * @protected
   */
  this.geometryToLabelsMap = {};

  /**
   * Map of shown values for feature visibility events that did not have a feature to primitive
   * mapping at the time of the event.
   * @type {Object<number, boolean>}
   */
  this.featureToShownMap = {};

  /**
   * The Cesium scene.
   * @type {Cesium.Scene}
   */
  this.scene = scene;

  /**
   * The Cesium primitive collection.
   * @type {!Cesium.PrimitiveCollection}
   */
  this.collection = new Cesium.PrimitiveCollection();
  this.collection.add(this.billboards);
  this.collection.add(this.labels);
  this.collection.add(this.polylines);
};


/**
 * Logger for os.olcs.VectorContext
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.olcs.VectorContext.LOGGER_ = goog.log.getLogger('os.olcs.VectorContext');


/**
 * @inheritDoc
 */
os.olcs.VectorContext.prototype.dispose = function() {
  if (!this.isDisposed()) {
    this.collection.destroyPrimitives = true;

    try {
      if (this.billboards) {
        this.removeOLReferences(this.billboards);
        this.collection.remove(this.billboards);
        this.billboards = null;
      }

      if (this.labels) {
        this.removeOLReferences(this.labels);
        this.collection.remove(this.labels);
        this.labels = null;
      }

      if (this.polylines) {
        this.removeOLReferences(this.polylines);
        this.collection.remove(this.polylines);
        this.polylines = null;
      }

      this.removeOLReferences(this.collection);
    } catch (e) {
      goog.log.error(this.log, 'Failed disposing vector context', e);
    } finally {
      this.disposed_ = true;
    }
  }
};


/**
 * @inheritDoc
 */
os.olcs.VectorContext.prototype.isDisposed = function() {
  return this.disposed_;
};


/**
 * Clean unused keys from maps.
 * @suppress {checkTypes}
 */
os.olcs.VectorContext.prototype.pruneMaps = function() {
  this.featureToCesiumMap = os.object.prune(this.featureToCesiumMap);
  this.geometryToCesiumMap = os.object.prune(this.geometryToCesiumMap);
  this.geometryToLabelsMap = os.object.prune(this.geometryToLabelsMap);
  this.featureToShownMap = os.object.prune(this.featureToShownMap);

  this.scene.context.cleanupPickIds();
};


/**
 * Sets references to OpenLayers objects on a Cesium primitive.
 * @param {Cesium.PrimitiveLike} primitive
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Geometry} geometry The OL3 geometry
 * @protected
 */
os.olcs.VectorContext.prototype.addOLReferences = function(primitive, feature, geometry) {
  if (primitive) {
    primitive.olLayer = this.layer;
    primitive.olFeature = feature;
    primitive.olGeometry = geometry;

    // primitives in a collection need a feature reference or hover will not work
    if (primitive instanceof Cesium.PrimitiveCollection) {
      for (var i = 0, n = primitive.length; i < n; i++) {
        var p = primitive.get(i);
        if (p) {
          this.addOLReferences(p, feature, geometry);
        }
      }
    }
  }
};


/**
 * Removes references to OpenLayers objects from a Cesium primitive.
 * @param {Cesium.PrimitiveLike} primitive
 * @protected
 */
os.olcs.VectorContext.prototype.removeOLReferences = function(primitive) {
  if (primitive) {
    primitive.olLayer = undefined;
    primitive.olFeature = undefined;
    primitive.olGeometry = undefined;

    // clean up feature references on collections
    if (primitive instanceof Cesium.PrimitiveCollection || primitive instanceof Cesium.BillboardCollection ||
        primitive instanceof Cesium.LabelCollection) {
      for (var i = 0, n = primitive.length; i < n; i++) {
        var p = primitive.get(i);
        if (p) {
          this.removeOLReferences(p);
        }
      }
    }
  }
};


/**
 * Marks all primitives for a feature as dirty.
 * @param {!ol.Feature} feature The OL3 feature
 * @suppress {checkTypes}
 */
os.olcs.VectorContext.prototype.markDirty = function(feature) {
  var featureId = feature['id'];
  var primitives = this.featureToCesiumMap[featureId];
  if (primitives) {
    for (var i = 0, n = primitives.length; i < n; i++) {
      primitives[i].dirty = true;
    }
  }
};


/**
 * Removes all dirty primitives for a feature as dirty.
 * @param {!ol.Feature} feature The OL3 feature
 * @suppress {checkTypes}
 */
os.olcs.VectorContext.prototype.removeDirty = function(feature) {
  var featureId = feature['id'];
  var primitives = this.featureToCesiumMap[featureId];
  if (primitives) {
    var i = primitives.length;
    while (i--) {
      if (primitives[i].dirty) {
        this.removePrimitive(primitives[i]);
      }
    }
  }
};


/**
 * Cleans up Cesium objects created for a feature.
 * @param {!ol.Feature} feature the OL3 feature
 * @suppress {checkTypes}
 */
os.olcs.VectorContext.prototype.cleanup = function(feature) {
  var featureId = feature['id'];
  var primitives = this.featureToCesiumMap[featureId];
  if (primitives) {
    this.featureToCesiumMap[featureId] = undefined;
    this.featureToShownMap[featureId] = undefined;

    for (var i = 0, n = primitives.length; i < n; i++) {
      this.removePrimitive(primitives[i]);
    }
  }
};


/**
 * Adds a billboard to the collection.
 * @param {!Cesium.optionsBillboardCollectionAdd} options The billboard configuration
 * @param {!ol.Feature} feature The OL3 feature tied to the billboard
 * @param {!ol.geom.Geometry} geometry The billboard's geometry
 */
os.olcs.VectorContext.prototype.addBillboard = function(options, feature, geometry) {
  var geometryId = ol.getUid(geometry);
  var existing = this.geometryToCesiumMap[geometryId];
  if (existing) {
    this.removePrimitive(existing);
  }

  if (!feature.isDisposed()) {
    var billboard = this.billboards.add(options);
    this.geometryToCesiumMap[geometryId] = billboard;
    this.addFeaturePrimitive(feature, billboard);
    this.addOLReferences(billboard, feature, geometry);
  }
};


/**
 * Adds a polyline to the collection.
 * @param {!Cesium.PolylineOptions} options The polyline options.
 * @param {!ol.Feature} feature The OL3 feature tied to the primitive
 * @param {!ol.geom.Geometry} geometry The primitive's geometry
 */
os.olcs.VectorContext.prototype.addPolyline = function(options, feature, geometry) {
  var geometryId = ol.getUid(geometry);
  var existing = this.geometryToCesiumMap[geometryId];
  if (existing) {
    this.removePrimitive(existing);
  }

  if (!feature.isDisposed()) {
    var polyline = this.polylines.add(options);
    this.geometryToCesiumMap[geometryId] = polyline;
    this.addFeaturePrimitive(feature, polyline);
    this.addOLReferences(polyline, feature, geometry);
  }
};


/**
 * Adds a primitive to the collection.
 * @param {!Cesium.PrimitiveLike} primitive The Cesium primitive
 * @param {!ol.Feature} feature The OL3 feature tied to the primitive
 * @param {!ol.geom.Geometry} geometry The primitive's geometry
 */
os.olcs.VectorContext.prototype.addPrimitive = function(primitive, feature, geometry) {
  var geometryId = ol.getUid(geometry);
  var existing = this.geometryToCesiumMap[geometryId];
  if (existing) {
    this.removePrimitive(existing);
  }

  if (!feature.isDisposed()) {
    this.collection.add(primitive);
    this.geometryToCesiumMap[geometryId] = primitive;
    this.addFeaturePrimitive(feature, primitive);
    this.addOLReferences(primitive, feature, geometry);
  }
};


/**
 * Adds a label to the collection.
 * @param {Array<!Cesium.optionsLabelCollection>} allOptions The label configuration
 * @param {!ol.Feature} feature The OL3 feature tied to the label
 * @param {!ol.geom.Geometry} geometry The billboard's geometry
 */
os.olcs.VectorContext.prototype.addLabels = function(allOptions, feature, geometry) {
  var geometryId = ol.getUid(geometry);

  // remove the existing labels because they will be recreated
  var existing = this.geometryToLabelsMap[geometryId];
  if (existing) {
    existing.forEach(this.removePrimitive, this);
  }

  if (!feature.isDisposed()) {
    if (allOptions && allOptions.length > 0) {
      // recreate the labels
      this.geometryToLabelsMap[geometryId] = this.geometryToLabelsMap[geometryId] || [];

      allOptions.forEach(function(labelOptions) {
        var label = this.labels.add(labelOptions);
        this.geometryToLabelsMap[geometryId].push(label);
        this.addFeaturePrimitive(feature, label);
        this.addOLReferences(label, feature, geometry);
      }, this);
    } else {
      // no labels
      this.geometryToLabelsMap[geometryId] = undefined;
    }
  }
};


/**
 * Remove a primitive from the collection.
 * @param {!Cesium.PrimitiveLike} primitive The primitive
 */
os.olcs.VectorContext.prototype.removePrimitive = function(primitive) {
  var geomId = ol.getUid(primitive.olGeometry);
  if (primitive instanceof Cesium.Billboard) {
    this.billboards.remove(primitive);
    this.geometryToCesiumMap[geomId] = undefined;
  } else if (primitive instanceof Cesium.Label) {
    this.labels.remove(primitive);

    var labelPrimitives = this.geometryToLabelsMap[geomId];
    if (labelPrimitives) {
      goog.array.remove(labelPrimitives, primitive);

      if (labelPrimitives.length == 0) {
        this.geometryToLabelsMap[geomId] = undefined;
      }
    }
  } else if (primitive instanceof Cesium.Polyline) {
    this.polylines.remove(primitive);
    this.geometryToCesiumMap[geomId] = undefined;
  } else {
    this.collection.remove(primitive);
    this.geometryToCesiumMap[geomId] = undefined;
  }

  if (primitive.olFeature) {
    this.removeFeaturePrimitive(primitive.olFeature, primitive);
  }

  this.removeOLReferences(primitive);
};


/**
 * Adds a primitive to the map for a feature.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!Cesium.PrimitiveLike} primitive The Cesium primitive
 * @protected
 * @suppress {checkTypes}
 */
os.olcs.VectorContext.prototype.addFeaturePrimitive = function(feature, primitive) {
  var featureId = feature['id'];
  var shown = this.featureToShownMap[featureId];
  shown = goog.isDef(shown) ? shown : primitive.show;

  primitive.show = shown;
  this.featureToCesiumMap[featureId] = this.featureToCesiumMap[featureId] || [];
  this.featureToCesiumMap[featureId].push(primitive);

  this.featureToShownMap[featureId] = shown;
};


/**
 * Removes a primitive from the map for a feature.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!Cesium.PrimitiveLike} primitive
 * @protected
 * @suppress {checkTypes}
 */
os.olcs.VectorContext.prototype.removeFeaturePrimitive = function(feature, primitive) {
  var featureId = feature['id'];
  var primitives = this.featureToCesiumMap[featureId];
  if (primitives) {
    goog.array.remove(primitives, primitive);
  }
};


/**
 * Get the Cesium label for the provided geometry, if it exists.
 * @param {!ol.geom.Geometry} geometry The OL3 geometry
 * @return {Array<!Cesium.Label>}
 */
os.olcs.VectorContext.prototype.getLabelsForGeometry = function(geometry) {
  return this.geometryToLabelsMap[ol.getUid(geometry)] || null;
};


/**
 * Get the Cesium primitive/billboard for the provided geometry, if it exists.
 * @param {!ol.geom.Geometry} geometry The OL3 geometry
 * @return {?Cesium.PrimitiveLike}
 */
os.olcs.VectorContext.prototype.getPrimitiveForGeometry = function(geometry) {
  return this.geometryToCesiumMap[ol.getUid(geometry)] || null;
};
