goog.declareModuleId('os.ui.timeline.TimelineScaleEvent');

const GoogEvent = goog.require('goog.events.Event');

const {default: TimelineScaleOptions} = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 */
export default class TimelineScaleEvent extends GoogEvent {
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
