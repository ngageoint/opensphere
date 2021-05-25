goog.module('plugin.file.kml.menu');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');

const buffer = goog.require('os.buffer');
const osFeature = goog.require('os.feature');
const TriState = goog.require('os.structs.TriState');
const launchMultiFeatureInfo = goog.require('os.ui.feature.launchMultiFeatureInfo');
const layerMenu = goog.require('os.ui.menu.layer');
const KMLNetworkLinkNode = goog.require('plugin.file.kml.ui.KMLNetworkLinkNode');
const KMLNode = goog.require('plugin.file.kml.ui.KMLNode');


/**
 * KML menu event types.
 * @enum {string}
 */
const EventType = {
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
const treeSetup = function() {
  var menu = layerMenu.MENU;
  if (menu && !menu.getRoot().find(EventType.GOTO)) {
    var menuRoot = menu.getRoot();
    var toolsGroup = menuRoot.find(layerMenu.GroupLabel.TOOLS);
    asserts.assert(toolsGroup, 'Group should exist! Check spelling?');

    menuRoot.addChild({
      label: 'Load',
      eventType: EventType.LOAD,
      tooltip: 'Load the network link',
      icons: ['<i class="fa fa-fw fa-cloud-download"></i>'],
      beforeRender: visibleIfSupported_,
      handler: onLayerEvent_,
      sort: layerMenu.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Refresh',
      eventType: EventType.REFRESH,
      tooltip: 'Refresh the network link',
      icons: ['<i class="fa fa-fw fa-refresh"></i>'],
      beforeRender: visibleIfSupported_,
      handler: onLayerEvent_,
      sort: layerMenu.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Feature Info',
      eventType: EventType.FEATURE_INFO,
      tooltip: 'Display detailed feature information',
      icons: ['<i class="fa fa-fw fa-info-circle"></i>'],
      beforeRender: visibleIfSupported_,
      handler: onLayerEvent_,
      sort: layerMenu.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Go To',
      eventType: EventType.GOTO,
      tooltip: 'Repositions the map to display features at this level of the tree',
      icons: ['<i class="fa fa-fw fa-fighter-jet"></i>'],
      beforeRender: visibleIfSupported_,
      handler: onLayerEvent_,
      sort: layerMenu.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Select All',
      eventType: EventType.SELECT,
      tooltip: 'Selects all features under the folder',
      icons: ['<i class="fa fa-fw fa-check-circle"></i>'],
      beforeRender: visibleIfSupported_,
      handler: onLayerEvent_,
      sort: layerMenu.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Deselect All',
      eventType: EventType.DESELECT,
      tooltip: 'Deselects all features under the folder',
      icons: ['<i class="fa fa-fw fa-times-circle"></i>'],
      beforeRender: visibleIfSupported_,
      handler: onLayerEvent_,
      sort: layerMenu.GroupSort.LAYER++
    });

    menuRoot.addChild({
      label: 'Remove All',
      eventType: EventType.REMOVE,
      tooltip: 'Removes everything under the folder',
      icons: ['<i class="fa fa-fw fa-times"></i>'],
      beforeRender: visibleIfSupported_,
      handler: onLayerEvent_,
      sort: layerMenu.GroupSort.LAYER++
    });

    toolsGroup.addChild({
      label: 'Create Buffer Region...',
      eventType: EventType.BUFFER,
      tooltip: 'Creates buffer regions around loaded data',
      icons: ['<i class="fa fa-fw ' + buffer.ICON + '"></i>'],
      beforeRender: visibleIfSupported_,
      handler: onLayerEvent_
    });
  }
};

/**
 * Show a KML menu item if the context supports it.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfSupported_ = function(context) {
  this.visible = false;

  if (this.eventType && context && context.length == 1) {
    var node = context[0];
    if (node instanceof KMLNode) {
      switch (this.eventType) {
        case EventType.BUFFER:
          this.visible = node.hasFeatures();
          break;
        case EventType.SELECT:
        case EventType.DESELECT:
          this.visible = node.isFolder() && node.hasFeatures();
          break;
        case EventType.GOTO:
          this.visible = !!node.getImage() || node.hasFeatures();
          break;
        case EventType.LOAD:
          this.visible = node instanceof KMLNetworkLinkNode &&
              node.getState() === TriState.OFF;
          break;
        case EventType.REFRESH:
          this.visible = node instanceof KMLNetworkLinkNode &&
              node.getState() !== TriState.OFF && !node.isLoading();
          break;
        case EventType.FEATURE_INFO:
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
 *
 * @param {!os.ui.menu.MenuEvent<layerMenu.Context>} event The menu event.
 */
const onLayerEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof KMLNode) {
      var source = node.getSource();
      if (source) {
        switch (event.type) {
          case EventType.BUFFER:
            var features = node.getFeatures();
            if (features && features.length > 0) {
              var bufferTitle = node.getLabel() + ' Buffer';
              var config = {
                'features': features,
                'title': bufferTitle
              };
              buffer.launchDialog(config);
            }
            break;
          case EventType.GOTO:
            var features = node.getZoomFeatures();
            if (features) {
              osFeature.flyTo(features);
            }
            break;
          case EventType.SELECT:
            source.addToSelected(node.getFeatures());
            break;
          case EventType.DESELECT:
            source.removeFromSelected(node.getFeatures());
            break;
          case EventType.REMOVE:
            // don't put this on the stack because refreshing the layer will make commands invalid
            source.clearNode(node, true);
            KMLNode.collapseEmpty(node);
            break;
          case EventType.LOAD:
            /** @type {KMLNetworkLinkNode} */ (node).setState(TriState.ON);
            break;
          case EventType.REFRESH:
            /** @type {KMLNetworkLinkNode} */ (node).refresh();
            break;
          case EventType.FEATURE_INFO:
            var title = source ? source.getTitle() : undefined;
            var feature = node.getFeature();
            if (feature) {
              launchMultiFeatureInfo(feature, title);
            }
            break;
          default:
            break;
        }
      }
    }
  }
};

exports = {
  EventType,
  treeSetup
};
