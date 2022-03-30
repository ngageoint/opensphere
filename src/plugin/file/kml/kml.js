/**
 * @fileoverview KML parser convenience functions, parsers, etc.
 * @suppress {accessControls}
 */
goog.declareModuleId('plugin.file.kml');

import {normalize} from 'ol/src/color.js';
import {extendCoordinate, createEmpty} from 'ol/src/extent.js';
import {readBoolean, readDecimal, readString, writeStringTextNode} from 'ol/src/format/xsd.js';
import {inflateCoordinates} from 'ol/src/geom/flat/inflate.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import {toRadians} from 'ol/src/math.js';
import Icon from 'ol/src/style/Icon.js';
import IconAnchorUnits from 'ol/src/style/IconAnchorUnits.js';
import IconOrigin from 'ol/src/style/IconOrigin.js';
import Style from 'ol/src/style/Style.js';
import {
  OBJECT_PROPERTY_NODE_FACTORY,
  createElementNS,
  getAllTextContent,
  makeArrayPusher,
  makeChildAppender,
  makeObjectPropertySetter,
  makeReplacer,
  makeSequence,
  makeStructureNS,
  parseNode,
  pushParseAndPop,
  pushSerializeAndPop
} from 'ol/src/xml.js';
import * as annotation from '../../../os/annotation/annotation.js';
import RecordField from '../../../os/data/recordfield.js';
import Fields from '../../../os/fields/fields.js';
import * as geo from '../../../os/geo/geo.js';
import CrossOrigin from '../../../os/net/crossorigin.js';
import * as net from '../../../os/net/net.js';
import * as osObject from '../../../os/object/object.js';
import * as KML from '../../../os/ol/format/KML.js';
import * as osStyle from '../../../os/style/style.js';
import StyleField from '../../../os/style/stylefield.js';
import StyleManager from '../../../os/style/stylemanager_shim.js';
import TimeInstant from '../../../os/time/timeinstant.js';
import TimeRange from '../../../os/time/timerange.js';
import * as kml from '../../../os/ui/file/kml/kml.js';
import * as slickColumn from '../../../os/ui/slick/column.js';
import * as xml from '../../../os/xml.js';
import KMLField from './kmlfield.js';

const Uri = goog.require('goog.Uri');
const asserts = goog.require('goog.asserts');
const NodeType = goog.require('goog.dom.NodeType');
const googObject = goog.require('goog.object');


/**
 * Key used to store the parsed KML style on features.
 * @type {string}
 */
export const STYLE_KEY = '_kmlStyle';

/**
 * Namespace URI used for KML nodes.
 * @type {string}
 */
export const KML_NS = 'http://www.opengis.net/kml/2.2';

/**
 * Namespace URI used for gx nodes.
 * @type {string}
 */
export const GX_NS = 'http://www.google.com/kml/ext/2.2';

/**
 * Namespace URI used for gx nodes.
 * @type {string}
 */
export const OS_NS = 'http://opensphere.io/kml/ext/1.0';

/**
 * The default KML style
 * @type {Object<string, *>}
 */
export const DEFAULT_STYLE = {
  'image': {
    'type': 'icon',
    'anchorOrigin': IconOrigin.BOTTOM_LEFT,
    'anchorXUnits': IconAnchorUnits.FRACTION,
    'anchorYUnits': IconAnchorUnits.FRACTION,
    'crossOrigin': CrossOrigin.ANONYMOUS,
    'rotation': 0,
    'src': kml.DEFAULT_ICON_PATH
  },
  'fill': {
    'color': osStyle.DEFAULT_LAYER_COLOR
  },
  'stroke': {
    'color': osStyle.DEFAULT_LAYER_COLOR,
    'width': osStyle.DEFAULT_STROKE_WIDTH
  }
};

/**
 * @type {Array<Object<string, *>>}
 */
export const DEFAULT_STYLE_ARRAY = [DEFAULT_STYLE];

/**
 * Fields that should be displayed on the source.
 *
 * @type {!Array<string>}
 */
export const SOURCE_FIELDS = [
  KMLField.NAME,
  KMLField.DESCRIPTION,
  annotation.OPTIONS_FIELD,
  Fields.BEARING,
  Fields.LAT,
  Fields.LON,
  Fields.LAT_DDM,
  Fields.LON_DDM,
  Fields.LAT_DMS,
  Fields.LON_DMS,
  Fields.MGRS,
  Fields.SEMI_MAJOR,
  Fields.SEMI_MINOR,
  Fields.SEMI_MAJOR_UNITS,
  Fields.SEMI_MINOR_UNITS,
  Fields.TIME,
  Fields.ORIENTATION,
  StyleField.CENTER_SHAPE,
  StyleField.SHAPE,
  StyleField.LABELS,
  StyleField.LABEL_COLOR,
  StyleField.LABEL_SIZE,
  StyleField.FILL_COLOR
];

// extend column auto size rules to include KML columns
Object.assign(slickColumn.fix, {
  'name': {
    order: -60,
    width: 200
  },
  'description': {
    order: -55
  }
});

/**
 * Replaces parsers in an Openlayers KML parser map.
 *
 * @param {Object<string, Object<string, ol.XmlParser>>} obj The parser object with namespace keys
 * @param {string} field The field to replace
 * @param {ol.XmlParser} parser The new parser
 */
const replaceParsers_ = function(obj, field, parser) {
  for (var ns in obj) {
    if (obj[ns]) {
      obj[ns][field] = parser;
    }
  }
};

/**
 * Create default OpenLayers styles along with OpenSphere overrides.
 * @suppress {accessControls, const}
 */
export const createStyleDefaults = function() {
  if (!KML.DEFAULT_STYLE_ARRAY) {
    KML.createStyleDefaults();
  }

  if (KML.DEFAULT_IMAGE_STYLE_SRC != kml.DEFAULT_ICON_PATH) {
    // replace the icon style with the new defaults
    const icon = new Icon({
      anchor: KML.DEFAULT_IMAGE_STYLE_ANCHOR,
      anchorOrigin: IconOrigin.BOTTOM_LEFT,
      anchorXUnits: KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS,
      anchorYUnits: KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS,
      crossOrigin: 'anonymous',
      rotation: 0,
      scale: KML.DEFAULT_IMAGE_SCALE_MULTIPLIER,
      size: KML.DEFAULT_IMAGE_STYLE_SIZE,
      src: KML.DEFAULT_IMAGE_STYLE_SRC
    });

    KML.setDefaultImageStyle(kml.DEFAULT_ICON_PATH, icon);
  }
};

/**
 * Accessor for private Openlayers code.
 *
 * @return {function(this: T, *, Array<*>, (string|undefined)): (Node|undefined)}
 * @template T
 */
export const OL_GEOMETRY_NODE_FACTORY = function() {
  return KML.GEOMETRY_NODE_FACTORY;
};

/**
 * Accessor for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 * @template T
 */
export const OL_ICON_STYLE_PARSERS = function() {
  return KML.ICON_STYLE_PARSERS;
};

/**
 * Accessor for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
export const OL_LINK_PARSERS = function() {
  return KML.LINK_PARSERS;
};

/**
 * Accessor for private Openlayers code.
 *
 * @return {Array<string>}
 */
export const OL_NAMESPACE_URIS = function() {
  return KML.NAMESPACE_URIS;
};

/**
 * Accessor for private Openlayers code.
 *
 * @return {Array<string>}
 */
export const OL_GX_NAMESPACE_URIS = function() {
  return KML.GX_NAMESPACE_URIS;
};

/**
 * Accessor for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
export const OL_NETWORK_LINK_PARSERS = function() {
  return KML.NETWORK_LINK_PARSERS;
};

/**
 * Accessor for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
export const OL_PAIR_PARSERS = function() {
  return KML.PAIR_PARSERS;
};

/**
 * Accessor for private Openlayers code.
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
export const OL_PLACEMARK_PARSERS = function() {
  return KML.PLACEMARK_PARSERS;
};

/**
 * Access for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlSerializer>>}
 */
export const OL_PLACEMARK_SERIALIZERS = function() {
  return KML.PLACEMARK_SERIALIZERS;
};

/**
 * Access for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlSerializer>>}
 */
export const OL_MULTI_GEOMETRY_SERIALIZERS = function() {
  return KML.MULTI_GEOMETRY_SERIALIZERS;
};

/**
 * Access for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
export const OL_STYLE_PARSERS = function() {
  return KML.STYLE_PARSERS;
};

/**
 * Openlayers' opacity parsing can result in 16 decimal precision, which breaks when converting to a string then back
 * to an array. Since we convert everything to an rgba string, this can be pretty common. Normalize the color output,
 * which we have overridden to fix opacity to 2 decimal places.
 *
 * @param {Node} node Node.
 * @return {ol.Color|undefined} Color.
 */
const readColor_ = function(node) {
  var s = getAllTextContent(node, false);
  // The KML specification states that colors should not include a leading `#`
  // but we tolerate them.
  var m = /^\s*#?\s*([0-9A-Fa-f]{8})\s*$/.exec(s);
  if (m) {
    var hexColor = m[1];
    var color = [
      parseInt(hexColor.substr(6, 2), 16),
      parseInt(hexColor.substr(4, 2), 16),
      parseInt(hexColor.substr(2, 2), 16),
      parseInt(hexColor.substr(0, 2), 16) / 255
    ];
    return normalize(color, color);
  } else {
    return undefined;
  }
};

replaceParsers_(KML.LABEL_STYLE_PARSERS, 'color',
    makeObjectPropertySetter(readColor_));
replaceParsers_(KML.LINE_STYLE_PARSERS, 'color',
    makeObjectPropertySetter(readColor_));
replaceParsers_(KML.POLY_STYLE_PARSERS, 'color',
    makeObjectPropertySetter(readColor_));


/**
 * Accessor for private Openlayers code.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object} style config
 */
export const readStyle = function(node, objectStack) {
  var styleObject = pushParseAndPop(
      {}, KML.STYLE_PARSERS, node, objectStack);
  if (!styleObject || googObject.isEmpty(styleObject)) {
    // don't create a style config if nothing was parsed from the element
    return null;
  }
  var fillStyle = /** @type {Fill} */
      ('fillStyle' in styleObject ?
        styleObject['fillStyle'] : KML.DEFAULT_FILL_STYLE);
  var fill = /** @type {boolean|undefined} */ (styleObject['fill']);
  var imageStyle = /** @type {Image} */
      ('imageStyle' in styleObject ?
        styleObject['imageStyle'] : KML.DEFAULT_IMAGE_STYLE);
  if (imageStyle == KML.DEFAULT_NO_IMAGE_STYLE) {
    imageStyle = undefined;
  }
  // Intentionally removed using the default OpenLayers text style, to use OpenSphere defaults instead.
  var textStyle = /** @type {Text} */ ('textStyle' in styleObject ? styleObject['textStyle'] : null);
  var strokeStyle = /** @type {Stroke} */
      ('strokeStyle' in styleObject ?
        styleObject['strokeStyle'] : KML.DEFAULT_STROKE_STYLE);
  var outline = /** @type {boolean|undefined} */
      (styleObject['outline']);

  var config = StyleManager.getInstance().toConfig(new Style({
    fill: fillStyle,
    image: imageStyle,
    stroke: strokeStyle,
    text: textStyle,
    zIndex: undefined // FIXME
  }));

  if (fill !== undefined && !fill) {
    config['fill'] = null;
  }

  if (imageStyle['options'] !== undefined) {
    config['image']['options'] = imageStyle['options'];
  }

  if (outline !== undefined && !outline) {
    config['stroke'] = null;
  }

  return config;
};

/**
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const PAIR_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'Style': makeObjectPropertySetter(readStyle)
    });

osObject.merge(PAIR_PARSERS, OL_PAIR_PARSERS(), true);


/**
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const PLACEMARK_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'Style': makeObjectPropertySetter(readStyle)
    });

osObject.merge(PLACEMARK_PARSERS, OL_PLACEMARK_PARSERS(), true);


/**
 * Property parsers for BalloonStyle Style.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const BALLOON_PROPERTY_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'bgColor': makeObjectPropertySetter(readColor_),
      'textColor': makeObjectPropertySetter(readColor_),
      'text': makeObjectPropertySetter(readString),
      'displayMode': makeObjectPropertySetter(readString)
    });

/**
 * Parse JSON data from the node.
 *
 * @param {Node} node Node.
 * @return {Object|null}
 */
const readJson = function(node) {
  var str = readString(node);
  if (str) {
    return /** @type {Object} */ (JSON.parse(str));
  }
  return null;
};

/**
 * Parses a time node.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {ITime} The parsed time, or null if none could be parsed
 */
export const readTime = function(node, objectStack) {
  asserts.assert(node.localName == 'TimeStamp' || node.localName == 'TimeSpan',
      'localName should be TimeStamp or TimeSpan');

  var timeObj = pushParseAndPop({}, TIMEFIELD_PARSERS, node, []);
  var time = null;
  if (timeObj['when'] != null) {
    time = new TimeInstant(timeObj['when']);
  } else if (timeObj['begin'] != null || timeObj['end'] != null) {
    time = new TimeRange(timeObj['begin'], timeObj['end']);
  }

  return time;
};

/**
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const LINK_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'refreshInterval': makeObjectPropertySetter(readDecimal),
      'refreshMode': makeObjectPropertySetter(readString),
      'viewRefreshMode': makeObjectPropertySetter(readString),
      'viewRefreshTime': makeObjectPropertySetter(readDecimal)
    });


/**
 * Extend link parsers to include refresh options.
 */
osObject.merge(LINK_PARSERS, OL_LINK_PARSERS(), false);


const OS_NAMESPACE_URIS = [OS_NS];

/**
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const ICON_STYLE_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'color': makeObjectPropertySetter(readColor_)
    }, makeStructureNS(
        OS_NAMESPACE_URIS, {
          'iconOptions': readJson
        }
    ));


/**
 * Extend link parsers to include refresh options.
 */
osObject.merge(ICON_STYLE_PARSERS, OL_ICON_STYLE_PARSERS(), false);


/**
 * Parse KML time nodes to a os.time.ITime object.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const TIME_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'TimeStamp': makeObjectPropertySetter(readTime, RecordField.TIME),
      'TimeSpan': makeObjectPropertySetter(readTime, RecordField.TIME)
    });

/**
 * Parse Date objects from KML.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const TIMEFIELD_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'when': makeObjectPropertySetter(xml.readDateTime),
      'begin': makeObjectPropertySetter(xml.readDateTime),
      'end': makeObjectPropertySetter(xml.readDateTime)
    });


/**
 * Add time parsers to the Openlayers Placemark parsers. These will parse kml:TimeStamp into a time instant and
 * kml:TimeSpan into a time range.
 */
osObject.merge(TIME_PARSERS, OL_PLACEMARK_PARSERS(), false);


/**
 * Read a MultiTrack node.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {ol.geom.MultiLineString|undefined} MultiLineString.
 */
export const readMultiTrack = function(node, objectStack) {
  var geometry = KML.readGxMultiTrack(node, objectStack);

  var properties = pushParseAndPop({}, MULTITRACK_PROPERTY_PARSERS, node, objectStack);
  if (properties) {
    geometry.setProperties(properties);
  }

  return geometry;
};

/**
 * Geometry parsers for MultiTrack nodes.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const MULTITRACK_GEOMETRY_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      // add kml:Track parser to support the 2.3 spec
      'Track': makeArrayPusher(KML.readGxTrack)
    });

/**
 * Property parsers for MultiTrack nodes.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const MULTITRACK_PROPERTY_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'altitudeMode': makeObjectPropertySetter(readString),
      'interpolate': makeObjectPropertySetter(readBoolean)
    }, makeStructureNS(
        OL_GX_NAMESPACE_URIS(), {
          // also include gx:interpolate to support 2.2 extension values
          'interpolate': makeObjectPropertySetter(readBoolean)
        }
    ));

/**
 * Track/MultiTrack parsers for Placemark nodes.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const PLACEMARK_TRACK_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      // add kml:Track and kml:MultiTrack parsers to support the 2.3 spec
      'MultiTrack': makeObjectPropertySetter(readMultiTrack, 'geometry'),
      'Track': makeObjectPropertySetter(KML.readGxTrack, 'geometry')
    }, makeStructureNS(
        OL_GX_NAMESPACE_URIS(), {
          // replace gx:MultiTrack parser with ours
          'MultiTrack': makeObjectPropertySetter(readMultiTrack, 'geometry')
        }
    ));

/**
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const GX_TRACK_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'coord': KML.gxCoordParser
    });


/**
 * Extend the Openlayers MultiTrack geometry parsers.
 */
osObject.merge(MULTITRACK_GEOMETRY_PARSERS, KML.GX_MULTITRACK_GEOMETRY_PARSERS, false);


/**
 * Extend the Openlayers Track node parsers.
 */
osObject.merge(GX_TRACK_PARSERS, KML.GX_TRACK_PARSERS, false);


/**
 * Add/replace Track/MultiTrack parsers for Placemark nodes.
 */
osObject.merge(PLACEMARK_TRACK_PARSERS, OL_PLACEMARK_PARSERS(), true);


/**
 * Read a LatLonBox node and add extent/rotation to the last object on the stack.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
export const readLatLonBox = function(node, objectStack) {
  var object = pushParseAndPop({}, LAT_LON_BOX_PARSERS, node, objectStack);
  if (!object) {
    return;
  }

  var targetObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  var extent = [
    parseFloat(object['west']),
    parseFloat(object['south']),
    parseFloat(object['east']),
    parseFloat(object['north'])
  ];
  targetObject['extent'] = extent;
  targetObject['rotation'] = parseFloat(object['rotation'] || 0);
};

/**
 * Read a LatLonQuad node and add extent to the last object on the stack.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
export const readLatLonQuad = function(node, objectStack) {
  var flatCoords = pushParseAndPop([], LAT_LON_QUAD_PARSERS, node, objectStack);
  if (flatCoords && flatCoords.length) {
    // LatLonQuad is not (necessarily) a bounding box. We will only support rectangular LatLonQuads
    // (aka they should've used LatLonBox).
    //
    // I believe you need non-affine transforms (which the canvas 2d context does not support) in
    // order to draw the image properly. This is something that we could opt to do ourselves since
    // the image would only need to be redrawn once.
    var coordinates = inflateCoordinates(flatCoords, 0, flatCoords.length, 3);
    if (coordinates.length === 4) {
      // Per the KML spec:
      //   If a third value is inserted into any tuple (representing altitude) it will be ignored. Altitude is set using
      //   <altitude> and <altitudeMode> (or <gx:altitudeMode>) extending <GroundOverlay>. Allowed altitude modes are
      //   absolute, clampToGround, and clampToSeaFloor.
      coordinates.forEach((coord) => {
        coord.length = Math.min(coord.length, 2);
      });

      var extent = coordinates.reduce(function(extent, coord, idx) {
        extendCoordinate(extent, coord);
        return extent;
      }, createEmpty());

      var targetObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);

      if (!geo.isClosed(coordinates)) {
        coordinates.push(coordinates[0].slice());
      }

      if (geo.isRectangular(coordinates, extent)) {
        targetObject['extent'] = extent;
      } else {
        targetObject['error'] = 'Non-rectangular gx:LatLonQuad values are not supported! ' +
          'The GroundOverlay will not be shown.';
      }
    }
  }
};

/**
 * Property parsers for GroundOverlay.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const GROUND_OVERLAY_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'Icon': makeObjectPropertySetter(KML.readIcon),
      'color': makeObjectPropertySetter(readColor_),
      'drawOrder': makeObjectPropertySetter(readDecimal),
      'altitude': makeObjectPropertySetter(readDecimal),
      'altitudeMode': makeObjectPropertySetter(readString),
      'LatLonBox': readLatLonBox,
      'LatLonQuad': readLatLonQuad,
      'TimeStamp': makeObjectPropertySetter(readTime, RecordField.TIME),
      'TimeSpan': makeObjectPropertySetter(readTime, RecordField.TIME)
    }, makeStructureNS(
        OL_GX_NAMESPACE_URIS(), {
          // also include gx:LatLonQuad to support 2.2 extension values
          'LatLonQuad': readLatLonQuad
        }
    ));

/**
 * Property parsers for LatLonBox.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const LAT_LON_BOX_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'north': makeObjectPropertySetter(readDecimal),
      'south': makeObjectPropertySetter(readDecimal),
      'east': makeObjectPropertySetter(readDecimal),
      'west': makeObjectPropertySetter(readDecimal),
      'rotation': makeObjectPropertySetter(readDecimal)
    });

/**
 * Property parsers for LatLonQuad.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const LAT_LON_QUAD_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'coordinates': makeReplacer(KML.readFlatCoordinates)
    });

/**
 * Property parsers for ScreenOverlay.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 */
export const SCREEN_OVERLAY_PARSERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'name': makeObjectPropertySetter(readString),
      'visibility': makeObjectPropertySetter(readBoolean),
      'Icon': makeObjectPropertySetter(KML.readIcon),
      'color': makeObjectPropertySetter(readColor_),
      'drawOrder': makeObjectPropertySetter(readDecimal),
      'overlayXY': makeObjectPropertySetter(KML.readVec2),
      'screenXY': makeObjectPropertySetter(KML.readVec2),
      'rotationXY': makeObjectPropertySetter(KML.readVec2),
      'size': makeObjectPropertySetter(KML.readVec2),
      'rotation': makeObjectPropertySetter(readDecimal),
      'TimeStamp': makeObjectPropertySetter(readTime, RecordField.TIME),
      'TimeSpan': makeObjectPropertySetter(readTime, RecordField.TIME)
    });

/**
 * Override the href parser to use the asset map.
 *
 * Openlayers 3.18 updated this function to use the URL() API, which is not supported in IE. If goog.Uri is replaced
 * here, a URL polyfill will be required.
 *
 * @param {Node} node
 * @return {string} URI
 * @protected
 */
export const readURI = function(node) {
  var s = getAllTextContent(node, false).trim();

  // find the asset map
  var assetMap = null;
  var p = node;
  while (p && !assetMap) {
    /** @suppress {checkTypes} To allow KML asset parsing. */
    assetMap = p.assetMap;
    p = p.parentNode;
  }

  if (node.baseURI && (!assetMap || !(s in assetMap))) {
    // According to the KML spec, relative paths to assets should use forward slashes. However, since this is KML
    // and KML is the worst, we have encountered numerous files that use backslashes. The workaround here is when
    // we fail to find an asset in the map, to check it with forward slashes, and use that URI if we find it.
    const replaced = s.replace(/\\/gi, '/');
    if (assetMap && replaced in assetMap) {
      return replaced;
    }

    return Uri.resolve(node.baseURI, s).toString();
  }

  return s;
};

replaceParsers_(KML.PLACEMARK_PARSERS, 'styleUrl',
    makeObjectPropertySetter(readURI));


/**
 * Override for HREF parsing so that it will use our own readURI function above
 */
export const HREF_OVERRIDE = makeStructureNS(
    KML.NAMESPACE_URIS, {
      'href': makeObjectPropertySetter(readURI)
    });

osObject.merge(HREF_OVERRIDE, KML.LINK_PARSERS, true);
osObject.merge(HREF_OVERRIDE, KML.ICON_PARSERS, true);


/**
 * Save a reference to the original Openlayers writeMultiGeometry_ function.
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
const olWriteMultiGeometry_ = KML.writeMultiGeometry;

/**
 * Adds support for writing geometries in a {@link GeometryCollection} to a kml:MultiGeometry node.
 *
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
const writeMultiGeometry_ = function(node, geometry, objectStack) {
  if (geometry instanceof GeometryCollection) {
    // this part should be PR'ed back to Openlayers
    var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
    var geometries = geometry.getGeometries();
    for (var i = 0, n = geometries.length; i < n; i++) {
      pushSerializeAndPop(context, OL_PLACEMARK_SERIALIZERS(),
          OL_GEOMETRY_NODE_FACTORY(), [geometries[i]], objectStack);
    }
  } else {
    // call the original function for everything else
    olWriteMultiGeometry_(node, geometry, objectStack);
  }
};

/**
 * Adds support for writing Track nodes.
 *
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
const writeMultiTrack_ = function(node, geometry, objectStack) {
  if (geometry instanceof MultiLineString) {
    var lineStrings = geometry.getLineStrings();
    for (var i = 0; i < lineStrings.length; i++) {
      var trackNode = createElementNS(GX_NS, 'gx:Track');
      writeTrack_(trackNode, lineStrings[i], objectStack);
      node.appendChild(trackNode);
    }
  }
};

/**
 * Adds support for writing Track nodes.
 *
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 */
const writeTrack_ = function(node, geometry, objectStack) {
  if (geometry instanceof LineString) {
    var flatCoordinates = geometry.getFlatCoordinates();
    var stride = geometry.getStride();

    for (var i = 0; i < flatCoordinates.length; i += stride) {
      var coordNode = createElementNS(GX_NS, 'gx:coord');
      var coordText = flatCoordinates[i] + ' ' + flatCoordinates[i + 1];
      if (stride > 3) {
        coordText += ' ' + flatCoordinates[i + 2];
      }
      writeStringTextNode(coordNode, coordText);

      var whenNode = createElementNS(KML_NS, 'when');
      var whenText = new Date(flatCoordinates[i + stride - 1]).toISOString();
      writeStringTextNode(whenNode, whenText);

      node.appendChild(coordNode);
      node.appendChild(whenNode);
    }
  }
};

/**
 * Override the Openlayers Placemark serializers to add additional support.
 * @type {Object<string, Object<string, ol.XmlSerializer>>}
 */
export const PLACEMARK_SERIALIZERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'MultiGeometry': makeChildAppender(writeMultiGeometry_)
    }, makeStructureNS(
        OL_GX_NAMESPACE_URIS(), {
          // add serializers for gx:Track and gx:MultiTrack
          'MultiTrack': makeChildAppender(writeMultiTrack_),
          'Track': makeChildAppender(writeTrack_)
        }
    ));

osObject.merge(PLACEMARK_SERIALIZERS, OL_PLACEMARK_SERIALIZERS(), true);



/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon.
 * @param {Array<*>} objectStack Object stack
 */
const writePolygon_ = function(node, polygon, objectStack) {
  KML.writePolygon(node, polygon, objectStack);

  var context = /** @type {ol.XmlNodeStackItem} */ ({node: node});
  var properties = polygon.getProperties();
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = KML.PRIMITIVE_GEOMETRY_SEQUENCE[parentNode.namespaceURI];
  var values = makeSequence(properties, orderedKeys);
  pushSerializeAndPop(context, KML.PRIMITIVE_GEOMETRY_SERIALIZERS,
      OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};

/**
 * @type {Object<string, Object<string, ol.XmlSerializer>>}
 */
export const POLYGON_SERIALIZERS = makeStructureNS(
    OL_NAMESPACE_URIS(), {
      'Polygon': makeChildAppender(writePolygon_)
    });

osObject.merge(POLYGON_SERIALIZERS, OL_PLACEMARK_SERIALIZERS(), true);
osObject.merge(POLYGON_SERIALIZERS,
    OL_MULTI_GEOMETRY_SERIALIZERS(), true);


/**
 * {@link GeometryCollection} should be serialized as a kml:MultiGeometry.
 */
KML.GEOMETRY_TYPE_TO_NODENAME['GeometryCollection'] = 'MultiGeometry';

replaceParsers_(KML.FLAT_LINEAR_RING_PARSERS, 'coordinates',
    makeReplacer(KML.readFlatCoordinates));
replaceParsers_(KML.GEOMETRY_FLAT_COORDINATES_PARSERS, 'coordinates',
    makeReplacer(KML.readFlatCoordinates));


/**
 * Let's just go with the KML scale value instead of the square root, shall we?
 *
 * @param {Node} node Node.
 * @return {number|undefined} Scale.
 */
const readScale_ = function(node) {
  return readDecimal(node);
};

replaceParsers_(KML.ICON_STYLE_PARSERS, 'scale',
    makeObjectPropertySetter(readScale_));
replaceParsers_(KML.LABEL_STYLE_PARSERS, 'scale',
    makeObjectPropertySetter(readScale_));
replaceParsers_(KML.ICON_STYLE_PARSERS, 'iconOptions',
    makeObjectPropertySetter(readJson));


/**
 * KML 2.0 support, yay!!!
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
const UrlParser_ = function(node, objectStack) {
  asserts.assert(node.nodeType == NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  asserts.assert(node.localName == 'Url', 'localName should be Url');
  parseNode(OL_LINK_PARSERS(), node, objectStack);
};

replaceParsers_(OL_NETWORK_LINK_PARSERS(), 'Url', UrlParser_);


/**
 * Added support for icon color.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 */
const IconStyleParser_ = function(node, objectStack) {
  asserts.assert(node.nodeType == NodeType.ELEMENT, 'node.nodeType should be an ELEMENT');
  asserts.assert(node.localName == 'IconStyle', 'localName should be IconStyle');
  // FIXME refreshMode
  // FIXME refreshInterval
  // FIXME viewRefreshTime
  // FIXME viewBoundScale
  // FIXME viewFormat
  // FIXME httpQuery
  var object = pushParseAndPop({}, KML.ICON_STYLE_PARSERS, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  asserts.assert(goog.isObject(styleObject), 'styleObject should be an Object');
  var IconObject = 'Icon' in object ? object['Icon'] : {};
  var src;
  var href = /** @type {string|undefined} */ (IconObject['href']);
  if (href) {
    src = href;
  } else {
    src = osObject.IGNORE_VAL;
  }

  var anchor;
  var anchorXUnits;
  var anchorYUnits;
  var hotSpot = /** @type {ol.KMLVec2_|undefined} */ (object['hotSpot']);
  if (hotSpot) {
    anchor = [hotSpot.x, hotSpot.y];
    anchorXUnits = hotSpot.xunits;
    anchorYUnits = hotSpot.yunits;
  }

  var offset;
  var x = /** @type {number|undefined} */ (IconObject['x']);
  var y = /** @type {number|undefined} */ (IconObject['y']);
  if (x !== undefined && y !== undefined) {
    offset = [x, y];
  }

  var size;
  var w = /** @type {number|undefined} */ (IconObject['w']);
  var h = /** @type {number|undefined} */ (IconObject['h']);
  if (w !== undefined && h !== undefined) {
    size = [w, h];
  }

  var rotation;
  var heading = /** @type {number} */ (object['heading']);
  if (heading !== undefined) {
    rotation = toRadians(heading);
  }

  var scale = /** @type {number|undefined} */ (object['scale']);

  var options = /** @type {Object|undefined} */ (object['iconOptions']);

  // determine the crossOrigin from the provided URL. if 'none', use undefined so the attribute isn't set on the image.
  var crossOrigin = src ? net.getCrossOrigin(src) : undefined;
  if (crossOrigin == CrossOrigin.NONE) {
    crossOrigin = undefined;
  }

  var color = /** @type {ol.Color} */ (object['color']);

  var imageStyle = new Icon({
    anchor: anchor,
    anchorOrigin: IconOrigin.BOTTOM_LEFT,
    anchorXUnits: anchorXUnits,
    anchorYUnits: anchorYUnits,
    color: color,
    crossOrigin: crossOrigin,
    offset: offset,
    offsetOrigin: IconOrigin.BOTTOM_LEFT,
    rotation: rotation,
    scale: scale,
    size: size,
    src: src
  });
  imageStyle['options'] = options;

  styleObject['imageStyle'] = imageStyle;
};

replaceParsers_(OL_STYLE_PARSERS(), 'IconStyle', IconStyleParser_);
