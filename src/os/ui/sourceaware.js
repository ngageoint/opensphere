goog.declareModuleId('os.ui.SourceAware');

import {remove} from 'ol/src/array.js';
import {listen, unlistenByKey} from 'ol/src/events.js';

import DataManager from '../data/datamanager.js';
import DataEventType from '../data/event/dataeventtype.js';
import PropertyChange from '../source/propertychange.js';

const Disposable = goog.require('goog.Disposable');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');

const {default: DataEvent} = goog.requireType('os.data.event.DataEvent');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: ISource} = goog.requireType('os.source.ISource');


/**
 * Abstract class for UI's that need to be aware of what sources are available and visible in the application.
 * Extending classes must call init to load/monitor sources.
 *
 * @abstract
 * @deprecated Please use `os.data.SourceManager` instead.
 */
export default class SourceAware extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Visible sources in the application.
     * @type {!Array<ISource>}
     * @protected
     */
    this.sources = [];

    /**
     * Map of source listen keys.
     * @type {Object<string, ol.EventsKey>}
     * @private
     */
    this.sourceListeners_ = {};

    /**
     * This smooths out resizing components containing slickgrids by delaying the grid resize until the component stops
     * resizing.
     * @type {Delay}
     * @protected
     */
    this.updateDelay = new Delay(this.updateUI, 25, this);

    /**
     * Source events that should trigger a UI update.
     * @type {!Array<string>}
     * @protected
     */
    this.updateEvents = SourceAware.UPDATE_EVENTS;

    /**
     * @type {!Array<function(ISource):boolean>}
     * @protected
     */
    this.validationFunctions = SourceAware.VALIDATION_FUNCTIONS;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispose(this.updateDelay);

    var dm = DataManager.getInstance();
    if (dm) {
      dm.unlisten(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
      dm.unlisten(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
    }

    for (var key in this.sourceListeners_) {
      unlistenByKey(this.sourceListeners_[key]);
    }

    this.sourceListeners_ = {};
    this.sources.length = 0;
  }

  /**
   * Initialize the sources
   *
   * @protected
   */
  init() {
    var dm = DataManager.getInstance();
    dm.listen(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    dm.listen(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

    var sources = dm.getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      var source = sources[i];
      this.updateSource_(source);
      this.addSourceListener_(sources[i]);
    }
  }

  /**
   * @param {!ISource} source
   * @protected
   */
  addSource(source) {
    if (this.sources.indexOf(source) === -1) {
      this.sources.push(source);
    }
  }

  /**
   * @param {!ISource} source
   * @protected
   */
  removeSource(source) {
    remove(this.sources, source);
  }

  /**
   * Registers change listener on a source.
   *
   * @param {ISource} source
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
   * @param {ISource} source
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
   * @param {DataEvent} event
   * @private
   */
  onSourceAdded_(event) {
    if (event.source) {
      this.updateSource_(event.source);
      this.addSourceListener_(event.source);
    }
  }

  /**
   * @param {DataEvent} event
   * @private
   */
  onSourceRemoved_(event) {
    if (event.source) {
      this.removeSourceListener_(event.source);
      this.removeSource(event.source);
    }
  }

  /**
   * Handle property change events from a source.
   *
   * @param {PropertyChangeEvent|ObjectEvent} event
   * @protected
   *
   * @suppress {checkTypes}
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
    if (source && this.updateEvents.indexOf(p) > -1) {
      this.updateSource_(source);
    }
  }

  /**
   * @param {ISource} source
   * @private
   */
  updateSource_(source) {
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
   * Update the UI after a source was added/removed/changed.
   *
   * @abstract
   * @protected
   */
  updateUI() {}
}

/**
 * @type {!Array<function(ISource):boolean>}
 */
SourceAware.VALIDATION_FUNCTIONS = [];

/**
 * Events that will trigger a source update.
 * @type {!Array<string>}
 * @const
 */
SourceAware.UPDATE_EVENTS = [
  PropertyChange.ENABLED,
  PropertyChange.TITLE,
  PropertyChange.VISIBLE
];
