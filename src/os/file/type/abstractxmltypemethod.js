goog.provide('os.file.type.AbstractXMLTypeMethod');

goog.require('goog.dom');
goog.require('os.file.IContentTypeMethod');
goog.require('os.xml');



/**
 * Generic type method for XML content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
os.file.type.AbstractXMLTypeMethod = function() {};


/**
 * @inheritDoc
 */
os.file.type.AbstractXMLTypeMethod.prototype.getContentType = function() {
  return 'text/xml';
};


/**
 * @inheritDoc
 */
os.file.type.AbstractXMLTypeMethod.prototype.getLayerType = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.file.type.AbstractXMLTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.file.type.AbstractXMLTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var content = file.getContent();

  // default XML content type method doesn't support zip content
  if (!opt_zipEntries && content) {
    var doc = null;
    try {
      // note: this won't work in IE < 9, but we don't support that anyway
      if (content instanceof Document) {
        doc = /** @type {Document} */ (content);
      } else if (goog.isString(content)) {
        doc = os.xml.loadXml(content);
      }
    } catch (e) {
      // parsing failed, not XML
    }

    if (this.isValidDocument_(doc)) {
      var firstChild = goog.dom.getFirstElementChild(doc);
      var uri = firstChild.namespaceURI;
      if (this.testURI(uri)) {
        return true;
      }

      var localName = firstChild.localName || firstChild.nodeName;
      if (localName && this.getRootRegExp().test(localName)) {
        return true;
      }

      return this.customMatch(doc);
    }
  }

  return false;
};


/**
 * Checks the uri for a matching type
 * @param {string} uri element type
 * @return {boolean}
 */
os.file.type.AbstractXMLTypeMethod.prototype.testURI = function(uri) {
  return uri != null && this.getNSRegExp().test(uri);
};


/**
 * Checks if the passed document was parsed correctly and has content.
 * @param {?Document} doc
 * @return {boolean}
 * @private
 */
os.file.type.AbstractXMLTypeMethod.prototype.isValidDocument_ = function(doc) {
  if (!goog.isDefAndNotNull(doc)) {
    return false;
  }

  var errors = doc.getElementsByTagName('parsererror');
  if (errors && errors.length > 0) {
    return false;
  }

  return !!goog.dom.getFirstElementChild(doc);
};


/**
 * Custom matching function for overriding classes.
 * @param {Document} doc
 * @return {boolean}
 * @protected
 */
os.file.type.AbstractXMLTypeMethod.prototype.customMatch = function(doc) {
  return false;
};


/**
 * A RegExp that runs against the namespace URIs to determine if this XML is the right type
 * @return {RegExp}
 * @protected
 */
os.file.type.AbstractXMLTypeMethod.prototype.getNSRegExp = goog.abstractMethod;


/**
 * A RegExp that runs against the root tag's localName to determine if this XML is the right type
 * @return {RegExp}
 * @protected
 */
os.file.type.AbstractXMLTypeMethod.prototype.getRootRegExp = goog.abstractMethod;
