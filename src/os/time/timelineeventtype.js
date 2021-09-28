goog.declareModuleId('os.time.TimelineEventType');

/**
 * @enum {string}
 */
const TimelineEventType = {
  DURATION_CHANGE: 'timeline.durationChange',
  FPS_CHANGE: 'timeline.fpsChange',
  LOOPING_TOGGLE: 'timeline.loopingToggle',
  FADE_TOGGLE: 'timeline.fadeToggle',
  LOCK_TOGGLE: 'timeline.lockToggle',
  PLAY: 'timeline.play',
  STOP: 'timeline.stop',
  RESET: 'timeline.reset',
  SHOW: 'timeline.show',
  DRAG: 'timeline.drag',
  RECORD: 'timeline.record',
  CAPTURE: 'timeline.capture',
  RANGE_CHANGED: 'timleline.rangeChanged',
  SLICE_RANGE_CHANGED: 'timeline.slice.rangeChanged',
  ANIMATE_RANGE_CHANGED: 'timeline.animate.rangeChanged',
  HOLD_RANGE_CHANGED: 'timeline.animate.holdRangeChanged',
  REFRESH_LOAD: 'timeline.refreshLoad'
};

export default TimelineEventType;
