goog.declareModuleId('plugin.heatmap.menu');

import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import AlertManager from '../../os/alert/alertmanager.js';
import LayerNode from '../../os/data/layernode.js';
import {Layer as LayerKeys} from '../../os/metrics/metricskeys.js';
import * as layerMenu from '../../os/ui/menu/layermenu.js';
import MenuItemType from '../../os/ui/menu/menuitemtype.js';
import * as heatmap from './heatmap.js';
import Heatmap from './heatmaplayer.js';

const asserts = goog.require('goog.asserts');

const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');
const {default: MenuItem} = goog.requireType('os.ui.menu.MenuItem');


/**
 * Heatmap event group label.
 * @type {string}
 */
export const GROUP_LABEL = 'Heatmap';

/**
 * Heatmap menu events.
 * @enum {string}
 */
export const EventType = {
  EXPORT: 'heatmap:export',
  GENERATE_HEATMAP: 'heatmap:generate'
};

/**
 * Add heatmap menu items to the layer menu.
 */
export const setup = function() {
  var menu = layerMenu.getMenu();
  if (menu && !menu.getRoot().find(EventType.EXPORT)) {
    var menuRoot = menu.getRoot();
    var toolsGroup = menuRoot.find(layerMenu.GroupLabel.TOOLS);
    asserts.assert(toolsGroup, 'Group should exist! Check spelling?');

    //
    // TODO: Enable heatmap export after switching to an image layer.
    //

    menuRoot.addChild({
      label: GROUP_LABEL,
      type: MenuItemType.GROUP,
      children: [{
        label: 'Export Heatmap...',
        eventType: EventType.EXPORT,
        tooltip: 'Exports the heatmap as a KML Ground Overlay',
        icons: ['<i class="fa fa-fw fa-download"></i>'],
        beforeRender: visibleIfSupported_,
        handler: exportLayer_,
        metricKey: LayerKeys.HEATMAP
      }]
    });

    // this item is added for vector layers to be able to generate heatmaps
    toolsGroup.addChild({
      label: 'Generate Heatmap',
      eventType: EventType.GENERATE_HEATMAP,
      tooltip: 'Generate a heatmap of current features',
      icons: ['<i class="fa fa-fw fa-fire"></i>'],
      beforeRender: layerMenu.visibleIfSupported,
      handler: generateHeatmap_,
      metricKey: LayerKeys.HEATMAP
    });
  }
};

/**
 * Show the heatmap menu item if layers in the context support it.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfSupported_ = function(context) {
  this.visible = false;

  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof LayerNode) {
      var layer = node.getLayer();
      this.visible = layer instanceof Heatmap;
    }
  }
};

/**
 * Handle heatmap layer export event.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const exportLayer_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof LayerNode) {
      var layer = node.getLayer();
      if (layer instanceof Heatmap) {
        heatmap.exportHeatmap(layer);
      }
    }
  }
};

/**
 * Handle generate heatmap event. Adds a heatmap layer to the map.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const generateHeatmap_ = function(event) {
  var context = event.getContext();
  if (context) {
    var layers = layerMenu.getLayersFromContext(context);
    if (layers.length) {
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var source = /** @type {os.source.Vector} */ (layer.getSource());
        if (!source || source.getFeatureCount() <= 0) {
          AlertManager.getInstance().sendAlert('No features in selected layer. Unable to generate heatmap.',
              AlertEventSeverity.WARNING);
        } else {
          heatmap.createHeatmap(layer);
        }
      }
    }
  }
};
