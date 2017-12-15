goog.provide('os.state.v2.BaseFilter');
goog.provide('os.state.v2.FilterTag');
goog.require('goog.dom.xml');
goog.require('os.filter.FilterEntry');
goog.require('os.state.XMLState');
goog.require('os.xml');


/**
 * XML tags for filter state
 * @enum {string}
 * @const
 */
os.state.v2.FilterTag = {
  FILTERS: 'filters',
  FILTER: 'filter'
};



/**
 * @extends {os.state.XMLState}
 * @constructor
 */
os.state.v2.BaseFilter = function() {
  os.state.v2.BaseFilter.base(this, 'constructor');

  this.description = 'Saves the current filters';
  this.priority = 90;
  this.rootName = os.state.v2.FilterTag.FILTERS;
  this.title = 'Filters';

  /**
   * @type {!Array.<!Element>}
   */
  this.filters = [];
};
goog.inherits(os.state.v2.BaseFilter, os.state.XMLState);


/**
 * OGC namespace URI
 * @type {string}
 * @const
 */
os.state.v2.BaseFilter.OGC_NS = 'http://www.opengis.net/ogc';


/**
 * If a layer it tied to a filter, but the filter isnt tied to the layer, duplicate the filter for that layer
 * This was to support state files when filters applied to any layer it could (THIN-7215)
 * @param {!Element} el
 */
os.state.v2.BaseFilter.preload = function(el) {
  var filtersNode = el.querySelector('filters');
  var entries = el.querySelector('queryEntries');
  if (goog.isDef(filtersNode) && goog.isDef(entries)) {
    entries = entries ? entries.getElementsByTagName('queryEntry') : [];

    goog.array.forEach(entries, function(entry) {
      var filterId = entry.getAttribute('filterId');
      var layerId = entry.getAttribute('layerId');
      var cloneId = filterId + '_' + layerId;

      var filters = filtersNode ? filtersNode.getElementsByTagName('filter') : [];
      // Does this filterid exist for this layer
      var found = goog.array.find(filters, function(filter) {
        return filter.getAttribute('id') == filterId && filter.getAttribute('type') == layerId ||
            filter.getAttribute('id') == cloneId && filter.getAttribute('type') == layerId;
      });
      if (!found) {
        var similiar = goog.array.find(filters, function(filter) {
          return filter.getAttribute('id') == filterId;
        });
        if (similiar) {
          var clone = os.xml.clone(similiar, /** @type {!Element} */(filtersNode));
          clone.setAttribute('id', cloneId);
          clone.setAttribute('type', layerId);
          // Since we changed the id for the filter, update the query entry
          entry.setAttribute('filterId', cloneId);
        }
      }
    });
  }
};


/**
 * Get the layer id for the filter.
 * @param {!Element} el The element
 * @param {string} stateId The state id
 * @return {string} The layer id
 * @protected
 */
os.state.v2.BaseFilter.prototype.getLayerId = function(el, stateId) {
  var id = String(el.getAttribute('urlKey') || el.getAttribute('type'));
  return os.state.AbstractState.createId(stateId, id);
};


/**
 * Convert an XML filter to a FilterEntry
 * @param {!Element} el The element
 * @return {os.filter.FilterEntry} The filter entry
 * @protected
 */
os.state.v2.BaseFilter.prototype.xmlToFilter = function(el) {
  var entry = null;

  var children = goog.dom.getChildren(el);
  if (children && children.length > 0) {
    entry = new os.filter.FilterEntry();

    var str = goog.dom.xml.serialize(children[0]);
    str = str.replace(/xmlns=("|')[^"']*("|')/g, '');
    str = str.replace(/ogc:/g, '');
    str = str.replace(/>\s+</g, '><');
    entry.setFilter(str);

    entry.setMatch(/** @type {string} */ (el.getAttribute('match')) === 'AND');
    entry.setId(/** @type {string} */ (el.getAttribute('id')));
    entry.setDescription(/** @type {?string} */ (el.getAttribute('description')));
    entry.setTitle(/** @type {string} */ (el.getAttribute('title')));
    entry.type = el.getAttribute('type') || '';
  }

  return entry;
};


/**
 * @param {!Array.<!os.source.Vector>} sources
 */
os.state.v2.BaseFilter.prototype.setSources = function(sources) {
  this.sources = sources;
};


/**
 * @return {!Array.<!os.source.Vector>}
 */
os.state.v2.BaseFilter.prototype.getSources = function() {
  return this.sources;
};


/**
 * @inheritDoc
 */
os.state.v2.BaseFilter.prototype.saveInternal = function(options, rootObj) {
  try {
    rootObj.setAttributeNS(os.xml.XMLNS, 'xmlns:ogc', os.state.v2.BaseFilter.OGC_NS);
    var sources = this.getSources();
    if (sources) {
      for (var i = 0, n = sources.length; i < n; i++) {
        var source = sources[i];
        this.processFilters(rootObj, source.getId());
      }
    } else {
      this.processFilters(rootObj);
    }

    this.saveComplete(options, rootObj);
  } catch (e) {
    this.saveFailed(e.message || 'Unspecified error.');
  }
};


/**
 * @param {!Element} rootObj
 * @param {string=} opt_sourceId
 */
os.state.v2.BaseFilter.prototype.processFilters = function(rootObj, opt_sourceId) {
  if (os.ui.filterManager.hasEnabledFilters(opt_sourceId)) {
    var filters = os.ui.filterManager.getFilters(opt_sourceId);
    for (var j = 0, m = filters.length; j < m; j++) {
      var entry = filters[j];
      if (entry && os.ui.filterManager.isEnabled(entry)) {
        var grouping = os.ui.queryManager.isAnd(entry, opt_sourceId) ? 'AND' : 'OR';
        var filter = entry.getFilter();
        if (filter) {
          var filterDoc = goog.dom.xml.loadXml(filter);
          if (filterDoc && goog.dom.getFirstElementChild(filterDoc)) {
            var node = /** @type {Node} */ (goog.dom.getFirstElementChild(filterDoc));
            if (node) {
              var ogcFilterDoc = os.xml.clone(node, rootObj, 'ogc', os.state.v2.BaseFilter.OGC_NS);
              if (ogcFilterDoc) {
                var filterEl = os.xml.appendElement(os.state.v2.FilterTag.FILTER, rootObj, undefined, {
                  'id': entry.getId(),
                  'active': true,
                  'filterType': 'single',
                  'title': entry.getTitle(),
                  'description': entry.getDescription() || '',
                  'type': opt_sourceId || entry.getType(),
                  'match': grouping
                });
                filterEl.appendChild(ogcFilterDoc);
              }
            }
          }
        }
      }
    }
  }
};
