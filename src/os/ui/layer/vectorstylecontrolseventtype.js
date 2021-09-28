goog.declareModuleId('os.ui.layer.VectorStyleControlsEventType');

/**
 * @enum {string}
 */
const VectorStyleControlsEventType = {
  LINE_DASH_CHANGE: 'vector:lineDashChange',
  SHAPE_CHANGE: 'vector:shapeChange',
  CENTER_SHAPE_CHANGE: 'vector:centerShapeChange',
  SHOW_ROTATION_CHANGE: 'vector:showRotationChange',
  ROTATION_COLUMN_CHANGE: 'vector:rotationColumnChange',
  ELLIPSE_COLUMN_CHANGE: 'vector:ellipseColumnsChange'
};

export default VectorStyleControlsEventType;
