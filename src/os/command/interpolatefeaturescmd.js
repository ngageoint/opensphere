goog.module('os.command.InterpolateFeatures');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');
const OLVectorLayer = goog.require('ol.layer.Vector');
const State = goog.require('os.command.State');
const interpolate = goog.require('os.interpolate');
const {getMapContainer} = goog.require('os.map.instance');
const VectorSource = goog.require('os.source.Vector');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Abstract command for performing selections on a source
 *
 * @implements {ICommand}
 */
class InterpolateFeatures {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @inheritDoc
     */
    this.state = State.READY;

    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Interpolate all vectors';

    /**
     * @inheritDoc
     */
    this.details = null;
  }

  /**
   * Checks if the command is ready to execute
   *
   * @return {boolean}
   */
  canExecute() {
    if (this.state !== State.READY) {
      this.details = 'Command not in ready state.';
      return false;
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;
      this.interpolate();
      this.state = State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * @protected
   */
  interpolate() {
    var layers = getMapContainer().getLayers();

    for (var i = 0, n = layers.length; i < n; i++) {
      var layer = layers[i];

      if (layer instanceof OLVectorLayer) {
        var source = layer.getSource();

        if (source) {
          var features = source.getFeatures();

          // we can't merely change the features in place because os.source.Vector has an override
          // that removes the listener on feature change (because it is otherwise not used. Instead,
          // we'll remove, interpolate, and re-add the features.

          if (features.length) {
            source.clear(true);
            asserts.assert(features.length > 0);

            if (!(source instanceof VectorSource)) {
              for (var j = 0, m = features.length; j < m; j++) {
                interpolate.interpolateFeature(features[j]);
              }
            }

            source.addFeatures(features);
          }
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  revert() {
    // this is intentionally empty
    this.state = State.READY;
    return true;
  }
}

exports = InterpolateFeatures;
