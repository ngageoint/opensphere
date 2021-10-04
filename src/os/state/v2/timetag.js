goog.declareModuleId('os.state.v2.TimeTag');

/**
 * XML tags for time state
 * @enum {string}
 */
const TimeTag = {
  ADVANCE: 'advance',
  ANIMATION: 'animation',
  CURRENT: 'current',
  DURATION: 'duration',
  INTERVAL: 'interval',
  LOOP: 'loop',
  LOOP_BEHAVIOR: 'loopBehavior',
  MS_PER_FRAME: 'millisPerFrame',
  OUT: 'out',
  PLAY_STATE: 'playState',
  SEQUENCE: 'sequence',
  HOLDS: 'holds',
  SEQ_INTERVAL: 'interval',
  TIME: 'time'
};

export default TimeTag;
