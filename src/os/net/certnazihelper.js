/**
 * @fileoverview Helper to {@code os.net.CertNazi}.  Runs the standard sequence required to test
 * all connections, including IE weirdness, and reports success or failure with a reason.
 */
goog.provide('os.net.CertNaziHelper');
goog.provide('os.net.CertNaziResult');
goog.require('goog.async.Deferred');
goog.require('goog.net.EventType');
goog.require('goog.userAgent');
goog.require('os.net.CertNazi');
goog.require('os.net.ConnectionConstants');


/**
 * @typedef {{
 *   pass: boolean,
 *   reason: ?string
 * }}
 */
os.net.CertNaziResult;



/**
 * @param {Array.<string>} urls
 * @param {string=} opt_iePostUrl
 * @constructor
 */
os.net.CertNaziHelper = function(urls, opt_iePostUrl) {
  /**
   * Standard cert nazi used to check against the URLs
   * @type {os.net.CertNazi}
   * @private
   */
  this.certNazi_ = new os.net.CertNazi(urls);

  /**
   * Cert nazi used to check IE security zones specifically
   * @type {os.net.CertNazi}
   * @private
   */
  this.certNaziIe_ = null;
  if (goog.userAgent.IE && opt_iePostUrl) {
    this.certNaziIe_ = new os.net.CertNazi([]);
    this.certNaziIe_.setPostUrl(opt_iePostUrl);
  }

  /**
   * Expose results via this deferred
   * @type {goog.async.Deferred}
   * @private
   */
  this.resultsDeferred_ = new goog.async.Deferred();
};


/**
 * Test the connection and expose the results via deferred
 * @return {goog.async.Deferred}
 */
os.net.CertNaziHelper.prototype.testConnection = function() {
  this.testStandardConnection_();
  return this.resultsDeferred_;
};


/**
 * Run standard cert nazi checks
 * @private
 */
os.net.CertNaziHelper.prototype.testStandardConnection_ = function() {
  this.certNazi_.listenOnce(goog.net.EventType.SUCCESS, this.onStandardTestSuccess_, false, this);
  this.certNazi_.listenOnce(
      goog.net.EventType.ERROR, goog.partial(this.onFail_, os.net.ConnectionConstants.Misconfigure.CA),
      false, this);
  this.certNazi_.inspect();
};


/**
 * IE disappoints, so we must run a GET before we can try a POST
 * @private
 */
os.net.CertNaziHelper.prototype.testIeConnection_ = function() {
  if (!this.certNaziIe_) {
    this.succeed_();
  } else {
    this.certNaziIe_.listenOnce(os.net.CertNazi.POST_SUCCESS, this.onIeTestSuccess_, false, this);
    this.certNaziIe_.listenOnce(os.net.CertNazi.POST_ERROR,
        goog.partial(this.onFail_, os.net.ConnectionConstants.Misconfigure.IE_SECURITY), false, this);
    this.certNaziIe_.inspect();
  }
};


/**
 * Handle standard connection test passed.  Either resolve the deferred or continue testing in IE.
 * @private
 */
os.net.CertNaziHelper.prototype.onStandardTestSuccess_ = function() {
  this.certNazi_.removeAllListeners();
  this.testIeConnection_();
};


/**
 * Handle successful IE tests
 * @private
 */
os.net.CertNaziHelper.prototype.onIeTestSuccess_ = function() {
  this.certNaziIe_.removeAllListeners();
  this.succeed_();
};


/**
 * Handle cert nazi failure
 * @param {string} reason
 * @param {goog.events.Event} event
 * @private
 */
os.net.CertNaziHelper.prototype.onFail_ = function(reason, event) {
  event.currentTarget.removeAllListeners();
  this.resultsDeferred_.callback({
    pass: false,
    reason: reason
  });
};


/**
 * Resolve the deferred with a successful result
 * @private
 */
os.net.CertNaziHelper.prototype.succeed_ = function() {
  this.resultsDeferred_.callback({
    pass: true,
    reason: null
  });
};


/**
 * Reset the results from testing the connection
 */
os.net.CertNaziHelper.prototype.reset = function() {
  this.certNazi_.removeAllListeners();
  if (this.certNaziIe_) {
    this.certNaziIe_.removeAllListeners();
  }
  this.resultsDeferred_.cancel();
};
