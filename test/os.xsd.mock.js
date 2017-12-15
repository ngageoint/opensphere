goog.provide('os.test.xsd');
goog.require('goog.dom.xml');
goog.require('goog.labs.net.xhr');
goog.require('os.xml');


/**
 * Array of loaded state xsd files.
 * @type {?Array<string>}
 * @private
 */
os.test.xsd.stateCache_ = null;


/**
 * Substitutes an xs:import and include schemaLocation content with
 * object.newLocation where the schemaLocation attibute == object.originalLocation
 * @param {string} xsd
 * @param {Array<Object>} substutions {originalLocation:?, newLocation:?}
 * @return {string}
 */
os.test.xsd.substituteImports = function(xsd, substutions) {
  var xsdDoc = goog.dom.xml.loadXml(xsd);
  var node;
  var sub;
  var i;
  var x;

  var imports = os.xml.getChildrenByTagName(xsdDoc.firstElementChild, 'import');
  imports = imports.concat(os.xml.getChildrenByTagName(xsdDoc.firstElementChild, 'include'));
  imports = imports.concat(os.xml.getChildrenByTagName(xsdDoc.firstElementChild, 'redefine'));
  for (i = 0; i < imports.length; i++) {
    node = imports[i];
    for (x = 0; x < substutions.length; x++) {
      sub = substutions[x];
      if (node.getAttribute('schemaLocation') === sub.originalLocation) {
        goog.dom.xml.setAttributes(node, {'schemaLocation': sub.newLocation});
      }
    }
  }
  return os.xml.serialize(xsdDoc);
};


/**
 * Loads the xsd schema files required for state.xsd
 * schema and resolves with an array of strings with the
 * schema files which can be used with xmllint.
 * @return {goog.promise}
 */
os.test.xsd.loadStateXsdFiles = function() {
  var stateFileRoot = '/base/node_modules/opensphere-state-schema/src/main/xsd/';
  var p = goog.Promise.withResolver();

  // retun the cached result, if it exists.
  if (os.test.xsd.stateCache_) {
    p.resolve(os.test.xsd.stateCache_);
    return p.promise;
  }

  var xsdPromises = [
    goog.labs.net.xhr.get(stateFileRoot + 'xlink/1.0.0/xlinks.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'gml/2.1.2/geometry.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'kml/2.2.0/atom-author-link.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'kml/2.2.0/xAL.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'kml/2.2.0/ogckml22.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'filter/1.0.0/expr.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'filter/1.0.0/filter.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'state/1.0.0/filter-restriction.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'state/1.0.0/filter-extended.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'state/1.0.0/types.xsd'),
    goog.labs.net.xhr.get(stateFileRoot + 'state/1.0.0/state.xsd')
  ];
  /**
  * NOTE: xmllint does not support loading any embeded
  * import or include references, however, xmllint can be used
  * by loading all the required referenced schema files then replacing
  * the references to the specific schemas with a file_[idx].xsd, where
  * idx is the array index of the referenced schema file.
  */
  var subs = [{
    originalLocation: 'types.xsd',
    newLocation: 'file_9.xsd'
  },
  {
    originalLocation: '../../kml/2.2.0/ogckml22.xsd',
    newLocation: 'file_4.xsd'
  },
  {
    originalLocation: '../../filter/1.0.0/filter.xsd',
    newLocation: 'file_6.xsd'
  },
  {
    originalLocation: 'atom-author-link.xsd',
    newLocation: 'file_2.xsd'
  },
  {
    originalLocation: 'xAL.xsd',
    newLocation: 'file_3.xsd'
  },
  {
    originalLocation: '../../xlink/1.0.0/xlinks.xsd',
    newLocation: 'file_0.xsd'
  },
  {
    originalLocation: 'expr.xsd',
    newLocation: 'file_5.xsd'
  },
  {
    originalLocation: '../../gml/2.1.2/geometry.xsd',
    newLocation: 'file_1.xsd'
  },
  {
    originalLocation: 'filter-restriction.xsd',
    newLocation: 'file_7.xsd'
  },
  {
    originalLocation: 'filter-extended.xsd',
    newLocation: 'file_8.xsd'
  }];

  goog.Promise.all(xsdPromises).then(function(result) {
    for (var v = 0; v < result.length; v++) {
      result[v] = os.test.xsd.substituteImports(result[v], subs);
    }
    os.test.xsd.stateCache_ = result;
    p.resolve(result);
  }, function(err) {
    p.reject(err);
  });

  return p.promise;
};
