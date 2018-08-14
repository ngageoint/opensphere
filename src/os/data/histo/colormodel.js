goog.provide('os.data.histo.ColorMethod');
goog.provide('os.data.histo.ColorModel');

goog.require('goog.events.EventTarget');
goog.require('os.IPersistable');
goog.require('os.color');
goog.require('os.data.FeatureEvent');
goog.require('os.data.FeatureEventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.histo');
goog.require('os.histo.bin');
goog.require('os.source.PropertyChange');
goog.require('os.style');
goog.require('os.style.StyleType');


/**
 * Bin color methods.
 * @enum {number}
 */
os.data.histo.ColorMethod = {
  RESET: -1,
  NONE: 0,
  MANUAL: 1,
  AUTO_COLOR: 2,
  AUTO_COLOR_BY_COUNT: 3
};


/**
 * @typedef {function(number):!Array<string>}
 */
os.data.histo.GradientFn;


/**
 * The default gradient function, returning an HSL gradient that excludes red from the scheme.
 * @param {number} size The number of colors to return in the gradient
 * @return {!Array<string>} The color gradient
 * @private
 */
os.data.histo.defaultGradientFn_ = function(size) {
  return os.color.getHslGradient(size, 30, 330, true);
};



/**
 * Histogram for coloring features in a source.
 *
 * Do not instantiate this directly! Please use {@link os.source.Vector#createColorModel} to make sure the model is
 * created in the same window context as the source.
 *
 * @param {os.data.histo.GradientFn=} opt_gradientFn The gradient function to use when auto coloring
 * @extends {goog.events.EventTarget}
 * @implements {os.IPersistable}
 * @constructor
 */
os.data.histo.ColorModel = function(opt_gradientFn) {
  os.data.histo.ColorModel.base(this, 'constructor');

  /**
   * The histogram driving the color model.
   * @type {os.data.histo.SourceHistogram}
   * @private
   */
  this.histogram_ = null;

  /**
   * Bin color method
   * @type {os.data.histo.ColorMethod}
   * @private
   */
  this.colorMethod_ = os.data.histo.ColorMethod.NONE;

  /**
   * Map of bin labels to the applied color.
   * @type {Object<string, string>}
   * @private
   */
  this.binColors_ = {};

  /**
   * Map of manually colored bins to applied colors.
   * @type {Object<string, string>}
   * @private
   */
  this.manualBinColors_ = {};

  /**
   * Features that have been colored by the model.
   * @type {!Object<string, ol.Feature>}
   * @private
   */
  this.coloredFeatures_ = {};

  /**
   * The gradient function to use in auto coloring
   * @type {!os.data.histo.GradientFn}
   * @private
   */
  this.gradientFn_ = opt_gradientFn || os.data.histo.defaultGradientFn_;
};
goog.inherits(os.data.histo.ColorModel, goog.events.EventTarget);


/**
 * @inheritDoc
 */
os.data.histo.ColorModel.prototype.disposeInternal = function() {
  // reset colors first so the change event is handled
  this.setColorMethod(os.data.histo.ColorMethod.RESET);

  os.data.histo.ColorModel.base(this, 'disposeInternal');

  this.setHistogram(null);
};


/**
 * Get the histogram driving the color model.
 * @return {os.data.histo.SourceHistogram}
 */
os.data.histo.ColorModel.prototype.getHistogram = function() {
  return this.histogram_;
};


/**
 * Get the histogram driving the color model.
 * @param {os.data.histo.SourceHistogram} histogram
 */
os.data.histo.ColorModel.prototype.setHistogram = function(histogram) {
  if (this.histogram_) {
    // clean up listeners and decrement the reference count. if the count reaches zero, the histogram will dispose
    // itself so do not call dispose here!
    this.histogram_.unlisten(goog.events.EventType.CHANGE, this.applyColorMethod, false, this);
    this.histogram_.unlisten(os.data.histo.HistoEventType.BIN_CHANGE, this.onBinChange_, false, this);
    this.histogram_.decrementRefCount();
  }

  this.histogram_ = histogram;

  if (this.histogram_) {
    this.histogram_.listen(goog.events.EventType.CHANGE, this.applyColorMethod, false, this);
    this.histogram_.listen(os.data.histo.HistoEventType.BIN_CHANGE, this.onBinChange_, false, this);
    this.histogram_.incrementRefCount();
  }
};


/**
 * Handle a bin change on the histogram.
 * @param {goog.events.Event} event
 * @private
 */
os.data.histo.ColorModel.prototype.onBinChange_ = function(event) {
  // clear saved colors if the bin method changes, because the bin labels will change
  this.binColors_ = {};
};


/**
 * Get the results
 * @return {!Array<!os.data.histo.ColorBin>}
 * @protected
 */
os.data.histo.ColorModel.prototype.getResults = function() {
  return this.histogram_ ? this.histogram_.getResults() : [];
};


/**
 * Get the bin/color pairs currently applied by this color model.
 * @return {Object<string, string>}
 */
os.data.histo.ColorModel.prototype.getBinColors = function() {
  return this.binColors_;
};


/**
 * Return the current manual color object
 * @return {Object<string, string>}
 */
os.data.histo.ColorModel.prototype.getManualBinColors = function() {
  return this.manualBinColors_;
};


/**
 * Apply the old bin color scheme when swapping between sources
 * @param {Object<string, string>} colors
 */
os.data.histo.ColorModel.prototype.setManualBinColors = function(colors) {
  // Closure UID's were previously added to this map, causing `hasManualColors` to incorrectly return true. this will
  // clean them up during the restore call.
  goog.removeUid(colors);

  this.manualBinColors_ = colors;
  this.applyColorMethod();
};


/**
 * Get the histogram bin method.
 * @return {os.histo.IBinMethod<ol.Feature>}
 */
os.data.histo.ColorModel.prototype.getBinMethod = function() {
  return this.histogram_ ? this.histogram_.getBinMethod() : null;
};


/**
 * Get the data color method.
 * @return {os.data.histo.ColorMethod}
 */
os.data.histo.ColorModel.prototype.getColorMethod = function() {
  return this.colorMethod_;
};


/**
 * Returns whether there are manual colors applied to the model.
 * @return {boolean}
 */
os.data.histo.ColorModel.prototype.hasManualColors = function() {
  return !goog.object.isEmpty(this.manualBinColors_);
};


/**
 * Set the data color method. This will fire an event telling other histograms using the same source to stop coloring
 * features, since this histogram is taking control. Even reset events should do this to prevent other histograms from
 * coloring after a reset.
 *
 * The MANUAL color method does not get set to the member variable. Rather, it applies the parameters that come along
 * with it and those bins are tracked by the manualBinColors_ map.
 *
 * @param {os.data.histo.ColorMethod} value
 * @param {Array<!os.data.histo.ColorBin>=} opt_bins The bins to color, for manual color
 * @param {string=} opt_color The manual color
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.data.histo.ColorModel.prototype.setColorMethod = function(value, opt_bins, opt_color) {
  if (value !== os.data.histo.ColorMethod.MANUAL) {
    // clear out the manual bins if it's being set to not manual
    this.manualBinColors_ = {};
  }

  if (value != this.colorMethod_) {
    this.binColors_ = {};
  }

  // update the manual color map
  if (value == os.data.histo.ColorMethod.MANUAL && goog.isArray(opt_bins) && opt_color) {
    for (var i = 0, n = opt_bins.length; i < n; i++) {
      var label = opt_bins[i].getLabel();
      this.binColors_[label] = opt_color;
      this.manualBinColors_[label] = opt_color;
    }
  }

  this.colorMethod_ = value === os.data.histo.ColorMethod.MANUAL ? this.colorMethod_ : value;
  this.applyColorMethod();
};


/**
 * Applies the current color method.
 * @protected
 */
os.data.histo.ColorModel.prototype.applyColorMethod = function() {
  var oldColors = this.coloredFeatures_;
  this.coloredFeatures_ = {};

  switch (this.colorMethod_) {
    case os.data.histo.ColorMethod.RESET:
      // change the method to NONE for future calls, then reset the colors
      this.colorMethod_ = os.data.histo.ColorMethod.NONE;
      this.resetColor_();
      break;
    case os.data.histo.ColorMethod.AUTO_COLOR:
      this.autoColor_();
      this.cleanupOldColors_(oldColors);
      break;
    case os.data.histo.ColorMethod.AUTO_COLOR_BY_COUNT:
      this.autoColorByCount_();
      this.cleanupOldColors_(oldColors);
      break;
    case os.data.histo.ColorMethod.NONE:
    default:
      break;
  }

  if (this.hasManualColors()) {
    // apply any manual colors
    this.manualColor_();
  }

  this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.STYLE));
};


/**
 * Auto colors all features in the histogram.
 * @private
 */
os.data.histo.ColorModel.prototype.autoColor_ = function() {
  // reset the color map, autocolors will be populated below
  this.binColors_ = {};

  var bins = this.getResults();
  if (this.hasManualColors()) {
    // exclude any manually-colored bins from the autocolor
    bins = goog.array.filter(bins, function(bin) {
      return !this.manualBinColors_[bin.getLabel()];
    }, this);
  }

  if (bins && bins.length > 0) {
    var binColors = this.gradientFn_(bins.length);
    for (var i = 0, n = bins.length; i < n; i++) {
      var newColor = os.style.toRgbaString(binColors[i]);
      this.binColors_[bins[i].getLabel()] = newColor;
      this.colorFeatures_(bins[i].getItems(), newColor);
    }
  }
};


/**
 * Auto colors all features in the histogram by bin count.
 * @private
 */
os.data.histo.ColorModel.prototype.autoColorByCount_ = function() {
  // reset the color map. they'll be filled in with current values below
  this.binColors_ = {};

  var bins = this.getResults();
  if (bins && bins.length > 0) {
    var maxCount = 0;
    for (var i = 0, n = bins.length; i < n; i++) {
      maxCount = Math.max(maxCount, bins[i].getCount());
    }

    var binColors = os.color.getHslGradient(101, 30, 330);
    for (var i = 0, n = bins.length; i < n; i++) {
      var binCount = bins[i].getCount();
      var newColor = os.style.toRgbaString(binColors[Math.floor(binCount / maxCount * 100)]);
      this.binColors_[bins[i].getLabel()] = newColor;
      this.colorFeatures_(bins[i].getItems(), newColor);
    }
  }
};


/**
 * Manually colors all bins with a custom color defined. Does not reset the color map as these colors should be
 * applied after the autocolorings are done.
 * @private
 */
os.data.histo.ColorModel.prototype.manualColor_ = function() {
  var bins = this.getResults();
  for (var i = 0, n = bins.length; i < n; i++) {
    // only update bins with a custom color defined.
    var key = bins[i].getLabel();
    if (key in this.manualBinColors_) {
      // set features in this bin to the manual color
      var manualColor = this.manualBinColors_[key];
      this.binColors_[bins[i].getLabel()] = manualColor;
      this.colorFeatures_(bins[i].getItems(), manualColor);
    }
  }
};


/**
 * Clears bin colors and resets feature colors to the layer default.
 * @private
 */
os.data.histo.ColorModel.prototype.resetColor_ = function() {
  if (this.histogram_) {
    var source = this.histogram_.getSource();
    if (source) {
      // all features should be given the default color
      this.colorFeatures_(source.getFeatures(), undefined);
    }
    // if the histrogram is binning time ranges then force it to refresh on reset color
    var isRanges;
    try {
      isRanges = this.histogram_.getBinRanges();
    } catch (error) {
      isRanges = false;
    }
    if (isRanges) {
      this.histogram_.setBinRanges(true);
    }
  }
};


/**
 * Reset the color for features that were previously colored, but are no longer.
 * @param {!Object<string, ol.Feature>} oldColors Map of previously colored features
 * @private
 */
os.data.histo.ColorModel.prototype.cleanupOldColors_ = function(oldColors) {
  var toReset = [];
  for (var key in oldColors) {
    if (!(key in this.coloredFeatures_)) {
      toReset.push(oldColors[key]);
    }
  }

  this.colorFeatures_(toReset, undefined);
};


/**
 * Sets the color on a set of features.
 * @param {Array<ol.Feature>} features The features to update
 * @param {string=} opt_color The new feature color
 * @private
 *
 * @suppress {accessControls|checkTypes} To allow direct access to feature metadata.
 */
os.data.histo.ColorModel.prototype.colorFeatures_ = function(features, opt_color) {
  if (features && features.length > 0) {
    for (var j = 0, o = features.length; j < o; j++) {
      var oldColor = /** @type {string|undefined} */ (os.feature.getColor(features[j], null, null));
      if (oldColor != opt_color) {
        // set the color override on the feature and dispatch the event so UI's (bins) can update
        features[j].values_[os.data.RecordField.COLOR] = opt_color;

        var newColor = /** @type {string|undefined} */ (os.feature.getColor(features[j], null, null)) || undefined;
        features[j].dispatchFeatureEvent(os.data.FeatureEventType.COLOR, newColor, oldColor);
      }

      if (opt_color) {
        // track which features are being colored so we can reset the color on features that are no longer in a bin for
        // the attached histogram
        this.coloredFeatures_[features[j]['id']] = features[j];
      }
    }

    // update the style configs on the modified features
    os.style.setFeaturesStyle(features);
  }
};


/**
 * @inheritDoc
 */
os.data.histo.ColorModel.prototype.persist = function(opt_to) {
  var obj = opt_to || {};

  obj['colorMethod'] = this.colorMethod_;
  obj['manualColors'] = goog.object.clone(this.manualBinColors_);

  if (this.histogram_) {
    var binMethod = this.histogram_.getBinMethod();
    if (binMethod) {
      obj['binMethod'] = binMethod.persist();
    }
  }

  return obj;
};


/**
 * @inheritDoc
 */
os.data.histo.ColorModel.prototype.restore = function(config) {
  if (this.histogram_ && config['binMethod']) {
    var binMethod = os.histo.restoreMethod(config['binMethod']);
    if (binMethod) {
      binMethod.setValueFunction(os.feature.getField);

      this.histogram_.setBinMethod(binMethod);
    }
  }

  this.setColorMethod(config['colorMethod']);

  // set the manual colors last, because changing the color method might clear them
  if (config['manualColors']) {
    this.setManualBinColors(/** @type {!Object<string, string>} */ (goog.object.clone(config['manualColors'])));
  }
};
