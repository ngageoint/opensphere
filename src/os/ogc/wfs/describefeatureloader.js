goog.provide('os.ogc.wfs.DescribeFeatureLoader');
goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('os.net.Request');
goog.require('os.ogc');
goog.require('os.ogc.wfs.DescribeFeatureTypeParser');
goog.require('os.ui.ogc.IFeatureType');



/**
 * @extends {goog.events.EventTarget}
 * @implements {os.ui.ogc.IFeatureType}
 * @constructor
 */
os.ogc.wfs.DescribeFeatureLoader = function() {
  os.ogc.wfs.DescribeFeatureLoader.base(this, 'constructor');

  /**
   * @type {os.ogc.wfs.FeatureType}
   * @private
   */
  this.featureType_ = null;

  /**
   * @type {!goog.Uri.QueryData}
   * @private
   */
  this.params_ = new goog.Uri.QueryData();

  /**
   * @type {os.net.Request}
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
};
goog.inherits(os.ogc.wfs.DescribeFeatureLoader, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ogc.wfs.DescribeFeatureLoader.LOGGER_ = goog.log.getLogger('os.ogc.wfs.DescribeFeatureLoader');


/**
 * @return {?string}
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.getUrl = function() {
  return this.url_;
};


/**
 * @param {?string} value
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.setUrl = function(value) {
  var i = value.indexOf('?');
  if (i > -1) {
    this.url_ = value.substring(0, i);

    if (!this.typename_) {
      var qd = new goog.Uri.QueryData(value.substring(i + 1), undefined, false);
      if (qd) {
        // flipping ignoreCase from false to true will lowercase all keys
        qd.setIgnoreCase(true);

        if (qd.containsKey('typename')) {
          this.typename_ = /** @type {string} */ (qd.get('typename'));
        }
      }
    }
  } else {
    this.url_ = value;
  }
};


/**
 * @return {?string}
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.getTypename = function() {
  return this.typename_;
};


/**
 * @param {?string} value
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.setTypename = function(value) {
  this.typename_ = value;
};


/**
 * @param {!goog.Uri.QueryData} value
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.setParams = function(value) {
  this.params_ = value;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.getFeatureType = function() {
  return this.featureType_;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.isFeatureTypeReady = function() {
  return !!this.featureType_;
};


/**
 * Load the DescribeFeatureType.
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.load = function() {
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

    var uri = new goog.Uri(this.url_);
    uri.setQueryData(this.params_);

    this.request_ = new os.net.Request(uri);
    this.request_.listen(goog.net.EventType.SUCCESS, this.onDescribeComplete_, false, this);
    this.request_.listen(goog.net.EventType.ERROR, this.onDescribeError_, false, this);
    this.request_.setValidator(os.ogc.getException);

    goog.log.info(os.ogc.wfs.DescribeFeatureLoader.LOGGER_,
        'Loading DescribeFeatureType for "' + this.typename_ + '" on ' + this.url_);

    this.request_.load();
  } else {
    this.dispatchEvent(new goog.events.Event(goog.net.EventType.COMPLETE));
    goog.log.error(os.ogc.wfs.DescribeFeatureLoader.LOGGER_,
        'DescribeFeatureType missing url and/or typename!');
  }
};


/**
 * @param {goog.events.Event} event
 * @private
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.onDescribeComplete_ = function(event) {
  var req = /** @type {os.net.Request} */ (event.target);
  req.removeAllListeners();

  var response = /** @type {string} */ (req.getResponse());
  var parser = new os.ogc.wfs.DescribeFeatureTypeParser();
  var featureTypes = parser.parse(response);
  if (featureTypes && featureTypes.length > 0) {
    this.featureType_ = featureTypes[0];
  } else {
    goog.log.error(os.ogc.wfs.DescribeFeatureLoader.LOGGER_,
        'Unable to parse DescribeFeatureType for "' + this.typename_ + '" on ' + this.url_ + '!');
  }

  this.dispatchEvent(new goog.events.Event(goog.net.EventType.COMPLETE));
};


/**
 * @param {goog.events.Event} event
 * @private
 */
os.ogc.wfs.DescribeFeatureLoader.prototype.onDescribeError_ = function(event) {
  var req = /** @type {os.net.Request} */ (event.target);
  req.removeAllListeners();

  // TODO: Get the full error from the request!
  goog.log.error(os.ogc.wfs.DescribeFeatureLoader.LOGGER_,
      'Failed to load DescribeFeatureType for "' + this.typename_ + '" on ' + this.url_ + '!');

  this.dispatchEvent(new goog.events.Event(goog.net.EventType.COMPLETE));
};
