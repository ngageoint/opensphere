goog.declareModuleId('plugin.arc.ArcLoader');

import {remove} from 'ol/src/array.js';
import Request from '../../os/net/request.js';
import * as arc from './arc.js';
import ArcServer from './arcserver.js';
import ArcFolderNode from './node/arcfoldernode.js';
import ArcServiceNode from './node/arcservicenode.js';

const asserts = goog.require('goog.asserts');
const dispose = goog.require('goog.dispose');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');

/**
 * Loads the capabilities from an Arc server and constructs the tree.
 *
 *
 * @implements {IArcLoader}
 */
class ArcLoader extends EventTarget {
  /**
   * Constructor.
   * @param {SlickTreeNode} node
   * @param {string} url
   * @param {ArcServer} server
   */
  constructor(node, url, server) {
    super();

    /**
     * @type {SlickTreeNode}
     * @private
     */
    this.node_ = node;

    /**
     * @type {string}
     * @private
     */
    this.url_ = url;

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

    /**
     * @type {Array<string>}
     * @private
     */
    this.errors_ = null;

    /**
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {!Array<!SlickTreeNode>}
     * @private
     */
    this.toLoad_ = [];

    /**
     * @type {!Array<!SlickTreeNode>}
     * @private
     */
    this.futureChildren_ = [];
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.node_ = null;
    this.server_ = null;

    if (this.request_) {
      dispose(this.request_);
      this.request_ = null;
    }
  }

  /**
   * @inheritDoc
   */
  getErrors() {
    return this.errors_;
  }

  /**
   * @inheritDoc
   */
  getUrl() {
    return this.url_;
  }

  /**
   * @inheritDoc
   */
  setUrl(value) {
    this.url_ = value;
  }

  /**
   * @inheritDoc
   */
  getNode() {
    return this.node_;
  }

  /**
   * @inheritDoc
   */
  setNode(value) {
    this.node_ = value;
  }

  /**
   * @inheritDoc
   */
  getServer() {
    return this.server_;
  }

  /**
   * @inheritDoc
   */
  setServer(value) {
    this.server_ = value;
  }

  /**
   * @inheritDoc
   */
  load() {
    asserts.assert(this.url_, 'No URL provided to the Arc Loader!');
    asserts.assert(this.node_, 'No node provided to the Arc Loader!');
    asserts.assert(this.server_, 'No server provided to the Arc Loader!');

    var requestUrl = this.url_ + '?f=json';
    log.fine(this.log, 'Loading Arc capabilities from URL: ' + requestUrl);

    this.errors_ = null;

    this.request_ = new Request(requestUrl);
    this.request_.setValidator(arc.getException);
    this.request_.setHeader('Accept', '*/*');
    this.request_.listen(EventType.SUCCESS, this.onLoad, false, this);
    this.request_.listen(EventType.ERROR, this.onError, false, this);
    this.request_.load();
  }

  /**
   * Handler for successful load of the Arc node capabilities.
   *
   * @param {GoogEvent} event
   * @protected
   */
  onLoad(event) {
    var response = /** @type {string} */ (this.request_.getResponse());
    dispose(this.request_);
    this.request_ = null;

    log.fine(this.log, 'Arc load successful from: ' + this.url_);

    var json = null;
    try {
      json = /** @type {Object} */ (JSON.parse(response));
    } catch (e) {
      log.error(this.log, 'The Arc response JSON was invalid!');
    }

    this.toLoad_.length = 0;
    this.futureChildren_.length = 0;

    if (json) {
      if (json['error']) {
        // if this is defined, the server returned an internal error, so handle it instead of loading successfully
        this.handleError(json);
        return;
      }

      var version = /** @type {string} */ (json['currentVersion']);
      if (this.node_ instanceof ArcServer && version) {
        this.node_.setVersion(version + '');
      }

      var folders = /** @type {Array<string>} */ (json['folders']);
      if (folders && Array.isArray(folders)) {
        for (var i = 0, ii = folders.length; i < ii; i++) {
          var folder = folders[i];
          var folderNode = new ArcFolderNode(this.server_);
          folderNode.setLabel(folder);
          folderNode.listen(EventType.SUCCESS, this.onChildLoad, false, this);
          folderNode.listen(EventType.ERROR, this.onChildLoad, false, this);
          folderNode.load(this.url_ + '/' + folder);
          this.toLoad_.push(folderNode);
        }
      }

      var services = /** @type {Array<Object<string, string>>} */ (json['services']);
      if (services && Array.isArray(services)) {
        for (var j = 0, jj = services.length; j < jj; j++) {
          var service = services[j];
          var type = /** @type {string} */ (service['type']);
          var name = /** @type {string} */ (service['name']);
          name = name.substring(name.lastIndexOf('/') + 1);

          if (Object.values(arc.ServerType).includes(type)) {
            var url = this.url_ + '/' + name + '/' + type;
            var serviceNode = new ArcServiceNode(this.server_);
            serviceNode.setServiceType(type);
            serviceNode.setLabel(name);
            serviceNode.listen(EventType.SUCCESS, this.onChildLoad, false, this);
            serviceNode.listen(EventType.ERROR, this.onChildLoad, false, this);
            serviceNode.load(url);
            this.toLoad_.push(serviceNode);
          } else {
            log.info(this.log, `Skipping unsupported service "${name}" with type "${type}".`);
          }
        }
      }

      var layers = /** @type {Array<Object<string, string>>} */ (json['layers']);
      if (layers && Array.isArray(layers)) {
        var name = 'Folder';
        var lastIdx = this.url_.lastIndexOf('/MapServer');
        var type = arc.ServerType.MAP_SERVER;
        if (lastIdx == -1) {
          lastIdx = this.url_.lastIndexOf('/FeatureServer');
          type = arc.ServerType.FEATURE_SERVER;
        }
        if (lastIdx == -1) {
          lastIdx = this.url_.lastIndexOf('/ImageServer');
          type = arc.ServerType.IMAGE_SERVER;
        }

        if (lastIdx != -1) {
          // we have to manually extract the name...
          var url = this.url_ .substring(0, lastIdx);
          var slashIndex = url.lastIndexOf('/') + 1;
          name = url.substring(slashIndex);

          var serviceNode = new ArcServiceNode(this.server_);
          serviceNode.setServiceType(type);
          serviceNode.setLabel(name);
          serviceNode.listen(EventType.SUCCESS, this.onChildLoad, false, this);
          serviceNode.listen(EventType.ERROR, this.onChildLoad, false, this);
          serviceNode.load(this.url_);
          this.toLoad_.push(serviceNode);
        } else {
          log.info(this.log, `Skipping unsupported layer with URL "${this.url_}" and type "${type}".`);
        }
      }
    }

    if (this.toLoad_.length === 0) {
      // nothing in here, we're done
      this.dispatchEvent(EventType.SUCCESS);
    }
  }

  /**
   * @param {GoogEvent} evt The event
   * @protected
   */
  onChildLoad(evt) {
    var node = /** @type {SlickTreeNode} */ (evt.target);
    node.unlisten(EventType.SUCCESS, this.onChildLoad, false, this);
    node.unlisten(EventType.ERROR, this.onChildLoad, false, this);

    if (this.shouldAddNode(node)) {
      this.futureChildren_.push(node);
    }

    remove(this.toLoad_, node);

    if (this.toLoad_.length === 0) {
      // cull any folders that have only one child to reduce tree clutter
      this.futureChildren_.forEach(ArcLoader.collapseFolders);
      this.node_.setChildren(this.futureChildren_);
      this.futureChildren_ = [];
      this.dispatchEvent(EventType.SUCCESS);
    }
  }

  /**
   * @param {SlickTreeNode} node
   * @return {boolean}
   * @protected
   */
  shouldAddNode(node) {
    return !!(node.getChildren() && node.getChildren().length);
  }

  /**
   * Listener for Arc load request errors.
   *
   * @param {GoogEvent} event
   * @protected
   */
  onError(event) {
    this.errors_ = this.request_.getErrors();

    var uri = this.request_.getUri();
    dispose(this.request_);
    this.request_ = null;

    var href = uri.toString();
    var msg = 'Arc loading failed for URL: ' + href;
    this.handleError(msg);
  }

  /**
   * Handler for Arc load errors. Fires an error event.
   *
   * @param {(string|Object<string, *>)} error
   * @protected
   */
  handleError(error) {
    var msg;
    if (typeof error == 'string') {
      msg = error;
    } else if (typeof error == 'object') {
      // handle an Arc error code response
      var errorObj = error['error'] || {};
      msg = `Error loading Arc server. Code: ${errorObj['code']}. Reason: ${errorObj['message']}.`;

      this.errors_ = [errorObj['message']];
    } else {
      msg = 'An unknown error occurred.';
    }

    log.error(this.log, msg);
    this.dispatchEvent(EventType.ERROR);
  }

  /**
   * Removes folders that have only 1 child node and promotes the child up the tree by one.
   * @param {ITreeNode} child The child of whose grandchildren to examine.
   * @param {number} i The index.
   * @param {Array<ITreeNode>} arr The array.
   */
  static collapseFolders(child, i, arr) {
    const grandChildren = child.getChildren();
    if (grandChildren) {
      if (grandChildren.length == 1) {
        arr[i] = grandChildren[0];
      }

      grandChildren.forEach(ArcLoader.collapseFolders);
    }
  }
}

/**
 * @type {Logger}
 */
const logger = log.getLogger('plugin.arc.ArcLoader');


// Use this as the default class for loading an ArcGIS service/node.
arc.setLoaderClass(ArcLoader);
export default ArcLoader;
