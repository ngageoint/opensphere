goog.declareModuleId('plugin.arc.node.ArcFolderNode');

const dispose = goog.require('goog.dispose');
const EventType = goog.require('goog.net.EventType');
const LoadingNode = goog.require('os.ui.slick.LoadingNode');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');
const arc = goog.require('plugin.arc');

const GoogEvent = goog.requireType('goog.events.Event');
const ArcServer = goog.requireType('plugin.arc.ArcServer');
const IArcLoader = goog.requireType('plugin.arc.IArcLoader');


/**
 * Loads the capabilities from an Arc server and constructs the tree.
 */
class ArcFolderNode extends LoadingNode {
  /**
   * Constructor.
   * @param {ArcServer} server
   */
  constructor(server) {
    super();

    /**
     * @type {ArcServer}
     * @private
     */
    this.server_ = server;

    /**
     * @type {IArcLoader}
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
    this.loader_ = arc.getArcLoader(new SlickTreeNode(), url, this.server_);
    this.loader_.listen(EventType.SUCCESS, this.onLoad, false, this);
    this.loader_.listen(EventType.ERROR, this.onError, false, this);
    this.loader_.load();
  }

  /**
   * Handler for Arc folder load success.
   *
   * @param {GoogEvent} event
   * @protected
   */
  onLoad(event) {
    this.setLoading(false);
    this.loader_.unlisten(EventType.SUCCESS, this.onLoad, false, this);
    this.loader_.unlisten(EventType.ERROR, this.onError, false, this);
    this.setChildren(this.loader_.getNode().getChildren());
    dispose(this.loader_);
    this.loader_ = null;
    this.dispatchEvent(EventType.SUCCESS);
  }

  /**
   * Handler for Arc folder load errors.
   *
   * @param {GoogEvent} event
   * @protected
   */
  onError(event) {
    this.setLoading(false);
    this.loader_.unlisten(EventType.SUCCESS, this.onLoad, false, this);
    this.loader_.unlisten(EventType.ERROR, this.onError, false, this);
    dispose(this.loader_);
    this.loader_ = null;
    this.dispatchEvent(EventType.ERROR);
  }
}

export default ArcFolderNode;
