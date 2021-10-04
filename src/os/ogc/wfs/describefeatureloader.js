goog.declareModuleId('os.ogc.wfs.DescribeFeatureLoader');

import Request from '../../net/request.js';
import {getException} from '../ogc.js';
import DescribeFeatureTypeParser from './describefeaturetypeparser.js';

const Uri = goog.require('goog.Uri');
const QueryData = goog.require('goog.Uri.QueryData');
const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');

const Logger = goog.requireType('goog.log.Logger');
const {default: FeatureType} = goog.requireType('os.ogc.wfs.FeatureType');


/**
 */
export default class DescribeFeatureLoader extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {FeatureType}
     * @private
     */
    this.featureType_ = null;

    /**
     * @type {!QueryData}
     * @private
     */
    this.params_ = new QueryData();

    /**
     * @type {Request}
     * @private
     */
    this.request_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.typename_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.url_ = null;
  }

  /**
   * @return {?string}
   */
  getUrl() {
    return this.url_;
  }

  /**
   * @param {?string} value
   */
  setUrl(value) {
    var i = value.indexOf('?');
    if (i > -1) {
      this.url_ = value.substring(0, i);

      if (!this.typename_) {
        var qd = new QueryData(value.substring(i + 1), false);
        if (qd) {
          // flipping ignoreCase from false to true will lowercase all keys
          qd.setIgnoreCase(true);

          if (qd.containsKey('typename')) {
            this.typename_ = /** @type {string} */ (qd.get('typename'));
          }
        }

        if (!this.params_.getKeys().length) {
          this.setParams(qd);
        }
      }
    } else {
      this.url_ = value;
    }
  }

  /**
   * @return {?string}
   */
  getTypename() {
    return this.typename_;
  }

  /**
   * @param {?string} value
   */
  setTypename(value) {
    this.typename_ = value;
  }

  /**
   * @param {!QueryData} value
   */
  setParams(value) {
    this.params_ = value;
  }

  /**
   * @return {FeatureType}
   */
  getFeatureType() {
    return this.featureType_;
  }

  /**
   * Load the DescribeFeatureType.
   */
  load() {
    if (this.typename_ && this.url_) {
      if (!this.params_.containsKey('SERVICE')) {
        this.params_.set('SERVICE', 'WFS');
      }
      if (!this.params_.containsKey('VERSION')) {
        this.params_.set('VERSION', '1.1.0');
      }
      if (!this.params_.containsKey('TYPENAME')) {
        this.params_.set('TYPENAME', this.typename_);
      }
      this.params_.set('REQUEST', 'DescribeFeatureType');

      var uri = new Uri(this.url_);
      uri.setQueryData(this.params_);

      this.request_ = new Request(uri);
      this.request_.listen(EventType.SUCCESS, this.onDescribeComplete_, false, this);
      this.request_.listen(EventType.ERROR, this.onDescribeError_, false, this);
      this.request_.setValidator(getException);

      log.info(logger, 'Loading DescribeFeatureType for "' + this.typename_ + '" on ' + this.url_);

      this.request_.load();
    } else {
      this.dispatchEvent(new GoogEvent(EventType.COMPLETE));
      log.error(logger,
          'DescribeFeatureType missing url and/or typename!');
    }
  }

  /**
   * @param {GoogEvent} event
   * @private
   */
  onDescribeComplete_(event) {
    var req = /** @type {Request} */ (event.target);
    req.removeAllListeners();

    var response = /** @type {string} */ (req.getResponse());
    var parser = new DescribeFeatureTypeParser();
    var featureTypes = parser.parse(response);
    if (featureTypes && featureTypes.length > 0) {
      this.featureType_ = featureTypes[0];
    } else {
      log.error(logger, 'Unable to parse DescribeFeatureType for "' + this.typename_ + '" on ' + this.url_ + '!');
    }

    this.dispatchEvent(new GoogEvent(EventType.COMPLETE));
  }

  /**
   * @param {GoogEvent} event
   * @private
   */
  onDescribeError_(event) {
    var req = /** @type {Request} */ (event.target);
    req.removeAllListeners();

    // TODO: Get the full error from the request!
    log.error(logger, 'Failed to load DescribeFeatureType for "' + this.typename_ + '" on ' + this.url_ + '!');

    this.dispatchEvent(new GoogEvent(EventType.COMPLETE));
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ogc.wfs.DescribeFeatureLoader');
