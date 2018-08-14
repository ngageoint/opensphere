goog.provide('os.ui.draw.IDrawControl');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Listenable');



/**
 * Interface for drawing controls.
 * @extends {goog.events.Listenable}
 * @interface
 */
os.ui.draw.IDrawControl = function() {};


/**
 * Activate the control.
 * @param {goog.events.BrowserEvent=} opt_event Browser event if this is used in a listener.
 */
os.ui.draw.IDrawControl.prototype.activate;


/**
 * Deactivate the control.
 * @param {goog.events.BrowserEvent=} opt_event Browser event if this is used in a listener.
 */
os.ui.draw.IDrawControl.prototype.deactivate;


/**
 * Get the DOM element type for the control.
 * @return {string}
 */
os.ui.draw.IDrawControl.prototype.getElementType;


/**
 * SVG element for the draw control.
 * @return {SVGElement}
 */
os.ui.draw.IDrawControl.prototype.getMarker;


/**
 * Set the SVG element for the draw control.
 * @param {SVGElement} marker
 */
os.ui.draw.IDrawControl.prototype.setMarker;


/**
 * If the provided coordinate lies within the element drawn by this control.
 * @param {goog.math.Coordinate} coord
 * @return {boolean}
 */
os.ui.draw.IDrawControl.prototype.contains;
