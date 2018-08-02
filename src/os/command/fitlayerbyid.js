goog.provide('os.command.FitLayerByID');
goog.require('ol.events');
goog.require('os.command.AbstractSyncCommand');
goog.require('os.command.State');



/**
 * Fits the map to the layer that is specified by the passeed id. If the layer
 * is not yet created listeners will be set up to fit once the layer is loaded.
 * @extends {os.command.AbstractSyncCommand}
 * @param {!string} id
 * @constructor
 */
os.command.FitLayerByID = function(id) {
  os.command.FitLayerByID.base(this, 'constructor');
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
};
goog.inherits(os.command.FitLayerByID, os.command.AbstractSyncCommand);


/**
 * Clean up listeners.
 * @private
 */
os.command.FitLayerByID.prototype.cleanup_ = function() {
  os.dispatcher.unlisten(os.events.LayerEventType.ADD, this.onAdd_, false, this);

  if (this.listenKey_) {
    ol.events.unlistenByKey(this.listenKey_);
    this.listenKey_ = null;
  }
};


/**
 * @inheritDoc
 */
os.command.FitLayerByID.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;

  this.cleanup_();

  // saving current position
  var view = os.MapContainer.getInstance().getMap().getView();
  this.savedRes_ = view.getResolution();
  this.savedCenter_ = view.getCenter();
  this.savedRotation_ = view.getRotation();

  var layer = /** @type {os.layer.Vector} */ (os.MapContainer.getInstance().getLayer(this.layerId_));
  if (layer) {
    // If layer is still loading we need to wait until it finishes to get the extent
    if (layer.isLoading()) {
      this.listenKey_ = ol.events.listen(layer, goog.events.EventType.PROPERTYCHANGE, this.onPropChange_, this);
    } else {
      this.fit_(layer);
    }
  } else {
    os.dispatcher.listen(os.events.LayerEventType.ADD, this.onAdd_, false, this);
  }

  return this.finish();
};


/**
 * @inheritDoc
 */
os.command.FitLayerByID.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  this.cleanup_();

  // reset view
  var view = os.MapContainer.getInstance().getMap().getView();
  view.setCenter(this.savedCenter_);
  view.setResolution(this.savedRes_);
  view.setRotation(this.savedRotation_);

  return os.command.FitLayerByID.base(this, 'revert');
};


/**
 * Method that will be registered to the layer add event
 * @param {os.events.LayerEvent} e
 * @private
 */
os.command.FitLayerByID.prototype.onAdd_ = function(e) {
  var layer = /** @type {os.layer.Vector} */ (e.layer);
  // make sure its the right layer
  if (layer.getId() != this.layerId_) {
    return;
  }

  this.cleanup_();

  // If layer is still loading we need to wait until it finishes to get the extent
  if (layer.isLoading()) {
    this.listenKey_ = ol.events.listen(layer, goog.events.EventType.PROPERTYCHANGE, this.onPropChange_, this);
  } else {
    this.fit_(layer);
  }
};


/**
 * Method that will be registered to the layer property change event
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.command.FitLayerByID.prototype.onPropChange_ = function(e) {
  var layer = /** @type {os.layer.Vector} */ (e.currentTarget);
  if (!layer.isLoading()) {
    this.cleanup_();
    this.fit_(layer);
  }
};


/**
 * Saves position and fits layer to map
 * @param {ol.layer.Layer|ol.Feature} layer
 * @private
 */
os.command.FitLayerByID.prototype.fit_ = function(layer) {
  // saving most recent position
  var view = os.MapContainer.getInstance().getMap().getView();
  this.savedRes_ = view.getResolution();
  this.savedCenter_ = view.getCenter();
  this.savedRotation_ = view.getRotation();

  // fit to map
  var extent = /** @type {ol.source.Vector} */ (layer.getSource()).getExtent();
  if (view && extent) {
    view.fit(extent);
  }
};
