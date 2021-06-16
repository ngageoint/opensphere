goog.module('os.ui.timeline.TimelineScaleEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');

const TimelineScaleOptions = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 */
class TimelineScaleEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {TimelineScaleOptions} options
   */
  constructor(options) {
    super(TimelineScaleEvent.TYPE);

    /**
     * @type {TimelineScaleOptions}
     */
    this.options = options;
  }
}


TimelineScaleEvent.TYPE = 'timeline.Scale';
exports = TimelineScaleEvent;
