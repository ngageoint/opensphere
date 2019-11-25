goog.provide('os.feature');

goog.require('goog.reflect');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorEventType');
goog.require('os');
goog.require('os.Fields');
goog.require('os.command.FlyToExtent');
goog.require('os.data.RecordField');
goog.require('os.fn');
goog.require('os.geo');
goog.require('os.geom.Ellipse');
goog.require('os.im.mapping.MappingManager');
goog.require('os.interpolate');
goog.require('os.map');
goog.require('os.math.Units');
goog.require('os.style.StyleField');
goog.require('os.style.StyleType');
goog.require('os.ui.filter.string');


/**
 * A function used to sort features.
 * @typedef {function(!ol.Feature, !ol.Feature):number}
 */
os.feature.SortFn;


/**
 * Defines set of options for creating the line of bearing
 * @typedef {{
 *   arrowLength: (number|undefined),
 *   arrowUnits: (string|undefined),
 *   bearingColumn: (string|undefined),
 *   bearingError: (number|undefined),
 *   bearingErrorColumn: (string|undefined),
 *   columnLength: (number|undefined),
 *   length: (number|undefined),
 *   lengthUnits: (string|undefined),
 *   lengthColumn: (string|undefined),
 *   lengthType: (string|undefined),
 *   lengthError: (number|undefined),
 *   lengthErrorUnits: (string|undefined),
 *   lengthErrorColumn: (string|undefined),
 *   showArrow: (boolean|undefined),
 *   showEllipse: (boolean|undefined),
 *   showError: (boolean|undefined)
 * }}
 */
os.feature.LOBOptions;


/**
 * Regular expression to match a title field on a feature.
 * @type {RegExp}
 * @const
 */
os.feature.TITLE_REGEX = /^(name|title)$/i;


/**
 * @type {undefined|function(Array<ol.Feature>)}
 */
os.feature.flyToOverride;


/**
 * @param {null|undefined|ol.Feature|Array<ol.Feature>} features
 */
os.feature.flyTo = function(features) {
  if (!features) {
    return;
  }

  if (!Array.isArray(features)) {
    features = [features];
  }

  if (os.feature.flyToOverride) {
    os.feature.flyToOverride(/** @type {Array<ol.Feature>} */ (features));
  } else {
    var extent = os.feature.getGeometries(features).reduce(os.fn.reduceExtentFromGeometries, ol.extent.createEmpty());
    var cmd = new os.command.FlyToExtent(extent);
    os.commandStack.addCommand(cmd);
  }
};


/**
 * Auto detect and apply column mappings to features.
 *
 * @param {!Array<!ol.Feature>} features The features
 * @param {number=} opt_count Optional count of features for the automap to check, defaulting to 1.
 */
os.feature.autoMap = function(features, opt_count) {
  if (features && features.length > 0) {
    var mm = os.im.mapping.MappingManager.getInstance();
    var detectFeatures = opt_count !== undefined ? features.slice(0, opt_count) : [features[0]];
    var mappings = mm.autoDetect(detectFeatures);
    mappings.forEach(function(mapping) {
      for (var i = 0; i < features.length; i++) {
        mapping.execute(features[i]);
      }
    });
  }
};


/**
 * Simplify the geometry on a feature. Intended to reduce memory footprint and simplify geometry operations.
 *
 * @param {ol.Feature} feature The feature.
 */
os.feature.simplifyGeometry = function(feature) {
  if (feature) {
    var geom = feature.getGeometry();
    if (geom) {
      var flatGeom = os.geo.flattenGeometry(geom);
      if (flatGeom != geom) {
        feature.setGeometry(flatGeom);
      }
    }
  }
};


/**
 * Get the semi-major axis for a feature.
 *
 * @param {ol.Feature} feature The feature.
 * @param {os.math.Units=} opt_units The desired units. Defaults to nautical miles.
 * @return {number|undefined} The semi-major axis value, or undefined if not found.
 */
os.feature.getSemiMajor = function(feature, opt_units) {
  var value = os.feature.getEllipseField_(feature,
      os.fields.DEFAULT_SEMI_MAJ_COL_NAME,
      os.Fields.SEMI_MAJOR,
      os.Fields.SEMI_MAJOR_UNITS,
      opt_units);

  // don't return negative values, and treat 0 as undefined
  return value ? Math.abs(value) : undefined;
};


/**
 * Get the semi-minor axis for a feature.
 *
 * @param {ol.Feature} feature The feature.
 * @param {os.math.Units=} opt_units The desired units. Defaults to nautical miles.
 * @return {number|undefined} The semi-minor axis value, or undefined if not found.
 */
os.feature.getSemiMinor = function(feature, opt_units) {
  var value = os.feature.getEllipseField_(feature,
      os.fields.DEFAULT_SEMI_MIN_COL_NAME,
      os.Fields.SEMI_MINOR,
      os.Fields.SEMI_MINOR_UNITS,
      opt_units);

  // don't return negative values, and treat 0 as undefined
  return value ? Math.abs(value) : undefined;
};


/**
 * Get the orientation for a feature, in degrees.
 *
 * @param {ol.Feature} feature The feature.
 * @return {number|undefined} The orientation value, or undefined if not found.
 */
os.feature.getOrientation = function(feature) {
  var orientation = os.math.parseNumber(feature.get(os.Fields.ORIENTATION));
  return !isNaN(orientation) ? orientation : undefined;
};


/**
 * Get the radius for a feature.
 *
 * @param {ol.Feature} feature The feature.
 * @param {os.math.Units=} opt_units The desired units. Defaults to nautical miles.
 * @return {number|undefined} The radius axis value, or undefined if not found.
 */
os.feature.getRadius = function(feature, opt_units) {
  var value = os.feature.getEllipseField_(feature,
      os.fields.DEFAULT_RADIUS_COL_NAME,
      os.Fields.RADIUS,
      os.Fields.RADIUS_UNITS,
      opt_units);

  // don't return negative values, and treat 0 as undefined
  return value ? Math.abs(value) : undefined;
};


/**
 * Get the bearing for a feature, in degrees.
 *
 * @param {ol.Feature} feature The feature.
 * @return {number|undefined} The orientation value, or undefined if not found.
 */
os.feature.getBearing = function(feature) {
  var bearing = os.math.parseNumber(feature.get(os.Fields.BEARING));
  return !isNaN(bearing) ? bearing : undefined;
};


/**
 * Get the semi-major axis for a feature.
 *
 * @param {ol.Feature} feature The feature.
 * @param {string|undefined} nmiField The application mapped field containing the value in nautical miles.
 * @param {string|undefined} defaultField The default field.
 * @param {string|undefined} defaultUnitsField The default units field.
 * @param {os.math.Units=} opt_units The desired units. Defaults to nautical miles.
 * @return {number|undefined} The ellipse field value, or undefined if not found.
 * @private
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.getEllipseField_ = function(feature, nmiField, defaultField, defaultUnitsField, opt_units) {
  var value = NaN;
  var currentUnits;
  var targetUnits = opt_units || os.math.Units.NAUTICAL_MILES;

  if (feature) {
    // try the mapped column first
    if (nmiField) {
      value = os.math.parseNumber(feature.values_[nmiField]);
    }

    if (!isNaN(value)) {
      // semi-minor has been mapped to nmi
      currentUnits = os.math.Units.NAUTICAL_MILES;
    } else if (defaultField) {
      // semi-minor has not been mapped, so try default field names
      value = os.math.parseNumber(feature.values_[defaultField]);

      if (defaultUnitsField) {
        currentUnits = /** @type {string|undefined} */ (feature.values_[defaultUnitsField]);
      }
    }

    if (!isNaN(value)) {
      if (currentUnits && goog.object.containsValue(os.math.Units, currentUnits)) {
        // units known, translate to target units
        value = os.math.convertUnits(value, targetUnits, currentUnits);
      } else {
        // take a guess at what the units represent
        value = os.geo.convertEllipseValue(value);
      }
    }
  }

  // don't return NaN
  return !isNaN(value) ? value : undefined;
};


/**
 * Creates an ellipse from a feature if it has the necessary data.
 *
 * @param {ol.Feature} feature The feature
 * @param {boolean=} opt_replace If an existing ellipse should be replaced
 * @return {os.geom.Ellipse|undefined} The ellipse, if one could be generated
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.createEllipse = function(feature, opt_replace) {
  var ellipse;

  if (!opt_replace) {
    ellipse = /** @type {(os.geom.Ellipse|undefined)} */ (feature.values_[os.data.RecordField.ELLIPSE]);
    if (ellipse instanceof os.geom.Ellipse) {
      // ellipse already created for this feature
      return ellipse;
    }
  }

  var geom = feature ? feature.getGeometry() : null;
  if (geom instanceof ol.geom.Point) {
    // the feature must have a center point, and either semi-major/semi-minor/orientation OR a radius to generate an
    // ellipse. no values should ever be assumed.
    var center = ol.proj.toLonLat(geom.getFirstCoordinate(), os.map.PROJECTION);
    if (center) {
      var semiMajor = os.feature.getSemiMajor(feature, os.math.Units.METERS);
      var semiMinor = os.feature.getSemiMinor(feature, os.math.Units.METERS);
      var orientation = os.feature.getOrientation(feature);
      var radius = os.feature.getRadius(feature, os.math.Units.METERS);

      if (semiMajor && semiMinor && orientation != null) {
        ellipse = new os.geom.Ellipse(center, semiMajor, semiMinor, orientation);
      } else if (radius) {
        ellipse = new os.geom.Ellipse(center, radius);
      }
    }

    if (ellipse) {
      ellipse.values_[os.data.RecordField.ALTITUDE_MODE] = geom.values_[os.data.RecordField.ALTITUDE_MODE];
    }
  }

  // if an ellipse couldn't be created, use the original geometry so it's still rendered on the map
  feature.set(os.data.RecordField.ELLIPSE, ellipse || geom);

  return ellipse;
};


/**
 * Returns a column value from a feature.
 * If the column is not provided or doesn't exist it will return a default value or NaN
 * If the column exists but is not a number it will return a NaN
 *
 * @param {ol.Feature} feature The feature
 * @param {string=} opt_column column on feature to use
 * @param {number=} opt_default fallback value if column doesn't exist
 * @return {number} some value
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.getColumnValue = function(feature, opt_column, opt_default) {
  if (opt_column) {
    if (feature.values_[opt_column] != null) {
      var val = parseFloat(feature.values_[opt_column]);
      if (val == feature.values_[opt_column]) { // this prevents against a partial conversion ie 7 != '7ate9'
        return val;
      }
    }
    return NaN; // invalid value in column
  }
  return opt_default ? opt_default : NaN; // column doesn't exist
};


/**
 * Creates a line of bearing from a feature if it has the necessary data.
 *
 * @param {ol.Feature} feature The feature
 * @param {boolean=} opt_replace If an existing lob should be replaced
 * @param {os.feature.LOBOptions=} opt_lobOpts the options for rendering line of bearing
 * @return {ol.geom.LineString|ol.geom.MultiLineString|ol.geom.Geometry|undefined} The lob, if one could be generated
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.createLineOfBearing = function(feature, opt_replace, opt_lobOpts) {
  var lob;

  if (!opt_replace) {
    lob = /** @type {(ol.geom.LineString|undefined)} */ (feature.values_[os.data.RecordField.LINE_OF_BEARING]);
    if (lob instanceof ol.geom.MultiLineString) { // lob already created for this feature
      return lob;
    }
  }

  var geom = feature ? feature.getGeometry() : null;
  if (opt_lobOpts && geom instanceof ol.geom.Point) {
    // the feature must have a center point and a bearing to generate a lob. no values should ever be assumed.
    var center = ol.proj.toLonLat(geom.getFirstCoordinate(), os.map.PROJECTION);
    var bearing = os.feature.getColumnValue(feature, opt_lobOpts.bearingColumn);
    var length = opt_lobOpts.lengthType == 'column' ? // get from column unless manual
      os.feature.getColumnValue(feature, opt_lobOpts.lengthColumn, 0) : 1;
    if (center && bearing != null && !isNaN(bearing) && length) {
      // sanitize
      bearing = bearing % 360;
      bearing += bearing <= 0 ? 360 : 0;
      var coords = [];
      if (center.length < 3) {
        center[2] = 0;
      }

      var multiplier = opt_lobOpts.lengthType == 'column' ? opt_lobOpts.columnLength : opt_lobOpts.length;
      multiplier = multiplier || os.style.DEFAULT_LOB_LENGTH;
      var lengthUnits = opt_lobOpts.lengthUnits || os.style.DEFAULT_UNITS;
      var convertedLength = os.math.convertUnits(length, os.style.DEFAULT_UNITS, lengthUnits);
      var effectiveBearing = length < 0 ? (bearing + 180) % 360 : bearing; // flip it if the length will be negative
      var effectiveLength = Math.min(Math.abs(convertedLength * multiplier), os.geo.MAX_LINE_LENGTH);

      // now do some calcs
      var end = osasm.geodesicDirect(center, effectiveBearing, effectiveLength);
      end[2] = center[2];
      var inverse = osasm.geodesicInverse(center, end);
      var endBearing = inverse.finalBearing;

      // create the line and split it across the date line so it renders correctly on a 2D map
      lob = new ol.geom.LineString([center, end], ol.geom.GeometryLayout.XYZM);
      lob = os.geo.splitOnDateLine(lob);
      if (lob instanceof ol.geom.LineString) {
        coords.push(lob.getCoordinates());
      }

      if (opt_lobOpts.showArrow) {
        var arrowUnits = opt_lobOpts.arrowUnits || os.style.DEFAULT_UNITS;
        var arrowLength = opt_lobOpts.arrowLength || os.style.DEFAULT_ARROW_SIZE;
        var convertedArrowLength = os.math.convertUnits(arrowLength, os.style.DEFAULT_UNITS, arrowUnits);
        var effectiveArrowLength = Math.min(convertedArrowLength, os.geo.MAX_LINE_LENGTH);
        var right = osasm.geodesicDirect(end, endBearing + 180 - 45, effectiveArrowLength);
        right.push(center[2]);
        var rightArm = new ol.geom.LineString([end, right], ol.geom.GeometryLayout.XYZM);
        rightArm = os.geo.splitOnDateLine(rightArm);
        if (rightArm instanceof ol.geom.LineString) {
          coords.push(rightArm.getCoordinates());
        }

        var left = osasm.geodesicDirect(end, endBearing + 180 + 45, effectiveArrowLength);
        left.push(center[2]);
        var leftArm = new ol.geom.LineString([end, left], ol.geom.GeometryLayout.XYZM);
        leftArm = os.geo.splitOnDateLine(leftArm);
        if (leftArm instanceof ol.geom.LineString) {
          coords.push(leftArm.getCoordinates());
        }
      }

      // lob must be a ol.geom.MultiLineString
      if (coords.length > 0) {
        lob = new ol.geom.MultiLineString(coords, ol.geom.GeometryLayout.XYZM);
        lob.set(os.geom.GeometryField.NORMALIZED, true);
        lob.osTransform();
      }

      var plusArc = null;
      var minusArc = null;
      if (opt_lobOpts.showError) { // draw error arcs
        var lengthErrorUnits = opt_lobOpts.lengthErrorUnits || os.style.DEFAULT_UNITS;
        var lengthError = Math.abs(os.feature.getColumnValue(feature, opt_lobOpts.lengthErrorColumn));
        var lengthErrorMultiplier = opt_lobOpts.lengthError !== undefined ?
          opt_lobOpts.lengthError : os.style.DEFAULT_LOB_LENGTH_ERROR;
        var bearingError = Math.abs(os.feature.getColumnValue(feature, opt_lobOpts.bearingErrorColumn));
        var bearingErrorMultiplier = opt_lobOpts.bearingError !== undefined ?
          opt_lobOpts.bearingError : os.style.DEFAULT_LOB_BEARING_ERROR;
        if (bearingError === null || isNaN(bearingError)) {
          bearingError = 1;
        }
        if (lengthError === null || isNaN(lengthError)) {
          lengthError = 1;
        }
        var cLengthError = os.math.convertUnits(lengthError, os.style.DEFAULT_UNITS, lengthErrorUnits) *
            lengthErrorMultiplier;
        if (bearingError > 0 && bearingErrorMultiplier > 0) {
          var plusPts = os.geo.interpolateArc(center, effectiveLength + cLengthError,
              Math.min(bearingError * bearingErrorMultiplier * 2, 360), bearing);
          plusArc = new ol.geom.LineString(plusPts, ol.geom.GeometryLayout.XYZM);
          plusArc = os.geo.splitOnDateLine(plusArc);
          plusArc.set(os.geom.GeometryField.NORMALIZED, true);
          plusArc.osTransform();

          if (lengthError > 0 && lengthErrorMultiplier > 0) { // only draw one arc if it is zero
            var pts = os.geo.interpolateArc(center, effectiveLength - cLengthError,
                Math.min(bearingError * bearingErrorMultiplier * 2, 360), bearing);
            minusArc = new ol.geom.LineString(pts, ol.geom.GeometryLayout.XYZM);
            minusArc = os.geo.splitOnDateLine(minusArc);
            minusArc.set(os.geom.GeometryField.NORMALIZED, true);
            minusArc.osTransform();
          }
        } else if (lengthError > 0 && lengthErrorMultiplier > 0) { // no bearing error perpendicular line instead of arc
          var uLineCenter = osasm.geodesicDirect(end, endBearing + 180, -cLengthError);
          var uLineRight = osasm.geodesicDirect(uLineCenter, endBearing + 90, -cLengthError);
          uLineRight.push(center[2]);
          var uLineLeft = osasm.geodesicDirect(uLineCenter, endBearing - 90, -cLengthError);
          uLineLeft.push(center[2]);
          plusArc = new ol.geom.LineString([uLineLeft, uLineRight], ol.geom.GeometryLayout.XYZM);
          plusArc = os.geo.splitOnDateLine(plusArc);
          plusArc.set(os.geom.GeometryField.NORMALIZED, true);
          plusArc.osTransform();

          var bLineCenter = osasm.geodesicDirect(end, endBearing + 180, cLengthError);
          var bLineRight = osasm.geodesicDirect(bLineCenter, endBearing + 90, cLengthError);
          bLineRight.push(center[2]);
          var bLineLeft = osasm.geodesicDirect(bLineCenter, endBearing - 90, cLengthError);
          bLineLeft.push(center[2]);
          minusArc = new ol.geom.LineString([bLineLeft, bLineRight], ol.geom.GeometryLayout.XYZM);
          minusArc = os.geo.splitOnDateLine(minusArc);
          minusArc.set(os.geom.GeometryField.NORMALIZED, true);
          minusArc.osTransform();
        }
      }
      os.interpolate.interpolateGeom(lob);
      feature.set(os.data.RecordField.LINE_OF_BEARING_ERROR_HIGH, plusArc);
      feature.set(os.data.RecordField.LINE_OF_BEARING_ERROR_LOW, minusArc);
    }

    if (opt_lobOpts.showEllipse) { // TODO remove this if we ever allow independent styles
      os.feature.createEllipse(feature);
    } else {
      feature.set(os.data.RecordField.ELLIPSE, null);
    }
  }

  // if a lob couldn't be created, use the original geometry so it's still rendered on the map
  feature.set(os.data.RecordField.LINE_OF_BEARING, lob || geom);

  return lob;
};


/**
 * Generates a set of ring geometries from an options object.
 * @param {?ol.Feature} feature The feature to generate rings for.
 * @param {boolean=} opt_replace Whether to replace an existing ring.
 * @return {ol.geom.Geometry|undefined} The rings.
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.createRings = function(feature, opt_replace) {
  var ringGeom;

  if (!opt_replace) {
    ringGeom = /** @type {ol.geom.GeometryCollection} */ (feature.values_[os.data.RecordField.RING]);
    if (ringGeom instanceof ol.geom.GeometryCollection) {
      return ringGeom;
    }
  }

  if (feature) {
    var options = feature.get(os.data.RecordField.RING_OPTIONS);
    var geometry = feature.getGeometry();
    var center = geometry ? ol.proj.toLonLat(ol.extent.getCenter(geometry.getExtent()), os.map.PROJECTION) : null;

    if (options && options['enabled'] && options['rings'] && center) {
      var date = new Date(os.time.TimelineController.getInstance().getCurrent());
      var geomag = os.bearing.geomag(center, date);
      var declination = geomag['dec'];
      var interpFn = os.interpolate.getMethod() == os.interpolate.Method.GEODESIC ?
          osasm.geodesicDirect : osasm.rhumbDirect;

      var rings = options['rings'];
      var crosshair = options['crosshair'];
      var arcs = options['arcs'];
      var startAngle = (options['startAngle'] || 0) + declination;
      var widthAngle = options['widthAngle'] || 0;
      var lastRing = rings[rings.length - 1];
      var geoms = [];

      rings.forEach(function(ring) {
        var units = ring['units'];
        var radius = ring['radius'];

        if (units && radius) {
          radius = os.math.convertUnits(radius, os.math.Units.METERS, units);
          var geom;
          var coordinates;

          if (arcs) {
            coordinates = os.geo.interpolateArc(center, radius, widthAngle, startAngle + widthAngle / 2);
            geom = new ol.geom.LineString(coordinates);
          } else {
            coordinates = os.geo.interpolateEllipse(center, radius, radius, 0);
            geom = new ol.geom.Polygon([coordinates]);
          }

          geoms.push(geom);
        }
      });

      if (arcs) {
        // add the "endcap" geometries
        var startBearing = startAngle;
        var endBearing = startAngle + widthAngle;

        if (lastRing) {
          var distance = lastRing['radius'];
          var units = lastRing['units'];

          distance = os.math.convertUnits(distance, os.math.Units.METERS, units);

          var endCoord1 = interpFn(center, startBearing, distance);
          var endCoord2 = interpFn(center, endBearing, distance);

          var startCap = new ol.geom.LineString([center, endCoord1]);
          geoms.push(startCap);

          var endCap = new ol.geom.LineString([center, endCoord2]);
          geoms.push(endCap);
        }
      }

      if (crosshair) {
        var bearing = declination < 0 ? declination + 360 : declination;

        if (lastRing) {
          var distance = lastRing['radius'];
          var units = lastRing['units'];

          distance = os.math.convertUnits(distance, os.math.Units.METERS, units);
          distance += distance / rings.length;

          var coord1 = interpFn(center, bearing, distance);
          var coord2 = interpFn(center, bearing - 180, distance);

          var verticalLine = new ol.geom.LineString([coord1, center, coord2]);

          coord1 = interpFn(center, bearing - 90, distance);
          coord2 = interpFn(center, bearing + 90, distance);

          var horizontalLine = new ol.geom.LineString([coord1, center, coord2]);

          geoms.push(verticalLine);
          geoms.push(horizontalLine);
        }
      }

      ringGeom = new ol.geom.GeometryCollection(geoms);
      ringGeom.osTransform();
      os.interpolate.interpolateGeom(ringGeom);
    }

    feature.set(os.data.RecordField.RING, ringGeom);
  }

  return ringGeom;
};



/**
 * Set the altitude component on a feature if it has a point geometry.
 *
 * @param {ol.Feature} feature The feature
 * @param {string=} opt_field The altitude field
 */
os.feature.setAltitude = function(feature, opt_field) {
  var field = opt_field || os.Fields.ALT;
  var geom = feature.getGeometry();
  if (geom instanceof ol.geom.Point) {
    var coords = geom.getFlatCoordinates();
    if (coords.length < 3 || coords[2] === 0) {
      var altitude = Number(feature.get(field) || 0);
      if (isNaN(altitude)) {
        altitude = 0;
      }

      coords[2] = altitude;
      geom.setFlatCoordinates(ol.geom.GeometryLayout.XYZ, coords);
    }
  }
};


/**
 * Automatically populate coordinate fields on a feature. Requires a point geometry to set fields.
 *
 * @param {ol.Feature} feature The feature
 * @param {boolean=} opt_replace If existing values should be replaced
 * @param {ol.geom.Geometry=} opt_geometry Alternate geometry to populate the fields
 * @param {boolean=} opt_silent
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.populateCoordFields = function(feature, opt_replace, opt_geometry, opt_silent) {
  var changed = false;
  var geom = opt_geometry || feature.getGeometry();
  if (geom instanceof ol.geom.Point) {
    var coords = geom.getFlatCoordinates();
    if (coords.length > 1) {
      coords = ol.proj.toLonLat(coords, os.map.PROJECTION);

      if (opt_replace || feature.values_[os.Fields.MGRS] == undefined) {
        feature.values_[os.Fields.MGRS] = osasm.toMGRS(coords);
        changed = true;
      }

      if (opt_replace || feature.values_[os.Fields.LAT] == undefined) {
        feature.values_[os.Fields.LAT] = coords[1];
        changed = true;
      }

      if (opt_replace || feature.values_[os.Fields.LON] == undefined) {
        feature.values_[os.Fields.LON] = coords[0];
        changed = true;
      }

      if (opt_replace || feature.values_[os.Fields.ALT] == undefined) {
        if (coords[2]) {
          feature.values_[os.Fields.ALT] = coords[2];
          changed = true;
        }
      }

      if (opt_replace || feature.values_[os.Fields.LAT_DMS] == undefined) {
        feature.values_[os.Fields.LAT_DMS] = os.geo.toSexagesimal(coords[1], false);
        changed = true;
      }

      if (opt_replace || feature.values_[os.Fields.LON_DMS] == undefined) {
        feature.values_[os.Fields.LON_DMS] = os.geo.toSexagesimal(coords[0], true);
        changed = true;
      }

      if (opt_replace || feature.values_[os.Fields.LAT_DDM] == undefined) {
        feature.values_[os.Fields.LAT_DDM] = os.geo.toDegreesDecimalMinutes(coords[1], false);
        changed = true;
      }

      if (opt_replace || feature.values_[os.Fields.LON_DDM] == undefined) {
        feature.values_[os.Fields.LON_DDM] = os.geo.toDegreesDecimalMinutes(coords[0], true);
        changed = true;
      }
    }
  }

  // fire a change event if anything was updated, so the UI can update
  if (!opt_silent && changed) {
    feature.changed();
  }
};


/**
 * Gets a field value from an {@link ol.Feature}.
 *
 * @param {ol.Feature} item
 * @param {string} field
 * @return {*} The value
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.getField = function(item, field) {
  return item ? item.values_[field] : undefined;
};


/**
 * Get the title from a feature, matching a property (case insensitive) called 'name' or 'title'.
 *
 * @param {ol.Feature} feature The feature.
 * @return {string|undefined} The feature title, or undefined if not found.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.getTitle = function(feature) {
  var title;
  if (feature) {
    for (var key in feature.values_) {
      if (os.feature.TITLE_REGEX.test(key)) {
        var value = feature.values_[key];
        if (value && typeof value === 'string') {
          title = value;
          break;
        }
      }
    }
  }

  return title;
};


/**
 * Get the property name for the {@link ol.Feature#values_} property. This is necessary for compiled code because
 * `values_` will be renamed by the Closure compiler.
 * @type {string}
 * @private
 * @const
 */
os.feature.VALUES_FIELD_ = goog.reflect.objectProperty('values_', new ol.Feature());


/**
 * Create a filter function expression to get a value from a feature.
 *
 * @param {string} itemVar The feature variable name.
 * @param {string} field The field to get.
 * @return {string} The get expression.
 */
os.feature.filterFnGetter = function(itemVar, field) {
  // create the string: itemVar.values_["column_name"]
  // make the field safe for use as an object property name, to prevent injection attacks
  return itemVar + '.' + os.feature.VALUES_FIELD_ + '[' + os.ui.filter.string.quoteString(field) + ']';
};


/**
 * If a field is internal to the application and should be skipped by user-facing features.
 *
 * @param {string} field The metadata field
 * @return {boolean}
 */
os.feature.isInternalField = function(field) {
  return os.data.RecordField.REGEXP.test(field) || os.style.StyleType.REGEXP.test(field) ||
      os.style.StyleField.REGEXP.test(field);
};


/**
 * Get the layer id of a feature
 *
 * @param {ol.Feature} feature The feature
 * @return {string|undefined}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.getLayerId = function(feature) {
  var sourceId = undefined;
  if (feature) {
    sourceId = /** @type {string|undefined} */ (feature.values_[os.data.RecordField.SOURCE_ID]);
  }
  return sourceId;
};


/**
 * Get the layer containing a feature. This accounts for features that may be rendered in a
 * {@link os.layer.AnimationOverlay}, which uses an OL layer/source with hit detection disabled. In that case, find
 * the original layer from the map.
 *
 * @param {ol.Feature} feature The feature
 * @return {ol.layer.Layer}
 */
os.feature.getLayer = function(feature) {
  var layer = null;
  if (feature && os.map.mapContainer) {
    var sourceId = os.feature.getLayerId(feature);
    if (sourceId) {
      // look up the layer via the id
      layer = os.map.mapContainer.getLayer(sourceId);
    }
  }

  return layer;
};


/**
 * Get the source containing a feature. This accounts for features that may be rendered in a
 * {@link os.layer.AnimationOverlay}, which uses an OL layer/source with hit detection disabled. In that case, find
 * the original source from the data manager.
 *
 * @param {ol.Feature} feature The feature
 * @param {ol.layer.Layer=} opt_layer The layer containing the feature
 * @return {os.source.Vector} The source, if it can be found
 */
os.feature.getSource = function(feature, opt_layer) {
  var source = null;
  if (opt_layer != null) {
    // layer was provided - make sure the source is an OS source
    var layerSource = opt_layer.getSource();
    if (os.instanceOf(layerSource, os.source.Vector.NAME)) {
      source = /** @type {!os.source.Vector} */ (layerSource);
    }
  }

  if (source == null && feature != null) {
    // no layer or not an OS source, so check if the feature has the source id
    var sourceId = os.feature.getLayerId(feature);
    if (sourceId) {
      // have the source id - check if it's in the data manager
      source = os.osDataManager.getSource(sourceId);
    }
  }

  return source;
};


/**
 * Get the color of a feature.
 *
 * @param {ol.Feature} feature The feature.
 * @param {os.source.ISource=} opt_source The source containing the feature, or null to ignore source color.
 * @param {(Array<number>|string)=} opt_default The default color, `null` to indicate no color.
 * @param {os.style.StyleField=} opt_colorField The style field to use in locating the color.
 * @return {Array<number>|string} The color.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.getColor = function(feature, opt_source, opt_default, opt_colorField) {
  var defaultColor = opt_default !== undefined ? opt_default : os.style.DEFAULT_LAYER_COLOR;

  if (feature) {
    var color = /** @type {string|undefined} */ (feature.values_[os.data.RecordField.COLOR]);

    if (color === undefined) {
      // check the layer config to see if it's replacing feature styles
      // the config here will not be modified, so get it directly from the manager for speed
      // (rather than getting a new one merged together for changing)
      var layerConfig = os.style.StyleManager.getInstance().getLayerConfig(os.feature.getLayerId(feature) || '');
      if (layerConfig && layerConfig[os.style.StyleField.REPLACE_STYLE]) {
        color = os.style.getConfigColor(layerConfig, false, opt_colorField);
      }
    }

    if (color === undefined) {
      var featureConfig = /** @type {Array<Object>|Object|undefined} */ (feature.values_[os.style.StyleType.FEATURE]);
      if (featureConfig) {
        if (Array.isArray(featureConfig)) {
          for (var i = 0; !color && i < featureConfig.length; i++) {
            color = os.style.getConfigColor(featureConfig[i], false, opt_colorField);

            // stop on the first color found, allowing null if set as the default
            if (color || (color === null && defaultColor === null)) {
              break;
            }
          }
        } else {
          color = os.style.getConfigColor(featureConfig, false, opt_colorField);
        }
      }
    }

    if (color || (color === null && defaultColor === null)) {
      // if the default color was provided as null, allow returning that as the color
      return /** @type {Array<number>|string} */ (color);
    } else if (opt_source) {
      // fall back on the source color
      return opt_source.getColor();
    } else if (opt_source !== null) {
      // try to locate the source
      var source = os.feature.getSource(feature);
      if (source) {
        return source.getColor();
      }
    }
  }

  return defaultColor;
};


/**
 * Get the fill color of a feature.
 * @param {ol.Feature} feature The feature.
 * @param {os.source.ISource=} opt_source The source containing the feature, or null to ignore source color.
 * @param {(Array<number>|string)=} opt_default The default color.
 * @return {Array<number>|string} The color.
 */
os.feature.getFillColor = function(feature, opt_source, opt_default) {
  // default to null to indicate no fill
  return os.feature.getColor(feature, opt_source, opt_default || null, os.style.StyleField.FILL);
};


/**
 * Get the stroke color of a feature.
 * @param {ol.Feature} feature The feature.
 * @param {os.source.ISource=} opt_source The source containing the feature, or null to ignore source color.
 * @param {(Array<number>|string)=} opt_default The default color.
 * @return {Array<number>|string} The color.
 */
os.feature.getStrokeColor = function(feature, opt_source, opt_default) {
  // default to null to indicate no stroke
  return os.feature.getColor(feature, opt_source, opt_default || null, os.style.StyleField.STROKE);
};


/**
 * Gets the shape name for a feature.
 *
 * @param {!ol.Feature} feature The feature
 * @param {os.source.Vector=} opt_source The source containing the feature
 * @param {boolean=} opt_preferSource If the source shape should be preferred over the feature shape.
 * @return {string|undefined}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.getShapeName = function(feature, opt_source, opt_preferSource) {
  var shapeName = /** @type {string|undefined} */ (feature.values_[os.style.StyleField.SHAPE]);

  if (!shapeName || opt_preferSource) {
    // get the source shape if the feature didn't define its own shape, or the source shape is preferred
    var source = opt_source || os.feature.getSource(feature);
    if (source && os.instanceOf(source, os.source.Vector.NAME)) {
      var sourceShape = source.getGeometryShape();
      if (opt_preferSource || sourceShape !== os.style.ShapeType.DEFAULT) {
        shapeName = sourceShape;
      }
    }
  }

  return shapeName;
};


/**
 * Gets the center shape name for a feature.
 *
 * @param {!ol.Feature} feature The feature
 * @param {os.source.Vector=} opt_source The source containing the feature
 * @param {boolean=} opt_preferSource If the source shape should be preferred over the feature shape.
 * @return {string|undefined}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.getCenterShapeName = function(feature, opt_source, opt_preferSource) {
  var shapeName = /** @type {string|undefined} */ (feature.values_[os.style.StyleField.CENTER_SHAPE]);

  if (!shapeName || opt_preferSource) {
    // get the source shape if the feature didn't define its own shape, or the source shape is preferred
    var source = opt_source || os.feature.getSource(feature);
    if (source && os.instanceOf(source, os.source.Vector.NAME)) {
      var sourceShape = source.getCenterGeometryShape();
      if (opt_preferSource || sourceShape !== os.style.ShapeType.DEFAULT) {
        shapeName = sourceShape;
      }
    }
  }

  return shapeName;
};


/**
 * Hides the label for a feature.
 *
 * @param {ol.Feature} feature The feature
 * @return {boolean} If the label was hidden, or false if it was hidden already.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.hideLabel = function(feature) {
  if (feature && feature.values_[os.style.StyleField.SHOW_LABELS] !== false) {
    feature.values_[os.style.StyleField.SHOW_LABELS] = false;
    return true;
  }

  return false;
};


/**
 * Shows the label for a feature.
 *
 * @param {ol.Feature} feature The feature
 * @return {boolean} If the label was hidden, or false if it was hidden already.
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.showLabel = function(feature) {
  if (feature && feature.values_[os.style.StyleField.SHOW_LABELS] !== true) {
    feature.values_[os.style.StyleField.SHOW_LABELS] = true;
    return true;
  }

  return false;
};


/**
 * Updates the feature (typically after style changes)
 *
 * @param {ol.Feature} feature The feature
 * @param {ol.source.Source=} opt_source The source containing the feature
 */
os.feature.update = function(feature, opt_source) {
  if (!opt_source) {
    opt_source = os.feature.getSource(feature);
  }

  if (!opt_source && os.map.mapContainer && os.map.mapContainer.containsFeature(feature)) {
    opt_source = os.map.mapContainer.getLayer(os.MapContainer.DRAW_ID).getSource();
  }

  var id = feature.getId();
  if (id && opt_source && /** @type {ol.source.Vector} */ (opt_source).getFeatureById(id)) {
    // for 3D synchronizer
    opt_source.dispatchEvent(new ol.source.Vector.Event(ol.source.VectorEventType.CHANGEFEATURE, feature));
    // for 2D
    opt_source.changed();
  }
};


/**
 * Remove features from application
 *
 * @param {!string} sourceId
 * @param {Array<ol.Feature>} features
 */
os.feature.removeFeatures = function(sourceId, features) {
  var source = os.osDataManager.getSource(sourceId);
  if (source && features) {
    source.removeFeatures(features);
  }
};


/**
 * Copy a feature, saving its current style as a local feature style.
 *
 * @param {!ol.Feature} feature The feature to copy
 * @param {Object=} opt_layerConfig The feature's layer config
 * @return {!ol.Feature}
 */
os.feature.copyFeature = function(feature, opt_layerConfig) {
  var clone = feature.clone();
  clone.setId(ol.getUid(clone));

  // copy the feature's current style to a new config and set it on the cloned feature
  // base config priority: feature config > layer config > default config
  var baseConfig = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE)) || opt_layerConfig ||
      os.style.DEFAULT_VECTOR_CONFIG;
  var featureConfig = os.style.createFeatureConfig(feature, baseConfig, opt_layerConfig);
  clone.set(os.style.StyleType.FEATURE, featureConfig);

  var shapeName = os.feature.getShapeName(feature);
  if (shapeName) {
    // default shape is point for vector layers, icon for KML layers. check the config to see if it should be an icon.
    if (shapeName == os.style.ShapeType.DEFAULT) {
      shapeName = os.style.isIconConfig(featureConfig) ? os.style.ShapeType.ICON : os.style.ShapeType.POINT;
    }

    // places doesn't support selected styles
    shapeName = shapeName.replace(/^Selected /, '');

    clone.set(os.style.StyleField.SHAPE, shapeName);
  }

  var centerShapeName = os.feature.getCenterShapeName(feature);
  if (centerShapeName) {
    // default shape is point for vector layers, icon for KML layers. check the config to see if it should be an icon.
    if (centerShapeName == os.style.ShapeType.DEFAULT) {
      centerShapeName = os.style.isIconConfig(featureConfig) ? os.style.ShapeType.ICON : os.style.ShapeType.POINT;
    }

    // places doesn't support selected styles
    centerShapeName = centerShapeName.replace(/^Selected /, '');

    clone.set(os.style.StyleField.CENTER_SHAPE, centerShapeName);
  }

  return clone;
};


/**
 * Sets an opacity multiplier on every feature in a set.
 *
 * @param {Array<!ol.Feature>} features
 * @param {number} opacity
 * @param {os.source.Vector=} opt_source
 * @suppress {accessControls}
 */
os.feature.updateFeaturesFadeStyle = function(features, opacity, opt_source) {
  var source = opt_source || os.feature.getSource(features[0]);

  if (source) {
    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];

      // don't fade dynamic features because they are always displayed
      if (feature && !(feature instanceof os.feature.DynamicFeature)) {
        // we need to make a copy/clone of the style to mess with the config
        var layerConfig = os.style.getLayerConfig(feature, source);
        var baseConfig = /** @type {Object|undefined} */
            (feature.values_[os.style.StyleType.FEATURE]) ||
            layerConfig ||
            os.style.DEFAULT_VECTOR_CONFIG;
        os.style.setConfigOpacityColor(baseConfig, opacity, true);

        var style = os.style.createFeatureStyle(feature, baseConfig, layerConfig);
        feature.setStyle(style);
      }
    }
  }
};


/**
 * Test if a feature's source id matches the provided source id.
 *
 * @param {string} sourceId The source id to match
 * @param {!ol.Feature} feature The feature to test
 * @return {boolean}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.sourceIdEquals = function(sourceId, feature) {
  return feature.values_[os.data.RecordField.SOURCE_ID] == sourceId;
};


/**
 * Sorts two features by a field.
 *
 * @param {string} field The sort field
 * @param {!ol.Feature} a The first feature
 * @param {!ol.Feature} b The second feature
 * @return {number}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.sortByField = function(field, a, b) {
  var aValue = a.values_[field];
  var bValue = b.values_[field];

  if (aValue != null && bValue != null) {
    if (typeof aValue == 'string' && typeof bValue == 'string') {
      return goog.string.floatAwareCompare(aValue, bValue);
    }

    return goog.array.defaultCompare(aValue, bValue);
  } else if (aValue != null) {
    return -1;
  } else if (bValue != null) {
    return 1;
  }

  return 0;
};


/**
 * Sorts two features by their start time, in ascending order.
 *
 * @param {!ol.Feature} a The first feature.
 * @param {!ol.Feature} b The second feature.
 * @return {number}
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.sortByTime = function(a, b) {
  var aTimeObj = /** @type {os.time.ITime|undefined} */ (a.values_[os.data.RecordField.TIME]);
  var bTimeObj = /** @type {os.time.ITime|undefined} */ (b.values_[os.data.RecordField.TIME]);

  if (aTimeObj && bTimeObj) {
    var aTime = aTimeObj.getStart();
    var bTime = bTimeObj.getStart();
    return aTime > bTime ? 1 : aTime < bTime ? -1 : 0;
  } else if (aTimeObj) {
    return 1;
  } else if (bTimeObj) {
    return -1;
  }

  return 0;
};


/**
 * Sorts two features by their start time, in descending order.
 *
 * @param {!ol.Feature} a The first feature.
 * @param {!ol.Feature} b The second feature.
 * @return {number}
 */
os.feature.sortByTimeDesc = function(a, b) {
  return os.feature.sortByTime(b, a);
};


/**
 * Compares two features by their id.
 *
 * @param {!ol.Feature} a First feature
 * @param {!ol.Feature} b Second feature
 * @return {number}
 *
 * Inlined everything for performance reasons. Function calls are too expensive for how often this can be called.
 * @suppress {accessControls}
 */
os.feature.idCompare = function(a, b) {
  return a.id_ > b.id_ ? 1 : a.id_ < b.id_ ? -1 : 0;
};


/**
 * Validates a features geometries, attempting to repair invalid polygons and removing them if they are beyond fixing
 *
 * @param {!ol.Feature} feature thing to validate geometries on
 * @param {boolean=} opt_quiet If alerts should be suppressed
 * @return {number} number of invalid polygons removed
 */
os.feature.validateGeometries = function(feature, opt_quiet) {
  var geometry = feature.getGeometry();
  var count = 0;
  if (geometry instanceof ol.geom.GeometryCollection) {
    var geometries = geometry.getGeometriesArray();
    for (var i = geometries.length; i > 0; i--) {
      if (geometries[i] instanceof ol.geom.Polygon || geometries[i] instanceof ol.geom.MultiPolygon) {
        var geom = os.geo.jsts.validate(geometries[i], opt_quiet, true); // repair or remove invalid geometries
        if (geom !== undefined) {
          geometries[i] = geom;
        } else {
          geometries.splice(i, 1);
          count++;
        }
      }
    }
  } else if (geometry instanceof ol.geom.Polygon || geometry instanceof ol.geom.MultiPolygon) {
    var geom = os.geo.jsts.validate(geometry, opt_quiet, true);
    if (geom === undefined) {
      count++;
    }
    feature.setGeometry(geom);
  }
  return count;
};


/**
 * @param {ol.Feature} feature
 * @param {function(!ol.geom.Geometry):(boolean|undefined)} callback Return
 *   false to shortcut the loop
 */
os.feature.forEachGeometry = function(feature, callback) {
  if (feature) {
    var mainGeom = feature.getGeometry();
    var mainGeomSeen = false;

    var style = feature.getStyle();
    var styles = Array.isArray(style) ? style : [style];

    for (var s = 0, ss = styles.length; s < ss; s++) {
      if (styles[s]) {
        var geomFunc = styles[s].getGeometryFunction();
        if (geomFunc) {
          var geom = geomFunc(feature);
          if (geom) {
            if (geom === mainGeom) {
              mainGeomSeen = true;
            }

            var retVal = callback(geom);
            if (retVal != null && !retVal) {
              break;
            }
          }
        }
      }
    }

    if (mainGeom && !mainGeomSeen) {
      callback(mainGeom);
    }
  }
};


/**
 * Gets all associated geometries for a feature or list of features.
 * @param {(ol.Feature|Array<ol.Feature>)} features
 * @return {!Array<ol.geom.Geometry>} The array of all the geometries.
 */
os.feature.getGeometries = function(features) {
  const arr = [];
  const callback = (geom) => {
    arr.push(geom);
    return true;
  };

  if (Array.isArray(features)) {
    features.forEach((f) => os.feature.forEachGeometry(f, callback));
  } else {
    os.feature.forEachGeometry(features, callback);
  }

  return arr;
};
