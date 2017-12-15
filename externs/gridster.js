/**
 * @fileoverview Externs for the angular-gridster directive.
 * @externs
 */


/**
 * @type {Object}
 */
var gridster = {};


/**
 * @typedef {function(Event, Element, Object)}
 * @todo Element or angular.JQLite?
 */
gridster.widgetCallback;


/**
 * @typedef {{
 *   drag: (gridster.widgetCallback|undefined),
 *   enabled: (boolean|undefined),
 *   handle: (string|undefined),
 *   start: (gridster.widgetCallback|undefined),
 *   stop: (gridster.widgetCallback|undefined)
 * }}
 */
gridster.DragOptions;


/**
 * @typedef {{
 *   enabled: (boolean|undefined),
 *   handles: (Array<string>|undefined),
 *   resize: (gridster.widgetCallback|undefined),
 *   start: (gridster.widgetCallback|undefined),
 *   stop: (gridster.widgetCallback|undefined)
 * }}
 */
gridster.ResizeOptions;


/**
 * @typedef {{
 *   colWidth: (number|string|undefined),
 *   columns: (number|undefined),
 *   defaultSizeX: (number|undefined),
 *   defaultSizeY: (number|undefined),
 *   draggable: (gridster.DragOptions|undefined),
 *   floating: (boolean|undefined),
 *   isMobile: (boolean|undefined),
 *   margins: (Array<number>|undefined),
 *   maxRows: (number|undefined),
 *   maxSizeX: (number|undefined),
 *   maxSizeY: (number|undefined),
 *   minColumns: (number|undefined),
 *   minRows: (number|undefined),
 *   minSizeX: (number|undefined),
 *   minSizeY: (number|undefined),
 *   mobileBreakPoint: (number|undefined),
 *   mobileModeEnabled: (boolean|undefined),
 *   outerMargin: (boolean|undefined),
 *   pushing: (boolean|undefined),
 *   resizable: (gridster.ResizeOptions|undefined),
 *   rowHeight: (number|string|undefined),
 *   swapping: (boolean|undefined),
 *   width: (number|string|undefined)
 * }}
 */
gridster.Options;


/**
 * @typedef {{
 *   row: (number|undefined),
 *   col: (number|undefined),
 *   sizeX: (number|undefined),
 *   sizeY: (number|undefined),
 *   minSizeX: (number|undefined),
 *   minSizeY: (number|undefined),
 *   maxSizeX: (number|undefined),
 *   maxSizeY: (number|undefined)
 * }}
 */
gridster.ItemOptions;
