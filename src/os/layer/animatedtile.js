goog.declareModuleId('os.layer.AnimatedTile');

import UrlTile from 'ol/src/source/UrlTile.js';

import PropertyChangeEvent from '../events/propertychangeevent.js';
import IAnimationSupport from '../ianimationsupport.js';
import osImplements from '../implements.js';
import {getIMapContainer} from '../map/mapinstance.js';
import Duration from '../time/duration.js';
import * as osTime from '../time/time.js';
import TimelineController from '../time/timelinecontroller.js';
import TimelineEventType from '../time/timelineeventtype.js';
import Icons from '../ui/icons.js';
import IconsSVG from '../ui/iconssvg.js';
import {launchScreenOverlay} from '../ui/screenoverlay.js';
import * as osWindow from '../ui/window.js';
import PropertyChange from './propertychange.js';
import Tile from './tile.js';

const Delay = goog.require('goog.async.Delay');
const {hashCode} = goog.require('goog.string');

/**
 * @implements {IAnimationSupport}
 */
export default class AnimatedTile extends Tile {
  /**
   * Constructor.
   * @param {olx.layer.TileOptions} options Tile layer options
   */
  constructor(options) {
    super(options);

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
     * @type {Delay}
     * @private
     */
    this.resetTimer_ = new Delay(this.onResetTimer_, 25, this);

    /**
     * @type {TimelineController}
     * @private
     */
    this.timelineController_ = TimelineController.getInstance();

    /**
     * @type {string}
     * @private
     */
    this.dateFormat_ = 'YYYY-MM-DDTHH:mm:ss[Z]';

    /**
     * @type {string}
     */
    this.timeFormat_ = '{start}/{end}';

    // register timeline controller listeners
    this.timelineController_.listen(TimelineEventType.DURATION_CHANGE, this.scheduleReset_, false, this);
    this.timelineController_.listen(TimelineEventType.RESET, this.scheduleReset_, false, this);
    this.timelineController_.listen(TimelineEventType.SHOW, this.scheduleReset_, false, this);

    /**
     * @type {?function(this: AnimatedTile, string)}
     */
    this.timeFunction = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.timelineController_.unlisten(TimelineEventType.DURATION_CHANGE, this.scheduleReset_, false, this);
    this.timelineController_.unlisten(TimelineEventType.RESET, this.scheduleReset_, false, this);
    this.timelineController_.unlisten(TimelineEventType.SHOW, this.scheduleReset_, false, this);
    this.timelineController_ = null;

    this.resetTimer_.dispose();
    this.resetTimer_ = null;

    if (this.legendId_) {
      // kill the legend window
      if (osWindow.getById(this.legendId_)) {
        osWindow.close(osWindow.getById(this.legendId_));
      }
    }
  }

  /**
   * @inheritDoc
   */
  getSVGIconsInternal() {
    var icons = super.getSVGIconsInternal();
    icons.push(IconsSVG.TIME);
    return icons;
  }

  /**
   * @inheritDoc
   */
  getIconsInternal() {
    return super.getIconsInternal() + Icons.TIME;
  }

  /**
   * @param {!function(this: AnimatedTile, string)} value
   */
  setTimeFunction(value) {
    this.timeFunction = value;
    this.computeTime_();
  }

  /**
   * @inheritDoc
   */
  setLayerVisible(value) {
    var old = this.getLayerVisible();
    super.setLayerVisible(value);

    if (value && !old && this.resetScheduled_) {
      this.resetScheduled_ = false;
      this.scheduleReset_();
    }

    var legendOpts = this.getLegendOptions();
    if (legendOpts) {
      if (value && !this.legendId_) {
        // show the legend
        launchScreenOverlay(legendOpts);
        this.legendId_ = legendOpts.id;
      } else if (!value && this.legendId_) {
        // close the legend, you can turn it back on by toggling on/off the descriptor or layer node in add layers
        if (osWindow.getById(this.legendId_)) {
          osWindow.close(osWindow.getById(this.legendId_));
        }
        this.legendId_ = null;
      }
    }
  }

  /**
   * If the layer contains legend information (supported in WMS - see os.ui.ogc.wms.WMSLayerParserV130)
   * then let's pop-up a screen overlay similar to what is done for KML
   *
   * @return {?osx.window.ScreenOverlayOptions} options
   */
  getLegendOptions() {
    if (this.getLayerOptions() && this.getLayerOptions()['legends'] && this.getLayerOptions()['legends'][0]) {
      var legend = this.getLayerOptions()['legends'][0];

      var imageURL = '';
      if (legend['OnlineResource']) {
        imageURL = legend['OnlineResource'];
      } else if (typeof legend === 'string') {
        imageURL = legend; // not the normal format but let's handle it
      } else {
        // should not come from a state file/wms server
        return null;
      }

      var size = [250, 75];
      var xy = [0, 0];
      if (legend['size']) {
        // add 30 to the height to account for the header
        size = [
          legend['size'][0],
          legend['size'][1] + 30
        ];

        var screenSize = getIMapContainer().getMap().getSize();
        xy = [
          screenSize[0] - size[0] - 250,
          screenSize[1] - size[1] - 75
        ];
      }

      return /** @type {!osx.window.ScreenOverlayOptions} */ ({
        id: hashCode(imageURL),
        name: this.getTitle() + ' - Legend',
        image: imageURL,
        showClose: true,
        size: size,
        xy: xy
      });
    }

    return null;
  }

  /**
   * Schedule a reset of the layer.
   *
   * @private
   */
  scheduleReset_() {
    if (this.resetTimer_ && !this.resetTimer_.isActive()) {
      this.resetTimer_.start();
    }
  }

  /**
   * Refresh the layer if visible, otherwise flag the layer so it refreshes upon becoming visible.
   *
   * @private
   */
  onResetTimer_() {
    if (this.getVisible()) {
      this.computeTime_();
    } else {
      this.resetScheduled_ = true;
    }
  }

  /**
   * @return {string}
   */
  getDateFormat() {
    return this.dateFormat_;
  }

  /**
   * @param {string} format
   */
  setDateFormat(format) {
    this.dateFormat_ = format;
    this.computeTime_();
  }

  /**
   * @return {string}
   */
  getTimeFormat() {
    return this.timeFormat_;
  }

  /**
   * @param {string} format
   */
  setTimeFormat(format) {
    this.timeFormat_ = format;
    this.computeTime_();
  }

  /**
   * @inheritDoc
   */
  getAnimationEnabled() {
    return this.animationEnabled_;
  }

  /**
   * @inheritDoc
   */
  setAnimationEnabled(value) {
    if (this.animationEnabled_ !== value) {
      this.animationEnabled_ = value;
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ANIMATION_ENABLED, value));
    }
  }

  /**
   * Updates the time param on the layer
   *
   * @private
   */
  computeTime_() {
    var timeValue = this.getFormattedDate();
    if (this.timeFunction) {
      this.timeFunction.call(this, timeValue);
    }
  }

  /**
   * Uses the dateFormat_ set on the layer (if there is one) and the current timeline state to format and return an
   * appropriately formatted date for tile requests.
   *
   * @return {string}
   * @protected
   */
  getFormattedDate() {
    var tlc = TimelineController.getInstance();
    var duration = tlc.getDuration();
    var isDurationCustomOrRelative = (duration == Duration.CUSTOM || osTime.isRelativeDuration(duration));
    var start = isDurationCustomOrRelative ? tlc.getStart() : tlc.getCurrent() - tlc.getOffset();
    var end = tlc.getCurrent();

    return AnimatedTile.getTimeParameter(this.dateFormat_, this.timeFormat_, start, end, duration);
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to) || {};

    var source = this.getSource();
    if (source && source instanceof UrlTile) {
      opt_to['refreshInterval'] = source.getRefreshInterval();
    }

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);

    if (config['refreshInterval'] !== undefined) {
      var source = this.getSource();
      if (source && source instanceof UrlTile) {
        source.setRefreshInterval(/** @type {number} */ (config['refreshInterval']));
      }
    }
  }

  /**
   * @param {string} timeValue
   * @this {AnimatedTile}
   */
  static updateParams(timeValue) {
    var source = /** @type {(TileWMS|TileArcGISRest)} */ (this.getSource());
    var oldParams = source.getParams();
    var newParams = {
      'TIME': timeValue
    };

    if (newParams['TIME'] != oldParams['TIME']) {
      Object.assign(oldParams, newParams);
      source.updateParams(oldParams);
    }
  }

  /**
   * Creates an appropriately formatted date for tile requests.
   *
   * @param {string} dateFormat The date format string
   * @param {string} timeFormat The full TIME value format string (e.g. '{start}/{end}')
   * @param {number} start
   * @param {number} end
   * @param {string} duration
   * @return {string}
   */
  static getTimeParameter(dateFormat, timeFormat, start, end, duration) {
    var actualStart;
    var actualEnd;
    if (duration != Duration.CUSTOM && !osTime.isRelativeDuration(duration)) {
      actualStart = actualEnd = (start + end) / 2;
    } else {
      actualStart = start;
      actualEnd = end;
    }

    var flooredStart = osTime.floor(new Date(actualStart), duration);
    var cappedEnd = osTime.ceil(new Date(actualEnd), duration);

    // if the capped start/end times are the same, we're on a boundary. take the next duration instead.
    cappedEnd = cappedEnd.getTime() == flooredStart.getTime() ? osTime.ceil(new Date(end), duration) : cappedEnd;
    var startDate = osTime.momentFormat(flooredStart, dateFormat || undefined, true);
    var endDate = osTime.momentFormat(cappedEnd, dateFormat || undefined, true);

    return timeFormat.replace(/{start}/g, startDate).replace(/{end}/g, endDate);
  }

  /**
   * @param {TimelineController} tlc The timeline controller
   * @param {string} dateFormat The date format
   * @param {string} timeFormat The time format
   * @return {Array<string>} Formatted times
   */
  static getFormattedTimes(tlc, dateFormat, timeFormat) {
    if (tlc != null) {
      var date = new Date(tlc.getStart());
      var duration = tlc.getDuration();

      date = osTime.floor(date, duration);
      var time;
      var times = [];

      if (duration == Duration.CUSTOM || osTime.isRelativeDuration(duration)) {
        var e = osTime.ceil(new Date(tlc.getEnd()), 'day');

        return [timeFormat.replace(/{start}/g, osTime.momentFormat(date, dateFormat, true))
            .replace(/{end}/g, osTime.momentFormat(e, dateFormat, true))];
      }

      while (date.getTime() < tlc.getEnd()) {
        time = timeFormat;
        time = time.replace(/{start}/g, osTime.momentFormat(date, dateFormat, true));

        if (duration == Duration.YEAR) {
          date.setUTCFullYear(date.getUTCFullYear() + 1);
        } else if (duration == Duration.MONTH) {
          date.setUTCMonth(date.getUTCMonth() + 1);
        } else if (duration == Duration.WEEK) {
          date.setUTCDate(date.getUTCDate() + 7);
        } else {
          date.setUTCDate(date.getUTCDate() + 1);
        }

        time = time.replace(/{end}/g, osTime.momentFormat(date, dateFormat, true));
        times.push(time);
      }
      return times;
    }

    return null;
  }
}

osImplements(AnimatedTile, IAnimationSupport.ID);
