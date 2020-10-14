goog.provide('plugin.im.action.feature.Manager');

goog.require('goog.Timer');
goog.require('goog.log');
goog.require('goog.object');
goog.require('ol.events');
goog.require('os.data.OSDataManager');
goog.require('os.data.event.DataEventType');
goog.require('os.im.action.ImportActionCallbackConfig');
goog.require('os.im.action.ImportActionManager');
goog.require('os.implements');
goog.require('os.source.IImportSource');
goog.require('plugin.im.action.feature');
goog.require('plugin.im.action.feature.Entry');



/**
 * Manager for {@link ol.Feature} import actions.
 *
 * @extends {os.im.action.ImportActionManager<ol.Feature>}
 * @constructor
 */
plugin.im.action.feature.Manager = function() {
  plugin.im.action.feature.Manager.base(this, 'constructor');
  this.entryTitle = plugin.im.action.feature.ENTRY_TITLE;
  this.log = plugin.im.action.feature.Manager.LOGGER_;
  this.xmlGroup = plugin.im.action.feature.TagName.FEATURE_ACTIONS;
  this.xmlEntry = plugin.im.action.feature.TagName.FEATURE_ACTION;

  /**
   * Map of source listen keys.
   * @type {!Object<string, ol.EventsKey>}
   * @private
   */
  this.sourceListeners_ = {};

  /**
   * Timer for periodically updating time-based feature actions.
   * @type {goog.Timer}
   * @private
   */
  this.timer_ = new goog.Timer(15000);
  this.timer_.listen(goog.Timer.TICK, this.refreshTimeEntries, false, this);
  this.timer_.start();
};
goog.inherits(plugin.im.action.feature.Manager, os.im.action.ImportActionManager);
goog.addSingletonGetter(plugin.im.action.feature.Manager);


// replace the base ImportActionManager singleton with this one
Object.assign(os.im.action.ImportActionManager, {
  getInstance: function() {
    return plugin.im.action.feature.Manager.getInstance();
  }
});


/**
 * Logger for plugin.im.action.feature.Manager.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.im.action.feature.Manager.LOGGER_ = goog.log.getLogger('plugin.im.action.feature.Manager');


/**
 * @type {number}
 * @const
 */
plugin.im.action.feature.Manager.MIN_ITEMS_MERGE_NOTIFY_COLOR = 10000;


/**
 * @inheritDoc
 */
plugin.im.action.feature.Manager.prototype.disposeInternal = function() {
  plugin.im.action.feature.Manager.base(this, 'disposeInternal');

  goog.dispose(this.timer_);

  var dm = os.data.OSDataManager.getInstance();
  if (dm) {
    dm.unlisten(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    dm.unlisten(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
  }

  for (var key in this.sourceListeners_) {
    ol.events.unlistenByKey(this.sourceListeners_[key]);
  }

  this.sourceListeners_ = {};
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.Manager.prototype.createActionEntry = function() {
  return new plugin.im.action.feature.Entry();
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.Manager.prototype.getEntryItems = function(type) {
  var source = os.data.OSDataManager.getInstance().getSource(type);
  return source ? source.getFeatures() : null;
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.Manager.prototype.initialize = function() {
  var dm = os.data.OSDataManager.getInstance();
  dm.listen(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
  dm.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

  var sources = dm.getSources();
  for (var i = 0, n = sources.length; i < n; i++) {
    this.addSource_(sources[i]);
  }
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.Manager.prototype.processItemsProtected = function(
    entryType,
    items,
    opt_unprocess,
    opt_unprocessOnly) {
  // run the actions normally
  var configs = plugin.im.action.feature.Manager.base(
      this,
      'processItemsProtected',
      entryType,
      items,
      opt_unprocess,
      opt_unprocessOnly);

  // notify
  if (configs && configs.length) {
    // once all processItems() are done, do a big notify of style and color changes
    var config = /* @type {os.im.action.ImportActionCallbackConfig} */ ({
      color: [],
      labelUpdateShown: false,
      notifyStyleChange: false,
      setColor: false,
      setFeaturesStyle: false
    });

    // merge the layer, source, colormodel, and label events into one
    configs.forEach((cfg) => {
      plugin.im.action.feature.Manager.mergeNotify_(config, cfg);
    });

    // optimize the colors to avoid overlaps (max N instead of N^2 events)
    plugin.im.action.feature.Manager.mergeNotifyColor_(config);

    // send events to synch with renderer and bins
    plugin.im.action.feature.Manager.notify_(items, config);
  }
};


/**
 * Consolidate results of desired notification(s) from multiple FeatureActions
 *
 * @param {os.im.action.ImportActionCallbackConfig} target
 * @param {os.im.action.ImportActionCallbackConfig} source
 * @private
 */
plugin.im.action.feature.Manager.mergeNotify_ = function(target, source) {
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
};


/**
 * Optimize the colors to avoid overlaps (max N instead of N^2 events)
 *
 * @param {os.im.action.ImportActionCallbackConfig} config
 * @suppress {accessControls} To allow direct access to feature metadata.
 * @private
 */
plugin.im.action.feature.Manager.mergeNotifyColor_ = function(config) {
  // TODO benchmark which is faster -- removing overlaps or just re-setting them when there's 25%...100% overlap
  var len = (config && config.color) ? config.color.length : -1;

  // only do this extra step when there are more than one (possibly conflicting) color actions
  if (len > 1) {
    var colorItemsCount = config.color.reduce((count, colorConfig) => {
      return count + ((colorConfig[0]) ? colorConfig[0].length : 0);
    }, 0);

    // deconflicting is expensive; only do it when there are more than N items being colored
    if (colorItemsCount > plugin.im.action.feature.Manager.MIN_ITEMS_MERGE_NOTIFY_COLOR) {
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
};


/**
 * Send style event(s) to Layer, Source, and ColorModel
 *
 * @param {Array<T>} items The items.
 * @param {os.im.action.ImportActionCallbackConfig} config
 * @template T
 * @private
 */
plugin.im.action.feature.Manager.notify_ = function(items, config) {
  if (config) {
    if (config.setFeaturesStyle) {
      os.style.setFeaturesStyle(items);
    }

    // notify that the layer needs to be updated
    var layer = os.feature.getLayer(items[0]);
    if (layer) {
      var source = /** @type {os.source.Vector} */ (layer.getSource());
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
        os.style.notifyStyleChange(
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
    os.style.label.updateShown();
  }
};


/**
 * Add a source to manager if it supports import actions.
 *
 * @param {os.source.ISource} source The source.
 * @private
 */
plugin.im.action.feature.Manager.prototype.addSource_ = function(source) {
  if (os.implements(source, os.source.IImportSource.ID)) {
    var id = source.getId();
    if (id && !this.sourceListeners_[id]) {
      this.sourceListeners_[id] = ol.events.listen(/** @type {ol.events.EventTarget} */ (source),
          goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);

      this.loadDefaults(id).thenAlways(function() {
        this.processItems(id);
      }, this);
    }
  }
};


/**
 * Handle source added event from the data manager.
 *
 * @param {os.data.event.DataEvent} event The data manager event.
 * @private
 */
plugin.im.action.feature.Manager.prototype.onSourceAdded_ = function(event) {
  if (event && event.source) {
    this.addSource_(event.source);
  }
};


/**
 * Handle source removed event from the data manager.
 *
 * @param {os.data.event.DataEvent} event
 * @private
 */
plugin.im.action.feature.Manager.prototype.onSourceRemoved_ = function(event) {
  if (event && event.source) {
    var id = event.source.getId();
    if (id in this.sourceListeners_) {
      ol.events.unlistenByKey(this.sourceListeners_[id]);
      delete this.sourceListeners_[id];
    }
  }
};


/**
 * Handle property change events from a source.
 *
 * @param {os.events.PropertyChangeEvent|ol.Object.Event} event
 * @private
 */
plugin.im.action.feature.Manager.prototype.onSourcePropertyChange_ = function(event) {
  var p;
  try {
    // ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure the
    // event is from us
    p = event.getProperty();
  } catch (e) {
    return;
  }

  var source = /** @type {os.source.ISource} */ (event.target);
  if (source) {
    switch (p) {
      case os.source.PropertyChange.PREPROCESS_FEATURES:
        var features = /** @type {Array<!ol.Feature>|undefined} */ (event.getNewValue());
        if (features && features.length > 0) {
          this.processItems(source.getId(), features);
        }
        break;
      default:
        break;
    }
  }
};


/**
 * Refreshes the time-based feature actions.
 *
 * @protected
 */
plugin.im.action.feature.Manager.prototype.refreshTimeEntries = function() {
  var entries = this.getActionEntries();
  var fn = function(entry) {
    if (entry.isEnabled()) {
      var filter = entry.getFilter();
      if (filter && filter.indexOf(os.data.RecordField.TIME) != -1) {
        this.updateItems(entry.type);
      }
    }

    var children = entry.getChildren();
    if (children) {
      children.forEach(fn, this);
    }
  };

  entries.forEach(fn, this);
};
