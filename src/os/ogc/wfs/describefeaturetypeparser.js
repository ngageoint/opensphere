goog.provide('os.ogc.wfs.DescribeFeatureTypeParser');

goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.ogc.wfs.FeatureType');


/**
 * @typedef {{type: !Element, complex: !Element}}
 */
os.ogc.wfs.DescribeFeatureType;



/**
 * @constructor
 */
os.ogc.wfs.DescribeFeatureTypeParser = function() {
  /**
   * @type {Array.<os.ogc.wfs.DescribeFeatureType>}
   * @private
   */
  this.types_ = null;
};


/**
 * @param {string} source
 * @return {Array.<os.ogc.wfs.FeatureType>}
 */
os.ogc.wfs.DescribeFeatureTypeParser.prototype.parse = function(source) {
  var featureTypes = [];
  var doc = goog.dom.xml.loadXml(source);
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
};


/**
 * @param {Document} doc
 * @return {?Element}
 * @private
 */
os.ogc.wfs.DescribeFeatureTypeParser.prototype.getRootNode_ = function(doc) {
  for (var n = goog.dom.getFirstElementChild(doc); !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      return /** @type {Element} */ (n);
    }
  }

  return null;
};


/**
 * @param {Element} root
 * @return {Array.<os.ogc.wfs.DescribeFeatureType>}
 * @private
 */
os.ogc.wfs.DescribeFeatureTypeParser.prototype.loadTypes_ = function(root) {
  this.types_ = [];

  var elements = [];
  var types = [];
  for (var n = goog.dom.getFirstElementChild(root); !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
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
};


/**
 * @type {Object<string, RegExp>}
 * @const
 * @private
 */
os.ogc.wfs.DescribeFeatureTypeParser.TYPES_ = {
  'decimal': /^double$/i,
  'integer': /^(int|long)$/i,
  'string': /^bool(ean)?$/i
};


/**
 * @param {os.ogc.wfs.DescribeFeatureType} dft
 * @return {?os.ogc.wfs.FeatureType}
 * @private
 */
os.ogc.wfs.DescribeFeatureTypeParser.prototype.parseType_ = function(dft) {
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

      var typeConverts = os.ogc.wfs.DescribeFeatureTypeParser.TYPES_;

      for (var t in typeConverts) {
        if (typeConverts[t].test(type)) {
          type = t;
        }
      }

      columns.push({name: name, type: type});
    }
  }

  if (typeName) {
    featureType = new os.ogc.wfs.FeatureType(typeName, columns, isDynamic);
  }

  return featureType;
};
