goog.declareModuleId('os.style.StyleField');


/**
 * @enum {string}
 * @const
 */
const StyleField = {
  ADDITIONAL_LABELS: '_additionalLabels',
  ARROW_SIZE: 'arrowSize',
  ARROW_UNITS: 'arrowUnits',
  CENTER_SHAPE: 'centerShape',
  COLOR: 'color',
  FILL: 'fill',
  FILL_COLOR: 'fillColor',
  FILL_OPACITY: 'fillOpacity',
  ICON: 'icon',
  IMAGE: 'image',
  LABELS: 'labels',
  LABEL_COLOR: 'labelColor',
  LABEL_GEOMETRY: '_labelGeometry',
  LABEL_SIZE: 'labelSize',
  LAST_SHOW_LABELS: '_lastShowLabels',
  LINE_DASH: 'lineDash',
  LOB_BEARING_COLUMN: 'lobBearingColumn',
  LOB_BEARING_ERROR: 'lobBearingError',
  LOB_BEARING_ERROR_COLUMN: 'lobBearingErrorColumn',
  LOB_COLUMN_LENGTH: 'lobColumnLength',
  LOB_LENGTH: 'lobLength',
  LOB_LENGTH_TYPE: 'lobLengthType',
  LOB_LENGTH_COLUMN: 'lobLengthColumn',
  LOB_LENGTH_UNITS: 'lobLengthUnits',
  LOB_LENGTH_ERROR: 'lobLengthError',
  LOB_LENGTH_ERROR_COLUMN: 'lobLengthErrorColumn',
  LOB_LENGTH_ERROR_UNITS: 'lobLengthErrorUnits',
  OPACITY: 'opacity',
  REPLACE_STYLE: 'replaceStyle',
  SHAPE: 'shape',
  SHOW_ARROW: 'showArrow',
  SHOW_ELLIPSE: 'showEllipse',
  SHOW_ERROR: 'showError',
  SHOW_ELLIPSOIDS: 'showEllipsoids',
  SHOW_GROUND_REF: 'showGroundRef',
  SHOW_LABELS: 'showLabels',
  SHOW_LABEL_COLUMNS: 'showLabelColumns',
  SHOW_ROTATION: 'showRotation',
  ROTATION_COLUMN: 'rotationColumn',
  SIZE: 'size',
  SKIP_LAYER_STYLE: 'skipLayerStyle',
  STROKE: 'stroke',
  STYLE_URL: 'styleUrl'
};

/**
 * @type {RegExp}
 */
StyleField.REGEXP = (function() {
  var values = Object.values(StyleField);
  for (var i = 0, n = values.length; i < n; i++) {
    values[i] = '(' + values[i] + ')';
  }

  // anything that starts with an undersos, or matches one of the record fields
  return new RegExp('^(_.*|' + values.join('|') + ')$');
})();

export default StyleField;
