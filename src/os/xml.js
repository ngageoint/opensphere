goog.declareModuleId('os.xml');

import {getAllTextContent} from 'ol/src/xml.js';

const googArray = goog.require('goog.array');
const dom = goog.require('goog.dom');
const NodeType = goog.require('goog.dom.NodeType');
const googDomXml = goog.require('goog.dom.xml');
const googString = goog.require('goog.string');


/**
 * Default document used when creating new elements.
 * @type {Document}
 */
export const DOCUMENT = googDomXml.createDocument();

/**
 * KML namespace URI
 * @type {string}
 */
export const KMLNS = 'http://www.opengis.net/kml/2.2';

/**
 * KML namespace URI
 * @type {string}
 */
export const XMLNS = 'http://www.w3.org/2000/xmlns/';

/**
 * Escape invalid xml chars
 *
 * @param {string} text
 * @return {string} The escaped string
 */
export const escape = function(text) {
  if (typeof text === 'string') {
    text = text.replace(/\&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');
    text = text.replace(/'/g, '&#39;');
    text = text.replace(/"/g, '&quot;');
    text = text.replace(/\//g, '&#x2F;');
  }
  return text;
};

/**
 * Unescape invalid xml chars
 *
 * @param {string} text
 * @return {string} The escaped string
 */
export const unescape = function(text) {
  if (typeof text === 'string') {
    text = text.replace(/\&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&#39;/g, '\'');
    text = text.replace(/&quot;/g, '\"');
    text = text.replace(/&#x2F;/g, '/');
  }
  return text;
};

/**
 * Creates and appends an element to the provided parent. The parent's ownerDocument will be used to create the element.
 * Optionally add text content to the element.
 *
 * @param {string} tag The tag name for the new element
 * @param {!Element} parent The parent element
 * @param {*=} opt_content Text content to add to the element
 * @param {Object.<string, string>=} opt_attr Attributes to add to the element
 * @return {!Element} The element
 */
export const appendElement = function(tag, parent, opt_content, opt_attr) {
  var el = createElement(tag, parent.ownerDocument, opt_content, opt_attr);
  parent.appendChild(el);
  return el;
};

/**
 * Creates and appends a namespaced element to the provided parent. The parent's ownerDocument will be used to create
 * the element. Optionally add text content to the element.
 *
 * @param {string} tag The tag name for the new element
 * @param {string} nsUri The namespace uri
 * @param {!Element} parent The parent element
 * @param {*=} opt_content Text content to add to the element
 * @param {Object.<string, string>=} opt_attr Attributes to add to the element
 * @return {!Element} The element
 */
export const appendElementNS = function(tag, nsUri, parent, opt_content, opt_attr) {
  var el = createElementNS(tag, nsUri, parent.ownerDocument, opt_content, opt_attr);
  parent.appendChild(el);
  return el;
};

/**
 * Create an element from the provided document. Optionally add text content to the element.
 *
 * @param {string} tag The tag name for the new element
 * @param {Document=} opt_doc The root document
 * @param {*=} opt_content Text content to add to the element
 * @param {Object.<string, string>=} opt_attr Attributes to add to the element
 * @return {!Element} The element
 */
export const createElement = function(tag, opt_doc, opt_content, opt_attr) {
  var doc = opt_doc || DOCUMENT;
  var el = doc.createElement(tag);

  if (opt_attr != null) {
    googDomXml.setAttributes(el, opt_attr);
  }

  if (opt_content != null) {
    el.appendChild(doc.createTextNode(String(opt_content)));
  }

  return el;
};

/**
 * Create a namespaced element from the provided document. Optionally add text content to the element.
 *
 * @param {string} tag The tag name for the new element
 * @param {string} nsUri The namespace uri
 * @param {Document=} opt_doc The root document
 * @param {*=} opt_content Text content to add to the element
 * @param {Object.<string, string>=} opt_attr Attributes to add to the element
 * @return {!Element} The element
 */
export const createElementNS = function(tag, nsUri, opt_doc, opt_content, opt_attr) {
  var doc = opt_doc || DOCUMENT;
  var el = doc.createElementNS(nsUri, tag);

  if (opt_attr != null) {
    googDomXml.setAttributes(el, opt_attr);
  }

  if (opt_content != null) {
    el.appendChild(doc.createTextNode(String(opt_content)));
  }

  return el;
};

/**
 * Gets all child elements with a given tag name.
 *
 * @param {Element} element The parent element
 * @param {string} tag The tag name to match
 * @return {!Array} The matched children
 */
export const getChildrenByTagName = function(element, tag) {
  var children = dom.getChildren(element);
  return googArray.filter(children, function(node) {
    return node.localName == tag;
  });
};

/**
 * Reads a date/time from a node's content.
 *
 * @param {Node} node Node.
 * @return {Date} The parsed Date object, or null if the value could not be parsed.
 */
export const readDateTime = function(node) {
  // this should handle any ISO strings and is by far the fastest way to parse dates. if we run into time fields that
  // aren't being parsed correctly, be VERY careful with changes to this function and compare the difference in the
  // browser's CPU profiler. use a large (5MB+) KML with time fields as a test case.
  var text = getAllTextContent(node, true).trim();
  var date = new Date(text || undefined);
  return !isNaN(date.getTime()) ? date : null;
};

/**
 * Clones an element and all descendants under a new node, adding a namespace to the new nodes. The namespaceURI on
 * Nodes is frozen on creation, so the namespace cannot be changed on existing nodes.
 *
 * @param {!Node} node The element to clone
 * @param {!Element} parent The parent element
 * @param {string=} opt_ns The namespace
 * @param {string=} opt_nsUri The namespace uri
 * @return {Element} The element
 */
export const clone = function(node, parent, opt_ns, opt_nsUri) {
  if (node.nodeType === NodeType.TEXT) {
    var text = parent.ownerDocument.createTextNode(node.textContent);
    parent.appendChild(text);
  } else if (node.nodeType === NodeType.CDATA_SECTION) {
    var cdata = parent.ownerDocument.createCDATASection(node.textContent);
    parent.appendChild(cdata);
  } else if (node.nodeType === NodeType.ELEMENT) {
    var el = /** @type {Element} */ (node);

    var attrMap;
    if (el.hasAttributes()) {
      attrMap = {};

      var attrs = el.attributes;
      for (var i = 0, n = attrs.length; i < n; i++) {
        // THIN-8127: Keep the xmlns:ogc attribute from being duplicated as it will break FF and IE
        if (attrs[i].name != 'xmlns:ogc') {
          attrMap[attrs[i].name] = attrs[i].value;
        }
      }
    }

    var newEl = opt_ns && opt_nsUri ?
      appendElementNS(opt_ns + ':' + el.localName, opt_nsUri, parent, undefined, attrMap) :
      appendElement(el.localName, parent, undefined, attrMap);
    var children = el.childNodes;
    if (children && children.length > 0) {
      for (var i = 0, n = children.length; i < n; i++) {
        clone(children[i], newEl, opt_ns, opt_nsUri);
      }
    }

    return newEl;
  }

  return null;
};

/**
 * Serializes an XML document or subtree to string.
 *
 * @param {!(Document|Element)} xml The document or the root node of the subtree.
 * @return {string} The serialized document.
 */
export const serialize = function(xml) {
  // the XMLSerializer in FF adds empty xmlns attributes that cause problems with some XML parsers
  return googDomXml.serialize(xml).replace(/ xmlns=""/g, '');
};

/**
 * Retunrs the element.textContent if it's not null and not empty, otherwise defaultValue.
 *
 * @param {Element} element
 * @param {*} defaultValue
 * @return {*}
 */
export const getElementValueOrDefault = function(element, defaultValue) {
  if (element && !googString.isEmptyOrWhitespace(googString.makeSafe(element.textContent))) {
    return element.textContent;
  }
  return defaultValue;
};

/**
 * Get the `textContent` value for the first child matching a selector.
 *
 * @param {!Element} element The root element.
 * @param {string} selector The child selector.
 * @return {?string} The value.
 */
export const getChildValue = function(element, selector) {
  var child = element.querySelector(selector);
  if (child) {
    var value = googString.makeSafe(child.textContent);
    if (!googString.isEmptyOrWhitespace(value)) {
      return value;
    }
  }

  return null;
};

/**
 * Regex to globally find and replace all elements that look like xsi:*="*"
 * @type {RegExp}
 */
export const XSI_REGEX = /xsi:.*?=".*?"/gm;

/**
 * Wrapper for parsing XML documents for strings. This is needed for Firefox's overly anal interpretation of the
 * XML spec. It fails to parse documents if they fail to declare XML namespaces. For now, it only removes elements
 * with an xsi: namespace.
 *
 * @param {string} xml The text.
 * @return {Document} XML document from the text.
 */
export const loadXml = function(xml) {
  xml = xml.replace(XSI_REGEX, '');
  return googDomXml.loadXml(xml);
};
