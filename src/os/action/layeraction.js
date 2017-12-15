goog.provide('os.action.layer');

goog.require('goog.Timer');
goog.require('goog.date.UtcDateTime');
goog.require('ol.extent');
goog.require('os.action.EventType');
goog.require('os.action.common');
goog.require('os.action.export');
goog.require('os.command.FlyToExtent');
goog.require('os.fn');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.ex.ExportDirective');


/**
 * @type {os.ui.action.ActionManager}
 */
os.action.layer.manager = null;


/**
 * Default groups in the layer menu.
 * @enum {string}
 */
os.action.layer.GroupType = {
  LAYER: '0:Layer',
  TOOLS: '1:Tools'
};


/**
 * Prefix used on layer events.
 * @type {string}
 * @const
 */
os.action.layer.PREFIX = 'layer:';


/**
 * RegExp to remove prefix used on layer events.
 * @type {RegExp}
 * @const
 */
os.action.layer.PREFIX_REGEXP = new RegExp('^' + os.action.layer.PREFIX);


/**
 * Sets up layer actions
 */
os.action.layer.setup = function() {
  if (!os.action.layer.manager) {
    os.action.layer.manager = new os.ui.action.ActionManager();
  }

  var manager = os.action.layer.manager;

  if (!manager.getAction(os.action.EventType.GOTO)) {
    var goTo = new os.ui.action.Action(os.action.EventType.GOTO,
        'Go To', 'Repositions the map to show the layer', 'fa-fighter-jet', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.GO_TO);
    goTo.enableWhen(os.action.layer.isLayerActionSupported.bind(goTo, os.action.EventType.GOTO));
    manager.addAction(goTo);

    var identify = new os.ui.action.Action(os.action.EventType.IDENTIFY,
        'Identify', 'Identifies a layer on the map', 'fa-eye', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.IDENTIFY);
    identify.enableWhen(os.action.layer.isLayerActionSupported.bind(identify, os.action.EventType.IDENTIFY));
    manager.addAction(identify);

    var clearSelection = new os.ui.action.Action(os.action.EventType.CLEAR_SELECTION,
        'Clear Selection', 'Clears the selection for the layer', 'fa-times-circle', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.CLEAR_SELECTION);
    clearSelection.enableWhen(goog.bind(os.action.layer.isLayerActionSupported,
        clearSelection, os.action.EventType.CLEAR_SELECTION));
    manager.addAction(clearSelection);

    var disableTime = new os.ui.action.Action(os.action.EventType.DISABLE_TIME,
        'Remove From Timeline', 'Disables layer animation when the timeline is open', 'fa-clock-o', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER));
    disableTime.enableWhen(os.action.layer.isLayerActionSupported.bind(disableTime,
        os.action.EventType.DISABLE_TIME));
    manager.addAction(disableTime);

    var enableTime = new os.ui.action.Action(os.action.EventType.ENABLE_TIME,
        'Add to Timeline', 'Enables layer animation when the timeline is open', 'fa-clock-o', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER));
    enableTime.enableWhen(os.action.layer.isLayerActionSupported.bind(enableTime,
        os.action.EventType.ENABLE_TIME));
    manager.addAction(enableTime);

    var mostRecent = new os.ui.action.Action(os.action.EventType.MOST_RECENT,
        'Most Recent', 'Adjusts application time to show the most recent data for the layer', 'fa-fast-forward', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.MOST_RECENT);
    mostRecent.enableWhen(os.action.layer.isLayerActionSupported.bind(mostRecent,
        os.action.EventType.MOST_RECENT));
    manager.addAction(mostRecent);

    var refresh = new os.ui.action.Action(os.action.EventType.REFRESH,
        'Refresh', 'Refreshes the layer', 'fa-refresh', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.REFRESH);
    refresh.enableWhen(os.action.layer.isLayerActionSupported.bind(refresh, os.action.EventType.REFRESH));
    manager.addAction(refresh);

    var clearColorModel = new os.ui.action.Action(os.action.EventType.RESET_COLOR,
        'Clear Auto/Manual Color', 'Clears auto/manual coloring rules, resetting all features to the layer color',
        'fa-tint', null, new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.RESET_COLOR);
    clearColorModel.enableWhen(os.action.layer.isLayerActionSupported.bind(clearColorModel,
        os.action.EventType.RESET_COLOR));
    manager.addAction(clearColorModel);

    var lock = new os.ui.action.Action(os.action.EventType.LOCK,
        'Lock', 'Lock the layer to prevent data from changing', 'fa-lock', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.LOCK);
    lock.enableWhen(os.action.layer.isLayerActionSupported.bind(lock, os.action.EventType.LOCK));
    manager.addAction(lock);

    var unlock = new os.ui.action.Action(os.action.EventType.UNLOCK,
        'Unlock', 'Unlock the layer and refresh its data', 'fa-unlock-alt', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.UNLOCK);
    unlock.enableWhen(os.action.layer.isLayerActionSupported.bind(unlock, os.action.EventType.UNLOCK));
    manager.addAction(unlock);

    var remove = new os.ui.action.Action(os.action.EventType.REMOVE_LAYER,
        'Remove', 'Removes the layer', 'fa-times', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.REMOVE);
    remove.enableWhen(os.action.layer.isLayerActionSupported.bind(remove, os.action.EventType.REMOVE_LAYER));
    manager.addAction(remove);

    var rename = new os.ui.action.Action(os.action.EventType.RENAME,
        'Rename', 'Rename the layer', 'fa-i-cursor', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.RENAME);
    rename.enableWhen(os.action.layer.isLayerActionSupported.bind(rename, os.action.EventType.RENAME));
    manager.addAction(rename);

    var showDescription = new os.ui.action.Action(os.action.EventType.SHOW_DESCRIPTION,
        'Show Description', 'Gives details about the layer', 'fa-newspaper-o', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.LAYER),
        os.metrics.Layer.SHOW_DESCRIPTION);
    showDescription.enableWhen(os.action.layer.isLayerActionSupported.bind(showDescription,
        os.action.EventType.SHOW_DESCRIPTION));
    manager.addAction(showDescription);

    var exportData = new os.ui.action.Action(os.action.EventType.EXPORT,
        'Export...', 'Exports data to a file', 'fa-download', null,
        new os.ui.action.MenuOptions(null, os.action.layer.GroupType.TOOLS),
        os.metrics.Layer.EXPORT);
    exportData.enableWhen(os.action.layer.isLayerActionSupported.bind(exportData,
        os.action.EventType.EXPORT));
    manager.addAction(exportData);

    manager.listen(os.action.EventType.GOTO, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.CLEAR_SELECTION, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.DISABLE_TIME, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.ENABLE_TIME, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.EXPORT, os.action.layer.onToolsEvent_);
    manager.listen(os.action.EventType.IDENTIFY, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.LOCK, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.MOST_RECENT, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.REFRESH, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.REMOVE_LAYER, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.RENAME, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.RESET_COLOR, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.SHOW_DESCRIPTION, os.action.layer.onLayerActionEvent);
    manager.listen(os.action.EventType.UNLOCK, os.action.layer.onLayerActionEvent);
  }
};


/**
 * Disposes layer actions
 */
os.action.layer.dispose = function() {
  if (os.action.layer.manager) {
    os.action.layer.manager.dispose();
    os.action.layer.manager = null;
  }
};


/**
 * Get the layer from an action event context.
 * @param {*} context The event context.
 * @return {!Array<!os.layer.ILayer>}
 */
os.action.layer.getLayersFromContext = function(context) {
  return os.fn.nodesToLayers(/** @type {?(Array<?os.data.LayerNode>|os.data.LayerNode)} */ (context || null));
};


/**
 * Test if a layer action is supported by every item in the action arguments.
 * @param {string} type The action type.
 * @param {*=} opt_actionArgs The action arguments.
 * @return {boolean}
 */
os.action.layer.isLayerActionSupported = function(type, opt_actionArgs) {
  var actionArgs = opt_actionArgs || null;
  if (actionArgs && actionArgs.length > 0) {
    var layers = os.action.layer.getLayersFromContext(actionArgs);

    // test that all action args contain a layer that supports the given action type
    return layers.length == actionArgs.length && layers.every(function(layer) {
      return layer.supportsAction(type, actionArgs);
    });
  }

  return false;
};


/**
 * @param {!Array<!os.layer.ILayer>} layers The layers to go to
 * @private
 */
os.action.layer.goTo_ = function(layers) {
  var extent = layers.reduce(os.fn.reduceExtentFromLayers, ol.extent.createEmpty());

  if (!ol.extent.isEmpty(extent)) {
    os.commandStack.addCommand(new os.command.FlyToExtent(extent));
  }
};


/**
 * @param {!Array<!os.layer.ILayer>} layers The layers to show descriptions for
 * @private
 */
os.action.layer.showDescription_ = function(layers) {
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
 * @param {os.ui.action.ActionEvent} event
 */
os.action.layer.onLayerActionEvent = function(event) {
  var context = event.getContext();
  if (context && context.length > 0) {
    var visibleVectorLayers = os.MapContainer.getInstance().getLayers();
    var oldTimelineFeaturesMap = {};

    // queue layers that the action will be run on
    var actionLayers = os.action.layer.getLayersFromContext(context);

    if (event.type == os.action.EventType.GOTO) {
      os.action.layer.goTo_(actionLayers);
      return;
    }

    if (event.type == os.action.EventType.SHOW_DESCRIPTION) {
      os.action.layer.showDescription_(actionLayers);
      return;
    }

    // hide other layers/features during an identify
    if (event.type == os.action.EventType.IDENTIFY) {
      // ignore base map and tile layers, we don't want to remove and re-add these during identify
      visibleVectorLayers = visibleVectorLayers.filter(function(e) {
        // leave the basemaps on, it's slow and ugly to hide during an identify
        if (e instanceof plugin.basemap.layer.BaseMap) {
          return false;
        } else if (!goog.array.contains(actionLayers, e)) {
          return (e.getVisible() || /** @type {os.layer.ILayer} */ (e).getLayerVisible());
        }
      });

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
    }

    // call the action requested for each selected layer
    for (var i = 0, n = actionLayers.length; i < n; i++) {
      var layer = actionLayers[i];
      layer.callAction(event.type);
    }

    // unhide the layers/features post identify
    if (event.type == os.action.EventType.IDENTIFY) {
      // the identify logic uses 250 ms timer ticks and runs for > 5 ticks, so wait at least for 1500 ms
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
    }
  }
};


/**
 * @param {os.ui.action.ActionEvent} event
 * @private
 */
os.action.layer.onToolsEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length > 0) {
    event.preventDefault();
    event.stopPropagation();

    switch (event.type) {
      case os.action.EventType.EXPORT:
        os.action.export.startExport(os.action.common.getSourcesFromContext(context));
        break;
      default:
        break;
    }
  }
};
