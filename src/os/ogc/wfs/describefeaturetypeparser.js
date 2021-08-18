goog.module('os.ogc.wfs.DescribeFeatureTypeParser');
goog.module.declareLegacyNamespace();

const {getFirstElementChild} = goog.require('goog.dom');
const NodeType = goog.require('goog.dom.NodeType');
const {loadXml} = goog.require('goog.dom.xml');
const FeatureType = goog.require('os.ogc.wfs.FeatureType');


/**
 * @typedef {{type: !Element, complex: !Element}}
 */
let DescribeFeatureType;

/**
 */
class DescribeFeatureTypeParser {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {Array<DescribeFeatureType>}
     * @private
     */
    this.types_ = null;
  }

  /**
   * @param {string} source
   * @return {Array<FeatureType>}
   */
  parse(source) {
    var featureTypes = [];
    var doc = loadXml(source);
    var root = this.getRootNode_(doc);
    if (root) {
      if (!this.types_) {
        this.loadTypes_(root);
      }

      for (var i = 0, n = this.types_.length; i < n; i++) {
        var type = this.types_[i];
        var featureType = this.parseType_(type);
        if (featureType) {
          featureTypes.push(featureType);
        }
      }
    }

    return featureTypes;
  }

  /**
   * @param {Document} doc
   * @return {?Element}
   * @private
   */
  getRootNode_(doc) {
    for (var n = getFirstElementChild(doc); n !== null; n = n.nextSibling) {
      if (n.nodeType == NodeType.ELEMENT) {
        return /** @type {Element} */ (n);
      }
    }

    return null;
  }

  /**
   * @param {Element} root
   * @return {Array<DescribeFeatureType>}
   * @private
   */
  loadTypes_(root) {
    this.types_ = [];

    var elements = [];
    var types = [];
    for (var n = getFirstElementChild(root); n !== null; n = n.nextSibling) {
      if (n.nodeType == NodeType.ELEMENT) {
        if (n.localName == 'element') {
          elements.push(n);
        } else if (n.localName == 'complexType') {
          types.push(n);
        }
      }
    }

    for (var i = 0, n = elements.length; i < n; i++) {
      var element = elements[i];
      var complex = null;
      var name = /** @type {string} */ (element.getAttribute('name'));
      if (name) {
        var type = /** @type {string} */ (element.getAttribute('type'));
        if (type) {
          var nsIdx = type.indexOf(':');
          if (nsIdx != -1) {
            // try ripping of any namespace
            type = type.substr(nsIdx + 1);
          }

          for (var k = 0, l = types.length; k < l; k++) {
            var typeElement = types[k];
            if (type == /** @type {string} */ (typeElement.getAttribute('name'))) {
              complex = typeElement;
              break;
            }
          }
        }
      }

      if (element && complex) {
        this.types_.push({element: element, complex: complex});
      }
    }

    return types;
  }

  /**
   * @param {DescribeFeatureType} dft
   * @return {?FeatureType}
   * @private
   */
  parseType_(dft) {
    var featureType = null;
    var element = dft.element;
    var complexType = dft.complex;

    var typeName = /** @type {string} */ (element.getAttribute('name'));
    var isDynamic = false;

    var extension = complexType.querySelector('extension');
    if (extension && extension.getAttribute('base') == 'gml:DynamicFeatureType') {
      isDynamic = true;
    }

    var list = complexType.querySelectorAll('element');
    var columns = [];
    for (var i = 0, n = list.length; i < n; i++) {
      var item = list[i];
      var name = /** @type {string} */ (item.getAttribute('name'));
      var type = /** @type {string} */ (item.getAttribute('type'));
      if (!type) {
        var simpleType = item.querySelector('simpleType');
        if (simpleType) {
          var restriction = simpleType.querySelector('restriction');
          if (restriction) {
            type = /** @type {string} */ (restriction.getAttribute('base'));
          }
        }
      }

      if (name && type) {
        // Remove namespaces that we don't care about, which really means everything but gml.
        // This allows us to support WFS 1.0.0 DescribeFeatureType responses.
        var x = type.indexOf(':');
        if (x > -1) {
          var y = type.indexOf('gml:');

          if (y === -1) {
            type = type.substring(x + 1);
          }
        }

        for (var t in typeTests) {
          if (typeTests[t].test(type)) {
            type = t;
          }
        }

        columns.push({name: name, type: type});
      }
    }

    if (typeName) {
      featureType = new FeatureType(typeName, columns, isDynamic);
    }

    return featureType;
  }
}

/**
 * @type {Object<string, RegExp>}
 */
const typeTests = {
  'decimal': /^double$/i,
  'integer': /^(int|long)$/i,
  'string': /^bool(ean)?$/i
};

exports = DescribeFeatureTypeParser;
