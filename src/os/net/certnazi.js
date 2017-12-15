goog.provide('os.net.CertNazi');
goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');



/**
 * CertNazi uses a "fingerprinting" method to determine whether or not a user has their certificate authorities
 * configured properly. By "fingerprinting", we mean checking several URLs to see if we can get to them. These
 * URLs must (A) be HTTPS, and (B) support CORS.
 *
 * @param {Array.<!string>=} opt_urls Optional GET URLs to check
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.net.CertNazi = function(opt_urls) {
  os.net.CertNazi.base(this, 'constructor');

  /**
   * @type {number}
   * @private
   */
  this.threshold_ = 0;

  /**
   * @type {Array.<!string>}
   * @private
   */
  this.urls_ = [];

  if (goog.isDef(opt_urls)) {
    this.setUrls(opt_urls);
  }

  /**
   * @type {?string}
   * @private
   */
  this.postUrl_ = null;

  /**
   * @type {Array.<goog.net.XhrIo>}
   * @private
   */
  this.reqs_ = [];

  /**
   * @type {number}
   * @private
   */
  this.bad_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.good_ = 0;
};
goog.inherits(os.net.CertNazi, goog.events.EventTarget);


/**
 * @type {string}
 * @const
 */
os.net.CertNazi.POST_SUCCESS = 'postSuccess';


/**
 * @type {string}
 * @const
 */
os.net.CertNazi.POST_ERROR = 'postError';


/**
 * The URLs to check
 * @param {Array.<!string>} urls
 */
os.net.CertNazi.prototype.setUrls = function(urls) {
  this.checkUrls_(urls);
  this.urls_ = urls;
};


/**
 * The URLs to check
 * @param {string} url
 */
os.net.CertNazi.prototype.setPostUrl = function(url) {
  goog.asserts.assert(url.indexOf('https') === 0, 'The POST URL must be secure');
  url += (url.indexOf('?') > -1 ? '&' : '?') + 'nocache=' + goog.now();
  this.postUrl_ = url;
};


/**
 * The URLs to check
 * @param {Array.<!string>} urls
 * @private
 */
os.net.CertNazi.prototype.checkUrls_ = function(urls) {
  for (var i = 0, n = urls.length; i < n; i++) {
    goog.asserts.assert(urls[i].indexOf('https') === 0, 'The URL must be secure');
    // add a cache defeater
    urls[i] += (urls[i].indexOf('?') > -1 ? '&' : '?') + '_cd=' + goog.now();
  }
};


/**
 * The threshold. This should be a number between 0 and 1 representing the ratio of URLs that must match
 * the fingerprint in order for us to start yelling about it.
 *
 * @param {number} value
 */
os.net.CertNazi.prototype.setThreshold = function(value) {
  this.threshold_ = value;
};


/**
 * Do the inspection
 */
os.net.CertNazi.prototype.inspect = function() {
  this.bad_ = 0;
  this.good_ = 0;

  // we are deliberately not using the request stack here
  for (var i = 0, n = this.urls_.length; i < n; i++) {
    this.reqs_[i] = new goog.net.XhrIo();
    this.reqs_[i].listen(goog.net.EventType.TIMEOUT, this.onAnything_, false, this);
    this.reqs_[i].listen(goog.net.EventType.SUCCESS, this.onAnything_, false, this);
    this.reqs_[i].listen(goog.net.EventType.ERROR, this.onAnything_, false, this);
    this.reqs_[i].setWithCredentials(true);

    this.reqs_[i].send(this.urls_[i]);
  }

  if (this.postUrl_ && goog.userAgent.IE) {
    // IE sucks, so we have to do a GET first or else errors
    this.getReq_ = new goog.net.XhrIo();
    this.getReq_.listen(goog.net.EventType.TIMEOUT, this.onGet_, false, this);
    this.getReq_.listen(goog.net.EventType.SUCCESS, this.onGet_, false, this);
    this.getReq_.listen(goog.net.EventType.ERROR, this.onGet_, false, this);
    this.getReq_.setWithCredentials(true);
    this.getReq_.send(this.postUrl_);
  }
};


/**
 * Determine if the URL checks pass beyond the assigned threshold
 * @return {boolean}
 */
os.net.CertNazi.prototype.passed = function() {
  return this.bad_ / this.reqs_.length > this.threshold_;
};


/**
 * Handles events
 * @param {goog.events.Event} event
 * @private
 */
os.net.CertNazi.prototype.onAnything_ = function(event) {
  var req = /** @type {goog.net.XhrIo} */ (event.target);
  req.removeAllListeners();

  if (req.isComplete()) {
    if (req.getStatus() === 0) {
      this.bad_++;
    } else {
      this.good_++;
    }
  }

  if (this.bad_ + this.good_ == this.reqs_.length) {
    this.dispatchEvent(new goog.events.Event(this.passed() ? goog.net.EventType.ERROR : goog.net.EventType.SUCCESS));
    this.reqs_.length = 0;
  }
};


/**
 * Handles the initial GET request and then sends a POST to the same URL
 * @param {goog.events.Event} event
 * @private
 */
os.net.CertNazi.prototype.onGet_ = function(event) {
  var req = /** @type {goog.net.XhrIo} */ (event.target);
  req.removeAllListeners();

  this.postReq_ = new goog.net.XhrIo();
  this.postReq_.listen(goog.net.EventType.TIMEOUT, this.onPost_, false, this);
  this.postReq_.listen(goog.net.EventType.SUCCESS, this.onPost_, false, this);
  this.postReq_.listen(goog.net.EventType.ERROR, this.onPost_, false, this);
  this.postReq_.setWithCredentials(true);

  this.postReq_.send(
      this.postUrl_,
      'POST',
      '<fake></fake>',
      {
        'Accept': 'application/json',
        'Content-Type': 'text/xml'
      }
  );
};


/**
 * Handles the POST event
 * @param {goog.events.Event} event
 * @private
 */
os.net.CertNazi.prototype.onPost_ = function(event) {
  var req = /** @type {goog.net.XhrIo} */ (event.target);
  req.removeAllListeners();

  if (req.isComplete()) {
    if (req.getStatus() === 0) {
      this.dispatchEvent(new goog.events.Event(os.net.CertNazi.POST_ERROR));
    } else {
      this.dispatchEvent(new goog.events.Event(os.net.CertNazi.POST_SUCCESS));
    }
  }
};
