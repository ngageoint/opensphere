goog.module('os.command.InterpolateFeatures');

const OLVectorLayer = goog.require('ol.layer.Vector');
const State = goog.require('os.command.State');
const interpolate = goog.require('os.interpolate');
const {getMapContainer} = goog.require('os.map.instance');

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
          if (features.length) {
            features.forEach((feature) => {
              interpolate.interpolateFeature(feature);
            });
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
