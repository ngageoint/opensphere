goog.provide('plugin.arc.node.ArcServiceNode');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.data.ConfigDescriptor');
goog.require('os.data.DataManager');
goog.require('os.net.Request');
goog.require('os.ui.data.DescriptorNode');
goog.require('os.ui.slick.LoadingNode');
goog.require('plugin.arc.layer.ArcImageLayerConfig');
goog.require('plugin.arc.layer.ArcLayerDescriptor');



/**
 * Loads the capabilities from an Arc server and constructs the tree.
 *
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
  this.serviceType_ = null;

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
 * Sets the service type for this node (FeatureServer, MapServer, or ImageServer).
 *
 * @param {string} type
 */
plugin.arc.node.ArcServiceNode.prototype.setServiceType = function(type) {
  this.serviceType_ = type;
};


/**
 * Sets the URL to load. This keeps the URL only to the folder/service level and strips off anything after that
 * as these URLs are often provided out further than we expect.
 *
 * @param {string} url
 */
plugin.arc.node.ArcServiceNode.prototype.setUrl = function(url) {
  const endSlash = url.lastIndexOf('/');
  if (endSlash == url.length) {
    url = url.substring(0, endSlash);
  }

  this.url_ = url;
};


/**
 * Loads Arc node capabilities.
 *
 * @param {string} url
 */
plugin.arc.node.ArcServiceNode.prototype.load = function(url) {
  if (this.request_) {
    goog.dispose(this.request_);
  }

  this.setLoading(true);
  this.setUrl(url);

  // request the folder plus the MapServer info in order to get the full layer metadata
  url = this.url_ + '/layers?f=json';
  this.request_ = new os.net.Request(url);
  this.request_.setHeader('Accept', '*/*');
  this.request_.listen(goog.net.EventType.SUCCESS, this.onLoad_, false, this);
  this.request_.listen(goog.net.EventType.ERROR, this.onError_, false, this);
  this.request_.load();
};


/**
 * Success callback for loading the Arc service data.
 *
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
    json = /** @type {Object<string, *>} */ (JSON.parse(response));
  } catch (e) {
    // wah wah
  }

  if (json && this.server_) {
    // MapServer and FeatureServer contain multiple sublayers, so add each of them
    if (this.serviceType_ == plugin.arc.ServerType.MAP_SERVER ||
        this.serviceType_ == plugin.arc.ServerType.FEATURE_SERVER) {
      var layers = /** @type {Array<Object>} */ (json['layers']);
      if (layers && layers.length > 0) {
        for (var i = 0, ii = layers.length; i < ii; i++) {
          var layer = layers[i];
          this.addLayer_(layer);
        }
      }
    } else if (this.serviceType_ == plugin.arc.ServerType.IMAGE_SERVER) {
      // ImageServers represent a single layer, so create and add it
      this.addImageLayer_(json);
    }
  }

  this.dispatchEvent(goog.net.EventType.SUCCESS);
};


/**
 * Creates and adds layer descriptors for Arc Feature/Map Servers.
 *
 * @param {Object} layer
 * @private
 */
plugin.arc.node.ArcServiceNode.prototype.addLayer_ = function(layer) {
  if (this.url_) {
    var dm = os.data.DataManager.getInstance();
    var uniquePath = this.url_.replace(this.server_.getUrl(), '');
    var layerId = goog.string.hashCode(uniquePath + '|' + layer['id']);
    var id = this.server_.getId() + os.ui.data.BaseProvider.ID_DELIMITER + layerId;
    var d = /** @type {plugin.arc.layer.ArcLayerDescriptor} */ (dm.getDescriptor(id));

    if (!d) {
      d = new plugin.arc.layer.ArcLayerDescriptor();
    }

    d.setProvider(this.server_.getLabel());
    d.configureDescriptor(layer, id, this.url_);
    d.setDataProvider(this.server_);

    dm.addDescriptor(d);

    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    this.addChild(node);
  }
};


/**
 * Creates and adds layer descriptors for Arc ImageServers.
 *
 * @param {Object<string, *>} json The layer info JSON.
 * @private
 */
plugin.arc.node.ArcServiceNode.prototype.addImageLayer_ = function(json) {
  const id = this.server_.getId() + os.ui.data.BaseProvider.ID_DELIMITER + /** @type {string} */ (json['name']);
  const extent = /** @type {Object<string, number>} */ (json['extent']);
  const wkid = /** @type {number} */ (extent['spatialReference']['latestWkid']);
  const config = {
    'id': id,
    'url': this.url_,
    'type': plugin.arc.layer.ArcImageLayerConfig.ID,
    'description': json['description'],
    'provider': this.server_.getLabel(),
    'title': json['name'],
    'extent': [extent['xmin'], extent['ymin'], extent['xmax'], extent['ymax']],
    'extentProjection': wkid === 3857 ? 'EPSG:3857' : 'EPSG:4326',
    'layerType': os.layer.LayerType.TILES,
    'icons': os.ui.Icons.TILES
  };

  const dm = os.data.DataManager.getInstance();
  let descriptor = /** @type {os.data.ConfigDescriptor} */ (dm.getDescriptor(id));
  if (!descriptor) {
    descriptor = new os.data.ConfigDescriptor();
  }

  descriptor.setBaseConfig(config);
  descriptor.setProvider(this.server_.getLabel());
  descriptor.setDataProvider(this.server_);

  dm.addDescriptor(descriptor);

  var node = new os.ui.data.DescriptorNode();
  node.setDescriptor(descriptor);

  this.addChild(node);
};


/**
 * Handler for Arc load errors.
 *
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
