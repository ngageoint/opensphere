goog.module('os.tag');
goog.module.declareLegacyNamespace();

const {getChildren} = goog.require('goog.dom');
const {getAllTextContent} = goog.require('ol.xml');
const {appendElement, createElement} = goog.require('os.xml');


/**
 * The default root node to use when converting to XML.
 * @type {string}
 */
const DEFAULT_XML_ROOT = 'tags';

/**
 * The default tag node to use when converting to XML.
 * @type {string}
 */
const DEFAULT_XML_TAG = 'tag';

/**
 * Converts a string to an array of tags.
 *
 * @param {?string} str The string
 * @return {Array<string>} The tag array
 */
const tagsFromString = function(str) {
  // trim the string first to remove leading/trailing whitespace from the tags. the regex will remove intermediate
  // whitespace around the commas.
  return str ? str.trim().split(/\s*,\s*/) : null;
};

/**
 * Converts an array of tags to a string.
 *
 * @param {Array<string>} tags The tag array
 * @return {string} The tag string
 */
const stringFromTags = function(tags) {
  if (tags) {
    return tags.join(', ');
  }

  return '';
};

/**
 * Converts a DOM element to a tag string
 *
 * @param {Element} node The element
 * @return {string} The tag string
 */
const stringFromXML = function(node) {
  return stringFromTags(tagsFromXML(node));
};

/**
 * Converts a DOM element to an array of tags.
 *
 * @param {Element} node The element
 * @return {Array<string>} The tag array
 */
const tagsFromXML = function(node) {
  var tags = null;

  if (node) {
    var children = getChildren(node);
    tags = [];

    for (var i = 0, n = children.length; i < n; i++) {
      tags.push(getAllTextContent(children[i], true).trim());
    }
  }

  return tags;
};

/**
 * Converts an array of tags to a DOM element.
 *
 * @param {Array<string>|string} tags The tag array
 * @param {string=} opt_tagName The tag name (defaults to 'tags')
 * @param {Document=} opt_doc The root document
 * @return {Element} The element
 */
const xmlFromTags = function(tags, opt_tagName, opt_doc) {
  var t;
  if (typeof tags === 'string') {
    t = tagsFromString(tags);
  } else if (tags) {
    t = tags;
  }

  if (t) {
    var name = opt_tagName || DEFAULT_XML_ROOT;
    var tagEl = createElement(name, opt_doc);
    for (var i = 0, n = t.length; i < n; i++) {
      appendElement(DEFAULT_XML_TAG, tagEl, t[i]);
    }

    return tagEl;
  }

  return null;
};

exports = {
  DEFAULT_XML_ROOT,
  DEFAULT_XML_TAG,
  tagsFromString,
  stringFromTags,
  stringFromXML,
  tagsFromXML,
  xmlFromTags
};
