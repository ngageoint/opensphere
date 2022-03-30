goog.declareModuleId('os.ui.file.gml.GMLParser');

import Feature from 'ol/src/Feature.js';
import GML2 from 'ol/src/format/GML2.js';
import GML3 from 'ol/src/format/GML3.js';
import {get as getProjection} from 'ol/src/proj.js';

import {isColorString} from '../../../color.js';
import {getText} from '../../../file/mime/text.js';
import * as osStyle from '../../../style/style.js';

import StyleField from '../../../style/stylefield.js';
import StyleType from '../../../style/styletype.js';
import {createElement} from '../../../xml.js';

const {getFirstElementChild} = goog.require('goog.dom');
const {loadXml} = goog.require('goog.dom.xml');
const log = goog.require('goog.log');

const {default: IParser} = goog.requireType('os.parse.IParser');


/**
 * The default GML style
 * @type {Object<string, *>}
 */
const DEFAULT_STYLE = {
  'image': {
    'type': 'circle',
    'color': osStyle.DEFAULT_LAYER_COLOR,
    'fill': {
      'color': osStyle.DEFAULT_LAYER_COLOR
    }
  },
  'stroke': {
    'color': osStyle.DEFAULT_LAYER_COLOR,
    'width': osStyle.DEFAULT_STROKE_WIDTH
  }
};

/**
 * Parses a GML source
 *
 * @implements {IParser<Feature>}
 */
export default class GMLParser {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {GML2|GML3}
     * @protected
     */
    this.format = new GML3();

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
  }

  /**
   * @param {boolean} value True to use GML2, false to use GML3
   */
  useGML2Format(value) {
    this.format = value ? new GML2() : new GML3();
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    this.features = null;
    this.nextIndex = 0;
    this.dataProjection = null;

    if (source instanceof ArrayBuffer) {
      source = getText(source) || null;
    }

    var doc;
    if (typeof source === 'string') {
      doc = loadXml(source);
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
          log.warning(logger, 'Failed reading projection from GML', e);
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
  }

  /**
   * Some GML sources omit the gml:_Feature tag under a gml:featureMember node. This cannot be parsed by OL3, so check
   * for this case and create the node if necessary.
   *
   * @protected
   */
  validateFeatures() {
    if (this.features) {
      var i = this.features.length;
      while (i--) {
        var node = this.features[i];
        if (node.localName == 'featureMember' && node.childNodes.length > 1) {
          var featureNode = createElement('_Feature');
          var child;
          while ((child = getFirstElementChild(node))) {
            featureNode.appendChild(child);
          }

          node.appendChild(featureNode);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.features = null;
    this.nextIndex = 0;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.features != null && this.features.length > this.nextIndex;
  }

  /**
   * @return {!ol.ProjectionLike}
   * @protected
   */
  getProjection() {
    return /** @type {!Projection} */ (getProjection('EPSG:4326'));
  }

  /**
   * @inheritDoc
   */
  parseNext() {
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
          if (result instanceof Feature) {
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
            if (isColorString(styleVariation)) {
              var config = {};
              osStyle.mergeConfig(DEFAULT_STYLE, config);

              var imageConfig = config[StyleField.IMAGE];
              var color = osStyle.toRgbaString(/** @type {string} */ (styleVariation));
              imageConfig[StyleField.COLOR] = color; // icon color
              imageConfig[StyleField.FILL][StyleField.COLOR] = color; // center color

              var strokeConfig = config[StyleField.STROKE];
              strokeConfig[StyleField.COLOR] = color; // line color
              feature.set(StyleType.FEATURE, config, true);
              feature.set(StyleField.SHAPE, 'circle');
            }
          });
        }
      } catch (e) {
        log.error(logger, 'Failed reading feature from GML', e);
        this.features.length = 0;
      }
    }

    if (result && result.length == 1) {
      return result[0];
    } else {
      return result;
    }
  }
}

/**
 * Logger for os.ui.file.gml.GMLParser
 * @type {log.Logger}
 */
const logger = log.getLogger('os.ui.file.gml.GMLParser');
