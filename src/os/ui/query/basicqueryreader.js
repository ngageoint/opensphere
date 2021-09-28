goog.declareModuleId('os.ui.query.BasicQueryReader');

import BaseFilterManager from '../../filter/basefiltermanager.js';
import FilterEntry from '../../filter/filterentry.js';
import {METHOD_FIELD} from '../../interpolate.js';
import Method from '../../interpolatemethod.js';
import {getAreaManager, getQueryManager} from '../../query/queryinstance.js';
import {unescape as xmlUnescape} from '../../xml.js';
import {OPERATIONS} from '../filter/filter.js';
import AbstractQueryReader from './abstractqueryreader.js';

const {some} = goog.require('goog.array');
const {assert} = goog.require('goog.asserts');
const {assertIsElement} = goog.require('goog.asserts.dom');
const {getChildren, getFirstElementChild, getNextElementSibling, getParentElement} = goog.require('goog.dom');
const {serialize} = goog.require('goog.dom.xml');


/**
 * Reader for queries written out by the pre-combinator filter/area handlers.
 */
export default class BasicQueryReader extends AbstractQueryReader {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Array of all inclusion entries found when the query is parsed.
     * @type {?Array}
     * @private
     */
    this.entries_ = null;

    /**
     * Array of all exclusion entries found when the query is parsed. These never have filters associated to them.
     * @type {?Array}
     * @private
     */
    this.excEntries_ = null;
  }

  /**
   * @inheritDoc
   */
  parseEntries() {
    assert(this.filter, 'No filter provided!');

    this.entries_ = [];
    this.excEntries_ = [];

    this.parseEntries_(this.filter);
    if (this.entries_.length > 0 || this.excEntries_.length > 0) {
      getQueryManager().addEntries(this.entries_.concat(this.excEntries_));
    }
  }

  /**
   * Traverses the tree to parse entries from a combinator-written filter.
   *
   * @param {Element} ele
   * @private
   */
  parseEntries_(ele) {
    assert(this.layerId, 'No layer ID provided!');
    var layerId = /** @type {!string} */ (this.layerId);
    var child = getFirstElementChild(ele);
    var children = getChildren(ele);
    var next = null;

    // if the element has a namehint or a description, it's a filter entry
    var isFilter = Boolean(ele.getAttribute('namehint') || ele.getAttribute('description'));

    if (!isFilter) {
      // if any of the children match any of the ops, then ele is a filter entry
      isFilter = some(children, function(item) {
        return OPERATIONS.some(function(op) {
          return op.matches(angular.element(item));
        });
      });
    }

    // test to see if its an area
    if (ele.localName == 'BBOX' || ele.localName == 'Intersects') {
      var areaEle = ele.querySelector('MultiPolygon') || ele.querySelector('Envelope') || ele.querySelector('Polygon');
      assertIsElement(areaEle);
      var area = AbstractQueryReader.parseArea(areaEle);
      if (area) {
        var title = xmlUnescape(ele.getAttribute('areanamehint') || ele.getAttribute('namehint') || 'New Area');
        area.set('title', title);
        area.set('description', xmlUnescape(ele.getAttribute('description')));
        if (ele.getAttribute('id')) {
          area.setId(xmlUnescape(ele.getAttribute('id')));
        }
        area.set('shown', true);
        area.set(METHOD_FIELD, Method.NONE);
        getAreaManager().add(area);

        var entry = {
          'layerId': layerId,
          'areaId': area.getId(),
          'filterId': '*',
          'includeArea': true,
          'filterGroup': true,
          'temp': true
        };
        this.entries_.push(entry);
      }
      child = null;
    }
    if (ele.localName == 'Disjoint') {
      var excAreaEle = ele.querySelector('MultiPolygon') || ele.querySelector('Envelope') ||
          ele.querySelector('Polygon');
      assertIsElement(excAreaEle);
      var excArea = AbstractQueryReader.parseArea(excAreaEle);
      if (excArea) {
        var title = xmlUnescape(ele.getAttribute('areanamehint') || ele.getAttribute('namehint') || 'New Area');
        excArea.set('title', title);
        excArea.set('description', xmlUnescape(ele.getAttribute('description')));
        if (ele.getAttribute('id')) {
          excArea.setId(xmlUnescape(ele.getAttribute('id')));
        }
        excArea.set('shown', true);
        excArea.set(METHOD_FIELD, Method.NONE);
        getAreaManager().add(excArea);

        var entry = {
          'layerId': layerId,
          'areaId': excArea.getId(),
          'filterId': '*',
          'includeArea': false,
          'filterGroup': true,
          'temp': true
        };
        this.excEntries_.push(entry);
      }
      child = null;
    }

    while (child) {
      if (isFilter) {
        // if it doesn't contain a PropertyName element as a child, or is a validTime property, exclude it
        var propNameEle = ele.querySelector('PropertyName');
        if (propNameEle && propNameEle.textContent != 'validTime') {
          var filterText = serialize(ele);
          var name = xmlUnescape(ele.getAttribute('namehint') || child.getAttribute('namehint') || 'New Filter');
          var description = xmlUnescape(ele.getAttribute('description') || '');
          var filterEntry = new FilterEntry();
          var grouping = String(getParentElement(ele).localName) == 'And';

          filterEntry.setFilter(filterText);
          filterEntry.setTitle(name);
          filterEntry.setDescription(description);
          filterEntry.setEnabled(true);
          filterEntry.type = layerId;
          filterEntry.setTemporary(true);

          var fm = BaseFilterManager.getInstance();
          fm.addFilter(filterEntry);
          fm.setGrouping(filterEntry.type, grouping);

          var entry = {
            'layerId': layerId,
            'areaId': '*',
            'filterId': filterEntry.getId(),
            'includeArea': true,
            'filterGroup': grouping,
            'temp': true
          };
          this.entries_.push(entry);
          child = null;
          continue;
        }
      }

      next = getNextElementSibling(child);
      this.parseEntries_(child);
      child = next;
    }
  }
}
