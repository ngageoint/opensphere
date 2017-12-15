goog.provide('os.data.histo.TimelineHistManager');
goog.require('goog.async.Throttle');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('ol.events');
goog.require('os.color');
goog.require('os.data.DataManager');
goog.require('os.data.OSDataManager');
goog.require('os.data.event.DataEvent');
goog.require('os.data.event.DataEventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.hist.HistogramData');
goog.require('os.source.PropertyChange');
goog.require('os.time.TimeRange');
goog.require('os.ui.hist.HistogramEventType');
goog.require('os.ui.hist.IHistogramManager');
goog.require('os.ui.timeline.TimelineScaleOptions');



/**
 * Watches all sources in the data manager for changes that affect the timeline. Fires events on changes to alert the
 * timeline to update itself.
 * @implements {os.ui.hist.IHistogramManager}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.data.histo.TimelineHistManager = function() {
  os.data.histo.TimelineHistManager.base(this, 'constructor');

  /**
   * Change event throttle to rate limit timeline updates
   * @type {goog.async.Throttle}
   * @private
   */
  this.changeThrottle_ = new goog.async.Throttle(this.onChangeThrottle_, 100, this);

  var sources = os.osDataManager.getSources();
  for (var i = 0, n = sources.length; i < n; i++) {
    var source = /** @type {ol.events.EventTarget} */ (sources[i]);
    ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
  }

  os.dataManager.listen(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
  os.dataManager.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);
};
goog.inherits(os.data.histo.TimelineHistManager, goog.events.EventTarget);
goog.addSingletonGetter(os.data.histo.TimelineHistManager);


/**
 * @inheritDoc
 */
os.data.histo.TimelineHistManager.prototype.disposeInternal = function() {
  this.changeThrottle_.dispose();
  this.changeThrottle_ = null;

  os.dataManager.unlisten(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
  os.dataManager.unlisten(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

  var sources = os.osDataManager.getSources();
  for (var i = 0, n = sources.length; i < n; i++) {
    var source = /** @type {ol.events.EventTarget} */ (sources[i]);
    ol.events.unlisten(source, goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
  }

  os.dataManager = null;
};


/**
 * Initiates the change event throttle to rate limit the events.
 * @private
 */
os.data.histo.TimelineHistManager.prototype.fireChangeEvent_ = function() {
  this.changeThrottle_.fire();
};


/**
 * Fires a histogram change event.
 * @private
 */
os.data.histo.TimelineHistManager.prototype.onChangeThrottle_ = function() {
  this.dispatchEvent(os.ui.hist.HistogramEventType.CHANGE);
};


/**
 * @param {os.data.event.DataEvent} event
 * @private
 */
os.data.histo.TimelineHistManager.prototype.onSourceAdded_ = function(event) {
  if (event.source) {
    ol.events.listen(/** @type {ol.events.EventTarget} */ (event.source), goog.events.EventType.PROPERTYCHANGE,
        this.onSourcePropertyChange_, this);
    this.fireChangeEvent_();
  }
};


/**
 * @param {os.data.event.DataEvent} event
 * @private
 */
os.data.histo.TimelineHistManager.prototype.onSourceRemoved_ = function(event) {
  if (event.source) {
    ol.events.unlisten(/** @type {ol.events.EventTarget} */ (event.source), goog.events.EventType.PROPERTYCHANGE,
        this.onSourcePropertyChange_, this);
    this.fireChangeEvent_();
  }
};


/**
 * Handles source property change events. Fires a histogram change event when the property affects the histogram.
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.data.histo.TimelineHistManager.prototype.onSourcePropertyChange_ = function(event) {
  var prop = event.getProperty();
  switch (prop) {
    case os.source.PropertyChange.FEATURE_VISIBILITY:
      var newVal = event.getNewValue();
      if (!newVal) {
        // visible features changed due to a timeline change, not a data visibility change
        break;
      }
      // fall through
    case os.source.PropertyChange.COLOR:
    case os.source.PropertyChange.FEATURES:
    case os.source.PropertyChange.TIME_ENABLED:
    case os.source.PropertyChange.TIME_MODEL:
    case os.source.PropertyChange.TITLE:
    case os.source.PropertyChange.VISIBLE:
      this.fireChangeEvent_();
      break;
    default:
      break;
  }
};


/**
 * @inheritDoc
 */
os.data.histo.TimelineHistManager.prototype.getHistograms = function(options) {
  var histograms = [];
  var start = options.start;
  var end = options.end;
  var interval = options.interval;

  if (interval > 0) {
    var sources = os.osDataManager.getSources();
    for (var i = 0, n = sources.length; i < n; i++) {
      var source = sources[i];
      var model = source.getTimeModel();
      if (model && source.getVisible() && source.getTimeEnabled()) {
        var counts = {};
        var lastRange = model.getLastRange();

        var min = Math.floor(start / interval) * interval;
        while (min <= end) {
          var next = min + interval;
          var matches = model.intersection(new os.time.TimeRange(min, next), false, true).length;
          counts[min] = matches;
          min = next;
        }

        // reset time filters on the model to the last used range, or groupData calls will use the last range of this
        // histogram
        if (lastRange) {
          model.intersection(lastRange, false, true);
        }

        if (goog.object.getCount(counts) > 0) {
          var sourceHisto = new os.hist.HistogramData();
          sourceHisto.setId(source.getId());
          sourceHisto.setColor(os.color.toHexString(source.getColor()));
          sourceHisto.setCounts(counts);
          sourceHisto.setOptions(options);
          sourceHisto.setTitle(source.getTitle());
          sourceHisto.setVisible(source.getVisible());
          sourceHisto.setRange(model.getRange());

          histograms.push(sourceHisto);
        }
      }
    }
  }

  return histograms;
};
