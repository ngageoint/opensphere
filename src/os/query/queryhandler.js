goog.declareModuleId('os.query.QueryHandler');

import {listen, unlistenByKey} from 'ol/src/events.js';

import UIQueryHandler from '../ui/query/queryhandler.js';
import {getQueryManager} from './queryinstance.js';

const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');

const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: RequestSource} = goog.requireType('os.source.Request');


/**
 * Query handler implementation. Adds source, refresh and request functionality to the base handler class.
 */
export default class QueryHandler extends UIQueryHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?function(this:RequestSource)}
     * @private
     */
    this.origSourceRefresh_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.refreshOnVisible_ = false;

    /**
     * @type {Delay}
     * @protected
     */
    this.refreshTimer = new Delay(this.onRefreshTimer, 250, this);

    /**
     * @type {?RequestSource}
     * @protected
     */
    this.source = null;

    /**
     * @type {boolean}
     * @protected
     */
    this.spatialRequired = false;

    this.listenKey = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    dispose(this.refreshTimer);
    this.setSource(null);
  }

  /**
   * Get the source.
   *
   * @return {?RequestSource}
   */
  getSource() {
    return this.source;
  }

  /**
   * @inheritDoc
   */
  getLayerName() {
    return this.source ? this.source.getTitle() : '';
  }

  /**
   * Set the source.
   *
   * @param {?RequestSource} source
   */
  setSource(source) {
    var qm = getQueryManager();

    if (this.source) {
      // restore the original refresh function
      if (this.origSourceRefresh_) {
        this.source.refresh = this.origSourceRefresh_;
        this.origSourceRefresh_ = null;
      }

      this.setLayerId(null);
      this.setLayerName(null);
      qm.unlisten(GoogEventType.PROPERTYCHANGE, this.onQueryChange, false, this);
      unlistenByKey(this.listenKey);
    }

    this.source = source;

    if (this.source) {
      this.setLayerId(this.source.getId());

      // all source refreshing should now go through this handler
      this.origSourceRefresh_ = this.source.refresh;
      this.source.refresh = this.refresh.bind(this);

      qm.listen(GoogEventType.PROPERTYCHANGE, this.onQueryChange, false, this);
      this.listenKey = listen(this.source, GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange, this);
    }
  }

  /**
   * @param {PropertyChangeEvent} event
   * @protected
   */
  onSourcePropertyChange(event) {
    if (event.getProperty() == 'visible') {
      if (this.source && this.source.getVisible() && this.refreshOnVisible_) {
        this.refreshOnVisible_ = false;
        this.localRefresh();
      }
    }
  }

  /**
   * On queries changed
   *
   * @param {PropertyChangeEvent} event
   */
  onQueryChange(event) {
    if (this.source) {
      var ids = event.getNewValue();
      var id = this.source.getId();

      if ('*' in ids || id in ids) {
        this.source.clear();
        this.refresh();
      }
    }
  }

  /**
   * Refresh timer
   *
   * @protected
   */
  onRefreshTimer() {
    if (this.source) {
      if (!this.source.isLoading()) {
        this.localRefresh();
      } else {
        this.refreshTimer.start();
      }
    }
  }

  /**
   * @protected
   */
  localRefresh() {
    if (this.source && !this.refreshTimer.isActive()) {
      if (this.source.getVisible()) {
        this.resetModifiers();
        this.doRefresh();
      } else {
        this.refreshOnVisible_ = true;
      }
    }
  }

  /**
   * Actually refresh
   *
   * @protected
   */
  doRefresh() {
    if (this.source && (!this.spatialRequired || this.modifier.getReplacement())) {
      this.source.loadRequest();
    }
  }

  /**
   * Refresh
   *
   * @param {boolean=} opt_now Does the refresh now rather than on a timer
   */
  refresh(opt_now) {
    if (this.source) {
      var qm = getQueryManager();
      var id = this.source.getId();

      if (this.spatialRequired) {
        if (qm.hasInclusion(id) || qm.hasInclusion('*')) {
          this.scheduleRefresh(opt_now);
        } else {
          this.source.clear();
        }
      } else {
        this.scheduleRefresh(opt_now);
      }
    }
  }

  /**
   * Schedules a refresh
   *
   * @param {boolean=} opt_now
   * @protected
   */
  scheduleRefresh(opt_now) {
    if (this.source) {
      if (opt_now) {
        this.localRefresh();
      } else {
        // abort the current request if one is going, but don't clear the source yet
        this.source.abortRequest();
        this.refreshTimer.start();
      }
    }
  }

  /**
   * Resets modifiers
   */
  resetModifiers() {
    if (this.source) {
      var newFilter = this.createFilter();
      this.modifier.setReplacement(newFilter);

      var request = this.source.getRequest();

      if (request) {
        request.removeModifier(this.modifier);
        request.addModifier(this.modifier);
      }

      if (this.spatialRequired && !newFilter) {
        this.source.clear();
      }
    }
  }
}
