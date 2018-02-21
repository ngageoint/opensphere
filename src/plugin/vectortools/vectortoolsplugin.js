goog.provide('plugin.vectortools.VectorToolsPlugin');

goog.require('os.command.ParallelCommand');
goog.require('os.data.OSDataManager');
goog.require('os.fn');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.menu.layer');
goog.require('plugin.vectortools');
goog.require('plugin.vectortools.CopyLayer');



/**
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.vectortools.VectorToolsPlugin = function() {
  plugin.vectortools.VectorToolsPlugin.base(this, 'constructor');
  this.id = 'vectortools';
};
goog.inherits(plugin.vectortools.VectorToolsPlugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.vectortools.VectorToolsPlugin);


/**
 *
 */
plugin.vectortools.VectorToolsPlugin.prototype.nextId = 1;


/**
 * @inheritDoc
 */
plugin.vectortools.VectorToolsPlugin.prototype.init = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu) {
    var group = menu.getRoot().find(os.ui.menu.layer.GroupLabel.TOOLS);
    goog.asserts.assert(group, 'Group should exist! Check spelling?');

    var labels = ['All', 'Shown', 'Selected', 'Unselected', 'Hidden'];
    var parents = [{
      label: 'Copy',
      type: plugin.vectortools.EventType.COPY,
      icon: plugin.vectortools.Icons.COPY_ICON,
      tooltip: 'Creates a static copy of the layer'
    }, {
      label: 'Merge',
      type: plugin.vectortools.EventType.MERGE,
      icon: plugin.vectortools.Icons.MERGE_ICON,
      tooltip: 'Merges multiple layers into a new static layer'
    }, {
      label: 'Join',
      type: plugin.vectortools.EventType.JOIN,
      icon: plugin.vectortools.Icons.JOIN_ICON,
      tooltip: 'Joins layers by a primary key'
    }];

    // position these submenus after other menu items
    var baseSort = 1000;
    parents.forEach(function(p) {
      var subMenu = group.addChild({
        label: p.label,
        type: os.ui.menu.MenuItemType.SUBMENU,
        icons: ['<i class="fa fa-fw ' + p.icon + '"></i>'],
        sort: baseSort++
      });

      for (var i = 0, n = labels.length; i < n; i++) {
        subMenu.addChild({
          label: labels[i],
          eventType: p.type + ' ' + i,
          tooltip: p.tooltip,
          icons: ['<i class="fa fa-fw ' + p.icon + '"></i>'],
          beforeRender: plugin.vectortools.visibleIfIsVector,
          handler: plugin.vectortools.handleMenuEvent_,
          sort: i
        });
      }
    });
  }
};


/**
 * @enum {string}
 */
plugin.vectortools.EventType = {
  COPY: 'layer.copy',
  MERGE: 'layer.merge',
  JOIN: 'layer.join'
};


/**
 * Shows a menu item if the context contains all vector layers.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.vectortools.visibleIfIsVector = function(context) {
  this.visible = false;

  if (context && context.length > 0) {
    this.visible = context.every(function(item) {
      if (item instanceof os.data.LayerNode) {
        var layer = /** @type {!os.data.LayerNode} */ (item).getLayer();
        return layer instanceof os.layer.Vector && layer.getId() !== os.MapContainer.DRAW_ID &&
            layer.getOSType() !== os.layer.LayerType.IMAGE;
      }

      return false;
    });
  }
};


/**
 * Handle layer menu events.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.vectortools.handleMenuEvent_ = function(event) {
  var parts = event.type.split(/\s+/);
  var type = parts[0];

  if (parts.length > 1) {
    plugin.vectortools.option = /** @type {plugin.vectortools.Options} */ (parseInt(parts[1], 10));
  }

  var context = event.getContext();
  if (context && context.length > 0) {
    switch (type) {
      case plugin.vectortools.EventType.COPY:
        var sources = context.map(plugin.vectortools.nodeToSource_).filter(os.fn.filterFalsey);
        var count = sources.reduce(function(previous, source) {
          return previous + source.getFeatures().length;
        }, 0);

        var msg;
        if (2 * count > os.ogc.getMaxFeatures()) {
          // don't allow the copy to overcap the tool's feature limit
          msg = 'Heads up! The copy you just attempted would result in too many features for the tool. ' +
              'Reduce the number of features in your layers before copying.';
          os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
          return;
        } else if (count === 0) {
          // don't allow the copy to overcap the tool's feature limit
          msg = 'Nothing to copy.';
          os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.INFO);
          return;
        }

        var cmds = context.map(plugin.vectortools.nodeToCopyCommand_).filter(os.fn.filterFalsey);
        if (cmds.length) {
          var cmd = new os.command.ParallelCommand();
          cmd.setCommands(cmds);
          os.command.CommandProcessor.getInstance().addCommand(cmd);
        }

        break;
      case plugin.vectortools.EventType.MERGE:
      case plugin.vectortools.EventType.JOIN:
        var layerIds = context.map(plugin.vectortools.nodeToId_).filter(os.fn.filterFalsey);
        if (layerIds.length < 2) {
          // show the option for 1 layer, but give an alert if only one is selected
          var msg = 'You need to pick at least 2 layers for this operation. Please select another layer and try again.';
          os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
        } else if (type == plugin.vectortools.EventType.MERGE) {
          plugin.vectortools.launchMergeWindow(layerIds);
        } else if (type == plugin.vectortools.EventType.JOIN) {
          plugin.vectortools.launchJoinWindow(layerIds);
        }
        break;
      default:
        break;
    }
  }
};


/**
 * Map a tree node to layer id.
 * @param {os.structs.ITreeNode} node The tree node.
 * @return {string|undefined} The layer id.
 * @private
 */
plugin.vectortools.nodeToId_ = function(node) {
  var layer = os.fn.mapNodeToLayer(node);
  return layer ? layer.getId() : undefined;
};


/**
 * Map a tree node to data source.
 * @param {os.structs.ITreeNode} node The tree node.
 * @return {os.source.ISource|undefined} The data source.
 * @private
 */
plugin.vectortools.nodeToSource_ = function(node) {
  var layer = os.fn.mapNodeToLayer(node);
  if (layer) {
    return os.osDataManager.getSource(layer.getId()) || undefined;
  }

  return undefined;
};


/**
 * Map a tree node to Copy Layer command.
 * @param {os.structs.ITreeNode} node The tree node.
 * @return {os.command.ICommand|undefined}
 * @private
 */
plugin.vectortools.nodeToCopyCommand_ = function(node) {
  var layer = os.fn.mapNodeToLayer(node);
  return layer ? new plugin.vectortools.CopyLayer(layer.getId()) : undefined;
};
