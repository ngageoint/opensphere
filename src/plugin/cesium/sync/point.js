goog.module('plugin.cesium.sync.point');


const olcsCore = goog.require('olcs.core');
const {getHeightReference} = goog.require('plugin.cesium.sync.HeightReference');
const getTransformFunction = goog.require('plugin.cesium.sync.getTransformFunction');
const {drawShape} = goog.require('plugin.cesium.sync.shape');
const OLIconStyle = goog.require('ol.style.Icon');
const OLRegularShape = goog.require('ol.style.RegularShape');

const Feature = goog.requireType('ol.Feature');
const MultiPoint = goog.requireType('ol.geom.MultiPoint');
const OLImageStyle = goog.requireType('ol.style.Image');
const Point = goog.requireType('ol.geom.Point');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


/**
 * Create a Cesium Billboard from an OpenLayers image style.
 *
 * @param {!Feature} feature
 * @param {!(Point|MultiPoint)} geometry
 * @param {!OLImageStyle} style
 * @param {!VectorContext} context
 * @param {Array<number>=} opt_flatCoords
 * @param {number=} opt_offset
 * @param {number=} opt_index
 * @return {Cesium.optionsBillboardCollectionAdd}
 */
const createBillboard = (feature, geometry, style, context, opt_flatCoords, opt_offset, opt_index) => {
  const show = context.isFeatureShown(feature);
  const isIcon = style instanceof OLIconStyle;
  const distanceScalar = isIcon ? getDistanceScalar() : undefined;

  const options = /** @type {!Cesium.optionsBillboardCollectionAdd} */ ({
    pixelOffsetScaleByDistance: distanceScalar,
    scaleByDistance: distanceScalar,
    show: show
  });

  updateBillboard(feature, geometry, style, context, options, opt_flatCoords, opt_offset, opt_index);
  return options;
};


/**
 * Update a Cesium Billboard from an OpenLayers image style.
 *
 * @param {!Feature} feature
 * @param {!(Point|MultiPoint)} geometry
 * @param {!OLImageStyle} style
 * @param {!VectorContext} context
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 * @param {Array<number>=} opt_flatCoords
 * @param {number=} opt_offset
 * @param {number=} opt_index
 */
const updateBillboard = (feature, geometry, style, context, bb, opt_flatCoords, opt_offset, opt_index) => {
  // rotate on z-axis, so rotation references the cardinal direction.
  // note: Cesium doesn't handle this well when the camera is rotated more than +/- 90 degrees from north.
  bb.alignedAxis = Cesium.Cartesian3.UNIT_Z;

  bb.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
  bb.verticalOrigin = Cesium.VerticalOrigin.CENTER;

  const scale = style.getScale();
  bb.scale = scale != null ? scale : 1.0;
  bb.rotation = -style.getRotation() || 0;

  updateGeometry(geometry, bb, opt_flatCoords, opt_offset);
  updateImage(feature, geometry, style, context, bb, opt_index);
  updateColorAlpha(style, context, bb);

  bb.heightReference = getHeightReference(context.layer, feature, geometry, opt_index);

  if (bb instanceof Cesium.Billboard) {
    // mark as updated so it isn't deleted
    bb.dirty = false;
  }
};


/**
 * @type {ol.Coordinate}
 * @const
 */
const scratchCoord1 = [];


/**
 * @type {ol.Coordinate}
 * @const
 */
const scratchCoord2 = [];


/**
 * @param {!(Point|MultiPoint)} geometry
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 * @param {Array<number>=} opt_flatCoords
 * @param {number=} opt_offset
 */
const updateGeometry = (geometry, bb, opt_flatCoords, opt_offset) => {
  const geomRevision = geometry.getRevision();
  if (!bb.geomRevision || bb.geomRevision != geomRevision) {
    const flats = opt_flatCoords || geometry.getFlatCoordinates();
    const offset = opt_offset || 0;
    const stride = geometry.stride;
    let coord = scratchCoord1;
    coord.length = stride;

    for (let j = 0; j < stride; j++) {
      coord[j] = flats[offset + j];
    }

    const transform = getTransformFunction();
    if (transform) {
      coord = transform(coord, scratchCoord2, coord.length);
    }

    bb.position = olcsCore.ol4326CoordinateToCesiumCartesian(coord);
    bb.geomRevision = geomRevision;
  }
};


/**
 * @param {!Feature} feature
 * @param {!(Point|MultiPoint)} geometry
 * @param {!OLImageStyle} style
 * @param {!VectorContext} context
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 * @param {number=} opt_index
 */
const updateImage = (feature, geometry, style, context, bb, opt_index) => {
  if (style instanceof OLIconStyle) {
    updateImageIcon(geometry, style, context, bb, opt_index);
  } else if (style instanceof OLRegularShape) {
    updateImageShape(style, bb);
  } else {
    updateImageDefault(style, bb);
  }
};


/**
 *  Cesium should load icons directly instead of reusing the canvas from Openlayers. if the canvas is reused, each
 *  variation (color, scale, rotation, etc) of the same icon will be added to Cesium's texture atlas. this uses
 *  more memory than necessary, and is far more likely to hit the size limit for the atlas.
 *
 * @param {!(Point|MultiPoint)} geometry
 * @param {!OLIconStyle} style
 * @param {!VectorContext} context
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 * @param {number=} opt_index
 */
const updateImageIcon = (geometry, style, context, bb, opt_index) => {
  const imageId = style.getSrc();

  if (imageId && imageId != bb.imageId && imageId != bb._imageId) {
    const image = iconStyleToImagePromise(geometry, style, context, bb, opt_index);
    updateBillboardImage(bb, imageId, image);
  }

  const styleColor = style.getColor();
  if (styleColor) {
    bb.color = olcsCore.convertColorToCesium(styleColor);
  }

  updateSizeDynamicIconProperties(style, bb);
};


/**
 * @param {!OLRegularShape} style
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 */
const updateImageShape = (style, bb) => {
  const stroke = style.getStroke();
  const fill = style.getFill();

  let hash = stroke ? stroke['id'] : 1;
  hash = 31 * hash + (fill ? 1 : 0) >>> 0;
  hash = 31 * hash + style.getPoints() >>> 0;
  hash = 31 * hash + style.getRadius() >>> 0;
  hash = 31 * hash + goog.string.hashCode(style.getAngle().toString()) >>> 0;

  const imageId = hash.toString();
  if (imageId && imageId != bb.imageId && imageId != bb._imageId) {
    updateBillboardImage(bb, imageId, (id) => drawShape(style));
  }

  const color = fill ? fill.getColor() :
    stroke ? stroke.getColor() : null;

  if (color) {
    bb.color = olcsCore.convertColorToCesium(color);
  }
};


/**
 * The default is to use the style's image directly. This is more expensive in the texture atlas but at least
 * something will display if no better method could be used.
 *
 * @param {!OLImageStyle} style
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 */
const updateImageDefault = (style, bb) => {
  const image = style.getImage(1);
  const imageId = style['id'] || ol.getUid(image);

  if (image && imageId != bb.imageId && imageId != bb._imageId) {
    updateBillboardImage(bb, imageId, image);
  }

  // the color is already rendered in the original image
  bb.color = bb.color || new Cesium.Color(1.0, 1.0, 1.0, 1.0);
};


/**
 * @param {!OLImageStyle} style
 * @param {!VectorContext} context
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 */
const updateColorAlpha = (style, context, bb) => {
  bb.color.alpha = context.layer.getOpacity();
  const opacity = style.getOpacity();
  if (opacity != null) {
    bb.color.alpha *= opacity;
  }
};


/**
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 * @param {!string} imageId
 * @param {Cesium.ImageLike|Promise<Cesium.ImageLike>|function(string=):Cesium.ImageLike} image
 */
const updateBillboardImage = (bb, imageId, image) => {
  if (bb instanceof Cesium.Billboard) {
    bb.setImage(imageId, image);
    bb.pixelOffset.x = 0;
    bb.pixelOffset.y = 0;
  } else {
    bb.image = image;
    bb.imageId = imageId;
    bb.pixelOffset = bb.pixelOffset || new Cesium.Cartesian2(0, 0);
  }
};


/**
 * @type {Cesium.NearFarScalar}
 */
let distanceScalar = null;


/**
 * @return {Cesium.NearFarScalar}
 */
const getDistanceScalar = () => {
  if (!distanceScalar) {
    // this sets up the constant after Cesium is initialized
    distanceScalar = new Cesium.NearFarScalar(
        os.map.ZoomScale.NEAR, os.map.ZoomScale.NEAR_SCALE,
        os.map.ZoomScale.FAR, os.map.ZoomScale.FAR_SCALE);
  }
  return distanceScalar;
};


/**
 * Some items like anchor, normalized scale, and pixel offset are not
 * available on the style until after the size is known.
 *
 * @param {OLIconStyle} style
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 */
const updateSizeDynamicIconProperties = (style, bb) => {
  bb.scale = style.getScale();
  bb.pixelOffset = bb.pixelOffset || new Cesium.Cartesian2(0, 0);

  const anchor = style.getAnchor();
  const size = style.getSize();

  if (anchor && size) {
    // if we know the anchor and size, compute the pixel offset directly
    bb.pixelOffset.x = Math.round(bb.scale * (size[0] - anchor[0]));
    bb.horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;

    bb.pixelOffset.y = Math.round(bb.scale * (size[1] - anchor[1]));
    bb.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
  }
};


/**
 *
 * @param {!(Point|MultiPoint)} geometry
 * @param {!OLIconStyle} style
 * @param {!VectorContext} context
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 * @param {number=} opt_index
 * @return {!Promise<HTMLCanvasElement>}
 */
const iconStyleToImagePromise = (geometry, style, context, bb, opt_index) => {
  bb.dirty = false;

  const originalShow = bb.show;
  bb.show = false;

  const src = style.getSrc() || '';
  const resource = Cesium.Resource.createIfNeeded(src);
  return resource.fetchImage().then((image) => {
    const billboard = getBillboardFromContext(geometry, context, opt_index);
    if (billboard) {
      updateSizeDynamicIconProperties(style, billboard);
    }

    bb.show = originalShow;
    return image;
  });
};


/**
 * @param {!(Point|MultiPoint)} geometry
 * @param {VectorContext} context
 * @param {number=} opt_index
 * @return {Cesium.Billboard}
 */
const getBillboardFromContext = (geometry, context, opt_index) => {
  let primitive = context.getPrimitiveForGeometry(geometry);
  if (primitive) {
    if (primitive instanceof Cesium.BillboardCollection) {
      if (opt_index != null && opt_index < primitive.length) {
        primitive = primitive.get(opt_index);
      }
    }
  }

  return /** @type {Cesium.Billboard} */ (primitive);
};


exports = {
  createBillboard,
  updateBillboard
};
