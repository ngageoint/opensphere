goog.provide('os.olcs');

goog.require('olcs.core');


/**
 * @enum {string}
 */
os.olcs.GeometryInstanceId = {
  ELLIPSOID: 'ellipsoid',
  ELLIPSOID_OUTLINE: 'ellipsoidOutline',
  GEOM: 'geometry',
  GEOM_OUTLINE: 'geometryOutline'
};


/**
 * Stolen from cesiums RectangleOutlineGeometry. Build our own polygon to display in polylines instead of a polygon
 * This was done to support more than 1px line width in windows
 * @param {ol.Extent} extent
 * @param {number=} opt_altitude
 * @param {boolean=} opt_extrude
 * @return {Array<Cesium.Cartesian3>}
 */
os.olcs.generateRectanglePositions = function(extent, opt_altitude, opt_extrude) {
  var rect = Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]);
  var rected = new Cesium.RectangleGeometry({
    ellipsoid: Cesium.Ellipsoid.WGS84,
    rectangle: rect,
    height: opt_altitude ? opt_altitude : 0,
    extrudedHeight: opt_extrude ? 0 : undefined
  });

  // NOTE: The Cesium.RectangleGeometryLibrary.computePosition does NOT use the height parameter :(
  // var geometry = Cesium.RectangleGeometry.createGeometry(rected);

  var options = Cesium.RectangleGeometryLibrary.computeOptions(rected, rect, new Cesium.Cartographic());
  // options.surfaceHeight = opt_altitude ? opt_altitude : 0;
  // options.extrudedHeight = opt_extrude ? 0 : undefined;
  var height = options.height;
  var width = options.width;
  var positions = [];
  var row = 0;
  var col;

  for (col = 0; col < width; col++) {
    var position = new Cesium.Cartesian3();
    Cesium.RectangleGeometryLibrary.computePosition(options, row, col, position);
    positions.push(position);
  }

  col = width - 1;
  for (row = 1; row < height; row++) {
    var position = new Cesium.Cartesian3();
    Cesium.RectangleGeometryLibrary.computePosition(options, row, col, position);
    positions.push(position);
  }

  row = height - 1;
  for (col = width - 2; col >= 0; col--) {
    var position = new Cesium.Cartesian3();
    Cesium.RectangleGeometryLibrary.computePosition(options, row, col, position);
    positions.push(position);
  }

  col = 0;
  for (row = height - 2; row > 0; row--) {
    var position = new Cesium.Cartesian3();
    Cesium.RectangleGeometryLibrary.computePosition(options, row, col, position);
    positions.push(position);
  }

  // Push on the first position to the last to close the polygon
  if (positions.length > 0) {
    positions.push(positions[0]);
  }

  return positions;
};


/**
 * Stolen from cesiums EllipseOutlineGeometry. Build our own polygon to display in polylines instead of a polygon
 * This was done to support more than 1px line width in windows
 * @param {!Cesium.Cartesian3} center
 * @param {number} radius
 * @return {Array<Cesium.Cartesian3>}
 */
os.olcs.generateCirclePositions = function(center, radius) {
  var options = {
    'center': center,
    'semiMajorAxis': radius,
    'semiMinorAxis': radius,
    'granularity': Cesium.Math.RADIANS_PER_DEGREE,
    'rotation': 0
    // 'ellipsoid': Cesium.Ellipsoid.WGS84,
    // 'height': 0.0,
    // 'extrudedHeight': undefined,
    // 'numberOfVerticalLines': 0,
    // 'extrude': false
  };

  var flatpos = Cesium.EllipseGeometryLibrary.computeEllipsePositions(options, false, true).outerPositions;

  // Send back a list of positions as we expect them to be.
  var positions = [];
  while (flatpos.length > 0) {
    var pos = goog.array.splice(flatpos, 0, 3);
    var cartPos = new Cesium.Cartesian3(pos[0], pos[1], pos[2]);
    positions.push(cartPos);
  }

  // Push on the first position to the last to close the polygon
  if (positions.length > 0) {
    positions.push(positions[0]);
  }

  // Return an array of cartesians
  return positions;
};
