goog.module('plugin.vectortools.VectorToolsPlugin');
goog.module.declareLegacyNamespace();

goog.require('plugin.vectortools.JoinUI');
goog.require('plugin.vectortools.MergeUI');

const asserts = goog.require('goog.asserts');
const os = goog.require('os');
const MapContainer = goog.require('os.MapContainer');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const ParallelCommand = goog.require('os.command.ParallelCommand');
const LayerNode = goog.require('os.data.LayerNode');
const fn = goog.require('os.fn');
const ogc = goog.require('os.ogc');
const LayerType = goog.require('os.layer.LayerType');
const VectorLayer = goog.require('os.layer.Vector');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const osUiMenuLayer = goog.require('os.ui.menu.layer');
const osWindow = goog.require('os.ui.window');

const vectortools = goog.require('plugin.vectortools');
const Icons = goog.require('plugin.vectortools.Icons');
const CopyLayer = goog.require('plugin.vectortools.CopyLayer');


/**
 */
class VectorToolsPlugin extends AbstractPlugin {
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
    var menu = osUiMenuLayer.MENU;
    if (menu) {
      var group = menu.getRoot().find(osUiMenuLayer.GroupLabel.TOOLS);
      asserts.assert(group, 'Group should exist! Check spelling?');

      var labels = ['All', 'Shown', 'Selected', 'Unselected', 'Hidden'];
      var parents = [{
        label: 'Copy',
        type: EventType.COPY,
        icon: vectortools.Icons.COPY_ICON,
        tooltip: 'Creates a static copy of the layer'
      }, {
        label: 'Merge',
        type: EventType.MERGE,
        icon: vectortools.Icons.MERGE_ICON,
        tooltip: 'Merges multiple layers into a new static layer'
      }, {
        label: 'Join',
        type: EventType.JOIN,
        icon: vectortools.Icons.JOIN_ICON,
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
 * @param {osUiMenuLayer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfIsVector = function(context) {
  this.visible = false;

  if (context && context.length > 0) {
    this.visible = context.every(function(item) {
      if (item instanceof LayerNode) {
        var layer = /** @type {!os.data.LayerNode} */ (item).getLayer();
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
 * @param {!os.ui.menu.MenuEvent<osUiMenuLayer.Context>} event The menu event.
 */
const handleMenuEvent = function(event) {
  var parts = event.type.split(/\s+/);
  var type = parts[0];

  if (parts.length > 1) {
    vectortools.setOption(/** @type {vectortools.Options} */ (parseInt(parts[1], 10)));
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
 * @param {os.structs.ITreeNode} node The tree node.
 * @return {string|undefined} The layer id.
 */
const nodeToId = function(node) {
  var layer = fn.mapNodeToLayer(node);
  return layer ? layer.getId() : undefined;
};


/**
 * Map a tree node to data source.
 *
 * @param {os.structs.ITreeNode} node The tree node.
 * @return {os.source.ISource|undefined} The data source.
 */
const nodeToSource = function(node) {
  var layer = fn.mapNodeToLayer(node);
  if (layer) {
    return os.osDataManager.getSource(layer.getId()) || undefined;
  }

  return undefined;
};


/**
 * Map a tree node to Copy Layer command.
 *
 * @param {os.structs.ITreeNode} node The tree node.
 * @return {os.command.ICommand|undefined}
 */
const nodeToCopyCommand = function(node) {
  var layer = fn.mapNodeToLayer(node);
  return layer ? new CopyLayer(layer.getId()) : undefined;
};

/**
 * Launches the Merge Layer window.
 *
 * @param {Array<string>} sourceIds The source/layer IDs to merge
 */
const launchMergeWindow = function(sourceIds) {
  var title = 'Merge ' + sourceIds.length + ' Layers';
  osWindow.create({
    'label': title,
    'icon': 'fa ' + Icons.MERGE_ICON,
    'x': 'center',
    'y': 'center',
    'width': '400',
    'height': 'auto',
    'show-close': true
  }, `<merge></merge>`, undefined, undefined, undefined, {
    'sourceIds': sourceIds
  });
};

/**
 * Launches the Join Layer window.
 *
 * @param {Array<string>} sourceIds The source/layer IDs to join
 */
const launchJoinWindow = function(sourceIds) {
  var title = 'Join ' + sourceIds.length + ' Layers';
  osWindow.create({
    'label': title,
    'icon': 'fa ' + Icons.JOIN_ICON,
    'x': 'center',
    'y': 'center',
    'width': '500',
    'height': 'auto',
    'show-close': true
  }, `<join></join>`, undefined, undefined, undefined, {
    'sourceIds': sourceIds
  });
};

exports = VectorToolsPlugin;
