goog.provide('os.query');

goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('os.fn');
goog.require('os.interpolate');
goog.require('os.metrics.MapMetrics');
goog.require('os.metrics.Metrics');
goog.require('os.query.utils');
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
  os.ui.query.area.getUserArea(undefined, undefined, opt_modal).then(os.query.addArea, os.fn.noop);
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
  var world = os.query.utils.WORLD_AREA.clone();
  if (world) {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.QUERY_WORLD, 1);
    var geom = world.getGeometry();
    geom.osTransform();
    geom.set(os.geom.GeometryField.NORMALIZED, true);
    geom.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.NONE, true);
    os.query.addArea(world, false);
  }
};
