/**
 * @fileoverview KML parser convenience functions, parsers, etc.
 * @suppress {accessControls}
 */
goog.provide('plugin.file.kml');

goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.format.KML');
goog.require('ol.format.XSD');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.style.Icon');
goog.require('ol.style.IconAnchorUnits');
goog.require('ol.style.IconOrigin');
goog.require('ol.style.Style');
goog.require('ol.xml');
goog.require('os.data.RecordField');
goog.require('os.geo');
goog.require('os.mixin');
goog.require('os.mixin.polygon');
goog.require('os.object');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.ui.file.kml');
goog.require('os.xml');

/**
 * Key used to store the parsed KML style on features.
 * @type {string}
 */
plugin.file.kml.STYLE_KEY = '_kmlStyle';


/**
 * Namespace URI used for KML nodes.
 * @type {string}
 * @const
 */
plugin.file.kml.KML_NS = 'http://www.opengis.net/kml/2.2';


/**
 * Namespace URI used for gx nodes.
 * @type {string}
 * @const
 */
plugin.file.kml.GX_NS = 'http://www.google.com/kml/ext/2.2';


/**
 * Namespace URI used for gx nodes.
 * @type {string}
 * @const
 */
plugin.file.kml.OS_NS = 'http://opensphere.io/kml/ext/1.0';


/**
 * The default KML style
 * @type {Object<string, *>}
 */
plugin.file.kml.DEFAULT_STYLE = {
  'image': {
    'type': 'icon',
    'anchorOrigin': ol.style.IconOrigin.BOTTOM_LEFT,
    'anchorXUnits': ol.style.IconAnchorUnits.FRACTION,
    'anchorYUnits': ol.style.IconAnchorUnits.FRACTION,
    'crossOrigin': os.net.CrossOrigin.ANONYMOUS,
    'rotation': 0,
    'src': os.ui.file.kml.DEFAULT_ICON_PATH
  },
  'fill': {
    'color': os.style.DEFAULT_LAYER_COLOR
  },
  'stroke': {
    'color': os.style.DEFAULT_LAYER_COLOR,
    'width': os.style.DEFAULT_STROKE_WIDTH
  }
};


/**
 * @type {Array<Object<string, *>>}
 */
plugin.file.kml.DEFAULT_STYLE_ARRAY = [plugin.file.kml.DEFAULT_STYLE];


/**
 * Replaces parsers in an Openlayers KML parser map.
 *
 * @param {Object<string, Object<string, ol.XmlParser>>} obj The parser object with namespace keys
 * @param {string} field The field to replace
 * @param {ol.XmlParser} parser The new parser
 * @private
 */
plugin.file.kml.replaceParsers_ = function(obj, field, parser) {
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
plugin.file.kml.createStyleDefaults = function() {
  if (!ol.format.KML.DEFAULT_STYLE_ARRAY_) {
    ol.format.KML.createStyleDefaults_();
  }

  if (ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_ != os.ui.file.kml.DEFAULT_ICON_PATH) {
    // use OpenSphere's default icon, and update all properties to size/position it properly
    ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_ = os.ui.file.kml.DEFAULT_ICON_PATH;
    ol.format.KML.DEFAULT_IMAGE_SCALE_MULTIPLIER_ = 1;
    ol.format.KML.DEFAULT_IMAGE_STYLE_SIZE_ = [32, 32];
    ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_ = [16, 16];

    // replace the icon style with the new defaults
    ol.format.KML.DEFAULT_IMAGE_STYLE_ = new ol.style.Icon({
      anchor: ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_,
      anchorOrigin: ol.style.IconOrigin.BOTTOM_LEFT,
      anchorXUnits: ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_X_UNITS_,
      anchorYUnits: ol.format.KML.DEFAULT_IMAGE_STYLE_ANCHOR_Y_UNITS_,
      crossOrigin: 'anonymous',
      rotation: 0,
      scale: ol.format.KML.DEFAULT_IMAGE_SCALE_MULTIPLIER_,
      size: ol.format.KML.DEFAULT_IMAGE_STYLE_SIZE_,
      src: ol.format.KML.DEFAULT_IMAGE_STYLE_SRC_
    });
  }
};


/**
 * Accessor for private Openlayers code.
 *
 * @return {function(this: T, *, Array<*>, (string|undefined)): (Node|undefined)}
 * @template T
 */
plugin.file.kml.OL_GEOMETRY_NODE_FACTORY = function() {
  return ol.format.KML.GEOMETRY_NODE_FACTORY_;
};


/**
 * Accessor for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 * @template T
 */
plugin.file.kml.OL_ICON_STYLE_PARSERS = function() {
  return ol.format.KML.ICON_STYLE_PARSERS_;
};


/**
 * Accessor for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
plugin.file.kml.OL_LINK_PARSERS = function() {
  return ol.format.KML.LINK_PARSERS_;
};


/**
 * Accessor for private Openlayers code.
 *
 * @return {Array<string>}
 */
plugin.file.kml.OL_NAMESPACE_URIS = function() {
  return ol.format.KML.NAMESPACE_URIS_;
};


/**
 * Accessor for private Openlayers code.
 *
 * @return {Array<string>}
 */
plugin.file.kml.OL_GX_NAMESPACE_URIS = function() {
  return ol.format.KML.GX_NAMESPACE_URIS_;
};


/**
 * Accessor for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
plugin.file.kml.OL_NETWORK_LINK_PARSERS = function() {
  return ol.format.KML.NETWORK_LINK_PARSERS_;
};


/**
 * Accessor for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
plugin.file.kml.OL_PAIR_PARSERS = function() {
  return ol.format.KML.PAIR_PARSERS_;
};


/**
 * Accessor for private Openlayers code.
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
plugin.file.kml.OL_PLACEMARK_PARSERS = function() {
  return ol.format.KML.PLACEMARK_PARSERS_;
};


/**
 * Access for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlSerializer>>}
 */
plugin.file.kml.OL_PLACEMARK_SERIALIZERS = function() {
  return ol.format.KML.PLACEMARK_SERIALIZERS_;
};


/**
 * Access for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlSerializer>>}
 */
plugin.file.kml.OL_MULTI_GEOMETRY_SERIALIZERS = function() {
  return ol.format.KML.MULTI_GEOMETRY_SERIALIZERS_;
};


/**
 * Access for private Openlayers code.
 *
 * @return {Object<string, Object<string, ol.XmlParser>>}
 */
plugin.file.kml.OL_STYLE_PARSERS = function() {
  return ol.format.KML.STYLE_PARSERS_;
};


/**
 * Openlayers' opacity parsing can result in 16 decimal precision, which breaks when converting to a string then back
 * to an array. Since we convert everything to an rgba string, this can be pretty common. Normalize the color output,
 * which we have overridden to fix opacity to 2 decimal places.
 *
 * @param {Node} node Node.
 * @private
 * @return {ol.Color|undefined} Color.
 */
plugin.file.kml.readColor_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
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
    return ol.color.normalize(color, color);
  } else {
    return undefined;
  }
};
plugin.file.kml.replaceParsers_(ol.format.KML.LABEL_STYLE_PARSERS_, 'color',
    ol.xml.makeObjectPropertySetter(plugin.file.kml.readColor_));
plugin.file.kml.replaceParsers_(ol.format.KML.LINE_STYLE_PARSERS_, 'color',
    ol.xml.makeObjectPropertySetter(plugin.file.kml.readColor_));
plugin.file.kml.replaceParsers_(ol.format.KML.POLY_STYLE_PARSERS_, 'color',
    ol.xml.makeObjectPropertySetter(plugin.file.kml.readColor_));


/**
 * Accessor for private Openlayers code.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {Object} style config
 */
plugin.file.kml.readStyle = function(node, objectStack) {
  var styleObject = ol.xml.pushParseAndPop(
      {}, ol.format.KML.STYLE_PARSERS_, node, objectStack);
  if (!styleObject || goog.object.isEmpty(styleObject)) {
    // don't create a style config if nothing was parsed from the element
    return null;
  }
  var fillStyle = /** @type {ol.style.Fill} */
      ('fillStyle' in styleObject ?
        styleObject['fillStyle'] : ol.format.KML.DEFAULT_FILL_STYLE_);
  var fill = /** @type {boolean|undefined} */ (styleObject['fill']);
  var imageStyle = /** @type {ol.style.Image} */
      ('imageStyle' in styleObject ?
        styleObject['imageStyle'] : ol.format.KML.DEFAULT_IMAGE_STYLE_);
  if (imageStyle == ol.format.KML.DEFAULT_NO_IMAGE_STYLE_) {
    imageStyle = undefined;
  }
  var textStyle = /** @type {ol.style.Text} */
      ('textStyle' in styleObject ?
        styleObject['textStyle'] : ol.format.KML.DEFAULT_TEXT_STYLE_);
  var strokeStyle = /** @type {ol.style.Stroke} */
      ('strokeStyle' in styleObject ?
        styleObject['strokeStyle'] : ol.format.KML.DEFAULT_STROKE_STYLE_);
  var outline = /** @type {boolean|undefined} */
      (styleObject['outline']);

  var config = os.style.StyleManager.getInstance().toConfig(new ol.style.Style({
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
 * @const
 */
plugin.file.kml.PAIR_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'Style': ol.xml.makeObjectPropertySetter(plugin.file.kml.readStyle)
    });

os.object.merge(plugin.file.kml.PAIR_PARSERS, plugin.file.kml.OL_PAIR_PARSERS(), true);


/**
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.PLACEMARK_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'Style': ol.xml.makeObjectPropertySetter(plugin.file.kml.readStyle)
    });

os.object.merge(plugin.file.kml.PLACEMARK_PARSERS, plugin.file.kml.OL_PLACEMARK_PARSERS(), true);


/**
 * Property parsers for BalloonStyle Style.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.BALLOON_PROPERTY_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'bgColor': ol.xml.makeObjectPropertySetter(plugin.file.kml.readColor_),
      'textColor': ol.xml.makeObjectPropertySetter(plugin.file.kml.readColor_),
      'text': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'displayMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString)
    });


/**
 * Parses a time node.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {os.time.ITime} The parsed time, or null if none could be parsed
 */
plugin.file.kml.readTime = function(node, objectStack) {
  goog.asserts.assert(node.localName == 'TimeStamp' || node.localName == 'TimeSpan',
      'localName should be TimeStamp or TimeSpan');

  var timeObj = ol.xml.pushParseAndPop({}, plugin.file.kml.TIMEFIELD_PARSERS, node, []);
  var time = null;
  if (timeObj['when'] != null) {
    time = new os.time.TimeInstant(timeObj['when']);
  } else if (timeObj['begin'] != null || timeObj['end'] != null) {
    time = new os.time.TimeRange(timeObj['begin'], timeObj['end']);
  }

  return time;
};


/**
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.LINK_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'refreshInterval': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'refreshMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'viewRefreshMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'viewRefreshTime': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal)
    });


/**
 * Extend link parsers to include refresh options.
 */
os.object.merge(plugin.file.kml.LINK_PARSERS, plugin.file.kml.OL_LINK_PARSERS(), false);


plugin.file.kml.OS_NAMESPACE_URIS_ = [
  plugin.file.kml.OS_NS
];


/**
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.ICON_STYLE_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'color': ol.xml.makeObjectPropertySetter(plugin.file.kml.readColor_)
    }, ol.xml.makeStructureNS(
        plugin.file.kml.OS_NAMESPACE_URIS_, {
          'iconOptions': plugin.file.kml.readJson_
        }
    ));


/**
 * Extend link parsers to include refresh options.
 */
os.object.merge(plugin.file.kml.ICON_STYLE_PARSERS, plugin.file.kml.OL_ICON_STYLE_PARSERS(), false);


/**
 * Parse KML time nodes to a os.time.ITime object.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.TIME_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'TimeStamp': ol.xml.makeObjectPropertySetter(plugin.file.kml.readTime, os.data.RecordField.TIME),
      'TimeSpan': ol.xml.makeObjectPropertySetter(plugin.file.kml.readTime, os.data.RecordField.TIME)
    });


/**
 * Parse Date objects from KML.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.TIMEFIELD_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'when': ol.xml.makeObjectPropertySetter(os.xml.readDateTime),
      'begin': ol.xml.makeObjectPropertySetter(os.xml.readDateTime),
      'end': ol.xml.makeObjectPropertySetter(os.xml.readDateTime)
    });


/**
 * Add time parsers to the Openlayers Placemark parsers. These will parse kml:TimeStamp into a time instant and
 * kml:TimeSpan into a time range.
 */
os.object.merge(plugin.file.kml.TIME_PARSERS, plugin.file.kml.OL_PLACEMARK_PARSERS(), false);


/**
 * Read a MultiTrack node.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @return {ol.geom.MultiLineString|undefined} MultiLineString.
 */
plugin.file.kml.readMultiTrack = function(node, objectStack) {
  var geometry = ol.format.KML.readGxMultiTrack_(node, objectStack);

  var properties = ol.xml.pushParseAndPop({}, plugin.file.kml.MULTITRACK_PROPERTY_PARSERS, node, objectStack);
  if (properties) {
    geometry.setProperties(properties);
  }

  return geometry;
};


/**
 * Geometry parsers for MultiTrack nodes.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.MULTITRACK_GEOMETRY_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      // add kml:Track parser to support the 2.3 spec
      'Track': ol.xml.makeArrayPusher(ol.format.KML.readGxTrack_)
    });


/**
 * Property parsers for MultiTrack nodes.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.MULTITRACK_PROPERTY_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'altitudeMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'interpolate': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean)
    }, ol.xml.makeStructureNS(
        plugin.file.kml.OL_GX_NAMESPACE_URIS(), {
          // also include gx:interpolate to support 2.2 extension values
          'interpolate': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean)
        }
    ));


/**
 * Track/MultiTrack parsers for Placemark nodes.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.PLACEMARK_TRACK_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      // add kml:Track and kml:MultiTrack parsers to support the 2.3 spec
      'MultiTrack': ol.xml.makeObjectPropertySetter(plugin.file.kml.readMultiTrack, 'geometry'),
      'Track': ol.xml.makeObjectPropertySetter(ol.format.KML.readGxTrack_, 'geometry')
    }, ol.xml.makeStructureNS(
        plugin.file.kml.OL_GX_NAMESPACE_URIS(), {
          // replace gx:MultiTrack parser with ours
          'MultiTrack': ol.xml.makeObjectPropertySetter(plugin.file.kml.readMultiTrack, 'geometry')
        }
    ));


/**
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.GX_TRACK_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'coord': ol.format.KML.gxCoordParser_
    });


/**
 * Extend the Openlayers MultiTrack geometry parsers.
 */
os.object.merge(plugin.file.kml.MULTITRACK_GEOMETRY_PARSERS, ol.format.KML.GX_MULTITRACK_GEOMETRY_PARSERS_, false);


/**
 * Extend the Openlayers Track node parsers.
 */
os.object.merge(plugin.file.kml.GX_TRACK_PARSERS, ol.format.KML.GX_TRACK_PARSERS_, false);


/**
 * Add/replace Track/MultiTrack parsers for Placemark nodes.
 */
os.object.merge(plugin.file.kml.PLACEMARK_TRACK_PARSERS, plugin.file.kml.OL_PLACEMARK_PARSERS(), true);


/**
 * Read a LatLonBox node and add extent/rotation to the last object on the stack.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @private
 */
plugin.file.kml.readLatLonBox_ = function(node, objectStack) {
  var object = ol.xml.pushParseAndPop({}, plugin.file.kml.LAT_LON_BOX_PARSERS, node, objectStack);
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
 * @private
 */
plugin.file.kml.readLatLonQuad_ = function(node, objectStack) {
  var flatCoords = ol.xml.pushParseAndPop([], plugin.file.kml.LAT_LON_QUAD_PARSERS, node, objectStack);
  if (flatCoords && flatCoords.length) {
    // LatLonQuad is not (necessarily) a bounding box. We will only support rectangular LatLonQuads
    // (aka they should've used LatLonBox).
    //
    // I believe you need non-affine transforms (which the canvas 2d context does not support) in
    // order to draw the image properly. This is something that we could opt to do ourselves since
    // the image would only need to be redrawn once.
    var coordinates = ol.geom.flat.inflate.coordinates(flatCoords, 0, flatCoords.length, 3);
    if (coordinates.length === 4) {
      var extent = coordinates.reduce(function(extent, coord) {
        ol.extent.extendCoordinate(extent, coord);
        return extent;
      }, ol.extent.createEmpty());

      var targetObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);

      if (!os.geo.isClosed(coordinates)) {
        coordinates.push(coordinates[0].slice());
      }

      if (os.geo.isRectangular(coordinates, extent)) {
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
 * @const
 */
plugin.file.kml.GROUND_OVERLAY_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'Icon': ol.xml.makeObjectPropertySetter(ol.format.KML.readIcon_),
      'color': ol.xml.makeObjectPropertySetter(plugin.file.kml.readColor_),
      'drawOrder': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'altitude': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'altitudeMode': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'LatLonBox': plugin.file.kml.readLatLonBox_,
      'LatLonQuad': plugin.file.kml.readLatLonQuad_,
      'TimeStamp': ol.xml.makeObjectPropertySetter(plugin.file.kml.readTime, os.data.RecordField.TIME),
      'TimeSpan': ol.xml.makeObjectPropertySetter(plugin.file.kml.readTime, os.data.RecordField.TIME)
    }, ol.xml.makeStructureNS(
        plugin.file.kml.OL_GX_NAMESPACE_URIS(), {
          // also include gx:LatLonQuad to support 2.2 extension values
          'LatLonQuad': plugin.file.kml.readLatLonQuad_
        }
    ));


/**
 * Property parsers for LatLonBox.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.LAT_LON_BOX_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'north': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'south': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'east': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'west': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'rotation': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal)
    });


/**
 * Property parsers for LatLonQuad.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.LAT_LON_QUAD_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'coordinates': ol.xml.makeReplacer(ol.format.KML.readFlatCoordinates_)
    });


/**
 * Property parsers for ScreenOverlay.
 * @type {Object<string, Object<string, ol.XmlParser>>}
 * @const
 */
plugin.file.kml.SCREEN_OVERLAY_PARSERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'name': ol.xml.makeObjectPropertySetter(ol.format.XSD.readString),
      'visibility': ol.xml.makeObjectPropertySetter(ol.format.XSD.readBoolean),
      'Icon': ol.xml.makeObjectPropertySetter(ol.format.KML.readIcon_),
      'color': ol.xml.makeObjectPropertySetter(plugin.file.kml.readColor_),
      'drawOrder': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'overlayXY': ol.xml.makeObjectPropertySetter(ol.format.KML.readVec2_),
      'screenXY': ol.xml.makeObjectPropertySetter(ol.format.KML.readVec2_),
      'rotationXY': ol.xml.makeObjectPropertySetter(ol.format.KML.readVec2_),
      'size': ol.xml.makeObjectPropertySetter(ol.format.KML.readVec2_),
      'rotation': ol.xml.makeObjectPropertySetter(ol.format.XSD.readDecimal),
      'TimeStamp': ol.xml.makeObjectPropertySetter(plugin.file.kml.readTime, os.data.RecordField.TIME),
      'TimeSpan': ol.xml.makeObjectPropertySetter(plugin.file.kml.readTime, os.data.RecordField.TIME)
    });


/**
 * Override the Openlayers function to support exporting Track and MultiTrack nodes.
 *
 * @param {*} value Value.
 * @param {Array<*>} objectStack Object stack.
 * @param {string=} opt_nodeName Node name.
 * @return {Node|undefined} Node.
 *
 * @suppress {duplicate}
 */
ol.format.KML.GEOMETRY_NODE_FACTORY_ = function(value, objectStack, opt_nodeName) {
  var parentNode = objectStack[objectStack.length - 1].node;
  var namespaceURI = parentNode.namespaceURI;
  var geometryType = value.getType();
  var nodeType = ol.format.KML.GEOMETRY_TYPE_TO_NODENAME_[geometryType];

  if (value instanceof ol.geom.SimpleGeometry) {
    // check if we can transform it into a track
    var layout = value.getLayout();

    if (layout === ol.geom.GeometryLayout.XYM || layout === ol.geom.GeometryLayout.XYZM) {
      if (geometryType === ol.geom.GeometryType.LINE_STRING) {
        nodeType = 'gx:Track';
        namespaceURI = plugin.file.kml.GX_NS;
      } else if (geometryType === ol.geom.GeometryType.MULTI_LINE_STRING) {
        nodeType = 'gx:MultiTrack';
        namespaceURI = plugin.file.kml.GX_NS;
      }
    }
  }

  return ol.xml.createElementNS(namespaceURI, nodeType);
};


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
plugin.file.kml.readURI = function(node) {
  var s = ol.xml.getAllTextContent(node, false).trim();

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

    return goog.Uri.resolve(node.baseURI, s).toString();
  }

  return s;
};
plugin.file.kml.replaceParsers_(ol.format.KML.PLACEMARK_PARSERS_, 'styleUrl',
    ol.xml.makeObjectPropertySetter(plugin.file.kml.readURI));


/**
 * Override for HREF parsing so that it will use our own readURI function above
 */
plugin.file.kml.HREF_OVERRIDE = ol.xml.makeStructureNS(
    ol.format.KML.NAMESPACE_URIS_, {
      'href': ol.xml.makeObjectPropertySetter(plugin.file.kml.readURI)
    });

os.object.merge(plugin.file.kml.HREF_OVERRIDE, ol.format.KML.LINK_PARSERS_, true);
os.object.merge(plugin.file.kml.HREF_OVERRIDE, ol.format.KML.ICON_PARSERS_, true);


/**
 * Save a reference to the original Openlayers writeMultiGeometry_ function.
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 * @private
 */
plugin.file.kml.olWriteMultiGeometry_ = ol.format.KML.writeMultiGeometry_;


/**
 * Adds support for writing geometries in a {@link ol.geom.GeometryCollection} to a kml:MultiGeometry node.
 *
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 * @private
 */
plugin.file.kml.writeMultiGeometry_ = function(node, geometry, objectStack) {
  if (geometry instanceof ol.geom.GeometryCollection) {
    // this part should be PR'ed back to Openlayers
    var /** @type {ol.XmlNodeStackItem} */ context = {node: node};
    var geometries = geometry.getGeometries();
    for (var i = 0, n = geometries.length; i < n; i++) {
      ol.xml.pushSerializeAndPop(context, plugin.file.kml.OL_PLACEMARK_SERIALIZERS(),
          plugin.file.kml.OL_GEOMETRY_NODE_FACTORY(), [geometries[i]], objectStack);
    }
  } else {
    // call the original function for everything else
    plugin.file.kml.olWriteMultiGeometry_(node, geometry, objectStack);
  }
};


/**
 * Adds support for writing Track nodes.
 *
 * @param {Node} node Node.
 * @param {ol.geom.Geometry} geometry Geometry.
 * @param {Array<*>} objectStack Object stack.
 * @private
 */
plugin.file.kml.writeMultiTrack_ = function(node, geometry, objectStack) {
  if (geometry instanceof ol.geom.MultiLineString) {
    var lineStrings = geometry.getLineStrings();
    for (var i = 0; i < lineStrings.length; i++) {
      var trackNode = ol.xml.createElementNS(plugin.file.kml.GX_NS, 'gx:Track');
      plugin.file.kml.writeTrack_(trackNode, lineStrings[i], objectStack);
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
 * @private
 */
plugin.file.kml.writeTrack_ = function(node, geometry, objectStack) {
  if (geometry instanceof ol.geom.LineString) {
    var flatCoordinates = geometry.getFlatCoordinates();
    var stride = geometry.getStride();

    for (var i = 0; i < flatCoordinates.length; i += stride) {
      var coordNode = ol.xml.createElementNS(plugin.file.kml.GX_NS, 'gx:coord');
      var coordText = flatCoordinates[i] + ' ' + flatCoordinates[i + 1];
      if (stride > 3) {
        coordText += ' ' + flatCoordinates[i + 2];
      }
      ol.format.XSD.writeStringTextNode(coordNode, coordText);

      var whenNode = ol.xml.createElementNS(plugin.file.kml.KML_NS, 'when');
      var whenText = new Date(flatCoordinates[i + stride - 1]).toISOString();
      ol.format.XSD.writeStringTextNode(whenNode, whenText);

      node.appendChild(coordNode);
      node.appendChild(whenNode);
    }
  }
};


/**
 * Override the Openlayers Placemark serializers to add additional support.
 * @type {Object<string, Object<string, ol.XmlSerializer>>}
 * @const
 */
plugin.file.kml.PLACEMARK_SERIALIZERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'MultiGeometry': ol.xml.makeChildAppender(plugin.file.kml.writeMultiGeometry_)
    }, ol.xml.makeStructureNS(
        plugin.file.kml.OL_GX_NAMESPACE_URIS(), {
          // add serializers for gx:Track and gx:MultiTrack
          'MultiTrack': ol.xml.makeChildAppender(plugin.file.kml.writeMultiTrack_),
          'Track': ol.xml.makeChildAppender(plugin.file.kml.writeTrack_)
        }
    ));
os.object.merge(plugin.file.kml.PLACEMARK_SERIALIZERS, plugin.file.kml.OL_PLACEMARK_SERIALIZERS(), true);



/**
 * @param {Node} node Node.
 * @param {ol.geom.Polygon} polygon Polygon.
 * @param {Array<*>} objectStack Object stack
 * @private
 */
plugin.file.kml.writePolygon_ = function(node, polygon, objectStack) {
  ol.format.KML.writePolygon_(node, polygon, objectStack);

  var context = /** @type {ol.XmlNodeStackItem} */ ({node: node});
  var properties = polygon.getProperties();
  var parentNode = objectStack[objectStack.length - 1].node;
  var orderedKeys = ol.format.KML.PRIMITIVE_GEOMETRY_SEQUENCE_[parentNode.namespaceURI];
  var values = ol.xml.makeSequence(properties, orderedKeys);
  ol.xml.pushSerializeAndPop(context, ol.format.KML.PRIMITIVE_GEOMETRY_SERIALIZERS_,
      ol.xml.OBJECT_PROPERTY_NODE_FACTORY, values, objectStack, orderedKeys);
};


/**
 * @type {Object<string, Object<string, ol.XmlSerializer>>}
 * @const
 */
plugin.file.kml.POLYGON_SERIALIZERS = ol.xml.makeStructureNS(
    plugin.file.kml.OL_NAMESPACE_URIS(), {
      'Polygon': ol.xml.makeChildAppender(plugin.file.kml.writePolygon_)
    });

os.object.merge(plugin.file.kml.POLYGON_SERIALIZERS, plugin.file.kml.OL_PLACEMARK_SERIALIZERS(), true);
os.object.merge(plugin.file.kml.POLYGON_SERIALIZERS,
    plugin.file.kml.OL_MULTI_GEOMETRY_SERIALIZERS(), true);


/**
 * {@link ol.geom.GeometryCollection} should be serialized as a kml:MultiGeometry.
 */
ol.format.KML.GEOMETRY_TYPE_TO_NODENAME_['GeometryCollection'] = 'MultiGeometry';


/**
 * This is literally replacing \d+ with \d* in the regular expression's altitude group so coordinates like
 * "1,2,0." will work.
 *
 * @param {Node} node Node.
 * @private
 * @return {Array<number>|undefined} Flat coordinates.
 *
 * @suppress {duplicate}
 */
ol.format.KML.readFlatCoordinates_ = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
  var flatCoordinates = [];

  // The KML specification states that coordinate tuples should not include
  // spaces, but we tolerate them.
  var re = /^[^\d+.-]*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*,\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)(?:\s*,\s*([+\-]?\d*\.?\d*(?:e[+\-]?\d+)?))?\s*/i;

  var m;
  while ((m = re.exec(s))) {
    var x = parseFloat(m[1]);
    var y = parseFloat(m[2]);
    var z = m[3] ? parseFloat(m[3]) : 0;
    flatCoordinates.push(x, y, z);
    s = s.substr(m[0].length);
  }
  // if (s !== '') {
  //   return undefined;
  // }
  return flatCoordinates;
};
plugin.file.kml.replaceParsers_(ol.format.KML.FLAT_LINEAR_RING_PARSERS_, 'coordinates',
    ol.xml.makeReplacer(ol.format.KML.readFlatCoordinates_));
plugin.file.kml.replaceParsers_(ol.format.KML.GEOMETRY_FLAT_COORDINATES_PARSERS_, 'coordinates',
    ol.xml.makeReplacer(ol.format.KML.readFlatCoordinates_));


/**
 * Let's just go with the KML scale value instead of the square root, shall we?
 *
 * @param {Node} node Node.
 * @return {number|undefined} Scale.
 * @private
 */
plugin.file.kml.readScale_ = function(node) {
  return ol.format.XSD.readDecimal(node);
};
plugin.file.kml.replaceParsers_(ol.format.KML.ICON_STYLE_PARSERS_, 'scale',
    ol.xml.makeObjectPropertySetter(plugin.file.kml.readScale_));
plugin.file.kml.replaceParsers_(ol.format.KML.LABEL_STYLE_PARSERS_, 'scale',
    ol.xml.makeObjectPropertySetter(plugin.file.kml.readScale_));


/**
 * Parse JSON data from the node.
 *
 * @param {Node} node Node.
 * @return {Object|null}
 * @private
 */
plugin.file.kml.readJson_ = function(node) {
  var str = ol.format.XSD.readString(node);
  if (str) {
    return /** @type {Object} */ (JSON.parse(str));
  }
  return null;
};
plugin.file.kml.replaceParsers_(ol.format.KML.ICON_STYLE_PARSERS_, 'iconOptions',
    ol.xml.makeObjectPropertySetter(plugin.file.kml.readJson_));


/**
 * KML 2.0 support, yay!!!
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @private
 */
plugin.file.kml.UrlParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT,
      'node.nodeType should be ELEMENT');
  goog.asserts.assert(node.localName == 'Url', 'localName should be Url');
  ol.xml.parseNode(plugin.file.kml.OL_LINK_PARSERS(), node, objectStack);
};
plugin.file.kml.replaceParsers_(plugin.file.kml.OL_NETWORK_LINK_PARSERS(), 'Url', plugin.file.kml.UrlParser_);


/**
 * Added support for icon color.
 *
 * @param {Node} node Node.
 * @param {Array<*>} objectStack Object stack.
 * @private
 */
plugin.file.kml.IconStyleParser_ = function(node, objectStack) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT, 'node.nodeType should be an ELEMENT');
  goog.asserts.assert(node.localName == 'IconStyle', 'localName should be IconStyle');
  // FIXME refreshMode
  // FIXME refreshInterval
  // FIXME viewRefreshTime
  // FIXME viewBoundScale
  // FIXME viewFormat
  // FIXME httpQuery
  var object = ol.xml.pushParseAndPop({}, ol.format.KML.ICON_STYLE_PARSERS_, node, objectStack);
  if (!object) {
    return;
  }
  var styleObject = /** @type {Object} */ (objectStack[objectStack.length - 1]);
  goog.asserts.assert(goog.isObject(styleObject), 'styleObject should be an Object');
  var IconObject = 'Icon' in object ? object['Icon'] : {};
  var src;
  var href = /** @type {string|undefined} */ (IconObject['href']);
  if (href) {
    src = href;
  } else {
    src = os.object.IGNORE_VAL;
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
    rotation = ol.math.toRadians(heading);
  }

  var scale = /** @type {number|undefined} */ (object['scale']);

  var options = /** @type {Object|undefined} */ (object['iconOptions']);

  // determine the crossOrigin from the provided URL. if 'none', use undefined so the attribute isn't set on the image.
  var crossOrigin = src ? os.net.getCrossOrigin(src) : undefined;
  if (crossOrigin == os.net.CrossOrigin.NONE) {
    crossOrigin = undefined;
  }

  var color = /** @type {ol.Color} */ (object['color']);

  var imageStyle = new ol.style.Icon({
    anchor: anchor,
    anchorOrigin: ol.style.IconOrigin.BOTTOM_LEFT,
    anchorXUnits: anchorXUnits,
    anchorYUnits: anchorYUnits,
    color: color,
    crossOrigin: crossOrigin,
    offset: offset,
    offsetOrigin: ol.style.IconOrigin.BOTTOM_LEFT,
    rotation: rotation,
    scale: scale,
    size: size,
    src: src
  });
  imageStyle['options'] = options;

  styleObject['imageStyle'] = imageStyle;
};
plugin.file.kml.replaceParsers_(plugin.file.kml.OL_STYLE_PARSERS(), 'IconStyle', plugin.file.kml.IconStyleParser_);
