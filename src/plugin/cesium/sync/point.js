goog.module('plugin.cesium.sync.point');


const olcsCore = goog.require('olcs.core');
const {getHeightReference} = goog.require('plugin.cesium.sync.HeightReference');
const getTransformFunction = goog.require('plugin.cesium.sync.getTransformFunction');
const OLIconStyle = goog.require('ol.style.Icon');

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
  // update the position if the geometry changed
  const layer = context.layer;
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

  let imageId;
  let image;
  let iconColor;

  if (style instanceof OLIconStyle) {
    //
    // Cesium should load icons directly instead of reusing the canvas from Openlayers. if the canvas is reused, each
    // variation (color, scale, rotation, etc) of the same icon will be added to Cesium's texture atlas. this uses
    // more memory than necessary, and is far more likely to hit the size limit for the atlas.
    //
    image = imageId = style.getSrc() || undefined;

    const styleColor = style.getColor();
    if (styleColor) {
      iconColor = olcsCore.convertColorToCesium(styleColor);
    }
  } else {
    image = style.getImage(1);

    // Cesium uses the imageId to identify a texture in the WebGL texture atlas. this *must* be unique to the texture
    // being displayed, but we want as much reuse as possible. we'll try:
    //  - The style id that we use to cache OL3 styles
    //  - Fall back on the UID of the image/canvas
    imageId = style['id'] || ol.getUid(image);
  }

  if (typeof image === 'string' || image instanceof HTMLCanvasElement || image instanceof Image ||
      image instanceof HTMLImageElement) {
    if (bb instanceof Cesium.Billboard) {
      bb.setImage(imageId, image);
      bb.pixelOffset.x = 0;
      bb.pixelOffset.y = 0;
    } else {
      bb.image = image;
      bb.imageId = imageId;
      bb.pixelOffset = new Cesium.Cartesian2(0, 0);
    }

    // use the icon color if available, otherwise default to white to use the original image color
    const color = iconColor || new Cesium.Color(1.0, 1.0, 1.0, 1.0);
    color.alpha = layer.getOpacity();
    const opacity = style.getOpacity();
    if (opacity != null) {
      color.alpha = color.alpha * opacity;
    }

    bb.color = color;

    const scale = style.getScale();
    bb.scale = scale != null ? scale : 1.0;
    bb.rotation = -style.getRotation() || 0;

    // rotate on z-axis, so rotation references the cardinal direction.
    // note: Cesium doesn't handle this well when the camera is rotated more than +/- 90 degrees from north.
    bb.alignedAxis = Cesium.Cartesian3.UNIT_Z;

    // default to horizontally centered, but icons should reasonably respect the anchor value
    let horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
    let verticalOrigin = Cesium.VerticalOrigin.CENTER;
    const pixelOffset = bb.pixelOffset;
    if (style instanceof OLIconStyle) {
      const anchor = style.getAnchor();
      const size = style.getSize();

      if (anchor && size) {
        // if we know the anchor and size, compute the pixel offset directly
        pixelOffset.x = Math.round(bb.scale * (size[0] - anchor[0]));
        horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;

        pixelOffset.y = Math.round(bb.scale * (size[1] - anchor[1]));
        verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
      }
    }

    bb.heightReference = getHeightReference(layer, feature, geometry, opt_index);
    bb.horizontalOrigin = horizontalOrigin;
    bb.verticalOrigin = verticalOrigin;
    bb.pixelOffset = pixelOffset;

    if (bb instanceof Cesium.Billboard) {
      // mark as updated so it isn't deleted
      bb.dirty = false;
    }
  }
};


/**
 * @type {?Cesium.NearFarScalar}
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

exports = {
  createBillboard,
  updateBillboard
};
