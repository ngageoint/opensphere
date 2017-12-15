goog.provide('plugin.vectortools.VectorToolsPlugin');

goog.require('os.action.EventType');
goog.require('os.command.ParallelCommand');
goog.require('os.data.OSDataManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.MenuOptions');
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
  if (os.action.layer && os.action.layer.manager) {
    var manager = os.action.layer.manager;

    var labels = ['', 'All', 'Shown', 'Selected', 'Unselected', 'Hidden'];
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

    parents.forEach(function(p) {
      for (var i = 1, n = labels.length; i < n; i++) {
        var action = new os.ui.action.Action(p.type + ' ' + i, labels[i], p.tooltip, p.icon, null,
            new os.ui.action.MenuOptions(os.action.layer.GroupType.TOOLS + '/' + p.label));
        action.enableWhen(plugin.vectortools.isVector);
        manager.addAction(action);
        manager.listen(action.getEventType(), plugin.vectortools.onAction);
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
 * @param {os.ui.action.ActionEvent} evt
 */
plugin.vectortools.onAction = function(evt) {
  var parts = evt.type.split(/\s+/);
  var type = parts[0];

  if (parts.length > 1) {
    plugin.vectortools.option = /** @type {plugin.vectortools.Options} */ (parseInt(parts[1], 10));
  }

  var context = evt.getContext();
  if (context && context.length > 0) {
    switch (type) {
      case plugin.vectortools.EventType.COPY:
        var sources = context.map(plugin.vectortools.nodeToSource_);
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

        var cmds = context.map(plugin.vectortools.nodeTo_);
        cmds = cmds.filter(goog.isDefAndNotNull);

        if (cmds.length) {
          var cmd = new os.command.ParallelCommand();
          cmd.setCommands(cmds);
          os.command.CommandProcessor.getInstance().addCommand(cmd);
        }

        break;
      case plugin.vectortools.EventType.MERGE:
      case plugin.vectortools.EventType.JOIN:
        var layerIds = context.map(plugin.vectortools.nodeToId_);
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
 * @param {os.data.LayerNode} node The layer node
 * @return {?string} The layer id
 * @private
 */
plugin.vectortools.nodeToId_ = function(node) {
  var layer = node.getLayer();
  if (layer) {
    return layer.getId();
  }

  return null;
};


/**
 * @param {os.data.LayerNode} node The layer node
 * @return {?os.source.ISource} The source
 * @private
 */
plugin.vectortools.nodeToSource_ = function(node) {
  var layer = node.getLayer();
  if (layer) {
    var source = os.osDataManager.getSource(layer.getId());
    if (source) {
      return source;
    }
  }

  return null;
};


/**
 * @param {os.data.LayerNode} node
 * @return {?os.command.ICommand}
 * @private
 */
plugin.vectortools.nodeTo_ = function(node) {
  var layer = node.getLayer();
  if (layer) {
    return new plugin.vectortools.CopyLayer(layer.getId());
  }
  return null;
};
