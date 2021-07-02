goog.module('os.proj.switch');
goog.module.declareLegacyNamespace();

const Tile = goog.require('ol.layer.Tile');
const olProj = goog.require('ol.proj');
const AbstractCommandSet = goog.require('os.command.AbstractCommandSet');
const LayerAdd = goog.require('os.command.LayerAdd');
const ActivateDescriptor = goog.require('os.data.ActivateDescriptor');
const LayerSyncDescriptor = goog.require('os.data.LayerSyncDescriptor');
const osMap = goog.require('os.map');
const {isRasterReprojectionEnabled} = goog.require('os.proj.reprojection');
const ReprojectionWarning = goog.require('os.proj.switch.ReprojectionWarning');
const SwitchProjection = goog.require('os.proj.switch.SwitchProjection');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * @param {!ol.layer.Layer} layer
 * @return {boolean}
 */
const checkLayer = function(layer) {
  var source = layer.getSource();

  if (source) {
    var p1 = source.getProjection();
    var p2 = osMap.PROJECTION;

    if (layer instanceof Tile && p1 && p2 && !olProj.equivalent(p1, p2)) {
      if (isRasterReprojectionEnabled()) {
        ReprojectionWarning.getInstance().addTitle(/** @type {os.layer.ILayer} */ (layer).getTitle());
      } else {
        SwitchProjection.getInstance().addLayer(layer);
        return false;
      }
    }
  }

  return true;
};

/**
 * @type {?ICommand}
 */
let rootCommand = null;

/**
 * @param {ICommand} command
 * @return {boolean}
 */
const checkCommand = function(command) {
  var sp = SwitchProjection.getInstance();

  if (!command.title || command.title.indexOf('Switch projection') === 0) {
    return true;
  } else if (command instanceof AbstractCommandSet) {
    var cmds = /** @type {os.command.AbstractCommandSet} */ (command).getCommands();
    var setRoot = !rootCommand;

    if (setRoot) {
      rootCommand = command;
    }

    var val = true;
    for (var i = 0, n = cmds.length; i < n && val; i++) {
      val = checkCommand(cmds[i]);
    }

    if (setRoot) {
      rootCommand = null;
    }

    return val;
  }

  var options = null;
  if (command instanceof LayerAdd) {
    options = /** @type {LayerAdd} */ (command).layerOptions;
  } else if (command instanceof ActivateDescriptor) {
    var d = /** @type {ActivateDescriptor} */ (command).getDescriptor();

    if (d instanceof LayerSyncDescriptor) {
      options = /** @type {LayerSyncDescriptor} */ (d).getOptions();
    }
  }

  var retVal = true;
  if (options) {
    options = Array.isArray(options) ? options : [options];
    options.forEach(function(opts) {
      var projections = /** @type {!Array<!string>} */ (opts['projections'] || []);

      if (!projections.length && opts['projection']) {
        projections.push(/** @type {!string} */ (opts['projection']));
      }

      if (projections.length) {
        var p1 = osMap.PROJECTION;

        for (i = 0, n = projections.length; i < n; i++) {
          var p2 = olProj.get(projections[i]);

          if (p2 && (isRasterReprojectionEnabled() || olProj.equivalent(p1, p2))) {
            retVal = true;
            return;
          }
        }

        sp.start(projections[0]);
        sp.addConfig(opts);

        retVal = false;
      }
    });
  }

  return retVal;
};

exports = {
  checkLayer,
  checkCommand
};
