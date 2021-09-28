goog.declareModuleId('os.parse.RssParser');

import {getText} from '../../file/mime/text.js';
import {getElementValueOrDefault} from '../../xml.js';
import AsyncParser from '../asyncparser.js';

const {getChildren} = goog.require('goog.dom');
const {loadXml} = goog.require('goog.dom.xml');

const {default: IParser} = goog.requireType('os.parse.IParser');


/**
 * Generic RSS parser that translates items from the RSS feed to JSON objects.
 *
 * @implements {IParser<T>}
 * @template T
 */
export default class RssParser extends AsyncParser {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.items = null;
    this.nextIndex = 0;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.items != null && this.nextIndex < this.items.length;
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    this.cleanup();

    if (source instanceof ArrayBuffer) {
      source = getText(source) || null;
    }

    var doc;
    if (typeof source == 'string') {
      doc = loadXml(source);
    } else if (source instanceof Document) {
      doc = source;
    }

    if (doc) {
      this.items = doc.querySelectorAll('channel > item');
    }
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    // unshift is very slow in browsers other than Chrome, so leave the list intact while parsing
    var item = this.items[this.nextIndex++];
    if (item) {
      return this.parseItem(item);
    }

    return null;
  }

  /**
   * Parses an RSS `item` element.
   *
   * @param {!Element} item The RSS item element.
   * @return {T} The parsed item.
   * @protected
   */
  parseItem(item) {
    var result = {};

    var children = getChildren(item);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child) {
        var value = getElementValueOrDefault(child, '');
        if (child.prefix) {
          result[child.prefix] = result[child.prefix] || {};
          result[child.prefix][child.localName] = value;
        } else {
          result[child.localName] = value;
        }
      }
    }

    return result;
  }
}
