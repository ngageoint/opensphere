goog.provide('os.command.State');


/**
 * The states of commands
 * @enum {string}
 */
os.command.State = {
  READY: 'ready',
  EXECUTING: 'executing',
  SUCCESS: 'success',
  ERROR: 'error',
  REVERTING: 'reverting'
};
