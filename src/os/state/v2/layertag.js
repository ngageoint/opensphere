goog.module('os.state.v2.LayerTag');


/**
 * XML tags for layer state
 * @enum {string}
 */
exports = {
  BFS: 'basicFeatureStyle',
  COLOR: 'color',
  CONTRAST: 'contrast',
  DATA_PROVIDER: 'dataProvider',
  LABEL_COLUMN: 'labelColumn',
  LABEL_COLUMNS: 'labelColumns',
  LABEL: 'label',
  LABEL_COLOR: 'labelColor',
  LABEL_SIZE: 'labelSize',
  MAP_URL: 'getMapUrl',
  MAPPINGS: 'mappings',
  PARAMS: 'params',
  PROVIDER_TYPE: 'provider',
  PT_COLOR: 'pointColor',
  PT_OPACITY: 'pointOpacity',
  PT_SIZE: 'pointSize',
  TITLE: 'title',
  SHOW_LABELS: 'showLabels',
  STYLES: 'styles',
  TAGS: 'tags',
  REFRESH_RATE: 'refreshRate',
  // support both opacity and alpha
  OPACITY: 'opacity',
  ALPHA: 'alpha'
};
