goog.module('plugin.cesium.sync.LabelConverter');

goog.require('goog.asserts');
goog.require('goog.string');

const {GeometryInstanceId} = goog.require('plugin.cesium');
const {getColor, getLineWidthFromStyle} = goog.require('plugin.cesium.sync.style');
const {getHeightReference} = goog.require('plugin.cesium.sync.HeightReference');
const getTransformFunction = goog.require('plugin.cesium.sync.getTransformFunction');
const {deletePrimitive, isPrimitiveShown} = goog.require('plugin.cesium.primitive');
const olcsCore = goog.require('olcs.core');

const {CreateFunction, RetrieveFunction, UpdateFunction, Converter} =
  goog.requireType('plugin.cesium.sync.ConverterTypes');
const Geometry = goog.requireType('ol.geom.Geometry');
const Text = goog.requireType('ol.style.Text');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


/**
 * @type {RetrieveFunction}
 */
const getLabel = (feature, geometry, style, context) => {
  return context.getLabelForGeometry(geometry);
};


/**
 * @type {CreateFunction}
 */
const createLabel = (feature, geometry, style, context) => {
  if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(style.getText()))) {
    const options = /** @type {!Cesium.optionsLabelCollection} */ ({});
    updateLabel(feature, geometry, style, context, /** @type {!Cesium.Label} */ (options));
    context.addLabel(options, feature, geometry);
    return true;
  }

  return false;
};


/**
 * @type {UpdateFunction}
 */
const updateLabel = (feature, geometry, style, context, label) => {
  const geom = style.getGeometry();
  if (geom instanceof ol.geom.Geometry) {
    geometry = /** @type {!ol.geom.Geometry} */ (geom);
  }

  const textStyle = style.getText();

  updatePosition(label, geometry);
  label.heightReference = getHeightReference(context.layer, feature, geometry);
  updateFillAndOutline(label, textStyle, context);
  updateHorizontalOrigin(label, textStyle);
  updateVerticalOrigin(label, textStyle);
  updateText(label, textStyle);

  label.font = textStyle.getFont() || os.style.label.getFont();
  label.pixelOffset = new Cesium.Cartesian2(textStyle.getOffsetX(), textStyle.getOffsetY());

  // check if there is an associated primitive, and if it is shown
  const prim = context.getPrimitiveForGeometry(geometry);
  if (prim) {
    label.show = isPrimitiveShown(prim);
  }

  if (context.scene) {
    label.eyeOffset = context.labelEyeOffset;
  }

  if (label instanceof Cesium.Label) {
    // mark as updated so it isn't deleted
    label.dirty = false;
  }

  return true;
};


/**
 * @param {!Cesium.Label} label
 * @param {Geometry} geometry
 */
const updatePosition = (label, geometry) => {
  // update the position if the geometry changed
  const geomRevision = geometry.getRevision();
  if (label.geomRevision !== geomRevision) {
    // TODO: export and use the text draw position from OL3. see src/ol/render/vector.js
    const transform = getTransformFunction();

    let labelPosition = getLabelPosition(geometry);
    if (labelPosition) {
      if (transform) {
        labelPosition = transform(labelPosition);
      }

      if (geometry instanceof ol.geom.SimpleGeometry) {
        let first = geometry.getFirstCoordinate();
        if (transform) {
          first = transform(first, undefined, first.length);
        }

        labelPosition[2] = first[2] || 0.0;
      }

      label.position = olcsCore.ol4326CoordinateToCesiumCartesian(labelPosition);
      label.geomRevision = geomRevision;
    }
  }
};


/**
 * Get the label position for a geometry.
 *
 * @param {!ol.geom.Geometry} geometry The geometry.
 * @return {Array<number>} The position to use for the label.
 */
const getLabelPosition = (geometry) => {
  const geometryType = geometry.getType();
  switch (geometryType) {
    case ol.geom.GeometryType.POINT:
      return /** @type {!ol.geom.Point} */ (geometry).getFlatCoordinates().slice();
    case ol.geom.GeometryType.MULTI_POINT:
      return /** @type {!ol.geom.MultiPoint} */ (geometry).getFlatCoordinates().slice(0, 2);
    default:
      return ol.extent.getCenter(geometry.getExtent());
  }
};


/**
 * @param {!Cesium.Label} label
 * @param {Text} textStyle
 * @param {VectorContext} context
 */
const updateFillAndOutline = (label, textStyle, context) => {
  let labelStyle = undefined;
  const layerOpacity = context.layer.getOpacity();

  if (textStyle.getFill()) {
    label.fillColor = getColor(textStyle, context, GeometryInstanceId.GEOM);
    label.fillColor.alpha *= layerOpacity;
    labelStyle = Cesium.LabelStyle.FILL;
  }
  if (textStyle.getStroke()) {
    label.outlineWidth = getLineWidthFromStyle(textStyle);
    label.outlineColor = getColor(textStyle, context, GeometryInstanceId.GEOM_OUTLINE);
    label.outlineColor.alpha *= layerOpacity;
    labelStyle = Cesium.LabelStyle.OUTLINE;
  }
  if (textStyle.getFill() && textStyle.getStroke()) {
    labelStyle = Cesium.LabelStyle.FILL_AND_OUTLINE;
  }
  if (labelStyle) {
    label.style = labelStyle;
  }
};


/**
 * @type {?Object<?string|undefined, Cesium.HorizontalOrigin>}
 */
let textAlignMap = null;


/**
 * @return {Object<?string|undefined, Cesium.HorizontalOrigin>}
 */
const getTextAlignMap = () => {
  if (!textAlignMap) {
    textAlignMap = {
      'center': Cesium.HorizontalOrigin.CENTER,
      'left': Cesium.HorizontalOrigin.LEFT,
      'right': Cesium.HorizontalOrigin.RIGHT
    };
  }
  return textAlignMap;
};


/**
 * @param {!Cesium.Label} label
 * @param {Text} textStyle
 */
const updateHorizontalOrigin = (label, textStyle) => {
  const textAlign = textStyle.getTextAlign();
  const textAlignMap = getTextAlignMap();
  if (textAlign in textAlignMap) {
    label.horizontalOrigin = textAlignMap[textAlign];
  } else {
    goog.asserts.fail('unhandled text align ' + textAlign);
  }
};


/**
 * @type {?Object<?string|undefined, Cesium.VerticalOrigin>}
 */
let textBaselineMap = null;


/**
 * @return {Object<?string|undefined, Cesium.VerticalOrigin>}
 */
const getTextBaselineMap = () => {
  if (!textBaselineMap) {
    textBaselineMap = {
      'top': Cesium.VerticalOrigin.TOP,
      'middle': Cesium.VerticalOrigin.CENTER,
      'bottom': Cesium.VerticalOrigin.BOTTOM,
      'alphabetic': Cesium.VerticalOrigin.TOP,
      'hanging': Cesium.VerticalOrigin.BOTTOM
    };
  }
  return textBaselineMap;
};


/**
 * @param {!Cesium.Label} label
 * @param {Text} textStyle
 */
const updateVerticalOrigin = (label, textStyle) => {
  const textBaseline = textStyle.getTextBaseline();
  const textBaselineMap = getTextBaselineMap();
  if (textBaseline in textBaselineMap) {
    label.verticalOrigin = textBaselineMap[textBaseline];
  } else {
    goog.asserts.fail('unhandled baseline ' + textBaseline);
  }
};


/**
 * @param {!Cesium.Label} label
 * @param {Text} textStyle
 */
const updateText = (label, textStyle) => {
  //
  // Replace characters that may throw Cesium into an infinite loop.
  //
  // Details:
  // Cesium replaces the Canvas2D measureText function with a third party library. Cesium doesn't account for Unicode
  // characters in labels and may pass character codes to the library that will result in an infinite loop when
  // measured.
  //
  // This removes characters outside the ASCII printable range to prevent that behavior.
  const labelText = textStyle.getText() || '';
  label.text = labelText.replace(/[^\x0a\x0d\x20-\x7e\xa0-\xff]/g, '');
};


/**
 * @type {Converter}
 */
exports = {
  create: createLabel,
  retrieve: getLabel,
  update: updateLabel,
  delete: deletePrimitive
};
