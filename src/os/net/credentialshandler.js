goog.module('os.net.CredentialsHandler');

const {getCrossOrigin} = goog.require('os.net');
const CrossOrigin = goog.require('os.net.CrossOrigin');
const ExtDomainHandler = goog.require('os.net.ExtDomainHandler');
const HandlerType = goog.require('os.net.HandlerType');


/**
 * Handles requests to an external domain with a simple XHR and no credentials
 */
class CredentialsHandler extends ExtDomainHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // this should only be executed after the regular ExtDomainHandler fails
    this.score = -20;
  }

  /**
   * @inheritDoc
   */
  modUri(uri) {
    if (this.req) {
      // this handler is only executed after a failed attempt, so use the opposite of what we "should" be using
      this.req.setWithCredentials(getCrossOrigin(uri) !== CrossOrigin.USE_CREDENTIALS);
    }

    return uri;
  }

  /**
   * @inheritDoc
   */
  getHandlerType() {
    return HandlerType.CREDENTIALS;
  }
}

exports = CredentialsHandler;
