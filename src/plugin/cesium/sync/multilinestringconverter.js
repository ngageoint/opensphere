goog.module('plugin.cesium.sync.MultiLineStringConverter');

const {deletePrimitive, getPrimitive, updatePrimitive} = goog.require('plugin.cesium.primitive');
const {createLineStringPrimitive, isGeometryDirty, isLineWidthChanging, isDashChanging} =
  goog.require('plugin.cesium.sync.linestring');

const Feature = goog.requireType('ol.Feature');
const MultiLineString = goog.requireType('ol.geom.MultiLineString');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');
const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');


/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const primitives = new Cesium.PrimitiveCollection();
  createMultiLineString(feature, geometry, style, context, primitives);

  if (primitives.length) {
    context.addPrimitive(primitives, feature, geometry);
    return true;
  }

  return false;
};


/**
 * @param {!Feature} feature
 * @param {!MultiLineString} multiLine
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Cesium.PrimitiveCollection} primitives
 */
const createMultiLineString = (feature, multiLine, style, context, primitives) => {
  const lineFlats = multiLine.getFlatCoordinates();
  const lineEnds = multiLine.getEnds();

  let offset = 0;

  for (let i = 0, ii = lineEnds.length; i < ii; i++) {
    const lineEnd = lineEnds[i];
    const line = createLineStringPrimitive(feature, multiLine, style, context, lineFlats, offset, lineEnd, i);

    if (line) {
      primitives.add(line);
      primitives['olLineWidth'] = line['olLineWidth'];
    }

    offset = lineEnd;
  }
};


/**
 * @type {UpdateFunction}
 */
const update = (feature, geometry, style, context, primitive) => {
  if (isGeometryDirty(geometry) ||
      isLineWidthChanging(primitive, style) ||
      isDashChanging(primitive, style)) {
    return false;
  }

  for (let i = 0, n = primitive.length; i < n; i++) {
    if (!updatePrimitive(feature, geometry, style, context, primitive.get(i))) {
      return false;
    }
  }

  primitive.dirty = false;
  return true;
};


/**
 * @type {Converter}
 */
exports = {
  create,
  retrieve: getPrimitive,
  update,
  delete: deletePrimitive
};
