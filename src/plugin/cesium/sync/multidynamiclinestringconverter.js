goog.module('plugin.cesium.sync.MultiDynamicLineStringConverter');

const {deletePrimitive, getPrimitive, shouldUpdatePrimitive} = goog.require('plugin.cesium.primitive');
const {createPolyline, updatePolyline} = goog.require('plugin.cesium.sync.DynamicLineString');

const Feature = goog.requireType('ol.Feature');
const MultiLineString = goog.requireType('ol.geom.MultiLineString');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');
const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');


/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const primitives = new Cesium.PolylineCollection();
  createOrUpdateDynamicMultiLineString(feature, geometry, style, context, primitives);

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
 * @param {!Cesium.PolylineCollection} primitives
 */
const createOrUpdateDynamicMultiLineString = (feature, multiLine, style, context, primitives) => {
  const lineFlats = multiLine.getFlatCoordinates();
  const lineEnds = multiLine.getEnds();

  let offset = 0;

  for (let i = 0, ii = lineEnds.length; i < ii; i++) {
    const lineEnd = lineEnds[i];

    let line;
    if (i < primitives.length) {
      line = primitives.get(i);
    }

    if (!line) {
      line = createPolyline(feature, multiLine, style, context, lineFlats, offset, lineEnd);

      if (line) {
        primitives.add(line);
      }
    } else {
      updatePolyline(feature, multiLine, style, context, line, lineFlats, offset, lineEnd);
    }

    offset = lineEnd;
  }

  while (lineEnds.length < primitives.length) {
    primitives.remove(primitives.get(primitives.length - 1));
  }
};


/**
 * @type {UpdateFunction}
 */
const update = (feature, geometry, style, context, primitive) => {
  if (!shouldUpdatePrimitive(feature, geometry, style, context, primitive)) {
    return false;
  }

  createOrUpdateDynamicMultiLineString(feature, geometry, style, context, primitive);
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
