goog.provide('os.ui.menu.layer');

goog.require('goog.Timer');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('os.action.EventType');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.command.FlyToExtent');
goog.require('os.data.DataManager');
goog.require('os.data.FileDescriptor');
goog.require('os.fn');
goog.require('os.layer.ILayer');
goog.require('os.metrics.keys');
goog.require('os.ui.ex.ExportUI');
goog.require('os.ui.featureListDirective');
goog.require('os.ui.layer.EllipseColumnsUI');
goog.require('os.ui.layer.compare.LayerCompareUI');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.menu.common');
goog.require('os.ui.window');
goog.require('os.ui.window.ConfirmTextUI');
goog.require('os.ui.window.ConfirmUI');



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
        label: 'Save',
        eventType: os.action.EventType.SAVE_LAYER,
        tooltip: 'Saves the changes to the layer',
        icons: ['<i class="fa fa-fw fa-save"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onSave_,
        metricKey: os.metrics.keys.Layer.SAVE,
        sort: -10010 // we want this to appear at the top when its available
      }, {
        label: 'Save As...',
        eventType: os.action.EventType.SAVE_LAYER_AS,
        tooltip: 'Saves the changes to the layer to a new layer',
        icons: ['<i class="fa fa-fw fa-save"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onSaveAs_,
        metricKey: os.metrics.keys.Layer.SAVE_AS,
        sort: -10000 // we want this to appear right below save
      }, {
        label: 'Compare Layers',
        tooltip: 'Compare two layers side-by-side',
        icons: ['<i class="fas fa-fw fa-layer-group"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfCanCompare,
        handler: os.ui.menu.layer.handleCompareLayers
      }, {
        label: 'Go To',
        eventType: os.action.EventType.GOTO,
        tooltip: 'Repositions the map to show the layer',
        icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onGoTo_,
        metricKey: os.metrics.keys.Layer.GO_TO,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      }, {
        label: 'Identify',
        eventType: os.action.EventType.IDENTIFY,
        tooltip: 'Identifies a layer on the map',
        icons: ['<i class="fa fa-fw fa-eye"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onIdentify_,
        metricKey: os.metrics.keys.Layer.IDENTIFY,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Clear Selection',
        eventType: os.action.EventType.CLEAR_SELECTION,
        tooltip: 'Clears the selection for the layer',
        icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.keys.Layer.CLEAR_SELECTION,
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
        metricKey: os.metrics.keys.Layer.MOST_RECENT,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Refresh',
        eventType: os.action.EventType.REFRESH,
        tooltip: 'Refreshes the layer',
        icons: ['<i class="fa fa-fw fa-refresh"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.keys.Layer.REFRESH,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Clear Auto/Manual Color',
        eventType: os.action.EventType.RESET_COLOR,
        tooltip: 'Clears auto/manual coloring rules, resetting all features to the layer color',
        icons: ['<i class="fa fa-fw fa-tint"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.keys.Layer.RESET_COLOR,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Lock',
        eventType: os.action.EventType.LOCK,
        tooltip: 'Lock the layer to prevent data from changing',
        icons: ['<i class="fa fa-fw fa-lock"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.keys.Layer.LOCK,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Unlock',
        eventType: os.action.EventType.UNLOCK,
        tooltip: 'Unlock the layer and refresh its data',
        icons: ['<i class="fa fa-fw fa-unlock-alt"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.keys.Layer.UNLOCK,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Remove',
        eventType: os.action.EventType.REMOVE_LAYER,
        tooltip: 'Removes the layer',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.keys.Layer.REMOVE,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Rename',
        eventType: os.action.EventType.RENAME,
        tooltip: 'Rename the layer',
        icons: ['<i class="fa fa-fw fa-i-cursor"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onLayerMenuEvent,
        metricKey: os.metrics.keys.Layer.RENAME,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Show Description',
        eventType: os.action.EventType.SHOW_DESCRIPTION,
        tooltip: 'Gives details about the layer',
        icons: ['<i class="fa fa-fw fa-newspaper-o"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onDescription_,
        metricKey: os.metrics.keys.Layer.SHOW_DESCRIPTION,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Show Features',
        eventType: os.action.EventType.FEATURE_LIST,
        tooltip: 'Displays features in the layer',
        icons: ['<i class="fa fa-fw fa-table"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onFeatureList_,
        metricKey: os.metrics.keys.Layer.FEATURE_LIST,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      },
      {
        label: 'Layer Mappings...',
        eventType: os.action.EventType.LAYER_SETTINGS,
        tooltip: 'Add Custom Mappings to the Layer',
        icons: ['<i class="fa fa-cog"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onMappings_,
        sort: os.ui.menu.layer.GroupSort.LAYER++
      }]
    }, {
      label: os.ui.menu.layer.GroupLabel.TOOLS,
      type: os.ui.menu.MenuItemType.GROUP,
      sort: os.ui.menu.layer.GroupSort.GROUPS++,
      children: [{
        label: 'Export...',
        eventType: os.action.EventType.EXPORT,
        tooltip: 'Exports data from this layer',
        icons: ['<i class="fa fa-fw fa-download"></i>'],
        beforeRender: os.ui.menu.layer.visibleIfSupported,
        handler: os.ui.menu.layer.onExport_,
        metricKey: os.metrics.keys.Layer.EXPORT,
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
 *
 * @param {os.ui.menu.layer.Context} context The event context.
 * @return {!Array<!os.layer.ILayer>}
 */
os.ui.menu.layer.getLayersFromContext = function(context) {
  return os.fn.nodesToLayers(context);
};


/**
 * Show a menu item if layers in the context support it.
 *
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
 *
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
 *
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onDescription_ = function(event) {
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  var msg = '';
  for (var i = 0; i < layers.length; i++) {
    var descrip = os.data.DataManager.getInstance().getDescriptor(layers[i].getId());
    if (descrip) {
      msg += descrip.getHtmlDescription();
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

  var windowOptions = /** @type {!osx.window.WindowOptions} */ ({
    label: 'Layer Description',
    icon: 'fa fa-newspaper-o',
    x: 'center',
    y: 'center',
    width: 600,
    height: 'auto',
    modal: false,
    showClose: true
  });

  var confirmOptions = /** @type {!osx.window.ConfirmOptions} */ ({
    prompt: msg,
    yesText: 'Close',
    yesIcon: 'fa fa-times',
    yesButtonClass: 'btn-secondary',
    noText: '',
    windowOptions: windowOptions
  });

  os.ui.window.ConfirmUI.launchConfirm(confirmOptions);
};


/**
 * Handle the "Save" menu event.
 *
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onSave_ = function(event) {
  var context = event.getContext();
  if (context) {
    const sources = os.ui.menu.common.getSourcesFromContext(context);

    if (sources && sources.length == 1) {
      let exporter = os.ui.file.ExportManager.getInstance().getExportMethods()[1];
      const source = sources[0];
      const layerName = source.getTitle(true);
      const descriptor = os.data.DataManager.getInstance().getDescriptor(source.getId());

      if (descriptor instanceof os.data.FileDescriptor) {
        exporter = descriptor.getExporter();
      }

      const options = /** @type {os.ex.ExportOptions} */ ({
        items: source.getFeatures(),
        sources: [source],
        fields: os.source.getExportFields(source, false, exporter.supportsTime()),
        title: layerName,
        keepTitle: true,
        createDescriptor: !(descriptor instanceof os.data.FileDescriptor),
        exporter
      });

      os.ui.file.ExportManager.getInstance().exportItems(options);
      source.setHasModifications(false);

      const msg = `${layerName} changes saved successfully.`;
      os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);
    }
  }
};


/**
 * Handle the "Save As" menu event.
 *
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onSaveAs_ = function(event) {
  var context = event.getContext();
  if (context) {
    const sources = os.ui.menu.common.getSourcesFromContext(context);
    if (sources && sources.length == 1) {
      const source = sources[0];
      const layerName = source.getTitle(true);
      const exporter = os.ui.file.ExportManager.getInstance().getExportMethods()[1];

      const options = /** @type {os.ex.ExportOptions} */ ({
        items: source.getFeatures(),
        sources: [source],
        fields: os.source.getExportFields(source, false, exporter.supportsTime()),
        title: layerName,
        exporter
      });

      const confirmOptions = /** @type {!osx.window.ConfirmTextOptions} */ ({
        confirm: os.ui.menu.layer.confirmSaveAs_.bind(undefined, options),
        defaultValue: layerName,
        prompt: 'Please choose a name for the new layer:',
        windowOptions: /** @type {!osx.window.WindowOptions} */ ({
          icon: 'fa fa-save-o',
          label: `Save ${layerName} As`
        })
      });

      os.ui.window.ConfirmTextUI.launchConfirmText(confirmOptions);
    }
  }
};


/**
 * Handles confirming the save as dialog.
 * @param {os.ex.ExportOptions} options The folder options.
 * @param {string} title The chosen folder title.
 */
os.ui.menu.layer.confirmSaveAs_ = function(options, title) {
  options.title = title;
  options.keepTitle = true;
  options.createDescriptor = true;

  os.ui.file.ExportManager.getInstance().exportItems(options);

  const source = options.sources[0];
  source.setHasModifications(false);

  const msg = `${title} changes saved successfully.`;
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.SUCCESS);
};


/**
 * Handle the "Export" menu event.
 *
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onExport_ = function(event) {
  var context = event.getContext();
  if (context) {
    os.ui.ex.ExportUI.startExport(os.ui.menu.common.getSourcesFromContext(context));
  }
};


/**
 * Launches the window to configure layer mappings (for now only ellipse mappings)
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onMappings_ = function(event) {
  const context = event.getContext();
  const layers = os.ui.menu.layer.getLayersFromContext(context);
  const layer = layers ? layers[0] : null;

  os.ui.layer.EllipseColumnsUI.launchConfigureWindow(layer);
};


/**
 * Handle the "Feature List" menu event.
 *
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onFeatureList_ = function(event) {
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  if (layers) {
    layers.forEach(function(layer) {
      var source = layer.getSource();
      if (source instanceof os.source.Vector) {
        os.ui.launchFeatureList(source);
      }
    });
  }
};


/**
 * Handle the "Go To" menu event.
 *
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onGoTo_ = function(event) {
  // aggregate the features and execute os.feature.flyTo, in case they have altitude and pure extent wont cut it
  const layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  const features = layers.reduce((feats, layer) => {
    let source = layer.getSource();
    if (source instanceof ol.source.Vector) {
      source = /** @type {ol.source.Vector} */ (source);
      const newFeats = source.getFeatures();
      return newFeats.length > 0 ? feats.concat(newFeats) : feats;
    }
    return feats;
  }, []);

  if (features && features.length) {
    os.feature.flyTo(features);
  } else {
    var extent = os.ui.menu.layer.getLayersFromContext(event.getContext())
        .reduce(os.fn.reduceExtentFromLayers, ol.extent.createEmpty());

    if (!ol.extent.isEmpty(extent)) {
      os.commandStack.addCommand(new os.command.FlyToExtent(extent));
    }
  }
};


/**
 * Handle the "Identify" menu event.
 *
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
os.ui.menu.layer.onIdentify_ = function(event) {
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  var oldTimelineFeaturesMap = {};

  // ignore base map and tile layers, we don't want to remove and re-add these during identify
  var visibleVectorLayers = os.MapContainer.getInstance().getLayers().filter(function(e) {
    // leave the basemaps on, it's slow and ugly to hide during an identify
    if (/** @type {os.layer.ILayer} */ (e).getOSType() === 'Map Layers') {
      return false;
    } else if (!ol.array.includes(layers, e)) {
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


/**
 * Enables the option when two layers are selected.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.menu.layer.visibleIfCanCompare = function(context) {
  const layers = os.ui.menu.layer.getLayersFromContext(context);
  this.visible = !!layers && layers.length === 2;
};


/**
 * Extract the feature from an event and launch the external link.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 */
os.ui.menu.layer.handleCompareLayers = function(event) {
  var layers = os.ui.menu.layer.getLayersFromContext(event.getContext());
  if (layers && layers.length === 2) {
    os.ui.layer.compare.LayerCompareUI.launchLayerCompare({
      left: [layers[0]],
      right: [layers[1]]
    });
  }
};
