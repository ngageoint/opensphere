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
 * Set of filters to run against images that are loaded by this source.
 * @type {Array<function(Array<number>, number, number)>}
 * @protected
 */
ol.source.Image.prototype.imageFilters = null;

/**
 * The filtered copy of the canvas.
 * @type {HTMLCanvasElement}
 * @private
 */
this.filtered_ = null;


/**
 * @inheritDoc
 */
ol.source.Image.prototype.addImageFilter = function(fn) {
  if (!this.imageFilters) {
    this.imageFilters = [];
  }

  goog.array.insert(this.imageFilters, fn);
  this.applyImageFilters();
};


/**
 * @inheritDoc
 */
ol.source.Image.prototype.removeImageFilter = function(fn) {
  if (!this.imageFilters) {
    this.imageFilters = [];
  }

  ol.array.remove(this.imageFilters, fn);
  this.applyImageFilters();
};


/**
 * @inheritDoc
 */
ol.source.Image.prototype.getImageFilters = function() {
  if (!this.imageFilters) {
    this.imageFilters = [];
  }

  return this.imageFilters;
};


/**
 * Get the image element for this source.
 *
 * @inheritDoc
 * @suppress {accessControls}
 */
ol.source.Image.prototype.getImage = function() {
  if (this.image_ && this.image_.width && this.image_.height) {
    var filterFns = this.getImageFilters();
    if (filterFns.length > 0) {
      if (!this.filtered_) {
        // create a cached copy of the filtered image
        this.filtered_ = this.filterImage(this.image_, filterFns);
      }

      return this.filtered_;
    }
  }

  return this.image_;
};


/**
 * Resets the cached image. Allows the filters to be reapplied on the next render call.
 */
ol.source.Image.prototype.reset = function() {
  this.filtered_ = null;
};


/**
 * @inheritDoc
 */
ol.source.Image.prototype.applyImageFilters = function() {
  var image = this.getImage();
  if (image) {
    image.reset();
  }
};


/**
 * Applies a set of filter functions to an image and returns a new, filtered copy.
 *
 * @param {HTMLCanvasElement|Image} image The image to filter
 * @param {Array<Function>} filterFns The filter functions to apply
 * @return {HTMLCanvasElement} A new, filtered copy of the image canvas
 */
ol.source.Image.filterImage = function(image, filterFns) {
  var context = ol.dom.createCanvasContext2D(image.width, image.height);
  context.drawImage(image, 0, 0);

  var canvas = context.canvas;
  var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  var data = imageData.data;

  // apply each filter function to the image data
  filterFns.forEach(function(fn) {
    fn(data, canvas.width, canvas.height);
  });
  context.putImageData(imageData, 0, 0);
  return canvas;
};


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
  ol.source.Source.prototype.disposeInternal.call(this);

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
