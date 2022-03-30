/**
 * @fileoverview Modifications to {@link OLObject}.
 */
goog.declareModuleId('os.mixin.object');

import EventTarget from 'ol/src/events/Target.js';
import OLObject, {ObjectEvent as ObjectEvent} from 'ol/src/Object.js';
import ObjectEventType from 'ol/src/ObjectEventType.js';
import {getUid} from 'ol/src/util.js';


/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;

/**
 * Initialize the mixin.
 */
export const init = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  /**
   * Angular uses $$hashKey to identify objects used in ngOptions, but we want the key to be created in a consistent
   * window context. This ensures all OL objects create a hashKey in their local context.
   *
   * @return {string|number}
   */
  OLObject.prototype.getHashKey = function() {
    return getUid(this);
  };
  Object.assign(OLObject.prototype, {
    '$$hashKey': OLObject.prototype.getHashKey
  });


  /**
   * Whether or not events are enabled
   * @type {boolean}
   * @protected
   */
  OLObject.prototype.eventsEnabled = true;


  /**
   * Enable events for the feature
   */
  OLObject.prototype.enableEvents = function() {
    this.eventsEnabled = true;
  };


  /**
   * Suppress events for the feature
   */
  OLObject.prototype.suppressEvents = function() {
    this.eventsEnabled = false;
  };


  /**
   * Modified to prevent events from firing when disabled.
   *
   * @inheritDoc
   */
  OLObject.prototype.dispatchEvent = function(e) {
    if (this.eventsEnabled) {
      return EventTarget.prototype.dispatchEvent.call(this, e);
    }
  };


  /**
   * Modified to prevent a lot of constructor/GC overhead with OLObject.Event's if events are disabled.
   *
   * @param {string} key Key name.
   * @param {*} oldValue Old value.
   * @suppress {duplicate}
   */
  OLObject.prototype.notify = function(key, oldValue) {
    if (this.eventsEnabled) {
      let eventType;
      eventType = `change:${key}`;
      this.dispatchEvent(new ObjectEvent(eventType, key, oldValue));
      eventType = ObjectEventType.PROPERTYCHANGE;
      this.dispatchEvent(new ObjectEvent(eventType, key, oldValue));
    }
  };
};

init();
