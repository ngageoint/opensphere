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
 * A local/remote file resource. Local resources must provide a relative directory path to be loaded in the debug
 * application. In the compiled app, `os.ROOT` will be used so resources must be copied appropriately. Remote files only
 * need to specify the URL.
 *
 * @typedef {{
 *   debugPath: (string|undefined),
 *   url: string
 * }}
 */
osx.ResourceConfig;


/**
 * Namespace.
 * @type {Object}
 */
osx.annotation;


/**
 * @typedef {{
 *   editable: boolean,
 *   show: boolean,
 *   showBackground: boolean,
 *   showName: boolean,
 *   showDescription: boolean,
 *   showTail: string,
 *   size: !Array<number>,
 *   offset: !Array<number>,
 *   position: (Array<number>|undefined),
 *   headerBG: (string|undefined),
 *   bodyBG: (string|undefined)
 * }}
 */
osx.annotation.Options;


/**
 * @typedef {{
 *   bgColor: (string|undefined),
 *   textColor: (string|undefined),
 *   text: (string|undefined),
 *   displayMode: (string|undefined)
 * }}
 */
osx.annotation.KMLBalloon;


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
 * @typedef {{
 *  namespace: (string|undefined),
 *  nameProperty: (string|undefined),
 *  queryProperties: (string|undefined),
 *  typename: (string|undefined),
 *  url: (string|undefined)
 * }}
 */
osx.ogc.OGCSettings;


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
 *   flightMode: (os.map.FlightMode|undefined),
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
 * @typedef {{
 *   type: (string|undefined),
 *   url: (string|undefined),
 *   credit: (Cesium.Credit|string|undefined),
 *   maxLevel: (number|undefined),
 *   minLevel: (number|undefined),
 *   tileSize: (number|undefined),
 *   useProxy: (boolean|undefined)
 * }}
 */
osx.map.TerrainProviderOptions;


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
 * @typedef {{
 *   label: string,
 *   id: string,
 *   default: (boolean|undefined),
 *   layerConfig: (Object<string, *>|undefined),
 *   featureActions: (Array<string>|undefined)
 * }}
 */
osx.layer.Preset;


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
 * @typedef {{
 *   enabled: boolean,
 *   item: *,
 *   label: (string|null|undefined),
 *   detailText: (string|null|undefined),
 *   tooltip: (string|null|undefined)
 * }}
 */
osx.ChecklistItem;


/**
 * Namespace.
 * @type {Object}
 */
osx.icon;


/**
 * @typedef {{
 *   title: (string|undefined),
 *   path: string,
 *   options: (Object<string, *>|undefined)
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
 *   headerClass: (string|undefined),
 *   label: (string|undefined),
 *   icon: (string|undefined),
 *   modal: (boolean|undefined),
 *   showClose: (boolean|undefined),
 *   noScroll: (boolean|undefined),
 *   string: (string|undefined),
 *
 *   height: (string|number|undefined),
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
 *   confirmValue: (*|undefined),
 *   cancel: (Function|undefined),
 *   yesText: (string|undefined),
 *   yesIcon: (string|undefined),
 *   yesButtonClass: (string|undefined),
 *   yesButtonTitle: (string|undefined),
 *   noText: (string|undefined),
 *   noIcon: (string|undefined),
 *   noButtonClass: (string|undefined),
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
 *   confirmValue: (*|undefined),
 *   cancel: (Function|undefined),
 *   yesText: (string|undefined),
 *   yesButtonClass: (string|undefined),
 *   yesIcon: (string|undefined),
 *   noText: (string|undefined),
 *   noIcon: (string|undefined),
 *   noButtonClass: (string|undefined),
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


/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   image: string,
 *   size: Array<string|number>,
 *   xy: Array<string|number>,
 *
 *   showClose: (boolean|undefined),
 *   showHide: (boolean|undefined)
 * }}
 */
osx.window.ScreenOverlayOptions;


/**
 * Namespace.
 * @type {Object}
 */
osx.cesium;


/**
 * @typedef {{
 *   layerName: string,
 *   maxLevel: number,
 *   minLevel: number
 * }}
 */
osx.cesium.WMSTerrainLayerOptions;


/**
 * @typedef {{
 *   layers: !Array<!osx.cesium.WMSTerrainLayerOptions>,
 *   url: string,
 *   credit: (Cesium.Credit|string|undefined),
 *   tileSize: (number|undefined),
 *   useProxy: (boolean|undefined)
 * }}
 */
osx.cesium.WMSTerrainProviderOptions;


/**
 * Namespace
 * @type {Object}
 */
osx.column;


/**
 * @typedef {{
 *   column: string,
 *   layer: string,
 *   units: (string|undefined)
 * }}
 */
osx.column.ColumnModel;


/**
 * Namespace.
 * @type {Object}
 */
osx.ui;


/**
 * Namespace.
 * @type {Object}
 */
osx.ui.draw;


/**
 * @typedef {{
 *   detail: number,
 *   max: number,
 *   style: ol.style.Style
 * }}
 */
osx.ui.draw.GridOptions;


/**
 * Namespace.
 * @type {Object}
 */
osx.import;


/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   valid: boolean,
 *   enabled: boolean,
 *   msg: (string|undefined),
 *   file: os.file.File
 * }}
 */
osx.import.FileWrapper;


/**
 * Namespace.
 * @type {Object}
 */
osx.feature;


/**
 * @typedef {{
 *   radius: number,
 *   units: string
 * }}
 */
osx.feature.RingDefinition;


/**
 * @typedef {{
 *   enabled: boolean,
 *   type: string,
 *   bearingType: string,
 *   interval: number,
 *   units: string,
 *   crosshair: boolean,
 *   arcs: boolean,
 *   labels: boolean,
 *   startAngle: number,
 *   widthAngle: number,
 *   rings: Array<osx.feature.RingDefinition>
 * }}
 */
osx.feature.RingOptions;
