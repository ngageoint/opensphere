goog.declareModuleId('os.command.FitLayerByID');

import {listen, unlistenByKey} from 'ol/src/events.js';

import * as dispatcher from '../dispatcher.js';
import LayerEventType from '../events/layereventtype.js';
import {getMapContainer} from '../map/mapinstance.js';
import AbstractSyncCommand from './abstractsynccommand.js';
import State from './state.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: LayerEvent} = goog.requireType('os.events.LayerEvent');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: VectorLayer} = goog.requireType('os.layer.Vector');


/**
 * Fits the map to the layer that is specified by the passeed id. If the layer
 * is not yet created listeners will be set up to fit once the layer is loaded.
 */
export default class FitLayerByID extends AbstractSyncCommand {
  /**
   * Constructor.
   * @param {!string} id
   */
  constructor(id) {
    super();
    this.title = 'Fit Layer';

    /**
     * ID of the layer that is added
     * @type {string}
     * @private
     */
    this.layerId_ = id;
    /**
     * Layer event listen key
     * @type {?ol.EventsKey}
     * @private
     */
    this.listenKey_ = null;
    /**
     * @type {number|undefined}
     * @private
     */
    this.savedRes_;
    /**
     * @type {ol.Coordinate|undefined}
     * @private
     */
    this.savedCenter_;
    /**
     * @type {number}
     * @private
     */
    this.savedRotation_;
  }

  /**
   * Clean up listeners.
   *
   * @private
   */
  cleanup_() {
    dispatcher.getInstance().unlisten(LayerEventType.ADD, this.onAdd_, false, this);

    if (this.listenKey_) {
      unlistenByKey(this.listenKey_);
      this.listenKey_ = null;
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;

    this.cleanup_();

    // saving current position
    var view = getMapContainer().getMap().getView();
    this.savedRes_ = view.getResolution();
    this.savedCenter_ = view.getCenter();
    this.savedRotation_ = view.getRotation();

    var layer = /** @type {VectorLayer} */ (getMapContainer().getLayer(this.layerId_));
    if (layer) {
      // If layer is still loading we need to wait until it finishes to get the extent
      if (layer.isLoading()) {
        this.listenKey_ = listen(layer, GoogEventType.PROPERTYCHANGE, this.onPropChange_, this);
      } else {
        this.fit_(layer);
      }
    } else {
      dispatcher.getInstance().listen(LayerEventType.ADD, this.onAdd_, false, this);
    }

    return this.finish();
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    this.cleanup_();

    // reset view
    var view = getMapContainer().getMap().getView();
    view.setCenter(this.savedCenter_);
    view.setResolution(this.savedRes_);
    view.setRotation(this.savedRotation_);

    return super.revert();
  }

  /**
   * Method that will be registered to the layer add event
   *
   * @param {LayerEvent} e
   * @private
   */
  onAdd_(e) {
    var layer = /** @type {VectorLayer} */ (e.layer);
    // make sure its the right layer
    if (layer.getId() != this.layerId_) {
      return;
    }

    this.cleanup_();

    // If layer is still loading we need to wait until it finishes to get the extent
    if (layer.isLoading()) {
      this.listenKey_ = listen(layer, GoogEventType.PROPERTYCHANGE, this.onPropChange_, this);
    } else {
      this.fit_(layer);
    }
  }

  /**
   * Method that will be registered to the layer property change event
   *
   * @param {PropertyChangeEvent} e
   * @private
   */
  onPropChange_(e) {
    var layer = /** @type {VectorLayer} */ (e.currentTarget);
    if (!layer.isLoading()) {
      this.cleanup_();
      this.fit_(layer);
    }
  }

  /**
   * Saves position and fits layer to map
   *
   * @param {ol.layer.Layer|ol.Feature} layer
   * @private
   */
  fit_(layer) {
    // saving most recent position
    var view = getMapContainer().getMap().getView();
    this.savedRes_ = view.getResolution();
    this.savedCenter_ = view.getCenter();
    this.savedRotation_ = view.getRotation();

    // fit to map
    var extent = /** @type {ol.source.Vector} */ (layer.getSource()).getExtent();
    if (view && extent) {
      view.fit(extent);
    }
  }
}
