goog.module('plugin.cesium.sync.MultiPolygonConverter');

const {deletePrimitive, getPrimitive} = goog.require('plugin.cesium.primitive');
const {createPolygon} = goog.require('plugin.cesium.sync.polygon');
const PolygonConverter = goog.require('plugin.cesium.sync.PolygonConverter');

const Feature = goog.requireType('ol.Feature');
const MultiPolygon = goog.requireType('ol.geom.MultiPolygon');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');
const {CreateFunction, UpdateFunction, Converter} = goog.requireType('plugin.cesium.sync.ConverterTypes');


/**
 * @type {CreateFunction}
 */
const create = (feature, geometry, style, context) => {
  const primitives = new Cesium.PrimitiveCollection();
  createMultiPolygon(feature, geometry, style, context, primitives);

  if (primitives.length) {
    context.addPrimitive(primitives, feature, geometry);
    return true;
  }

  return false;
};


/**
 * @param {!Feature} feature
 * @param {!MultiPolygon} multipoly
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Cesium.PrimitiveCollection} primitives
 */
const createMultiPolygon = (feature, multipoly, style, context, primitives) => {
  const polyFlats = multipoly.getFlatCoordinates();
  const polyEnds = multipoly.getEndss();

  const extrudes = /** @type {Array<boolean>|undefined} */ (multipoly.get('extrude'));
  let offset = 0;

  for (let i = 0, ii = polyEnds.length; i < ii; i++) {
    const ringEnds = polyEnds[i];
    const extrude = extrudes && extrudes.length === polyEnds.length ? extrudes[i] : false;

    const poly = createPolygon(feature, multipoly, style, context, polyFlats, offset,
        ringEnds, extrude, i);

    if (poly) {
      primitives.add(poly);
    }

    offset = ringEnds[ringEnds.length - 1];
  }
};


/**
 * @type {UpdateFunction}
 */
const update = (feature, geometry, style, context, primitive) => {
  for (let i = 0, n = primitive.length; i < n; i++) {
    if (!PolygonConverter.update(feature, geometry, style, context, primitive.get(i))) {
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
