goog.declareModuleId('plugin.cesium.sync.point');

import OLIconStyle from 'ol/src/style/Icon.js';
import OLRegularShape from 'ol/src/style/RegularShape.js';
import {getUid} from 'ol/src/util.js';
import olcsCore from 'ol-cesium/src/olcs/core.js';

import {ZoomScale} from '../../../os/map/map.js';
import OSIconStyle from '../../../os/style/iconstyle.js';
import {getTransformFunction} from './gettransformfunction.js';
import {getHeightReference} from './heightreference.js';
import {drawShape} from './shape.js';

const {hashCode} = goog.require('goog.string');

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
export const createBillboard = (feature, geometry, style, context, opt_flatCoords, opt_offset, opt_index) => {
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
export const updateBillboard = (feature, geometry, style, context, bb, opt_flatCoords, opt_offset, opt_index) => {
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
  bb.color = olcsCore.convertColorToCesium(styleColor || 'white');

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
  hash = 31 * hash + hashCode(style.getAngle().toString()) >>> 0;

  const imageId = hash.toString();
  if (imageId && imageId != bb.imageId && imageId != bb._imageId) {
    updateBillboardImage(bb, imageId, (id) => drawShape(style));
  }

  const color = fill ? fill.getColor() :
    stroke ? stroke.getColor() : null;

  bb.color = olcsCore.convertColorToCesium(color || 'white');
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
  const imageId = style['id'] || getUid(image);

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
  bb.color = bb.color || new Cesium.Color(1, 1, 1, 1);
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
 * @param {!Cesium.Billboard} bb
 * @param {OLImageStyle} style
 */
export const updateStyleAfterLoad = (bb, style) => {
  if (style instanceof OLIconStyle) {
    if (bb._imageIndexPromise) {
      bb._imageIndexPromise.then(() => updateStyleAfterLoad(bb, style));
    } else if (bb._imageWidth && bb._imageHeight) {
      updateStyleFromSize(style, bb._imageWidth, bb._imageHeight);
      updateSizeDynamicIconProperties(style, bb);
    }
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
        ZoomScale.NEAR, ZoomScale.NEAR_SCALE,
        ZoomScale.FAR, ZoomScale.FAR_SCALE);
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
 * Map of icon src to Promise created with Cesium.Resource.fetchImage.
 * @type {!Object<string, !Promise<Cesium.ImageLike>>}
 */
const iconPromises = {};


/**
 *
 * @param {!(Point|MultiPoint)} geometry
 * @param {!OLIconStyle} style
 * @param {!VectorContext} context
 * @param {!(Cesium.Billboard|Cesium.optionsBillboardCollectionAdd)} bb
 * @param {number=} opt_index
 * @return {Promise<Cesium.ImageLike>}
 */
const iconStyleToImagePromise = (geometry, style, context, bb, opt_index) => {
  bb.dirty = false;
  const src = style.getSrc() || '';
  let iconPromise = iconPromises[src];
  if (!iconPromise) {
    const resource = new Cesium.Resource(src);
    iconPromise = resource.fetchImage();

    if (iconPromise) {
      iconPromises[src] = iconPromise;
    }
  }
  return iconPromise || null;
};


/**
 * @param {!OLIconStyle} style
 * @param {number} width
 * @param {number} height
 * @suppress {accessControls}
 */
const updateStyleFromSize = (style, width, height) => {
  if (!style.size_) {
    const size = [width, height];
    if (style instanceof OSIconStyle) {
      /** @type {OSIconStyle} */ (style).setSize(size);
    } else {
      style.normalizedAnchor_ = null;
      style.size_ = size;
    }
  }
};
