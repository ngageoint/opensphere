/**
 * @fileoverview Helper to {@code CertNazi}.  Runs the standard sequence required to test
 * all connections, including IE weirdness, and reports success or failure with a reason.
 */
goog.module('os.net.CertNaziHelper');
goog.module.declareLegacyNamespace();

const Deferred = goog.require('goog.async.Deferred');
const EventType = goog.require('goog.net.EventType');
const {IE} = goog.require('goog.userAgent');
const CertNazi = goog.require('os.net.CertNazi');
const ConnectionConstants = goog.require('os.net.ConnectionConstants');


/**
 */
class CertNaziHelper {
  /**
   * Constructor.
   * @param {Array<string>} urls
   * @param {string=} opt_iePostUrl
   */
  constructor(urls, opt_iePostUrl) {
    /**
     * Standard cert nazi used to check against the URLs
     * @type {CertNazi}
     * @private
     */
    this.certNazi_ = new CertNazi(urls);

    /**
     * Cert nazi used to check IE security zones specifically
     * @type {CertNazi}
     * @private
     */
    this.certNaziIe_ = null;
    if (IE && opt_iePostUrl) {
      this.certNaziIe_ = new CertNazi([]);
      this.certNaziIe_.setPostUrl(opt_iePostUrl);
    }

    /**
     * Expose results via this deferred
     * @type {Deferred}
     * @private
     */
    this.resultsDeferred_ = new Deferred();
  }

  /**
   * Test the connection and expose the results via deferred
   *
   * @return {Deferred}
   */
  testConnection() {
    this.testStandardConnection_();
    return this.resultsDeferred_;
  }

  /**
   * Run standard cert nazi checks
   *
   * @private
   */
  testStandardConnection_() {
    this.certNazi_.listenOnce(EventType.SUCCESS, this.onStandardTestSuccess_, false, this);
    this.certNazi_.listenOnce(
        EventType.ERROR, goog.partial(this.onFail_, ConnectionConstants.Misconfigure.CA),
        false, this);
    this.certNazi_.inspect();
  }

  /**
   * IE disappoints, so we must run a GET before we can try a POST
   *
   * @private
   */
  testIeConnection_() {
    if (!this.certNaziIe_) {
      this.succeed_();
    } else {
      this.certNaziIe_.listenOnce(CertNazi.POST_SUCCESS, this.onIeTestSuccess_, false, this);
      this.certNaziIe_.listenOnce(CertNazi.POST_ERROR,
          goog.partial(this.onFail_, ConnectionConstants.Misconfigure.IE_SECURITY), false, this);
      this.certNaziIe_.inspect();
    }
  }

  /**
   * Handle standard connection test passed.  Either resolve the deferred or continue testing in IE.
   *
   * @private
   */
  onStandardTestSuccess_() {
    this.certNazi_.removeAllListeners();
    this.testIeConnection_();
  }

  /**
   * Handle successful IE tests
   *
   * @private
   */
  onIeTestSuccess_() {
    this.certNaziIe_.removeAllListeners();
    this.succeed_();
  }

  /**
   * Handle cert nazi failure
   *
   * @param {string} reason
   * @param {goog.events.Event} event
   * @private
   */
  onFail_(reason, event) {
    event.currentTarget.removeAllListeners();
    this.resultsDeferred_.callback({
      pass: false,
      reason: reason
    });
  }

  /**
   * Resolve the deferred with a successful result
   *
   * @private
   */
  succeed_() {
    this.resultsDeferred_.callback({
      pass: true,
      reason: null
    });
  }

  /**
   * Reset the results from testing the connection
   */
  reset() {
    this.certNazi_.removeAllListeners();
    if (this.certNaziIe_) {
      this.certNaziIe_.removeAllListeners();
    }
    this.resultsDeferred_.cancel();
  }
}

exports = CertNaziHelper;
