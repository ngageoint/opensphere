goog.declareModuleId('plugin.cesium.sync.MultiDynamicLineStringConverter');

import BaseConverter from './baseconverter.js';
import {createOrUpdateSegment} from './dynamiclinestring.js';

const Feature = goog.requireType('ol.Feature');
const MultiLineString = goog.requireType('ol.geom.MultiLineString');
const Style = goog.requireType('ol.style.Style');
const {default: VectorContext} = goog.requireType('plugin.cesium.VectorContext');


/**
 * Converter for DynamicFeature instances with MultiLineStrings
 */
export default class MultiDynamicLineStringConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    createOrUpdateDynamicMultiLineString(feature, geometry, style, context);
    return true;
  }

  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    createOrUpdateDynamicMultiLineString(feature, geometry, style, context, primitive);
    primitive.dirty = false;
    return true;
  }
}


/**
 * @param {!Feature} feature
 * @param {!MultiLineString} multiLine
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Array<!Cesium.Polyline>=} opt_primitives
 */
const createOrUpdateDynamicMultiLineString = (feature, multiLine, style, context, opt_primitives) => {
  const lineFlats = multiLine.getFlatCoordinates();
  const lineEnds = multiLine.getEnds();

  let offset = 0;

  lineEnds.forEach((end, i) => {
    createOrUpdateSegment(i, feature, multiLine, style, context, lineFlats, offset, end, opt_primitives);
    offset = end;
  });
};
