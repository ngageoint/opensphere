goog.declareModuleId('os.command.NonQueryClear');

import {getMapContainer} from '../map/mapinstance.js';
import {getAreaManager} from '../query/queryinstance.js';
import State from './state.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Command for clearing spatial queries on the map.
 *
 * @implements {ICommand}
 */
export default class NonQueryClear {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @inheritDoc
     */
    this.isAsync = false;

    /**
     * @inheritDoc
     */
    this.title = 'Clear Non-query Features';

    /**
     * @inheritDoc
     */
    this.details = null;

    /**
     * @inheritDoc
     */
    this.state = State.READY;

    /**
     * @type {!Array<!ol.Feature>}
     * @private
     */
    this.features_ = [];
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;

    var features = getMapContainer().getFeatures();
    var featuresToRemove = [];
    var am = getAreaManager();

    if (features.length > 0) {
      for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        if (!am.get(feature)) {
          featuresToRemove.push(feature);
        }
      }
    }

    getMapContainer().removeFeatures(featuresToRemove);
    this.features_ = featuresToRemove;

    this.state = State.SUCCESS;
    return true;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;
    getMapContainer().addFeatures(this.features_);
    this.features_.length = 0;
    this.state = State.READY;
    return true;
  }
}
