goog.provide('plugin.arc.ArcServer');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.data.IDataProvider');
goog.require('os.ui.server.AbstractLoadingServer');
goog.require('os.ui.slick.LoadingNode');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Provider representing an Arc Server.
 * @implements {os.data.IDataProvider}
 * @extends {os.ui.server.AbstractLoadingServer}
 * @constructor
 */
plugin.arc.ArcServer = function() {
  plugin.arc.ArcServer.base(this, 'constructor');
  this.providerType = os.ogc.ID;

  /**
   * @type {?plugin.arc.ArcLoader}
   * @private
   */
  this.loader_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.version_ = null;

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = plugin.arc.ArcServer.LOGGER_;
};
goog.inherits(plugin.arc.ArcServer, os.ui.server.AbstractLoadingServer);


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
plugin.arc.ArcServer.LOGGER_ = goog.log.getLogger('plugin.arc.ArcServer');


/**
 * Default color for Arc descriptors.
 * @const
 * @type {string}
 */
plugin.arc.ArcServer.DEFAULT_COLOR = 'rgba(255,255,255,1)';


/**
 * Get the Arc version
 * @return {?string}
 */
plugin.arc.ArcServer.prototype.getVersion = function() {
  return this.version_;
};


/**
 * Set the Arc version
 * @param {?string} value
 */
plugin.arc.ArcServer.prototype.setVersion = function(value) {
  this.version_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcServer.prototype.configure = function(config) {
  plugin.arc.ArcServer.base(this, 'configure', config);

  var url = /** @type {string} */ (config['url']);
  var i = url.indexOf('/rest/services');
  if (i == -1) {
    url += '/rest/services';
  }

  // trim trailing slashes
  url = url.replace(/\/+$/, '');

  if (config['id']) {
    this.setId(/** @type {string} */ (config['id']));
  }

  this.setUrl(url);
};


/**
 * @inheritDoc
 */
plugin.arc.ArcServer.prototype.load = function(opt_ping) {
  goog.asserts.assert(this.url, 'Attempted to load server ' + this.getLabel() + ' without URL!');
  plugin.arc.ArcServer.base(this, 'load', opt_ping);
  goog.log.info(this.log, this.getLabel() + ' requesting Arc Server capabilities.');

  this.setChildren(null);

  this.loader_ = plugin.arc.getArcLoader(new os.ui.slick.SlickTreeNode(), this.url, this);
  this.loader_.load();
  this.loader_.listen(goog.net.EventType.SUCCESS, this.onLoad, false, this);
  this.loader_.listen(goog.net.EventType.ERROR, this.onError, false, this);
};


/**
 * Handler for Arc server load success.
 * @param {goog.events.Event} event
 * @protected
 */
plugin.arc.ArcServer.prototype.onLoad = function(event) {
  goog.log.info(this.log, this.getLabel() + ' base Arc server capabilities loaded.');
  this.loader_.unlisten(goog.net.EventType.SUCCESS, this.onLoad, false, this);
  this.loader_.unlisten(goog.net.EventType.ERROR, this.onError, false, this);
  this.setChildren(this.loader_.getNode().getChildren());
  this.disposeLoader_();

  this.setLoading(false);
};


/**
 * Handler for Arc server load errors.
 * @param {goog.events.Event} event
 * @protected
 */
plugin.arc.ArcServer.prototype.onError = function(event) {
  this.loader_.unlisten(goog.net.EventType.SUCCESS, this.onLoad, false, this);
  this.loader_.unlisten(goog.net.EventType.ERROR, this.onError, false, this);
  this.disposeLoader_();

  var href = this.getUrl();
  var msg = 'Request failed for <a target="_blank" href="' + href + '">Arc Server Capabilities</a>';

  this.logError(msg);
  this.setLoading(false);
};


/**
 * Logs an error and sets the server to an error state.
 * @param {string} msg The error message.
 * @protected
 */
plugin.arc.ArcServer.prototype.logError = function(msg) {
  if (!this.getError()) {
    var errorMsg = 'Server [' + this.getLabel() + ']: ' + msg;

    if (!this.getPing()) {
      os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
    }

    goog.log.error(plugin.arc.ArcServer.LOGGER_, errorMsg);

    this.setErrorMessage(errorMsg);
    this.setLoading(false);
  }
};


/**
 * Disposes of the loader.
 * @private
 */
plugin.arc.ArcServer.prototype.disposeLoader_ = function() {
  if (this.loader_) {
    goog.dispose(this.loader_);
    this.loader_ = null;
  }
};
