goog.module('os.events');

const googArray = goog.require('goog.array');
const GoogEventType = goog.require('goog.events.EventType');
const googObject = goog.require('goog.object');
const SelectionType = goog.require('os.events.SelectionType');

const EventLike = goog.requireType('goog.events.EventLike');


/**
 * Prevents the browser context menu from popping up. While an element can be provided, typically you
 * should just call this without arguments and it will be applied to the entire document.
 *
 * Note that this method adds event listeners to the document or given element.
 *
 * @param {(Document|Element)=} opt_el
 */
const preventBrowserContextMenu = function(opt_el) {
  opt_el = opt_el || document;

  opt_el.addEventListener(GoogEventType.MOUSEDOWN, wrapExempt(killRightButton));
  opt_el.addEventListener(GoogEventType.MOUSEUP, wrapExempt(killRightButton));
  opt_el.addEventListener(GoogEventType.CONTEXTMENU, wrapExempt(killEvent));
};

/**
 * @param {function(EventLike):(boolean|undefined)} listener
 * @return {function(EventLike):(boolean|undefined)}
 */
const wrapExempt = function(listener) {
  return (
    /**
     * @param {EventLike} evt The event
     * @return {boolean|undefined}
     */
    function(evt) {
      if (!isExempt(evt.target, evt.type)) {
        return listener(evt);
      }
    }
  );
};

/**
 * @param {Document|Element} el The element to check
 * @param {string} type The event type
 * @return {boolean} Whether or not the element is exempt from right-click prevention
 */
const isExempt = function(el, type) {
  var list = exemptionFunctions;
  for (var i = 0, n = list.length; i < n; i++) {
    if (list[i](el, type)) {
      return true;
    }
  }

  return false;
};

/**
 * @type {Array<function((Document|Element), string):boolean>}
 */
const exemptionFunctions = [];

/**
 * Adds an exemption to right-click prevention
 *
 * @param {function((Document|Element), string):boolean} checker The exemption check function
 */
const addExemption = function(checker) {
  googArray.insert(exemptionFunctions, checker);
};

/**
 * Stops the event dead in its tracks.
 *
 * @param {EventLike} evt
 */
const killEvent = function(evt) {
  evt.preventDefault();
  evt.stopPropagation();
};

/**
 * Stops right click events
 *
 * @param {EventLike} evt
 */
const killRightButton = function(evt) {
  if (evt.button === 2) {
    killEvent(evt);
  }
};

/**
 * Test if an event type is a selection type.
 *
 * @param {?string} type The event type
 * @return {boolean}
 */
const isSelectionType = function(type) {
  return !!type && googObject.containsValue(SelectionType, type);
};

// Do not kill off right-click events in input elements
addExemption(
    /**
     * @param {(Document|Element)} el The element
     * @param {string} type The event type
     * @return {boolean}
     */
    function(el, type) {
      return el instanceof HTMLInputElement;
    });

exports = {
  preventBrowserContextMenu,
  isExempt,
  addExemption,
  killEvent,
  killRightButton,
  isSelectionType
};
