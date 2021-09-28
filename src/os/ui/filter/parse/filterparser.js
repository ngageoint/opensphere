goog.declareModuleId('os.ui.filter.parse.FilterParser');

const {getFirstElementChild, getChildren} = goog.require('goog.dom');
const {loadXml, serialize} = goog.require('goog.dom.xml');
const {getText} = goog.require('os.file.mime.text');
const FilterEntry = goog.require('os.filter.FilterEntry');

const IParser = goog.requireType('os.parse.IParser');


/**
 * Parses XML filter data to create filter entries.
 *
 * @implements {IParser}
 */
export default class FilterParser {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {?Document}
     * @private
     */
    this.document_ = null;

    /**
     * @type {Object}
     * @private
     */
    this.filterDedupMap_ = {};
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    if (source instanceof ArrayBuffer) {
      source = getText(source) || null;
    }

    if (source instanceof Document) {
      this.document_ = /** @type {Document} */ (source);
    } else if (typeof source === 'string') {
      this.document_ = loadXml(source);
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.document_ = null;
    this.filterDedupMap_ = null;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.document_ != null;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    if (this.document_) {
      var filters = null;
      var firstChild = getFirstElementChild(this.document_);
      var localName = firstChild.localName ? firstChild.localName.toLowerCase() : '';
      this.document_ = null;

      if (localName == 'filters') {
        filters = this.extractFromFilters(firstChild);
      } else if (localName == 'state') {
        filters = this.extractFromFilters(firstChild);
      } else if (localName == 'pqs') {
        // separate extraction function due to different formatting
        filters = this.extractFromPQS(firstChild);
      }

      return filters;
    }

    return null;
  }

  /**
   * Extracts filter data from a set of filters or a state file.
   *
   * @param {Element} ele The element to extract filters from
   * @return {Array<FilterEntry>}
   */
  extractFromFilters(ele) {
    var filters = ele.querySelectorAll('filter');
    var entries = [];

    if (filters && filters.length > 0) {
      for (var i = 0; i < filters.length; i++) {
        var newEntries = this.elToEntries(filters[i]);
        if (newEntries) {
          entries = entries.concat(newEntries);
        }
      }
    }

    return entries;
  }

  /**
   * Takes an XML filter element and turns it into a set of FilterEntry's for the appropriate layers.
   *
   * @param {Element} el
   * @return {?Array<FilterEntry>}
   */
  elToEntries(el) {
    var entry = null;
    var entries = [];
    var children = getChildren(el);

    if (children && children.length > 0) {
      var name = /** @type {string} */ (el.getAttribute('title')) || '';
      var match = /** @type {?string} */ (el.getAttribute('match'));
      var type = /** @type {string} */ (el.getAttribute('type')) || '';
      var str = serialize(children[0]);
      str = str.replace(/xmlns=("|')[^"']*("|')/g, '');
      str = str.replace(/ogc:/g, '');
      str = str.replace(/>\s+</g, '><');

      if (this.filterDedupMap_[str + name]) {
        // already found a filter with the same exact string and name, likely the same filter -- don't add it
        return null;
      }
      this.filterDedupMap_[str + name] = true;

      entry = new FilterEntry();
      entry.setFilter(str);
      entry.setDescription(/** @type {?string} */ (el.getAttribute('description')));
      entry.setTitle(name);
      entry.setType(type);
      entry.setEnabled(true);
      entry.setMatch(match ? match.toUpperCase() == 'AND' : true);
      entries.push(entry);
    }

    return entries.length > 0 ? entries : null;
  }

  /**
   * Extracts filter data from a PQS file.
   *
   * @param {Element} ele The element to extract filters from
   * @return {Array<FilterEntry>}
   */
  extractFromPQS(ele) {
    var attributeFilter = ele.querySelector('attributeFilter');
    var typeName = ele.querySelector('typeName');
    var entries = [];

    if (attributeFilter && typeName) {
      var filters = getChildren(attributeFilter) || [];
      var type = typeName.textContent;
      for (var i = 0; i < filters.length; i++) {
        var entry = this.filterToEntry(filters[i]);
        if (entry) {
          entry.type = type;
          entries.push(entry);
        }
      }
    }

    return entries;
  }

  /**
   * Takes an XML filter element and turns it into a FilterEntry.
   *
   * @param {Element} el
   * @return {?FilterEntry}
   */
  filterToEntry(el) {
    var entry = null;

    if (el) {
      var name = /** @type {string} */ (el.getAttribute('namehint')) || '';
      var str = serialize(el);
      str = str.replace(/xmlns=("|')[^"']*("|')/g, '');
      str = str.replace(/ogc:/g, '');
      str = str.replace(/>\s+</g, '><');

      if (this.filterDedupMap_[str + name]) {
        // already found a filter with the same exact string and name, likely the same filter -- don't add it
        return null;
      }
      this.filterDedupMap_[str + name] = true;

      entry = new FilterEntry();
      entry.setFilter(str);
      entry.setDescription(/** @type {?string} */ (el.getAttribute('description')) || '');
      entry.setTitle(name);
    }

    return entry;
  }
}
