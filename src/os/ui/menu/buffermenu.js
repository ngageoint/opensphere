goog.declareModuleId('os.ui.menu.buffer');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';

import EventType from '../../action/eventtype.js';
import {ICON} from '../../buffer/buffer.js';
import {isGeometryPolygonal} from '../../geo/geo.js';
import {Layer as LayerMetrics} from '../../metrics/metricskeys.js';
import {inIframe} from '../../os.js';
import AreaManager from '../../query/areamanager.js';
import * as BufferDialogUI from '../buffer/bufferdialog.js';
import {getSourcesFromContext} from './commonmenu.js';
import * as layerMenu from './layermenu.js';
import * as mapMenu from './mapmenu.js';
import * as spatialMenu from './spatial.js';

const {assert} = goog.require('goog.asserts');
const GoogEvent = goog.require('goog.events.Event');
const {toTitleCase} = goog.require('goog.string');

const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');
const {default: MenuItem} = goog.requireType('os.ui.menu.MenuItem');


/**
 * Set up buffer region listeners.
 */
export const setup = function() {
  layerSetup();
  mapSetup();
  spatialSetup();
};

/**
 * Clean up buffer region listeners.
 */
export const dispose = function() {
  layerDispose();
  mapDispose();
  spatialDispose();
};

/**
 * Set up buffer region listeners in the layers window.
 */
export const layerSetup = function() {
  var menu = layerMenu.getMenu();
  if (menu && !menu.getRoot().find(EventType.BUFFER)) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.TOOLS);
    assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: 'Create Buffer Region...',
      eventType: EventType.BUFFER,
      tooltip: 'Create buffer regions around loaded data',
      icons: ['<i class="fa fa-fw ' + ICON + '"></i>'],
      beforeRender: layerMenu.visibleIfSupported,
      handler: handleLayerBufferEvent,
      metricKey: LayerMetrics.CREATE_BUFFER
    });
  }
};

/**
 * Clean up buffer region listeners in the layers window.
 */
export const layerDispose = function() {
  var menu = layerMenu.getMenu();
  var group = menu ? menu.getRoot().find(layerMenu.GroupLabel.TOOLS) : undefined;
  if (group) {
    group.removeChild(EventType.BUFFER);
  }
};

/**
 * Set up buffer region listeners on the map.
 */
export const mapSetup = function() {
  var menu = mapMenu.getMenu();
  if (menu && !menu.getRoot().find(EventType.BUFFER)) {
    var group = menu.getRoot().find(mapMenu.GroupLabel.COORDINATE);
    assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: 'Create Buffer Region...',
      eventType: EventType.BUFFER,
      tooltip: 'Create a buffer region around the clicked coordinate',
      icons: ['<i class="fa fa-fw ' + ICON + '"></i>'],
      handler: handleCoordinateBufferEvent
    });
  }
};

/**
 * Clean up buffer region listeners on the map.
 */
export const mapDispose = function() {
  var menu = mapMenu.getMenu();
  if (menu) {
    var group = menu.getRoot().find(mapMenu.GroupLabel.COORDINATE);
    if (group) {
      group.removeChild(EventType.BUFFER);
    }
  }
};

/**
 * Set up buffer region listeners on the spatial menu.
 */
export const spatialSetup = function() {
  var menu = spatialMenu.getMenu();
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(spatialMenu.Group.TOOLS);
    assert(group, 'Group "' + spatialMenu.Group.TOOLS + '" should exist! Check spelling?');

    group.addChild({
      eventType: EventType.BUFFER,
      label: 'Create Buffer Region...',
      tooltip: 'Create a buffer region from the feature(s)',
      icons: ['<i class="fa fa-fw ' + ICON + '"></i>'],
      beforeRender: visibleIfCanBuffer,
      handler: handleSpatialBufferEvent
    });
  }
};

/**
 * Clean up buffer region listeners on the spatial menu.
 */
export const spatialDispose = function() {
  var menu = spatialMenu.getMenu();
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(spatialMenu.Group.TOOLS);
    if (group) {
      group.removeChild(EventType.BUFFER);
    }
  }
};

/**
 * Enables the option when a feature exists in the args.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfCanBuffer = function(context) {
  // polygonal geometries are generally drawn as areas, so don't clutter the menu with the buffer option
  this.visible = false;

  var features = spatialMenu.getFeaturesFromContext(context);
  if (features.length > 0) {
    // feature is on the map, buffer it
    this.visible = true;
  } else {
    var geometries = spatialMenu.getGeometriesFromContext(context);
    if (geometries.length === 1 && !isGeometryPolygonal(geometries[0])) {
      // drawing a non-polygonal geometry, buffer it
      this.visible = true;
    }
  }
};

/**
 * Handle buffer event from the map menu.
 *
 * @param {!MenuEvent<ol.Coordinate>} event
 */
export const handleCoordinateBufferEvent = function(event) {
  event.preventDefault();

  BufferDialogUI.launchBufferDialog({
    'features': [new Feature(new Point(event.getContext()))]
  });
};

/**
 * Handle buffer event from the layer menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
export const handleLayerBufferEvent = function(event) {
  var context = event.getContext();
  if (context && event instanceof GoogEvent && !inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    // only use the first source unless we ever support multiple in the picker
    var sources = getSourcesFromContext(context);
    BufferDialogUI.launchBufferDialog({
      'sources': sources && sources.length > 0 ? [sources[0]] : []
    });
  }
};

/**
 * Handle buffer event from the spatial menu.
 *
 * @param {!MenuEvent} event The event.
 */
export const handleSpatialBufferEvent = function(event) {
  var context = event.getContext();
  if (context && event instanceof GoogEvent && !inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    context = /** @type {Object} */ (context);

    // first check if there are features to buffer
    var features = spatialMenu.getFeaturesFromContext(context);
    if (!features.length) {
      // check if there are geometries that can be used instead
      features = spatialMenu.getGeometriesFromContext(context).map(function(geometry) {
        return new Feature(geometry);
      });
    }

    if (features.length) {
      // create a buffer around an area/polygon
      var config = {
        'features': features
      };

      var am = AreaManager.getInstance();
      if (am.contains(features[0])) {
        // if the feature is an area, grab the title from it
        var title = /** @type {string} */ (features[0].get('title'));
        if (title) {
          config['title'] = toTitleCase(title) + ' Buffer';
        }
      }

      BufferDialogUI.launchBufferDialog(config);
    }
  }
};
