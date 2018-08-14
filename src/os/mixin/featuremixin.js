/**
 * @fileoverview Modifications to {@link ol.Feature}.
 */
goog.provide('os.mixin.feature');

goog.require('ol.Feature');
goog.require('ol.style.Style');
goog.require('os.data.FeatureEvent');
goog.require('os.registerClass');


/**
 * Enable use of os.instanceOf to detect an ol.Feature.
 * @type {string}
 * @const
 */
ol.Feature.NAME = 'ol.Feature';
os.registerClass(ol.Feature.NAME, ol.Feature);


/**
 * The accessors provided on ol.Object are never used, so skip that code path entirely.
 * @override
 * @suppress {accessControls}
 */
ol.Feature.prototype.set = function(key, value, opt_silent) {
  if (value === undefined) {
    delete this.values_[key];
  } else {
    this.values_[key] = value;
  }
};


/**
 * The accessors provided on ol.Object are never used, so skip that code path entirely.
 * @override
 * @suppress {accessControls}
 */
ol.Feature.prototype.unset = function(key, opt_silent) {
  delete this.values_[key];
};


/**
 * For the love of god, don't clone the style!!
 * @return {!ol.Feature} The clone.
 * @suppress {duplicate|accessControls}
 */
ol.Feature.prototype.clone = function() {
  var clone = new ol.Feature();
  clone.setProperties(this.values_, true);
  clone.setGeometryName(this.getGeometryName());
  var geometry = this.getGeometry();
  if (geometry != null) {
    clone.setGeometry(geometry.clone());
  }
  clone.setId(this.getId());
  return clone;
};


/**
 * We don't use style functions, and creating a new one every time the style changes is expensive. This is a much
 * simpler version that still does its job.
 * @param {ol.style.Style|Array.<ol.style.Style>|
 *     ol.FeatureStyleFunction} style Style for this feature.
 * @suppress {accessControls|duplicate}
 */
ol.Feature.prototype.setStyle = function(style) {
  this.style_ = style;
  this.styleFunction_ = style ? this.getStyleFn : undefined;
};


/**
 * Returns a style array for the feature. This is used by the above replacement for setStyle instead of creating a new
 * function every time setStyle is called.
 * @param {number} resolution
 * @return {Array<ol.style.Style>}
 * @suppress {accessControls}
 */
ol.Feature.prototype.getStyleFn = function(resolution) {
  if (this.style_ instanceof ol.style.Style) {
    return [this.style_];
  } else if (typeof this.style_ == 'function') {
    var style = this.style_(resolution);
    return style ? (style instanceof ol.style.Style ? [style] : style) : [];
  } else {
    return this.style_;
  }
};


/**
 * @inheritDoc
 */
ol.Feature.prototype.eventsEnabled = false;


/**
 * The SlickGrid unique 'id' field for the next feature. Number.MAX_SAFE_INTEGER on modern browsers/machines
 * is 9007199254740991, which is way more than enough.
 *
 * @type {number}
 */
ol.Feature.nextId = 0;


/**
 * This makes the ID field work for SlickGrid
 *
 * @param {number|string|undefined} id Set a unique id for this feature.
 * The id may be used to retrieve a feature from a vector source with the
 * {@link ol.source.Vector#getFeatureById} method.
 * @suppress {accessControls|duplicate|checkTypes}
 */
ol.Feature.prototype.setId = function(id) {
  this.id_ = id;

  if (this['id'] == null) {
    this['id'] = ol.Feature.nextId;
    ol.Feature.nextId++;
  }

  this.changed();
};


/**
 * Fire feature event that won't be handled by OL3. This is added so the event will be created in the same application
 * context as the feature, allowing instanceof to work in Closure's internal event dispatcher.
 * @param {string} type The event type to fire
 * @param {*} newVal The new value
 * @param {*} oldVal The old value
 * @suppress {checkTypes}
 */
ol.Feature.prototype.dispatchFeatureEvent = function(type, newVal, oldVal) {
  os.dispatcher.dispatchEvent(new os.data.FeatureEvent(type, this['id'], newVal, oldVal));
};
