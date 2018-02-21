goog.provide('os.olcs.sync.FeatureConverter');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Delay');
goog.require('goog.string');
goog.require('ol.ImageState');
goog.require('ol.events');
goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.source.WMTS');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');
goog.require('os.geom.GeometryField');
goog.require('os.implements');
goog.require('os.layer.ILayer');
goog.require('os.map');
goog.require('os.olcs');
goog.require('os.olcs.VectorContext');



/**
 * Class for converting from OpenLayers3 vectors to Cesium primitives.
 * @param {!Cesium.Scene} scene Cesium scene.
 * @constructor
 */
os.olcs.sync.FeatureConverter = function(scene) {
  /**
   * @type {!Cesium.Scene}
   * @protected
   */
  this.scene = scene;

  /**
   * @type {?ol.proj.Projection}
   * @protected
   */
  this.lastProjection = null;

  /**
   * @type {?ol.TransformFunction}
   * @protected
   */
  this.transformFunction = null;

  /**
   * @type {!Cesium.HeightReference}
   * @private
   */
  this.heightReference_ = Cesium.HeightReference.NONE;

  /**
   * The default eye offset
   * @type {!Cesium.Cartesian3}
   * @private
   */
  this.eyeOffset_ = os.olcs.sync.FeatureConverter.ZERO_OFFSET;

  /**
   * The default eye offset for labels
   * @type {!Cesium.Cartesian3}
   * @private
   */
  this.labelEyeOffset_ = os.olcs.sync.FeatureConverter.DEFAULT_LABEL_OFFSET;

  /**
   * Map of images being listened to
   * @type {Object}
   * @private
   */
  this.listenerMap_ = {};
};


/**
 * @type {!Cesium.Cartesian3}
 * @const
 */
os.olcs.sync.FeatureConverter.ZERO_OFFSET = new Cesium.Cartesian3(0.0, 0.0, 0.0);


/**
 * @type {!Cesium.Cartesian3}
 * @const
 */
os.olcs.sync.FeatureConverter.DEFAULT_LABEL_OFFSET = new Cesium.Cartesian3(0.0, 0.0, 10000);


/**
 * The angular distance between points on the ellipse in radians.
 * @type {number}
 * @const
 */
os.olcs.sync.FeatureConverter.ELLIPSE_GRANULARITY = 0.002;


/**
 * Base Cesium primitive render options.
 * @type {!Object}
 * @const
 */
os.olcs.sync.FeatureConverter.BASE_PRIMITIVE_OPTIONS = {
  flat: true,
  renderState: {
    depthTest: {
      enabled: true
    }
  }
};


/**
 * Gets the transform function
 * @return {?ol.TransformFunction}
 */
os.olcs.sync.FeatureConverter.prototype.getTransformFunction = function() {
  var pFrom = os.map.PROJECTION;

  if (this.lastProjection !== pFrom) {
    var pTo = ol.proj.get(os.proj.EPSG4326);
    this.transformFunction = !ol.proj.equivalent(pTo, pFrom) ? ol.proj.getTransform(pFrom, pTo) : null;
    this.lastProjection = pFrom;
  }

  return this.transformFunction;
};


/**
 * Create a Cesium geometry instance
 * @param {string} id The instance identifier
 * @param {!Cesium.Geometry} geometry The geometry
 * @param {!Cesium.Color} color The color
 * @return {!Cesium.GeometryInstance}
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.createGeometryInstance = function(id, geometry, color) {
  return new Cesium.GeometryInstance({
    id: id,
    geometry: geometry,
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
    }
  });
};


/**
 * Basics primitive creation using a color attribute.
 * Note that Cesium has 'interior' and outline geometries.
 * @param {!Cesium.Geometry} geometry The geometry.
 * @param {!Cesium.Color} color The primitive color.
 * @param {number=} opt_lineWidth The line width.
 * @param {Function=} opt_instanceFn The geometry instance function.
 * @return {!Cesium.Primitive}
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.createColoredPrimitive = function(geometry, color, opt_lineWidth,
    opt_instanceFn) {
  var options = os.object.unsafeClone(os.olcs.sync.FeatureConverter.BASE_PRIMITIVE_OPTIONS);
  if (opt_lineWidth != null) {
    options.renderState.lineWidth = opt_lineWidth;
  }

  var id = opt_lineWidth != null ? os.olcs.GeometryInstanceId.GEOM_OUTLINE : os.olcs.GeometryInstanceId.GEOM;
  var instances = opt_instanceFn ? opt_instanceFn(id, geometry, color) :
      this.createGeometryInstance(id, geometry, color);
  var appearance = new Cesium.PerInstanceColorAppearance(options);
  var primitive = new Cesium.Primitive({
    geometryInstances: instances,
    appearance: appearance
  });

  return primitive;
};


/**
 * Return the fill or stroke color from a plain ol style.
 * @param {!(ol.style.Style|ol.style.Text|ol.style.Circle)} style
 * @param {boolean} outline
 * @return {!Cesium.Color}
 */
os.olcs.sync.FeatureConverter.prototype.extractColorFromOlStyle = function(style, outline) {
  var fillColor = style.getFill() ? style.getFill().getColor() : null;
  var strokeColor = style.getStroke() ? style.getStroke().getColor() : null;

  var olColor = 'black';
  if (strokeColor && outline) {
    olColor = strokeColor;
  } else if (fillColor) {
    olColor = fillColor;
  }

  return olcs.core.convertColorToCesium(olColor);
};


/**
 * Return the width of stroke from a plain ol style. Let Cesium handle system line width issues.
 * @param {!ol.style.Style|ol.style.Text} style
 * @return {number}
 */
os.olcs.sync.FeatureConverter.prototype.extractLineWidthFromOlStyle = function(style) {
  // make sure the width is at least 1px
  return Math.max(1, /** @type {number} */ (style.getStroke() && style.getStroke().getWidth() ||
      os.style.DEFAULT_FEATURE_SIZE));
};


/**
 * Create a primitive collection out of two Cesium geometries.
 * Only the OpenLayers style colors will be used.
 * @param {Cesium.Geometry} fill The fill geometry
 * @param {Cesium.Geometry} outline The outline geometry
 * @param {!ol.style.Style} style The style
 * @param {!os.olcs.VectorContext} context The vector context
 * @return {!Cesium.PrimitiveCollection}
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.wrapFillAndOutlineGeometries = function(fill, outline, style, context) {
  var width = this.extractLineWidthFromOlStyle(style);
  var layerOpacity = context.layer.getOpacity();

  // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it.
  var primitives = new Cesium.PrimitiveCollection();
  primitives['olLineWidth'] = width;

  if (fill) {
    var fillColor = this.extractColorFromOlStyle(style, false);
    fillColor.alpha *= layerOpacity;

    primitives.add(this.createColoredPrimitive(fill, fillColor));
  }

  if (outline) {
    // combine the layer/style opacity if there is a stroke style, otherwise set it to 0 to hide the outline
    var outlineColor = this.extractColorFromOlStyle(style, true);
    outlineColor.alpha = style.getStroke() != null ? (outlineColor.alpha * layerOpacity) : 0;

    primitives.add(this.createColoredPrimitive(outline, outlineColor, width));
  }

  return primitives;
};


// Geometry converters
/**
 * Create a Cesium label if style has a text component.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Geometry} geometry
 * @param {Array<!ol.style.Style>} labels
 * @param {!os.olcs.VectorContext} context
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.createLabels = function(feature, geometry, labels, context) {
  var allOptions = [];
  goog.array.forEach(labels, function(label) {
    if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(label.getText()))) {
      var options = /** @type {!Cesium.optionsLabelCollection} */ ({
        heightReference: this.getHeightReference(context.layer, feature, geometry)
      });

      this.updateLabel(options, geometry, label, context);
      allOptions.push(options);
    }
  }, this);
  context.addLabels(allOptions, feature, geometry);
};


/**
 * Get the label position for a geometry.
 * @param {!ol.geom.Geometry} geometry The geometry.
 * @return {Array<number>} The position to use for the label.
 */
os.olcs.sync.getLabelPosition = function(geometry) {
  var geometryType = geometry.getType();
  switch (geometryType) {
    case ol.geom.GeometryType.POINT:
      return /** @type {!ol.geom.Point} */ (geometry).getFlatCoordinates().slice();
    case ol.geom.GeometryType.MULTI_POINT:
      return /** @type {!ol.geom.MultiPoint} */ (geometry).getFlatCoordinates().slice(0, 2);
    default:
      return ol.extent.getCenter(geometry.getExtent());
  }
};


/**
 * @param {!(Cesium.Label|Cesium.optionsLabelCollection)} label The label or label options
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.style.Style} style
 * @param {!os.olcs.VectorContext} context
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.updateLabel = function(label, geometry, style, context) {
  var geom = style.getGeometry();
  if (geom instanceof ol.geom.Geometry) {
    geometry = /** @type {!ol.geom.Geometry} */ (geom);
  }

  var textStyle = style.getText();

  // update the position if the geometry changed
  var geomRevision = geometry.getRevision();
  if (label.geomRevision === null || label.geomRevision !== geomRevision) {
    // TODO: export and use the text draw position from OL3. see src/ol/render/vector.js
    var transform = this.getTransformFunction();

    var labelPosition = os.olcs.sync.getLabelPosition(geometry);
    if (labelPosition) {
      if (transform) {
        labelPosition = transform(labelPosition);
      }

      if (geometry instanceof ol.geom.SimpleGeometry) {
        var first = geometry.getFirstCoordinate();
        if (transform) {
          first = transform(first, undefined, first.length);
        }

        labelPosition[2] = first[2] || 0.0;
      }

      label.position = olcs.core.ol4326CoordinateToCesiumCartesian(labelPosition);
      label.geomRevision = geomRevision;
    }
  }

  var labelStyle = undefined;
  var layerOpacity = context.layer.getOpacity();

  if (textStyle.getFill()) {
    label.fillColor = this.extractColorFromOlStyle(textStyle, false);
    label.fillColor.alpha *= layerOpacity;
    labelStyle = Cesium.LabelStyle.FILL;
  }
  if (textStyle.getStroke()) {
    label.outlineWidth = this.extractLineWidthFromOlStyle(textStyle);
    label.outlineColor = this.extractColorFromOlStyle(textStyle, true);
    label.outlineColor.alpha *= layerOpacity;
    labelStyle = Cesium.LabelStyle.OUTLINE;
  }
  if (textStyle.getFill() && textStyle.getStroke()) {
    labelStyle = Cesium.LabelStyle.FILL_AND_OUTLINE;
  }
  if (labelStyle) {
    label.style = labelStyle;
  }

  if (textStyle.getTextAlign()) {
    var horizontalOrigin;
    switch (textStyle.getTextAlign()) {
      case 'center':
        horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
        break;
      case 'left':
        horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
        break;
      case 'right':
        horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;
        break;
      default:
        goog.asserts.fail('unhandled text align ' + textStyle.getTextAlign());
    }
    label.horizontalOrigin = horizontalOrigin;
  }

  if (textStyle.getTextBaseline()) {
    var verticalOrigin;
    switch (textStyle.getTextBaseline()) {
      case 'top':
        verticalOrigin = Cesium.VerticalOrigin.TOP;
        break;
      case 'middle':
        verticalOrigin = Cesium.VerticalOrigin.CENTER;
        break;
      case 'bottom':
        verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
        break;
      case 'alphabetic':
        verticalOrigin = Cesium.VerticalOrigin.TOP;
        break;
      case 'hanging':
        verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
        break;
      default:
        goog.asserts.fail('unhandled baseline ' + textStyle.getTextBaseline());
    }
    label.verticalOrigin = verticalOrigin;
  }

  //
  // Replace characters that may throw Cesium into an infinite loop.
  //
  // Details:
  // Cesium replaces the Canvas2D measureText function with a third party library. Cesium doesn't account for Unicode
  // characters in labels and may pass character codes to the library that will result in an infinite loop when
  // measured.
  //
  // This removes characters outside the ASCII printable range to prevent that behavior.
  //
  var labelText = textStyle.getText() || '';
  label.text = labelText.replace(/[^\x20-\x7e\xa0-\xff]/g, '');

  label.font = textStyle.getFont() || 'normal 12px Arial';
  label.pixelOffset = new Cesium.Cartesian2(textStyle.getOffsetX(), textStyle.getOffsetY());

  // check if there is an associated primitive, and if it is shown
  var prim = context.getPrimitiveForGeometry(geometry);
  if (prim) {
    label.show = prim.show;
  }

  if (context.scene) {
    this.setLabelEyeOffset(label, context.scene);
  }

  if (label instanceof Cesium.Label) {
    // mark as updated so it isn't deleted
    label.dirty = false;
  }
};


/**
 * @param {!(Cesium.Label|Cesium.optionsLabelCollection)} label The label or label options
 * @param {!Cesium.Scene} scene
 * @param {Cesium.Cartesian3=} opt_offset
 */
os.olcs.sync.FeatureConverter.prototype.setLabelEyeOffset = function(label, scene, opt_offset) {
  if (opt_offset) {
    label.eyeOffset = opt_offset;
  } else {
    label.eyeOffset = this.labelEyeOffset_;
  }
};


/**
 * Convert an OpenLayers circle geometry to Cesium.
 * @param {!ol.Feature} feature OL3 feature
 * @param {!ol.geom.Circle} geometry OL3 circle geometry.
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style
 * @return {Cesium.PrimitiveCollection} primitives
 */
os.olcs.sync.FeatureConverter.prototype.olCircleGeometryToCesium = function(feature, geometry, context, style) {
  goog.asserts.assert(geometry.getType() == 'Circle');
  var transform = this.getTransformFunction();

  // ol.Coordinate
  var center = geometry.getCenter();
  var height = center[2] || 0.0;
  var point = center.slice();
  point[0] += geometry.getRadius();

  // Cesium
  if (transform) {
    center = transform(center, undefined, center.length);
    point = transform(point, undefined, point.length);
  }

  center = olcs.core.ol4326CoordinateToCesiumCartesian(center);
  point = olcs.core.ol4326CoordinateToCesiumCartesian(point);

  // Accurate computation of straight distance
  var radius = Cesium.Cartesian3.distance(center, point);

  var fillGeometry = new Cesium.CircleGeometry({
    center: center,
    radius: radius,
    height: height
  });

  var outlineGeometry = new Cesium.CircleOutlineGeometry({
    center: center,
    radius: radius,
    extrudedHeight: height,
    height: height
  });

  return this.wrapFillAndOutlineGeometries(fillGeometry, outlineGeometry, style, context);
};


/**
 * Convert an OpenLayers line string geometry to Cesium.
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.LineString} geometry Ol3 line string geometry.
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style
 * @return {Cesium.Primitive}
 */
os.olcs.sync.FeatureConverter.prototype.olLineStringGeometryToCesium = function(feature, geometry, context, style) {
  goog.asserts.assert(geometry.getType() == 'LineString');
  var transform = this.getTransformFunction();

  var coordinates = geometry.getCoordinates();
  if (coordinates.length < 2) {
    // ol3 allows line strings to have a single coordinate, while Cesium does not
    return null;
  }

  if (transform) {
    coordinates = coordinates.map(function(coord) {
      return transform(coord, undefined, coord.length);
    });
  }

  var lineGeometryToCreate = geometry.get('extrude') ? 'WallGeometry' : 'PolylineGeometry';
  var positions = olcs.core.ol4326CoordinateArrayToCsCartesians(coordinates);
  return this.createLinePrimitive(positions, context, style, lineGeometryToCreate);
};


/**
 * Create a Cesium line primitive.
 * @param {!Array<!Cesium.Cartesian3>} positions The geometry positions.
 * @param {!os.olcs.VectorContext} context The vector context.
 * @param {!ol.style.Style} style The feature style.
 * @param {string=} opt_type The line geometry type.
 * @return {Cesium.Primitive}
 */
os.olcs.sync.FeatureConverter.prototype.createLinePrimitive = function(positions, context, style, opt_type) {
  var type = opt_type || 'PolylineGeometry';
  var appearance = new Cesium.PolylineColorAppearance();

  var width = this.extractLineWidthFromOlStyle(style);
  var color = this.extractColorFromOlStyle(style, true);
  color.alpha *= context.layer.getOpacity();

  // Handle both color and width
  var outlineGeometry = new Cesium[type]({
    positions: positions,
    vertexFormat: appearance.vertexFormat,
    width: width
  });

  var instance = this.createGeometryInstance(os.olcs.GeometryInstanceId.GEOM_OUTLINE, outlineGeometry, color);
  var primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: appearance
  });

  // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it.
  primitive['olLineWidth'] = width;

  return primitive;
};


/**
 * Creates or updates a Cesium Billboard.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!(ol.geom.LineString|os.geom.Ellipse)} geometry The OL3 geometry
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style The OL3 style
 * @param {(Cesium.Polyline|Cesium.PolylineOptions)=} opt_polyline The polyline, for updates.
 */
os.olcs.sync.FeatureConverter.prototype.createOrUpdatePolyline = function(feature, geometry, context, style,
    opt_polyline) {
  if (opt_polyline) {
    this.updatePolyline(feature, geometry, context, style, opt_polyline);
  } else {
    this.createPolyline(feature, geometry, context, style);
  }
};


/**
 * Create a Cesium line primitive.
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!(ol.geom.LineString|os.geom.Ellipse)} geometry Ol3 line string geometry.
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style
 */
os.olcs.sync.FeatureConverter.prototype.createPolyline = function(feature, geometry, context, style) {
  var polylineOptions = /** @type {Cesium.PolylineOptions} */ ({});
  this.updatePolyline(feature, geometry, context, style, polylineOptions);

  context.addPolyline(polylineOptions, feature, geometry);
};


/**
 * Create a Cesium line primitive.
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!(ol.geom.LineString|os.geom.Ellipse)} geometry Ol3 line string geometry.
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style
 * @param {!(Cesium.Polyline|Cesium.PolylineOptions)} polyline The polyline, for updates.
 */
os.olcs.sync.FeatureConverter.prototype.updatePolyline = function(feature, geometry, context, style, polyline) {
  var geomRevision = geometry.getRevision();
  if (polyline.geomRevision != geomRevision) {
    var coordinates = geometry.getCoordinates();

    if (coordinates.length && geometry instanceof os.geom.Ellipse) {
      coordinates = coordinates[0];
    }

    var transform = this.getTransformFunction();
    if (transform) {
      coordinates = coordinates.map(function(coord) {
        return transform(coord, undefined, coord.length);
      });
    }

    polyline.positions = olcs.core.ol4326CoordinateArrayToCsCartesians(coordinates);
    polyline.geomRevision = geomRevision;
  }

  var width = this.extractLineWidthFromOlStyle(style);
  var color = this.extractColorFromOlStyle(style, true);
  color.alpha *= context.layer.getOpacity();

  polyline.material = Cesium.Material.fromType(Cesium.Material.ColorType, {
    color: color
  });
  polyline.width = width;

  if (polyline instanceof Cesium.Polyline) {
    // mark as updated so it isn't deleted
    polyline.dirty = false;
  }
};


/**
 * Get a ground reference line from a coordinate to the surface of the globe.
 * @param {!ol.Coordinate} coordinate The reference coordinate.
 * @param {!ol.style.Style} style The style
 * @param {!os.olcs.VectorContext} context The vector context
 * @return {Cesium.Primitive}
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.getGroundReference = function(coordinate, style, context) {
  var surface = coordinate.slice();
  surface[2] = 0;

  var coordinates = [coordinate, surface];
  var positions = olcs.core.ol4326CoordinateArrayToCsCartesians(coordinates);

  return this.createLinePrimitive(positions, context, style);
};


/**
 * Get a ground reference line from a coordinate to the surface of the globe.
 * @param {!ol.Feature} feature Ol3 feature
 * @param {!os.geom.Ellipse} geometry Ellipse geometry.
 * @param {!os.olcs.VectorContext} context The vector context
 * @param {!ol.style.Style} style The style
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.createOrUpdateGroundReference = function(feature, geometry, context, style) {
  var groundRef = null;

  if (os.implements(context.layer, os.layer.ILayer.ID)) {
    // check if the ground reference should be displayed
    var layer = /** @type {os.layer.ILayer} */ (context.layer);
    var layerId = layer.getId();
    var config = os.style.StyleManager.getInstance().getLayerConfig(layerId);
    if (config && config[os.style.StyleField.SHOW_GROUND_REF]) {
      var center = geometry.getCenter();
      var height = center[2];

      if (height) {
        var key = '_groundRefGeom';

        var surface = center.slice();
        surface[2] = 0;

        var coordinates = [center, surface];
        groundRef = /** @type {ol.geom.LineString|undefined} */ (feature.get(key));

        if (!groundRef) {
          groundRef = new ol.geom.LineString(coordinates);
        } else {
          var currCoords = groundRef.getCoordinates();
          if (Math.abs(currCoords[0][0] - center[0]) > 1E-9 || Math.abs(currCoords[0][1] - center[1]) > 1E-9) {
            groundRef.setCoordinates(coordinates);
          }
        }

        feature.set(key, groundRef, true);
      }
    }
  }

  if (groundRef) {
    var primitive = context.getPrimitiveForGeometry(groundRef);
    this.createOrUpdatePolyline(feature, groundRef, context, style, primitive);
  }
};


/**
 * Get the fill color for an ellipsoid.
 * @param {!ol.style.Style} style The style
 * @param {!os.olcs.VectorContext} context The vector context
 * @return {!Cesium.Color}
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.getEllipsoidFill = function(style, context) {
  // fill ellipsoid using stroke color at a base opacity of 50%
  var color = this.extractColorFromOlStyle(style, true);
  color.alpha = 0.3 * context.layer.getOpacity();

  return color;
};


/**
 * Get the stroke color for an ellipsoid.
 * @param {!ol.style.Style} style The style
 * @param {!os.olcs.VectorContext} context The vector context
 * @return {!Cesium.Color}
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.getEllipsoidStroke = function(style, context) {
  // create a white wireframe with reduced base alpha to make it less invasive
  var color = new Cesium.Color(1, 1, 1, 1);
  color.alpha = context.layer.getOpacity() * 0.75;

  return color;
};


/**
 * Create a primitive collection out of two Cesium ellipsoid geometries.
 * Only the OpenLayers style colors will be used.
 * @param {!Cesium.Geometry} fill The fill geometry
 * @param {!Cesium.Geometry} outline The outline geometry
 * @param {!ol.style.Style} style The style
 * @param {!os.olcs.VectorContext} context The vector context
 * @param {Function=} opt_instanceFn The geometry instance function.
 * @return {!Cesium.PrimitiveCollection}
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.wrapEllipsoidFillAndOutline = function(fill, outline, style, context,
    opt_instanceFn) {
  var width = this.extractLineWidthFromOlStyle(style);

  // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it.
  var primitives = new Cesium.PrimitiveCollection();
  primitives['olLineWidth'] = width;

  var fillColor = this.getEllipsoidFill(style, context);
  var outlineColor = this.getEllipsoidStroke(style, context);

  // wireframe width is fixed to give 3D context without being invasive
  var wireWidth = 1;

  primitives.add(this.createColoredPrimitive(fill, fillColor, undefined, opt_instanceFn));
  primitives.add(this.createColoredPrimitive(outline, outlineColor, wireWidth, opt_instanceFn));

  return primitives;
};


/**
 * Convert an OpenLayers polygon geometry to Cesium.
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!os.geom.Ellipse} geometry Ellipse geometry.
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style
 * @return {Cesium.PrimitiveCollection|Cesium.Primitive}
 */
os.olcs.sync.FeatureConverter.prototype.olEllipseGeometryToEllipsoid = function(feature, geometry, context, style) {
  var olCenter = geometry.getCenter();
  var center = olcs.core.ol4326CoordinateToCesiumCartesian(olCenter);
  var height = olCenter[2] || undefined;
  var semiMajor = geometry.getSemiMajor();
  var semiMinor = geometry.getSemiMinor();
  var rotation = Cesium.Math.toRadians(90 + geometry.getOrientation());

  var radii = new Cesium.Cartesian3(semiMajor, semiMinor, semiMinor);
  var headingPitchRoll = new Cesium.HeadingPitchRoll(rotation, 0, 0);
  var modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(center, headingPitchRoll, Cesium.Ellipsoid.WGS84,
      undefined, new Cesium.Matrix4());

  var fillGeometry = new Cesium.EllipsoidGeometry({
    radii: radii
  });

  var outlineGeometry = new Cesium.EllipsoidOutlineGeometry({
    radii: radii,
    stackPartitions: 2,
    slicePartitions: 4
  });

  var createEllipsoidInstance = function(id, geometry, color) {
    if (id === os.olcs.GeometryInstanceId.GEOM) {
      id = os.olcs.GeometryInstanceId.ELLIPSOID;
    } else {
      id = os.olcs.GeometryInstanceId.ELLIPSOID_OUTLINE;
    }

    return new Cesium.GeometryInstance({
      id: id,
      geometry: geometry,
      modelMatrix: modelMatrix,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
      }
    });
  };

  var primitives = this.wrapEllipsoidFillAndOutline(fillGeometry, outlineGeometry, style, context,
      createEllipsoidInstance);

  if (os.implements(context.layer, os.layer.ILayer.ID)) {
    // check if the ground reference should be displayed
    var layer = /** @type {os.layer.ILayer} */ (context.layer);
    var config = os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
    if (config && config[os.style.StyleField.SHOW_GROUND_REF] && height) {
      var groundRef = this.getGroundReference(olCenter, style, context);
      if (groundRef) {
        primitives.add(groundRef);
      }
    }
  }

  return primitives;
};


/**
 * Creates a Cesium.PolygonHierarchy from an ol.geom.Polygon.
 * @param {!ol.geom.Polygon} geometry The OL polygon
 * @return {Cesium.PolygonHierarchy}
 */
os.olcs.sync.FeatureConverter.prototype.createPolygonHierarchy = function(geometry) {
  var transform = this.getTransformFunction();

  var rings = geometry.getLinearRings();
  var positions;
  var holes;
  var extrude = !!geometry.get('extrude');
  goog.asserts.assert(rings.length > 0);

  for (var i = 0; i < rings.length; ++i) {
    var olPos = rings[i].getCoordinates();
    var csPos;
    var extent = rings[i].getExtent();

    if (transform) {
      extent = transform(extent);
      olPos = olPos.map(function(coord) {
        return transform(coord, undefined, coord.length);
      });
    }

    if (rings.length === 1 && os.geo.isRectangular(olPos, extent)) {
      csPos = os.olcs.generateRectanglePositions(extent, 0, extrude);
    } else {
      csPos = olcs.core.ol4326CoordinateArrayToCsCartesians(olPos);
    }
    // csPos = olcs.core.ol4326CoordinateArrayToCsCartesians(olPos);
    // if a ring is empty, just ignore it
    if (csPos && csPos.length > 0) {
      if (i == 0) {
        positions = csPos;
      } else {
        holes = holes || [];
        holes.push(new Cesium.PolygonHierarchy(csPos));
      }
    }
  }

  // don't create a polygon if we don't have an outer ring
  return positions ? new Cesium.PolygonHierarchy(positions, holes) : null;
};


/**
 * Convert an OpenLayers polygon geometry to Cesium, this method does NOT handle line width
 * in windows.
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Polygon} geometry Ol3 polygon geometry.
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style
 * @return {Cesium.PrimitiveCollection}
 */
os.olcs.sync.FeatureConverter.prototype.olPolygonGeometryToCesium = function(feature, geometry, context, style) {
  var fillGeometry = null;
  var outlineGeometry = null;
  var transform = this.getTransformFunction();
  var extrude = !!geometry.get('extrude');

  var clone = geometry.clone();
  clone.toLonLat();

  if (os.geo.isGeometryRectangular(clone)) {
    var altitude = os.geo.getAverageAltitude(geometry.getLinearRings()[0].getCoordinates());
    var extent = geometry.getLinearRings()[0].getExtent();

    if (transform) {
      extent = transform(extent);
    }

    var rect = Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]);

    if (style.getFill()) {
      fillGeometry = new Cesium.RectangleGeometry({
        ellipsoid: Cesium.Ellipsoid.WGS84,
        rectangle: rect,
        height: altitude,
        closeTop: true,
        closeBottom: false,
        extrudedHeight: extrude ? 0 : undefined
      });
    }

    outlineGeometry = new Cesium.RectangleOutlineGeometry({
      ellipsoid: Cesium.Ellipsoid.WGS84,
      rectangle: rect,
      height: altitude,
      extrudedHeight: extrude ? 0 : undefined
    });
  } else {
    var hierarchy = this.createPolygonHierarchy(geometry);
    if (!hierarchy) {
      return null;
    }

    if (style.getFill()) {
      fillGeometry = new Cesium.PolygonGeometry({
        polygonHierarchy: hierarchy,
        perPositionHeight: true,
        extrudedHeight: extrude ? 0 : undefined
      });
    }

    outlineGeometry = new Cesium.PolygonOutlineGeometry({
      polygonHierarchy: hierarchy,
      perPositionHeight: true,
      extrudedHeight: extrude ? 0 : undefined
    });
  }

  return this.wrapFillAndOutlineGeometries(fillGeometry, outlineGeometry, style, context);
};


/**
 * Convert an OpenLayers polygon geometry to Cesium.
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Polygon} geometry Ol3 polygon geometry.
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style
 * @return {Cesium.PrimitiveCollection|Cesium.Primitive}
 */
os.olcs.sync.FeatureConverter.prototype.olPolygonGeometryToCesiumPolyline = function(feature, geometry,
    context, style) {
  // extruded polygons cannot be rendered as a polyline. since polygons will not respect line width on Windows, make
  // sure the geometry is both extruded and has an altitude before using the polygon primitive.
  var extrude = !!geometry.get('extrude');
  if (extrude && os.geo.hasAltitudeGeometry(geometry)) {
    return this.olPolygonGeometryToCesium(feature, geometry, context, style);
  } else {
    var hierarchy = this.createPolygonHierarchy(geometry);
    if (!hierarchy) {
      return null;
    }

    var csRings = [hierarchy.positions];
    if (hierarchy.holes) {
      hierarchy.holes.forEach(function(hole) {
        csRings.push(hole.positions);
      });
    }

    goog.asserts.assert(csRings.length > 0);

    var appearance = new Cesium.PolylineColorAppearance();

    var width = this.extractLineWidthFromOlStyle(style);
    var layerOpacity = context.layer.getOpacity();

    // combine the layer/style opacity if there is a stroke style, otherwise set it to 0 to hide the outline
    var outlineColor = this.extractColorFromOlStyle(style, true);
    outlineColor.alpha = style.getStroke() != null ? (outlineColor.alpha * layerOpacity) : 0;

    var primitives = new Cesium.PrimitiveCollection();

    // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it. also
    // save if the outline needs to be displayed, so we know to recreate the primitive if that changes.
    primitives['olLineWidth'] = width;

    // always create outlines even if the style doesn't have a stroke. this allows updating the primitive if a stroke
    // is added without recreating it.
    for (var i = 0; i < csRings.length; ++i) {
      // Handle both color and width
      var polylineGeometry = new Cesium.PolylineGeometry({
        positions: csRings[i],
        vertexFormat: appearance.vertexFormat,
        width: width
      });

      var instance = this.createGeometryInstance(os.olcs.GeometryInstanceId.GEOM_OUTLINE, polylineGeometry,
          outlineColor);
      var outlinePrimitive = new Cesium.Primitive({
        geometryInstances: instance,
        appearance: appearance
      });
      primitives.add(outlinePrimitive);
    }

    if (style.getFill()) {
      // perPositionHeight: true on the fill was causing weird visual artifacts on large polygons, so it's disabled here
      var fillGeometry = new Cesium.PolygonGeometry({
        polygonHierarchy: hierarchy,
        perPositionHeight: false,
        extrudedHeight: undefined
      });

      var fillColor = this.extractColorFromOlStyle(style, false);
      fillColor.alpha *= layerOpacity;

      var p = this.createColoredPrimitive(fillGeometry, fillColor);
      primitives.add(p);
    }

    if (primitives.length == 1) {
      // if there is only 1 primative, set the outline properties on it and return it instead of the collection
      var result = /** @type {!Cesium.Primitive} */(primitives.get(0));
      result['olLineWidth'] = width;

      return result;
    } else {
      return primitives;
    }
  }
};


/**
 * @param {boolean} enabled
 */
os.olcs.sync.FeatureConverter.prototype.setAltitudeEnabled = function(enabled) {
  if (enabled) {
    this.heightReference_ = Cesium.HeightReference.NONE;
  } else {
    this.heightReference_ = Cesium.HeightReference.CLAMP_TO_GROUND;
  }
};


/**
 * @param {ol.layer.Vector} layer
 * @param {ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Geometry} geometry
 * @return {!Cesium.HeightReference}
 */
os.olcs.sync.FeatureConverter.prototype.getHeightReference = function(layer, feature, geometry) {
  // disable height reference because the implementation is fairly slow right now
  return this.heightReference_;

  // // Read from the geometry
  // var altitudeMode = geometry.get('altitudeMode');

  // // Or from the feature
  // if (!goog.isDef(altitudeMode)) {
  //   altitudeMode = feature.get('altitudeMode');
  // }

  // // Or from the layer
  // if (!goog.isDef(altitudeMode)) {
  //   altitudeMode = layer.get('altitudeMode');
  // }

  // var heightReference = Cesium.HeightReference.NONE;
  // if (altitudeMode === 'clampToGround') {
  //   heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
  // } else if (altitudeMode === 'relativeToGround') {
  //   heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
  // }

  // return heightReference;
};


/**
 * Creates or updates a Cesium Billboard.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Point} geometry The OL3 geometry
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style The OL3 style
 * @param {(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)=} opt_billboard The billboard, for updates
 * @suppress {checkTypes}
 */
os.olcs.sync.FeatureConverter.prototype.createOrUpdateBillboard = function(feature, geometry, context, style,
    opt_billboard) {
  var imageStyle = style.getImage();
  if (imageStyle) {
    var imageState = imageStyle.getImageState();
    if (imageState < ol.ImageState.LOADED) {
      // state is either idle or loading, so wait for the image to load/error
      if (opt_billboard instanceof Cesium.Billboard) {
        // make sure it isn't cleaned up while waiting for the image to load
        opt_billboard.dirty = false;
      }

      // image load has not been called yet, so call it now
      if (imageState == ol.ImageState.IDLE) {
        imageStyle.load();
      }


      // avoid duplicate listeners
      var fid = feature.getId();
      if (this.listenerMap_[fid]) {
        return;
      }
      this.listenerMap_[fid] = true;

      // listen for the image to change state
      var listenKey = imageStyle.listenImageChange(function() {
        if (listenKey) {
          ol.events.unlistenByKey(listenKey);
        }

        // try creating/updating again as long as the image isn't in the error state
        if (imageStyle.getImageState() < ol.ImageState.ERROR && context.featureToShownMap[feature['id']]) {
          // if the billboard has already been created, make sure it's still in the collection
          if (!(opt_billboard instanceof Cesium.Billboard) ||
              (context.billboards && context.billboards.contains(opt_billboard))) {
            this.createOrUpdateBillboard(feature, geometry, context, style, opt_billboard);
          }
        }

        delete this.listenerMap_[fid];
        // TODO: handle image error?
      }, this);
    } else if (opt_billboard) {
      this.updateBillboard(feature, geometry, opt_billboard, imageStyle, context.layer);
    } else {
      this.createBillboard(feature, geometry, context, imageStyle);
    }
  }
};


/**
 * Create a Cesium Billboard from an OpenLayers image style.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Point} geometry The OL3 geometry
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Image} style The image style
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.createBillboard = function(feature, geometry, context, style) {
  var image = style.getImage(1); // get normal density
  if (image instanceof HTMLCanvasElement || image instanceof Image || image instanceof HTMLImageElement) {
    var heightReference = this.getHeightReference(context.layer, feature, geometry);

    var options = /** @type {!Cesium.optionsBillboardCollectionAdd} */ ({
      heightReference: heightReference
    });

    this.updateBillboard(feature, geometry, options, style, context.layer);
    context.addBillboard(options, feature, geometry);
  }
};


/**
 * Update a Cesium Billboard from an OpenLayers image style.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Point} geometry The OL3 geometry
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb The billboard or billboard options
 * @param {!ol.style.Image} style The image style
 * @param {!ol.layer.Vector} layer The OL3 layer
 * @protected
 */
os.olcs.sync.FeatureConverter.prototype.updateBillboard = function(feature, geometry, bb, style, layer) {
  // update the position if the geometry changed
  var geomRevision = geometry.getRevision();
  if (bb.geomRevision == null || bb.geomRevision != geomRevision) {
    var transform = this.getTransformFunction();
    var center = geometry.getCoordinates();
    center = transform ? transform(center, undefined, center.length) : center;

    bb.position = olcs.core.ol4326CoordinateToCesiumCartesian(center);

    bb.geomRevision = geomRevision;
  }

  var imageId;
  var image;
  var iconColor;

  if (style instanceof ol.style.Icon) {
    //
    // Cesium should load icons directly instead of reusing the canvas from Openlayers. if the canvas is reused, each
    // variation (color, scale, rotation, etc) of the same icon will be added to Cesium's texture atlas. this uses
    // more memory than necessary, and is far more likely to hit the size limit for the atlas.
    //
    image = imageId = style.getSrc() || undefined;

    var styleColor = style.getColor();
    if (styleColor) {
      iconColor = olcs.core.convertColorToCesium(styleColor);
    }
  } else {
    image = style.getImage(1);

    // Cesium uses the imageId to identify a texture in the WebGL texture atlas. this *must* be unique to the texture
    // being displayed, but we want as much reuse as possible. we'll try:
    //  - The style id that we use to cache OL3 styles
    //  - Fall back on the UID of the image/canvas
    imageId = style['id'] || ol.getUid(image);
  }

  if (goog.isString(image) || image instanceof HTMLCanvasElement || image instanceof Image ||
      image instanceof HTMLImageElement) {
    if (bb instanceof Cesium.Billboard) {
      bb.setImage(imageId, image);
      bb.pixelOffset.x = 0;
      bb.pixelOffset.y = 0;
    } else {
      bb.image = image;
      bb.imageId = imageId;
      bb.pixelOffset = new Cesium.Cartesian2(0, 0);
    }

    // use the icon color if available, otherwise default to white to use the original image color
    var color = iconColor || new Cesium.Color(1.0, 1.0, 1.0, 1.0);
    color.alpha = layer.getOpacity();
    var opacity = style.getOpacity();
    if (opacity != null) {
      color.alpha = color.alpha * opacity;
    }

    bb.color = color;

    var scale = style.getScale();
    bb.scale = scale != null ? scale : 1.0;
    bb.rotation = -style.getRotation() || 0;

    // rotate on z-axis, so rotation references the cardinal direction.
    // note: Cesium doesn't handle this well when the camera is rotated more than +/- 90 degrees from north.
    bb.alignedAxis = Cesium.Cartesian3.UNIT_Z;

    // default to horizontally centered, but icons should reasonably respect the anchor value
    var horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
    var verticalOrigin = Cesium.VerticalOrigin.CENTER;
    var pixelOffset = bb.pixelOffset;
    if (style instanceof ol.style.Icon) {
      var anchor = style.getAnchor();
      var size = style.getSize();

      if (anchor && size) {
        // if we know the anchor and size, compute the pixel offset directly
        pixelOffset.x = Math.round(bb.scale * (size[0] - anchor[0]));
        horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;

        pixelOffset.y = Math.round(bb.scale * (size[1] - anchor[1]));
        verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
      }
    }

    bb.heightReference = this.heightReference_;
    bb.horizontalOrigin = horizontalOrigin;
    bb.verticalOrigin = verticalOrigin;
    bb.pixelOffset = pixelOffset;

    if (bb instanceof Cesium.Billboard) {
      // mark as updated so it isn't deleted
      bb.dirty = false;
    }
  }
};


/**
 * Returns true if the style matches the highlight style.
 * @param {!ol.style.Style} style [description]
 * @return {boolean} [description]
 */
os.olcs.sync.FeatureConverter.prototype.isHighlightStyle = function(style) {
  if (style && style.getStroke()) {
    return (os.style.DEFAULT_HIGHLIGHT_CONFIG.stroke.color === style.getStroke().getColor());
  }
  return false;
};


/**
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Geometry} geometry The geometry to be converted
 * @param {!ol.style.Style} style The geometry style
 * @param {!os.olcs.VectorContext} context Cesium synchronization context
 * @param {!Cesium.PrimitiveLike} primitive The Cesium primitive
 */
os.olcs.sync.FeatureConverter.prototype.updatePrimitive = function(feature, geometry, style, context, primitive) {
  if (!primitive.ready) {
    // primitives won't be marked as ready until they've been loaded to the GPU. we can't update them until they're
    // ready, so call this again on a delay. limit to 20 tries in case a primitive is never ready for whatever
    // reason.
    primitive.updateRetries = goog.isDef(primitive.updateRetries) ? primitive.updateRetries + 1 : 1;

    if (primitive.updateRetries < 20) {
      var callback = goog.partial(this.updatePrimitive, feature, geometry, style, context, primitive);
      var delay = new goog.async.Delay(callback, 100, this);
      delay.start();
    }

    primitive.dirty = false;
  } else if (!primitive.isDestroyed() && !feature.isDisposed()) {
    // ready for update
    primitive.updateRetries = 0;

    for (var key in os.olcs.GeometryInstanceId) {
      // the try-catch is for the lovely DevErrors in Unminified Cesium
      try {
        var field = os.olcs.GeometryInstanceId[key];
        var attributes = primitive.getGeometryInstanceAttributes(field);
        if (attributes) {
          var color;

          var isEllipsoid = os.olcs.ELLIPSOID_REGEXP.test(field);
          var isOutline = os.olcs.OUTLINE_REGEXP.test(field);

          if (isEllipsoid) {
            if (isOutline) {
              color = this.getEllipsoidStroke(style, context);
            } else {
              color = this.getEllipsoidFill(style, context);
            }
          } else {
            color = this.extractColorFromOlStyle(style, isOutline);

            if (isOutline && !this.isHighlightStyle(style) && !style.getStroke()) {
              // special Case for handling geometries without outlines
              color.alpha = 0;
            } else {
              color.alpha *= context.layer.getOpacity();
            }
          }

          if (color) {
            attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(color, attributes.color);
          }
        }
      } catch (e) {
      }
    }

    primitive.dirty = false;
  } else {
    // get rid of it
    primitive.dirty = true;
  }
};


/**
 * Convert an OpenLayers multi-something geometry to Cesium.
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Geometry} geometry Ol3 geometry.
 * @param {!os.olcs.VectorContext} context
 * @param {!ol.style.Style} style
 * @return {?Cesium.PrimitiveLike}
 */
os.olcs.sync.FeatureConverter.prototype.olMultiGeometryToCesium = function(feature, geometry, context, style) {
  // FIXME: would be better to combine all child geometries in one primitive. instead we create n primitives for
  // simplicity (eg, laziness).

  var subGeos;
  var geomType = geometry.getType();
  switch (geomType) {
    case 'MultiPoint':
      geometry = /** @type {!ol.geom.MultiPoint} */ (geometry);
      subGeos = geometry.getPoints();

      subGeos.forEach(function(subGeo) {
        goog.asserts.assert(!goog.isNull(subGeo));
        this.createOrUpdateBillboard(feature, subGeo, context, style);
      }, this);
      break;
    case 'MultiLineString':
      geometry = /** @type {!ol.geom.MultiLineString} */ (geometry);
      subGeos = geometry.getLineStrings();

      if (feature instanceof os.feature.DynamicFeature) {
        // dynamic lines may change frequently and should use Cesium.Polyline to avoid recreating on each change,
        // which will cause a flicker while the new Primitive is loaded to the GPU.
        subGeos.forEach(function(subGeo) {
          if (subGeo) {
            this.createOrUpdatePolyline(feature, subGeo, context, style);
          }
        }, this);
      } else {
        // all other lines should use Cesium.Primitive/Cesium.PolylineGeometry, which is more performant for picking.
        var primitives = new Cesium.PrimitiveCollection();
        subGeos.forEach(function(subGeo) {
          if (subGeo) {
            var prim = this.olLineStringGeometryToCesium(feature, subGeo, context, style);
            if (prim) {
              primitives.add(prim);

              // all lines share a style, so they will all have the same width.
              primitives['olLineWidth'] = prim['olLineWidth'];
            }
          }
        }, this);
        return primitives;
      }
      break;
    case 'MultiPolygon':
      geometry = /** @type {!ol.geom.MultiPolygon} */ (geometry);
      subGeos = geometry.getPolygons();

      // ol.geom.MultiPolygon#getPolygons recreates polys from the flat coordinates, so the extrude values need to be
      // reconstituted from the MultiPolygon.
      var extrude = /** @type {Array<boolean>|undefined} */ (geometry.get('extrude'));
      if (extrude && extrude.length == subGeos.length) {
        for (var i = 0; i < extrude.length; i++) {
          subGeos[i].set('extrude', extrude[i], true);
        }
      }

      var primitives = new Cesium.PrimitiveCollection();
      subGeos.forEach(function(subGeo) {
        if (subGeo) {
          var prim = this.olPolygonGeometryToCesiumPolyline(feature, subGeo, context, style);
          // var prim = this.olPolygonGeometryToCesium(feature, subGeo, context, style);
          if (prim) {
            primitives.add(prim);

            // all polygons share a style, so they will all have the same width.
            primitives['olLineWidth'] = prim['olLineWidth'];
          }
        }
      }, this);
      return primitives;
    default:
      goog.asserts.fail('Unhandled multi geometry type' + geometry.getType());
  }

  return null;
};


/**
 * Get the style used to render a feature.
 * @param {!ol.Feature} feature
 * @param {number} resolution
 * @param {!ol.layer.Vector} layer
 * @return {Array<ol.style.Style>} null if no style is available
 */
os.olcs.sync.FeatureConverter.prototype.getFeatureStyles = function(feature, resolution, layer) {
  var style;

  // feature style takes precedence
  var featureStyle = feature.getStyleFunction();
  if (goog.isDef(featureStyle)) {
    style = featureStyle.call(feature, resolution);
  }

  // use the fallback if there isn't one
  if (!goog.isDefAndNotNull(style)) {
    var layerStyle = layer.getStyleFunction();
    if (layerStyle) {
      style = layerStyle(feature, resolution);
    }
  }

  if (!goog.isDef(style)) {
    return null;
  }

  // always return an array
  if (style instanceof ol.style.Style) {
    style = [style];
  }

  return style;
};


/**
 * Convert an OL3 geometry to Cesium.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Geometry} geometry The geometry to be converted
 * @param {!ol.style.Style} style The geometry style
 * @param {!os.olcs.VectorContext} context Cesium synchronization context
 * @param {Array<!ol.style.Style>=} opt_labels - the group of labels to apply to the geometries
 */
os.olcs.sync.FeatureConverter.prototype.olGeometryToCesium = function(feature, geometry, style, context, opt_labels) {
  if (opt_labels) {
    var currentLabels = context.getLabelsForGeometry(geometry);
    if (currentLabels == null || opt_labels.length != currentLabels.length) {
      this.createLabels(feature, geometry, opt_labels, context);
    } else {
      goog.array.forEach(opt_labels, function(label, index) {
        this.updateLabel(currentLabels[index], geometry, label, context);
      }, this);
    }
  }

  // only set this if a primitive is being recreated and we need to preserve the show state
  var wasPrimitiveShown;

  // check if we have a primitive for the geometry already
  var primitive = context.getPrimitiveForGeometry(geometry);

  // if the outline width changed, we need to recreate the primitive since Cesium can't change the width on a geometry
  // instance
  if (primitive && primitive['olLineWidth'] != null) {
    var dirty = geometry.get(os.olcs.DIRTY_BIT);
    var width = this.extractLineWidthFromOlStyle(style);
    if (dirty || primitive['olLineWidth'] != width) {
      wasPrimitiveShown = primitive.show;
      context.removePrimitive(primitive);
      geometry.set(os.olcs.DIRTY_BIT, false);
      primitive = null;
    }
  }

  var geomType = geometry.getType();

  if (geometry instanceof os.geom.Ellipse) {
    geomType = 'ellipse';
  }

  if (primitive && geomType != ol.geom.GeometryType.GEOMETRY_COLLECTION) {
    // already exists - update it
    this.updatePrimitiveLike(feature, geometry, style, context, primitive);
  } else {
    // create a new primitive
    switch (geomType) {
      case ol.geom.GeometryType.GEOMETRY_COLLECTION:
        var olGeometries = /** @type {!ol.geom.GeometryCollection} */ (geometry).getGeometriesArray();
        for (var i = 0, n = olGeometries.length; i < n; i++) {
          var olGeometry = olGeometries[i];
          if (olGeometry) {
            this.olGeometryToCesium(feature, olGeometry, style, context);
          }
        }
        break;
      case ol.geom.GeometryType.POINT:
        geometry = /** @type {!ol.geom.Point} */ (geometry);
        this.createOrUpdateBillboard(feature, geometry, context, style);
        break;
      case ol.geom.GeometryType.CIRCLE:
        geometry = /** @type {!ol.geom.Circle} */ (geometry);
        primitive = this.olCircleGeometryToCesium(feature, geometry, context, style);
        break;
      case ol.geom.GeometryType.LINE_STRING:
        geometry = /** @type {!ol.geom.LineString} */ (geometry);

        // TODO: both of these should be replaced by the Entity API (polyline/polylineVolume)
        if (feature instanceof os.feature.DynamicFeature) {
          // dynamic lines may change frequently and should use Cesium.Polyline to avoid recreating on each change,
          // which will cause a flicker while the new Primitive is loaded to the GPU.
          this.createOrUpdatePolyline(feature, geometry, context, style);
        } else {
          // all other lines should use Cesium.Primitive/Cesium.PolylineGeometry, which is more performant for picking.
          primitive = this.olLineStringGeometryToCesium(feature, geometry, context, style);
        }
        break;
      case 'ellipse':
        geometry = /** @type {!os.geom.Ellipse} */ (geometry);

        var layer = /** @type {os.layer.ILayer} */ (context.layer);
        var config = os.style.StyleManager.getInstance().getLayerConfig(layer.getId());
        if (config && config[os.style.StyleField.SHOW_ELLIPSOIDS]) {
          primitive = this.olEllipseGeometryToEllipsoid(feature, geometry, context, style);
        } else {
          primitive = this.olPolygonGeometryToCesiumPolyline(feature, geometry, context, style);
        }
        this.createOrUpdateGroundReference(feature, geometry, context, style);
        break;
      case ol.geom.GeometryType.POLYGON:
        geometry = /** @type {!ol.geom.Polygon} */ (geometry);
        primitive = this.olPolygonGeometryToCesiumPolyline(feature, geometry, context, style);
        // primitive = this.olPolygonGeometryToCesium(feature, geometry, context, style);
        break;
      case ol.geom.GeometryType.MULTI_POINT:
      case ol.geom.GeometryType.MULTI_LINE_STRING:
      case ol.geom.GeometryType.MULTI_POLYGON:
        primitive = this.olMultiGeometryToCesium(feature, geometry, context, style);
        break;
      case ol.geom.GeometryType.LINEAR_RING:
        throw new Error('LinearRing should only be part of polygon.');
      default:
        throw new Error('OL3 geometry type not handled : ' + geometry.getType());
    }

    if (primitive) {
      if (wasPrimitiveShown != null) {
        // primitive was recreated, so restore the show state
        primitive.show = wasPrimitiveShown;
      }

      context.addPrimitive(primitive, feature, geometry);
    }
  }
};


/**
 * Updates a Cesium primitive.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Geometry} geometry The geometry to be converted
 * @param {!ol.style.Style} style The geometry style
 * @param {!os.olcs.VectorContext} context Cesium synchronization context
 * @param {!Cesium.PrimitiveLike} primitive The Cesium primitive
 */
os.olcs.sync.FeatureConverter.prototype.updatePrimitiveLike = function(feature, geometry, style, context, primitive) {
  if (primitive instanceof Cesium.PrimitiveCollection) {
    for (var i = 0, n = primitive.length; i < n; i++) {
      this.updatePrimitiveLike(feature, geometry, style, context, primitive.get(i));
    }

    // mark as updated so it isn't removed
    primitive.dirty = false;
  } else if (primitive instanceof Cesium.Billboard) {
    this.createOrUpdateBillboard(feature, /** @type {!ol.geom.Point} */ (geometry), context, style, primitive);
  } else if (primitive instanceof Cesium.Polyline) {
    this.createOrUpdatePolyline(feature, /** @type {!ol.geom.LineString} */ (geometry), context, style, primitive);
  } else {
    this.updatePrimitive(feature, geometry, style, context, primitive);
  }

  if (geometry instanceof os.geom.Ellipse) {
    this.createOrUpdateGroundReference(feature, geometry, context, style);
  }
};


/**
 * Convert an OpenLayers vector layer to Cesium primitive collection.
 * @param {!ol.layer.Vector} layer The map layer
 * @param {!ol.View} view The OL3 view
 * @return {!os.olcs.VectorContext}
 */
os.olcs.sync.FeatureConverter.prototype.olVectorLayerToCesium = function(layer, view) {
  var projection = view.getProjection();
  var resolution = view.getResolution();
  if (!goog.isDefAndNotNull(projection) || !goog.isDef(resolution)) {
    // an assertion is not enough for closure to assume resolution and projection are defined
    throw new Error('view not ready');
  }

  var context = new os.olcs.VectorContext(this.scene, layer, projection);
  var features = layer.getSource().getFeatures();
  for (var i = 0, n = features.length; i < n; i++) {
    var feature = features[i];
    if (feature) {
      this.convert(feature, resolution, context);
    }
  }

  return context;
};


/**
 * Convert an OpenLayers feature to Cesium primitive collection.
 * @param {!ol.Feature} feature The OL3 feature
 * @param {number} resolution The OL3 view resolution
 * @param {!os.olcs.VectorContext} context
 */
os.olcs.sync.FeatureConverter.prototype.convert = function(feature, resolution, context) {
  context.markDirty(feature);

  var styles = this.getFeatureStyles(feature, resolution, context.layer);

  // Split the styles into normal styles and labels
  var split = goog.array.bucket(styles, function(style) {
    // MASSIVE ASSUMPTION ALERT!
    // I decided to separate label styles from geometry styles for caching purposes, but it also allows making the below
    // assumption that anything with a text style is for a label, and anything else is for a primitive/billboard. sorry
    // if this wrecks your party.
    return style.getText() ? 'labels' : 'other';
  });

  styles = split['other'];

  var textStyles = split['labels'];
  var labelGeometry;

  if (textStyles && textStyles.length > 0) {
    // check if the feature defines which geometry should be used to position the label
    var labelGeometryName = /** @type {string|undefined} */ (feature.get(os.style.StyleField.LABEL_GEOMETRY));
    if (labelGeometryName) {
      labelGeometry = /** @type {ol.geom.Geometry|undefined} */ (feature.get(labelGeometryName));
    }
  }

  if (styles) {
    for (var i = 0, n = styles.length; i < n; i++) {
      var style = styles[i];
      if (style) {
        var geometry = style.getGeometryFunction()(feature);
        if (geometry) {
          // render labels if there isn't a label geometry or the current geometry is the label geometry
          var renderedLabels = (!labelGeometry || labelGeometry == geometry) ? textStyles : undefined;
          this.olGeometryToCesium(feature, geometry, style, context, renderedLabels);

          // never render labels more than once
          if (renderedLabels) {
            textStyles = undefined;
          }
        }
      }
    }
  }

  context.removeDirty(feature);
};


/**
 * @param {!Cesium.Cartesian3} labelOffset
 */
os.olcs.sync.FeatureConverter.prototype.setLabelEyeOffsetDefault = function(labelOffset) {
  this.labelEyeOffset_ = labelOffset;
};


/**
 * @param {!Cesium.Cartesian3} primOffset
 */
os.olcs.sync.FeatureConverter.prototype.setEyeOffset = function(primOffset) {
  this.eyeOffset_ = primOffset;
};


/**
 * @return {!Cesium.Cartesian3}
 */
os.olcs.sync.FeatureConverter.prototype.getEyeOffset = function() {
  return this.eyeOffset_;
};
