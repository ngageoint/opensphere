goog.provide('os.query');

goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('os.interpolate');
goog.require('os.metrics.MapMetrics');
goog.require('os.metrics.Metrics');
goog.require('os.ui.action.ActionEvent');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportProcess');
goog.require('os.ui.query.cmd.AreaAdd');
goog.require('os.ui.query.ui.area.userAreaDirective');


/**
 * Adds an area via a command and zooms to it.
 * @param {!ol.Feature} area
 * @param {boolean=} opt_active
 */
os.query.addArea = function(area, opt_active) {
  var active = goog.isDef(opt_active) ? opt_active : true;

  // Make sure the area is enabled if it is in the app
  os.ui.areaManager.toggle(area, active);
  os.command.CommandProcessor.getInstance().addCommand(new os.ui.query.cmd.AreaAdd(area, active));
  os.dispatcher.dispatchEvent(new os.ui.action.ActionEvent(os.ui.action.EventType.ZOOM, {
    'feature': area,
    'geometry': area.getGeometry()
  }));
};


/**
 * Launches the import process for filters/areas.
 * @param {Object<string, *>=} opt_config Optional config to pass to the import process.
 */
os.query.launchQueryImport = function(opt_config) {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.IMPORT, 1);
  var importProcess = new os.ui.im.ImportProcess(os.areaImportManager, os.areaFileManager);
  importProcess.setEvent(new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, undefined, undefined, opt_config));
  importProcess.begin();
};


/**
 * Launches the enter coordinates window.
 */
os.query.launchCoordinates = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.LOAD_FROM_COORDINATES, 1);
  os.ui.query.ui.area.getUserArea().then(os.query.addArea);
};


/**
 * Launches the choose area window.
 */
os.query.launchChooseArea = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.LOAD_FROM_AREA, 1);
  os.ui.query.ui.area.launchChooseArea(os.query.addArea);
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
 * @param {ol.geom.Geometry|undefined} geometry The geometry to verify.
 * @return {boolean} true the query matches os.query.WORLD_GEOM
 */
os.query.isWorldQuery = function(geometry) {
  var world = os.query.WORLD_GEOM;
  if (world && geometry && geometry instanceof ol.geom.Polygon) {
    if (goog.math.nearlyEquals(geometry.getArea(), world.getArea()) || geometry.getArea() == 0) {
      geometry.setCoordinates(world.getCoordinates());
      return true;
    }
  }

  return false;
};


/**
 * Polygon representing the whole world.
 * This is the max precision that a polygon can handle
 * @type {ol.geom.Polygon}
 */
os.query.WORLD_GEOM = new ol.geom.Polygon([[
  [180, 90],
  [180, -89.99999999999999],
  [-179.9999999999999, -89.99999999999999],
  [-179.9999999999999, 90],
  [180, 90]
]]);


/**
 * Feature representing the whole world.
 * @type {ol.Feature}
 */
os.query.WORLD_AREA = new ol.Feature({
  'title': 'Whole World'
});
os.query.WORLD_AREA.setGeometry(os.query.WORLD_GEOM);
