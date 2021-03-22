goog.provide('plugin.arc.ArcLoader');

goog.require('goog.events.EventTarget');
goog.require('goog.log.Logger');
goog.require('ol.array');
goog.require('os.net.Request');
goog.require('plugin.arc');
goog.require('plugin.arc.ArcServer');
goog.require('plugin.arc.IArcLoader');
goog.require('plugin.arc.node.ArcFolderNode');
goog.require('plugin.arc.node.ArcServiceNode');



/**
 * Loads the capabilities from an Arc server and constructs the tree.
 *
 * @param {os.ui.slick.SlickTreeNode} node
 * @param {string} url
 * @param {plugin.arc.ArcServer} server
 *
 * @implements {plugin.arc.IArcLoader}
 * @extends {goog.events.EventTarget}
 *
 * @constructor
 */
plugin.arc.ArcLoader = function(node, url, server) {
  plugin.arc.ArcLoader.base(this, 'constructor');

  /**
   * @type {os.ui.slick.SlickTreeNode}
   * @private
   */
  this.node_ = node;

  /**
   * @type {string}
   * @private
   */
  this.url_ = url;

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

  /**
   * @type {Array<string>}
   * @private
   */
  this.errors_ = null;

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = plugin.arc.ArcLoader.LOGGER_;

  /**
   * @type {!Array<!os.ui.slick.SlickTreeNode>}
   * @private
   */
  this.toLoad_ = [];

  /**
   * @type {!Array<!os.ui.slick.SlickTreeNode>}
   * @private
   */
  this.futureChildren_ = [];
};
goog.inherits(plugin.arc.ArcLoader, goog.events.EventTarget);


/**
 * @const
 * @type {goog.log.Logger}
 * @private
 */
plugin.arc.ArcLoader.LOGGER_ = goog.log.getLogger('plugin.arc.ArcLoader');


/**
 * @inheritDoc
 */
plugin.arc.ArcLoader.prototype.disposeInternal = function() {
  plugin.arc.ArcLoader.base(this, 'disposeInternal');

  this.node_ = null;
  this.server_ = null;

  if (this.request_) {
    goog.dispose(this.request_);
    this.request_ = null;
  }
};


/**
 * @inheritDoc
 */
plugin.arc.ArcLoader.prototype.getErrors = function() {
  return this.errors_;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcLoader.prototype.getUrl = function() {
  return this.url_;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcLoader.prototype.setUrl = function(value) {
  this.url_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcLoader.prototype.getNode = function() {
  return this.node_;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcLoader.prototype.setNode = function(value) {
  this.node_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcLoader.prototype.getServer = function() {
  return this.server_;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcLoader.prototype.setServer = function(value) {
  this.server_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcLoader.prototype.load = function() {
  goog.asserts.assert(this.url_, 'No URL provided to the Arc Loader!');
  goog.asserts.assert(this.node_, 'No node provided to the Arc Loader!');
  goog.asserts.assert(this.server_, 'No server provided to the Arc Loader!');

  var requestUrl = this.url_ + '?f=json';
  goog.log.fine(this.log, 'Loading Arc capabilities from URL: ' + requestUrl);

  this.errors_ = null;

  this.request_ = new os.net.Request(requestUrl);
  this.request_.setValidator(plugin.arc.getException);
  this.request_.setHeader('Accept', '*/*');
  this.request_.listen(goog.net.EventType.SUCCESS, this.onLoad, false, this);
  this.request_.listen(goog.net.EventType.ERROR, this.onError, false, this);
  this.request_.load();
};


/**
 * Handler for successful load of the Arc node capabilities.
 *
 * @param {goog.events.Event} event
 * @protected
 */
plugin.arc.ArcLoader.prototype.onLoad = function(event) {
  var response = /** @type {string} */ (this.request_.getResponse());
  goog.dispose(this.request_);
  this.request_ = null;

  goog.log.fine(this.log, 'Arc load successful from: ' + this.url_);

  var json = null;
  try {
    json = /** @type {Object} */ (JSON.parse(response));
  } catch (e) {
    goog.log.error(this.log, 'The Arc response JSON was invalid!');
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
    if (this.node_ instanceof plugin.arc.ArcServer && version) {
      this.node_.setVersion(version + '');
    }

    var folders = /** @type {Array<string>} */ (json['folders']);
    if (folders && Array.isArray(folders)) {
      for (var i = 0, ii = folders.length; i < ii; i++) {
        var folder = folders[i];
        var folderNode = new plugin.arc.node.ArcFolderNode(this.server_);
        folderNode.setLabel(folder);
        folderNode.listen(goog.net.EventType.SUCCESS, this.onChildLoad, false, this);
        folderNode.listen(goog.net.EventType.ERROR, this.onChildLoad, false, this);
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

        if (Object.values(plugin.arc.ServerType).includes(type)) {
          var url = this.url_ + '/' + name + '/' + type;
          var serviceNode = new plugin.arc.node.ArcServiceNode(this.server_);
          serviceNode.setServiceType(type);
          serviceNode.setLabel(name);
          serviceNode.listen(goog.net.EventType.SUCCESS, this.onChildLoad, false, this);
          serviceNode.listen(goog.net.EventType.ERROR, this.onChildLoad, false, this);
          serviceNode.load(url);
          this.toLoad_.push(serviceNode);
        } else {
          goog.log.info(this.log, `Skipping unsupported service "${name}" with type "${type}".`);
        }
      }
    }

    var layers = /** @type {Array<Object<string, string>>} */ (json['layers']);
    if (layers && Array.isArray(layers)) {
      var name = 'Folder';
      var lastIdx = this.url_.lastIndexOf('/MapServer');
      var type = plugin.arc.ServerType.MAP_SERVER;
      if (lastIdx == -1) {
        lastIdx = this.url_.lastIndexOf('/FeatureServer');
        type = plugin.arc.ServerType.FEATURE_SERVER;
      }
      if (lastIdx == -1) {
        lastIdx = this.url_.lastIndexOf('/ImageServer');
        type = plugin.arc.ServerType.IMAGE_SERVER;
      }

      if (lastIdx != -1) {
        // we have to manually extract the name...
        var url = this.url_ .substring(0, lastIdx);
        var slashIndex = url.lastIndexOf('/') + 1;
        name = url.substring(slashIndex);

        var serviceNode = new plugin.arc.node.ArcServiceNode(this.server_);
        serviceNode.setServiceType(type);
        serviceNode.setLabel(name);
        serviceNode.listen(goog.net.EventType.SUCCESS, this.onChildLoad, false, this);
        serviceNode.listen(goog.net.EventType.ERROR, this.onChildLoad, false, this);
        serviceNode.load(this.url_);
        this.toLoad_.push(serviceNode);
      } else {
        goog.log.info(this.log, `Skipping unsupported layer with URL "${this.url_}" and type "${type}".`);
      }
    }
  }

  if (this.toLoad_.length === 0) {
    // nothing in here, we're done
    this.dispatchEvent(goog.net.EventType.SUCCESS);
  }
};


/**
 * @param {goog.events.Event} evt The event
 * @protected
 */
plugin.arc.ArcLoader.prototype.onChildLoad = function(evt) {
  var node = /** @type {os.ui.slick.SlickTreeNode} */ (evt.target);
  node.unlisten(goog.net.EventType.SUCCESS, this.onChildLoad, false, this);
  node.unlisten(goog.net.EventType.ERROR, this.onChildLoad, false, this);

  if (this.shouldAddNode(node)) {
    this.futureChildren_.push(node);
  }

  ol.array.remove(this.toLoad_, node);

  if (this.toLoad_.length === 0) {
    // cull any folders that have only one child to reduce tree clutter
    this.futureChildren_.forEach(plugin.arc.ArcLoader.collapseFolders);
    this.node_.setChildren(this.futureChildren_);
    this.futureChildren_ = [];
    this.dispatchEvent(goog.net.EventType.SUCCESS);
  }
};


/**
 * @param {os.ui.slick.SlickTreeNode} node
 * @return {boolean}
 * @protected
 */
plugin.arc.ArcLoader.prototype.shouldAddNode = function(node) {
  return !!(node.getChildren() && node.getChildren().length);
};


/**
 * Listener for Arc load request errors.
 *
 * @param {goog.events.Event} event
 * @protected
 */
plugin.arc.ArcLoader.prototype.onError = function(event) {
  this.errors_ = this.request_.getErrors();

  var uri = this.request_.getUri();
  goog.dispose(this.request_);
  this.request_ = null;

  var href = uri.toString();
  var msg = 'Arc loading failed for URL: ' + href;
  this.handleError(msg);
};


/**
 * Handler for Arc load errors. Fires an error event.
 *
 * @param {(string|Object<string, *>)} error
 * @protected
 */
plugin.arc.ArcLoader.prototype.handleError = function(error) {
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

  goog.log.error(this.log, msg);
  this.dispatchEvent(goog.net.EventType.ERROR);
};


/**
 * Removes folders that have only 1 child node and promotes the child up the tree by one.
 * @param {os.structs.ITreeNode} child The child of whose grandchildren to examine.
 * @param {number} i The index.
 * @param {Array<os.structs.ITreeNode>} arr The array.
 */
plugin.arc.ArcLoader.collapseFolders = function(child, i, arr) {
  const grandChildren = child.getChildren();
  if (grandChildren) {
    if (grandChildren.length == 1) {
      arr[i] = grandChildren[0];
    }

    grandChildren.forEach(plugin.arc.ArcLoader.collapseFolders);
  }
};
