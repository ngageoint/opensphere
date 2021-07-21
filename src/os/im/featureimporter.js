goog.module('os.im.FeatureImporter');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const {getUid} = goog.require('ol');
const Feature = goog.require('ol.Feature');
const dispatcher = goog.require('os.Dispatcher');
const Fields = goog.require('os.Fields');
const RecordField = goog.require('os.data.RecordField');
const DataEventType = goog.require('os.data.event.DataEventType');
const {simplifyGeometry} = goog.require('os.feature');
const {DESC_REGEXP} = goog.require('os.fields');
const Importer = goog.require('os.im.Importer');
const osImplements = goog.require('os.implements');
const ITime = goog.require('os.time.ITime');
const {sanitize} = goog.require('os.ui');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const IParser = goog.requireType('os.parse.IParser');


/**
 * Importer that prepares {@link Feature} objects for spatial/temporal display.
 *
 * @template T
 */
class FeatureImporter extends Importer {
  /**
   * Constructor.
   * @param {IParser<T>} parser The parser
   */
  constructor(parser) {
    super(parser);

    /**
     * If HTML content should be trusted on imported data.
     * @type {boolean}
     * @protected
     */
    this.trustHTML = false;

    dispatcher.getInstance().listen(DataEventType.MAX_FEATURES, this.onMaxFeaturesReached_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    dispatcher.getInstance().unlisten(DataEventType.MAX_FEATURES, this.onMaxFeaturesReached_, false, this);
    super.disposeInternal();
  }

  /**
   * Get if imported HTML content should be trusted.
   *
   * @return {boolean} If imported HTML content should be trusted.
   */
  getTrustHTML() {
    return this.trustHTML;
  }

  /**
   * Set if imported HTML content should be trusted.
   *
   * @param {boolean} value If imported HTML content should be trusted.
   */
  setTrustHTML(value) {
    this.trustHTML = value;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} For speed.
   */
  addItemInternal(item) {
    var feature;
    if (item instanceof Feature) {
      feature = /** @type {!Feature} */ (item);
    }

    if (feature) {
      // make sure an id is set on the feature
      if (!feature.id_) {
        feature.setId(getUid(feature) + '');
      } else {
        // this works around inadvertant duplicate IDs, but maintains the original ID
        var realId = feature.id_;
        feature.setId(getUid(feature) + '');

        // set the ID field only if it wasn't already set
        if (feature.values_[Fields.ID] == null) {
          feature.values_[Fields.ID] = realId;
        }
      }

      // simplify the geometry if possible
      simplifyGeometry(feature);
    }

    if (item) {
      this.sanitize(item);
      super.addItemInternal(item);
    }

    if (feature) {
      // if our internal time field is set, but not a time instance, move it to an uppercased field to avoid conflicts
      var time = feature.values_[RecordField.TIME];
      if (time != null && !osImplements(time, ITime.ID)) {
        feature.set(RecordField.TIME.toUpperCase(), time);
        feature.set(RecordField.TIME, undefined);
      }

      feature.enableEvents();
    }
  }

  /**
   * @param {T} item The item
   * @protected
   * @suppress {accessControls}
   */
  sanitize(item) {
    var props = item.values_;

    for (var key in props) {
      var value = props[key];

      if (typeof value === 'string' && needsSanitize.test(value)) {
        // save the HTML description to its own property to control where it gets displayed
        if (this.trustHTML && !props[RecordField.HTML_DESCRIPTION] && DESC_REGEXP.test(key)) {
          props[RecordField.HTML_DESCRIPTION] = value;
        }

        try {
          props[key] = sanitize(value).trim();
        } catch (e) {
          var msg = 'Could not sanitize value';
          log.error(logger, msg);
          props[key] = 'Error: ' + msg;
        }
      }
    }
  }

  /**
   * Listens for the max features reached event and stops all further processing
   *
   * @param {GoogEvent} event
   * @private
   */
  onMaxFeaturesReached_(event) {
    this.reset();
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.im.FeatureImporter');

/**
 * @type {RegExp}
 */
const needsSanitize = /[<>]/;

exports = FeatureImporter;
