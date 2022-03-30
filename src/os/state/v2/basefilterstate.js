goog.declareModuleId('os.state.v2.BaseFilter');

import {find} from 'ol/src/array.js';

import {forEach} from '../../array/array.js';
import FilterEntry from '../../filter/filterentry.js';
import {getFilterManager, getQueryManager} from '../../query/queryinstance.js';
import {XMLNS, appendElement, clone as cloneXml} from '../../xml.js';
import AbstractState from '../abstractstate.js';
import XMLState from '../xmlstate.js';
import FilterTag from './filtertag.js';

const {getChildren, getFirstElementChild} = goog.require('goog.dom');
const {loadXml, serialize} = goog.require('goog.dom.xml');

const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 */
export default class BaseFilter extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.description = 'Saves the current filters';
    this.priority = 90;
    this.rootName = FilterTag.FILTERS;
    this.title = 'Filters';

    /**
     * @type {Array<!VectorSource>}
     * @protected
     */
    this.sources = null;
  }

  /**
   * Get the layer id for the filter.
   *
   * @param {!Element} el The element
   * @param {string} stateId The state id
   * @return {string} The layer id
   * @protected
   */
  getLayerId(el, stateId) {
    var id = String(el.getAttribute('urlKey') || el.getAttribute('type'));
    return AbstractState.createId(stateId, id);
  }

  /**
   * Convert an XML filter to a FilterEntry
   *
   * @param {!Element} el The element
   * @return {FilterEntry} The filter entry
   * @protected
   */
  xmlToFilter(el) {
    var entry = null;

    var children = getChildren(el);
    if (children && children.length > 0) {
      entry = new FilterEntry();

      var str = serialize(children[0]);
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
  }

  /**
   * @param {Array<!VectorSource>} sources
   */
  setSources(sources) {
    this.sources = sources;
  }

  /**
   * @return {Array<!VectorSource>}
   */
  getSources() {
    return this.sources;
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    try {
      rootObj.setAttributeNS(XMLNS, 'xmlns:ogc', BaseFilter.OGC_NS);
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
  }

  /**
   * @param {!Element} rootObj
   * @param {string=} opt_sourceId
   */
  processFilters(rootObj, opt_sourceId) {
    if (getFilterManager().hasEnabledFilters(opt_sourceId)) {
      var filters = getFilterManager().getFilters(opt_sourceId);
      for (var j = 0, m = filters.length; j < m; j++) {
        var entry = filters[j];
        if (entry && getFilterManager().isEnabled(entry)) {
          var grouping = getQueryManager().isAnd(entry, opt_sourceId) ? 'AND' : 'OR';
          var filter = entry.getFilter();
          if (filter) {
            var filterDoc = loadXml(filter);
            if (filterDoc && getFirstElementChild(filterDoc)) {
              var node = /** @type {Node} */ (getFirstElementChild(filterDoc));
              if (node) {
                var ogcFilterDoc = cloneXml(node, rootObj, 'ogc', BaseFilter.OGC_NS);
                if (ogcFilterDoc) {
                  var filterEl = appendElement(FilterTag.FILTER, rootObj, undefined, {
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
  }

  /**
   * @inheritDoc
   */
  remove(id) {}

  /**
   * If a layer is tied to a filter, but the filter isnt tied to the layer, duplicate the filter for that layer
   * This was to support state files when filters applied to any layer it could (THIN-7215)
   *
   * @param {!Element} el
   */
  static preload(el) {
    var filtersNode = el.querySelector('filters');
    var entries = el.querySelector('queryEntries');
    if (filtersNode !== undefined && entries !== undefined) {
      entries = entries ? entries.getElementsByTagName('queryEntry') : [];

      forEach(entries, function(entry) {
        var filterId = entry.getAttribute('filterId');
        var layerId = entry.getAttribute('layerId');
        var cloneId = filterId + '_' + layerId;

        var filters = /** @type {Array} */ (filtersNode ? filtersNode.getElementsByTagName('filter') : []);
        // Does this filterid exist for this layer
        var found = find(filters, function(filter) {
          return filter.getAttribute('id') == filterId && filter.getAttribute('type') == layerId ||
              filter.getAttribute('id') == cloneId && filter.getAttribute('type') == layerId;
        });
        if (!found) {
          var similiar = find(filters, function(filter) {
            return filter.getAttribute('id') == filterId;
          });
          if (similiar) {
            var clone = cloneXml(similiar, /** @type {!Element} */(filtersNode));
            clone.setAttribute('id', cloneId);
            clone.setAttribute('type', layerId);
            // Since we changed the id for the filter, update the query entry
            entry.setAttribute('filterId', cloneId);
          }
        }
      });
    }
  }
}

/**
 * OGC namespace URI
 * @type {string}
 * @const
 */
BaseFilter.OGC_NS = 'http://www.opengis.net/ogc';
