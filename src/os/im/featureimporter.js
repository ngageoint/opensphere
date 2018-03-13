goog.provide('os.im.FeatureImporter');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.Feature');
goog.require('os.data.RecordField');
goog.require('os.feature');
goog.require('os.im.Importer');
goog.require('os.implements');
goog.require('os.parse.IParser');
goog.require('os.time.ITime');



/**
 * Importer that prepares {@link ol.Feature} objects for spatial/temporal display.
 * @param {os.parse.IParser<T>} parser The parser
 * @extends {os.im.Importer}
 * @constructor
 * @template T
 */
os.im.FeatureImporter = function(parser) {
  os.im.FeatureImporter.base(this, 'constructor', parser);

  /**
   * If HTML content should be trusted on imported data.
   * @type {boolean}
   * @protected
   */
  this.trustHTML = false;

  os.dispatcher.listen(os.data.event.DataEventType.MAX_FEATURES, this.onMaxFeaturesReached_, false, this);
};
goog.inherits(os.im.FeatureImporter, os.im.Importer);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.im.FeatureImporter.LOGGER_ = goog.log.getLogger('os.im.FeatureImporter');


/**
 * @inheritDoc
 */
os.im.FeatureImporter.prototype.disposeInternal = function() {
  os.dispatcher.unlisten(os.data.event.DataEventType.MAX_FEATURES, this.onMaxFeaturesReached_, false, this);
  os.im.FeatureImporter.base(this, 'disposeInternal');
};


/**
 * Get if imported HTML content should be trusted.
 * @return {boolean} If imported HTML content should be trusted.
 */
os.im.FeatureImporter.prototype.getTrustHTML = function() {
  return this.trustHTML;
};


/**
 * Set if imported HTML content should be trusted.
 * @param {boolean} value If imported HTML content should be trusted.
 */
os.im.FeatureImporter.prototype.setTrustHTML = function(value) {
  this.trustHTML = value;
};


/**
 * @inheritDoc
 * @suppress {accessControls} For speed.
 */
os.im.FeatureImporter.prototype.addItemInternal = function(item) {
  var feature;
  if (item instanceof ol.Feature) {
    feature = /** @type {!ol.Feature} */ (item);
  }

  if (feature) {
    // make sure an id is set on the feature
    if (!feature.id_) {
      feature.setId(ol.getUid(feature) + '');
    } else {
      // this works around inadvertant duplicate IDs, but maintains the original ID
      var realId = feature.id_;
      feature.setId(ol.getUid(feature) + '');
      feature.values_[os.Fields.ID] = realId;
    }

    // simplify the geometry if possible
    os.feature.simplifyGeometry(feature);
  }

  if (item) {
    this.sanitize(item);
    os.im.FeatureImporter.base(this, 'addItemInternal', item);
  }

  if (feature) {
    // if our internal time field is set, but not a time instance, move it to an uppercased field to avoid conflicts
    var time = feature.values_[os.data.RecordField.TIME];
    if (time != null && !os.implements(time, os.time.ITime.ID)) {
      feature.set(os.data.RecordField.TIME.toUpperCase(), time);
      feature.set(os.data.RecordField.TIME, undefined);
    }

    feature.enableEvents();
  }
};


/**
 * @type {?angular.$sanitize}
 */
os.im.FeatureImporter.sanitize = null;


/**
 * @type {RegExp}
 * @const
 * @private
 */
os.im.FeatureImporter.NEEDS_SANITIZE_ = /[<>]/;


/**
 * @param {T} item The item
 * @protected
 * @suppress {accessControls}
 */
os.im.FeatureImporter.prototype.sanitize = function(item) {
  if (os.im.FeatureImporter.sanitize) {
    var props = item.values_;

    for (var key in props) {
      var value = props[key];

      if (typeof value === 'string' && os.im.FeatureImporter.NEEDS_SANITIZE_.test(value)) {
        // save the HTML description to its own property to control where it gets displayed
        if (this.trustHTML && !props[os.data.RecordField.HTML_DESCRIPTION] && os.fields.DESC_REGEXP.test(key)) {
          props[os.data.RecordField.HTML_DESCRIPTION] = value;
        }

        try {
          props[key] = os.im.FeatureImporter.sanitize(value).trim();
        } catch (e) {
          var msg = 'Could not sanitize value';
          goog.log.error(os.im.FeatureImporter.LOGGER_, msg);
          props[key] = 'Error: ' + msg;
        }
      }
    }
  }
};


/**
 * Listens for the max features reached event and stops all further processing
 * @param {goog.events.Event} event
 * @private
 */
os.im.FeatureImporter.prototype.onMaxFeaturesReached_ = function(event) {
  this.reset();
};
