/**
 * @fileoverview Modifications to {@link ol.Object}.
 */
goog.provide('os.mixin.object');

goog.require('ol.Object');
goog.require('ol.ObjectEventType');


/**
 * Angular uses $$hashKey to identify objects used in ngOptions, but we want the key to be created in a consistent
 * window context. This ensures all OL objects create a hashKey in their local context.
 * @return {string|number}
 */
ol.Object.prototype.getHashKey = function() {
  return ol.getUid(this);
};
goog.exportProperty(ol.Object.prototype, '$$hashKey', ol.Object.prototype.getHashKey);


/**
 * Whether or not events are enabled
 * @type {boolean}
 * @protected
 */
ol.Object.prototype.eventsEnabled = true;


/**
 * Enable events for the feature
 */
ol.Object.prototype.enableEvents = function() {
  this.eventsEnabled = true;
};


/**
 * Suppress events for the feature
 */
ol.Object.prototype.suppressEvents = function() {
  this.eventsEnabled = false;
};


/**
 * Modified to prevent events from firing when disabled.
 * @inheritDoc
 */
ol.Object.prototype.dispatchEvent = function(e) {
  if (this.eventsEnabled) {
    return ol.events.EventTarget.prototype.dispatchEvent.call(this, e);
  }
};


/**
 * Modified to prevent a lot of constructor/GC overhead with ol.Object.Event's if events are disabled.
 * @param {string} key Key name.
 * @param {*} oldValue Old value.
 * @suppress {duplicate}
 */
ol.Object.prototype.notify = function(key, oldValue) {
  if (this.eventsEnabled) {
    var eventType;
    eventType = ol.Object.getChangeEventType(key);
    this.dispatchEvent(new ol.Object.Event(eventType, key, oldValue));
    eventType = ol.ObjectEventType.PROPERTYCHANGE;
    this.dispatchEvent(new ol.Object.Event(eventType, key, oldValue));
  }
};
