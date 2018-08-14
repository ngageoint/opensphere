goog.provide('os.parse.RssParser');

goog.require('goog.dom.xml');
goog.require('os.file.mime.text');
goog.require('os.parse.AsyncParser');
goog.require('os.parse.IParser');
goog.require('os.xml');



/**
 * Generic RSS parser that translates items from the RSS feed to JSON objects.
 * @extends {os.parse.AsyncParser}
 * @implements {os.parse.IParser<T>}
 * @constructor
 * @template T
 */
os.parse.RssParser = function() {
  os.parse.RssParser.base(this, 'constructor');

  /**
   * The RSS items to parse.
   * @type {NodeList}
   * @protected
   */
  this.items = null;

  /**
   * The index of the next item to parse.
   * @type {number}
   * @protected
   */
  this.nextIndex = 0;
};
goog.inherits(os.parse.RssParser, os.parse.AsyncParser);


/**
 * @inheritDoc
 */
os.parse.RssParser.prototype.cleanup = function() {
  this.items = null;
  this.nextIndex = 0;
};


/**
 * @inheritDoc
 */
os.parse.RssParser.prototype.hasNext = function() {
  return this.items != null && this.nextIndex < this.items.length;
};


/**
 * @inheritDoc
 */
os.parse.RssParser.prototype.setSource = function(source) {
  this.cleanup();

  if (source instanceof ArrayBuffer) {
    source = os.file.mime.text.getText(source) || null;
  }

  var doc;
  if (typeof source == 'string') {
    doc = goog.dom.xml.loadXml(source);
  } else if (source instanceof Document) {
    doc = source;
  }

  if (doc) {
    this.items = doc.querySelectorAll('channel > item');
  }
};


/**
 * @inheritDoc
 */
os.parse.RssParser.prototype.parseNext = function() {
  // unshift is very slow in browsers other than Chrome, so leave the list intact while parsing
  var item = this.items[this.nextIndex++];
  if (item) {
    return this.parseItem(item);
  }

  return null;
};


/**
 * Parses an RSS `item` element.
 * @param {!Element} item The RSS item element.
 * @return {T} The parsed item.
 * @protected
 */
os.parse.RssParser.prototype.parseItem = function(item) {
  var result = {};

  var children = goog.dom.getChildren(item);
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child) {
      var value = os.xml.getElementValueOrDefault(child, '');
      if (child.prefix) {
        result[child.prefix] = result[child.prefix] || {};
        result[child.prefix][child.localName] = value;
      } else {
        result[child.localName] = value;
      }
    }
  }

  return result;
};
