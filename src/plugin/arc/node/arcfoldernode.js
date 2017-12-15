goog.provide('plugin.arc.node.ArcFolderNode');
goog.require('os.ui.slick.LoadingNode');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Loads the capabilities from an Arc server and constructs the tree.
 * @param {plugin.arc.ArcServer} server
 * @extends {os.ui.slick.LoadingNode}
 * @constructor
 */
plugin.arc.node.ArcFolderNode = function(server) {
  plugin.arc.node.ArcFolderNode.base(this, 'constructor');

  /**
   * @type {plugin.arc.ArcServer}
   * @private
   */
  this.server_ = server;

  /**
   * @type {?plugin.arc.ArcLoader}
   * @private
   */
  this.loader_ = null;
};
goog.inherits(plugin.arc.node.ArcFolderNode, os.ui.slick.LoadingNode);


/**
 * Loads Arc node capabilities.
 * @param {string} url
 */
plugin.arc.node.ArcFolderNode.prototype.load = function(url) {
  this.setLoading(true);
  this.loader_ = plugin.arc.getArcLoader(new os.ui.slick.SlickTreeNode(), url, this.server_);
  this.loader_.listen(goog.net.EventType.SUCCESS, this.onLoad, false, this);
  this.loader_.listen(goog.net.EventType.ERROR, this.onError, false, this);
  this.loader_.load();
};


/**
 * Handler for Arc folder load success.
 * @param {goog.events.Event} event
 * @protected
 */
plugin.arc.node.ArcFolderNode.prototype.onLoad = function(event) {
  this.setLoading(false);
  this.loader_.unlisten(goog.net.EventType.SUCCESS, this.onLoad, false, this);
  this.loader_.unlisten(goog.net.EventType.ERROR, this.onError, false, this);
  this.setChildren(this.loader_.getNode().getChildren());
  goog.dispose(this.loader_);
  this.loader_ = null;
  this.dispatchEvent(goog.net.EventType.SUCCESS);
};


/**
 * Handler for Arc folder load errors.
 * @param {goog.events.Event} event
 * @protected
 */
plugin.arc.node.ArcFolderNode.prototype.onError = function(event) {
  this.setLoading(false);
  this.loader_.unlisten(goog.net.EventType.SUCCESS, this.onLoad, false, this);
  this.loader_.unlisten(goog.net.EventType.ERROR, this.onError, false, this);
  goog.dispose(this.loader_);
  this.loader_ = null;
  this.dispatchEvent(goog.net.EventType.ERROR);
};
