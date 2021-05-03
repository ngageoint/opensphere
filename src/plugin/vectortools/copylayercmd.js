goog.module('plugin.vectortools.CopyLayer');
goog.module.declareLegacyNamespace();

const MapContainer = goog.require('os.MapContainer');
const VectorSource = goog.require('os.source.Vector');
const vectortools = goog.require('plugin.vectortools');

const AbstractSource = goog.require('os.command.AbstractSource');
const State = goog.require('os.command.State');
const ICommand = goog.requireType('os.command.ICommand');


/**
 * Command for copying a vector layer
 *
 * @implements {ICommand}
 */
class CopyLayer extends AbstractSource {
  /**
   * Constructor.
   * @param {!string} sourceId The data source ID to copy
   * @param {plugin.vectortools.Options=} opt_options The feature options
   */
  constructor(sourceId, opt_options) {
    super(sourceId);
    this.title = 'Copy Layer';
    this.newLayerId_ = '';
    this.options_ = opt_options;
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      var s = this.getSource();
      if (s instanceof VectorSource) {
        var source = /** @type {os.source.Vector} */ (s);

        // add the new layer
        var newLayer = vectortools.addNewLayer(source.getId());

        // keep track of its ID, use it for revert
        var newSource = /** @type {os.source.Vector} */ (newLayer.getSource());
        this.newLayerId_ = newSource.getId();

        // get a cloning function and use it to do the feature copy
        var cloneFunc = vectortools.getFeatureCloneFunction(this.newLayerId_);
        var features = vectortools.getFeatures(source, this.options_);
        newSource.addFeatures(features.map(cloneFunc));

        this.state = State.SUCCESS;
        return true;
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    // remove the layer by the layerId
    MapContainer.getInstance().removeLayer(this.newLayerId_);
    this.state = State.READY;
    return true;
  }
}

exports = CopyLayer;
