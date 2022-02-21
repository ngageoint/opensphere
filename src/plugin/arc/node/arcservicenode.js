goog.declareModuleId('plugin.arc.node.ArcServiceNode');

import ConfigDescriptor from '../../../os/data/configdescriptor.js';
import DataManager from '../../../os/data/datamanager.js';
import LayerType from '../../../os/layer/layertype.js';
import Request from '../../../os/net/request.js';
import {EPSG4326} from '../../../os/proj/proj.js';
import ColorControlType from '../../../os/ui/colorcontroltype.js';
import BaseProvider from '../../../os/ui/data/baseprovider.js';
import DescriptorNode from '../../../os/ui/data/descriptornode.js';
import Icons from '../../../os/ui/icons.js';
import LoadingNode from '../../../os/ui/slick/loadingnode.js';
import * as arc from '../arc.js';
import ArcImageLayerConfig from '../layer/arcimagelayerconfig.js';
import ArcLayerDescriptor from '../layer/arclayerdescriptor.js';

const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');
const googString = goog.require('goog.string');


/**
 * Loads the capabilities from an Arc server and constructs the tree.
 */
class ArcServiceNode extends LoadingNode {
  /**
   * Constructor.
   * @param {ArcServer} server
   */
  constructor(server) {
    super();
    this.log = logger;

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
     * @type {ArcServer}
     * @private
     */
    this.server_ = server;

    /**
     * @type {?Request}
     * @private
     */
    this.request_ = null;
  }

  /**
   * Sets the service type for this node (FeatureServer, MapServer, or ImageServer).
   *
   * @param {string} type
   */
  setServiceType(type) {
    this.serviceType_ = type;
  }

  /**
   * Sets the URL to load. This keeps the URL only to the folder/service level and strips off anything after that
   * as these URLs are often provided out further than we expect.
   *
   * @param {string} url
   */
  setUrl(url) {
    const endSlash = url.lastIndexOf('/');
    if (endSlash == url.length) {
      url = url.substring(0, endSlash);
    }

    this.url_ = url;
  }

  /**
   * Loads Arc node capabilities.
   *
   * @param {string} url
   */
  load(url) {
    if (this.request_) {
      dispose(this.request_);
    }

    this.setLoading(true);
    this.setUrl(url);

    // request the folder plus the MapServer info in order to get the full layer metadata
    url = this.url_ + '/layers?f=json';
    this.request_ = new Request(url);
    this.request_.setHeader('Accept', '*/*');
    this.request_.listen(EventType.SUCCESS, this.onLoad_, false, this);
    this.request_.listen(EventType.ERROR, this.onError_, false, this);
    this.request_.load();
  }

  /**
   * Success callback for loading the Arc service data.
   *
   * @param {GoogEvent} event
   * @private
   */
  onLoad_(event) {
    this.setLoading(false);

    var response = /** @type {string} */ (this.request_.getResponse());
    dispose(this.request_);
    this.request_ = null;

    var json = null;
    try {
      json = /** @type {Object<string, *>} */ (JSON.parse(response));
    } catch (e) {
      // wah wah
    }

    if (json && this.server_) {
      // MapServer and FeatureServer contain multiple sublayers, so add each of them
      if (this.serviceType_ == arc.ServerType.MAP_SERVER ||
          this.serviceType_ == arc.ServerType.FEATURE_SERVER) {
        var layers = /** @type {Array<Object>} */ (json['layers']);
        if (layers && layers.length > 0) {
          for (var i = 0, ii = layers.length; i < ii; i++) {
            var layer = layers[i];
            this.addLayer_(layer);
          }
        }
      } else if (this.serviceType_ == arc.ServerType.IMAGE_SERVER) {
        // ImageServers represent a single layer, so create and add it
        this.addImageLayer_(json);
      }
    }

    this.dispatchEvent(EventType.SUCCESS);
  }

  /**
   * Creates and adds layer descriptors for Arc Feature/Map Servers.
   *
   * @param {Object} layer
   * @private
   */
  addLayer_(layer) {
    if (this.url_) {
      var dm = DataManager.getInstance();
      var uniquePath = this.url_.replace(this.server_.getUrl(), '');
      var layerId = googString.hashCode(uniquePath + '|' + layer['id']);
      var id = this.server_.getId() + BaseProvider.ID_DELIMITER + layerId;
      var d = /** @type {ArcLayerDescriptor} */ (dm.getDescriptor(id));

      if (!d) {
        d = new ArcLayerDescriptor();
      }

      d.setProvider(this.server_.getLabel());
      d.configureDescriptor(layer, id, this.url_);
      d.setDataProvider(this.server_);

      dm.addDescriptor(d);

      var node = new DescriptorNode();
      node.setDescriptor(d);

      this.addChild(node);
    }
  }

  /**
   * Creates and adds layer descriptors for Arc ImageServers.
   *
   * @param {Object<string, *>} json The layer info JSON.
   * @private
   */
  addImageLayer_(json) {
    const id = this.server_.getId() + BaseProvider.ID_DELIMITER + /** @type {string} */ (json['name']);
    const extent = arc.readEsriExtent(/** @type {Object} */ (json['extent']), EPSG4326);
    const config = {
      'id': id,
      'url': this.url_,
      'type': ArcImageLayerConfig.ID,
      'description': json['description'],
      'provider': this.server_.getLabel(),
      'title': json['name'],
      'extent': extent,
      'extentProjection': EPSG4326,
      'layerType': LayerType.TILES,
      'icons': Icons.TILES,
      'colorControl': ColorControlType.PICKER_RESET
    };

    const dm = DataManager.getInstance();
    let descriptor = /** @type {ConfigDescriptor} */ (dm.getDescriptor(id));
    if (!descriptor) {
      descriptor = new ConfigDescriptor();
    }

    descriptor.setBaseConfig(config);
    descriptor.setProvider(this.server_.getLabel());
    descriptor.setDataProvider(this.server_);

    dm.addDescriptor(descriptor);

    var node = new DescriptorNode();
    node.setDescriptor(descriptor);

    this.addChild(node);
  }

  /**
   * Handler for Arc load errors.
   *
   * @param {GoogEvent} event
   * @private
   */
  onError_(event) {
    this.setLoading(false);

    var uri = this.request_.getUri();
    dispose(this.request_);
    this.request_ = null;

    var href = uri ? uri.toString() : 'no URL available!';
    var msg = 'Arc loading failed for URL: ' + href;
    log.error(this.log, msg);

    this.dispatchEvent(EventType.ERROR);
  }
}

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('plugin.arc.node.ArcServiceNode');


export default ArcServiceNode;
