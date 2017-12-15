goog.provide('plugin.file.kml.action');

goog.require('os.action.layer');
goog.require('os.buffer');
goog.require('os.command.FlyToExtent');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.featureInfoDirective');
goog.require('plugin.file.kml.ui.KMLNetworkLinkNode');
goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.file.kml.ui.kmlTreeExportDirective');


/**
 * KML action event types.
 * @enum {string}
 */
plugin.file.kml.action.EventType = {
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
 * Sets up KML tree actions
 */
plugin.file.kml.action.treeSetup = function() {
  if (os.action && os.action.layer) {
    var manager = os.action.layer.manager;

    if (!manager.getAction(plugin.file.kml.action.EventType.GOTO)) {
      // network link actions
      var load = new os.ui.action.Action(plugin.file.kml.action.EventType.LOAD, 'Load',
          'Load the network link', 'fa-cloud-download');
      load.enableWhen(plugin.file.kml.action.isTreeActionSupported_.bind(load));
      manager.addAction(load);

      var refresh = new os.ui.action.Action(plugin.file.kml.action.EventType.REFRESH, 'Refresh',
          'Refresh the network link', 'fa-refresh');
      refresh.enableWhen(plugin.file.kml.action.isTreeActionSupported_.bind(refresh));
      manager.addAction(refresh);

      // placemark actions
      var featureInfo = new os.ui.action.Action(plugin.file.kml.action.EventType.FEATURE_INFO, 'Feature Info',
          'Display detailed feature information', 'fa-info-circle');
      featureInfo.enableWhen(plugin.file.kml.action.isTreeActionSupported_.bind(featureInfo));
      manager.addAction(featureInfo);

      // generic actions
      var goTo = new os.ui.action.Action(plugin.file.kml.action.EventType.GOTO, 'Go To',
          'Repositions the map to display features at this level of the tree', 'fa-fighter-jet');
      goTo.enableWhen(plugin.file.kml.action.isTreeActionSupported_.bind(goTo));
      manager.addAction(goTo);

      var selectAll = new os.ui.action.Action(plugin.file.kml.action.EventType.SELECT, 'Select All',
          'Selects all features under the folder', 'fa-check-circle');
      selectAll.enableWhen(plugin.file.kml.action.isTreeActionSupported_.bind(selectAll));
      manager.addAction(selectAll);

      var deselectAll = new os.ui.action.Action(plugin.file.kml.action.EventType.DESELECT, 'Deselect All',
          'Deselects all features under the folder', 'fa-times-circle');
      deselectAll.enableWhen(plugin.file.kml.action.isTreeActionSupported_.bind(deselectAll));
      manager.addAction(deselectAll);

      var removeAll = new os.ui.action.Action(plugin.file.kml.action.EventType.REMOVE, 'Remove All',
          'Removes everything under the folder', 'fa-times');
      removeAll.enableWhen(plugin.file.kml.action.isTreeActionSupported_.bind(removeAll));
      manager.addAction(removeAll);

      var buffer = new os.ui.action.Action(plugin.file.kml.action.EventType.BUFFER, 'Create Buffer Region...',
          'Creates buffer regions around loaded data', os.buffer.ICON, null,
          new os.ui.action.MenuOptions(null, os.action.layer.GroupType.TOOLS));
      buffer.enableWhen(plugin.file.kml.action.isTreeActionSupported_.bind(buffer));
      manager.addAction(buffer);

      // register menu event listeners
      manager.listen(plugin.file.kml.action.EventType.LOAD, plugin.file.kml.action.onLayerEvent_);
      manager.listen(plugin.file.kml.action.EventType.REFRESH, plugin.file.kml.action.onLayerEvent_);
      manager.listen(plugin.file.kml.action.EventType.FEATURE_INFO, plugin.file.kml.action.onLayerEvent_);
      manager.listen(plugin.file.kml.action.EventType.GOTO, plugin.file.kml.action.onLayerEvent_);
      manager.listen(plugin.file.kml.action.EventType.SELECT, plugin.file.kml.action.onLayerEvent_);
      manager.listen(plugin.file.kml.action.EventType.DESELECT, plugin.file.kml.action.onLayerEvent_);
      manager.listen(plugin.file.kml.action.EventType.REMOVE, plugin.file.kml.action.onLayerEvent_);
      manager.listen(plugin.file.kml.action.EventType.BUFFER, plugin.file.kml.action.onLayerEvent_);
    }
  }
};


/**
 * @param {plugin.file.kml.ui.KMLNode} context The KML node
 * @return {boolean}
 * @private
 * @this os.ui.action.Action
 */
plugin.file.kml.action.isTreeActionSupported_ = function(context) {
  if (context && context.length == 1) {
    var eventType = this.getEventType();
    var node = context[0];
    if (node instanceof plugin.file.kml.ui.KMLNode) {
      var features = node.getFeatures();

      switch (eventType) {
        case plugin.file.kml.action.EventType.BUFFER:
          return features.length > 0;
        case plugin.file.kml.action.EventType.SELECT:
        case plugin.file.kml.action.EventType.DESELECT:
          return node.isFolder() && (features.length > 0);
        case plugin.file.kml.action.EventType.GOTO:
          return goog.isDefAndNotNull(node.getImage()) || (features.length > 0);
        case plugin.file.kml.action.EventType.LOAD:
          return node instanceof plugin.file.kml.ui.KMLNetworkLinkNode && node.getState() === os.structs.TriState.OFF;
        case plugin.file.kml.action.EventType.REFRESH:
          return node instanceof plugin.file.kml.ui.KMLNetworkLinkNode &&
              node.getState() !== os.structs.TriState.OFF && !node.isLoading();
        case plugin.file.kml.action.EventType.FEATURE_INFO:
          return goog.isDefAndNotNull(node.getFeature());
        default:
          return node.isFolder();
      }
    }
  }

  return false;
};


/**
 * Handle KML layer actions.
 * @param {os.ui.action.ActionEvent} event
 * @private
 */
plugin.file.kml.action.onLayerEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof plugin.file.kml.ui.KMLNode) {
      var source = node.getSource();
      if (source) {
        switch (event.type) {
          case plugin.file.kml.action.EventType.BUFFER:
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
          case plugin.file.kml.action.EventType.GOTO:
            var extent = node.getExtent();

            if (!ol.extent.isEmpty(extent)) {
              os.commandStack.addCommand(new os.command.FlyToExtent(extent));
            }
            break;
          case plugin.file.kml.action.EventType.SELECT:
            source.addToSelected(node.getFeatures());
            break;
          case plugin.file.kml.action.EventType.DESELECT:
            source.removeFromSelected(node.getFeatures());
            break;
          case plugin.file.kml.action.EventType.REMOVE:
            // don't put this on the stack because refreshing the layer will make commands invalid
            source.clearNode(node, true);
            plugin.file.kml.ui.KMLNode.collapseEmpty(node);
            break;
          case plugin.file.kml.action.EventType.LOAD:
            /** @type {plugin.file.kml.ui.KMLNetworkLinkNode} */ (node).setState(os.structs.TriState.ON);
            break;
          case plugin.file.kml.action.EventType.REFRESH:
            /** @type {plugin.file.kml.ui.KMLNetworkLinkNode} */ (node).refresh();
            break;
          case plugin.file.kml.action.EventType.FEATURE_INFO:
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
