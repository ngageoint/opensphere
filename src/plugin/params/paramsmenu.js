goog.declareModuleId('plugin.params.menu');

import Layer from 'ol/src/layer/Layer.js';
import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import AlertManager from '../../os/alert/alertmanager.js';
import * as layerMenu from '../../os/ui/menu/layermenu.js';
import {launchParamsEdit} from './editrequestparams.js';
import * as pluginParams from './params.js';

const asserts = goog.require('goog.asserts');

const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');
const {default: MenuItem} = goog.requireType('os.ui.menu.MenuItem');


/**
 * Set up params menu items in the layer menu.
 */
export const layerSetup = function() {
  var menu = layerMenu.getMenu();
  if (menu && !menu.getRoot().find(pluginParams.EventType.EDIT_PARAMS)) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.LAYER);
    asserts.assert(group, 'Group should exist! Check spelling?');

    group.addChild({
      label: 'Edit Parameters...',
      eventType: pluginParams.EventType.EDIT_PARAMS,
      tooltip: 'Edit request parameters for the layer',
      icons: ['<i class="fa fa-fw fa-gears"></i>'],
      beforeRender: visibleIfSupported_,
      handler: handleLayerAction_,
      metricKey: pluginParams.Metrics.EDIT_PARAMS,
      sort: 10000
    });
  }
};

/**
 * Clean up params menu items in the layer menu.
 */
export const layerDispose = function() {
  var menu = layerMenu.getMenu();
  if (menu && !menu.getRoot().find(pluginParams.EventType.EDIT_PARAMS)) {
    var group = menu.getRoot().find(layerMenu.GroupLabel.LAYER);
    if (group) {
      group.removeChild(pluginParams.EventType.EDIT_PARAMS);
    }
  }
};

/**
 * Test if an event context supports editing layer request parameters.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
export const visibleIfSupported_ = function(context) {
  this.visible = false;

  // only allow editing parameters for one layer at a time
  if (context && context.length === 1) {
    var layers = layerMenu.getLayersFromContext(context);
    if (layers && layers.length === 1 && layers[0] instanceof Layer) {
      this.visible = pluginParams.supportsParamOverrides(/** @type {!ol.layer.Layer} */ (layers[0]));
    }
  }
};

/**
 * Handle params event from the layer menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const handleLayerAction_ = function(event) {
  var layers = layerMenu.getLayersFromContext(event.getContext());
  if (layers && layers.length === 1 && layers[0] instanceof Layer) {
    var layer = /** @type {!ol.layer.Layer} */ (layers[0]);
    var params = pluginParams.getParamsFromLayer(layer);
    launchParamsEdit(layer, params);
  } else {
    AlertManager.getInstance().sendAlert('Unexpected layer selection. Please select a single layer and try again.',
        AlertEventSeverity.WARNING);
  }
};
