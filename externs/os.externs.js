/**
 * @fileoverview Closure compiler externs for os. Use this file to define types that need to be left uncompiled to
 *               avoid bracket notation and enforce type checking.
 *
 * @externs
 */


/**
 * @type {Object}
 */
var osx;


/**
 * Namespace.
 * @type {Object}
 */
osx.geo;


/**
 * @typedef {{
 *   lat: number,
 *   lon: number
 * }}
 */
osx.geo.Location;


/**
 * Namespace.
 * @type {Object}
 */
osx.ogc;


/**
 * @typedef {{
 *   data: string,
 *   label: string
 * }}
 */
osx.ogc.TileStyle;


/**
 * Namespace.
 * @type {Object}
 */
osx.search;


/**
 * @typedef {{
 *   ids: !Array<string>,
 *   term: string
 * }}
 */
osx.search.RecentSearch;


/**
 * Namespace.
 * @type {Object}
 */
osx.interaction;


/**
 * @typedef {{
 *   feature: (ol.Feature|undefined),
 *   layer: (ol.layer.Layer|undefined)
 * }}
 */
osx.interaction.FeatureResult;


/**
 * Namespace.
 * @type {Object}
 */
osx.map;


/**
 * @typedef {{
 *   center: !Array<number>,
 *   altitude: number,
 *   heading: number,
 *   roll: number,
 *   tilt: number
 * }}
 */
osx.map.CameraState;


/**
 * @typedef {{
 *   altitude: (number|undefined),
 *   center: (ol.Coordinate|undefined),
 *   duration: (number|undefined),
 *   flightMode: (os.FlightMode|undefined),
 *   positionCamera: (boolean|undefined),
 *   heading: (number|undefined),
 *   pitch: (number|undefined),
 *   range: (number|undefined),
 *   roll: (number|undefined),
 *   zoom: (number|undefined)
 * }}
 */
osx.map.FlyToOptions;


/**
 * Namespace.
 * @type {Object}
 */
osx.control;


/**
 * @typedef {{
 *   className: (string|undefined),
 *   textClass: (string|undefined),
 *   target: (Element|string|undefined),
 *   tipLabel: (string|undefined)
 * }}
 */
osx.control.MapModeOptions;


/**
 * Namespace.
 * @type {Object}
 */
osx.layer;


/**
 * @typedef {{
 *   label: string,
 *   interval: number
 * }}
 */
osx.layer.RefreshOption;


/**
 * Namespace.
 * @type {Object}
 */
osx.olcs;


/**
 * @typedef {{
 *   url: string,
 *   credit: (Cesium.Credit|string|undefined),
 *   maxLevel: (number|undefined),
 *   minLevel: (number|undefined),
 *   tileSize: (number|undefined),
 *   useProxy: (boolean|undefined)
 * }}
 */
osx.olcs.TerrainProviderOptions;


/**
 * Namespace.
 * @type {Object}
 */
osx.ogc;


/**
 * Namespace.
 * @type {Object}
 */
osx.ogc.wms;


/**
 * @typedef {{
 *   layerName: string,
 *   maxLevel: number,
 *   minLevel: number
 * }}
 */
osx.ogc.wms.TerrainLayerOptions;


/**
 * @typedef {{
 *   layers: !Array<!osx.ogc.wms.TerrainLayerOptions>,
 *   url: string,
 *   credit: (Cesium.Credit|string|undefined),
 *   tileSize: (number|undefined),
 *   useProxy: (boolean|undefined)
 * }}
 */
osx.ogc.wms.TerrainProviderOptions;


/**
 * Namespace.
 * @type {Object}
 */
osx.legend;


/**
 * @typedef {{
 *   bgColor: (string|undefined),
 *   bold: boolean,
 *   fontSize: number,
 *   showVector: boolean,
 *   showVectorType: boolean,
 *   showCount: boolean,
 *   showTile: boolean,
 *   showBackground: boolean,
 *   opacity: number,
 *
 *   font: (string|undefined),
 *   maxRowWidth: (number|undefined),
 *   offsetX: (number|undefined),
 *   offsetY: (number|undefined),
 *   render: (ol.render.canvas.Immediate|undefined),
 *   version: (number|undefined)
 * }}
 */
osx.legend.LegendOptions;


/**
 * @typedef {{
 *   render: (function(!ol.layer.Layer,!osx.legend.LegendOptions)|undefined),
 *   priority: (number|undefined),
 *   settingsUI: (string|undefined),
 *   defaultSettings: (Object|undefined)
 * }}
 */
osx.legend.PluginOptions;



/**
 * Item to display in the checklist directive.
 * @constructor
 */
osx.ChecklistItem = function() {};


/**
 * If the item is enabled.
 * @type {boolean}
 */
osx.ChecklistItem.prototype.enabled;


/**
 * Data the item maps back to.
 * @type {*}
 */
osx.ChecklistItem.prototype.item;


/**
 * The primary label used for sorting the checklist.
 * @type {string}
 */
osx.ChecklistItem.prototype.label;


/**
 * Displayed next to the label.
 * @type {string}
 */
osx.ChecklistItem.prototype.detailText;


/**
 * Tooltip to display on hover.
 * @type {string}
 */
osx.ChecklistItem.prototype.tooltip;


/**
 * Namespace.
 * @type {Object}
 */
osx.icon;


/**
 * @typedef {{
 *   title: (string|undefined),
 *   path: string
 * }}
 */
osx.icon.Icon;


/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   html: string
 * }}
 */
osx.icon.iconSelector;


/**
 * Namespace.
 * @type {Object}
 */
osx.window;


/**
 * @typedef {{
 *   label: (string|undefined),
 *   icon: (string|undefined),
 *   modal: (boolean|undefined),
 *   showClose: (boolean|undefined),
 *   noScroll: (boolean|undefined),
 *
 *   height: (number|undefined),
 *   minHeight: (number|undefined),
 *   maxHeight: (number|undefined),
 *
 *   width: (number|undefined),
 *   minWidth: (number|undefined),
 *   maxWidth: (number|undefined),
 *
 *   x: (number|undefined),
 *   y: (number|undefined)
 * }}
 */
osx.window.WindowOptions;


/**
 * @typedef {{
 *   confirm: (Function|undefined),
 *   cancel: (Function|undefined),
 *   yesText: (string|undefined),
 *   yesIcon: (string|undefined),
 *   yesButtonTitle: (string|undefined),
 *   noText: (string|undefined),
 *   noIcon: (string|undefined),
 *   noButtonTitle: (string|undefined),
 *   formClass: (string|undefined),
 *
 *   windowOptions: (osx.window.WindowOptions|undefined),
 *
 *   prompt: (string|undefined)
 * }}
 */
osx.window.ConfirmOptions;


/**
 * @typedef {{
 *   confirm: (Function|undefined),
 *   cancel: (Function|undefined),
 *   yesText: (string|undefined),
 *   yesIcon: (string|undefined),
 *   noText: (string|undefined),
 *   noIcon: (string|undefined),
 *
 *   windowOptions: (osx.window.WindowOptions|undefined),
 *
 *   prompt: (string|undefined),
 *   defaultValue: (string|undefined),
 *   formLabel: (string|undefined)
 * }}
 */
osx.window.ConfirmTextOptions;


/**
 * @typedef {{
 *   title: (string|undefined),
 *   text: (string|undefined),
 *   value: (string|undefined),
 *   text2: (string|undefined),
 *   value2: (string|undefined),
 *
 *   windowOptions: (osx.window.WindowOptions|undefined)
 * }}
 */
osx.window.TextPromptOptions;


/**
 * @typedef {{
 *   confirm: (Function|undefined),
 *   cancel: (Function|undefined),
 *   columns: (Array<os.data.ColumnDefinition>|undefined),
 *   prompt: (string|undefined),
 *   defaultValue: (os.data.ColumnDefinition|undefined),
 *
 *   windowOptions: (osx.window.WindowOptions|undefined)
 * }}
 */
osx.window.ConfirmColumnOptions;
