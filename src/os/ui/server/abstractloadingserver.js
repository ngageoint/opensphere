goog.provide('os.ui.server.AbstractLoadingServer');

goog.require('os.data.DataProviderEvent');
goog.require('os.data.DataProviderEventType');
goog.require('os.data.ILoadingProvider');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.data.BaseProvider');



/**
 * A base implementation of a server that loads stuff.
 *
 * @implements {os.data.ILoadingProvider}
 * @extends {os.ui.data.BaseProvider}
 * @constructor
 */
os.ui.server.AbstractLoadingServer = function() {
  os.ui.server.AbstractLoadingServer.base(this, 'constructor');

  /**
   * The full server URL.
   * @type {string}
   * @protected
   */
  this.url = '';

  /**
   * Alternate URLs that may be used in place of the base URL.
   * @type {Array<string>}
   * @private
   */
  this.alternateUrls_ = null;

  /**
   * Index of the next URL to pick when rotating.
   * @type {number}
   * @private
   */
  this.nextUrl_ = 0;

  /**
   * @type {boolean}
   * @private
   */
  this.error_ = false;

  /**
   * @type {?string}
   * @private
   */
  this.errorMsg_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.inhibitPopups_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.ping_ = false;
};
goog.inherits(os.ui.server.AbstractLoadingServer, os.ui.data.BaseProvider);


/**
 * Initialize the server.
 */
os.ui.server.AbstractLoadingServer.prototype.init = function() {
  this.setState(os.structs.TriState.OFF);
};


/**
 * @inheritDoc
 */
os.ui.server.AbstractLoadingServer.prototype.configure = function(config) {
  os.ui.server.AbstractLoadingServer.base(this, 'configure', config);
  this.setUrl(/** @type {string} */ (config['url']));
  this.init();
};


/**
 * @inheritDoc
 */
os.ui.server.AbstractLoadingServer.prototype.load = function(opt_ping) {
  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADING, this));
  this.setLoading(true);
  this.setPing(opt_ping || false);
  this.setError(false);
};


/**
 * If the server has finished loading.
 * @return {boolean}
 */
os.ui.server.AbstractLoadingServer.prototype.isLoaded = function() {
  return true;
};


/**
 * Called when loading is complete.
 * @protected
 */
os.ui.server.AbstractLoadingServer.prototype.finish = function() {
  this.setLoading(false);
  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADED, this));
};


/**
 * @inheritDoc
 */
os.ui.server.AbstractLoadingServer.prototype.formatIcons = function() {
  var icons = os.ui.server.AbstractLoadingServer.base(this, 'formatIcons');
  if (this.getError()) {
    var message = 'Server failed to load. See the log/alerts window for details.';
    icons += '<i class="fa fa-warning orange-icon" title="' + message + '"></i>';
  }

  return icons;
};


/**
 * Get the server URL.
 * @return {string}
 */
os.ui.server.AbstractLoadingServer.prototype.getUrl = function() {
  return this.url;
};


/**
 * Set the server URL.
 * @param {string} value
 */
os.ui.server.AbstractLoadingServer.prototype.setUrl = function(value) {
  this.url = value;
};


/**
 * Get alternate URLs that may be used to load balance server requests.
 * @return {Array<string>}
 */
os.ui.server.AbstractLoadingServer.prototype.getAlternateUrls = function() {
  return this.alternateUrls_;
};


/**
 * Set alternate URLs that may be used to load balance server requests.
 * @param {Array<string>} value
 */
os.ui.server.AbstractLoadingServer.prototype.setAlternateUrls = function(value) {
  this.alternateUrls_ = value ? value.slice() : null;
};


/**
 * Add an alternate URL to the server.
 * @param {string} value
 */
os.ui.server.AbstractLoadingServer.prototype.addAlternateUrl = function(value) {
  if (!this.alternateUrls_) {
    this.alternateUrls_ = [value];
  } else if (this.alternateUrls_.indexOf(value) == -1) {
    this.alternateUrls_.push(value);
  }
};


/**
 * Remove an alternate URL from the server.
 * @param {string} value
 */
os.ui.server.AbstractLoadingServer.prototype.removeAlternateUrl = function(value) {
  if (this.alternateUrls_) {
    goog.array.remove(this.alternateUrls_, value);

    if (this.alternateUrls_.length == 0) {
      this.alternateUrls_ = null;
    }
  }
};


/**
 * Gets a rotating URL for the server using the base URL and alternate URLs.
 * @return {string}
 */
os.ui.server.AbstractLoadingServer.prototype.getNextUrl = function() {
  var urls = [this.url];
  if (this.alternateUrls_) {
    urls = urls.concat(this.alternateUrls_);
  }

  if (this.nextUrl_ >= urls.length) {
    this.nextUrl_ = 0;
  }

  return urls[this.nextUrl_++] || '';
};


/**
 * @inheritDoc
 */
os.ui.server.AbstractLoadingServer.prototype.getError = function() {
  return this.error_;
};


/**
 * @param {boolean} value
 */
os.ui.server.AbstractLoadingServer.prototype.setError = function(value) {
  this.error_ = value;

  if (!this.error_) {
    this.setErrorMessage(null);
  }

  this.dispatchEvent(new os.events.PropertyChangeEvent('icons'));
};


/**
 * @inheritDoc
 */
os.ui.server.AbstractLoadingServer.prototype.getErrorMessage = function() {
  return this.errorMsg_;
};


/**
 * @param {?string} message
 */
os.ui.server.AbstractLoadingServer.prototype.setErrorMessage = function(message) {
  this.errorMsg_ = message;

  if (this.errorMsg_) {
    this.setError(true);
  }
};


/**
 * @return {boolean}
 */
os.ui.server.AbstractLoadingServer.prototype.getInhibitPopups = function() {
  return this.inhibitPopups_;
};


/**
 * @param {boolean} value
 */
os.ui.server.AbstractLoadingServer.prototype.setInhibitPopups = function(value) {
  this.inhibitPopups_ = value;
};


/**
 * @return {boolean}
 */
os.ui.server.AbstractLoadingServer.prototype.getPing = function() {
  return this.ping_;
};


/**
 * @param {boolean} value
 */
os.ui.server.AbstractLoadingServer.prototype.setPing = function(value) {
  this.ping_ = value;
};


/**
 * @inheritDoc
 */
os.ui.server.AbstractLoadingServer.prototype.isLoading = function() {
  return this.isLoading_;
};
goog.exportProperty(
    os.ui.server.AbstractLoadingServer.prototype,
    'isLoading',
    os.ui.server.AbstractLoadingServer.prototype.isLoading);


/**
 * @inheritDoc
 */
os.ui.server.AbstractLoadingServer.prototype.setLoading = function(value) {
  if (this.isLoading_ != value) {
    this.isLoading_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent('loading', value, !value));
  }
};


/**
 * @inheritDoc
 */
os.ui.server.AbstractLoadingServer.prototype.onChildChange = function(e) {
  if (!this.isLoading()) {
    // don't handle child change events while loading, because there will be a lot of them and it may hang the browser.
    // the server will fire an event when it finishes loading to update the tree.
    os.ui.server.AbstractLoadingServer.base(this, 'onChildChange', e);
  }
};
