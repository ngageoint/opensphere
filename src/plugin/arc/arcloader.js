goog.provide('plugin.arc.ArcLoader');
goog.require('goog.events.EventTarget');
goog.require('goog.log.Logger');
goog.require('os.net.Request');
goog.require('plugin.arc.node.ArcFolderNode');
goog.require('plugin.arc.node.ArcServiceNode');



/**
 * Loads the capabilities from an Arc server and constructs the tree.
 * @param {os.ui.slick.SlickTreeNode} node
 * @param {string} url
 * @param {plugin.arc.ArcServer} server
 * @extends {goog.events.EventTarget}
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
 * @type {goog.debug.Logger}
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
 * Get the URL
 * @return {string}
 */
plugin.arc.ArcLoader.prototype.getUrl = function() {
  return this.url_;
};


/**
 * Set the URL
 * @param {string} value
 */
plugin.arc.ArcLoader.prototype.setUrl = function(value) {
  this.url_ = value;
};


/**
 * Get the node
 * @return {?os.ui.slick.SlickTreeNode}
 */
plugin.arc.ArcLoader.prototype.getNode = function() {
  return this.node_;
};


/**
 * Set the node
 * @param {os.ui.slick.SlickTreeNode} value
 */
plugin.arc.ArcLoader.prototype.setNode = function(value) {
  this.node_ = value;
};


/**
 * Get the server
 * @return {?plugin.arc.ArcServer}
 */
plugin.arc.ArcLoader.prototype.getServer = function() {
  return this.server_;
};


/**
 * Set the server
 * @param {?plugin.arc.ArcServer} value
 */
plugin.arc.ArcLoader.prototype.setServer = function(value) {
  this.server_ = value;
};


/**
 * Loads Arc node capabilities.
 */
plugin.arc.ArcLoader.prototype.load = function() {
  goog.asserts.assert(this.url_, 'No URL provided to the Arc Loader!');
  goog.asserts.assert(this.node_, 'No node provided to the Arc Loader!');
  goog.asserts.assert(this.server_, 'No server provided to the Arc Loader!');

  var requestUrl = this.url_ + '?f=json';
  goog.log.fine(this.log, 'Loading Arc capabilities from URL: ' + requestUrl);

  this.request_ = new os.net.Request(requestUrl);
  this.request_.setHeader('Accept', '*/*');
  this.request_.listen(goog.net.EventType.SUCCESS, this.onLoad, false, this);
  this.request_.listen(goog.net.EventType.ERROR, this.onError, false, this);
  this.request_.load();
};


/**
 * Handler for successful load of the Arc node capabilities.
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
    json = JSON.parse(response);
  } catch (e) {
    goog.log.error(this.log, 'The Arc response JSON was invalid!');
  }

  this.toLoad_.length = 0;
  this.futureChildren_.length = 0;

  if (json) {
    var version = /** @type {string} */ (json['currentVersion']);
    if (this.node_ instanceof plugin.arc.ArcServer && version) {
      this.node_.setVersion(version + '');
    }

    var folders = /** @type {Array<string>} */ (json['folders']);
    if (folders && goog.isArray(folders)) {
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
    if (services && goog.isArray(services)) {
      for (var j = 0, jj = services.length; j < jj; j++) {
        var service = services[j];
        var type = service['type'];
        if (type === plugin.arc.MAP_SERVER) {
          var name = /** @type {string} */ (service['name']);
          name = name.substring(name.lastIndexOf('/') + 1);
          var serviceNode = new plugin.arc.node.ArcServiceNode(this.server_);
          serviceNode.setLabel(name);
          serviceNode.listen(goog.net.EventType.SUCCESS, this.onChildLoad, false, this);
          serviceNode.listen(goog.net.EventType.ERROR, this.onChildLoad, false, this);
          serviceNode.load(this.url_ + '/' + name);
          this.toLoad_.push(serviceNode);
        }
      }
    }

    var layers = /** @type {Array<Object<string, string>>} */ (json['layers']);
    if (layers && goog.isArray(layers)) {
      var name = 'Folder';
      var lastIdx = this.url_.lastIndexOf('/MapServer');
      if (lastIdx == -1) {
        lastIdx = this.url_.lastIndexOf('/FeatureServer');
      }

      if (lastIdx != -1) {
        // we have to manually extract the name...
        var url = this.url_ .substring(0, lastIdx);
        var slashIndex = url.lastIndexOf('/') + 1;
        name = url.substring(slashIndex);
      }

      var serviceNode = new plugin.arc.node.ArcServiceNode(this.server_);
      serviceNode.setLabel(name);
      serviceNode.listen(goog.net.EventType.SUCCESS, this.onChildLoad, false, this);
      serviceNode.listen(goog.net.EventType.ERROR, this.onChildLoad, false, this);
      serviceNode.load(this.url_);
      this.toLoad_.push(serviceNode);
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

  goog.array.remove(this.toLoad_, node);

  if (this.toLoad_.length === 0) {
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
 * Handler for Arc load errors. Fires an error event.
 * @param {goog.events.Event} event
 * @protected
 */
plugin.arc.ArcLoader.prototype.onError = function(event) {
  var uri = this.request_.getUri();
  goog.dispose(this.request_);
  this.request_ = null;

  var href = uri.toString();
  var msg = 'Arc loading failed for URL: ' + href;
  goog.log.error(this.log, msg);

  this.dispatchEvent(goog.net.EventType.ERROR);
};
