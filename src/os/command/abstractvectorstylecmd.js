goog.declareModuleId('os.command.AbstractVectorStyle');

import DataManager from '../data/datamanager.js';
import {getMapContainer} from '../map/mapinstance.js';
import * as osStyle from '../style/style.js';
import StyleManager from '../style/stylemanager_shim.js';
import AbstractStyle from './abstractstylecmd.js';

const asserts = goog.require('goog.asserts');

const {default: VectorLayer} = goog.requireType('os.layer.Vector');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * Commands for tile style changes should extend this class
 *
 *
 * @template T
 */
export default class AbstractVectorStyle extends AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {T} value
   * @param {T=} opt_oldValue
   */
  constructor(layerId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);
    this.updateOldValue();
  }

  /**
   * @inheritDoc
   */
  getLayerConfig(layer) {
    return layer ? StyleManager.getInstance().getLayerConfig(layer.getId()) : null;
  }

  /**
   * @inheritDoc
   */
  applyValue(config, value) {
    var source = /** @type {VectorSource} */ (DataManager.getInstance().getSource(this.layerId));
    asserts.assert(source, 'source must be defined');

    // update feature styles. don't use forEachFeature or the rbush will throw an error due to feature changes
    // while iterating
    osStyle.setFeaturesStyle(source.getFeatures());

    // if we are using the timeline with fade enabled, we need to reset objects with this style change
    source.refreshAnimationFade();
  }

  /**
   * @inheritDoc
   */
  finish(config) {
    var layer = /** @type {VectorLayer} */ (getMapContainer().getLayer(this.layerId));
    asserts.assert(layer);
    osStyle.notifyStyleChange(layer);
  }
}
