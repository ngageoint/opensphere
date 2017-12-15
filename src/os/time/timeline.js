/**
 * Namespace for timeline utilities.
 */
goog.provide('os.time.timeline');


/**
 * @const
 * @type {number}
 */
os.time.timeline.MIN = 60 * 1000;


/**
 * @const
 * @type {number}
 */
os.time.timeline.HOUR = 60 * os.time.timeline.MIN;


/**
 * @const
 * @type {number}
 */
os.time.timeline.DAY = 24 * os.time.timeline.HOUR;


/**
 * @const
 * @type {number}
 */
os.time.timeline.WEEK = 7 * os.time.timeline.DAY;


/**
 * @const
 * @type {number}
 */
os.time.timeline.MONTH = 30 * os.time.timeline.DAY;


/**
 * @const
 * @type {number}
 */
os.time.timeline.YEAR = 12 * os.time.timeline.MONTH;


/**
 * Automatically configures the timeline controller for animation.
 * @param {os.time.TimelineController} controller
 * @param {string=} opt_durationHint
 */
os.time.timeline.autoConfigureFromTimeRange = function(controller, opt_durationHint) {
  var durationHint = goog.isDef(opt_durationHint) ? opt_durationHint : 'auto';

  var diff = controller.getSmallestAnimateRangeLength();
  if (durationHint == 'auto') {
    if (diff >= 28 * os.time.timeline.DAY - 30 * os.time.timeline.MIN) {
      // offset = week, skip = week, tile duration = week, tile only = true
      os.time.timeline.setTileAnimation(controller, 7 * os.time.timeline.DAY, os.time.Duration.WEEK);
    } else if (diff >= 5 * os.time.timeline.DAY - 30 * os.time.timeline.MIN) {
      // offset = day, skip = day, tile duration = day, tile only = true
      os.time.timeline.setTileAnimation(controller, os.time.timeline.DAY, os.time.Duration.DAY);
    } else {
      os.time.timeline.setDefaultOffsetForRange(controller, diff);
      controller.setDuration(os.time.Duration.DAY);
    }
  } else if (durationHint == os.time.Duration.WEEK || durationHint == os.time.Duration.MONTH) {
    os.time.timeline.setTileAnimation(controller, 7 * os.time.timeline.DAY, os.time.Duration.WEEK);
  } else if (durationHint == os.time.Duration.DAY) {
    os.time.timeline.setTileAnimation(controller, os.time.timeline.DAY, os.time.Duration.DAY);
  }

  controller.setCurrent(controller.getLoopStart() + controller.getOffset());
};


/**
 * Set the default offset/skip to use for a time range.
 * @param {os.time.TimelineController} controller
 * @param {number} range The timeline range
 */
os.time.timeline.setDefaultOffsetForRange = function(controller, range) {
  if (controller) {
    var offset = (range / 24) - ((range / 24) % 1000);
    if (offset == 0) {
      // set the offset to 1/24 of the range
      offset = range / 24;
    }
    var viewsize = controller.getRange().getLength();
    if (offset < viewsize / 24) {
      offset = Math.min(range / 2, viewsize / 24);
    }
    controller.setOffset(offset);
    controller.setSkip(offset / 2);
  }
};


/**
 * @param {os.time.TimelineController} controller
 * @param {number} offset
 * @param {string} duration
 */
os.time.timeline.setTileAnimation = function(controller, offset, duration) {
  controller.setOffset(offset);
  controller.setSkip(offset);
  controller.setDuration(duration);
};


/**
 * Creates a date string formatted to represent the current time of the timeline controller, using the provided
 * duration. Defaults to 'day' if no duration is provided.
 * @param {os.time.TimelineController} controller
 * @param {string=} opt_durationHint
 * @return {string}
 */
os.time.timeline.getDateForFrame = function(controller, opt_durationHint) {
  var duration = goog.isDef(opt_durationHint) ? opt_durationHint : os.time.Duration.DAY;
  var frameTime = controller.getCurrent();
  var loopEnd = controller.getLoopEnd();
  if (frameTime >= loopEnd) {
    // loopEnd isn't included in the range, so don't meet or exceed it
    frameTime = loopEnd - 1;
  }

  return os.time.format(new Date(frameTime), duration);
};
