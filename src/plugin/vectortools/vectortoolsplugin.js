goog.declareModuleId('plugin.vectortools.VectorToolsPlugin');

import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import AlertManager from '../../os/alert/alertmanager.js';
import CommandProcessor from '../../os/command/commandprocessor.js';
import ParallelCommand from '../../os/command/parallelcommand.js';
import DataManager from '../../os/data/datamanager.js';
import LayerNode from '../../os/data/layernode.js';
import * as fn from '../../os/fn/fn.js';
import LayerType from '../../os/layer/layertype.js';
import VectorLayer from '../../os/layer/vector.js';
import MapContainer from '../../os/mapcontainer.js';
import * as ogc from '../../os/ogc/ogc.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import * as layerMenu from '../../os/ui/menu/layermenu.js';
import MenuItemType from '../../os/ui/menu/menuitemtype.js';
import CopyLayer from './copylayercmd.js';
import Icons from './icons.js';
import * as vectortools from './vectortools.js';
import {launchJoinWindow, launchMergeWindow} from './vectortoolsui.js';

const asserts = goog.require('goog.asserts');

/**
 */
export default class VectorToolsPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = 'vectortools';
  }

  /**
   * @inheritDoc
   */
  init() {
    var menu = layerMenu.getMenu();
    if (menu) {
      var group = menu.getRoot().find(layerMenu.GroupLabel.TOOLS);
      asserts.assert(group, 'Group should exist! Check spelling?');

      var labels = ['All', 'Shown', 'Selected', 'Unselected', 'Hidden'];
      var parents = [{
        label: 'Copy',
        type: EventType.COPY,
        icon: Icons.COPY_ICON,
        tooltip: 'Creates a static copy of the layer'
      }, {
        label: 'Merge',
        type: EventType.MERGE,
        icon: Icons.MERGE_ICON,
        tooltip: 'Merges multiple layers into a new static layer'
      }, {
        label: 'Join',
        type: EventType.JOIN,
        icon: Icons.JOIN_ICON,
        tooltip: 'Joins layers by a primary key'
      }];

      // position these submenus after other menu items
      var baseSort = 1000;
      parents.forEach(function(p) {
        var subMenu = group.addChild({
          label: p.label,
          type: MenuItemType.SUBMENU,
          icons: ['<i class="fa fa-fw ' + p.icon + '"></i>'],
          sort: baseSort++
        });

        for (var i = 0, n = labels.length; i < n; i++) {
          subMenu.addChild({
            label: labels[i],
            eventType: p.type + ' ' + i,
            tooltip: p.tooltip,
            icons: ['<i class="fa fa-fw ' + p.icon + '"></i>'],
            beforeRender: visibleIfIsVector,
            handler: handleMenuEvent,
            sort: i
          });
        }
      });
    }
  }

  /**
   * Get the global alert instance.
   * @return {!VectorToolsPlugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new VectorToolsPlugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {VectorToolsPlugin} value The instance.
   */
  static setInstance(value) {
    instance = value;
  }
}


/**
 * The global instance.
 * @type {VectorToolsPlugin}
 */
let instance = null;


/**
 *
 */
VectorToolsPlugin.prototype.nextId = 1;


/**
 * @enum {string}
 */
const EventType = {
  COPY: 'layer.copy',
  MERGE: 'layer.merge',
  JOIN: 'layer.join'
};


/**
 * Shows a menu item if the context contains all vector layers.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfIsVector = function(context) {
  this.visible = false;

  if (context && context.length > 0) {
    this.visible = context.every(function(item) {
      if (item instanceof LayerNode) {
        var layer = /** @type {!LayerNode} */ (item).getLayer();
        return layer instanceof VectorLayer && layer.getId() !== MapContainer.DRAW_ID &&
            layer.getOSType() !== LayerType.IMAGE;
      }

      return false;
    });
  }
};


/**
 * Handle layer menu events.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const handleMenuEvent = function(event) {
  var parts = event.type.split(/\s+/);
  var type = parts[0];

  if (parts.length > 1) {
    vectortools.setOption(/** @type {Options} */ (parseInt(parts[1], 10)));
  }

  var context = event.getContext();
  if (context && context.length > 0) {
    switch (type) {
      case EventType.COPY:
        var sources = context.map(nodeToSource).filter(fn.filterFalsey);
        var count = sources.reduce(function(previous, source) {
          return previous + source.getFeatures().length;
        }, 0);

        var msg;
        if (2 * count > ogc.getMaxFeatures()) {
          // don't allow the copy to overcap the tool's feature limit
          msg = 'Heads up! The copy you just attempted would result in too many features for the tool. ' +
              'Reduce the number of features in your layers before copying.';
          AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
          return;
        } else if (count === 0) {
          // don't allow the copy to overcap the tool's feature limit
          msg = 'Nothing to copy.';
          AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.INFO);
          return;
        }

        var cmds = context.map(nodeToCopyCommand).filter(fn.filterFalsey);
        if (cmds.length) {
          var cmd = new ParallelCommand();
          cmd.setCommands(cmds);
          CommandProcessor.getInstance().addCommand(cmd);
        }

        break;
      case EventType.MERGE:
      case EventType.JOIN:
        var layerIds = context.map(nodeToId).filter(fn.filterFalsey);
        if (layerIds.length < 2) {
          // show the option for 1 layer, but give an alert if only one is selected
          var msg = 'You need to pick at least 2 layers for this operation. Please select another layer and try again.';
          AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
        } else if (type == EventType.MERGE) {
          launchMergeWindow(layerIds);
        } else if (type == EventType.JOIN) {
          launchJoinWindow(layerIds);
        }
        break;
      default:
        break;
    }
  }
};


/**
 * Map a tree node to layer id.
 *
 * @param {ITreeNode} node The tree node.
 * @return {string|undefined} The layer id.
 */
const nodeToId = function(node) {
  var layer = fn.mapNodeToLayer(node);
  return layer ? layer.getId() : undefined;
};


/**
 * Map a tree node to data source.
 *
 * @param {ITreeNode} node The tree node.
 * @return {ISource|undefined} The data source.
 */
const nodeToSource = function(node) {
  var layer = fn.mapNodeToLayer(node);
  if (layer) {
    return DataManager.getInstance().getSource(layer.getId()) || undefined;
  }

  return undefined;
};


/**
 * Map a tree node to Copy Layer command.
 *
 * @param {ITreeNode} node The tree node.
 * @return {ICommand|undefined}
 */
const nodeToCopyCommand = function(node) {
  var layer = fn.mapNodeToLayer(node);
  return layer ? new CopyLayer(layer.getId()) : undefined;
};
