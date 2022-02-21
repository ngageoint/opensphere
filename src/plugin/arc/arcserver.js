goog.declareModuleId('plugin.arc.ArcServer');

import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import AlertManager from '../../os/alert/alertmanager.js';
import IDataProvider from '../../os/data/idataprovider.js';
import osImplements from '../../os/implements.js';
import * as ogc from '../../os/ogc/ogc.js';
import AbstractLoadingServer from '../../os/ui/server/abstractloadingserver.js';
import SlickTreeNode from '../../os/ui/slick/slicktreenode.js';
import * as arc from './arc.js';

const asserts = goog.require('goog.asserts');
const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');


/**
 * Provider representing an Arc Server.
 *
 * @implements {IDataProvider}
 */
class ArcServer extends AbstractLoadingServer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.providerType = ogc.ID;

    /**
     * @type {IArcLoader}
     * @private
     */
    this.loader_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.version_ = null;

    /**
     * @type {Logger}
     * @protected
     */
    this.log = logger;
  }

  /**
   * Get the Arc version
   *
   * @return {?string}
   */
  getVersion() {
    return this.version_;
  }

  /**
   * Set the Arc version
   *
   * @param {?string} value
   */
  setVersion(value) {
    this.version_ = value;
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);

    var url = /** @type {string} */ (config['url']);
    var i = url.indexOf('/rest/services');
    if (i == -1) {
      url += '/rest/services';
    }

    // trim trailing slashes
    url = url.replace(/\/+$/, '');

    if (config['id']) {
      this.setId(/** @type {string} */ (config['id']));
    }

    this.setUrl(url);
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
    asserts.assert(this.url, 'Attempted to load server ' + this.getLabel() + ' without URL!');
    super.load(opt_ping);
    log.info(this.log, this.getLabel() + ' requesting Arc Server capabilities.');

    this.setChildren(null);

    this.loader_ = arc.getArcLoader(new SlickTreeNode(), this.url, this);
    this.loader_.load();
    this.loader_.listen(EventType.SUCCESS, this.onLoad, false, this);
    this.loader_.listen(EventType.ERROR, this.onError, false, this);
  }

  /**
   * Handler for Arc server load success.
   *
   * @param {GoogEvent} event
   * @protected
   */
  onLoad(event) {
    log.info(this.log, this.getLabel() + ' base Arc server capabilities loaded.');
    this.loader_.unlisten(EventType.SUCCESS, this.onLoad, false, this);
    this.loader_.unlisten(EventType.ERROR, this.onError, false, this);
    this.setChildren(this.loader_.getNode().getChildren());
    this.disposeLoader_();

    this.setLoading(false);
  }

  /**
   * Handler for Arc server load errors.
   *
   * @param {GoogEvent} event
   * @protected
   */
  onError(event) {
    var errors = this.loader_.getErrors();
    this.loader_.unlisten(EventType.SUCCESS, this.onLoad, false, this);
    this.loader_.unlisten(EventType.ERROR, this.onError, false, this);
    this.disposeLoader_();

    var href = this.getUrl();
    var msg = 'Request failed for <a target="_blank" href="' + href + '">Arc Server Capabilities</a>';
    if (errors && errors.length) {
      msg += `: ${errors.join(', ')}`;
    }

    this.logError(msg);
    this.setLoading(false);
  }

  /**
   * Logs an error and sets the server to an error state.
   *
   * @param {string} msg The error message.
   * @protected
   */
  logError(msg) {
    if (!this.getError()) {
      var errorMsg = 'Server [' + this.getLabel() + ']: ' + msg;

      if (!this.getPing()) {
        AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR);
      }

      log.error(logger, errorMsg);

      this.setErrorMessage(errorMsg);
      this.setLoading(false);
    }
  }

  /**
   * Disposes of the loader.
   *
   * @private
   */
  disposeLoader_() {
    if (this.loader_) {
      dispose(this.loader_);
      this.loader_ = null;
    }
  }
}

osImplements(ArcServer, IDataProvider.ID);


/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('plugin.arc.ArcServer');


/**
 * Default color for Arc descriptors.
 * @const
 * @type {string}
 */
ArcServer.DEFAULT_COLOR = 'rgba(255,255,255,1)';


export default ArcServer;
