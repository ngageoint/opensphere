goog.provide('plugin.file.kml.ui.KMLNetworkLinkNode');

goog.require('goog.async.Delay');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo.ResponseType');
goog.require('goog.userAgent');
goog.require('ol.events');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.net');
goog.require('os.net.Request');
goog.require('os.structs.TriState');
goog.require('os.ui.file.kml');
goog.require('plugin.file.kml.KMLImporter');
goog.require('plugin.file.kml.KMLSourceEvent');
goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.file.kml.ui.NetworkLinkIcons');



/**
 * Tree node for KML network links
 * @param {string} uri The network link URI
 * @extends {plugin.file.kml.ui.KMLNode}
 * @constructor
 */
plugin.file.kml.ui.KMLNetworkLinkNode = function(uri) {
  plugin.file.kml.ui.KMLNetworkLinkNode.base(this, 'constructor');

  // network links should default to being turned off
  this.setState(os.structs.TriState.OFF);

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = plugin.file.kml.ui.KMLNetworkLinkNode.LOGGER_;

  /**
   * @type {number}
   * @private
   */
  this.durationStart_ = 0;

  /**
   * The icon displayed on the node UI
   * @type {!plugin.file.kml.ui.NetworkLinkIcons}
   * @private
   */
  this.icon_ = plugin.file.kml.ui.NetworkLinkIcons.INACTIVE;

  /**
   * The network link importer
   * @type {plugin.file.kml.KMLImporter}
   * @private
   */
  this.importer_ = null;

  /**
   * The network link request
   * @type {os.net.Request}
   * @private
   */
  this.request_ = null;

  /**
   * How often the network link will refresh in milliseconds. Default value (4 seconds) provided by the KML spec.
   * @type {number}
   * @private
   */
  this.refreshInterval_ = 4000;

  /**
   * The minimum network link refresh in milliseconds - defined by the NetworkLinkControl
   * @type {number}
   * @private
   */
  this.minRefreshPeriod_ = 0;

  /**
   * The refresh mode for the network link
   * @type {os.ui.file.kml.RefreshMode}
   * @private
   */
  this.refreshMode_ = os.ui.file.kml.RefreshMode.CHANGE;

  /**
   * The network link refresh timer
   * @type {goog.async.Delay}
   * @private
   */
  this.refreshTimer_ = null;

  /**
   * The network link URI
   * @type {string}
   * @private
   */
  this.uri_ = uri;

  this.updateRefreshTimer_();
};
goog.inherits(plugin.file.kml.ui.KMLNetworkLinkNode, plugin.file.kml.ui.KMLNode);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.kml.ui.KMLNetworkLinkNode.LOGGER_ = goog.log.getLogger('plugin.file.kml.ui.KMLNetworkLinkNode');


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.disposeInternal = function() {
  plugin.file.kml.ui.KMLNetworkLinkNode.base(this, 'disposeInternal');

  if (this.importer_) {
    this.importer_.dispose();
    this.importer_ = null;
  }

  if (this.request_) {
    this.request_.dispose();
    this.request_ = null;
  }

  if (this.refreshTimer_) {
    this.refreshTimer_.dispose();
    this.refreshTimer_ = null;
  }
};


/**
 * Clear the network link's features from the source.
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.clear_ = function() {
  if (this.source) {
    this.source.clearNode(this);
  }
};


/**
 * Gets a string representing the duration from the last time durationStart_ was set. Resets durationStart_ for
 * subsequent calls in the same request sequence.
 * @return {string}
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.durationString_ = function() {
  var now = goog.now();
  var duration = new Date(now - this.durationStart_);
  var durationString = ' in ' + os.time.formatDate(duration, 'mm:ss.SSS');
  this.durationStart_ = now;

  return durationString;
};


/**
 * Displays an error message and disables the node.
 * @param {string} msg The error message
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.handleError_ = function(msg) {
  var errorMsg = 'Unable to load KML network link "' + this.getLabel() + '"' + this.urlLogString_() + ': ' + msg;
  goog.log.error(this.log, errorMsg);
  os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
  this.setState(os.structs.TriState.OFF);
  this.setIcon_(plugin.file.kml.ui.NetworkLinkIcons.ERROR);
  this.setLoading(false);
};


/**
 * Gets a string representing the URL for the source request.
 * @return {string}
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.urlLogString_ = function() {
  return ' (' + this.uri_ + ')';
};


/**
 * Get the refresh interval for the network link.
 * @return {number}
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.getRefreshInterval = function() {
  return this.refreshMode_ == os.ui.file.kml.RefreshMode.INTERVAL ? this.refreshInterval_ : 0;
};


/**
 * Set the refresh interval for the network link. If {@link refreshMode} is set to
 * {@link os.ui.file.kml.RefreshMode.INTERVAL}, the network link will be refreshed after the provided amount of time.
 * The timer will not be started until data import has completed.
 * @param {number} value The refresh interval in milliseconds, or zero to prevent automatic refresh
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.setRefreshInterval = function(value) {
  // value should always be positive - negative values will prevent refresh
  this.refreshInterval_ = Math.max(value, this.minRefreshPeriod_);
  this.updateRefreshTimer_();
};


/**
 * Set the minimum refresh interval for the network link.
 * @param {number} value The minimum refresh interval in milliseconds, or zero to prevent automatic refresh
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.setMinRefreshPeriod = function(value) {
  // value should always be positive - negative values will prevent refresh
  this.minRefreshPeriod_ = Math.max(value, 0);
  this.setRefreshInterval(this.refreshInterval_); // update the refresh interval, if needed
};


/**
 * Get the refresh mode for the network link.
 * @return {os.ui.file.kml.RefreshMode}
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.getRefreshMode = function() {
  return this.refreshMode_;
};


/**
 * Set the refresh mode for the network link.
 * @param {os.ui.file.kml.RefreshMode} value
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.setRefreshMode = function(value) {
  this.refreshMode_ = value;
  this.updateRefreshTimer_();
};


/**
 * Manually trigger a network link refresh.
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.refresh = function() {
  if (this.refreshTimer_) {
    this.refreshTimer_.fire();
  } else {
    this.onRefreshTimer_();
  }
};


/**
 * Updates the refresh timer based on the current refresh mode/interval.
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.updateRefreshTimer_ = function() {
  var active = false;
  if (this.refreshTimer_) {
    active = this.refreshTimer_.isActive();
    this.refreshTimer_.dispose();
  }

  this.refreshTimer_ = new goog.async.Delay(this.onRefreshTimer_, this.getRefreshInterval(), this);
  if (active) {
    this.refreshTimer_.start();
  }
};


/**
 * Handle the refresh timer firing.
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.onRefreshTimer_ = function() {
  if (!this.request_) {
    this.request_ = new os.net.Request(this.uri_);

    // requesting a Document in the response was slightly faster in testing, but only works for KML (not KMZ). if we run
    // into related issues of parsing speed, we should try to determine the content type ahead of time and change this.
    if (!goog.userAgent.IE || goog.userAgent.isVersionOrHigher(10)) {
      this.request_.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
    }

    this.request_.listen(goog.net.EventType.SUCCESS, this.onRequestComplete_, false, this);
    this.request_.listen(goog.net.EventType.ERROR, this.onRequestError_, false, this);
  }

  if (this.source) {
    // clear previous features loaded by the network link.
    // TODO it would be better to gracefully replace features instead of clearing everything prior to loading the
    //      request. this causes all features to be wiped from the application on every refresh which could be annoying
    //      to the user.
    this.source.clearNode(this);

    this.setLoading(true);
    this.setIcon_(plugin.file.kml.ui.NetworkLinkIcons.LOADING);

    this.durationStart_ = goog.now();
    this.request_.load();
  } else {
    this.handleError_('source is null');
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.setSource = function(source) {
  if (this.source) {
    ol.events.unlisten(this.source, plugin.file.kml.KMLSourceEvent.REFRESH, this.onSourceRefresh_, this);
  }

  plugin.file.kml.ui.KMLNetworkLinkNode.base(this, 'setSource', source);

  if (this.source) {
    ol.events.listen(this.source, plugin.file.kml.KMLSourceEvent.REFRESH, this.onSourceRefresh_, this);
  }
};


/**
 * Refresh the network link when the source is refreshed.
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.onSourceRefresh_ = function() {
  if (this.getState() != os.structs.TriState.OFF) {
    this.refresh();
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.setState = function(value) {
  var old = this.getState();
  plugin.file.kml.ui.KMLNetworkLinkNode.base(this, 'setState', value);
  var s = this.getState();

  if (old != s) {
    if (s == os.structs.TriState.OFF) {
      // network link has been disabled, so stop everything!
      if (this.refreshTimer_) {
        this.refreshTimer_.stop();
      }

      if (this.request_) {
        this.request_.abort();
      }

      if (this.importer_) {
        this.importer_.stop();
      }

      this.clear_();
      this.setIcon_(plugin.file.kml.ui.NetworkLinkIcons.INACTIVE);
      this.setLoading(false);
    } else if (this.source) {
      if (!this.importer_) {
        // first time activating - get an importer from the source. the importer can't be created here because we'll
        // introduce a circular dependency with the parser.
        this.importer_ = this.source.createImporter();
        this.importer_.setTrustHTML(os.net.isTrustedUri(this.uri_));
        this.importer_.listen(os.thread.EventType.PROGRESS, this.onImportProgress_, false, this);
        this.importer_.listen(os.events.EventType.COMPLETE, this.onImportComplete_, false, this);
      }

      if (this.refreshTimer_ && !this.refreshTimer_.isActive() && old == os.structs.TriState.OFF) {
        this.refreshTimer_.fire();
      }
    }
  }
};


/**
 * Request success handler.
 * @param {goog.events.Event} event
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.onRequestComplete_ = function(event) {
  var msg = 'Request complete for ' + this.getLabel() + this.urlLogString_() + this.durationString_();
  goog.log.info(this.log, msg);

  var response = /** @type {string} */ (this.request_.getResponse());
  this.request_.clearResponse();

  if (response) {
    if (this.importer_) {
      this.importer_.startImport(response);
    } else {
      this.handleError_('importer is null');
    }
  } else {
    this.handleError_('response is empty');
  }
};


/**
 * Request error handler.
 * @param {goog.events.Event} event
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.onRequestError_ = function(event) {
  this.handleError_(this.request_ ? this.request_.getErrors().join(' ') : 'unknown error');
  this.request_.clearResponse();
};


/**
 * Import success handler.
 * @param {goog.events.Event} event
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.onImportProgress_ = function(event) {
  // KML parsing is about 30% faster in FF if this is done in one shot in the complete handler, instead of here. the
  // slowdown is caused by the renderer and parser competing for resources, since FF has a much slower canvas renderer.
  // moving this to the complete handler will prevent any features from displaying until the parser is done, instead of
  // displaying them piecemeal and providing the user with some feedback.
  if (this.importer_ && this.source) {
    this.source.addNodes(this.importer_.getData());
  }
};


/**
 * Import success handler.
 * @param {goog.events.Event} event
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.onImportComplete_ = function(event) {
  var msg = 'Import complete for ' + this.getLabel() + this.urlLogString_() + this.durationString_();
  goog.log.info(this.log, msg);

  this.setLoading(false);

  var children = this.getChildren();
  var currentRoot = children && children.length > 0 ? children[0] : null;
  var rootNode = this.importer_.getRootNode();
  var rootChildren = rootNode ? rootNode.getChildren() : [];
  var firstRootChild = rootChildren && rootChildren.length > 0 ? rootChildren[0] : null;
  if (currentRoot !== firstRootChild || ((children) && (children.length != rootChildren.length))) {
    // the root node will only change on the first parse, or when the root name changes and we can't merge
    this.setChildren(rootChildren ? rootChildren : null);
    this.collapsed = !goog.isDefAndNotNull(rootNode);
  }

  // TODO: increase the refresh interval for lengthy imports? waiting to start the timer helps, but if the interval is
  // short you'll hardly have a chance to look at the data.

  if (this.getState() != os.structs.TriState.OFF) {
    // network link still active - good to go!
    this.setIcon_(plugin.file.kml.ui.NetworkLinkIcons.ACTIVE);

    // use min refresh interval defined by NetworkLinkControl
    this.setMinRefreshPeriod(this.importer_.getMinRefreshPeriod());

    // start the refresh timer after the entire import process is complete to avoid refreshing mid-import
    if (this.refreshTimer_ && this.getRefreshInterval() > 0) {
      this.refreshTimer_.start();
    }
  } else {
    // network link was disabled - drop the imported features from the source
    this.clear_();
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.formatIcons = function() {
  return this.icon_;
};


/**
 * Set the network link icon displayed on the node.
 * @param {plugin.file.kml.ui.NetworkLinkIcons} value The icon to display
 * @private
 */
plugin.file.kml.ui.KMLNetworkLinkNode.prototype.setIcon_ = function(value) {
  this.icon_ = value;
  this.dispatchEvent(new os.events.PropertyChangeEvent('icons'));
};
