goog.declareModuleId('plugin.vectortools.CopyLayer');

import AbstractSource from '../../os/command/abstractsourcecmd.js';
import State from '../../os/command/state.js';
import MapContainer from '../../os/mapcontainer.js';
import VectorSource from '../../os/source/vectorsource.js';
import * as vectortools from './vectortools.js';


/**
 * Command for copying a vector layer
 *
 * @implements {ICommand}
 */
export default class CopyLayer extends AbstractSource {
  /**
   * Constructor.
   * @param {!string} sourceId The data source ID to copy
   * @param {Options=} opt_options The feature options
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
        var source = /** @type {VectorSource1} */ (s);

        // add the new layer
        var newLayer = vectortools.addNewLayer(source.getId());

        // keep track of its ID, use it for revert
        var newSource = /** @type {VectorSource1} */ (newLayer.getSource());
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
