goog.provide('os.mixin.ImageSource');

goog.require('goog.Uri');
goog.require('goog.async.Delay');
goog.require('goog.events');
goog.require('ol.events.Event');
goog.require('ol.source.Image');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.ol.source.ILoadingSource');


/*
 * Adds ILoadingSource functionality to the base Openlayers Image source class. This allows for the loading
 * spinner on the layer to be displayed.
 */
os.implements(ol.source.Image, os.ol.source.ILoadingSource.ID);


/**
 * Loading flag for the image layer.
 * @type {boolean}
 * @private
 */
ol.source.Image.prototype.loading_ = false;


/**
 * Counter for the number of loading images.
 * @type {number}
 * @private
 */
ol.source.Image.prototype.numLoadingImages_ = 0;


/**
 * Delay to prevent rapid firing loading events.
 * @type {?goog.async.Delay}
 * @private
 */
ol.source.Image.prototype.loadingDelay_ = null;


/**
 * @inheritDoc
 */
ol.source.Image.prototype.disposeInternal = function() {
  ol.source.Image.prototype.disposeInternal.call(this);

  if (this.loadingDelay_) {
    this.loadingDelay_.dispose();
    this.loadingDelay_ = null;
  }
};


/**
 * Gets a loading delay for preventing the spinner from bouncing in and out of the view.
 * @return {?goog.async.Delay}
 * @protected
 */
ol.source.Image.prototype.getLoadingDelay = function() {
  if (!this.loadingDelay_ && !this.isDisposed()) {
    this.loadingDelay_ = new goog.async.Delay(this.fireLoadingEvent_, 500, this);
  }

  return this.loadingDelay_;
};


/**
 * Fires an event to indicate a loading change.
 * @private
 */
ol.source.Image.prototype.fireLoadingEvent_ = function() {
  if (!this.isDisposed()) {
    this.dispatchEvent(new os.events.PropertyChangeEvent('loading', this.loading_, !this.loading_));
  }
};


/**
 * @return {boolean}
 */
ol.source.Image.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @param {boolean} value
 */
ol.source.Image.prototype.setLoading = function(value) {
  if (this.loading_ !== value) {
    this.loading_ = value;
    var delay = this.getLoadingDelay();

    if (delay) {
      if (this.loading_) {
        // always notify the UI when the layer starts loading
        delay.fire();
      } else {
        // add a delay when notifying the UI loading is complete in case it starts loading again soon. this prevents
        // flickering of the loading state, particularly when using Cesium.
        delay.start();
        this.numLoadingImages_ = 0;
      }
    }
  }
};


/**
 * Decrements the loading counter.
 */
ol.source.Image.prototype.decrementLoading = function() {
  this.numLoadingImages_--;

  if (this.numLoadingImages_ === 0) {
    this.setLoading(false);
  }
};


/**
 * Increments the loading counter.
 */
ol.source.Image.prototype.incrementLoading = function() {
  this.numLoadingImages_++;

  if (this.numLoadingImages_ === 1) {
    this.setLoading(true);
  }
};


/**
 * Handle image change events.
 * @param {ol.events.Event} event Event.
 * @protected
 *
 * @suppress {accessControls}
 */
ol.source.Image.prototype.originalHandleImageChange = ol.source.Image.prototype.handleImageChange;


/**
 * Handle image change events.
 * @param {ol.events.Event} event Event.
 * @protected
 *
 * @suppress {duplicate}
 */
ol.source.Image.prototype.handleImageChange = function(event) {
  const image = /** @type {ol.Image} */ (event.target);
  switch (image.getState()) {
    case ol.ImageState.LOADING:
      this.incrementLoading();
      break;
    case ol.ImageState.LOADED:
      this.decrementLoading();
      break;
    case ol.ImageState.ERROR:
      this.decrementLoading();
      break;
    default:
      // pass
  }

  this.originalHandleImageChange(event);
};
