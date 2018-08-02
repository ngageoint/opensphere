goog.provide('os.xt.events');
goog.provide('os.xt.events.MasterChangedEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');


/**
 * Dispatches global events for XT
 * @type {!goog.events.EventTarget}
 * @const
 */
os.xt.events.DISPATCHER = new goog.events.EventTarget();


/**
 * Event types for XT
 * @enum {string}
 */
os.xt.events.EventType = {
  MASTER_APPOINTED: 'os.xt.events.masterAppointed'
};


/**
 * Retrieve an event type string customized for a peer group.
 * @param {!os.xt.events.EventType} type
 * @param {!string} group
 * @return {!string}
 */
os.xt.events.EventType.forGroup = function(type, group) {
  return [type, group].join('.');
};
