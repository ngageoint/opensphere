goog.declareModuleId('plugin.file.kml.ui.KMLNetworkLinkNode');

import {listen, unlistenByKey} from 'ol/src/events.js';
import AlertEventSeverity from '../../../../os/alert/alerteventseverity.js';
import AlertManager from '../../../../os/alert/alertmanager.js';
import osEventsEventType from '../../../../os/events/eventtype.js';
import PropertyChangeEvent from '../../../../os/events/propertychangeevent.js';
import MapEvent from '../../../../os/map/mapevent.js';
import MapContainer from '../../../../os/mapcontainer.js';
import * as net from '../../../../os/net/net.js';
import Request from '../../../../os/net/request.js';
import TriState from '../../../../os/structs/tristate.js';
import osThreadEventType from '../../../../os/thread/eventtype.js';
import * as time from '../../../../os/time/time.js';
import * as kml from '../../../../os/ui/file/kml/kml.js';
import KMLSourceEvent from '../kmlsourceevent.js';
import KMLNode from './kmlnode.js';
import NetworkLinkIcons from './networklinkicons.js';

const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');
const ResponseType = goog.require('goog.net.XhrIo.ResponseType');
const userAgent = goog.require('goog.userAgent');

/**
 * Tree node for KML network links
 */
export default class KMLNetworkLinkNode extends KMLNode {
  /**
   * Constructor.
   * @param {string} uri The network link URI
   */
  constructor(uri) {
    super();
    this.checkboxTooltip = 'Enable/disable the network link';

    // Don't bubble child state up to the network link, or disabling children will unload the link.
    this.setBubbleState(false);

    // Network links should default to being turned off.
    this.setState(TriState.OFF);

    /**
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {number}
     * @private
     */
    this.durationStart_ = 0;

    /**
     * The icon displayed on the node UI
     * @type {!NetworkLinkIcons}
     * @private
     */
    this.icon_ = NetworkLinkIcons.INACTIVE;

    /**
     * The network link importer
     * @type {KMLImporter}
     * @private
     */
    this.importer_ = null;

    /**
     * The network link request
     * @type {Request}
     * @private
     */
    this.request_ = null;

    /**
     * How often the network link will refresh in milliseconds. Default value (4 seconds) provided by the KML spec.
     * @type {number}
     * @private
     */
    this.refreshInterval_ = 4000;

    /**
     * The minimum network link refresh in milliseconds - defined by the NetworkLinkControl
     * @type {number}
     * @private
     */
    this.minRefreshPeriod_ = 0;

    /**
     * The refresh mode for the network link
     * @type {kml.RefreshMode}
     * @private
     */
    this.refreshMode_ = kml.RefreshMode.CHANGE;

    /**
     * The network link refresh timer
     * @type {Delay}
     * @private
     */
    this.refreshTimer_ = null;

    /**
     * How often the network link will refresh in milliseconds.
     * @type {number}
     * @private
     */
    this.viewRefreshInterval_ = 4000;

    /**
     * The view refresh mode for the network link.
     * @type {kml.ViewRefreshMode}
     * @private
     */
    this.viewRefreshMode_ = kml.ViewRefreshMode.NEVER;

    /**
     * The view refresh timer.
     * @type {Delay}
     * @private
     */
    this.viewRefreshTimer_ = null;

    /**
     * The network link URI
     * @type {string}
     * @private
     */
    this.uri_ = uri;

    this.sourceListenKey;

    this.updateRefreshTimer_();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    MapContainer.getInstance().unlisten(MapEvent.VIEW_CHANGE, this.onViewChange_, false, this);
    dispose(this.importer_);
    dispose(this.request_);
    dispose(this.refreshTimer_);
    dispose(this.viewRefreshTimer_);
  }

  /**
   * Clear the network link's features from the source.
   *
   * @private
   */
  clear_() {
    if (this.source) {
      this.source.clearNode(this);
      this.setChildren(null);
    }
  }

  /**
   * Gets a string representing the duration from the last time durationStart_ was set. Resets durationStart_ for
   * subsequent calls in the same request sequence.
   *
   * @return {string}
   * @private
   */
  durationString_() {
    var now = Date.now();
    var duration = new Date(now - this.durationStart_);
    var durationString = ' in ' + time.formatDate(duration, 'mm:ss.SSS');
    this.durationStart_ = now;

    return durationString;
  }

  /**
   * Displays an error message and disables the node.
   *
   * @param {string} msg The error message
   * @private
   */
  handleError_(msg) {
    var errorMsg = 'Unable to load KML network link "' + this.getLabel() + '"' + this.urlLogString_() + ': ' + msg;
    log.error(this.log, errorMsg);
    AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR);
    this.setState(TriState.OFF);
    this.setIcon_(NetworkLinkIcons.ERROR);
    this.setLoading(false);
  }

  /**
   * Gets a string representing the URL for the source request.
   *
   * @return {string}
   * @private
   */
  urlLogString_() {
    return ' (' + this.uri_ + ')';
  }

  /**
   * Get the refresh interval for the network link.
   *
   * @return {number}
   */
  getRefreshInterval() {
    return this.refreshMode_ == kml.RefreshMode.INTERVAL ? this.refreshInterval_ : 0;
  }

  /**
   * Set the refresh interval for the network link. If {@link refreshMode} is set to
   * {@link kml.RefreshMode.INTERVAL}, the network link will be refreshed after the provided amount of time.
   * The timer will not be started until data import has completed.
   *
   * @param {number} value The refresh interval in milliseconds, or zero to prevent automatic refresh
   */
  setRefreshInterval(value) {
    // value should always be positive - negative values will prevent refresh
    this.refreshInterval_ = Math.max(value, this.minRefreshPeriod_);
    this.updateRefreshTimer_();
  }

  /**
   * Set the minimum refresh interval for the network link.
   *
   * @param {number} value The minimum refresh interval in milliseconds, or zero to prevent automatic refresh
   */
  setMinRefreshPeriod(value) {
    // value should always be positive - negative values will prevent refresh
    this.minRefreshPeriod_ = Math.max(value, 0);
    this.setRefreshInterval(this.refreshInterval_); // update the refresh interval, if needed
  }

  /**
   * Get the refresh mode for the network link.
   *
   * @return {kml.RefreshMode}
   */
  getRefreshMode() {
    return this.refreshMode_;
  }

  /**
   * Set the refresh mode for the network link.
   *
   * @param {kml.RefreshMode} value
   */
  setRefreshMode(value) {
    this.refreshMode_ = value;
    this.updateRefreshTimer_();
  }

  /**
   * Updates the refresh timer based on the current refresh mode/interval.
   *
   * @private
   */
  updateRefreshTimer_() {
    var active = false;
    if (this.refreshTimer_) {
      active = this.refreshTimer_.isActive();
      this.refreshTimer_.dispose();
    }

    this.refreshTimer_ = new Delay(this.onRefreshTimer_, this.getRefreshInterval(), this);
    if (active) {
      this.refreshTimer_.start();
    }
  }

  /**
   * Get the view refresh mode.
   *
   * @return {kml.ViewRefreshMode}
   */
  getViewRefreshMode() {
    return this.viewRefreshMode_;
  }

  /**
   * Set the view refresh mode.
   *
   * @param {kml.ViewRefreshMode} value
   */
  setViewRefreshMode(value) {
    this.viewRefreshMode_ = value;
  }

  /**
   * Set the view refresh interval for the network link. If {@link viewRefreshMode} is set to
   * {@link kml.ViewRefreshMode.STOP}, the link refreshes this many milliseconds after the camera stops moving.
   *
   * @param {number} value The refresh timer in seconds, or zero to prevent automatic refresh
   */
  setViewRefreshTimer(value) {
    // value should always be positive - negative values will prevent refresh
    this.viewRefreshInterval_ = Math.max(value, 0);
    this.updateViewRefreshTimer_();
  }

  /**
   * Updates the view refresh timer.
   *
   * @private
   */
  updateViewRefreshTimer_() {
    dispose(this.viewRefreshTimer_);

    if (this.viewRefreshInterval_) {
      MapContainer.getInstance().listen(MapEvent.VIEW_CHANGE, this.onViewChange_, false, this);
      this.viewRefreshTimer_ = new Delay(this.onRefreshTimer_, this.viewRefreshInterval_, this);
    } else {
      MapContainer.getInstance().unlisten(MapEvent.VIEW_CHANGE, this.onViewChange_, false, this);
      this.viewRefreshTimer_ = null;
    }
  }

  /**
   * Handles changes to the view.
   *
   * @private
   */
  onViewChange_() {
    if (this.viewRefreshTimer_ && this.getState() != TriState.OFF) {
      if (this.isLoading() && this.request_) {
        // cancel the pending request
        this.request_.abort();
      }

      this.viewRefreshTimer_.start();
    }
  }

  /**
   * Manually trigger a network link refresh.
   */
  refresh() {
    if (this.refreshTimer_) {
      this.refreshTimer_.fire();
    } else {
      this.onRefreshTimer_();
    }
  }

  /**
   * Handle the refresh timer firing.
   *
   * @private
   */
  onRefreshTimer_() {
    if (!this.request_) {
      this.request_ = new Request(this.uri_);

      // requesting a Document in the response was slightly faster in testing, but only works for KML (not KMZ). if we run
      // into related issues of parsing speed, we should try to determine the content type ahead of time and change this.
      if (!userAgent.IE || userAgent.isVersionOrHigher(10)) {
        this.request_.setResponseType(ResponseType.ARRAY_BUFFER);
      }

      this.request_.listen(EventType.SUCCESS, this.onRequestComplete_, false, this);
      this.request_.listen(EventType.ERROR, this.onRequestError_, false, this);
    }

    if (this.source) {
      // clear previous features loaded by the network link.
      // TODO it would be better to gracefully replace features instead of clearing everything prior to loading the
      //      request. this causes all features to be wiped from the application on every refresh which could be annoying
      //      to the user.
      this.source.clearNode(this);

      this.setLoading(true);
      this.setIcon_(NetworkLinkIcons.LOADING);

      if (this.viewRefreshMode_ !== kml.ViewRefreshMode.NEVER) {
        // include the BBOX as part of the request URL, the {extent} tag is handled by the variable replacer
        var uri = this.request_.getUri();
        uri.setParameterValue('BBOX', '{extent:west},{extent:south},{extent:east},{extent:north}');
      }

      this.durationStart_ = Date.now();
      this.request_.load();
    } else {
      this.handleError_('source is null');
    }
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    if (this.source) {
      unlistenByKey(this.sourceListenKey);
    }

    super.setSource(source);

    if (this.source) {
      this.sourceListenKey = listen(this.source, KMLSourceEvent.REFRESH, this.onSourceRefresh_, this);
    }
  }

  /**
   * Refresh the network link when the source is refreshed.
   *
   * @private
   */
  onSourceRefresh_() {
    if (this.getState() != TriState.OFF) {
      this.refresh();
    }
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    var old = this.getState();
    super.setState(value);
    var s = this.getState();

    if (old != s) {
      if (s == TriState.OFF) {
        // network link has been disabled, so stop everything!
        if (this.refreshTimer_) {
          this.refreshTimer_.stop();
        }

        if (this.request_) {
          this.request_.abort();
        }

        if (this.importer_) {
          this.importer_.stop();
        }

        this.clear_();
        this.setIcon_(NetworkLinkIcons.INACTIVE);
        this.setLoading(false);
      } else if (this.source) {
        if (!this.importer_) {
          // first time activating - get an importer from the source. the importer can't be created here because we'll
          // introduce a circular dependency with the parser.
          this.importer_ = this.source.createImporter();
          this.importer_.setTrustHTML(net.isTrustedUri(this.uri_));
          this.importer_.listen(osThreadEventType.PROGRESS, this.onImportProgress_, false, this);
          this.importer_.listen(osEventsEventType.COMPLETE, this.onImportComplete_, false, this);
        }

        if (this.refreshTimer_ && !this.refreshTimer_.isActive() && old == TriState.OFF) {
          this.refreshTimer_.fire();
        }
      }
    }
  }

  /**
   * Request success handler.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onRequestComplete_(event) {
    var msg = 'Request complete for ' + this.getLabel() + this.urlLogString_() + this.durationString_();
    log.info(this.log, msg);

    var response = /** @type {string} */ (this.request_.getResponse());
    this.request_.clearResponse();

    if (response) {
      if (this.importer_) {
        this.importer_.startImport(response);
      } else {
        this.handleError_('importer is null');
      }
    } else {
      this.handleError_('response is empty');
    }
  }

  /**
   * Request error handler.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onRequestError_(event) {
    this.handleError_(this.request_ ? this.request_.getErrors().join(' ') : 'unknown error');
    this.request_.clearResponse();
  }

  /**
   * Import success handler.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onImportProgress_(event) {
    // KML parsing is about 30% faster in FF if this is done in one shot in the complete handler, instead of here. the
    // slowdown is caused by the renderer and parser competing for resources, since FF has a much slower canvas renderer.
    // moving this to the complete handler will prevent any features from displaying until the parser is done, instead of
    // displaying them piecemeal and providing the user with some feedback.
    if (this.importer_ && this.source) {
      this.source.addNodes(this.importer_.getData());
    }
  }

  /**
   * Import success handler.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onImportComplete_(event) {
    var msg = 'Import complete for ' + this.getLabel() + this.urlLogString_() + this.durationString_();
    log.info(this.log, msg);

    this.setLoading(false);

    var children = this.getChildren();
    var currentRoot = children && children.length > 0 ? children[0] : null;
    var rootNode = this.importer_.getRootNode();
    var rootChildren = rootNode ? rootNode.getChildren() : [];
    var firstRootChild = rootChildren && rootChildren.length > 0 ? rootChildren[0] : null;
    if (currentRoot !== firstRootChild || ((children) && (children.length != rootChildren.length))) {
      // the root node will only change on the first parse, or when the root name changes and we can't merge
      this.setChildren(rootChildren ? rootChildren : null);
      this.collapsed = rootNode == null;
    }

    // TODO: increase the refresh interval for lengthy imports? waiting to start the timer helps, but if the interval is
    // short you'll hardly have a chance to look at the data.

    if (this.getState() != TriState.OFF) {
      // network link still active - good to go!
      this.setIcon_(NetworkLinkIcons.ACTIVE);

      // use min refresh interval defined by NetworkLinkControl
      this.setMinRefreshPeriod(this.importer_.getMinRefreshPeriod());

      // start the refresh timer after the entire import process is complete to avoid refreshing mid-import
      if (this.refreshTimer_ && this.getRefreshInterval() > 0) {
        this.refreshTimer_.start();
      }
    } else {
      // network link was disabled - drop the imported features from the source
      this.clear_();
    }
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    return this.icon_;
  }

  /**
   * Set the network link icon displayed on the node.
   *
   * @param {NetworkLinkIcons} value The icon to display
   * @private
   */
  setIcon_(value) {
    this.icon_ = value;
    this.dispatchEvent(new PropertyChangeEvent('icons'));
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.file.kml.ui.KMLNetworkLinkNode');
