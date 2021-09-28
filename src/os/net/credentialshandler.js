goog.declareModuleId('os.net.CredentialsHandler');

import CrossOrigin from './crossorigin.js';
import ExtDomainHandler from './extdomainhandler.js';
import HandlerType from './handlertype.js';
import {getCrossOrigin} from './net.js';


/**
 * Handles requests to an external domain with a simple XHR and no credentials
 */
export default class CredentialsHandler extends ExtDomainHandler {
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
