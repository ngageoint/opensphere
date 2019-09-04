goog.provide('os.action.EventType');

goog.require('goog.events.EventType');


/**
 * @enum {string}
 */
os.action.EventType = {

  // layer
  IDENTIFY: 'identify',
  GOTO: 'goTo',
  MOST_RECENT: 'mostRecent',
  REFRESH: 'refresh',
  LOCK: 'layer:lock',
  UNLOCK: 'layer:unlock',
  REMOVE_LAYER: 'layer:remove',
  RENAME: 'rename',
  DISABLE_TIME: 'layer:disableTime',
  ENABLE_TIME: 'layer:enableTime',
  SHOW_DESCRIPTION: 'showDescription',
  FEATURE_LIST: 'layer:featureList',

  // map
  COPY: goog.events.EventType.COPY,
  RESET_VIEW: 'resetView',
  RESET_ROTATION: 'resetRotation',
  TOGGLE_VIEW: 'toggleView',
  SHOW_LEGEND: 'showLegend',
  CLEAR_SELECTION: 'clearSelection',

  // area
  BUFFER: 'bufferSelected',
  ENABLE: 'enable',
  DISABLE: 'disable',
  REMOVE_AREA: 'removeArea',
  SAVE: 'save',
  EDIT: 'edit',
  REMOVE_FROM_AREA: 'area:removeFrom',
  INTERSECT_AREA: 'area:intersect',
  ADD_TO_AREA: 'area:addTo',
  MODIFY_AREA: 'area:modify',
  MERGE_AREAS: 'area:merge',
  SEARCH_AREA: 'area:search',

  // color
  COLOR_SELECTED: 'colorSelected',
  AUTO_COLOR: 'autoColor',
  AUTO_COLOR_BY_COUNT: 'autoColorByCount',
  RESET_COLOR: 'resetColor',

  // spatial
  CUSTOM: 'custom',
  LOAD: 'load',
  ADD: 'add',
  SELECT: 'select',
  SELECT_EXCLUSIVE: 'selectExclusive',
  DESELECT: 'deselect',
  REMOVE: 'remove',
  REMOVE_FEATURE: 'spatial:removeFeature',
  REMOVE_FEATURES: 'spatial:removeFeatures',
  SAVE_FEATURE: 'spatial:updateFeature',
  RESTORE_FEATURE: 'spatial:restoreFeature',
  EXCLUDE: 'exclude',
  ADD_EXCLUDE: 'add_exclude',

  // feature
  FEATURE_INFO: 'featureInfo',

  // filter
  APPLY: 'filter:apply',
  UNAPPLY: 'filter:unapply',
  REMOVE_FILTER: 'filter:remove',

  // import
  IMPORT_FILE: 'importFile',
  IMPORT_URL: 'importUrl',

  // export
  EXPORT: 'export',

  // feature list
  INVERT: 'invert',
  HIDE_SELECTED: 'hideSelected',
  HIDE_UNSELECTED: 'hideUnselected',
  DISPLAY_ALL: 'displayAll',
  REMOVE_UNSELECTED: 'removeUnselected',
  SORT_SELECTED: 'sortSelected'
};
