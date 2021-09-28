goog.declareModuleId('os.time.TimelineActionEventType');

/**
 * timeline actions
 * @enum {string}
 */
const TimelineActionEventType = {
  LOAD: 'timeline.load',
  ADD: 'timeline.add',
  SLICE: 'timeline.slice',
  SELECT: 'timeline.select',
  SELECT_EXCLUSIVE: 'timeline.selectExclusive',
  DESELECT: 'timeline.deselect',
  REMOVE: 'timeline.remove',
  ANIMATE: 'timeline.animate',
  ANIMATE_SKIP: 'timeline.animateSkip',
  ANIMATE_HOLD: 'timeline.animateHold',
  ACTIVE_WINDOW: 'timeline.activeWindow',
  ZOOM: 'timeline.zoom',
  FEATURE_INFO: 'timeline.featureInfo',
  GO_TO: 'timeline.goTo'
};

export default TimelineActionEventType;
