goog.provide('os.query');

goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('os.interpolate');
goog.require('os.metrics.MapMetrics');
goog.require('os.metrics.Metrics');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportProcess');
goog.require('os.ui.menu.MenuEvent');
goog.require('os.ui.query.area.chooseAreaDirective');
goog.require('os.ui.query.area.userAreaDirective');
goog.require('os.ui.query.cmd.AreaAdd');


/**
 * How an area is being used by the application.
 * @enum {number}
 */
os.query.AreaState = {
  NONE: 0,
  EXCLUSION: 1,
  INCLUSION: 2,
  BOTH: 3
};


/**
 * Adds an area via a command and zooms to it.
 *
 * @param {!ol.Feature} area
 * @param {boolean=} opt_active
 */
os.query.addArea = function(area, opt_active) {
  var active = opt_active !== undefined ? opt_active : true;

  // Make sure the area is enabled if it is in the app
  os.ui.areaManager.toggle(area, active);
  os.command.CommandProcessor.getInstance().addCommand(new os.ui.query.cmd.AreaAdd(area, active));
  os.dispatcher.dispatchEvent(new os.ui.menu.MenuEvent(os.ui.action.EventType.ZOOM, {
    'feature': area,
    'geometry': area.getGeometry()
  }));
};


/**
 * Launches the import process for filters/areas.
 *
 * @param {Object<string, *>=} opt_config Optional config to pass to the import process.
 * @param {os.file.File=} opt_file Optional file to pass to the import process.
 */
os.query.launchQueryImport = function(opt_config, opt_file) {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.IMPORT, 1);
  var importProcess = new os.ui.im.ImportProcess(os.areaImportManager, os.areaFileManager);
  importProcess.setEvent(new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, opt_file, undefined, opt_config));
  importProcess.begin();
};


/**
 * Launches the enter coordinates window.
 * @param {boolean=} opt_modal Optional flag if modal
 */
os.query.launchCoordinates = function(opt_modal) {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.LOAD_FROM_COORDINATES, 1);
  os.ui.query.area.getUserArea(undefined, undefined, opt_modal).then(os.query.addArea, goog.nullFunction);
};


/**
 * Launches the choose area window.
 */
os.query.launchChooseArea = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.LOAD_FROM_AREA, 1);
  os.ui.query.area.launchChooseArea(os.query.addArea);
};


/**
 * Adds an area area covering the whole world.
 */
os.query.queryWorld = function() {
  var world = os.query.WORLD_AREA.clone();
  if (world) {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.QUERY_WORLD, 1);
    var geom = world.getGeometry();
    geom.osTransform();
    geom.set(os.geom.GeometryField.NORMALIZED, true);
    world.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.NONE, true);
    os.query.addArea(world, false);
  }
};


/**
 * Checks if an existing geometry is of type "world query"
 *
 * @param {ol.geom.Geometry|undefined} geometry The geometry to verify.
 * @return {boolean} true the query matches os.query.WORLD_GEOM
 */
os.query.isWorldQuery = function(geometry) {
  if (os.query.worldArea_ == null) {
    os.query.initWorldArea();
  }

  if (os.query.worldArea_ && geometry && geometry.getType() === ol.geom.GeometryType.POLYGON) {
    // transform the world extent to the current projection to compute the area
    var geomArea = /** @type {ol.geom.Polygon} */ (geometry).getArea();
    return goog.math.nearlyEquals(geomArea / os.query.worldArea_, 1, 1E-4) || geomArea == 0;
  }

  return false;
};


/**
 * calculates world area
 *
 * @param {boolean=} opt_reset
 */
os.query.initWorldArea = function(opt_reset) {
  if (opt_reset) {
    os.query.worldArea_ = undefined;
  } else {
    var worldExtent = ol.proj.transformExtent(os.query.WORLD_EXTENT, os.proj.EPSG4326, os.map.PROJECTION);
    os.query.worldArea_ = ol.extent.getArea(worldExtent);
  }
};


/**
 * The world extent in EPSG:4326. This is the max precision that a polygon can handle.
 * @type {ol.Extent}
 * @const
 */
os.query.WORLD_EXTENT = [-179.9999999999999, -89.99999999999999, 180, 90];


/**
 * The world coordinates in EPSG:4326. This is the max precision that a polygon can handle.
 * Note: this includes coordinates at 0 latitude to ensure directionality of the vertical line components in 3D.
 * @type {Array<Array<Array<number>>>}
 * @const
 */
os.query.WORLD_COORDS = [[
  [-179.9999999999999, -89.99999999999999],
  [-179.9999999999999, 0],
  [-179.9999999999999, 90],
  [180, 90],
  [180, 0],
  [180, -89.99999999999999],
  [-179.9999999999999, -89.99999999999999]
]];


/**
 * Polygon representing the whole world.
 * @type {ol.geom.Polygon}
 */
os.query.WORLD_GEOM = new ol.geom.Polygon(os.query.WORLD_COORDS);


/**
 * @type {number|undefined}
 * @private
 */
os.query.worldArea_ = undefined;


/**
 * Feature representing the whole world.
 * @type {ol.Feature}
 */
os.query.WORLD_AREA = new ol.Feature({
  'geometry': os.query.WORLD_GEOM,
  'title': 'Whole World'
});


/**
 * Feature representing the area we want to zoom to when zooming to the whole world.
 * @type {ol.Feature}
 */
os.query.WORLD_ZOOM_FEATURE = new ol.Feature(new ol.geom.Polygon([[
  [179, 90],
  [181, 90],
  [181, -90],
  [179, -90],
  [179, 90]
]]));


/**
 * Get whether country borders are enabled.
 * @return {boolean} Whether or not picking by country is enabled
 */
os.query.isCountryEnabled = function() {
  return false;
};


/**
 * Launcher for the country picker (if registered).
 * @param {Function=} opt_callback Optional callback function for the chosen country.
 */
os.query.launchCountryPicker = function(opt_callback) {};
