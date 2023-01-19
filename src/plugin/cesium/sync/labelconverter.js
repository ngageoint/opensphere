goog.declareModuleId('plugin.cesium.sync.LabelConverter');

import {getCenter} from 'ol/src/extent.js';
import Geometry from 'ol/src/geom/Geometry.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import SimpleGeometry from 'ol/src/geom/SimpleGeometry.js';
import olcsCore from 'ol-cesium/src/olcs/core.js';

import {getFont} from '../../../os/style/label.js';
import {GeometryInstanceId} from '../cesium.js';
import {isPrimitiveShown} from '../primitive.js';
import BaseConverter from './baseconverter.js';
import {getTransformFunction} from './gettransformfunction.js';
import {getHeightReference} from './heightreference.js';
import {getColor, getLineWidthFromStyle} from './style.js';

const asserts = goog.require('goog.asserts');


/**
 * Converter for Label styles
 */
export default class LabelConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  retrieve(feature, geometry, style, context) {
    return context.getLabelForGeometry(geometry);
  }


  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    if (style.getText()) {
      const options = /** @type {!Cesium.optionsLabelCollection} */ ({});
      this.update(feature, geometry, style, context, /** @type {!Cesium.Label} */ (options));
      context.addLabel(options, feature, geometry);
      return true;
    }

    return false;
  }


  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, label) {
    const isLabelInstance = label instanceof Cesium.Label;

    if (isLabelInstance && label.isDestroyed()) {
      return false;
    }

    const geom = style.getGeometry();
    if (geom instanceof Geometry) {
      geometry = /** @type {!Geometry} */ (geom);
    }

    const textStyle = style.getText();

    updatePosition(label, geometry);
    label.heightReference = getHeightReference(context.layer, feature, geometry);
    updateFillAndOutline(label, textStyle, context);
    updateHorizontalOrigin(label, textStyle);
    updateVerticalOrigin(label, textStyle);
    updateText(label, textStyle);

    label.font = textStyle.getFont() || getFont();
    label.pixelOffset = new Cesium.Cartesian2(textStyle.getOffsetX(), textStyle.getOffsetY());

    // check if there is an associated primitive, and if it is shown
    const prim = context.getPrimitiveForGeometry(geometry);
    if (prim) {
      label.show = isPrimitiveShown(prim);
    }

    label.eyeOffset = context.labelEyeOffset;

    if (isLabelInstance) {
      // mark as updated so it isn't deleted
      label.dirty = false;
    }

    return true;
  }
}


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

      if (geometry instanceof SimpleGeometry) {
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
 * @type {!Array<number>}
 */
const scratchCoord = [];

/**
 * Get the label position for a geometry.
 *
 * @param {!Geometry} geometry The geometry.
 * @return {Array<number>} The position to use for the label.
 */
const getLabelPosition = (geometry) => {
  const geometryType = geometry.getType();
  switch (geometryType) {
    case GeometryType.POINT:
    case GeometryType.MULTI_POINT:
      const geom = /** @type {Point|MultiPoint} */ (geometry);
      const flats = geom.getFlatCoordinates();
      const stride = geom.getStride();

      for (let i = 0, n = stride; i < n; i++) {
        scratchCoord[i] = flats[i];
      }

      return scratchCoord;
    default:
      return getCenter(geometry.getExtent());
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
  if (textAlign) {
    if (textAlign in textAlignMap) {
      label.horizontalOrigin = textAlignMap[textAlign];
    } else {
      asserts.fail('unhandled text align ' + textAlign);
    }
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

  if (textBaseline) {
    if (textBaseline in textBaselineMap) {
      label.verticalOrigin = textBaselineMap[textBaseline];
    } else {
      asserts.fail('unhandled baseline ' + textBaseline);
    }
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
