goog.provide('os.ui.menu.layer');

goog.require('goog.Timer');
goog.require('goog.date.UtcDateTime');
goog.require('ol.extent');
goog.require('os.action.EventType');
goog.require('os.command.FlyToExtent');
goog.require('os.fn');
goog.require('os.metrics.keys');
goog.require('os.ui.ex.ExportDirective');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.menu.common');
goog.require('os.ui.window');


/**
 * @typedef {!Array<!os.structs.ITreeNode>}
 */
os.ui.menu.layer.Context;


/**
 * @type {os.ui.menu.Menu<os.ui.menu.layer.Context>|undefined}
 */
os.ui.menu.layer.MENU = undefined;


/**
 * Group labels for the layer menu.
 * @enum {string}
 */
os.ui.menu.layer.GroupLabel = {
  LAYER: 'Layer',
  TOOLS: 'Tools'
};


/**
 * Last sort value used for each layer menu group.
 * @enum {number}
 */
os.ui.menu.layer.GroupSort = {
  GROUPS: 0,
  LAYER: 0,
  TOOLS: 0
};


/**
 * Set up the layer menu.
 */
os.ui.menu.layer.setup = function() {
  if (os.ui.menu.layer.MENU) {
    // already created
    return;
  }

  os.ui.menu.layer.MENU = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: [{
      label: os.ui.menu.layer.GroupLabel.LAYER,
      type: os.ui.menu.MenuItemType.GROUP,
      sort: os.ui.menu.layer.GroupSort.GROUPS++,
      children: [{
        label: 'Go To',
        eventType: os.action.EventType.GOTO,
        tooltip: 'Repositions the map to show the layer',
        icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onGoTo_,
        metricKey: os.metrics.Layer.GO_TO,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      }, {
        label: 'Identify',
        eventType: os.action.EventType.IDENTIFY,
        tooltip: 'Identifies a layer on the map',
        icons: ['<i class="fa fa-fw fa-eye"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onIdentify_,
        metricKey: os.metrics.Layer.IDENTIFY,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Clear Selection',
        eventType: os.action.EventType.CLEAR_SELECTION,
        tooltip: 'Clears the selection for the layer',
        icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.Layer.CLEAR_SELECTION,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Add to Timeline',
        eventType: os.action.EventType.ENABLE_TIME,
        tooltip: 'Enables layer animation when the timeline is open',
        icons: ['<i class="fa fa-fw fa-clock-o"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Remove From Timeline',
        eventType: os.action.EventType.DISABLE_TIME,
        tooltip: 'Disables layer animation when the timeline is open',
        icons: ['<i class="fa fa-fw fa-clock-o"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Most Recent',
        eventType: os.action.EventType.MOST_RECENT,
        tooltip: 'Adjusts application time to show the most recent data for the layer',
        icons: ['<i class="fa fa-fw fa-fast-forward"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.Layer.MOST_RECENT,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Refresh',
        eventType: os.action.EventType.REFRESH,
        tooltip: 'Refreshes the layer',
        icons: ['<i class="fa fa-fw fa-refresh"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.Layer.REFRESH,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Clear Auto/Manual Color',
        eventType: os.action.EventType.RESET_COLOR,
        tooltip: 'Clears auto/manual coloring rules, resetting all features to the layer color',
        icons: ['<i class="fa fa-fw fa-tint"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.Layer.RESET_COLOR,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Lock',
        eventType: os.action.EventType.LOCK,
        tooltip: 'Lock the layer to prevent data from changing',
        icons: ['<i class="fa fa-fw fa-lock"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.Layer.LOCK,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Unlock',
        eventType: os.action.EventType.UNLOCK,
        tooltip: 'Unlock the layer and refresh its data',
        icons: ['<i class="fa fa-fw fa-unlock-alt"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.Layer.UNLOCK,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Remove',
        eventType: os.action.EventType.REMOVE_LAYER,
        tooltip: 'Removes the layer',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.Layer.REMOVE,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Rename',
        eventType: os.action.EventType.RENAME,
        tooltip: 'Rename the layer',
        icons: ['<i class="fa fa-fw fa-i-cursor"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.Layer.RENAME,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Show Description',
        eventType: os.action.EventType.SHOW_DESCRIPTION,
        tooltip: 'Gives details about the layer',
        icons: ['<i class="fa fa-fw fa-newspaper-o"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onDescription_,
        metricKey: os.metrics.Layer.SHOW_DESCRIPTION,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      }]
    }, {
      label: os.ui.menu.layer.GroupLabel.TOOLS,
      type: os.ui.menu.MenuItemType.GROUP,
      sort: os.ui.menu.layer.GroupSort.GROUPS++,
      children: [{
        label: 'Export...',
        eventType: os.action.EventType.EXPORT,
        tooltip: 'Repositions the map to show the layer',
        icons: ['<i class="fa fa-fw fa-download"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onExport_,
        metricKey: os.metrics.Layer.EXPORT,
        sort: -1000 // commonly used, so prioritize above other items
      }]
    }]
  }));
};


/**
 * Dispose the layer menu.
 */
os.ui.menu.layer.dispose = function() {
  goog.dispose(os.ui.menu.layer.MENU);
  os.ui.menu.layer.MENU = undefined;
};


/**
 * Get the layer from an action event context.
 * @param {os.ui.menu.layer.Context} context The event context.
 * @return {!Array<!os.layer.ILayer>}
 */
os.ui.menu.layer.getLayersFromContext = function(context) {
  return os.fn.nodesToLayers(context);
};


/**
 * Show a menu item if layers in the context support it.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.layer.visibleIfSupported = function(context) {
  this.visible = false;

  if (this.eventType && context && context.length > 0) {
    var layers = os.ui.menu.layer.getLayersFromContext(context);

    // test that all action args contain a layer that supports the given action type
    this.visible = layers.length == context.length && layers.every(function(layer) {
      return this.eventType ? layer.supportsAction(this.eventType, context) : false;
    }, this);
  }
};


/**
 * Handle layer menu events.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 */
os.ui.menu.layer.onLayerMenuEvent = function(event) {
  // call the action requested for each selected layer
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    if (layer) {
      layer.callAction(event.type);
    }
  }
};


/**
 * Handle the "Show Description" menu event.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onDescription_ = function(event) {
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  var msg = '';
  for (var i = 0; i < layers.length; i++) {
    var descrip = os.dataManager.getDescriptor(layers[i].getId());
    if (descrip) {
      msg += 'Layer Name: ' + descrip.getTitle() + '<br>';
      msg += 'Provider: ' + descrip.getProvider() + '<br>';
      var type = descrip.getType() || '';

      if (goog.string.endsWith(type, 's')) {
        type = type.substring(0, type.length - 1);
      }

      msg += 'Type: ' + type + '<br>';

      if (!isNaN(descrip.getMinDate()) && !isNaN(descrip.getMaxDate())) {
        var s = new goog.date.UtcDateTime();
        s.setTime(descrip.getMinDate());

        var e = new goog.date.UtcDateTime();
        e.setTime(descrip.getMaxDate());

        msg += 'Time: ' + s.toUTCIsoString(true, true) + ' to ' + e.toUTCIsoString(true, true) + '<br>';
      }

      msg += '<br>';

      var desc = descrip.getDescription();
      msg += (desc ? desc : 'No description provided') + '<br><br>';
      msg += 'Tags: ' + (descrip.getTags() ? descrip.getTags().join(', ') : '(none)');
      msg += '<br><br>';
      if (i < layers.length - 1) {
        msg += '<hr><br>';
      }
    } else {
      msg += 'No Description for ' + layers[i].getTitle() + '<br>';
      if (i < layers.length - 1) {
        msg += '<br><hr><br>';
      }
    }
  }

  var html =
      '<div class="window-content-wrapper">' +
          '<div class="window-content">' + msg + '</div>' +
          '<div class="window-footer">' +
              '<div class="pull-right">' +
                  '<button class="btn btn-default" ng-click="close()">' +
                  '<i class="fa fa-ban red-icon"></i> Close</button>' +
              '</div>' +
          '</div>' +
      '</div>';

  var windowOptions = {
    'id': 'layerDescription',
    'label': 'Layer Description',
    'icon': 'fa fa-newspaper-o lt-blue-icon',
    'x': 'center',
    'y': 'center',
    'width': '600',
    'height': '300',
    'min-height': 200,
    'max-height': 0,
    'show-close': true
  };

  var scopeOptions = {
    'close': function() {
      os.ui.window.close(os.ui.window.getById('layerDescription'));
    }
  };

  os.ui.window.create(windowOptions, html, undefined, undefined, undefined, scopeOptions);
};


/**
 * Handle the "Export" menu event.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onExport_ = function(event) {
  var context = event.getContext();
  if (context) {
    os.ui.ex.startExport(os.ui.menu.common.getSourcesFromContext(context));
  }
};


/**
 * Handle the "Go To" menu event.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onGoTo_ = function(event) {
  var extent = os.ui.menu.layer.getLayersFromContext(event.getContext())
      .reduce(os.fn.reduceExtentFromLayers, ol.extent.createEmpty());

  if (!ol.extent.isEmpty(extent)) {
    os.commandStack.addCommand(new os.command.FlyToExtent(extent));
  }
};


/**
 * Handle the "Identify" menu event.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onIdentify_ = function(event) {
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  var oldTimelineFeaturesMap = {};

  // ignore base map and tile layers, we don't want to remove and re-add these during identify
  var visibleVectorLayers = os.MapContainer.getInstance().getLayers().filter(function(e) {
    // leave the basemaps on, it's slow and ugly to hide during an identify
    if (e instanceof plugin.basemap.layer.BaseMap) {
      return false;
    } else if (!goog.array.contains(layers, e)) {
      return (e.getVisible() || /** @type {os.layer.ILayer} */ (e).getLayerVisible());
    }
  });

  // hide other layers/features during an identify
  for (var i = 0, n = visibleVectorLayers.length; i < n; i++) {
    var layer = /** @type {os.layer.Vector} */ (visibleVectorLayers[i]);
    var source = layer.getSource();
    var overlay = (source instanceof os.source.Vector) ? source.getAnimationOverlay() : null;
    if (overlay && !os.MapContainer.getInstance().is3DEnabled()) {
      // 2D mode w/timeline, hide individual features
      var oldFeatures = overlay.getFeatures().splice(0, overlay.getFeatures().length);
      overlay.setFeatures(null);
      oldTimelineFeaturesMap[layer.getId()] = oldFeatures;
    } else {
      // 3D mode or not using timeline
      layer.setBaseVisible(false);
    }
  }

  os.ui.menu.layer.onLayerMenuEvent(event);

  // unhide the layers/features post identify. the identify logic uses 250 ms timer ticks and runs for > 5 ticks, so
  // wait at least for 1500 ms.
  var identifyTimer = new goog.Timer(1750);
  var toggleOpacity = function() {
    for (var i = 0, n = visibleVectorLayers.length; i < n; i++) {
      var layer = /** @type {os.layer.Vector} */ (visibleVectorLayers[i]);
      var source = layer.getSource();
      var overlay = (source instanceof os.source.Vector) ? source.getAnimationOverlay() : null;
      if (overlay && !os.MapContainer.getInstance().is3DEnabled()) {
        // 2D mode w/timeline, show individual features
        overlay.setFeatures(oldTimelineFeaturesMap[layer.getId()]);
      } else {
        // 3D mode or not using timeline
        layer.setBaseVisible(true);
      }
    }
    identifyTimer.dispose();
  };

  identifyTimer.listen(goog.Timer.TICK, toggleOpacity);
  identifyTimer.start();
};
