goog.provide('os.net.CredentialsHandler');

goog.require('goog.Uri');
goog.require('os.net.ExtDomainHandler');



/**
 * Handles requests to an external domain with a simple XHR and no credentials
 * @constructor
 * @extends {os.net.ExtDomainHandler}
 */
os.net.CredentialsHandler = function() {
  os.net.CredentialsHandler.base(this, 'constructor');

  // this should only be executed after the regular ExtDomainHandler fails
  this.score = -20;
};
goog.inherits(os.net.CredentialsHandler, os.net.ExtDomainHandler);


/**
 * @inheritDoc
 */
os.net.CredentialsHandler.prototype.modUri = function(uri) {
  if (this.req) {
    // this handler is only executed after a failed attempt, so use the opposite of what we "should" be using
    this.req.setWithCredentials(os.net.getCrossOrigin(uri) !== os.net.CrossOrigin.USE_CREDENTIALS);
  }

  return uri;
};


/**
 * @inheritDoc
 */
os.net.CredentialsHandler.prototype.getHandlerType = function() {
  return os.net.HandlerType.CREDENTIALS;
};


/**
 * @inheritDoc
 */
os.net.CredentialsHandler.prototype.onXhrComplete = function(opt_event) {
  var lastUri = this.req.getLastUri();
  var uri = new goog.Uri(lastUri);
  var pattern = '^' + uri.getScheme() + '://' + uri.getDomain();

  // register the cross origin based on whether the request used credentials or not
  var co = this.req.getWithCredentials() ? os.net.CrossOrigin.USE_CREDENTIALS : os.net.CrossOrigin.NONE;
  os.net.saveCrossOrigin(pattern, co);

  os.net.CredentialsHandler.base(this, 'onXhrComplete', opt_event);
};
