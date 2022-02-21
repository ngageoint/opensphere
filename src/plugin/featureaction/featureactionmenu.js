goog.declareModuleId('plugin.im.action.feature.menu');

import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import AlertManager from '../../os/alert/alertmanager.js';
import {ICON} from '../../os/im/action/importaction.js';
import ImportActionManager from '../../os/im/action/importactionmanager.js';
import LayerType from '../../os/layer/layertype.js';
import MapContainer from '../../os/mapcontainer.js';
import * as layerMenu from '../../os/ui/menu/layermenu.js';
import {EventType, Metrics, TITLE} from './featureaction.js';
import launchForLayer from './ui/launchforlayer.js';

const asserts = goog.require('goog.asserts');


/**
 * Sets up import actions in the layer menu.
 */
export const layerSetup = function() {
  var menu = layerMenu.getMenu();
  if (menu && !menu.getRoot().find(EventType.LAUNCH)) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.TOOLS);
    asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: TITLE + '...',
      eventType: EventType.LAUNCH,
      tooltip: 'Perform actions on imported data matching a filter',
      icons: ['<i class="fa fa-fw ' + ICON + '"></i>'],
      beforeRender: visibleIfSupported,
      handler: handleLayerAction,
      metricKey: Metrics.LAYER_LAUNCH
    });
  }
};

/**
 * Clean up buffer region listeners in the layers window.
 */
export const layerDispose = function() {
  var menu = layerMenu.getMenu();
  if (menu && !menu.getRoot().find(EventType.LAUNCH)) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.TOOLS);
    if (group) {
      group.removeChild(EventType.LAUNCH);
    }
  }
};


/**
 * If the action arguments support feature actions.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfSupported = function(context) {
  this.visible = false;

  var am = ImportActionManager.getInstance();
  if (am && am.hasActions() && context && context.length == 1) {
    var layers = layerMenu.getLayersFromContext(context).filter(MapContainer.isVectorLayer);
    if (layers && layers.length == 1 && layers[0].getOSType() != LayerType.REF) {
      var source = /** @type {ol.layer.Layer} */ (layers[0]).getSource();
      this.visible = source != null;
    }
  }
};


/**
 * Handle import action event from the layer menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 * @private
 */
const handleLayerAction = function(event) {
  var layers = layerMenu.getLayersFromContext(event.getContext()).filter(MapContainer.isVectorLayer);
  if (layers && layers.length == 1 && layers[0].getOSType() != LayerType.REF) {
    launchForLayer(layers[0].getId());
  } else {
    AlertManager.getInstance().sendAlert('Unexpected layer selection. Please select a single layer and try again.',
        AlertEventSeverity.WARNING);
  }
};
