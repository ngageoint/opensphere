goog.declareModuleId('os.command.AbstractFeatureStyle');

import EventType from '../../action/eventtype.js';
import DataManager from '../../data/datamanager.js';
import * as dispatcher from '../../dispatcher.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import {PropertyChange} from '../../feature/feature.js';
import {getMapContainer} from '../../map/mapinstance.js';
import * as osStyle from '../../style/style.js';
import StyleType from '../../style/styletype.js';
import AbstractStyle from '../abstractstylecmd.js';
import State from '../state.js';

const asserts = goog.require('goog.asserts');
const GoogEvent = goog.require('goog.events.Event');


/**
 * Commands for feature style changes should extend this class
 * @template T
 */
export default class AbstractFeatureStyle extends AbstractStyle {
  /**
   * Constructor.
   * @param {string} layerId
   * @param {string} featureId
   * @param {T} value
   * @param {T=} opt_oldValue
   */
  constructor(layerId, featureId, value, opt_oldValue) {
    super(layerId, value, opt_oldValue);

    /**
     * @type {string}
     * @protected
     */
    this.featureId = featureId;
    this.updateOldValue();
  }

  /**
   * @inheritDoc
   */
  canExecute() {
    if (!this.featureId) {
      this.state = State.ERROR;
      this.details = 'Feature id not provided.';
      return false;
    }

    return super.canExecute();
  }

  /**
   * @inheritDoc
   */
  applyValue(configs, value) {
    var feature = /** @type {Feature} */ (this.getFeature());
    var source = DataManager.getInstance().getSource(this.layerId);
    asserts.assert(source, 'source must be defined');

    // update feature styles. don't use forEachFeature or the rbush will throw an error due to feature changes
    // while iterating
    osStyle.setFeatureStyle(/** @type {!Feature} */ (feature));
    dispatcher.getInstance().dispatchEvent(EventType.SAVE_FEATURE);
    // feature.dispatchEvent(new os.events.PropertyChangeEvent('icons'));

    // if we are using the timeline with fade enabled, we need to reset objects with this style change
    source.refreshAnimationFade();
  }

  /**
   * @inheritDoc
   */
  finish(configs) {
    dispatcher.getInstance().dispatchEvent(new GoogEvent(EventType.REFRESH));
    var feature = /** @type {Feature} */ (this.getFeature());
    var layer = getMapContainer().getLayer(this.layerId);
    asserts.assert(layer, 'layer must be defined');
    osStyle.notifyStyleChange(layer, [feature]);
    feature.dispatchEvent(new PropertyChangeEvent(PropertyChange.STYLE));
  }

  /**
   * Get the layer configuration.
   *
   * @param {Feature} feature
   * @return {Array<Object>}
   * @protected
   */
  getFeatureConfigs(feature) {
    var configs = /** @type {Array<Object>|Object|undefined} */ (feature.get(StyleType.FEATURE));

    if (Array.isArray(configs)) {
      return configs;
    } else if (configs) {
      return [configs];
    }
    return null;
  }

  /**
   * @inheritDoc
   */
  setValue(value) {
    asserts.assert(value != null, 'style value must be defined');

    var feature = /** @type {Feature} */ (this.getFeature());
    var configs = this.getFeatureConfigs(feature);
    asserts.assert(configs, 'feature config must be defined');

    this.applyValue(configs, value);
    this.finish(configs);
  }

  /**
   * Gets the feature
   *
   * @return {Feature}
   */
  getFeature() {
    var feature = null;

    if (this.layerId != null && this.featureId != null) {
      var source = DataManager.getInstance().getSource(this.layerId);
      asserts.assert(source, 'source must be defined');

      feature = source.getFeatureById(this.featureId);
      asserts.assert(feature, 'feature must be defined');
    }

    return feature;
  }
}
