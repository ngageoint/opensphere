goog.declareModuleId('os.data.histo.ColorModel');

import * as osColor from '../../color.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import * as osFeature from '../../feature/feature.js';
import * as histo from '../../histo/histo.js';
import PropertyChange from '../../source/propertychange.js';
import * as osStyle from '../../style/style.js';
import FeatureEventType from '../featureeventtype.js';
import RecordField from '../recordfield.js';
import ColorMethod from './colormethod.js';
import * as osDataHisto from './histogramutils.js';

const googArray = goog.require('goog.array');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const googObject = goog.require('goog.object');

const {default: IPersistable} = goog.requireType('os.IPersistable');
const {default: ColorBin} = goog.requireType('os.data.histo.ColorBin');
const {default: SourceHistogram} = goog.requireType('os.data.histo.SourceHistogram');
const {default: IBinMethod} = goog.requireType('os.histo.IBinMethod');


/**
 * The default gradient function, returning an HSL gradient that excludes red from the scheme.
 *
 * @param {number} size The number of colors to return in the gradient
 * @return {!Array<string>} The color gradient
 */
const defaultGradientFn = (size) => osColor.getHslGradient(size, 30, 330, true);


/**
 * Histogram for coloring features in a source.
 *
 * Do not instantiate this directly! Please use {@link os.source.Vector#createColorModel} to make sure the model is
 * created in the same window context as the source.
 *
 * @implements {IPersistable}
 */
export default class ColorModel extends EventTarget {
  /**
   * Constructor.
   * @param {osDataHisto.GradientFn=} opt_gradientFn The gradient function to use when auto coloring
   */
  constructor(opt_gradientFn) {
    super();

    /**
     * The histogram driving the color model.
     * @type {SourceHistogram}
     * @private
     */
    this.histogram_ = null;

    /**
     * Bin color method
     * @type {ColorMethod}
     * @private
     */
    this.colorMethod_ = ColorMethod.NONE;

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
     * @type {!Object<string, Feature>}
     * @private
     */
    this.coloredFeatures_ = {};

    /**
     * The gradient function to use in auto coloring
     * @type {!osDataHisto.GradientFn}
     * @private
     */
    this.gradientFn_ = opt_gradientFn || defaultGradientFn;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    // reset colors first so the change event is handled
    this.setColorMethod(ColorMethod.RESET);

    super.disposeInternal();

    this.setHistogram(null);
  }

  /**
   * Get the histogram driving the color model.
   *
   * @return {SourceHistogram}
   */
  getHistogram() {
    return this.histogram_;
  }

  /**
   * Get the histogram driving the color model.
   *
   * @param {SourceHistogram} histogram
   */
  setHistogram(histogram) {
    if (this.histogram_) {
      // clean up listeners and decrement the reference count. if the count reaches zero, the histogram will dispose
      // itself so do not call dispose here!
      this.histogram_.unlisten(GoogEventType.CHANGE, this.applyColorMethod, false, this);
      this.histogram_.unlisten(osDataHisto.HistoEventType.BIN_CHANGE, this.onBinChange_, false, this);
      this.histogram_.decrementRefCount();
    }

    this.histogram_ = histogram;

    if (this.histogram_) {
      this.histogram_.listen(GoogEventType.CHANGE, this.applyColorMethod, false, this);
      this.histogram_.listen(osDataHisto.HistoEventType.BIN_CHANGE, this.onBinChange_, false, this);
      this.histogram_.incrementRefCount();
    }
  }

  /**
   * Handle a bin change on the histogram.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onBinChange_(event) {
    // clear saved colors if the bin method changes, because the bin labels will change
    this.binColors_ = {};
  }

  /**
   * Get the results
   *
   * @return {!Array<!ColorBin>}
   * @protected
   */
  getResults() {
    return this.histogram_ ? this.histogram_.getResults() : [];
  }

  /**
   * Get the bin/color pairs currently applied by this color model.
   *
   * @return {Object<string, string>}
   * @suppress {accessControls} To allow direct access to bin data.
   */
  getAllBinColors() {
    // start with bins and overrides from this histogram on top of that
    const colors = Object.assign({}, this.binColors_, this.manualBinColors_);
    const lookup = {};

    for (const value of Object.values(colors)) {
      lookup[osColor.toHexString(value)] = true;
    }

    // get any missing the colors out of the folds from external histograms
    return this.getResults().reduce(function(all, bin) {
      if (bin.colorCounts_) {
        for (var k in bin.colorCounts_) {
          if (!lookup[k]) {
            var label = [osDataHisto.OVERRIDE_LABEL, k].join(' ');
            all[label] = osStyle.toRgbaString(k);
            lookup[k] = true;
          }
        }
      }
      return all;
    }, colors);
  }

  /**
   * Get the bin/color pairs currently applied by this color model.
   *
   * @return {Object<string, string>}
   */
  getBinColors() {
    return this.binColors_;
  }

  /**
   * Return the current manual color object
   *
   * @return {Object<string, string>}
   */
  getManualBinColors() {
    return this.manualBinColors_;
  }

  /**
   * Apply the old bin color scheme when swapping between sources
   *
   * @param {Object<string, string>} colors
   */
  setManualBinColors(colors) {
    // Closure UID's were previously added to this map, causing `hasManualColors` to incorrectly return true. this will
    // clean them up during the restore call.
    goog.removeUid(colors);

    this.manualBinColors_ = colors;

    // this.applyColorMethod(); // already called by setColorMethod(), so don't double-up the re-draws for all the charts
  }

  /**
   * Get the histogram bin method.
   *
   * @return {IBinMethod<Feature>}
   */
  getBinMethod() {
    return this.histogram_ ? this.histogram_.getBinMethod() : null;
  }

  /**
   * Get the data color method.
   *
   * @return {ColorMethod}
   */
  getColorMethod() {
    return this.colorMethod_;
  }

  /**
   * Returns whether there are manual colors applied to the model.
   *
   * @return {boolean}
   */
  hasManualColors() {
    return !googObject.isEmpty(this.manualBinColors_);
  }

  /**
   * Set the data color method. This will fire an event telling other histograms using the same source to stop coloring
   * features, since this histogram is taking control. Even reset events should do this to prevent other histograms from
   * coloring after a reset.
   *
   * The MANUAL color method does not get set to the member variable. Rather, it applies the parameters that come along
   * with it and those bins are tracked by the manualBinColors_ map.
   *
   * @param {ColorMethod} value
   * @param {Array<!ColorBin>=} opt_bins The bins to color, for manual color
   * @param {string=} opt_color The manual color
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  setColorMethod(value, opt_bins, opt_color) {
    if (value !== ColorMethod.MANUAL) {
      // clear out the manual bins if it's being set to not manual
      this.manualBinColors_ = {};
    }

    if (value != this.colorMethod_) {
      this.binColors_ = {};
    }

    // update the manual color map
    if (value == ColorMethod.MANUAL && Array.isArray(opt_bins) && opt_color) {
      for (var i = 0, n = opt_bins.length; i < n; i++) {
        var label = opt_bins[i].getLabel();
        this.binColors_[label] = opt_color;
        this.manualBinColors_[label] = opt_color;
      }
    }

    // keep the underlying method when simply adjusting a few colors manually
    this.colorMethod_ = value === ColorMethod.MANUAL ? this.colorMethod_ : value;
    this.applyColorMethod();
  }

  /**
   * Applies the current color method.
   *
   * @protected
   */
  applyColorMethod() {
    var oldColors = this.coloredFeatures_;
    this.coloredFeatures_ = {};

    switch (this.colorMethod_) {
      case ColorMethod.RESET:
        // change the method to NONE for future calls, then reset the colors
        this.colorMethod_ = ColorMethod.NONE;
        this.resetColor_();
        break;
      case ColorMethod.AUTO_COLOR:
        this.autoColor_();
        this.cleanupOldColors_(oldColors);
        break;
      case ColorMethod.AUTO_COLOR_BY_COUNT:
        this.autoColorByCount_();
        this.cleanupOldColors_(oldColors);
        break;
      case ColorMethod.NONE:
      default:
        break;
    }

    if (this.hasManualColors()) {
      // apply any manual colors
      this.manualColor_();
    }

    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.STYLE));
  }

  /**
   * Auto colors all features in the histogram.
   *
   * @private
   */
  autoColor_() {
    // reset the color map, autocolors will be populated below
    this.binColors_ = {};

    var bins = this.getResults();
    if (this.hasManualColors()) {
      // exclude any manually-colored bins from the autocolor
      bins = googArray.filter(bins, function(bin) {
        return !this.manualBinColors_[bin.getLabel()];
      }, this);
    }

    if (bins && bins.length > 0) {
      var binColors = this.gradientFn_(bins.length);
      for (var i = 0, n = bins.length; i < n; i++) {
        var newColor = osStyle.toRgbaString(binColors[i]);
        this.binColors_[bins[i].getLabel()] = newColor;
        this.colorFeatures_(bins[i].getItems(), newColor);
      }
    }
  }

  /**
   * Auto colors all features in the histogram by bin count.
   *
   * @private
   */
  autoColorByCount_() {
    // reset the color map. they'll be filled in with current values below
    this.binColors_ = {};

    var bins = this.getResults();
    if (bins && bins.length > 0) {
      var maxCount = 0;
      for (var i = 0, n = bins.length; i < n; i++) {
        maxCount = Math.max(maxCount, bins[i].getCount());
      }

      var binColors = osColor.getHslGradient(101, 30, 330);
      for (var i = 0, n = bins.length; i < n; i++) {
        var binCount = bins[i].getCount();
        var newColor = osStyle.toRgbaString(binColors[Math.floor(binCount / maxCount * 100)]);
        this.binColors_[bins[i].getLabel()] = newColor;
        this.colorFeatures_(bins[i].getItems(), newColor);
      }
    }
  }

  /**
   * Manually colors all bins with a custom color defined. Does not reset the color map as these colors should be
   * applied after the autocolorings are done.
   *
   * @private
   */
  manualColor_() {
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
  }

  /**
   * Clears bin colors and resets feature colors to the layer default.
   *
   * @private
   */
  resetColor_() {
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
  }

  /**
   * Reset the color for features that were previously colored, but are no longer.
   *
   * @param {!Object<string, Feature>} oldColors Map of previously colored features
   * @private
   */
  cleanupOldColors_(oldColors) {
    var toReset = [];
    for (var key in oldColors) {
      if (!(key in this.coloredFeatures_)) {
        toReset.push(oldColors[key]);
      }
    }

    this.colorFeatures_(toReset, undefined);
  }

  /**
   * Sets the color on a set of features.
   *
   * @param {Array<Feature>} features The features to update
   * @param {string=} opt_color The new feature color
   * @private
   *
   * @suppress {accessControls|checkTypes} To allow direct access to feature metadata.
   */
  colorFeatures_(features, opt_color) {
    if (features && features.length > 0) {
      for (var j = 0, o = features.length; j < o; j++) {
        var oldColor = /** @type {string|undefined} */ (osFeature.getColor(features[j], null, null));
        if (oldColor != opt_color) {
          // set the color override on the feature and dispatch the event so UI's (bins) can update
          features[j].values_[RecordField.COLOR] = opt_color;

          var newColor = /** @type {string|undefined} */ (osFeature.getColor(features[j], null, null)) || undefined;
          features[j].dispatchFeatureEvent(FeatureEventType.COLOR, newColor, oldColor);
        }

        if (opt_color) {
          // track which features are being colored so we can reset the color on features that are no longer in a bin for
          // the attached histogram
          this.coloredFeatures_[features[j]['id']] = features[j];
        }
      }

      // update the style configs on the modified features
      osStyle.setFeaturesStyle(features);
    }
  }

  /**
   * Sets the color on a set of features.
   *
   * @param {Array<Feature>} features The features to update
   * @param {string=} opt_color The new feature color
   *
   */
  colorFeatures(features, opt_color) {
    if (opt_color) {
      // add a manual entry for this color
      var label = [osDataHisto.OVERRIDE_LABEL, osColor.toHexString(opt_color)].join(' ');
      this.manualBinColors_[label] = opt_color;
    }
    this.colorFeatures_(features, opt_color);
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    var obj = opt_to || {};

    obj['colorMethod'] = this.colorMethod_;
    obj['manualColors'] = {};

    // only grab manual bin colors, because features will be different next load/search
    for (const [label, color] of Object.entries(/** @type {!Object<?, string>} */ (this.manualBinColors_))) {
      if (label.indexOf(osDataHisto.OVERRIDE_LABEL) == -1) obj['manualColors'][label] = color;
    }

    if (this.histogram_) {
      var binMethod = this.histogram_.getBinMethod();
      if (binMethod) {
        obj['binMethod'] = binMethod.persist();
      }
    }

    return obj;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    if (this.histogram_ && config['binMethod']) {
      var binMethod = histo.restoreMethod(config['binMethod']);
      if (binMethod) {
        binMethod.setValueFunction(osFeature.getField);

        this.histogram_.setBinMethod(binMethod);
      }
    }

    var colorMethod = config['colorMethod'];

    if (config['manualColors']) {
      this.setManualBinColors(/** @type {!Object<string, string>} */ (googObject.clone(config['manualColors'])));

      // since manual overrides maintain the original color method, (manualColors && NONE) actually means Manual
      if (colorMethod == ColorMethod.NONE) colorMethod = ColorMethod.MANUAL;
    }

    this.setColorMethod(colorMethod);
  }
}
