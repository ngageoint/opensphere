goog.declareModuleId('os.query');

import CommandProcessor from '../command/commandprocessor.js';
import * as dispatcher from '../dispatcher.js';
import GeometryField from '../geom/geometryfield.js';
import {METHOD_FIELD} from '../interpolate.js';
import Method from '../interpolatemethod.js';
import Metrics from '../metrics/metrics.js';
import {Filters as FiltersKeys, Map as MapKeys} from '../metrics/metricskeys.js';
import EventType from '../ui/action/actioneventtype.js';
import ImportEvent from '../ui/im/importevent.js';
import ImportEventType from '../ui/im/importeventtype.js';
import ImportProcess from '../ui/im/importprocess.js';
import MenuEvent from '../ui/menu/menuevent.js';
import getUserArea from '../ui/query/area/getuserarea.js';
import uiLaunchChooseArea from '../ui/query/area/launchchoosearea.js';
import AreaAdd from '../ui/query/cmd/areaaddcmd.js';
import {getAreaManager} from './queryinstance.js';
import {WORLD_AREA} from './queryutils.js';

const {default: OSFile} = goog.requireType('os.file.File');
const {default: FileManager} = goog.requireType('os.file.FileManager');
const {default: ImportManager} = goog.requireType('os.ui.im.ImportManager');


/**
 * How an area is being used by the application.
 * @enum {number}
 */
export const AreaState = {
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
export const addArea = function(area, opt_active) {
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
 * The area import manager.
 * @type {ImportManager}
 */
let areaImportManager = null;

/**
 * Get the area import manager.
 * @return {ImportManager}
 */
export const getAreaImportManager = () => areaImportManager;

/**
 * Set the area import manager.
 * @param {ImportManager} value The manager.
 */
export const setAreaImportManager = (value) => {
  areaImportManager = value;
};

/**
 * The area file Manager.
 * @type {FileManager}
 */
let areaFileManager = null;

/**
 * Get the area import manager.
 * @return {FileManager}
 */
export const getAreaFileManager = () => areaFileManager;

/**
 * Set the area import manager.
 * @param {FileManager} value The manager.
 */
export const setAreaFileManager = (value) => {
  areaFileManager = value;
};

/**
 * Launches the import process for filters/areas.
 *
 * @param {Object<string, *>=} opt_config Optional config to pass to the import process.
 * @param {OSFile=} opt_file Optional file to pass to the import process.
 */
export const launchQueryImport = function(opt_config, opt_file) {
  Metrics.getInstance().updateMetric(FiltersKeys.IMPORT, 1);
  var importProcess = new ImportProcess(areaImportManager, areaFileManager);
  importProcess.setEvent(new ImportEvent(ImportEventType.FILE, opt_file, undefined, opt_config));
  importProcess.begin();
};

/**
 * Launches the enter coordinates window.
 * @param {boolean=} opt_modal Optional flag if modal
 */
export const launchCoordinates = function(opt_modal) {
  Metrics.getInstance().updateMetric(MapKeys.LOAD_FROM_COORDINATES, 1);
  getUserArea(undefined, undefined, opt_modal).then(addArea, () => {});
};

/**
 * Launches the choose area window.
 */
export const launchChooseArea = function() {
  Metrics.getInstance().updateMetric(MapKeys.LOAD_FROM_AREA, 1);
  uiLaunchChooseArea(addArea);
};

/**
 * Adds an area area covering the whole world.
 */
export const queryWorld = function() {
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
