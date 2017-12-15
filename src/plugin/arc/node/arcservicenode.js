goog.provide('plugin.arc.node.ArcServiceNode');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.net.Request');
goog.require('os.ui.data.DescriptorNode');
goog.require('os.ui.slick.LoadingNode');
goog.require('plugin.arc.layer.ArcLayerDescriptor');



/**
 * Loads the capabilities from an Arc server and constructs the tree.
 * @param {plugin.arc.ArcServer} server
 * @extends {os.ui.slick.LoadingNode}
 * @constructor
 */
plugin.arc.node.ArcServiceNode = function(server) {
  plugin.arc.node.ArcServiceNode.base(this, 'constructor');
  this.log = plugin.arc.node.ArcServiceNode.LOGGER_;

  /**
   * @type {?string}
   * @private
   */
  this.url_ = null;

  /**
   * @type {plugin.arc.ArcServer}
   * @private
   */
  this.server_ = server;

  /**
   * @type {?os.net.Request}
   * @private
   */
  this.request_ = null;
};
goog.inherits(plugin.arc.node.ArcServiceNode, os.ui.slick.LoadingNode);


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
plugin.arc.node.ArcServiceNode.LOGGER_ = goog.log.getLogger('plugin.arc.node.ArcServiceNode');



/**
 * Sets the URL to load. This keeps the URL only to the folder/service level and strips off anything after that
 * as these URLs are often provided out further than we expect.
 * @param {string} url
 */
plugin.arc.node.ArcServiceNode.prototype.setUrl = function(url) {
  var featureServerIdx = url.indexOf('/FeatureServer');
  var mapServerIdx = url.indexOf('/MapServer');
  if (featureServerIdx > -1) {
    url = url.substring(0, featureServerIdx);
  } else if (mapServerIdx > -1) {
    url = url.substring(0, mapServerIdx);
  }

  this.url_ = url;
};


/**
 * Loads Arc node capabilities.
 * @param {string} url
 */
plugin.arc.node.ArcServiceNode.prototype.load = function(url) {
  if (this.request_) {
    goog.dispose(this.request_);
  }

  this.setLoading(true);
  this.setUrl(url);

  // request the folder plus the MapServer info in order to get the full layer metadata
  url = this.url_ + '/MapServer/layers?f=json';
  this.request_ = new os.net.Request(url);
  this.request_.setHeader('Accept', '*/*');
  this.request_.listen(goog.net.EventType.SUCCESS, this.onLoad_, false, this);
  this.request_.listen(goog.net.EventType.ERROR, this.onError_, false, this);
  this.request_.load();
};


/**
 * Success callback for loading the Arc service data.
 * @param {goog.events.Event} event
 * @private
 */
plugin.arc.node.ArcServiceNode.prototype.onLoad_ = function(event) {
  this.setLoading(false);

  var response = /** @type {string} */ (this.request_.getResponse());
  goog.dispose(this.request_);
  this.request_ = null;

  var json = null;
  try {
    json = JSON.parse(response);
  } catch (e) {
    // wah wah
  }

  if (json && this.server_) {
    var layers = /** @type {Array<Object>} */ (json['layers']);
    if (layers && layers.length > 0) {
      for (var i = 0, ii = layers.length; i < ii; i++) {
        var layer = layers[i];
        this.addLayer_(layer, this.server_);
      }
    }
  }

  this.dispatchEvent(goog.net.EventType.SUCCESS);
};


/**
 * Creates and adds layer descriptors for each Arc service.
 * @param {Object} layer
 * @param {plugin.arc.ArcServer} server
 * @private
 */
plugin.arc.node.ArcServiceNode.prototype.addLayer_ = function(layer, server) {
  var dm = os.dataManager;

  var uniquePath = '';
  if (this.url_) {
    uniquePath = this.url_.replace(server.getUrl(), '');
  }

  var layerId = goog.string.hashCode(uniquePath + '|' + layer['id']);
  var id = server.getId() + os.ui.data.BaseProvider.ID_DELIMITER + layerId;
  var d = /** @type {plugin.arc.layer.ArcLayerDescriptor} */ (dm.getDescriptor(id));

  if (!d) {
    d = new plugin.arc.layer.ArcLayerDescriptor();
  }

  d.setProvider(server.getLabel());
  d.configureDescriptor(layer, id, this.url_ + '/MapServer');
  d.setDataProvider(server);

  dm.addDescriptor(d);

  var node = new os.ui.data.DescriptorNode();
  node.setDescriptor(d);

  this.addChild(node);
};


/**
 * Handler for Arc load errors.
 * @param {goog.events.Event} event
 * @private
 */
plugin.arc.node.ArcServiceNode.prototype.onError_ = function(event) {
  this.setLoading(false);

  var uri = this.request_.getUri();
  goog.dispose(this.request_);
  this.request_ = null;

  var href = uri ? uri.toString() : 'no URL available!';
  var msg = 'Arc loading failed for URL: ' + href;
  goog.log.error(this.log, msg);

  this.dispatchEvent(goog.net.EventType.ERROR);
};
