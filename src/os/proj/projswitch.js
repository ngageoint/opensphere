goog.declareModuleId('os.proj.switch');

import Tile from 'ol/src/layer/Tile.js';
import {equivalent, get} from 'ol/src/proj.js';

import AbstractCommandSet from '../command/abstractcommandset.js';
import LayerAdd from '../command/layeraddcmd.js';
import ActivateDescriptor from '../data/activatedescriptorcmd.js';
import LayerSyncDescriptor from '../data/layersyncdescriptor.js';
import * as osMap from '../map/map.js';
import {isRasterReprojectionEnabled} from './reprojection.js';
import ReprojectionWarning from './reprojectionwarning.js';
import SwitchProjection from './switchprojection.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');
const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * @param {!ol.layer.Layer} layer
 * @return {boolean}
 */
export const checkLayer = function(layer) {
  var source = layer.getSource();

  if (source) {
    var p1 = source.getProjection();
    var p2 = osMap.PROJECTION;

    if (layer instanceof Tile && p1 && p2 && !equivalent(p1, p2)) {
      if (isRasterReprojectionEnabled()) {
        ReprojectionWarning.getInstance().addTitle(/** @type {ILayer} */ (layer).getTitle());
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
export const checkCommand = function(command) {
  var sp = SwitchProjection.getInstance();

  if (!command.title || command.title.indexOf('Switch projection') === 0) {
    return true;
  } else if (command instanceof AbstractCommandSet) {
    var cmds = /** @type {AbstractCommandSet} */ (command).getCommands();
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
          var p2 = get(projections[i]);

          if (p2 && (isRasterReprojectionEnabled() || equivalent(p1, p2))) {
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
