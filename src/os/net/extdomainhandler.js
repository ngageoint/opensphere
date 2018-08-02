goog.provide('os.net.ExtDomainHandler');

goog.require('goog.Uri');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file.File');
goog.require('os.net.HandlerType');
goog.require('os.net.SameDomainHandler');



/**
 * Handles requests to an external domain with a simple XHR.
 * @constructor
 * @extends {os.net.SameDomainHandler}
 */
os.net.ExtDomainHandler = function() {
  os.net.ExtDomainHandler.base(this, 'constructor');
  this.log = os.net.ExtDomainHandler.LOGGER_;
};
goog.inherits(os.net.ExtDomainHandler, os.net.SameDomainHandler);


/**
 * Logger
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.net.ExtDomainHandler.LOGGER_ = goog.log.getLogger('os.net.ExtDomainHandler');

/**
 * @type {boolean}
 */
os.net.ExtDomainHandler.MIXED_CONTENT_ENABLED = false;


/**
 * @inheritDoc
 */
os.net.ExtDomainHandler.prototype.handles = function(method, uri) {
  if (window) {
    if (uri.getDomain() && uri.getScheme() != os.file.FileScheme.LOCAL) {
      var local = new goog.Uri(window.location);

      var localScheme = local.getScheme().toLowerCase();
      var remoteScheme = uri.getScheme().toLowerCase();
      if (!os.net.ExtDomainHandler.MIXED_CONTENT_ENABLED && localScheme != remoteScheme && remoteScheme == 'http') {
        // avoid mixed content blocks in new browsers
        goog.log.warning(this.log, 'Mixed content is not allowed: ' + uri.toString());
        return false;
      }

      return !local.hasSameDomainAs(uri);
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.net.ExtDomainHandler.prototype.modUri = function(uri) {
  if (this.req) {
    this.req.setWithCredentials(os.net.getCrossOrigin(uri) === os.net.CrossOrigin.USE_CREDENTIALS);
  }

  return uri;
};


/**
 * @inheritDoc
 */
os.net.ExtDomainHandler.prototype.getHandlerType = function() {
  return os.net.HandlerType.EXT_DOMAIN;
};
