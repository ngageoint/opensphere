goog.declareModuleId('plugin.im.action.feature.Manager');

import {listen, unlistenByKey} from 'ol/src/events.js';
import DataManager from '../../os/data/datamanager.js';
import DataEventType from '../../os/data/event/dataeventtype.js';
import RecordField from '../../os/data/recordfield.js';
import {getLayer} from '../../os/feature/feature.js';
import ImportActionManager from '../../os/im/action/importactionmanager.js';
import osImplements from '../../os/implements.js';
import LayerPresetManager from '../../os/layer/preset/layerpresetmanager.js';
import IImportSource from '../../os/source/iimportsource.js';
import PropertyChange from '../../os/source/propertychange.js';
import * as state from '../../os/state/state.js';
import {updateShown} from '../../os/style/label.js';
import {notifyStyleChange, setFeaturesStyle} from '../../os/style/style.js';
import {ENTRY_TITLE} from './featureaction.js';
import Entry from './featureactionentry.js';
import TagName from './tagname.js';

const Timer = goog.require('goog.Timer');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');

/**
 * Manager for {@link Feature} import actions.
 *
 * @extends {ImportActionManager<Feature>}
 */
export default class Manager extends ImportActionManager {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.entryTitle = ENTRY_TITLE;
    this.log = logger;
    this.xmlGroup = TagName.FEATURE_ACTIONS;
    this.xmlEntry = TagName.FEATURE_ACTION;

    /**
     * Map of source listen keys.
     * @type {!Object<string, ol.EventsKey>}
     * @private
     */
    this.sourceListeners_ = {};

    /**
     * Timer for periodically updating time-based feature actions.
     * @type {Timer}
     * @private
     */
    this.timer_ = new Timer(15000);
    this.timer_.listen(Timer.TICK, this.refreshTimeEntries, false, this);
    this.timer_.start();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispose(this.timer_);

    var dm = DataManager.getInstance();
    if (dm) {
      dm.unlisten(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
      dm.unlisten(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
    }

    for (var key in this.sourceListeners_) {
      unlistenByKey(this.sourceListeners_[key]);
    }

    this.sourceListeners_ = {};
  }

  /**
   * @inheritDoc
   */
  createActionEntry() {
    return new Entry();
  }

  /**
   * @inheritDoc
   */
  getEntryItems(type) {
    var source = DataManager.getInstance().getSource(type);
    return source ? source.getFeatures() : null;
  }

  /**
   * @inheritDoc
   */
  initialize() {
    var dm = DataManager.getInstance();
    dm.listen(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    dm.listen(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

    var sources = dm.getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      this.addSource_(sources[i]);
    }
  }

  /**
   * @inheritDoc
   */
  processItemsProtected(entryType, items, opt_unprocess, opt_unprocessOnly) {
    // run the actions normally
    var configs = super.processItemsProtected(entryType, items, opt_unprocess, opt_unprocessOnly);

    // notify
    if (configs && configs.length) {
      // once all processItems() are done, do a big notify of style and color changes
      var config = /* @type {ImportActionCallbackConfig} */ ({
        color: [],
        labelUpdateShown: false,
        notifyStyleChange: false,
        setColor: false,
        setFeaturesStyle: false
      });

      // merge the layer, source, colormodel, and label events into one
      configs.forEach((cfg) => {
        Manager.mergeNotify_(config, cfg);
      });

      // optimize the colors to avoid overlaps (max N instead of N^2 events)
      Manager.mergeNotifyColor_(config);

      // send events to synch with renderer and bins
      Manager.notify_(items, config);
    }
  }

  /**
   * Add a source to manager if it supports import actions.
   *
   * @param {ISource} source The source.
   * @private
   */
  addSource_(source) {
    if (osImplements(source, IImportSource.ID)) {
      var id = source.getId();
      if (id && !this.sourceListeners_[id]) {
        this.sourceListeners_[id] = listen(/** @type {events.EventTarget} */ (source),
            GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);

        var promise = LayerPresetManager.getInstance().getPresets(id, !state.isStateFile(id));

        if (promise) {
          promise.thenAlways(() => {
            this.processItems(id);
          });
        } else {
          this.processItems(id);
        }
      }
    }
  }

  /**
   * Handle source added event from the data manager.
   *
   * @param {DataEvent} event The data manager event.
   * @private
   */
  onSourceAdded_(event) {
    if (event && event.source) {
      this.addSource_(event.source);
    }
  }

  /**
   * Handle source removed event from the data manager.
   *
   * @param {DataEvent} event
   * @private
   */
  onSourceRemoved_(event) {
    if (event && event.source) {
      var id = event.source.getId();
      if (id in this.sourceListeners_) {
        unlistenByKey(this.sourceListeners_[id]);
        delete this.sourceListeners_[id];
      }
    }
  }

  /**
   * Handle property change events from a source.
   *
   * @param {PropertyChangeEvent|ol.Object.Event} event
   * @private
   */
  onSourcePropertyChange_(event) {
    var p;
    try {
      // ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure the
      // event is from us
      p = event.getProperty();
    } catch (e) {
      return;
    }

    var source = /** @type {ISource} */ (event.target);
    if (source) {
      switch (p) {
        case PropertyChange.PREPROCESS_FEATURES:
          var features = /** @type {Array<!Feature>|undefined} */ (event.getNewValue());
          if (features && features.length > 0) {
            this.processItems(source.getId(), features);
          }
          break;
        default:
          break;
      }
    }
  }

  /**
   * Refreshes the time-based feature actions.
   *
   * @protected
   */
  refreshTimeEntries() {
    var entries = this.getActionEntries();
    var fn = function(entry) {
      if (entry.isEnabled()) {
        var filter = entry.getFilter();
        if (filter && filter.indexOf(RecordField.TIME) != -1) {
          this.updateItems(entry.type);
        }
      }

      var children = entry.getChildren();
      if (children) {
        children.forEach(fn, this);
      }
    };

    entries.forEach(fn, this);
  }

  /**
   * Consolidate results of desired notification(s) from multiple FeatureActions
   *
   * @param {ImportActionCallbackConfig} target
   * @param {ImportActionCallbackConfig} source
   * @private
   */
  static mergeNotify_(target, source) {
    if (!target) return;

    if (source) {
      target.labelUpdateShown = target.labelUpdateShown || source.labelUpdateShown;
      target.notifyStyleChange = target.notifyStyleChange || source.notifyStyleChange;
      target.setColor = target.setColor || source.setColor;
      target.setFeaturesStyle = target.setFeaturesStyle || source.setFeaturesStyle;

      if (source.color) {
        // add the next colors
        source.color.forEach((color) => {
          if (!target.color) target.color = [];

          // TODO merge same-colors into a single color entry
          target.color.push(color); // flatten the tree
        });
      }
    }
  }

  /**
   * Optimize the colors to avoid overlaps (max N instead of N^2 events)
   *
   * @param {ImportActionCallbackConfig} config
   * @suppress {accessControls} To allow direct access to feature metadata.
   * @private
   */
  static mergeNotifyColor_(config) {
    // TODO benchmark which is faster -- removing overlaps or just re-setting them when there's 25%...100% overlap
    var len = (config && config.color) ? config.color.length : -1;

    // only do this extra step when there are more than one (possibly conflicting) color actions
    if (len > 1) {
      var colorItemsCount = config.color.reduce((count, colorConfig) => {
        return count + ((colorConfig[0]) ? colorConfig[0].length : 0);
      }, 0);

      // deconflicting is expensive; only do it when there are more than N items being colored
      if (colorItemsCount > Manager.MIN_ITEMS_MERGE_NOTIFY_COLOR) {
        // the item(s) whose final color is already set
        var all = {};

        // loop backwards through colors... and remove items overlap in previous entries (last one wins)
        for (var i = (len - 1); i >= 0; i--) {
          var ids = {};
          var [items] = config.color[i] || [];

          // map the array by ids
          if (i > 0) { // skip when no more loops to do
            (items || []).reduce((map, item) => {
              map[item.id_] = true;
              return map;
            }, ids);
          }
          // remove all's ids from these items
          if (i != (len - 1)) { // skip when "all" is empty
            config.color[i][0] = items.filter((item) => {
              return !all[item.id_]; // fast lookup
            });
          }

          // add these ids to all so they'll be filtered from prior color assignments
          if (i > 0) { // skip when no more loops to do
            for (var key in ids) { // for...in is faster than Object.assign(all, ids);
              all[key] = true;
            }
          }
        }
      }
    }
  }

  /**
   * Send style event(s) to Layer, Source, and ColorModel
   *
   * @param {Array<T>} items The items.
   * @param {ImportActionCallbackConfig} config
   * @template T
   * @private
   */
  static notify_(items, config) {
    if (config) {
      if (config.setFeaturesStyle) {
        setFeaturesStyle(items);
      }

      // notify that the layer needs to be updated
      var layer = getLayer(items[0]);
      if (layer) {
        var source = /** @type {VectorSource} */ (layer.getSource());
        if (source && config.setColor && config.color && config.color.length > 0) {
          var colors = (config.color != null) ? config.color : []; // useless assign to get past the closure compiler
          colors.forEach(([coloritems, color]) => {
            if (color) {
              source.setColor(coloritems, color); // set the color model's override for these items
            } else {
              source.setColor(coloritems); // only reset the color if there was a color override
            }
          });
        }
        if (config.notifyStyleChange) {
          notifyStyleChange(
              layer,
              items,
              undefined,
              undefined,
              !!(source && config.setColor) // bump the colormodel so dependencies can update/re-render
          );
        }
      }
    }
    // kick off label hit detection
    if (config.labelUpdateShown) {
      updateShown();
    }
  }

  /**
   * Get the global instance.
   * @return {!ImportActionManager}
   * @override
   */
  static getInstance() {
    if (!instance) {
      instance = new Manager();
      ImportActionManager.setInstance(instance);
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ImportActionManager} value The instance.
   * @override
   */
  static setInstance(value) {
    instance = value;

    // Also replace the global import action manager instance.
    ImportActionManager.setInstance(value);
  }
}

/**
 * @type {number}
 * @const
 */
Manager.MIN_ITEMS_MERGE_NOTIFY_COLOR = 10000;

/**
 * Logger for feature.Manager.
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.im.action.feature.Manager');

/**
 * Global instance.
 * @type {ImportActionManager|undefined}
 */
let instance;

// Initialize the instance immediately to replace the global import manager instance with this one.
Manager.getInstance();
