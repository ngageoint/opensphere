goog.provide('plugin.im.action.feature.Manager');

goog.require('goog.Timer');
goog.require('goog.log');
goog.require('goog.object');
goog.require('ol.events');
goog.require('os.data.OSDataManager');
goog.require('os.data.event.DataEventType');
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
goog.object.extend(os.im.action.ImportActionManager, {
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
      this.loadDefaults(source.getId()).thenAlways(function() {
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
    // ol3's ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure the
    // event is from us
    p = event.getProperty();
  } catch (e) {
    return;
  }

  var source = /** @type {os.source.ISource} */ (event.target);
  if (source && p === os.source.PropertyChange.PREPROCESS_FEATURES) {
    var features = /** @type {Array<!ol.Feature>|undefined} */ (event.getNewValue());
    if (features && features.length > 0) {
      this.processItems(source.getId(), features);
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
