goog.declareModuleId('os.data.SourceManager');

import * as olArray from 'ol/src/array.js';
import {listen, unlistenByKey} from 'ol/src/events.js';

import PropertyChange from '../source/propertychange.js';
import DataManager from './datamanager.js';
import DataEventType from './event/dataeventtype.js';

const Disposable = goog.require('goog.Disposable');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');

const {default: DataEvent} = goog.requireType('os.data.event.DataEvent');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: ISource} = goog.requireType('os.source.ISource');


/**
 * Watches all sources in the data manager and provides custom management for sources matching a set of validation
 * functions. Source events may be handled directly by extending `onSourcePropertyChange`, or on a delay by setting
 * `updateEvents` to the list of events that should be handled on a delay and extending `onUpdateDelay`.
 *
 * To start watching sources, `init` must be called on the manager.
 */
export default class SourceManager extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Managed sources.
     * @type {!Array<!ISource>}
     * @protected
     */
    this.sources = [];

    /**
     * Map of source listen keys.
     * @type {!Object<string, !ol.EventsKey>}
     * @private
     */
    this.sourceListeners_ = {};

    /**
     * Delay to debounce updates from source changes.
     * @type {Delay}
     * @protected
     */
    this.updateDelay = new Delay(this.onUpdateDelay, 25, this);

    /**
     * Source events that should trigger an update.
     * @type {!Array<string>}
     * @protected
     */
    this.updateEvents = SourceManager.UPDATE_EVENTS;

    /**
     * Functions to test if the source should be managed.
     * @type {!Array<function(ISource):boolean>}
     * @protected
     */
    this.validationFunctions = SourceManager.VALIDATION_FUNCTIONS;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    var dm = DataManager.getInstance();
    if (dm) {
      dm.unlisten(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
      dm.unlisten(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
    }

    for (var key in this.sourceListeners_) {
      unlistenByKey(this.sourceListeners_[key]);
    }

    dispose(this.updateDelay);
    this.sourceListeners_ = {};
    this.sources.length = 0;
  }

  /**
   * Initialize the manager.
   */
  init() {
    var dm = DataManager.getInstance();
    dm.listen(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    dm.listen(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

    var sources = dm.getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      var source = sources[i];
      if (source) {
        this.updateSource(source);
        this.addSourceListener_(sources[i]);
      }
    }
  }

  /**
   * Handle remove add events from the data manager.
   *
   * @param {!ISource} source The source.
   * @protected
   */
  addSource(source) {
    if (this.sources.indexOf(source) === -1) {
      this.sources.push(source);
    }
  }

  /**
   * Handle remove source events from the data manager.
   *
   * @param {!ISource} source The source.
   * @protected
   */
  removeSource(source) {
    olArray.remove(this.sources, source);
  }

  /**
   * Registers change listener on a source.
   *
   * @param {!ISource} source The source.
   * @private
   */
  addSourceListener_(source) {
    this.removeSourceListener_(source);

    var id = source.getId();
    this.sourceListeners_[id] = listen(/** @type {events.EventTarget} */ (source),
        GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange, this);
  }

  /**
   * Removes change listener on a source.
   *
   * @param {!ISource} source The source.
   * @private
   */
  removeSourceListener_(source) {
    var id = source.getId();
    if (id in this.sourceListeners_) {
      unlistenByKey(this.sourceListeners_[id]);
      delete this.sourceListeners_[id];
    }
  }

  /**
   * Handle source added event from the data manager.
   *
   * @param {DataEvent} event The data event.
   * @private
   */
  onSourceAdded_(event) {
    if (event.source) {
      this.updateSource(event.source);
      this.addSourceListener_(event.source);
    }
  }

  /**
   * Handle source added removed from the data manager.
   *
   * @param {DataEvent} event The data event.
   * @private
   */
  onSourceRemoved_(event) {
    if (event.source) {
      this.removeSourceListener_(event.source);
      this.removeSource(event.source);
    }
  }

  /**
   * @param {!ISource} source The source.
   * @protected
   */
  updateSource(source) {
    if (source) {
      if (this.validate_(source)) {
        this.addSource(source);
      } else {
        this.removeSource(source);
      }

      this.updateDelay.start();
    }
  }

  /**
   * @param {!ISource} source The source to validate
   * @return {boolean} whether or not the source is valid
   * @private
   */
  validate_(source) {
    for (var i = 0, n = this.validationFunctions.length; i < n; i++) {
      if (!this.validationFunctions[i](source)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Handle property change events from a source.
   *
   * @param {PropertyChangeEvent|ol.Object.Event} event
   * @protected
   */
  onSourcePropertyChange(event) {
    var p;
    try {
      // ol3's ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure the
      // event is from us
      p = event.getProperty();
    } catch (e) {
      return;
    }

    var source = /** @type {ISource} */ (event.target);
    if (source && p && this.updateEvents.indexOf(p) > -1) {
      this.updateSource(source);
    }
  }

  /**
   * Handler for the update delay.
   *
   * @protected
   */
  onUpdateDelay() {
    // do nothing by default
  }
}


/**
 * @type {!Array<function(ISource):boolean>}
 * @const
 */
SourceManager.VALIDATION_FUNCTIONS = [];


/**
 * Events that will trigger a source update.
 * @type {!Array<string>}
 * @const
 */
SourceManager.UPDATE_EVENTS = [
  PropertyChange.ENABLED,
  PropertyChange.TITLE,
  PropertyChange.VISIBLE
];
