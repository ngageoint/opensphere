goog.provide('os.events');

goog.require('goog.events.EventType');


/**
 * Prevents the browser context menu from popping up. While an element can be provided, typically you
 * should just call this without arguments and it will be applied to the entire document.
 *
 * Note that this method adds event listeners to the document or given element.
 *
 * @param {(Document|Element)=} opt_el
 */
os.events.preventBrowserContextMenu = function(opt_el) {
  opt_el = opt_el || document;

  opt_el.addEventListener(goog.events.EventType.MOUSEDOWN, os.events.wrapExempt_(os.events.killRightButton));
  opt_el.addEventListener(goog.events.EventType.MOUSEUP, os.events.wrapExempt_(os.events.killRightButton));
  opt_el.addEventListener(goog.events.EventType.CONTEXTMENU, os.events.wrapExempt_(os.events.killEvent));
};


/**
 * @param {function(goog.events.EventLike):(boolean|undefined)} listener
 * @return {function(goog.events.EventLike):(boolean|undefined)}
 * @private
 */
os.events.wrapExempt_ = function(listener) {
  return (
    /**
     * @param {goog.events.EventLike} evt The event
     * @return {boolean|undefined}
     */
    function(evt) {
      if (!os.events.isExempt(evt.target, evt.type)) {
        return listener(evt);
      }
    });
};


/**
 * @param {Document|Element} el The element to check
 * @param {string} type The event type
 * @return {boolean} Whether or not the element is exempt from right-click prevention
 */
os.events.isExempt = function(el, type) {
  var list = os.events.exemptionFunctions_;
  for (var i = 0, n = list.length; i < n; i++) {
    if (list[i](el, type)) {
      return true;
    }
  }

  return false;
};


/**
 * @type {Array<function((Document|Element), string):boolean>}
 * @private
 */
os.events.exemptionFunctions_ = [];


/**
 * Adds an exemption to right-click prevention
 * @param {function((Document|Element), string):boolean} checker The exemption check function
 */
os.events.addExemption = function(checker) {
  goog.array.insert(os.events.exemptionFunctions_, checker);
};


/**
 * Stops the event dead in its tracks.
 * @param {goog.events.EventLike} evt
 */
os.events.killEvent = function(evt) {
  evt.preventDefault();
  evt.stopPropagation();
};


/**
 * Stops right click events
 * @param {goog.events.EventLike} evt
 */
os.events.killRightButton = function(evt) {
  if (evt.button === 2) {
    os.events.killEvent(evt);
  }
};

// Do not kill off right-click events in input elements
os.events.addExemption(
    /**
     * @param {(Document|Element)} el The element
     * @param {string} type The event type
     * @return {boolean}
     */
    function(el, type) {
      return el instanceof HTMLInputElement;
    });
