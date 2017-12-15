goog.provide('os.events.EventFactory');


/**
 * Create an Event with browser compatibility logic
 * @param {!string} type The type of event to create
 * @return {!Event}
 */
os.events.EventFactory.createEvent = function(type) {
  var event;
  try {
    // modern browsers
    event = new Event(type);
  } catch (e) {
    // puke
    event = document.createEvent('Event');
    event.initEvent(type, true, true);
  }
  return event;
};
