goog.declareModuleId('os.command.State');

/**
 * The states of commands
 * @enum {string}
 */
const State = {
  READY: 'ready',
  EXECUTING: 'executing',
  SUCCESS: 'success',
  ERROR: 'error',
  REVERTING: 'reverting'
};

export default State;
