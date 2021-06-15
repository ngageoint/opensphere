goog.module('os.xt.events');
goog.module('os.xt.events.MasterChangedEvent');
goog.module.declareLegacyNamespace();

const EventTarget = goog.require('goog.events.EventTarget');


goog.require('goog.events.Event');

/**
 * Dispatches global events for XT
 * @type {!EventTarget}
 */
const DISPATCHER = new EventTarget();

/**
 * Event types for XT
 * @enum {string}
 */
const EventType = {
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

exports = {
  DISPATCHER,
  EventType
};
