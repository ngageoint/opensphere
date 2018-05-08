goog.provide('os.ui.file.gml.GMLParser');

goog.require('goog.log');
goog.require('ol.format.GML2');
goog.require('ol.format.GML3');
goog.require('os.parse.IParser');


/**
 * The default GML style
 * @type {Object<string, *>}
 */
os.ui.file.gml.DEFAULT_STYLE = {
  'image': {
    'type': 'circle',
    'color': os.style.DEFAULT_LAYER_COLOR,
    'fill': {
      'color': os.style.DEFAULT_LAYER_COLOR
    }
  },
  'stroke': {
    'color': os.style.DEFAULT_LAYER_COLOR,
    'width': os.style.DEFAULT_STROKE_WIDTH
  }
};



/**
 * Parses a GML source
 * @implements {os.parse.IParser<ol.Feature>}
 * @constructor
 */
os.ui.file.gml.GMLParser = function() {
  /**
   * @type {ol.format.GML2|ol.format.GML3}
   * @protected
   */
  this.format = new ol.format.GML3();

  /**
   * @type {?Array<Node>}
   * @protected
   */
  this.features = null;

  /**
   * If feature nodes should be validated for proper GML format
   * @type {boolean}
   * @protected
   */
  this.checkValidGML = false;

  /**
   * @type {ol.ProjectionLike}
   * @protected
   */
  this.dataProjection = null;

  /**
   * The index of the next feature to os.parse.
   * @type {number}
   * @protected
   */
  this.nextIndex = 0;
};


/**
 * Logger for os.ui.file.gml.GMLParser
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.gml.GMLParser.LOGGER_ = goog.log.getLogger('os.ui.file.gml.GMLParser');


/**
 * @param {boolean} value True to use GML2, false to use GML3
 */
os.ui.file.gml.GMLParser.prototype.useGML2Format = function(value) {
  this.format = value ? new ol.format.GML2() : new ol.format.GML3();
};


/**
 * @inheritDoc
 */
os.ui.file.gml.GMLParser.prototype.setSource = function(source) {
  this.features = null;
  this.nextIndex = 0;
  this.dataProjection = null;

  var doc;
  if (goog.isString(source)) {
    doc = goog.dom.xml.loadXml(source);
  } else if (source instanceof Document) {
    doc = source;
  }

  if (doc) {
    // read the data projection from the document, and assume there won't be multiple projections in a single response.
    // that would be incredibly dumb.
    var srsNode = doc.querySelector('[srsName]');
    if (srsNode) {
      try {
        this.dataProjection = this.format.readProjectionFromNode(doc);
      } catch (e) {
        goog.log.warning(os.ui.file.gml.GMLParser.LOGGER_, 'Failed reading projection from GML', e);
      }
    }

    // default to the parser feature projection
    if (!this.dataProjection) {
      this.dataProjection = this.getProjection();
    }

    var features = doc.querySelectorAll('featureMember, featureMembers');
    if (features && features.length > 0) {
      // convert the NodeList to an array (see MDN docs - they suggested this method)
      this.features = [].map.call(features, function(el) {
        return el;
      });

      if (this.checkValidGML) {
        this.validateFeatures();
      }
    }
  }
};


/**
 * Some GML sources omit the gml:_Feature tag under a gml:featureMember node. This cannot be parsed by OL3, so check
 * for this case and create the node if necessary.
 * @protected
 */
os.ui.file.gml.GMLParser.prototype.validateFeatures = function() {
  if (this.features) {
    var i = this.features.length;
    while (i--) {
      var node = this.features[i];
      if (node.localName == 'featureMember' && node.childNodes.length > 1) {
        var featureNode = os.xml.createElement('_Feature');
        var child;
        while ((child = goog.dom.getFirstElementChild(node))) {
          featureNode.appendChild(child);
        }

        node.appendChild(featureNode);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.file.gml.GMLParser.prototype.cleanup = function() {
  this.features = null;
  this.nextIndex = 0;
};


/**
 * @inheritDoc
 */
os.ui.file.gml.GMLParser.prototype.hasNext = function() {
  return this.features != null && this.features.length > this.nextIndex;
};


/**
 * @return {!ol.ProjectionLike}
 * @protected
 */
os.ui.file.gml.GMLParser.prototype.getProjection = function() {
  return /** @type {!ol.proj.Projection} */ (ol.proj.get('EPSG:4326'));
};


/**
 * @inheritDoc
 */
os.ui.file.gml.GMLParser.prototype.parseNext = function() {
  var result = null;

  // unshift is very slow in browsers other than Chrome, so leave the array intact while parsing
  var nextFeature = this.features[this.nextIndex++];
  if (nextFeature) {
    try {
      result = this.format.readFeatures(nextFeature, {
        dataProjection: this.dataProjection,
        featureProjection: this.getProjection()
      });

      if (result != null) {
        // featureMember returns a single feature, featureMembers an array
        if (result instanceof ol.Feature) {
          result = [result];
        }

        result.forEach(function(feature) {
          // force the default OL3 geometry field
          var geomName = feature.getGeometryName();
          var geometry = feature.getGeometry();
          if (geomName && geomName != 'geometry' && geometry) {
            feature.setGeometryName('geometry');
            feature.setGeometry(geometry);
          }

          // test for feature color in the styleVariation field
          var styleVariation = feature.get('styleVariation');
          if (os.color.isColorString(styleVariation)) {
            var config = {};
            os.style.mergeConfig(os.ui.file.gml.DEFAULT_STYLE, config);

            var imageConfig = config[os.style.StyleField.IMAGE];
            var color = os.style.toRgbaString(/** @type {string} */ (styleVariation));
            imageConfig[os.style.StyleField.COLOR] = color; // icon color
            imageConfig[os.style.StyleField.FILL][os.style.StyleField.COLOR] = color; // center color

            var strokeConfig = config[os.style.StyleField.STROKE];
            strokeConfig[os.style.StyleField.COLOR] = color; // line color
            feature.set(os.style.StyleType.FEATURE, config, true);
            feature.set(os.style.StyleField.SHAPE, 'circle');
          }
        });
      }
    } catch (e) {
      goog.log.error(os.ui.file.gml.GMLParser.LOGGER_, 'Failed reading feature from GML', e);
      this.features.length = 0;
    }
  }

  if (result && result.length == 1) {
    return result[0];
  } else {
    return result;
  }
};
