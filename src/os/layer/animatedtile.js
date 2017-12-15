goog.provide('os.layer.AnimatedTile');
goog.require('goog.async.Delay');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.layer.PropertyChange');
goog.require('os.layer.Tile');
goog.require('os.query.TemporalFormatter');
goog.require('os.time');
goog.require('os.time.TimelineController');
goog.require('os.ui.ScreenOverlayCtrl');



/**
 * @extends {os.layer.Tile}
 * @param {olx.layer.TileOptions} options Tile layer options
 * @constructor
 */
os.layer.AnimatedTile = function(options) {
  os.layer.AnimatedTile.base(this, 'constructor', options);

  /**
   * @type {boolean}
   * @private
   */
  this.animationEnabled_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.resetScheduled_ = false;

  /**
   * @type {?string}
   * @private
   */
  this.legendId_ = null;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.resetTimer_ = new goog.async.Delay(this.onResetTimer_, 25, this);

  /**
   * @type {os.time.TimelineController}
   * @private
   */
  this.timelineController_ = os.time.TimelineController.getInstance();

  /**
   * @type {string}
   * @private
   */
  this.dateFormat_ = 'YYYY-MM-DDTHH:mm:ss[Z]';

  // register timeline controller listeners
  this.timelineController_.listen(os.time.TimelineEventType.DURATION_CHANGE, this.scheduleReset_, false, this);
  this.timelineController_.listen(os.time.TimelineEventType.RESET, this.scheduleReset_, false, this);
  this.timelineController_.listen(os.time.TimelineEventType.SHOW, this.scheduleReset_, false, this);

  this.computeTime_();
};
goog.inherits(os.layer.AnimatedTile, os.layer.Tile);


/**
 * @inheritDoc
 */
os.layer.AnimatedTile.prototype.disposeInternal = function() {
  os.layer.AnimatedTile.base(this, 'disposeInternal');

  this.timelineController_.unlisten(os.time.TimelineEventType.DURATION_CHANGE, this.scheduleReset_, false, this);
  this.timelineController_.unlisten(os.time.TimelineEventType.RESET, this.scheduleReset_, false, this);
  this.timelineController_.unlisten(os.time.TimelineEventType.SHOW, this.scheduleReset_, false, this);
  this.timelineController_ = null;

  this.resetTimer_.dispose();
  this.resetTimer_ = null;

  if (this.legendId_) {
    // kill the legend window
    if (os.ui.window.getById(this.legendId_)) {
      os.ui.window.close(os.ui.window.getById(this.legendId_));
    }
  }
};


/**
 * @inheritDoc
 */
os.layer.AnimatedTile.prototype.setLayerVisible = function(value) {
  var old = this.getLayerVisible();
  os.layer.AnimatedTile.superClass_.setLayerVisible.call(this, value);

  if (value && !old && this.resetScheduled_) {
    this.resetScheduled_ = false;
    this.scheduleReset_();
  }

  var legendOpts = this.getLegendOptions();
  if (legendOpts) {
    if (value && !this.legendId_) {
      // show the legend
      os.ui.launchScreenOverlay(legendOpts);
      this.legendId_ = legendOpts['id'];
    } else if (!value && this.legendId_) {
      // close the legend, you can turn it back on by toggling on/off the descriptor or layer node in add layers
      if (os.ui.window.getById(this.legendId_)) {
        os.ui.window.close(os.ui.window.getById(this.legendId_));
      }
      this.legendId_ = null;
    }
  }
};


/**
 * If the layer contains legend information (supported in WMS - see os.ui.ogc.wms.WMSLayerParserV130)
 * then let's pop-up a screen overlay similar to what is done for KML
 * @return {?{Object}} options
 */
os.layer.AnimatedTile.prototype.getLegendOptions = function() {
  if (this.getLayerOptions() && this.getLayerOptions()['legends'] && this.getLayerOptions()['legends'][0]) {
    var legend = this.getLayerOptions()['legends'][0];
    var size = null;
    var xy = null;
    if (legend['size']) {
      // add 30 to the height to account for the header
      size = {x: legend['size'][0], y: legend['size'][1] + 30};
      var screenSize = os.MapContainer.getInstance().getMap().getSize();
      xy = {x: screenSize[0] - size['x'] - 250, y: screenSize[1] - size['y'] - 75};
    }

    var imageURL = '';
    if (legend['OnlineResource']) {
      imageURL = legend['OnlineResource'];
    } else if (goog.isString(legend)) {
      imageURL = legend; // not the normal format but let's handle it
    } else {
      // should not come from a state file/wms server
      return null;
    }

    var overlay = {'image': imageURL,
      'name': this.getTitle() + ' - Legend',
      'id': goog.string.hashCode(imageURL),
      'show-close': true,
      'xy': xy,
      'size': size};
    return overlay;
  } else {
    return null;
  }
};


/**
 * Schedule a reset of the layer.
 * @private
 */
os.layer.AnimatedTile.prototype.scheduleReset_ = function() {
  if (this.resetTimer_ && !this.resetTimer_.isActive()) {
    this.resetTimer_.start();
  }
};


/**
 * Refresh the layer if visible, otherwise flag the layer so it refreshes upon becoming visible.
 * @private
 */
os.layer.AnimatedTile.prototype.onResetTimer_ = function() {
  if (this.getVisible()) {
    this.computeTime_();
  } else {
    this.resetScheduled_ = true;
  }
};


/**
 * @return {string}
 */
os.layer.AnimatedTile.prototype.getDateFormat = function() {
  return this.dateFormat_;
};


/**
 * @param {string} format
 */
os.layer.AnimatedTile.prototype.setDateFormat = function(format) {
  this.dateFormat_ = format;
  this.computeTime_();
};


/**
 * If the layer has been enabled for animation. When animation/time enabled, Cesium will start caching tiles.
 * @return {boolean}
 */
os.layer.AnimatedTile.prototype.getAnimationEnabled = function() {
  return this.animationEnabled_;
};


/**
 * Marks the source as being in the animating state.
 * @param {boolean} value
 */
os.layer.AnimatedTile.prototype.setAnimationEnabled = function(value) {
  if (this.animationEnabled_ !== value) {
    this.animationEnabled_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.layer.PropertyChange.ANIMATION_ENABLED, value));
  }
};


/**
 * Updates the time param on the layer
 * @private
 */
os.layer.AnimatedTile.prototype.computeTime_ = function() {
  var source = /** @type {(ol.source.TileWMS|ol.source.TileArcGISRest)} */ (this.getSource());
  var oldParams = source.getParams();
  var newParams = {
    'TIME': this.getFormattedDate()
  };

  if (newParams['TIME'] != oldParams['TIME']) {
    goog.object.extend(oldParams, newParams);
    source.updateParams(oldParams);
  }
};


/**
 * Uses the dateFormat_ set on the layer (if there is one) and the current timeline state to format and return an
 * appropriately formatted date for tile requests.
 * @return {string}
 * @protected
 */
os.layer.AnimatedTile.prototype.getFormattedDate = function() {
  var tlc = os.time.TimelineController.getInstance();
  var duration = tlc.getDuration();
  var start = duration == os.time.Duration.CUSTOM ? tlc.getStart() : tlc.getCurrent() - tlc.getOffset();
  var end = tlc.getCurrent();

  return os.layer.AnimatedTile.getTimeParameter(this.dateFormat_, start, end, duration);
};


/**
 * @inheritDoc
 */
os.layer.AnimatedTile.prototype.persist = function(opt_to) {
  opt_to = os.layer.AnimatedTile.base(this, 'persist', opt_to) || {};

  var source = this.getSource();
  if (source && source instanceof ol.source.UrlTile) {
    opt_to['refreshInterval'] = source.getRefreshInterval();
  }

  return opt_to;
};


/**
 * @inheritDoc
 */
os.layer.AnimatedTile.prototype.restore = function(config) {
  os.layer.AnimatedTile.base(this, 'restore', config);

  if (goog.isDef(config['refreshInterval'])) {
    var source = this.getSource();
    if (source && source instanceof ol.source.UrlTile) {
      source.setRefreshInterval(/** @type {number} */ (config['refreshInterval']));
    }
  }
};


/**
 * Creates an appropriately formatted date for tile requests.
 * @param {string} dateFormat The date format string
 * @param {number} start
 * @param {number} end
 * @param {string} duration
 * @return {string}
 */
os.layer.AnimatedTile.getTimeParameter = function(dateFormat, start, end, duration) {
  var actualStart;
  var actualEnd;
  if (duration != os.time.Duration.CUSTOM) {
    actualStart = actualEnd = (start + end) / 2;
  } else {
    actualStart = start;
    actualEnd = end;
  }

  var flooredStart = os.time.floor(new Date(actualStart), duration);
  var cappedEnd = os.time.ceil(new Date(actualEnd), duration);

  // if the capped start/end times are the same, we're on a boundary. take the next duration instead.
  cappedEnd = cappedEnd.getTime() == flooredStart.getTime() ? os.time.ceil(new Date(end), duration) : cappedEnd;
  var startDate = os.time.momentFormat(flooredStart, dateFormat || undefined, true);
  var endDate = os.time.momentFormat(cappedEnd, dateFormat || undefined, true);

  return startDate + '/' + endDate;
};


/**
 * @param {os.time.TimelineController} tlc The timeline controller
 * @param {string} dateFormat The date format
 * @param {string} timeFormat The time format
 * @return {Array.<string>} Formatted times
 */
os.layer.AnimatedTile.getFormattedTimes = function(tlc, dateFormat, timeFormat) {
  if (goog.isDefAndNotNull(tlc)) {
    var date = new Date(tlc.getStart());
    var duration = tlc.getDuration();

    date = os.time.floor(date, duration);
    var time;
    var times = [];

    if (duration == os.time.Duration.CUSTOM) {
      var e = os.time.ceil(new Date(tlc.getEnd()), 'day');

      return [timeFormat.replace(/{start}/g, os.time.momentFormat(date, dateFormat, true))
          .replace(/{end}/g, os.time.momentFormat(e, dateFormat, true))];
    }

    while (date.getTime() < tlc.getEnd()) {
      time = timeFormat;
      time = time.replace(/{start}/g, os.time.momentFormat(date, dateFormat, true));

      if (duration == os.time.Duration.YEAR) {
        date.setUTCFullYear(date.getUTCFullYear() + 1);
      } else if (duration == os.time.Duration.MONTH) {
        date.setUTCMonth(date.getUTCMonth() + 1);
      } else if (duration == os.time.Duration.WEEK) {
        date.setUTCDate(date.getUTCDate() + 7);
      } else {
        date.setUTCDate(date.getUTCDate() + 1);
      }

      time = time.replace(/{end}/g, os.time.momentFormat(date, dateFormat, true));
      times.push(time);
    }
    return times;
  }

  return null;
};
