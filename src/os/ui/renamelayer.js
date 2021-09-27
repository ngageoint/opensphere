goog.declareModuleId('os.ui.renamelayer');

import * as ConfirmTextUI from './window/confirmtext.js';

const CommandProcessor = goog.require('os.command.CommandProcessor');
const RenameLayer = goog.require('os.command.RenameLayer');

const ILayer = goog.requireType('os.layer.ILayer');


/**
 * Launches a rename layer dialog for the provided layer
 *
 * @param {ILayer} layer
 */
export const launchRenameDialog = function(layer) {
  if (layer) {
    ConfirmTextUI.launchConfirmText({
      confirm: goog.partial(addRenameLayer, layer),
      defaultValue: layer.getTitle(),
      prompt: 'Please choose a layer name:',
      select: true,
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        icon: 'fa fa-i-cursor',
        label: 'Rename Layer'
      })
    });
  }
};

/**
 * Add a command to the command processor to rename a layer
 *
 * @param {!ILayer} layer
 * @param {string} newName
 */
export const addRenameLayer = function(layer, newName) {
  var rename = new RenameLayer(layer, newName, layer.getTitle());
  CommandProcessor.getInstance().addCommand(rename);
};
