goog.provide('os.command.InterpolateFeatures');

goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Abstract command for performing selections on a source
 * @implements {os.command.ICommand}
 * @constructor
 */
os.command.InterpolateFeatures = function() {
};


/**
 * @inheritDoc
 */
os.command.InterpolateFeatures.prototype.state = os.command.State.READY;


/**
 * @inheritDoc
 */
os.command.InterpolateFeatures.prototype.isAsync = false;


/**
 * @inheritDoc
 */
os.command.InterpolateFeatures.prototype.title = 'Interpolate all vectors';


/**
 * @inheritDoc
 */
os.command.InterpolateFeatures.prototype.details = null;


/**
 * Checks if the command is ready to execute
 * @return {boolean}
 */
os.command.InterpolateFeatures.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  return true;
};


/**
 * @inheritDoc
 */
os.command.InterpolateFeatures.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;
    this.interpolate();
    this.state = os.command.State.SUCCESS;
    return true;
  }

  return false;
};


/**
 * @protected
 */
os.command.InterpolateFeatures.prototype.interpolate = function() {
  var layers = os.MapContainer.getInstance().getLayers();

  for (var i = 0, n = layers.length; i < n; i++) {
    var layer = layers[i];

    if (layer instanceof ol.layer.Vector) {
      var source = layer.getSource();

      if (source) {
        var features = source.getFeatures();

        // we can't merely change the features in place because os.source.Vector has an override
        // that removes the listener on feature change (because it is otherwise not used. Instead,
        // we'll remove, interpolate, and re-add the features.

        if (features.length) {
          source.clear(true);
          goog.asserts.assert(features.length > 0);

          if (!(source instanceof os.source.Vector)) {
            for (var j = 0, m = features.length; j < m; j++) {
              os.interpolate.interpolateFeature(features[j]);
            }
          }

          source.addFeatures(features);
        }
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.command.InterpolateFeatures.prototype.revert = function() {
  // this is intentionally empty
  this.state = os.command.State.READY;
  return true;
};
