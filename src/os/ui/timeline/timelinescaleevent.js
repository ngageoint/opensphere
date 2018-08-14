goog.provide('os.ui.timeline.TimelineScaleEvent');

goog.require('goog.events.Event');


/**
 * @constructor
 * @param {os.ui.timeline.TimelineScaleOptions} options
 * @extends {goog.events.Event}
 */
os.ui.timeline.TimelineScaleEvent = function(options) {
  this.options = options;
  os.ui.timeline.TimelineScaleEvent.base(this, 'constructor', os.ui.timeline.TimelineScaleEvent.TYPE);
};
goog.inherits(os.ui.timeline.TimelineScaleEvent, goog.events.Event);


os.ui.timeline.TimelineScaleEvent.TYPE = 'timeline.Scale';
