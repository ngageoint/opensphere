goog.provide('os.metrics.keys');


/**
 * Global key hash to centralize metric keys.
 * This object is attached to the root angular scope
 * as metrics.
 * @type {*}
 */
os.metrics.keys = {};


/**
 * Timeline metrics
 * @enum {string}
 */
os.metrics.keys.Timeline = {
  // features
  OPEN: 'timeline.features.open',

  // controls
  TOGGLE_PLAY: 'timeline.features.controls-playToggle',
  NEXT_FRAME: 'timeline.features.controls-nextFrame',
  PREV_FRAME: 'timeline.features.controls-prevFrame',
  FIRST_FRAME: 'timeline.features.controls-firstFrame',
  LAST_FRAME: 'timeline.features.controls-lastFrame',
  ZOOM_IN: 'timeline.features.controls-zoomIn',
  ZOOM_OUT: 'timeline.features.controls-zoomOut',
  PAN_LEFT: 'timeline.features.controls-panLeft',
  PAN_RIGHT: 'timeline.features.controls-panRight',
  MOUSE_ZOOM: 'timeline.features.controls-mouseZoom',
  RECORD: 'timeline.features.controls-record',
  RESET: 'timeline.features.controls-reset',
  CHART_TYPE: 'timeline.features.controls-chartType',
  FPS: 'timeline.features.controls-changeFps',
  LOAD: 'timeline.features.controls-load',
  RANGE: 'timeline.features.controls-range',
  REMOVE: 'timeline.features.controls-remove',
  FEATURE_INFO: 'timeline.features.controls-featureInfo',
  GO_TO: 'timeline.features.controls-goTo',

  // time range
  RANGE_ANIMATE: 'timeline.features.timeRange-animate',
  RANGE_SKIP: 'timeline.features.timeRange-skip',
  RANGE_HOLD: 'timeline.features.timeRange-hold',
  RANGE_LOAD: 'timeline.features.timeRange-load',
  RANGE_ADD: 'timeline.features.timeRange-add',
  RANGE_SLICE: 'timeline.features.timeRange-slice',
  RANGE_ZOOM: 'timeline.features.timeRange-zoom',
  RANGE_SELECT: 'timeline.features.timeRange-select',
  RANGE_SELECTEX: 'timeline.features.timeRange-selectExclusive',
  RANGE_DESELECT: 'timeline.features.timeRange-deselect',

  // settings
  FADE: 'timeline.features.settings-fade',
  LOCK: 'timeline.features.settings-lock',
  TIME_RANGE: 'timeline.features.settings-timeRange',

  // statistics
  MAX_PLAY: 'timeline.stats.max-play',
  MIN_PLAY: 'timeline.stats.min-play'
};


/**
 * AddData metrics
 * @enum {string}
 */
os.metrics.keys.AddData = {
  OPEN: 'addData.open',
  SEARCH: 'addData.search',
  GROUP_BY: 'addData.groupBy',
  IMPORT: 'addData.import',
  GET_INFO: 'addData.getInfo',
  ADD_TILE: 'addData.add-tile',
  ADD_VECTOR: 'addData.add-vector',
  REMOVE_TILE: 'addData.remove-tile',
  REMOVE_VECTOR: 'addData.remove-vector',
  ADD_LAYER_COMMAND: 'addData.add-layer-command',
  REMOVE_LAYER_COMMAND: 'addData.remove-layer-command'
};


/**
 * Filters metrics
 * @enum {string}
 */
os.metrics.keys.Filters = {
  ADVANCED: 'filters.advancedOpen',
  SEARCH: 'filters.search',
  GROUP_BY: 'filters.groupBy',
  COPY: 'filters.copy',
  EDIT: 'filters.edit',
  NEW: 'filters.new',
  REMOVE: 'filters.remove',
  IMPORT: 'filters.import',
  EXPORT: 'filters.export',
  ADVANCED_APPLY: 'filters.advanced.apply',
  ADVANCED_CLOSE: 'filters.advanced.close',
  ADVANCED_RESET: 'filters.advanced.reset',
  ADVANCED_ADD_FILTER: 'filters.advanced.addFilter',
  ADVANCED_EXPAND_ALL: 'filters.advanced.expandAll',
  ADVANCED_COLLAPSE_ALL: 'filters.advanced.collapseAll',
  ADVANCED_TOGGLE: 'filters.advanced.advancedToggle',
  ADVANCED_SELECT_LAYER: 'filters.advanced.selectLayer',
  ADVANCED_AREA_INCLUDE_TOGGLE: 'filters.advanced.areaIncludeToggle',
  ADVANCED_AREA_EDIT: 'filters.advanced.areaEdit',
  ADVANCED_AREA_REMOVE: 'filters.advanced.areaRemove',
  ADVANCED_AREA_COPY: 'filters.advanced.areaCopy'
};


/**
 * Map metrics
 * @enum {string}
 */
os.metrics.keys.Map = {
  ADD_FEATURE: 'map.features.addFeature',
  ADD_FEATURES: 'map.features.addFeatures',
  ADD_LABEL: 'map.features.addLabel',
  ADD_LAYER: 'map.features.addLayer',
  BACKGROUND_COLOR: 'map.features.setBackGroundColor',
  CLEAR_SELECTION: 'map.features.clearSelection',
  CLEAR_STATE: 'map.features.clearState',
  COPY_COORDINATES: 'map.features.copyCoordinates',
  COPY_COORDINATES_CONTEXT_MENU: 'map.contextMenu.copyCoordinates',
  COPY_COORDINATES_KB: 'map.keyboard.copyCoordinates',
  DRAW: 'map.feature.draw',
  FLY_TO: 'map.features.flyTo',
  FLY_TO_EXTENT: 'map.features.flyToExtent',
  GENERAL_IMPORT_KB: 'map.keyboard.generalImport',
  IMPORT_STATE: 'map.features.importState',
  LAYER_COUNT: 'map.features.layerCount',
  LOAD_FROM_AREA: 'map.features.loadFromArea',
  LOAD_FROM_COORDINATES: 'map.features.loadFromCoordinates',
  LOAD_FROM_COUNTRY: 'map.features.loadFromCountry',
  LOAD_FROM_WATER: 'map.features.loadFromWater',
  MEASURE_TOGGLE: 'map.feature.measureToolToggle',
  MODE_2D: 'map.features.mapMode-2d',
  MODE_3D: 'map.features.mapMode-3d',
  OPEN_LAYERS: 'map.feature.openLayers',
  OPEN_LAYERS_KB: 'map.keyboard.openLayers',
  QUERY_WORLD: 'map.features.queryWorld',
  REDO: 'map.redo',
  REMOVE_FEATURE: 'map.features.removeFeature',
  REMOVE_FEATURES: 'map.features.removeFeatures',
  REMOVE_LAYER: 'map.features.removeLayer',
  RESET_ROLL: 'map.features.resetRoll',
  RESET_ROLL_KB: 'map.keyboard.resetRoll',
  RESET_ROTATION: 'map.features.resetRotation',
  RESET_ROTATION_CONTEXT_MENU: 'map.contextMenu.resetRotation',
  RESET_ROTATION_KB: 'map.keyboard.resetRotation',
  RESET_TILT: 'map.features.resetTilt',
  RESET_TILT_KB: 'map.keyboard.resetTilt',
  RESET_VIEW: 'map.features.resetView',
  RESET_VIEW_CONTEXT_MENU: 'map.contextMenu.resetView',
  RESET_VIEW_KB: 'map.keyboard.resetView',
  SAVE_STATE: 'map.features.saveState',
  SAVE_STATE_KB: 'map.keyboard.saveState',
  SHARE: 'map.features.share',
  SCREEN_CAPTURE: 'map.features.screenCapture',
  SCREEN_RECORD: 'map.features.screenCapture',
  SEARCH_KB: 'map.keyboard.search',
  SHOW_LAYER_WINDOW: 'map.features.layers',
  SHOW_LAYER_WINDOW_KB: 'map.keyboard.layers',
  SHOW_LEGEND: 'map.features.showLedgend',
  SHOW_LEGEND_CONTEXT: 'map.features.showLedgendContext',
  TOGGLE_MODE: 'map.features.toggleMode',
  UNDO: 'map.undo',
  UNITS_FEET: 'map.units.feet',
  UNITS_IMPERIAL: 'map.units.imperial',
  UNITS_METRIC: 'map.units.metric',
  UNITS_MILE: 'map.units.mile',
  UNITS_NAUTICAL: 'map.units.nautical',
  UNITS_NAUTICALMILE: 'map.units.nauticalmile',
  UNITS_YARD: 'map.units.yard',
  WEBGL_FAILED: 'map.stats.error-webglInitFailed',
  WEBGL_PERFORMANCE_CAVEAT: 'map.stats.error-webglPerfCaveat',
  WEBGL_UNSUPPORTED: 'map.stats.error-webglUnsupported'
};


/**
 * Descriptor metrics tracked
 * @enum {string}
 */
os.metrics.keys.Descriptor = {
  ACTIVATE: 'descriptor.activate',
  DEACTIVATE: 'descriptor.de-activate'
};


/**
 * Settings metrics tracked
 * @enum {string}
 */
os.metrics.keys.Settings = {
  RESET_SETTINGS: 'settings.reset',
  STORAGE_REMOTE: 'settings.storage.remote',
  STORAGE_LOCAL: 'settings.storage.local',
  SWITCH_PROJECTION: 'settings.projectionSwitch'
};


/**
 * Search metrics tracked
 * @enum {string}
 */
os.metrics.keys.Search = {
  SEARCH_TYPE: 'type'
};


/**
 * Create a metric key based on the browser version
 * @type {string}
 */
os.metrics.keys.BROWSER = 'browser';


/**
 * Create a metric key based on the OS version
 * @enum {string}
 */
os.metrics.keys.OS = {
  WINDOWS: 'os.windows',
  LINUX: 'os.linux',
  MAC: 'os.mac',
  IOS: 'os.ios',
  ANDROID: 'os.android'
};


/**
 * Layer metrics
 * @enum {string}
 */
os.metrics.Layer = {
  PRESET: 'layers.features.preset',
  FORCE_LAYER_COLOR: 'layers.features.forceLayerColor',
  VECTOR_COLOR: 'layers.features.changeVectorColor',
  VECTOR_FILL_COLOR: 'layers.features.changeVectorFillColor',
  VECTOR_ICON: 'layers.features.changeVectorIcon',
  VECTOR_SHAPE: 'layers.features.changeVectorShape',
  VECTOR_CENTER_SHAPE: 'layers.features.changeVectorCenterShape',
  VECTOR_SIZE: 'layers.features.changeVectorSize',
  VECTOR_OPACITY: 'layers.features.changeVectorOpacity',
  VECTOR_FILL_OPACITY: 'layers.features.changeVectorFillOpacity',
  VECTOR_LINE_DASH: 'layers.features.changeVectorLineDash',
  VECTOR_AUTO_REFRESH: 'layers.features.changeVectorAutoRefresh',
  VECTOR_ELLIPSOID: 'layers.features.changeVectorEllipsoid',
  VECTOR_GROUND_REF: 'layers.features.changeVectorGroundReference',
  VECTOR_SHOW_ARROW: 'layers.features.changeVectorShowArrow',
  VECTOR_SHOW_ERROR: 'layers.features.changeVectorShowError',
  VECTOR_SHOW_ELLIPSE: 'layers.features.changeVectorShowEllipse',
  VECTOR_SHOW_ROTATION: 'layers.features.changeVectorShowRotation',
  VECTOR_ARROW_SIZE: 'layers.features.changeVectorArrowSize',
  VECTOR_ARROW_UNITS: 'layers.features.changeVectorArrowUnits',
  VECTOR_LOB_COLUMN_LENGTH: 'layers.features.changeVectorLineOfBearingColumnLength',
  VECTOR_LOB_LENGTH: 'layers.features.changeVectorLineOfBearingLength',
  VECTOR_LOB_LENGTH_TYPE: 'layers.features.changeVectorLineOfBearingLengthType',
  VECTOR_LOB_LENGTH_UNITS: 'layers.features.changeVectorLineOfBearingLengthUnits',
  VECTOR_LOB_LENGTH_COLUMN: 'layers.features.changeVectorLineOfBearingLengthColumn',
  VECTOR_LOB_LENGTH_ERROR: 'layers.features.changeVectorLineOfBearingLengthError',
  VECTOR_LOB_LENGTH_ERROR_COLUMN: 'layers.features.changeVectorLineOfBearingLengthErrorColumn',
  VECTOR_LOB_LENGTH_ERROR_UNITS: 'layers.features.changeVectorLineOfBearingLengthErrorUnits',
  VECTOR_LOB_BEARING_COLUMN: 'layers.features.changeVectorLineOfBearingBearingColumn',
  VECTOR_LOB_BEARING_ERROR: 'layers.features.changeVectorLineOfBearingBearingError',
  VECTOR_LOB_BEARING_ERROR_COLUMN: 'layers.features.changeVectorLineOfBearingBearingErrorColumn',
  VECTOR_ROTATION_COLUMN: 'layers.features.changeVectorRotationColumn',
  VECTOR_UNIQUE_ID: 'layers.features.changeVectorRotationColumn',
  FEATURE_COLOR: 'layers.features.changeFeatureColor',
  FEATURE_FILL_COLOR: 'layers.features.changeFeatureFillColor',
  FEATURE_ICON: 'layers.features.changeFeatureIcon',
  FEATURE_OPACITY: 'layers.features.changeFeatureOpacity',
  FEATURE_FILL_OPACITY: 'layers.features.changeFeatureFillOpacity',
  FEATURE_SIZE: 'layers.features.changeFeatureSize',
  FEATURE_LINE_DASH: 'layers.features.changeFeatureLineDash',
  FEATURE_LABEL_COLOR: 'layers.features.changeFeatureLabelColor',
  FEATURE_LABEL_SIZE: 'layers.features.changeFeatureLabelSize',
  FEATURE_LABEL_TOGGLE: 'layers.features.changeFeatureLabelToggle',
  FEATURE_LABEL_COLUMN_SELECT: 'layers.features.featureLabelColumnSelect',
  FEATURE_ROTATION_COLUMN: 'layers.features.changeFeatureRotationColumn',
  FEATURE_SHOW_ROTATION: 'layers.features.changeFeatureShowRotation',
  FEATURE_SHAPE: 'layers.features.changeFeatureShape',
  FEATURE_CENTER_SHAPE: 'layers.features.changeFeatureCenterShape',
  LABEL_COLOR: 'layers.features.changeLabelColor',
  LABEL_SIZE: 'layers.features.changeLabelSize',
  LABEL_TOGGLE: 'layers.features.changeLabelToggle',
  LABEL_COLUMN_SELECT: 'layers.features.labelColumnSelect',
  LABEL_COLUMN_ADD: 'layers.features.labelColumnAdd',
  LABEL_COLUMN_REMOVE: 'layers.features.labelColumnRemove',
  GO_TO: 'layers.contextMenu.featureLayer.goTo',
  CLEAR_SELECTION: 'layers.contextMenu.featureLayer.clearSelection',
  HEATMAP: 'layers.contextMenu.featureLayer.heatMap',
  MOST_RECENT: 'layers.contextMenu.mostRecent',
  IDENTIFY: 'layers.contextMenu.identify',
  REFRESH: 'layers.contextMenu.refresh',
  RESET_COLOR: 'layers.contextMenu.resetColor',
  LOCK: 'layers.contextMenu.lock',
  UNLOCK: 'layers.contextMenu.unlock',
  REMOVE: 'layers.contextMenu.remove',
  RENAME: 'layers.contextMenu.rename',
  EXPORT: 'layers.contextMenu.export',
  CREATE_BUFFER: 'layers.contextMenu.createBuffer',
  SHOW_DESCRIPTION: 'layers.contextMenu.showDescription',
  FEATURE_LIST: 'layers.contextMenu.featureList'
};


/**
 * Feature metrics
 * @enum {string}
 */
os.metrics.Feature = {
};


/**
 * Feature list metrics
 * @enum {string}
 */
os.metrics.FeatureList = {
  EXPORT: 'featureList.export',
  GOTO: 'featureList.goTo',
  SORT_SELECTED: 'featureList.sortSelected',
  SELECT_ALL: 'featureList.selectAll',
  DESELECT_ALL: 'featureList.deselectAll',
  INVERT_SELECTION: 'featureList.invertSelection',
  COLOR_SELECTED: 'featureList.colorSelected',
  RESET_COLOR: 'featureList.resetColor'
};


/**
 * Places metrics
 * @enum {string}
 */
os.metrics.Places = {
  ADD_ANNOTATION: 'places.addAnnotation',
  ADD_FOLDER: 'places.addFolder',
  ADD_PLACE: 'places.addPlace',
  EXPORT: 'places.export',
  IMPORT: 'places.import',
  EXPAND_ALL: 'places.expandAll',
  COLLAPSE_ALL: 'places.collapseAll',
  // context menu
  EDIT_FOLDER: 'places.contextMenu.editFolder',
  EDIT_PLACEMARK: 'places.contextMenu.editPlacemark',
  SAVE_TO: 'places.contextMenu.saveTo',
  EXPORT_CONTEXT: 'places.contextMenu.export',
  QUICK_ADD_PLACES: 'places.quickAdd',
  REMOVE_PLACE: 'places.removePlace',
  REMOVE_ALL: 'places.removeAll'
};


/**
 * Servers metrics
 * @enum {string}
 */
os.metrics.Servers = {
  ADD_SERVER: 'servers.addServer',
  VIEW: 'servers.view',
  REFRESH: 'servers.refresh',
  EDIT: 'servers.edit',
  REMOVE: 'servers.delete'
};
