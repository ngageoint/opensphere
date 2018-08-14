goog.provide('os.command.EventType');


/**
 * Event types for command events
 * @enum {string}
 */
os.command.EventType = {
  EXECUTED: 'executed',
  REVERTED: 'reverted',
  COMMAND_ADDED: 'command_added',
  COMMAND_EXECUTING: 'command_executing',
  COMMAND_EXECUTED: 'command_executed',
  COMMAND_REVERTING: 'command_reverting',
  COMMAND_REVERTED: 'command_reverted',
  HISTORY_LIMIT_CHANGED: 'history_limit_changed'
};
