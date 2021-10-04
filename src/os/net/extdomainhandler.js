goog.declareModuleId('os.net.ExtDomainHandler');

import {FileScheme} from '../file/index.js';
import CrossOrigin from './crossorigin.js';
import HandlerType from './handlertype.js';
import {getCrossOrigin} from './net.js';
import SameDomainHandler from './samedomainhandler.js';

const Uri = goog.require('goog.Uri');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Handles requests to an external domain with a simple XHR.
 */
export default class ExtDomainHandler extends SameDomainHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;
  }

  /**
   * @inheritDoc
   */
  handles(method, uri) {
    if (window) {
      if (uri.getDomain() && uri.getScheme() != FileScheme.LOCAL) {
        var local = new Uri(window.location);

        var localScheme = local.getScheme().toLowerCase();
        var remoteScheme = uri.getScheme().toLowerCase();
        if (!ExtDomainHandler.MIXED_CONTENT_ENABLED && localScheme != remoteScheme && remoteScheme == 'http') {
          // avoid mixed content blocks in new browsers
          log.warning(this.log, 'Mixed content is not allowed: ' + uri.toString());
          return false;
        }

        return !local.hasSameDomainAs(uri);
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  modUri(uri) {
    if (this.req) {
      this.req.setWithCredentials(getCrossOrigin(uri) === CrossOrigin.USE_CREDENTIALS);
    }

    return uri;
  }

  /**
   * @inheritDoc
   */
  getHandlerType() {
    return HandlerType.EXT_DOMAIN;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.net.ExtDomainHandler');

/**
 * @type {boolean}
 */
ExtDomainHandler.MIXED_CONTENT_ENABLED = false;
