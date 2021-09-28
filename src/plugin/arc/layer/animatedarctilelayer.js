goog.declareModuleId('plugin.arc.layer.AnimatedArcTile');

import AnimatedTile from '../../../os/layer/animatedtile.js';
import * as time from '../../../os/time/time.js';
import TimelineController from '../../../os/time/timelinecontroller.js';


/**
 * Extension of AnimatedTile for slightly different date formatting purposes.
 */
class AnimatedArcTile extends AnimatedTile {
  /**
   * Constructor.
   * @param {olx.layer.TileOptions} options Tile layer options
   */
  constructor(options) {
    super(options);
    this.setTimeFunction(AnimatedTile.updateParams);
  }

  /**
   * @inheritDoc
   */
  getFormattedDate() {
    var tlc = TimelineController.getInstance();
    var duration = tlc.getDuration();
    var start = duration == 'custom' ? tlc.getStart() : tlc.getCurrent() - tlc.getOffset();
    var end = tlc.getCurrent();

    if (duration != 'custom') {
      start = end = (start + end) / 2;
    }

    var flooredStart = time.floor(new Date(start), duration);
    var cappedEnd = time.ceil(new Date(end), duration);

    // if the capped start/end times are the same, we're on a boundary. take the next duration instead.
    cappedEnd = cappedEnd.getTime() == flooredStart.getTime() ? time.ceil(new Date(end), duration) : cappedEnd;

    return flooredStart.getTime() + ',' + cappedEnd.getTime();
  }
}

export default AnimatedArcTile;
