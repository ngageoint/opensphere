goog.declareModuleId('os.filter.FilterEntry');

import PropertyChangeEvent from '../events/propertychangeevent.js';
import registerClass from '../registerclass.js';
import PropertyChange from '../ui/filter/propertychange.js';

const {getFirstElementChild} = goog.require('goog.dom');
const {loadXml} = goog.require('goog.dom.xml');
const EventTarget = goog.require('goog.events.EventTarget');
const {getRandomString} = goog.require('goog.string');

const {default: IPersistable} = goog.requireType('os.IPersistable');
const {default: IFilterEntry} = goog.requireType('os.filter.IFilterEntry');


/**
 * @implements {IPersistable}
 * @implements {IFilterEntry}
 * @unrestricted
 */
export default class FilterEntry extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {string}
     * @private
     */
    this.id_ = getRandomString();

    /**
     * @type {string}
     * @private
     */
    this.title_ = 'New Filter';

    /**
     * If this is a default filter.
     * @type {boolean}
     * @private
     */
    this.default_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.temporary_ = false;

    /**
     * @type {string}
     */
    this.type = '';

    /**
     * @type {?string}
     * @private
     */
    this.description_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.filter_ = null;

    /**
     * @type {?Node}
     * @private
     */
    this.filterNode_ = null;

    /**
     * @type {boolean}
     */
    this['enabled'] = false;

    /**
     * true = AND, false = OR
     * @type {boolean}
     * @private
     */
    this.match_ = true;

    /**
     * @type {string}
     * @protected
     */
    this.tags = '';

    /**
     * @type {string}
     * @protected
     */
    this.source = '';
  }

  /**
   * @return {!string}
   */
  getId() {
    return this.id_;
  }

  /**
   * @param {!string} value
   */
  setId(value) {
    this.id_ = value;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return this.title_;
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    this.title_ = value;
  }

  /**
   * @inheritDoc
   */
  getDescription() {
    return this.description_;
  }

  /**
   * @inheritDoc
   */
  setDescription(value) {
    this.description_ = value;
  }

  /**
   * Get the filter type
   *
   * @return {string}
   */
  getType() {
    return this.type;
  }

  /**
   * Set the filter type
   *
   * @param {string} value
   */
  setType(value) {
    this.type = value;
  }

  /**
   * Whether or not the filter is enabled
   *
   * @return {boolean}
   */
  isEnabled() {
    return this['enabled'];
  }

  /**
   * @param {boolean} value
   */
  setEnabled(value) {
    this['enabled'] = value;
    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ENABLED, value, !value));
  }

  /**
   * Whether or not this is a default filter. Default filters are loaded from application settings.
   *
   * @return {boolean}
   */
  isDefault() {
    return this.default_;
  }

  /**
   * Set if this is a default filter.
   *
   * @param {boolean} value
   */
  setDefault(value) {
    this.default_ = value;
  }

  /**
   * Whether or not the filter is temporary. Temporary filters are not persisted across sessions.
   *
   * @return {boolean}
   */
  isTemporary() {
    return this.temporary_;
  }

  /**
   * Set if the filter is temporary.
   *
   * @param {boolean} value
   */
  setTemporary(value) {
    this.temporary_ = value;
  }

  /**
   * @inheritDoc
   */
  getFilter() {
    return this.filter_;
  }

  /**
   * @inheritDoc
   */
  setFilter(filter) {
    var old = this.filter_;
    this.filter_ = filter;
    if (this.filter_) {
      try {
        this.filterNode_ = loadXml(this.filter_);
      } catch (e) {}
    }

    this.dispatchEvent(new PropertyChangeEvent('filter', this.filter_, old));
  }

  /**
   * Gets the filter node
   *
   * @return {?Node}
   */
  getFilterNode() {
    return this.filterNode_ ? getFirstElementChild(this.filterNode_) : null;
  }

  /**
   * @return {boolean}
   */
  getMatch() {
    return this.match_;
  }

  /**
   * @param {boolean} match
   */
  setMatch(match) {
    this.match_ = match;
  }

  /**
   * Gets the tags for the filter entry.
   *
   * @return {string}
   */
  getTags() {
    return this.tags;
  }

  /**
   * Sets the tags for the filter entry.
   *
   * @param {string} value The tags to set.
   */
  setTags(value) {
    this.tags = value;
  }

  /**
   * Get the source name of the filter.
   * @return {string}
   */
  getSource() {
    return this.source;
  }

  /**
   * Set if filter source name.
   * @param {string} value
   */
  setSource(value) {
    this.source = value;
  }

  /**
   * @param {?Array<os.ogc.FeatureTypeColumn>} columns
   * @return {boolean}
   */
  matches(columns) {
    var matches = false;

    if (columns) {
      matches = true;

      var columnMap = {};
      for (var i = 0; i < columns.length; i++) {
        columnMap[columns[i]['name']] = columns[i]['type'];
      }

      var filterNode = this.getFilterNode();
      var columnNames = filterNode.querySelectorAll('PropertyName');

      for (var j = 0; j < columnNames.length; j++) {
        var columnName = columnNames[j];
        if (columnName.textContent in columnMap) {
          var columnType = /** @type {string} */ (columnMap[columnName.textContent]);
          if (columnType == 'decimal') {
            var literalElement = columnName.nextElementSibling;

            if (!literalElement || literalElement.localName !== 'Literal') {
              var parentElement = columnName.parentElement;
              literalElement = parentElement.querySelector('Literal');
            }

            if (literalElement) {
              var value = literalElement.textContent || null;
              if (value && isNaN(parseFloat(value))) {
                // column requires numbers, parseFloat gave NaN, fail
                matches = false;
                break;
              }
            }
          }

          if (columnType && columnType.startsWith('gml:')) {
            // gml is a geometry, fail
            matches = false;
            break;
          }
        } else {
          // not in the columns for the layer, fail
          matches = false;
          break;
        }
      }
    }

    return matches;
  }

  /**
   * Clones the entry
   *
   * @return {os.filter.FilterEntry} The new entry
   */
  clone() {
    var conf = this.persist();
    var other = new this.constructor();
    other.restore(conf);
    return other;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    if (!opt_to) {
      opt_to = {};
    }

    opt_to['id'] = this.id_;
    opt_to['title'] = this.title_;
    opt_to['description'] = this.description_;
    opt_to['type'] = this.type;
    opt_to['filter'] = this.filter_;
    opt_to['enabled'] = this['enabled'];
    opt_to['match'] = this.getMatch();
    opt_to['tags'] = this.getTags();

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    this.id_ = config['id'];
    this.title_ = config['title'];
    this.description_ = config['description'];
    this.type = config['type'];
    this.setFilter(config['filter']);
    this.setEnabled(config['enabled']);
    this.setMatch(config['match']);
    this.setTags(config['tags']);
  }
}


/**
 * Class name
 * @type {string}
 * @const
 */
FilterEntry.NAME = 'os.filter.FilterEntry';
registerClass(FilterEntry.NAME, FilterEntry);
