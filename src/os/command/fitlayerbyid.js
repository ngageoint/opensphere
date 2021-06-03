goog.module('os.command.FitLayerByID');
goog.module.declareLegacyNamespace();

const GoogEventType = goog.require('goog.events.EventType');
const events = goog.require('ol.events');
const dispatcher = goog.require('os.Dispatcher');
const MapContainer = goog.require('os.MapContainer');
const AbstractSyncCommand = goog.require('os.command.AbstractSyncCommand');
const State = goog.require('os.command.State');
const LayerEventType = goog.require('os.events.LayerEventType');


/**
 * Fits the map to the layer that is specified by the passeed id. If the layer
 * is not yet created listeners will be set up to fit once the layer is loaded.
 */
class FitLayerByID extends AbstractSyncCommand {
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
      events.unlistenByKey(this.listenKey_);
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
    var view = MapContainer.getInstance().getMap().getView();
    this.savedRes_ = view.getResolution();
    this.savedCenter_ = view.getCenter();
    this.savedRotation_ = view.getRotation();

    var layer = /** @type {os.layer.Vector} */ (MapContainer.getInstance().getLayer(this.layerId_));
    if (layer) {
      // If layer is still loading we need to wait until it finishes to get the extent
      if (layer.isLoading()) {
        this.listenKey_ = events.listen(layer, GoogEventType.PROPERTYCHANGE, this.onPropChange_, this);
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
    var view = MapContainer.getInstance().getMap().getView();
    view.setCenter(this.savedCenter_);
    view.setResolution(this.savedRes_);
    view.setRotation(this.savedRotation_);

    return super.revert();
  }

  /**
   * Method that will be registered to the layer add event
   *
   * @param {os.events.LayerEvent} e
   * @private
   */
  onAdd_(e) {
    var layer = /** @type {os.layer.Vector} */ (e.layer);
    // make sure its the right layer
    if (layer.getId() != this.layerId_) {
      return;
    }

    this.cleanup_();

    // If layer is still loading we need to wait until it finishes to get the extent
    if (layer.isLoading()) {
      this.listenKey_ = events.listen(layer, GoogEventType.PROPERTYCHANGE, this.onPropChange_, this);
    } else {
      this.fit_(layer);
    }
  }

  /**
   * Method that will be registered to the layer property change event
   *
   * @param {os.events.PropertyChangeEvent} e
   * @private
   */
  onPropChange_(e) {
    var layer = /** @type {os.layer.Vector} */ (e.currentTarget);
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
    var view = MapContainer.getInstance().getMap().getView();
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

exports = FitLayerByID;
