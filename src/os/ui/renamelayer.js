goog.provide('os.ui.renamelayer');
goog.require('os.command.CommandProcessor');
goog.require('os.command.RenameLayer');
goog.require('os.layer.ILayer');
goog.require('os.ui.window.confirmTextDirective');


/**
 * Launches a rename layer dialog for the provided layer
 * @param {os.layer.ILayer} layer
 */
os.ui.renamelayer.launchRenameDialog = function(layer) {
  if (layer) {
    os.ui.window.launchConfirmText({
      confirm: goog.partial(os.ui.renamelayer.addRenameLayer, layer),
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
 * @param {!os.layer.ILayer} layer
 * @param {string} newName
 */
os.ui.renamelayer.addRenameLayer = function(layer, newName) {
  var rename = new os.command.RenameLayer(layer, newName, layer.getTitle());
  os.command.CommandProcessor.getInstance().addCommand(rename);
};
