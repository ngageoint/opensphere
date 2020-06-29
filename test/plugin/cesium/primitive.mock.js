goog.module('test.plugin.cesium.primitive');

goog.require('test.plugin.cesium');

const olcsCore = goog.require('olcs.core');

/**
 * @param {ol.Coordinate} coord
 * @param {string=} opt_imageSrc
 * @return {!Cesium.Billboard}
 */
const createBillboard = (coord, opt_imageSrc) => {
  opt_imageSrc = opt_imageSrc || '/base/images/icons/pushpin/wht-pushpin.png';
  const collection = new Cesium.BillboardCollection();
  const item = collection.add({
    position: olcsCore.ol4326CoordinateToCesiumCartesian(coord),
    image: opt_imageSrc
  });
  collection.remove(item);
  return item;
};

/**
 * @param {ol.Coordinate} coord
 * @param {Cesium.Color=} opt_color
 * @return {!Cesium.PointPrimitive}
 */
const createPointPrimitive = (coord, opt_color) => {
  const collection = new Cesium.PointPrimitiveCollection();
  const item = collection.add({
    position: olcsCore.ol4326CoordinateToCesiumCartesian(coord),
    color: opt_color || Cesium.Color.WHITE
  });
  collection.remove(item);
  return item;
};


/**
 * @param {!ol.Extent} extent
 * @return {!Cesium.Primitive}
 */
const createPrimitive = (extent) => new Cesium.Primitive(createPrimitiveOptions(extent));


/**
 * @param {!ol.Extent} extent
 * @return {!Cesium.GroundPrimitive}
 */
const createGroundPrimitive = (extent) => new Cesium.GroundPrimitive(createPrimitiveOptions(extent));


/**
 * @param {ol.Extent} extent
 * @return {Object}
 */
const createPrimitiveOptions = (extent) => ({
  geometryInstances: new Cesium.GeometryInstance({
    geometry: new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromDegrees.apply(null, extent)
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.WHITE)
    }
  }),
  appearance: new Cesium.PerInstanceColorAppearance({
    flat: true,
    translucent: false
  })
});


/**
 * @param {!Array<!ol.Coordinate>} coords
 * @return {!Cesium.Polyline}
 */
const createPolyline = (coords) => {
  const collection = new Cesium.PolylineCollection();
  const item = collection.add(createPolylineOptions(coords));
  collection.remove(item);
  return item;
};

const createPolylineOptions = (coords) => ({
  positions: coords.map(olcsCore.ol4326CoordinateToCesiumCartesian),
  width: getLineWidth(2)
});


/**
 * @param {!Array<!ol.Coordinate>} coords
 * @return {!Cesium.GroundPolylinePrimitive}
 */
const createGroundPolylinePrimitive = (coords) => {
  return new Cesium.GroundPolylinePrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.GroundPolylineGeometry({
        positions: coords.map(olcsCore.ol4326CoordinateToCesiumCartesian),
        width: getLineWidth(2)
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.WHITE)
      }
    }),
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: false,
      renderState: {
        lineWidth: getLineWidth(2)
      }
    })
  });
};


const getLineWidth = (width) => Math.min(Math.max(2, Cesium.ContextLimits.minimumAliasedLineWidth),
    Cesium.ContextLimits.maximumAliasedLineWidth);

/**
 * @param {string=} opt_text
 * @return {!Cesium.optionsLabelCollection}
 */
const createLabelOptions = (opt_text) => {
  opt_text = opt_text || 'Test Label';
  return {text: opt_text};
};

exports = {
  createBillboard,
  createGroundPrimitive,
  createGroundPolylinePrimitive,
  createLabelOptions,
  createPointPrimitive,
  createPolyline,
  createPrimitive
};
