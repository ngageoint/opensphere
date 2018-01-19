goog.provide('os.ui.menu.buffer');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.action.EventType');
goog.require('os.buffer');
goog.require('os.ui.menu.common');
goog.require('os.ui.menu.layer');
goog.require('os.ui.menu.map');
goog.require('os.ui.menu.spatial');


/**
 * Set up buffer region listeners.
 */
os.ui.menu.buffer.setup = function() {
  os.ui.menu.buffer.layerSetup();
  os.ui.menu.buffer.mapSetup();
  os.ui.menu.buffer.spatialSetup();
};


/**
 * Clean up buffer region listeners.
 */
os.ui.menu.buffer.dispose = function() {
  os.ui.menu.buffer.layerDispose();
  os.ui.menu.buffer.mapDispose();
  os.ui.menu.buffer.spatialDispose();
};


/**
 * Set up buffer region listeners in the layers window.
 */
os.ui.menu.buffer.layerSetup = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu && !menu.getRoot().find(os.action.EventType.BUFFER)) {
    var group = menu.getRoot().find(os.ui.menu.layer.GroupLabel.TOOLS);
    goog.asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: 'Create Buffer Region...',
      eventType: os.action.EventType.BUFFER,
      tooltip: 'Create buffer regions around loaded data',
      icons: ['<i class="fa fa-fw ' + os.buffer.ICON + '"></i>'],
      beforeRender: os.ui.menu.layer.visibleIfSupported,
      handler: os.ui.menu.buffer.handleLayerBufferEvent,
      metricKey: os.metrics.Layer.CREATE_BUFFER
    });
  }
};


/**
 * Clean up buffer region listeners in the layers window.
 */
os.ui.menu.buffer.layerDispose = function() {
  var menu = os.ui.menu.layer.MENU;
  var group = menu ? menu.getRoot().find(os.ui.menu.layer.GroupLabel.TOOLS) : undefined;
  if (group) {
    group.removeChild(os.action.EventType.BUFFER);
  }
};


/**
 * Set up buffer region listeners on the map.
 */
os.ui.menu.buffer.mapSetup = function() {
  var menu = os.ui.menu.MAP;
  if (menu && !menu.getRoot().find(os.action.EventType.BUFFER)) {
    var group = menu.getRoot().find('Coordinate');
    goog.asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: 'Create Buffer Region...',
      eventType: os.action.EventType.BUFFER,
      tooltip: 'Create a buffer region around the clicked coordinate',
      icons: ['<i class="fa fa-fw ' + os.buffer.ICON + '"></i>'],
      handler: os.ui.menu.buffer.handleCoordinateBufferEvent
    });
  }
};


/**
 * Clean up buffer region listeners on the map.
 */
os.ui.menu.buffer.mapDispose = function() {
  var menu = os.ui.menu.MAP;
  if (menu) {
    var group = menu.getRoot().find('Coordinate');
    if (group) {
      group.removeChild(os.action.EventType.BUFFER);
    }
  }
};


/**
 * Set up buffer region listeners on the map.
 */
os.ui.menu.buffer.spatialSetup = function() {
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
      beforeRender: os.ui.menu.buffer.visibleIfCanBuffer,
      handler: os.ui.menu.buffer.handleSpatialBufferEvent
    });
  }
};


/**
 * Clean up buffer region listeners on the spatial.
 */
os.ui.menu.buffer.spatialDispose = function() {
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
os.ui.menu.buffer.visibleIfCanBuffer = function(context) {
  // polygonal geometries are generally drawn as areas, so don't clutter the menu with the buffer option
  this.visible = false;

  var features = os.ui.menu.spatial.getFeaturesFromContext(context);
  if (features.length > 0) {
    // feature is on the map, buffer it
    this.visible = true;
  } else {
    var geometries = os.ui.menu.spatial.getGeometriesFromContext(context);
    if (geometries.length === 1 && !os.geo.isGeometryPolygonal(geometries[0])) {
      // drawing a non-polygonal geometry, buffer it
      this.visible = true;
    }
  }
};


/**
 * Handle buffer event from the map menu.
 * @param {!os.ui.menu.MenuEvent<ol.Coordinate>} event
 */
os.ui.menu.buffer.handleCoordinateBufferEvent = function(event) {
  event.preventDefault();

  os.buffer.launchDialog({
    'features': [new ol.Feature(new ol.geom.Point(event.getContext()))]
  });
};


/**
 * Handle buffer event from the layer menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 */
os.ui.menu.buffer.handleLayerBufferEvent = function(event) {
  var context = event.getContext();
  if (context && event instanceof goog.events.Event && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    // only use the first source unless we ever support multiple in the picker
    var sources = os.ui.menu.common.getSourcesFromContext(context);
    os.buffer.launchDialog({
      'sources': sources && sources.length > 0 ? [sources[0]] : []
    });
  }
};


/**
 * Handle buffer event from the spatial menu.
 * @param {!os.ui.menu.MenuEvent} event The event.
 */
os.ui.menu.buffer.handleSpatialBufferEvent = function(event) {
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
