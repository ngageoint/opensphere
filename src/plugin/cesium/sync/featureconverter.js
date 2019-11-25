goog.provide('plugin.cesium.sync.FeatureConverter');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Delay');
goog.require('goog.math');
goog.require('goog.string');
goog.require('ol.ImageState');
goog.require('ol.events');
goog.require('ol.extent');
goog.require('ol.geom.LineString');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat.inflate');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.source.WMTS');
goog.require('ol.style.Icon');
goog.require('ol.style.Style');
goog.require('os.fn');
goog.require('os.geom.GeometryField');
goog.require('os.implements');
goog.require('os.layer.ILayer');
goog.require('os.map');
goog.require('os.query');
goog.require('os.style.label');
goog.require('os.webgl');
goog.require('plugin.cesium');
goog.require('plugin.cesium.VectorContext');


/**
 * Class for converting from OpenLayers3 vectors to Cesium primitives.
 *
 * @param {!Cesium.Scene} scene Cesium scene.
 * @constructor
 */
plugin.cesium.sync.FeatureConverter = function(scene) {
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
  this.eyeOffset_ = new Cesium.Cartesian3(0.0, 0.0, 0.0);

  /**
   * The default eye offset for labels
   * @type {!Cesium.Cartesian3}
   * @private
   */
  this.labelEyeOffset_ = new Cesium.Cartesian3(0.0, 0.0, 10000);

  /**
   * Map of images being listened to
   * @type {Object}
   * @private
   */
  this.listenerMap_ = {};

  /**
   * Scales billboards/labels based on globe zoom.
   * @type {Cesium.NearFarScalar}
   * @private
   */
  this.distanceScalar_ = new Cesium.NearFarScalar(
      os.map.ZoomScale.NEAR, os.map.ZoomScale.NEAR_SCALE,
      os.map.ZoomScale.FAR, os.map.ZoomScale.FAR_SCALE);
};


/**
 * The angular distance between points on the ellipse in radians.
 * @type {number}
 * @const
 */
plugin.cesium.sync.FeatureConverter.ELLIPSE_GRANULARITY = 0.002;


/**
 * Base Cesium primitive render options.
 * @type {!Object}
 * @const
 */
plugin.cesium.sync.FeatureConverter.BASE_PRIMITIVE_OPTIONS = {
  flat: true,
  renderState: {
    depthTest: {
      enabled: true
    }
  }
};


/**
 * Gets the transform function
 *
 * @return {?ol.TransformFunction}
 */
plugin.cesium.sync.FeatureConverter.prototype.getTransformFunction = function() {
  var pFrom = os.map.PROJECTION;

  if (this.lastProjection !== pFrom) {
    var pTo = ol.proj.get(os.proj.EPSG4326);
    var olTransform = !ol.proj.equivalent(pTo, pFrom) ? ol.proj.getTransform(pFrom, pTo) : null;

    /**
     * @param {ol.Coordinate} coord
     * @param {ol.Coordinate=} opt_output
     * @param {number=} opt_length
     * @return {ol.Coordinate}
     */
    this.transformFunction = olTransform ? function(coord, opt_output, opt_length) {
      var result = olTransform(coord, opt_output, opt_length);
      if (opt_output) {
        var n = opt_length == undefined ? coord.length : opt_length;
        opt_output.length = n;
        for (var i = 2; i < n; i++) {
          result[i] = coord[i];
        }
      }
      return result;
    } : olTransform;
    this.lastProjection = pFrom;
  }

  return this.transformFunction;
};


/**
 * Create a Cesium geometry instance
 *
 * @param {string} id The instance identifier
 * @param {!Cesium.Geometry} geometry The geometry
 * @param {!Cesium.Color} color The color
 * @return {!Cesium.GeometryInstance}
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.createGeometryInstance = function(id, geometry, color) {
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
 *
 * @param {!Cesium.Geometry} geometry The geometry.
 * @param {!Cesium.Color} color The primitive color.
 * @param {number=} opt_lineWidth The line width.
 * @param {Function=} opt_instanceFn The geometry instance function.
 * @param {Function=} opt_primitiveType
 * @return {!Cesium.Primitive}
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.createColoredPrimitive = function(geometry, color, opt_lineWidth,
    opt_instanceFn, opt_primitiveType) {
  var options = os.object.unsafeClone(plugin.cesium.sync.FeatureConverter.BASE_PRIMITIVE_OPTIONS);
  if (opt_lineWidth != null) {
    options.renderState.lineWidth = goog.math.clamp(opt_lineWidth, Cesium.ContextLimits.minimumAliasedLineWidth,
        Cesium.ContextLimits.maximumAliasedLineWidth);
  }

  var id = opt_lineWidth != null ? plugin.cesium.GeometryInstanceId.GEOM_OUTLINE :
    plugin.cesium.GeometryInstanceId.GEOM;
  var instances = opt_instanceFn ? opt_instanceFn(id, geometry, color) :
    this.createGeometryInstance(id, geometry, color);
  var appearance = new Cesium.PerInstanceColorAppearance(options);
  opt_primitiveType = opt_primitiveType || Cesium.Primitive;
  var primitive = new opt_primitiveType({
    geometryInstances: instances,
    appearance: appearance
  });

  return primitive;
};


/**
 * Return the fill or stroke color from a plain ol style.
 *
 * @param {!(ol.style.Style|ol.style.Text|ol.style.Circle)} style
 * @param {boolean} outline
 * @return {!Cesium.Color}
 */
plugin.cesium.sync.FeatureConverter.prototype.extractColorFromOlStyle = function(style, outline) {
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
 *
 * @param {!ol.style.Style|ol.style.Text} style
 * @return {number}
 */
plugin.cesium.sync.FeatureConverter.prototype.extractLineWidthFromOlStyle = function(style) {
  // make sure the width is at least 1px
  return Math.max(1, /** @type {number} */ (style.getStroke() && style.getStroke().getWidth() ||
      os.style.DEFAULT_FEATURE_SIZE));
};


/**
 * Create a primitive collection out of two Cesium geometries.
 * Only the OpenLayers style colors will be used.
 *
 * @param {Cesium.Geometry} fill The fill geometry
 * @param {Cesium.Geometry} outline The outline geometry
 * @param {!ol.Feature} feature
 * @param {!ol.geom.Geometry} geometry
 * @param {!plugin.cesium.VectorContext} context The vector context
 * @param {!ol.style.Style} style The style
 * @return {!Cesium.PrimitiveCollection}
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.wrapFillAndOutlineGeometries = function(fill, outline, feature,
    geometry, context, style) {
  var width = this.extractLineWidthFromOlStyle(style);
  var layerOpacity = context.layer.getOpacity();

  // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it.
  var primitives = new Cesium.PrimitiveCollection();
  primitives['olLineWidth'] = width;

  var heightReference = this.getHeightReference(context.layer, feature, geometry);
  var primitiveType = heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ?
    Cesium.GroundPrimitive : undefined;

  if (fill) {
    var fillColor = this.extractColorFromOlStyle(style, false);
    fillColor.alpha *= layerOpacity;

    // hide the primitive when alpha is 0 so it isn't picked
    var fillPrimitive = this.createColoredPrimitive(fill, fillColor, undefined, undefined, primitiveType);
    fillPrimitive.show = fillColor.alpha > 0;
    primitives.add(fillPrimitive);
  }

  if (outline) {
    // combine the layer/style opacity if there is a stroke style, otherwise set it to 0 to hide the outline
    var outlineColor = this.extractColorFromOlStyle(style, true);
    outlineColor.alpha = style.getStroke() != null ? (outlineColor.alpha * layerOpacity) : 0;

    primitives.add(this.createColoredPrimitive(outline, outlineColor, width, undefined, primitiveType));
  }

  return primitives;
};


// Geometry converters
/**
 * Create a Cesium label if style has a text component.
 *
 * @param {!ol.Feature} feature The feature.
 * @param {!ol.geom.Geometry} geometry The geometry.
 * @param {!ol.style.Style} label The label style.
 * @param {!plugin.cesium.VectorContext} context The Cesium vector context.
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.createLabel = function(feature, geometry, label, context) {
  if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(label.getText()))) {
    var options = /** @type {!Cesium.optionsLabelCollection} */ ({});
    this.updateLabel(options, feature, geometry, label, context);
    context.addLabel(options, feature, geometry);
  }
};


/**
 * Get the label position for a geometry.
 *
 * @param {!ol.geom.Geometry} geometry The geometry.
 * @return {Array<number>} The position to use for the label.
 */
plugin.cesium.sync.getLabelPosition = function(geometry) {
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
 * @param {!ol.Feature} feature
 * @param {!ol.geom.Geometry} geometry
 * @param {!ol.style.Style} style
 * @param {!plugin.cesium.VectorContext} context
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.updateLabel = function(label, feature, geometry, style, context) {
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

    var labelPosition = plugin.cesium.sync.getLabelPosition(geometry);
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

  label.heightReference = this.getHeightReference(context.layer, feature, geometry);

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

  var labelText = textStyle.getText() || '';
  label.text = labelText.replace(/[^\x0a\x0d\x20-\x7e\xa0-\xff]/g, '');

  label.font = textStyle.getFont() || os.style.label.getFont();
  label.pixelOffset = new Cesium.Cartesian2(textStyle.getOffsetX(), textStyle.getOffsetY());

  // check if there is an associated primitive, and if it is shown
  var prim = context.getPrimitiveForGeometry(geometry);
  if (prim) {
    label.show = plugin.cesium.VectorContext.isShown(prim);
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
plugin.cesium.sync.FeatureConverter.prototype.setLabelEyeOffset = function(label, scene, opt_offset) {
  if (opt_offset) {
    label.eyeOffset = opt_offset;
  } else {
    label.eyeOffset = this.labelEyeOffset_;
  }
};


/**
 * Convert an OpenLayers circle geometry to Cesium.
 *
 * @param {!ol.Feature} feature OL3 feature
 * @param {!ol.geom.Circle} geometry OL3 circle geometry.
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style
 * @return {Cesium.PrimitiveCollection} primitives
 */
plugin.cesium.sync.FeatureConverter.prototype.olCircleGeometryToCesium = function(feature, geometry, context, style) {
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

  return this.wrapFillAndOutlineGeometries(fillGeometry, outlineGeometry, feature, geometry, context, style);
};


/**
 * Convert an OpenLayers line string geometry to Cesium.
 *
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!(ol.geom.LineString|ol.geom.MultiLineString)} geometry Ol3 line string geometry.
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style
 * @param {Array<number>=} opt_flatCoords
 * @param {number=} opt_offset
 * @param {number=} opt_end
 * @param {number=} opt_index
 * @return {Cesium.Primitive}
 */
plugin.cesium.sync.FeatureConverter.prototype.olLineStringGeometryToCesium = function(feature, geometry, context,
    style, opt_flatCoords, opt_offset, opt_end, opt_index) {
  goog.asserts.assert(geometry.getType() == ol.geom.GeometryType.LINE_STRING ||
      geometry.getType() == ol.geom.GeometryType.MULTI_LINE_STRING);

  var heightReference = this.getHeightReference(context.layer, feature, geometry, opt_index);
  var lineGeometryToCreate = geometry.get('extrude') ? 'WallGeometry' :
    heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ? 'GroundPolylineGeometry' : 'PolylineGeometry';
  var positions = this.getLineStringPositions(geometry, opt_flatCoords, opt_offset, opt_end);
  var method = /** @type {os.interpolate.Method} */ (feature.get(os.interpolate.METHOD_FIELD));
  return this.createLinePrimitive(positions, context, style, lineGeometryToCreate, method);
};


/**
 * Create a Cesium line primitive.
 *
 * @param {!Array<!Cesium.Cartesian3>} positions The geometry positions.
 * @param {!plugin.cesium.VectorContext} context The vector context.
 * @param {!ol.style.Style} style The feature style.
 * @param {string=} opt_type The line geometry type.
 * @param {os.interpolate.Method=} opt_method The interpolation method
 * @return {Cesium.Primitive}
 */
plugin.cesium.sync.FeatureConverter.prototype.createLinePrimitive = function(positions, context, style, opt_type,
    opt_method) {
  var type = opt_type || 'PolylineGeometry';
  opt_method = opt_method || os.interpolate.getMethod();

  var width = this.extractLineWidthFromOlStyle(style);
  var color = this.extractColorFromOlStyle(style, true);
  color.alpha *= context.layer.getOpacity();
  var lineDash = this.getDashPattern(style);

  var appearance = new Cesium.PolylineMaterialAppearance({
    material: Cesium.Material.fromType(Cesium.Material.PolylineDashType, {
      color: color,
      dashPattern: lineDash
    })
  });

  // Handle both color and width
  var outlineGeometry = new Cesium[type]({
    positions: positions,
    vertexFormat: appearance.vertexFormat,
    arcType: opt_method === os.interpolate.Method.RHUMB ? Cesium.ArcType.RHUMB : Cesium.ArcType.GEODESIC,
    width: width
  });

  var instance = this.createGeometryInstance(plugin.cesium.GeometryInstanceId.GEOM_OUTLINE, outlineGeometry, color);

  var primitiveType = opt_type && opt_type.startsWith('Ground') ? Cesium.GroundPolylinePrimitive : Cesium.Primitive;
  var primitive = new primitiveType({
    geometryInstances: instance,
    appearance: appearance
  });

  // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it.
  primitive['olLineWidth'] = width;

  return primitive;
};


/**
 * Creates or updates a Cesium Billboard.
 *
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!(ol.geom.LineString|os.geom.Ellipse|ol.geom.MultiLineString)} geometry The OL3 geometry
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style The OL3 style
 * @param {(Cesium.Polyline|Cesium.PolylineOptions)=} opt_polyline The polyline, for updates.
 * @param {Array<number>=} opt_flatCoords The flat coordinates from a multiline
 * @param {number=} opt_offset
 * @param {number=} opt_end
 * @param {Cesium.PolylineCollection=} opt_collection
 */
plugin.cesium.sync.FeatureConverter.prototype.createOrUpdatePolyline = function(feature, geometry, context, style,
    opt_polyline, opt_flatCoords, opt_offset, opt_end, opt_collection) {
  if (opt_polyline) {
    this.updatePolyline(feature, geometry, context, style, opt_polyline, opt_flatCoords, opt_offset, opt_end);
  } else {
    this.createPolyline(feature, geometry, context, style, opt_flatCoords, opt_offset, opt_end, opt_collection);
  }
};


/**
 * Create a Cesium line primitive.
 *
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!(ol.geom.LineString|os.geom.Ellipse|ol.geom.MultiLineString)} geometry Ol3 line string geometry.
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style
 * @param {Array<number>=} opt_flatCoords The flat coordinates from a multiline
 * @param {number=} opt_offset
 * @param {number=} opt_end
 * @param {Cesium.PolylineCollection=} opt_collection
 */
plugin.cesium.sync.FeatureConverter.prototype.createPolyline = function(feature, geometry, context, style,
    opt_flatCoords, opt_offset, opt_end, opt_collection) {
  var polylineOptions = /** @type {Cesium.PolylineOptions} */ ({});
  this.updatePolyline(feature, geometry, context, style, polylineOptions, opt_flatCoords, opt_offset, opt_end);

  if (opt_collection) {
    opt_collection.add(polylineOptions);
  } else {
    context.addPolyline(polylineOptions, feature, geometry);
  }
};


/**
 * Create a Cesium line primitive.
 *
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!(ol.geom.LineString|os.geom.Ellipse|ol.geom.MultiLineString)} geometry Ol3 line string geometry.
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style
 * @param {!(Cesium.Polyline|Cesium.PolylineOptions)} polyline The polyline, for updates.
 * @param {Array<number>=} opt_flatCoords The flat coordinates from a multiline
 * @param {number=} opt_offset
 * @param {number=} opt_end
 */
plugin.cesium.sync.FeatureConverter.prototype.updatePolyline = function(feature, geometry, context, style, polyline,
    opt_flatCoords, opt_offset, opt_end) {
  var geomRevision = geometry.getRevision();
  if (polyline.geomRevision != geomRevision) {
    polyline.positions = this.getLineStringPositions(geometry, opt_flatCoords, opt_offset, opt_end);
    polyline.geomRevision = geomRevision;
  }

  var width = this.extractLineWidthFromOlStyle(style);
  var color = this.extractColorFromOlStyle(style, true);
  color.alpha *= context.layer.getOpacity();
  var dashPattern = this.getDashPattern(style);

  var materialOptions = {
    color: color,
    dashPattern: dashPattern
  };

  var materialType = dashPattern != null ? Cesium.Material.PolylineDashType : Cesium.Material.ColorType;
  var material = polyline.material;
  if (!material || material.type != materialType) {
    polyline.material = Cesium.Material.fromType(materialType, materialOptions);
  } else {
    if (!material.uniforms.color.equals(color)) {
      material.uniforms.color = color;
    }
    if (materialType === Cesium.Material.PolylineDashType && material.uniforms.dashPattern != dashPattern) {
      material.uniforms.dashPattern = dashPattern;
    }
  }

  polyline.width = width;

  if (polyline instanceof Cesium.Polyline) {
    // mark as updated so it isn't deleted
    polyline.dirty = false;
  }
};


/**
 * @param {!(ol.geom.LineString|os.geom.Ellipse|ol.geom.MultiLineString)} geometry Ol3 line string geometry.
 * @param {Array<number>=} opt_flatCoords The flat coordinates from a multiline
 * @param {number=} opt_offset
 * @param {number=} opt_end
 * @return {!Array<Cesium.Cartesian3>}
 */
plugin.cesium.sync.FeatureConverter.prototype.getLineStringPositions = function(geometry, opt_flatCoords, opt_offset,
    opt_end) {
  var transform = this.getTransformFunction();
  var flats = opt_flatCoords || geometry.getFlatCoordinates();
  var stride = geometry.stride;
  var offset = opt_offset || 0;
  var end = opt_end || flats.length;

  var coord = plugin.cesium.sync.FeatureConverter.scratchCoord1_;
  var transformedCoord = plugin.cesium.sync.FeatureConverter.scratchCoord2_;
  coord.length = stride;
  transformedCoord.length = stride;

  var positions = new Array((end - offset) / stride);
  var count = 0;
  for (var i = offset; i < end; i += stride) {
    for (var j = 0; j < stride; j++) {
      coord[j] = flats[i + j];
      transformedCoord[j] = coord[j];
    }

    if (transform) {
      transform(coord, transformedCoord, stride);
    }

    positions[count] = olcs.core.ol4326CoordinateToCesiumCartesian(transformedCoord);
    count++;
  }

  return positions;
};


/**
 * Get a ground reference line from a coordinate to the surface of the globe.
 *
 * @param {!ol.Coordinate} coordinate The reference coordinate.
 * @param {!ol.style.Style} style The style
 * @param {!plugin.cesium.VectorContext} context The vector context
 * @return {Cesium.Primitive}
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.getGroundReference = function(coordinate, style, context) {
  var surface = coordinate.slice();
  surface[2] = 0;

  var coordinates = [coordinate, surface];
  var positions = olcs.core.ol4326CoordinateArrayToCsCartesians(coordinates);

  return this.createLinePrimitive(positions, context, style);
};


/**
 * Get a ground reference line from a coordinate to the surface of the globe.
 *
 * @param {!ol.Feature} feature Ol3 feature
 * @param {!os.geom.Ellipse} geometry Ellipse geometry.
 * @param {!plugin.cesium.VectorContext} context The vector context
 * @param {!ol.style.Style} style The style
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.createOrUpdateGroundReference = function(feature, geometry, context,
    style) {
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
 *
 * @param {!ol.style.Style} style The style
 * @param {!plugin.cesium.VectorContext} context The vector context
 * @return {!Cesium.Color}
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.getEllipsoidFill = function(style, context) {
  // fill ellipsoid using stroke color at a base opacity of 50%
  var color = this.extractColorFromOlStyle(style, true);
  color.alpha = 0.3 * context.layer.getOpacity();

  return color;
};


/**
 * Get the stroke color for an ellipsoid.
 *
 * @param {!ol.style.Style} style The style
 * @param {!plugin.cesium.VectorContext} context The vector context
 * @return {!Cesium.Color}
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.getEllipsoidStroke = function(style, context) {
  // create a white wireframe with reduced base alpha to make it less invasive
  var color = new Cesium.Color(1, 1, 1, 1);
  color.alpha = context.layer.getOpacity() * 0.75;

  return color;
};


/**
 * Create a primitive collection out of two Cesium ellipsoid geometries.
 * Only the OpenLayers style colors will be used.
 *
 * @param {!Cesium.Geometry} fill The fill geometry
 * @param {!Cesium.Geometry} outline The outline geometry
 * @param {!ol.style.Style} style The style
 * @param {!plugin.cesium.VectorContext} context The vector context
 * @param {Function=} opt_instanceFn The geometry instance function.
 * @return {!Cesium.PrimitiveCollection}
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.wrapEllipsoidFillAndOutline = function(fill, outline, style, context,
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
 *
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!os.geom.Ellipse} geometry Ellipse geometry.
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style
 * @return {Cesium.PrimitiveCollection|Cesium.Primitive}
 */
plugin.cesium.sync.FeatureConverter.prototype.olEllipseGeometryToEllipsoid = function(feature, geometry, context,
    style) {
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
    if (id === plugin.cesium.GeometryInstanceId.GEOM) {
      id = plugin.cesium.GeometryInstanceId.ELLIPSOID;
    } else {
      id = plugin.cesium.GeometryInstanceId.ELLIPSOID_OUTLINE;
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
 * @type {!ol.Coordinate}
 * @const
 */
plugin.cesium.sync.FeatureConverter.scratchCoord1_ = [];


/**
 * @type {!ol.Coordinate}
 * @const
 */
plugin.cesium.sync.FeatureConverter.scratchCoord2_ = [];


/**
 * @type {!ol.Extent}
 * @const
 */
plugin.cesium.sync.FeatureConverter.scratchExtent1_ = [Infinity, Infinity, -Infinity, -Infinity];


/**
 * Creates a Cesium.PolygonHierarchy from an ol.geom.Polygon.
 *
 * @param {!(ol.geom.Polygon|ol.geom.MultiPolygon)} geometry The OL polygon
 * @param {Array<number>=} opt_flats
 * @param {number=} opt_offset
 * @param {Array<number>=} opt_ringEnds
 * @param {boolean=} opt_extrude
 * @return {Cesium.PolygonHierarchy}
 */
plugin.cesium.sync.FeatureConverter.prototype.createPolygonHierarchy = function(geometry, opt_flats, opt_offset,
    opt_ringEnds, opt_extrude) {
  var transform = this.getTransformFunction();

  var flats = opt_flats || geometry.getFlatCoordinates();
  var offset = opt_offset || 0;
  var ends = opt_ringEnds || geometry.getEnds();
  // var extrude = opt_extrude != undefined ? opt_extrude : !!geometry.get('extrude');
  var stride = geometry.getStride();
  var coord = plugin.cesium.sync.FeatureConverter.scratchCoord1_;
  var transformedCoord = plugin.cesium.sync.FeatureConverter.scratchCoord2_;
  coord.length = stride;
  transformedCoord.length = stride;

  var extent = plugin.cesium.sync.FeatureConverter.scratchExtent1_;

  // reset extent
  extent[0] = Infinity;
  extent[1] = Infinity;
  extent[2] = -Infinity;
  extent[3] = -Infinity;

  var positions;
  var holes;

  for (var r = 0, rr = ends.length; r < rr; r++) {
    var end = ends[r];
    var csPos = new Array((end - offset) / stride);

    var count = 0;
    for (var i = offset; i < end; i += stride) {
      for (var j = 0; j < stride; j++) {
        coord[j] = flats[i + j];
        transformedCoord[j] = coord[j];
      }

      if (transform) {
        transform(coord, transformedCoord, coord.length);
      }

      csPos[count] = olcs.core.ol4326CoordinateToCesiumCartesian(transformedCoord);
      count++;
    }

    // if a ring is empty, just ignore it
    if (csPos && csPos.length) {
      if (r == 0) {
        positions = csPos;
      } else {
        holes = holes || [];
        holes.push(new Cesium.PolygonHierarchy(csPos));
      }
    }

    offset = end;
  }

  // don't create a polygon if we don't have an outer ring
  return positions ? new Cesium.PolygonHierarchy(positions, holes) : null;
};


/**
 * Convert an OpenLayers polygon geometry to Cesium, this method does NOT handle line width
 * in windows.
 *
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!(ol.geom.Polygon|ol.geom.MultiPolygon)} geometry Ol3 polygon geometry.
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style
 * @return {Cesium.PrimitiveCollection}
 * @param {Array<number>=} opt_polyFlats
 * @param {number=} opt_offset
 * @param {Array<number>=} opt_ringEnds
 * @param {boolean=} opt_extrude
 */
plugin.cesium.sync.FeatureConverter.prototype.olPolygonGeometryToCesium = function(feature, geometry, context, style,
    opt_polyFlats, opt_offset, opt_ringEnds, opt_extrude) {
  var fillGeometry = null;
  var outlineGeometry = null;
  var extrude = opt_extrude !== undefined ? opt_extrude : !!geometry.get('extrude');
  var hierarchy = this.createPolygonHierarchy(geometry, opt_polyFlats, opt_offset, opt_ringEnds, opt_extrude);
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

  return this.wrapFillAndOutlineGeometries(fillGeometry, outlineGeometry, feature, geometry, context, style);
};


/**
 * Convert an OpenLayers polygon geometry to Cesium.
 *
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!(ol.geom.Polygon|ol.geom.MultiPolygon)} geometry Ol3 polygon geometry.
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style
 * @param {Array<number>=} opt_polyFlats
 * @param {number=} opt_offset
 * @param {Array<number>=} opt_ringEnds
 * @param {boolean=} opt_extrude
 * @param {number=} opt_index
 * @return {Cesium.PrimitiveCollection|Cesium.Primitive}
 */
plugin.cesium.sync.FeatureConverter.prototype.olPolygonGeometryToCesiumPolyline = function(feature, geometry,
    context, style, opt_polyFlats, opt_offset, opt_ringEnds, opt_extrude, opt_index) {
  // extruded polygons cannot be rendered as a polyline. since polygons will not respect line width on Windows, make
  // sure the geometry is both extruded and has an altitude before using the polygon primitive.
  var extrude = opt_extrude != undefined ? opt_extrude : !!geometry.get('extrude');
  if (extrude && os.geo.hasAltitudeGeometry(geometry)) {
    return this.olPolygonGeometryToCesium(feature, geometry, context, style, opt_polyFlats, opt_offset,
        opt_ringEnds, opt_extrude);
  } else {
    var hierarchy = this.createPolygonHierarchy(geometry, opt_polyFlats, opt_offset, opt_ringEnds, opt_extrude);
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

    var width = this.extractLineWidthFromOlStyle(style);
    var layerOpacity = context.layer.getOpacity();
    var lineDash = this.getDashPattern(style);

    // combine the layer/style opacity if there is a stroke style, otherwise set it to 0 to hide the outline
    var outlineColor = this.extractColorFromOlStyle(style, true);
    outlineColor.alpha = style.getStroke() != null ? (outlineColor.alpha * layerOpacity) : 0;

    var appearance = new Cesium.PolylineMaterialAppearance({
      material: Cesium.Material.fromType(Cesium.Material.PolylineDashType, {
        color: outlineColor,
        dashPattern: lineDash
      })
    });

    var primitives = new Cesium.PrimitiveCollection();

    // Cesium doesn't make line width accessible once the primitive is loaded to the GPU, so we need to save it. also
    // save if the outline needs to be displayed, so we know to recreate the primitive if that changes.
    primitives['olLineWidth'] = width;

    var heightReference = this.getHeightReference(context.layer, feature, geometry, opt_index);
    var primitiveType = heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ? Cesium.GroundPolylinePrimitive :
      Cesium.Primitive;
    var geometryType = heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ? Cesium.GroundPolylineGeometry :
      Cesium.PolylineGeometry;

    // always create outlines even if the style doesn't have a stroke. this allows updating the primitive if a stroke
    // is added without recreating it.
    for (var i = 0; i < csRings.length; ++i) {
      // Handle both color and width
      var polylineGeometry = new geometryType({
        positions: csRings[i],
        vertexFormat: appearance.vertexFormat,
        width: width
      });

      var instance = this.createGeometryInstance(plugin.cesium.GeometryInstanceId.GEOM_OUTLINE, polylineGeometry,
          outlineColor);
      var outlinePrimitive = new primitiveType({
        geometryInstances: instance,
        appearance: appearance
      });
      primitives.add(outlinePrimitive);
    }

    if (style.getFill()) {
      var fillGeometry = new Cesium.PolygonGeometry({
        polygonHierarchy: hierarchy,
        perPositionHeight: true
      });

      var fillColor = this.extractColorFromOlStyle(style, false);
      fillColor.alpha *= layerOpacity;

      var p = this.createColoredPrimitive(fillGeometry, fillColor, undefined, undefined,
          heightReference === Cesium.HeightReference.CLAMP_TO_GROUND ? Cesium.GroundPrimitive : Cesium.Primitive);
      // hide the primitive when alpha is 0 so it isn't picked
      p.show = fillColor.alpha > 0;
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
 * @param {os.webgl.AltitudeMode} altitudeMode
 */
plugin.cesium.sync.FeatureConverter.prototype.setAltitudeMode = function(altitudeMode) {
  switch (altitudeMode) {
    case os.webgl.AltitudeMode.RELATIVE_TO_GROUND:
      this.heightReference_ = Cesium.HeightReference.RELATIVE_TO_GROUND;
      break;
    case os.webgl.AltitudeMode.CLAMP_TO_GROUND:
      this.heightReference_ = Cesium.HeightReference.CLAMP_TO_GROUND;
      break;
    case os.webgl.AltitudeMode.ABSOLUTE:
    default:
      this.heightReference_ = Cesium.HeightReference.NONE;
      break;
  }
};


/**
 * @param {ol.layer.Vector} layer
 * @param {ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Geometry} geometry
 * @param {number=} opt_index Index into altitudeModes array for multi geoms
 * @return {!Cesium.HeightReference}
 */
plugin.cesium.sync.FeatureConverter.prototype.getHeightReference = function(layer, feature, geometry, opt_index) {
  var altitudeMode = geometry.get(os.data.RecordField.ALTITUDE_MODE) ||
    feature.get(os.data.RecordField.ALTITUDE_MODE) ||
    layer.get(os.data.RecordField.ALTITUDE_MODE);

  opt_index = opt_index || 0;
  if (Array.isArray(altitudeMode) && opt_index < altitudeMode.length) {
    altitudeMode = altitudeMode[opt_index];
  }

  if (altitudeMode !== undefined) {
    var heightReference = Cesium.HeightReference.NONE;
    if (altitudeMode === os.webgl.AltitudeMode.CLAMP_TO_GROUND) {
      heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
    } else if (altitudeMode === os.webgl.AltitudeMode.RELATIVE_TO_GROUND) {
      heightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
    }
    return heightReference;
  }

  return this.heightReference_;
};


/**
 * Creates or updates a Cesium Billboard.
 *
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!(ol.geom.Point|ol.geom.MultiPoint)} geometry The OL3 geometry
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style The OL3 style
 * @param {(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)=} opt_billboard The billboard, for updates
 * @param {Array<number>=} opt_flatCoords
 * @param {number=} opt_offset
 * @param {Cesium.BillboardCollection=} opt_collection
 * @param {number=} opt_index
 * @suppress {checkTypes}
 */
plugin.cesium.sync.FeatureConverter.prototype.createOrUpdateBillboard = function(feature, geometry, context, style,
    opt_billboard, opt_flatCoords, opt_offset, opt_collection, opt_index) {
  var imageStyle = style.getImage();
  if (imageStyle) {
    var imageState = imageStyle.getImageState();
    if (imageState < ol.ImageState.LOADED) {
      // state is either idle or loading, so wait for the image to load/error
      if (opt_billboard && opt_billboard.eyeOffset != null) {
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
        if (imageStyle.getImageState() < ol.ImageState.ERROR) {
          // if the billboard has already been created, make sure it's still in the collection
          if (!(opt_billboard && opt_billboard.eyeOffset != null) ||
              (context.billboards && context.billboards.contains(opt_billboard))) {
            this.createOrUpdateBillboard(feature, geometry, context, style, opt_billboard, opt_flatCoords,
                opt_offset, opt_collection);
          }
        }

        delete this.listenerMap_[fid];
        // TODO: handle image error?
      }, this);
    } else if (opt_billboard) {
      this.updateBillboard(feature, geometry, opt_billboard, imageStyle, context.layer, opt_flatCoords, opt_offset,
          opt_index);
    } else {
      this.createBillboard(feature, geometry, context, imageStyle, opt_flatCoords, opt_offset, opt_collection,
          opt_index);
    }
  }
};


/**
 * Create a Cesium Billboard from an OpenLayers image style.
 *
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Point} geometry The OL3 geometry
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Image} style The image style
 * @param {Array<number>=} opt_flatCoords
 * @param {number=} opt_offset
 * @param {Cesium.BillboardCollection=} opt_collection
 * @param {number=} opt_index
 * @protected
 * @suppress {checkTypes} To allow access to feature id.
 */
plugin.cesium.sync.FeatureConverter.prototype.createBillboard = function(feature, geometry, context, style,
    opt_flatCoords, opt_offset, opt_collection, opt_index) {
  var show = context.featureToShownMap[feature['id']] == null || context.featureToShownMap[feature['id']];
  var isIcon = style instanceof ol.style.Icon;

  var options = /** @type {!Cesium.optionsBillboardCollectionAdd} */ ({
    pixelOffsetScaleByDistance: isIcon ? this.distanceScalar_ : undefined,
    scaleByDistance: isIcon ? this.distanceScalar_ : undefined,
    show: show
  });

  this.updateBillboard(feature, geometry, options, style, context.layer, opt_flatCoords, opt_offset, opt_index);

  if (opt_collection) {
    opt_collection.add(options);
  } else {
    context.addBillboard(options, feature, geometry);
  }
};


/**
 * Update a Cesium Billboard from an OpenLayers image style.
 *
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!(ol.geom.Point|ol.geom.MultiPoint)} geometry The OL3 geometry
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb The billboard or billboard options
 * @param {!ol.style.Image} style The image style
 * @param {!ol.layer.Vector} layer The OL3 layer
 * @param {Array<number>=} opt_flatCoords
 * @param {number=} opt_offset
 * @param {number=} opt_index
 * @protected
 */
plugin.cesium.sync.FeatureConverter.prototype.updateBillboard = function(feature, geometry, bb, style, layer,
    opt_flatCoords, opt_offset, opt_index) {
  // update the position if the geometry changed
  var geomRevision = geometry.getRevision();
  if (!bb.geomRevision || bb.geomRevision != geomRevision) {
    var flats = opt_flatCoords || geometry.getFlatCoordinates();
    var offset = opt_offset || 0;
    var stride = geometry.stride;
    var coord = plugin.cesium.sync.FeatureConverter.scratchCoord1_;
    coord.length = stride;

    for (var j = 0; j < stride; j++) {
      coord[j] = flats[offset + j];
    }

    var transform = this.getTransformFunction();
    if (transform) {
      coord = transform(coord, plugin.cesium.sync.FeatureConverter.scratchCoord2_, coord.length);
    }

    bb.position = olcs.core.ol4326CoordinateToCesiumCartesian(coord);
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

  if (typeof image === 'string' || image instanceof HTMLCanvasElement || image instanceof Image ||
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

    bb.heightReference = this.getHeightReference(layer, feature, geometry, opt_index);
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
 *
 * @param {!ol.style.Style} style [description]
 * @return {boolean} [description]
 */
plugin.cesium.sync.FeatureConverter.prototype.isHighlightStyle = function(style) {
  if (style && style.getStroke()) {
    return (os.style.DEFAULT_HIGHLIGHT_CONFIG.stroke.color === style.getStroke().getColor());
  }
  return false;
};


/**
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Geometry} geometry The geometry to be converted
 * @param {!ol.style.Style} style The geometry style
 * @param {!plugin.cesium.VectorContext} context Cesium synchronization context
 * @param {!Cesium.PrimitiveLike} primitive The Cesium primitive
 */
plugin.cesium.sync.FeatureConverter.prototype.updatePrimitive = function(feature, geometry, style, context, primitive) {
  if (!primitive.ready) {
    // primitives won't be marked as ready until they've been loaded to the GPU. we can't update them until they're
    // ready, so call this again on a delay. limit to 20 tries in case a primitive is never ready for whatever
    // reason.
    primitive.updateRetries = primitive.updateRetries !== undefined ? primitive.updateRetries + 1 : 1;

    if (primitive.updateRetries < 20) {
      var callback = goog.partial(this.updatePrimitive, feature, geometry, style, context, primitive);
      var delay = new goog.async.Delay(callback, 100, this);
      delay.start();
    }

    primitive.dirty = false;
  } else if (!primitive.isDestroyed() && !feature.isDisposed()) {
    // ready for update
    primitive.updateRetries = 0;

    for (var key in plugin.cesium.GeometryInstanceId) {
      // the try-catch is for the lovely DevErrors in Unminified Cesium
      try {
        var field = plugin.cesium.GeometryInstanceId[key];
        var attributes = primitive.getGeometryInstanceAttributes(field);
        var material = primitive.appearance.material;
        if (attributes) {
          var color;

          var isEllipsoid = plugin.cesium.ELLIPSOID_REGEXP.test(field);
          var isOutline = plugin.cesium.OUTLINE_REGEXP.test(field);

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
            // hide the primitive when alpha is 0 so it isn't picked
            primitive.show = color.alpha > 0;

            if (material && material.uniforms) {
              material.uniforms.color = color;
            } else {
              attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(color, attributes.color);
            }
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
 *
 * @param {!ol.Feature} feature Ol3 feature..
 * @param {!ol.geom.Geometry} geometry Ol3 geometry.
 * @param {!plugin.cesium.VectorContext} context
 * @param {!ol.style.Style} style
 * @param {Cesium.PrimitiveLike=} opt_primitive
 * @return {?Cesium.PrimitiveLike}
 * @suppress {accessControls|checkTypes}
 */
plugin.cesium.sync.FeatureConverter.prototype.olMultiGeometryToCesium = function(feature, geometry, context,
    style, opt_primitive) {
  // FIXME: would be better to combine all child geometries in one primitive. instead we create n primitives for
  // simplicity (eg, laziness).

  var geomType = geometry.getType();
  var i;
  var ii;
  var primitives;
  var count = 0;

  // Note: Multi geometry types such as MultiPoint, MultiLineString, MultiPolygon, and MultiGeometry reconstitute the
  // underlying geometries when getPoints(), getLineStrings(), getPolygons(), and getGeometries() is called. This
  // causes the geometry-to-cesium-thing map to be stale every time and forces them to be dumped and recreated.
  //
  //      "Turrible, just turrible"
  //          - Charles Barkley
  //
  // To avoid this, we're gonna operate on the flat coords directly. Hold on to something.
  switch (geomType) {
    case ol.geom.GeometryType.MULTI_POINT:
      geometry = /** @type {!ol.geom.MultiPoint} */ (geometry);
      var pointFlats = geometry.getFlatCoordinates();
      var stride = geometry.stride;

      primitives = /** @type {Cesium.BillboardCollection} */ (opt_primitive || new Cesium.BillboardCollection({
        scene: context.scene
      }));

      for (i = 0, ii = pointFlats.length; i < ii; i += stride) {
        var bb = count < primitives.length ? primitives.get(count) : undefined;
        this.createOrUpdateBillboard(feature, geometry, context, style, bb, pointFlats, i, primitives, count);
        count++;
      }

      return primitives;
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      geometry = /** @type {!ol.geom.MultiLineString} */ (geometry);
      var lineFlats = geometry.getFlatCoordinates();
      var lineEnds = geometry.getEnds();
      var offset = 0;

      primitives = opt_primitive || (feature instanceof os.feature.DynamicFeature ? new Cesium.PolylineCollection() :
        new Cesium.PrimitiveCollection());

      // get the shown state so it can be restored for an existing PolylineCollection, which only has a show flag on
      // individual polylines
      var shown = context.featureToShownMap[feature['id']] != null ?
        context.featureToShownMap[feature['id']] :
        plugin.cesium.VectorContext.isShown(primitives);

      primitives.removeAll();

      for (i = 0, ii = lineEnds.length; i < ii; i++) {
        var lineEnd = lineEnds[i];

        if (feature instanceof os.feature.DynamicFeature) {
          // dynamic lines may change frequently and should use Cesium.Polyline to avoid recreating on each change,
          // which will cause a flicker while the new Primitive is loaded to the GPU.
          this.createOrUpdatePolyline(feature, geometry, context, style, undefined,
              lineFlats, offset, lineEnd, /** @type {Cesium.PolylineCollection} */ (primitives));
        } else {
          // all other lines should use Cesium.Primitive/Cesium.PolylineGeometry, which is more performant for picking.
          var prim = this.olLineStringGeometryToCesium(feature, geometry, context, style, lineFlats, offset, lineEnd,
              i);
          if (prim) {
            primitives.add(prim);

            // all lines share a style, so they will all have the same width.
            primitives['olLineWidth'] = prim['olLineWidth'];
          }
        }

        offset = lineEnd;
      }

      // restore the shown state
      plugin.cesium.VectorContext.setShow(primitives, shown);

      return primitives;
    case ol.geom.GeometryType.MULTI_POLYGON:
      geometry = /** @type {!ol.geom.MultiPolygon} */ (geometry);
      var polyFlats = geometry.getFlatCoordinates();
      var polyEnds = geometry.getEndss();

      primitives = opt_primitive || new Cesium.PrimitiveCollection();
      primitives.removeAll();

      var extrudes = /** @type {Array<boolean>|undefined} */ (geometry.get('extrude'));
      offset = 0;

      for (i = 0, ii = polyEnds.length; i < ii; i++) {
        var ringEnds = polyEnds[i];
        var extrude = extrudes && extrudes.length === polyEnds.length ? extrudes[i] : false;

        var poly = this.olPolygonGeometryToCesiumPolyline(feature, geometry, context, style,
            polyFlats, offset, ringEnds, extrude, i);
        if (poly) {
          primitives.add(poly);

          // all polygons share a style, so they will all have the same width.
          primitives['olLineWidth'] = poly['olLineWidth'];
        }

        offset = ringEnds[ringEnds.length - 1];
      }

      return primitives;
    default:
      goog.asserts.fail('Unhandled multi geometry type' + geometry.getType());
  }

  return null;
};


/**
 * Get the style used to render a feature.
 *
 * @param {!ol.Feature} feature
 * @param {number} resolution
 * @param {!ol.layer.Vector} layer
 * @return {Array<ol.style.Style>} null if no style is available
 */
plugin.cesium.sync.FeatureConverter.prototype.getFeatureStyles = function(feature, resolution, layer) {
  var style;

  // feature style takes precedence
  var featureStyle = feature.getStyleFunction();
  if (featureStyle !== undefined) {
    style = featureStyle.call(feature, resolution);
  }

  // use the fallback if there isn't one
  if (style == null) {
    var layerStyle = layer.getStyleFunction();
    if (layerStyle) {
      style = layerStyle(feature, resolution);
    }
  }

  if (style === undefined) {
    return null;
  }

  // always return an array
  if (style instanceof ol.style.Style) {
    style = [style];
  }

  return style;
};


/**
 * Checks a primitive or primitive collection for a matching dash pattern
 *
 * @param {Cesium.Billboard|Cesium.Cesium3DTileset|Cesium.Label|Cesium.Polygon|Cesium.Polyline|
 * Cesium.PolylineCollection|Cesium.Primitive} primitive The primitive
 * @param {number|undefined} lineDash The line dash pattern
 * @return {boolean}
 */
plugin.cesium.sync.FeatureConverter.prototype.matchDashPattern = function(primitive, lineDash) {
  if (primitive instanceof Cesium.PrimitiveCollection) {
    for (var i = 0; i < primitive.length; i++) {
      if (!this.matchDashPattern(primitive.get(i), lineDash)) {
        return false;
      }
    }
    return true;
  }

  if (primitive && primitive.appearance && primitive.appearance.material && primitive.appearance.material.uniforms) {
    return primitive.appearance.material.uniforms.dashPattern != lineDash;
  }

  return true; // don't change the dashPattern for extruded polygons
};


/**
 * @param {Cesium.HeightReference} heightReference
 * @param {?Cesium.PrimitiveLike} primitive
 * @return {boolean}
 */
plugin.cesium.sync.FeatureConverter.prototype.isPrimitiveTypeChanging = function(heightReference, primitive) {
  if (primitive instanceof Cesium.PrimitiveCollection && primitive.length) {
    return this.isPrimitiveTypeChanging(heightReference, primitive.get(0));
  }

  return ((heightReference !== Cesium.HeightReference.CLAMP_TO_GROUND &&
    (primitive instanceof Cesium.GroundPolylinePrimitive || primitive instanceof Cesium.GroundPrimitive)) ||
    (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND &&
    (primitive instanceof Cesium.Polyline || primitive instanceof Cesium.Primitive)));
};


/**
 * Convert an OL3 geometry to Cesium.
 *
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Geometry} geometry The geometry to be converted
 * @param {!ol.style.Style} style The geometry style
 * @param {!plugin.cesium.VectorContext} context Cesium synchronization context
 */
plugin.cesium.sync.FeatureConverter.prototype.olGeometryToCesium = function(feature, geometry, style, context) {
  // only set this if a primitive is being recreated and we need to preserve the show state
  var wasPrimitiveShown;

  // check if we have a primitive for the geometry already
  var primitive = context.getPrimitiveForGeometry(geometry);

  // if the outline width or line dash changed, we need to recreate the primitive since Cesium can't change the width
  // or line dash on a geometry instance
  if (primitive && primitive['olLineWidth'] != null) {
    var dirty = geometry.get(os.geom.GeometryField.DIRTY);
    var width = this.extractLineWidthFromOlStyle(style);
    var lineDash = this.getDashPattern(style);
    if (dirty || primitive['olLineWidth'] != width || this.matchDashPattern(primitive, lineDash)) {
      wasPrimitiveShown = plugin.cesium.VectorContext.isShown(primitive);
      context.removePrimitive(primitive);
      geometry.set(os.geom.GeometryField.DIRTY, false);
      primitive = null;
    }
  }

  var geomType = geometry.getType();

  if (geometry instanceof os.geom.Ellipse) {
    geomType = 'ellipse';
  }

  var heightReference = this.getHeightReference(context.layer, feature, geometry);
  if (this.isPrimitiveTypeChanging(heightReference, primitive)) {
    // we cannot update it; it must be recreated
    primitive = null;
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
        plugin.cesium.VectorContext.setShow(primitive, wasPrimitiveShown);
      }

      context.addPrimitive(primitive, feature, geometry);
    }
  }
};


/**
 * Updates a Cesium primitive.
 *
 * @param {!ol.Feature} feature The OL3 feature
 * @param {!ol.geom.Geometry} geometry The geometry to be converted
 * @param {!ol.style.Style} style The geometry style
 * @param {!plugin.cesium.VectorContext} context Cesium synchronization context
 * @param {!Cesium.PrimitiveLike} primitive The Cesium primitive
 */
plugin.cesium.sync.FeatureConverter.prototype.updatePrimitiveLike = function(feature, geometry, style, context,
    primitive) {
  var type = geometry.getType();

  if (type === ol.geom.GeometryType.MULTI_POINT || (primitive.geomRevision !== geometry.getRevision() &&
      (type === ol.geom.GeometryType.MULTI_LINE_STRING || type === ol.geom.GeometryType.MULTI_POLYGON))) {
    this.olMultiGeometryToCesium(feature, geometry, context, style, primitive);
    // multi-geom cases can often add new primitives to the collection as a result of a geometry update,
    // so ensure they can be picked
    context.addOLReferences(primitive, feature, geometry);
    // mark as updated so it isn't removed
    primitive.dirty = false;
  } else if (primitive instanceof Cesium.PrimitiveCollection || primitive instanceof Cesium.PolylineCollection) {
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
 *
 * @param {!ol.layer.Vector} layer The map layer
 * @param {!ol.View} view The OL3 view
 * @return {!plugin.cesium.VectorContext}
 */
plugin.cesium.sync.FeatureConverter.prototype.olVectorLayerToCesium = function(layer, view) {
  var projection = view.getProjection();
  var resolution = view.getResolution();
  if (projection == null || resolution === undefined) {
    // an assertion is not enough for closure to assume resolution and projection are defined
    throw new Error('view not ready');
  }

  var context = new plugin.cesium.VectorContext(this.scene, layer, projection);
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
 *
 * @param {!ol.Feature} feature The OL3 feature
 * @param {number} resolution The OL3 view resolution
 * @param {!plugin.cesium.VectorContext} context
 */
plugin.cesium.sync.FeatureConverter.prototype.convert = function(feature, resolution, context) {
  context.markDirty(feature);

  var styles = this.getFeatureStyles(feature, resolution, context.layer);
  if (styles) {
    for (var i = 0, n = styles.length; i < n; i++) {
      var style = styles[i];
      if (style) {
        var geometry = style.getGeometryFunction()(feature);
        if (geometry) {
          if (style.getText()) {
            // style is for a label
            var currentLabel = context.getLabelForGeometry(geometry);
            if (currentLabel == null) {
              this.createLabel(feature, geometry, style, context);
            } else {
              this.updateLabel(currentLabel, feature, geometry, style, context);
            }
          } else {
            // style is for a geometry
            this.olGeometryToCesium(feature, geometry, style, context);
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
plugin.cesium.sync.FeatureConverter.prototype.setLabelEyeOffsetDefault = function(labelOffset) {
  this.labelEyeOffset_ = labelOffset;
};


/**
 * @param {!Cesium.Cartesian3} primOffset
 */
plugin.cesium.sync.FeatureConverter.prototype.setEyeOffset = function(primOffset) {
  this.eyeOffset_ = primOffset;
};


/**
 * @return {!Cesium.Cartesian3}
 */
plugin.cesium.sync.FeatureConverter.prototype.getEyeOffset = function() {
  return this.eyeOffset_;
};


/**
 * Convert a style's line dash to 16 bit int
 *
 * @param {!ol.style.Style} style
 * @return {number|undefined}
 */
plugin.cesium.sync.FeatureConverter.prototype.getDashPattern = function(style) {
  var stroke = style.getStroke();
  var dashPattern = stroke != null ? stroke.getLineDash() : undefined;
  var id = /** @type {os.style.styleLineDashOption} */ (os.style.dashPatternToOptions(dashPattern)).id;
  return plugin.cesium.LINE_STYLE_OPTIONS[id] ? plugin.cesium.LINE_STYLE_OPTIONS[id].csPattern : undefined;
};
