goog.declareModuleId('os.xt.events');

const EventTarget = goog.require('goog.events.EventTarget');


/**
 * Dispatches global events for XT
 * @type {!EventTarget}
 */
export const DISPATCHER = new EventTarget();

/**
 * Event types for XT
 * @enum {string}
 */
export const EventType = {
  MASTER_APPOINTED: 'os.xt.events.masterAppointed'
};


/**
 * Retrieve an event type string customized for a peer group.
 *
 * @param {!os.xt.events.EventType} type
 * @param {!string} group
 * @return {!string}
 */
EventType.forGroup = function(type, group) {
  return [type, group].join('.');
};
