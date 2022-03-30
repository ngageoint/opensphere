goog.declareModuleId('os.im.FeatureImporter');

import Feature from 'ol/src/Feature.js';
import {getUid} from 'ol/src/util.js';

import DataEventType from '../data/event/dataeventtype.js';
import RecordField from '../data/recordfield.js';
import * as dispatcher from '../dispatcher.js';
import {simplifyGeometry} from '../feature/feature.js';
import Fields from '../fields/fields.js';
import {DESC_REGEXP} from '../fields/index.js';
import osImplements from '../implements.js';
import ITime from '../time/itime.js';
import {sanitize} from '../ui/ui.js';
import Importer from './importer.js';

const log = goog.require('goog.log');

const GoogEvent = goog.requireType('goog.events.Event');
const Logger = goog.requireType('goog.log.Logger');
const {default: IParser} = goog.requireType('os.parse.IParser');


/**
 * Importer that prepares {@link Feature} objects for spatial/temporal display.
 *
 * @template T
 */
export default class FeatureImporter extends Importer {
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
