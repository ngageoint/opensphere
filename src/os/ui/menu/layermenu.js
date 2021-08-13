goog.module('os.ui.menu.layer');
goog.module.declareLegacyNamespace();

const Timer = goog.require('goog.Timer');
const googDispose = goog.require('goog.dispose');
const {createEmpty, isEmpty} = goog.require('ol.extent');
const OLVectorSource = goog.require('ol.source.Vector');
const EventType = goog.require('os.action.EventType');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const FlyToExtent = goog.require('os.command.FlyToExtent');
const DataManager = goog.require('os.data.DataManager');
const FileDescriptor = goog.require('os.data.FileDescriptor');
const {flyTo} = goog.require('os.feature');
const {nodesToLayers, reduceExtentFromLayers} = goog.require('os.fn');
const {getMapContainer} = goog.require('os.map.instance');
const {Layer: LayerKeys} = goog.require('os.metrics.keys');
const {getExportFields} = goog.require('os.source');
const VectorSource = goog.require('os.source.Vector');
const {launchFeatureList} = goog.require('os.ui.FeatureListUI');
const ExportUI = goog.require('os.ui.ex.ExportUI');
const ExportManager = goog.require('os.ui.file.ExportManager');
const EllipseColumnsUI = goog.require('os.ui.layer.EllipseColumnsUI');
const LayerCompareUI = goog.require('os.ui.layer.compare.LayerCompareUI');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const {getSourcesFromContext} = goog.require('os.ui.menu.common');
const ConfirmTextUI = goog.require('os.ui.window.ConfirmTextUI');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');

const ExportOptions = goog.requireType('os.ex.ExportOptions');
const ILayer = goog.requireType('os.layer.ILayer');
const VectorLayer = goog.requireType('os.layer.Vector');
const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const SlickTreeNode = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * @typedef {!Array<!SlickTreeNode>}
 */
let Context;

/**
 * @type {Menu<Context>|undefined}
 */
let MENU = undefined;

/**
 * Group labels for the layer menu.
 * @enum {string}
 */
const GroupLabel = {
  LAYER: 'Layer',
  TOOLS: 'Tools'
};

/**
 * Last sort value used for each layer menu group.
 * @enum {number}
 */
const GroupSort = {
  GROUPS: 0,
  LAYER: 0,
  TOOLS: 0
};

/**
 * Set up the layer menu.
 */
const setup = function() {
  if (MENU) {
    // already created
    return;
  }

  MENU = new Menu(new MenuItem({
    type: MenuItemType.ROOT,
    children: [{
      label: GroupLabel.LAYER,
      type: MenuItemType.GROUP,
      sort: GroupSort.GROUPS++,
      children: [{
        label: 'Save',
        eventType: EventType.SAVE_LAYER,
        tooltip: 'Saves the changes to the layer',
        icons: ['<i class="fa fa-fw fa-save"></i>'],
        beforeRender: visibleIfSupported,
        handler: onSave_,
        metricKey: LayerKeys.SAVE,
        sort: -10010 // we want this to appear at the top when its available
      }, {
        label: 'Save As...',
        eventType: EventType.SAVE_LAYER_AS,
        tooltip: 'Saves the changes to the layer to a new layer',
        icons: ['<i class="fa fa-fw fa-save"></i>'],
        beforeRender: visibleIfSupported,
        handler: onSaveAs_,
        metricKey: LayerKeys.SAVE_AS,
        sort: -10000 // we want this to appear right below save
      }, {
        label: 'Compare Layers',
        tooltip: 'Compare two layers side-by-side',
        icons: ['<i class="fas fa-fw fa-layer-group"></i>'],
        beforeRender: visibleIfCanCompare,
        handler: handleCompareLayers
      }, {
        label: 'Go To',
        eventType: EventType.GOTO,
        tooltip: 'Repositions the map to show the layer',
        icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
        beforeRender: visibleIfSupported,
        handler: onGoTo_,
        metricKey: LayerKeys.GO_TO,
        sort: GroupSort.LAYER++
      }, {
        label: 'Identify',
        eventType: EventType.IDENTIFY,
        tooltip: 'Identifies a layer on the map',
        icons: ['<i class="fa fa-fw fa-eye"></i>'],
        beforeRender: visibleIfSupported,
        handler: onIdentify_,
        metricKey: LayerKeys.IDENTIFY,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Clear Selection',
        eventType: EventType.CLEAR_SELECTION,
        tooltip: 'Clears the selection for the layer',
        icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        metricKey: LayerKeys.CLEAR_SELECTION,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Add to Timeline',
        eventType: EventType.ENABLE_TIME,
        tooltip: 'Enables layer animation when the timeline is open',
        icons: ['<i class="fa fa-fw fa-clock-o"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Remove From Timeline',
        eventType: EventType.DISABLE_TIME,
        tooltip: 'Disables layer animation when the timeline is open',
        icons: ['<i class="fa fa-fw fa-clock-o"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Most Recent',
        eventType: EventType.MOST_RECENT,
        tooltip: 'Adjusts application time to show the most recent data for the layer',
        icons: ['<i class="fa fa-fw fa-fast-forward"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        metricKey: LayerKeys.MOST_RECENT,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Refresh',
        eventType: EventType.REFRESH,
        tooltip: 'Refreshes the layer',
        icons: ['<i class="fa fa-fw fa-refresh"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        metricKey: LayerKeys.REFRESH,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Clear Auto/Manual Color',
        eventType: EventType.RESET_COLOR,
        tooltip: 'Clears auto/manual coloring rules, resetting all features to the layer color',
        icons: ['<i class="fa fa-fw fa-tint"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        metricKey: LayerKeys.RESET_COLOR,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Lock',
        eventType: EventType.LOCK,
        tooltip: 'Lock the layer to prevent data from changing',
        icons: ['<i class="fa fa-fw fa-lock"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        metricKey: LayerKeys.LOCK,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Unlock',
        eventType: EventType.UNLOCK,
        tooltip: 'Unlock the layer and refresh its data',
        icons: ['<i class="fa fa-fw fa-unlock-alt"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        metricKey: LayerKeys.UNLOCK,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Remove',
        eventType: EventType.REMOVE_LAYER,
        tooltip: 'Removes the layer',
        icons: ['<i class="fa fa-fw fa-times"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        metricKey: LayerKeys.REMOVE,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Rename',
        eventType: EventType.RENAME,
        tooltip: 'Rename the layer',
        icons: ['<i class="fa fa-fw fa-i-cursor"></i>'],
        beforeRender: visibleIfSupported,
        handler: onLayerMenuEvent,
        metricKey: LayerKeys.RENAME,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Show Description',
        eventType: EventType.SHOW_DESCRIPTION,
        tooltip: 'Gives details about the layer',
        icons: ['<i class="fa fa-fw fa-newspaper-o"></i>'],
        beforeRender: visibleIfSupported,
        handler: onDescription_,
        metricKey: LayerKeys.SHOW_DESCRIPTION,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Show Features',
        eventType: EventType.FEATURE_LIST,
        tooltip: 'Displays features in the layer',
        icons: ['<i class="fa fa-fw fa-table"></i>'],
        beforeRender: visibleIfSupported,
        handler: onFeatureList_,
        metricKey: LayerKeys.FEATURE_LIST,
        sort: GroupSort.LAYER++
      },
      {
        label: 'Layer Mappings...',
        eventType: EventType.LAYER_SETTINGS,
        tooltip: 'Add Custom Mappings to the Layer',
        icons: ['<i class="fa fa-cog"></i>'],
        beforeRender: visibleIfSupported,
        handler: onMappings_,
        sort: GroupSort.LAYER++
      }]
    }, {
      label: GroupLabel.TOOLS,
      type: MenuItemType.GROUP,
      sort: GroupSort.GROUPS++,
      children: [{
        label: 'Export...',
        eventType: EventType.EXPORT,
        tooltip: 'Exports data from this layer',
        icons: ['<i class="fa fa-fw fa-download"></i>'],
        beforeRender: visibleIfSupported,
        handler: onExport_,
        metricKey: LayerKeys.EXPORT,
        sort: -1000 // commonly used, so prioritize above other items
      }]
    }]
  }));
};

/**
 * Dispose the layer menu.
 */
const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Get the layer from an action event context.
 *
 * @param {Context} context The event context.
 * @return {!Array<!ILayer>}
 */
const getLayersFromContext = function(context) {
  return nodesToLayers(context);
};

/**
 * Show a menu item if layers in the context support it.
 *
 * @param {Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfSupported = function(context) {
  this.visible = false;

  if (this.eventType && context && context.length > 0) {
    var layers = getLayersFromContext(context);

    // test that all action args contain a layer that supports the given action type
    this.visible = layers.length == context.length && layers.every(function(layer) {
      return this.eventType ? layer.supportsAction(this.eventType, context) : false;
    }, this);
  }
};

/**
 * Handle layer menu events.
 *
 * @param {!MenuEvent<Context>} event The menu event.
 */
const onLayerMenuEvent = function(event) {
  // call the action requested for each selected layer
  var layers = getLayersFromContext(event.getContext());
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
 * @param {!MenuEvent<Context>} event The menu event.
 */
const onDescription_ = function(event) {
  var layers = getLayersFromContext(event.getContext());
  var msg = '';
  for (var i = 0; i < layers.length; i++) {
    var descrip = DataManager.getInstance().getDescriptor(layers[i].getId());
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

  ConfirmUI.launchConfirm(confirmOptions);
};

/**
 * Handle the "Save" menu event.
 *
 * @param {!MenuEvent<Context>} event The menu event.
 */
const onSave_ = function(event) {
  var context = event.getContext();
  if (context) {
    const sources = getSourcesFromContext(context);

    if (sources && sources.length == 1) {
      let exporter = ExportManager.getInstance().getExportMethods()[1];
      const source = sources[0];
      const layerName = source.getTitle(true);
      const descriptor = DataManager.getInstance().getDescriptor(source.getId());

      if (descriptor instanceof FileDescriptor) {
        exporter = descriptor.getExporter();
      }

      const options = /** @type {ExportOptions} */ ({
        items: source.getFeatures(),
        sources: [source],
        fields: getExportFields(source, false, exporter.supportsTime()),
        title: layerName,
        keepTitle: true,
        createDescriptor: !(descriptor instanceof FileDescriptor),
        exporter
      });

      ExportManager.getInstance().exportItems(options);
      source.setHasModifications(false);

      const msg = `${layerName} changes saved successfully.`;
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.SUCCESS);
    }
  }
};

/**
 * Handle the "Save As" menu event.
 *
 * @param {!MenuEvent<Context>} event The menu event.
 */
const onSaveAs_ = function(event) {
  var context = event.getContext();
  if (context) {
    const sources = getSourcesFromContext(context);
    if (sources && sources.length == 1) {
      const source = sources[0];
      const layerName = source.getTitle(true);
      const exporter = ExportManager.getInstance().getExportMethods()[1];

      const options = /** @type {ExportOptions} */ ({
        items: source.getFeatures(),
        sources: [source],
        fields: getExportFields(source, false, exporter.supportsTime()),
        title: layerName,
        exporter
      });

      const confirmOptions = /** @type {!osx.window.ConfirmTextOptions} */ ({
        confirm: confirmSaveAs_.bind(undefined, options),
        defaultValue: layerName,
        prompt: 'Please choose a name for the new layer:',
        windowOptions: /** @type {!osx.window.WindowOptions} */ ({
          icon: 'fa fa-save-o',
          label: `Save ${layerName} As`
        })
      });

      ConfirmTextUI.launchConfirmText(confirmOptions);
    }
  }
};

/**
 * Handles confirming the save as dialog.
 * @param {ExportOptions} options The folder options.
 * @param {string} title The chosen folder title.
 */
const confirmSaveAs_ = function(options, title) {
  options.title = title;
  options.keepTitle = true;
  options.createDescriptor = true;

  ExportManager.getInstance().exportItems(options);

  const source = options.sources[0];
  source.setHasModifications(false);

  const msg = `${title} changes saved successfully.`;
  AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.SUCCESS);
};

/**
 * Handle the "Export" menu event.
 *
 * @param {!MenuEvent<Context>} event The menu event.
 */
const onExport_ = function(event) {
  var context = event.getContext();
  if (context) {
    ExportUI.startExport(getSourcesFromContext(context));
  }
};

/**
 * Launches the window to configure layer mappings (for now only ellipse mappings)
 * @param {!MenuEvent<Context>} event The menu event.
 */
const onMappings_ = function(event) {
  const context = event.getContext();
  const layers = getLayersFromContext(context);
  const layer = layers ? layers[0] : null;

  EllipseColumnsUI.launchConfigureWindow(layer);
};

/**
 * Handle the "Feature List" menu event.
 *
 * @param {!MenuEvent<Context>} event The menu event.
 */
const onFeatureList_ = function(event) {
  var layers = getLayersFromContext(event.getContext());
  if (layers) {
    layers.forEach(function(layer) {
      var source = layer.getSource();
      if (source instanceof VectorSource) {
        launchFeatureList(source);
      }
    });
  }
};

/**
 * Handle the "Go To" menu event.
 *
 * @param {!MenuEvent<Context>} event The menu event.
 */
const onGoTo_ = function(event) {
  // aggregate the features and execute os.feature.flyTo, in case they have altitude and pure extent wont cut it
  const layers = getLayersFromContext(event.getContext());
  const features = layers.reduce((feats, layer) => {
    let source = layer.getSource();
    if (source instanceof OLVectorSource) {
      source = /** @type {OLVectorSource} */ (source);
      const newFeats = source.getFeatures();
      return newFeats.length > 0 ? feats.concat(newFeats) : feats;
    }
    return feats;
  }, []);

  if (features && features.length) {
    flyTo(features);
  } else {
    var extent = getLayersFromContext(event.getContext())
        .reduce(reduceExtentFromLayers, createEmpty());

    if (!isEmpty(extent)) {
      CommandProcessor.getInstance().addCommand(new FlyToExtent(extent));
    }
  }
};

/**
 * Handle the "Identify" menu event.
 *
 * @param {!MenuEvent<Context>} event The menu event.
 */
const onIdentify_ = function(event) {
  var layers = getLayersFromContext(event.getContext());
  var oldTimelineFeaturesMap = {};

  // ignore base map and tile layers, we don't want to remove and re-add these during identify
  var visibleVectorLayers = getMapContainer().getLayers().filter(function(layer) {
    const iLayer = /** @type {ILayer} */ (layer);

    // leave the basemaps on, it's slow and ugly to hide during an identify
    if (iLayer.getOSType() === 'Map Layers') {
      return false;
    } else if (!layers.includes(iLayer)) {
      return layer.getVisible() || iLayer.getLayerVisible();
    }
  });

  // hide other layers/features during an identify
  for (var i = 0, n = visibleVectorLayers.length; i < n; i++) {
    var layer = /** @type {VectorLayer} */ (visibleVectorLayers[i]);
    var source = layer.getSource();
    var overlay = (source instanceof VectorSource) ? source.getAnimationOverlay() : null;
    if (overlay && !getMapContainer().is3DEnabled()) {
      // 2D mode w/timeline, hide individual features
      var oldFeatures = overlay.getFeatures().splice(0, overlay.getFeatures().length);
      overlay.setFeatures(null);
      oldTimelineFeaturesMap[layer.getId()] = oldFeatures;
    } else {
      // 3D mode or not using timeline
      layer.setBaseVisible(false);
    }
  }

  onLayerMenuEvent(event);

  // unhide the layers/features post identify. the identify logic uses 250 ms timer ticks and runs for > 5 ticks, so
  // wait at least for 1500 ms.
  var identifyTimer = new Timer(1750);
  var toggleOpacity = function() {
    for (var i = 0, n = visibleVectorLayers.length; i < n; i++) {
      var layer = /** @type {VectorLayer} */ (visibleVectorLayers[i]);
      var source = layer.getSource();
      var overlay = (source instanceof VectorSource) ? source.getAnimationOverlay() : null;
      if (overlay && !getMapContainer().is3DEnabled()) {
        // 2D mode w/timeline, show individual features
        overlay.setFeatures(oldTimelineFeaturesMap[layer.getId()]);
      } else {
        // 3D mode or not using timeline
        layer.setBaseVisible(true);
      }
    }
    identifyTimer.dispose();
  };

  identifyTimer.listen(Timer.TICK, toggleOpacity);
  identifyTimer.start();
};

/**
 * Enables the option when two layers are selected.
 * @param {Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfCanCompare = function(context) {
  const layers = getLayersFromContext(context);
  this.visible = !!layers && layers.length === 2;
};

/**
 * Extract the feature from an event and launch the external link.
 * @param {!MenuEvent<Context>} event The menu event.
 */
const handleCompareLayers = function(event) {
  var layers = getLayersFromContext(event.getContext());
  if (layers && layers.length === 2) {
    LayerCompareUI.launchLayerCompare({
      left: [layers[0]],
      right: [layers[1]]
    });
  }
};

exports = {
  MENU,
  GroupLabel,
  GroupSort,
  setup,
  dispose,
  getLayersFromContext,
  visibleIfSupported,
  onLayerMenuEvent,
  confirmSaveAs_,
  visibleIfCanCompare,
  handleCompareLayers,
  Context
};
