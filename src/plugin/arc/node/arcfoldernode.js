goog.module('plugin.arc.node.ArcFolderNode');
goog.module.declareLegacyNamespace();

const LoadingNode = goog.require('os.ui.slick.LoadingNode');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');


/**
 * Loads the capabilities from an Arc server and constructs the tree.
 */
class ArcFolderNode extends LoadingNode {
  /**
   * Constructor.
   * @param {plugin.arc.ArcServer} server
   */
  constructor(server) {
    super();

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
  }

  /**
   * Loads Arc node capabilities.
   *
   * @param {string} url
   */
  load(url) {
    this.setLoading(true);
    this.loader_ = plugin.arc.getArcLoader(new SlickTreeNode(), url, this.server_);
    this.loader_.listen(goog.net.EventType.SUCCESS, this.onLoad, false, this);
    this.loader_.listen(goog.net.EventType.ERROR, this.onError, false, this);
    this.loader_.load();
  }

  /**
   * Handler for Arc folder load success.
   *
   * @param {goog.events.Event} event
   * @protected
   */
  onLoad(event) {
    this.setLoading(false);
    this.loader_.unlisten(goog.net.EventType.SUCCESS, this.onLoad, false, this);
    this.loader_.unlisten(goog.net.EventType.ERROR, this.onError, false, this);
    this.setChildren(this.loader_.getNode().getChildren());
    goog.dispose(this.loader_);
    this.loader_ = null;
    this.dispatchEvent(goog.net.EventType.SUCCESS);
  }

  /**
   * Handler for Arc folder load errors.
   *
   * @param {goog.events.Event} event
   * @protected
   */
  onError(event) {
    this.setLoading(false);
    this.loader_.unlisten(goog.net.EventType.SUCCESS, this.onLoad, false, this);
    this.loader_.unlisten(goog.net.EventType.ERROR, this.onError, false, this);
    goog.dispose(this.loader_);
    this.loader_ = null;
    this.dispatchEvent(goog.net.EventType.ERROR);
  }
}

exports = ArcFolderNode;
