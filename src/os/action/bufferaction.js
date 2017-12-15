goog.provide('os.action.buffer');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.action.common');
goog.require('os.action.layer');
goog.require('os.buffer');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.menu.map');
goog.require('os.ui.menu.spatial');


/**
 * Set up buffer region listeners.
 */
os.action.buffer.setup = function() {
  os.action.buffer.layerSetup();
  os.action.buffer.mapSetup();
  os.action.buffer.spatialSetup();
};


/**
 * Clean up buffer region listeners.
 */
os.action.buffer.dispose = function() {
  os.action.buffer.layerDispose();
  os.action.buffer.mapDispose();
  os.action.buffer.spatialDispose();
};


/**
 * Set up buffer region listeners in the layers window.
 */
os.action.buffer.layerSetup = function() {
  if (!os.action.layer.manager) {
    os.action.layer.setup();
  }

  var manager = os.action.layer.manager;
  if (!manager.getAction(os.action.EventType.BUFFER)) {
    var buffer = new os.ui.action.Action(os.action.EventType.BUFFER,
        'Create Buffer Region...', 'Create buffer regions around loaded data', os.buffer.ICON, null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.TOOLS),
        os.metrics.Layer.CREATE_BUFFER);
    buffer.enableWhen(os.action.layer.isLayerActionSupported.bind(buffer, os.action.EventType.BUFFER));
    manager.addAction(buffer);
    manager.listen(os.action.EventType.BUFFER, os.action.buffer.handleLayerBufferEvent);
  }
};


/**
 * Clean up buffer region listeners in the layers window.
 */
os.action.buffer.layerDispose = function() {
  if (os.action && os.action.layer && os.action.layer.manager) {
    os.action.layer.manager.removeAction(os.action.EventType.BUFFER);
    os.action.layer.manager.unlisten(os.action.EventType.BUFFER, os.action.buffer.handleLayerBufferEvent);
  }
};


/**
 * Set up buffer region listeners on the map.
 */
os.action.buffer.mapSetup = function() {
  var menu = os.ui.menu.MAP;
  if (menu && !menu.getRoot().find(os.action.EventType.BUFFER)) {
    var group = menu.getRoot().find('Coordinate');
    goog.asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: 'Create Buffer Region...',
      eventType: os.action.EventType.BUFFER,
      tooltip: 'Create a buffer region around the clicked coordinate',
      icons: ['<i class="fa fa-fw ' + os.buffer.ICON + '"></i>'],
      handler: os.action.buffer.handleCoordinateBufferEvent
    });
  }
};


/**
 * Clean up buffer region listeners on the map.
 */
os.action.buffer.mapDispose = function() {
  var menu = os.ui.menu.MAP;
  if (menu) {
    var group = menu.getRoot().find('Coordinate');
    group.removeChild(os.action.EventType.BUFFER);
  }
};


/**
 * Set up buffer region listeners on the map.
 */
os.action.buffer.spatialSetup = function() {
  var menu = os.ui.menu.SPATIAL;
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(os.ui.menu.spatial.Group.TOOLS);
    goog.asserts.assert(group, 'Group "' + os.ui.menu.spatial.Group.TOOLS + '" should exist! Check spelling?');

    group.addChild({
      eventType: os.action.EventType.BUFFER,
      label: 'Create Buffer Region...',
      tooltip: 'Create a buffer region from the feature(s)',
      icons: ['<i class="fa fa-fw ' + os.buffer.ICON + '"></i>'],
      beforeRender: os.action.buffer.visibleIfCanBuffer,
      handler: os.action.buffer.handleSpatialBufferEvent
    });
  }
};


/**
 * Clean up buffer region listeners on the spatial.
 */
os.action.buffer.spatialDispose = function() {
  var menu = os.ui.menu.SPATIAL;
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(os.ui.menu.spatial.Group.TOOLS);
    if (group) {
      group.removeChild(os.action.EventType.BUFFER);
    }
  }
};


/**
 * Enables the option when a feature exists in the args.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.action.buffer.visibleIfCanBuffer = function(context) {
  // polygonal geometries are generally drawn as areas, so don't clutter the menu with the buffer option
  var visible = false;

  var features = os.ui.menu.spatial.getFeaturesFromContext(context);
  if (features.length > 0) {
    // feature is on the map, buffer it
    visible = true;
  } else {
    var geometries = os.ui.menu.spatial.getGeometriesFromContext(context);
    if (geometries.length === 1 && !os.geo.isGeometryPolygonal(geometries[0])) {
      // drawing a non-polygonal geometry, buffer it
      visible = true;
    }
  }

  this.visible = visible;
};


/**
 * @param {os.ui.menu.MenuEvent<ol.Coordinate>} event
 */
os.action.buffer.handleCoordinateBufferEvent = function(event) {
  event.preventDefault();

  os.buffer.launchDialog({
    'features': [new ol.Feature(new ol.geom.Point(event.getContext()))]
  });
};


/**
 * Handle buffer region events.
 * @param {!os.ui.action.ActionEvent} event The event.
 */
os.action.buffer.handleLayerBufferEvent = function(event) {
  var context = event.getContext();
  if (context && event instanceof goog.events.Event && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    context = /** @type {Object} */ (context);

    // only use the first source unless we ever support multiple in the picker
    var sources = os.action.common.getSourcesFromContext(context);
    os.buffer.launchDialog({
      'sources': sources && sources.length > 0 ? [sources[0]] : []
    });
  }
};


/**
 * Handle buffer events from the spatial menu.
 * @param {!os.ui.menu.MenuEvent} event The event.
 */
os.action.buffer.handleSpatialBufferEvent = function(event) {
  var context = event.getContext();
  if (context && event instanceof goog.events.Event && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    context = /** @type {Object} */ (context);

    // first check if there are features to buffer
    var features = os.ui.menu.spatial.getFeaturesFromContext(context);
    if (!features.length) {
      // check if there are geometries that can be used instead
      features = os.ui.menu.spatial.getGeometriesFromContext(context).map(function(geometry) {
        return new ol.Feature(geometry);
      });
    }

    if (features.length) {
      // create a buffer around an area/polygon
      var config = {
        'features': features
      };

      var am = os.query.AreaManager.getInstance();
      if (am.contains(features[0])) {
        // if the feature is an area, grab the title from it
        var title = /** @type {string} */ (features[0].get('title'));
        if (title) {
          config['title'] = goog.string.toTitleCase(title) + ' Buffer';
        }
      }

      os.buffer.launchDialog(config);
    }
  }
};
