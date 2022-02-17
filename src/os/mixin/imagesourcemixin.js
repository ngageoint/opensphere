goog.declareModuleId('os.mixin.ImageSource');

import PropertyChangeEvent from '../events/propertychangeevent.js';
import osImplements from '../implements.js';
import ILoadingSource from '../ol/source/iloadingsource.js';

const Delay = goog.require('goog.async.Delay');
const ImageState = goog.require('ol.ImageState');
const {remove} = goog.require('ol.array');
const ImageSource = goog.require('ol.source.Image');
const Source = goog.require('ol.source.Source');

const OLImage = goog.requireType('ol.Image');
const ImageBase = goog.requireType('ol.ImageBase');
const Event = goog.requireType('ol.events.Event');
const Projection = goog.requireType('ol.proj.Projection');
const {TileFilterFn} = goog.requireType('os.tile');


/*
 * Adds ILoadingSource functionality to the base Openlayers Image source class. This allows for the loading
 * spinner on the layer to be displayed.
 */
osImplements(ImageSource, ILoadingSource.ID);


/**
 * Set of filters to run against images that are loaded by this source.
 * @type {Array<TileFilterFn>}
 * @protected
 */
ImageSource.prototype.imageFilters = null;


/**
 * Adds a tile filter function to the source.
 * @param {function(Uint8ClampedArray, number, number)} fn
 */
ImageSource.prototype.addImageFilter = function(fn) {
  if (!this.imageFilters) {
    this.imageFilters = [];
  }

  if (!this.imageFilters.includes(fn)) {
    this.imageFilters.push(fn);
  }
};


/**
 * Removes a tile filter function from the source.
 * @param {function(Uint8ClampedArray, number, number)} fn
 */
ImageSource.prototype.removeImageFilter = function(fn) {
  if (!this.imageFilters) {
    this.imageFilters = [];
  }

  remove(this.imageFilters, fn);
};


/**
 * Gets the set of tile filters.
 * @return {Array<function(Uint8ClampedArray, number, number)>}
 */
ImageSource.prototype.getImageFilters = function() {
  if (!this.imageFilters) {
    this.imageFilters = [];
  }

  return this.imageFilters;
};


/**
 * Get the image element for this source.
 *
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Projection} projection Projection.
 * @return {ImageBase} Single image.
 */
ImageSource.prototype.originalGetImage = ImageSource.prototype.getImage;


/**
 * Get the image element for this source.
 *
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Projection} projection Projection.
 * @return {ImageBase} Single image.
 *
 * @suppress {accessControls}
 * @suppress {duplicate}
 */
ImageSource.prototype.getImage = function(extent, resolution, pixelRatio, projection) {
  const image = this.originalGetImage(extent, resolution, pixelRatio, projection);
  if (image) {
    image.olSource = this;
  }
  return image;
};


/**
 * Loading flag for the image layer.
 * @type {boolean}
 * @private
 */
ImageSource.prototype.loading_ = false;


/**
 * Counter for the number of loading images.
 * @type {number}
 * @private
 */
ImageSource.prototype.numLoadingImages_ = 0;


/**
 * Delay to prevent rapid firing loading events.
 * @type {?Delay}
 * @private
 */
ImageSource.prototype.loadingDelay_ = null;


/**
 * @inheritDoc
 */
ImageSource.prototype.disposeInternal = function() {
  Source.prototype.disposeInternal.call(this);

  if (this.loadingDelay_) {
    this.loadingDelay_.dispose();
    this.loadingDelay_ = null;
  }
};


/**
 * Gets a loading delay for preventing the spinner from bouncing in and out of the view.
 * @return {?Delay}
 * @protected
 */
ImageSource.prototype.getLoadingDelay = function() {
  if (!this.loadingDelay_ && !this.isDisposed()) {
    this.loadingDelay_ = new Delay(this.fireLoadingEvent_, 500, this);
  }

  return this.loadingDelay_;
};


/**
 * Fires an event to indicate a loading change.
 * @private
 */
ImageSource.prototype.fireLoadingEvent_ = function() {
  if (!this.isDisposed()) {
    this.dispatchEvent(new PropertyChangeEvent('loading', this.loading_, !this.loading_));
  }
};


/**
 * @return {boolean}
 */
ImageSource.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @param {boolean} value
 */
ImageSource.prototype.setLoading = function(value) {
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
ImageSource.prototype.decrementLoading = function() {
  this.numLoadingImages_--;

  if (this.numLoadingImages_ === 0) {
    this.setLoading(false);
  }
};


/**
 * Increments the loading counter.
 */
ImageSource.prototype.incrementLoading = function() {
  this.numLoadingImages_++;

  if (this.numLoadingImages_ === 1) {
    this.setLoading(true);
  }
};


/**
 * Handle image change events.
 * @param {Event} event Event.
 * @protected
 *
 * @suppress {accessControls}
 */
ImageSource.prototype.originalHandleImageChange = ImageSource.prototype.handleImageChange;


/**
 * Handle image change events.
 * @param {Event} event Event.
 * @protected
 *
 * @suppress {duplicate}
 */
ImageSource.prototype.handleImageChange = function(event) {
  const image = /** @type {OLImage} */ (event.target);
  switch (image.getState()) {
    case ImageState.LOADING:
      this.incrementLoading();
      break;
    case ImageState.LOADED:
      this.decrementLoading();
      break;
    case ImageState.ERROR:
      this.decrementLoading();
      break;
    default:
      // pass
  }

  this.originalHandleImageChange(event);
};
