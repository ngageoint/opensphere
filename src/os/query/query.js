goog.module('os.query');
goog.module.declareLegacyNamespace();

const os = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const GeometryField = goog.require('os.geom.GeometryField');
const {METHOD_FIELD} = goog.require('os.interpolate');
const Method = goog.require('os.interpolate.Method');
const Metrics = goog.require('os.metrics.Metrics');
const {Filters: FiltersKeys, Map: MapKeys} = goog.require('os.metrics.keys');
const {getAreaManager} = goog.require('os.query.instance');
const {WORLD_AREA} = goog.require('os.query.utils');
const EventType = goog.require('os.ui.action.EventType');
const ImportEvent = goog.require('os.ui.im.ImportEvent');
const ImportEventType = goog.require('os.ui.im.ImportEventType');
const ImportProcess = goog.require('os.ui.im.ImportProcess');
const MenuEvent = goog.require('os.ui.menu.MenuEvent');
const getUserArea = goog.require('os.ui.query.area.getUserArea');
const uiLaunchChooseArea = goog.require('os.ui.query.area.launchChooseArea');
const AreaAdd = goog.require('os.ui.query.cmd.AreaAdd');

const Feature = goog.requireType('ol.Feature');
const OSFile = goog.requireType('os.file.File');


/**
 * How an area is being used by the application.
 * @enum {number}
 */
const AreaState = {
  NONE: 0,
  EXCLUSION: 1,
  INCLUSION: 2,
  BOTH: 3
};

/**
 * Adds an area via a command and zooms to it.
 *
 * @param {!Feature} area
 * @param {boolean=} opt_active
 */
const addArea = function(area, opt_active) {
  var active = opt_active !== undefined ? opt_active : true;

  // Make sure the area is enabled if it is in the app
  getAreaManager().toggle(area, active);
  CommandProcessor.getInstance().addCommand(new AreaAdd(area, active));
  dispatcher.getInstance().dispatchEvent(new MenuEvent(EventType.ZOOM, {
    'feature': area,
    'geometry': area.getGeometry()
  }));
};

/**
 * Launches the import process for filters/areas.
 *
 * @param {Object<string, *>=} opt_config Optional config to pass to the import process.
 * @param {OSFile=} opt_file Optional file to pass to the import process.
 */
const launchQueryImport = function(opt_config, opt_file) {
  Metrics.getInstance().updateMetric(FiltersKeys.IMPORT, 1);
  var importProcess = new ImportProcess(os.areaImportManager, os.areaFileManager);
  importProcess.setEvent(new ImportEvent(ImportEventType.FILE, opt_file, undefined, opt_config));
  importProcess.begin();
};

/**
 * Launches the enter coordinates window.
 * @param {boolean=} opt_modal Optional flag if modal
 */
const launchCoordinates = function(opt_modal) {
  Metrics.getInstance().updateMetric(MapKeys.LOAD_FROM_COORDINATES, 1);
  getUserArea(undefined, undefined, opt_modal).then(addArea, () => {});
};

/**
 * Launches the choose area window.
 */
const launchChooseArea = function() {
  Metrics.getInstance().updateMetric(MapKeys.LOAD_FROM_AREA, 1);
  uiLaunchChooseArea(addArea);
};

/**
 * Adds an area area covering the whole world.
 */
const queryWorld = function() {
  var world = WORLD_AREA.clone();
  if (world) {
    Metrics.getInstance().updateMetric(MapKeys.QUERY_WORLD, 1);
    var geom = world.getGeometry();
    geom.osTransform();
    geom.set(GeometryField.NORMALIZED, true);
    geom.set(METHOD_FIELD, Method.NONE, true);
    addArea(world, false);
  }
};

exports = {
  AreaState,
  addArea,
  launchQueryImport,
  launchCoordinates,
  launchChooseArea,
  queryWorld
};
