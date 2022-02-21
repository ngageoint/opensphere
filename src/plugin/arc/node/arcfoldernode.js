goog.declareModuleId('plugin.arc.node.ArcFolderNode');

import LoadingNode from '../../../os/ui/slick/loadingnode.js';
import SlickTreeNode from '../../../os/ui/slick/slicktreenode.js';
import * as arc from '../arc.js';

const dispose = goog.require('goog.dispose');
const EventType = goog.require('goog.net.EventType');


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
