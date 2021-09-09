goog.module('os.net.CertNazi');

const {assert} = goog.require('goog.asserts');
const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const EventType = goog.require('goog.net.EventType');
const XhrIo = goog.require('goog.net.XhrIo');
const {IE} = goog.require('goog.userAgent');


/**
 * CertNazi uses a "fingerprinting" method to determine whether or not a user has their certificate authorities
 * configured properly. By "fingerprinting", we mean checking several URLs to see if we can get to them. These
 * URLs must (A) be HTTPS, and (B) support CORS.
 */
class CertNazi extends EventTarget {
  /**
   * Constructor.
   * @param {Array<string>=} opt_urls Optional GET URLs to check
   */
  constructor(opt_urls) {
    super();

    /**
     * @type {number}
     * @private
     */
    this.threshold_ = 0;

    /**
     * @type {Array<string>}
     * @private
     */
    this.urls_ = [];

    if (opt_urls !== undefined) {
      this.setUrls(opt_urls);
    }

    /**
     * @type {?string}
     * @private
     */
    this.postUrl_ = null;

    /**
     * @type {Array<XhrIo>}
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

    /**
     * GET request used for IE testing.
     * @type {XhrIo}
     * @private
     */
    this.getReq_ = null;

    /**
     * POST request used for IE testing.
     * @type {XhrIo}
     * @private
     */
    this.postReq_ = null;
  }

  /**
   * The URLs to check
   *
   * @param {Array<string>} urls
   */
  setUrls(urls) {
    this.checkUrls_(urls);
    this.urls_ = urls;
  }

  /**
   * The URLs to check
   *
   * @param {string} url
   */
  setPostUrl(url) {
    assert(url.indexOf('https') === 0, 'The POST URL must be secure');
    url += (url.indexOf('?') > -1 ? '&' : '?') + 'nocache=' + Date.now();
    this.postUrl_ = url;
  }

  /**
   * The URLs to check
   *
   * @param {Array<string>} urls
   * @private
   */
  checkUrls_(urls) {
    for (var i = 0, n = urls.length; i < n; i++) {
      assert(urls[i].indexOf('https') === 0, 'The URL must be secure');
      // add a cache defeater
      urls[i] += (urls[i].indexOf('?') > -1 ? '&' : '?') + '_cd=' + Date.now();
    }
  }

  /**
   * The threshold. This should be a number between 0 and 1 representing the ratio of URLs that must match
   * the fingerprint in order for us to start yelling about it.
   *
   * @param {number} value
   */
  setThreshold(value) {
    this.threshold_ = value;
  }

  /**
   * Do the inspection
   */
  inspect() {
    this.bad_ = 0;
    this.good_ = 0;

    // we are deliberately not using the request stack here
    for (var i = 0, n = this.urls_.length; i < n; i++) {
      this.reqs_[i] = new XhrIo();
      this.reqs_[i].listen(EventType.TIMEOUT, this.onAnything_, false, this);
      this.reqs_[i].listen(EventType.SUCCESS, this.onAnything_, false, this);
      this.reqs_[i].listen(EventType.ERROR, this.onAnything_, false, this);
      this.reqs_[i].setWithCredentials(true);

      this.reqs_[i].send(this.urls_[i]);
    }

    if (this.postUrl_ && IE) {
      // IE sucks, so we have to do a GET first or else errors
      this.getReq_ = new XhrIo();
      this.getReq_.listen(EventType.TIMEOUT, this.onGet_, false, this);
      this.getReq_.listen(EventType.SUCCESS, this.onGet_, false, this);
      this.getReq_.listen(EventType.ERROR, this.onGet_, false, this);
      this.getReq_.setWithCredentials(true);
      this.getReq_.send(this.postUrl_);
    }
  }

  /**
   * Determine if the URL checks pass beyond the assigned threshold
   *
   * @return {boolean}
   */
  passed() {
    return this.bad_ / this.reqs_.length > this.threshold_;
  }

  /**
   * Handles events
   *
   * @param {GoogEvent} event
   * @private
   */
  onAnything_(event) {
    var req = /** @type {XhrIo} */ (event.target);
    req.removeAllListeners();

    if (req.isComplete()) {
      if (req.getStatus() === 0) {
        this.bad_++;
      } else {
        this.good_++;
      }
    }

    if (this.bad_ + this.good_ == this.reqs_.length) {
      this.dispatchEvent(new GoogEvent(this.passed() ? EventType.ERROR : EventType.SUCCESS));
      this.reqs_.length = 0;
    }
  }

  /**
   * Handles the initial GET request and then sends a POST to the same URL
   *
   * @param {GoogEvent} event
   * @private
   */
  onGet_(event) {
    var req = /** @type {XhrIo} */ (event.target);
    req.removeAllListeners();

    this.postReq_ = new XhrIo();
    this.postReq_.listen(EventType.TIMEOUT, this.onPost_, false, this);
    this.postReq_.listen(EventType.SUCCESS, this.onPost_, false, this);
    this.postReq_.listen(EventType.ERROR, this.onPost_, false, this);
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
  }

  /**
   * Handles the POST event
   *
   * @param {GoogEvent} event
   * @private
   */
  onPost_(event) {
    var req = /** @type {XhrIo} */ (event.target);
    req.removeAllListeners();

    if (req.isComplete()) {
      if (req.getStatus() === 0) {
        this.dispatchEvent(new GoogEvent(CertNazi.POST_ERROR));
      } else {
        this.dispatchEvent(new GoogEvent(CertNazi.POST_SUCCESS));
      }
    }
  }
}

/**
 * @type {string}
 * @const
 */
CertNazi.POST_SUCCESS = 'postSuccess';

/**
 * @type {string}
 * @const
 */
CertNazi.POST_ERROR = 'postError';

exports = CertNazi;
