goog.provide('plugin.file.kml.menu');

goog.require('os.buffer');
goog.require('os.command.FlyToExtent');
goog.require('os.ui.featureInfoDirective');
goog.require('os.ui.menu.layer');
goog.require('plugin.file.kml.ui.KMLNetworkLinkNode');
goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.file.kml.ui.kmlTreeExportDirective');


/**
 * KML menu event types.
 * @enum {string}
 */
plugin.file.kml.menu.EventType = {
  LOAD: 'kml:load',
  REFRESH: 'kml:refresh',
  FEATURE_INFO: 'kml:featureInfo',
  GOTO: 'kml:goTo',
  SELECT: 'kml:selectAll',
  DESELECT: 'kml:deselectAll',
  REMOVE: 'kml:removeAll',
  BUFFER: 'kml:buffer'
};


/**
 * Set up KML tree items in the layer menu.
 */
plugin.file.kml.menu.treeSetup = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu && !menu.getRoot().find(plugin.file.kml.menu.EventType.GOTO)) {
    var menuRoot = menu.getRoot();
    var toolsGroup = menuRoot.find(os.ui.menu.layer.GroupLabel.TOOLS);
    goog.asserts.assert(toolsGroup, 'Group should exist! Check spelling?');

    menuRoot.addChild({
      label: 'Load',
      eventType: plugin.file.kml.menu.EventType.LOAD,
      tooltip: 'Load the network link',
      icons: ['<i class="fa fa-fw fa-cloud-download"></i>'],
      beforeRender: plugin.file.kml.menu.visibleIfSupported_,
      handler: plugin.file.kml.menu.onLayerEvent_,
      sort: os.ui.menu.layer.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Refresh',
      eventType: plugin.file.kml.menu.EventType.REFRESH,
      tooltip: 'Refresh the network link',
      icons: ['<i class="fa fa-fw fa-refresh"></i>'],
      beforeRender: plugin.file.kml.menu.visibleIfSupported_,
      handler: plugin.file.kml.menu.onLayerEvent_,
      sort: os.ui.menu.layer.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Feature Info',
      eventType: plugin.file.kml.menu.EventType.FEATURE_INFO,
      tooltip: 'Display detailed feature information',
      icons: ['<i class="fa fa-fw fa-info-circle"></i>'],
      beforeRender: plugin.file.kml.menu.visibleIfSupported_,
      handler: plugin.file.kml.menu.onLayerEvent_,
      sort: os.ui.menu.layer.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Go To',
      eventType: plugin.file.kml.menu.EventType.GOTO,
      tooltip: 'Repositions the map to display features at this level of the tree',
      icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
      beforeRender: plugin.file.kml.menu.visibleIfSupported_,
      handler: plugin.file.kml.menu.onLayerEvent_,
      sort: os.ui.menu.layer.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Select All',
      eventType: plugin.file.kml.menu.EventType.SELECT,
      tooltip: 'Selects all features under the folder',
      icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
      beforeRender: plugin.file.kml.menu.visibleIfSupported_,
      handler: plugin.file.kml.menu.onLayerEvent_,
      sort: os.ui.menu.layer.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Deselect All',
      eventType: plugin.file.kml.menu.EventType.DESELECT,
      tooltip: 'Deselects all features under the folder',
      icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
      beforeRender: plugin.file.kml.menu.visibleIfSupported_,
      handler: plugin.file.kml.menu.onLayerEvent_,
      sort: os.ui.menu.layer.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Remove All',
      eventType: plugin.file.kml.menu.EventType.REMOVE,
      tooltip: 'Removes everything under the folder',
      icons: ['<i class="fa fa-fw fa-times"></i>'],
      beforeRender: plugin.file.kml.menu.visibleIfSupported_,
      handler: plugin.file.kml.menu.onLayerEvent_,
      sort: os.ui.menu.layer.GroupSort.LAYER++
    });

    toolsGroup.addChild({
      label: 'Create Buffer Region...',
      eventType: plugin.file.kml.menu.EventType.BUFFER,
      tooltip: 'Creates buffer regions around loaded data',
      icons: ['<i class="fa fa-fw ' + os.buffer.ICON + '"></i>'],
      beforeRender: plugin.file.kml.menu.visibleIfSupported_,
      handler: plugin.file.kml.menu.onLayerEvent_
    });
  }
};


/**
 * Show a KML menu item if the context supports it.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.file.kml.menu.visibleIfSupported_ = function(context) {
  this.visible = false;

  if (this.eventType && context && context.length == 1) {
    var node = context[0];
    if (node instanceof plugin.file.kml.ui.KMLNode) {
      switch (this.eventType) {
        case plugin.file.kml.menu.EventType.BUFFER:
          this.visible = node.hasFeatures();
          break;
        case plugin.file.kml.menu.EventType.SELECT:
        case plugin.file.kml.menu.EventType.DESELECT:
          this.visible = node.isFolder() && node.hasFeatures();
          break;
        case plugin.file.kml.menu.EventType.GOTO:
          this.visible = !!node.getImage() || node.hasFeatures();
          break;
        case plugin.file.kml.menu.EventType.LOAD:
          this.visible = node instanceof plugin.file.kml.ui.KMLNetworkLinkNode &&
              node.getState() === os.structs.TriState.OFF;
          break;
        case plugin.file.kml.menu.EventType.REFRESH:
          this.visible = node instanceof plugin.file.kml.ui.KMLNetworkLinkNode &&
              node.getState() !== os.structs.TriState.OFF && !node.isLoading();
          break;
        case plugin.file.kml.menu.EventType.FEATURE_INFO:
          this.visible = !!node.getFeature();
          break;
        default:
          this.visible = node.isFolder();
          break;
      }
    }
  }
};


/**
 * Handle KML layer menu events.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.file.kml.menu.onLayerEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof plugin.file.kml.ui.KMLNode) {
      var source = node.getSource();
      if (source) {
        switch (event.type) {
          case plugin.file.kml.menu.EventType.BUFFER:
            var features = node.getFeatures();
            if (features && features.length > 0) {
              var bufferTitle = node.getLabel() + ' Buffer';
              var config = {
                'features': features,
                'title': bufferTitle
              };
              os.buffer.launchDialog(config);
            }
            break;
          case plugin.file.kml.menu.EventType.GOTO:
            var extent = node.getExtent();

            if (!ol.extent.isEmpty(extent)) {
              os.commandStack.addCommand(new os.command.FlyToExtent(extent));
            }
            break;
          case plugin.file.kml.menu.EventType.SELECT:
            source.addToSelected(node.getFeatures());
            break;
          case plugin.file.kml.menu.EventType.DESELECT:
            source.removeFromSelected(node.getFeatures());
            break;
          case plugin.file.kml.menu.EventType.REMOVE:
            // don't put this on the stack because refreshing the layer will make commands invalid
            source.clearNode(node, true);
            plugin.file.kml.ui.KMLNode.collapseEmpty(node);
            break;
          case plugin.file.kml.menu.EventType.LOAD:
            /** @type {plugin.file.kml.ui.KMLNetworkLinkNode} */ (node).setState(os.structs.TriState.ON);
            break;
          case plugin.file.kml.menu.EventType.REFRESH:
            /** @type {plugin.file.kml.ui.KMLNetworkLinkNode} */ (node).refresh();
            break;
          case plugin.file.kml.menu.EventType.FEATURE_INFO:
            var title = source ? source.getTitle() : undefined;
            var feature = node.getFeature();
            if (feature) {
              os.ui.launchFeatureInfo(feature, title);
            }
            break;
          default:
            break;
        }
      }
    }
  }
};
