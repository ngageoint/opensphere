goog.provide('os.ui.filter.parse.FilterParser');

goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('os.filter.FilterEntry');
goog.require('os.parse.IParser');
goog.require('os.ui.filter');



/**
 * Parses XML filter data to create filter entries.
 * @implements {os.parse.IParser}
 * @constructor
 */
os.ui.filter.parse.FilterParser = function() {
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
};


/**
 * @inheritDoc
 */
os.ui.filter.parse.FilterParser.prototype.setSource = function(source) {
  if (source instanceof ArrayBuffer) {
    source = os.file.mime.text.getText(source) || null;
  }

  if (source instanceof Document) {
    this.document_ = /** @type {Document} */ (source);
  } else if (goog.isString(source)) {
    this.document_ = goog.dom.xml.loadXml(source);
  }
};


/**
 * @inheritDoc
 */
os.ui.filter.parse.FilterParser.prototype.cleanup = function() {
  this.document_ = null;
  this.filterDedupMap_ = null;
};


/**
 * @inheritDoc
 */
os.ui.filter.parse.FilterParser.prototype.hasNext = function() {
  return goog.isDefAndNotNull(this.document_);
};


/**
 * @inheritDoc
 */
os.ui.filter.parse.FilterParser.prototype.parseNext = function() {
  if (this.document_) {
    var filters = null;
    var firstChild = goog.dom.getFirstElementChild(this.document_);
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
};


/**
 * Extracts filter data from a set of filters or a state file.
 * @param {Element} ele The element to extract filters from
 * @return {Array<os.filter.FilterEntry>}
 */
os.ui.filter.parse.FilterParser.prototype.extractFromFilters = function(ele) {
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
};


/**
 * Takes an XML filter element and turns it into a set of os.filter.FilterEntry's for the appropriate layers.
 * @param {Element} el
 * @return {?Array<os.filter.FilterEntry>}
 */
os.ui.filter.parse.FilterParser.prototype.elToEntries = function(el) {
  var entry = null;
  var entries = [];
  var children = goog.dom.getChildren(el);

  if (children && children.length > 0) {
    var name = /** @type {string} */ (el.getAttribute('title')) || '';
    var match = /** @type {?string} */ (el.getAttribute('match'));
    var type = /** @type {string} */ (el.getAttribute('type')) || '';
    var str = goog.dom.xml.serialize(children[0]);
    str = str.replace(/xmlns=("|')[^"']*("|')/g, '');
    str = str.replace(/ogc:/g, '');
    str = str.replace(/>\s+</g, '><');

    if (this.filterDedupMap_[str + name]) {
      // already found a filter with the same exact string and name, likely the same filter -- don't add it
      return null;
    }
    this.filterDedupMap_[str + name] = true;

    entry = new os.filter.FilterEntry();
    entry.setFilter(str);

    var types = os.ui.filter.getFilterableTypes(type);
    if (types.length > 0) {
      entry.setDescription(/** @type {?string} */ (el.getAttribute('description')));
      entry.setTitle(name);
      entry.setType(types[0]);
      entry.setEnabled(true);
      entry.setMatch(match ? match.toUpperCase() == 'AND' : true);
      entries.push(entry);

      for (var i = 1, ii = types.length; i < ii; i++) {
        var clone = entry.clone();
        clone.setId(goog.string.getRandomString());
        clone.setType(types[i]);
        entries.push(clone);
      }
    }
  }

  return entries.length > 0 ? entries : null;
};


/**
 * Extracts filter data from a PQS file.
 * @param {Element} ele The element to extract filters from
 * @return {Array<os.filter.FilterEntry>}
 */
os.ui.filter.parse.FilterParser.prototype.extractFromPQS = function(ele) {
  var attributeFilter = ele.querySelector('attributeFilter');
  var typeName = ele.querySelector('typeName');
  var entries = [];

  if (attributeFilter && typeName) {
    var filters = goog.dom.getChildren(attributeFilter) || [];
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
};


/**
 * Takes an XML filter element and turns it into a os.filter.FilterEntry.
 * @param {Element} el
 * @return {?os.filter.FilterEntry}
 */
os.ui.filter.parse.FilterParser.prototype.filterToEntry = function(el) {
  var entry = null;

  if (el) {
    var name = /** @type {string} */ (el.getAttribute('namehint')) || '';
    var str = goog.dom.xml.serialize(el);
    str = str.replace(/xmlns=("|')[^"']*("|')/g, '');
    str = str.replace(/ogc:/g, '');
    str = str.replace(/>\s+</g, '><');

    if (this.filterDedupMap_[str + name]) {
      // already found a filter with the same exact string and name, likely the same filter -- don't add it
      return null;
    }
    this.filterDedupMap_[str + name] = true;

    entry = new os.filter.FilterEntry();
    entry.setFilter(str);
    entry.setDescription(/** @type {?string} */ (el.getAttribute('description')) || '');
    entry.setTitle(name);
  }

  return entry;
};
