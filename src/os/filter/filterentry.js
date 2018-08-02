goog.provide('os.filter.FilterEntry');
goog.require('goog.dom.xml');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('os.IPersistable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.filter.IFilterEntry');



/**
 * @constructor
 * @implements {os.IPersistable}
 * @implements {os.filter.IFilterEntry}
 * @extends {goog.events.EventTarget}
 */
os.filter.FilterEntry = function() {
  os.filter.FilterEntry.base(this, 'constructor');

  /**
   * @type {string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * @type {string}
   * @private
   */
  this.title_ = 'New Filter';

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
   * @private
   */
  this['enabled'] = false;

  /**
   * true = AND, false = OR
   * @type {boolean}
   * @private
   */
  this.match_ = true;
};
goog.inherits(os.filter.FilterEntry, goog.events.EventTarget);


/**
 * @return {!string}
 */
os.filter.FilterEntry.prototype.getId = function() {
  return this.id_;
};


/**
 * @param {!string} value
 */
os.filter.FilterEntry.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * @inheritDoc
 */
os.filter.FilterEntry.prototype.getTitle = function() {
  return this.title_;
};


/**
 * @inheritDoc
 */
os.filter.FilterEntry.prototype.setTitle = function(value) {
  this.title_ = value;
};


/**
 * @inheritDoc
 */
os.filter.FilterEntry.prototype.getDescription = function() {
  return this.description_;
};


/**
 * @inheritDoc
 */
os.filter.FilterEntry.prototype.setDescription = function(value) {
  this.description_ = value;
};


/**
 * Get the filter type
 * @return {string}
 */
os.filter.FilterEntry.prototype.getType = function() {
  return this.type;
};


/**
 * Set the filter type
 * @param {string} value
 */
os.filter.FilterEntry.prototype.setType = function(value) {
  this.type = value;
};


/**
 * Whether or not the filter is enabled
 * @return {boolean}
 */
os.filter.FilterEntry.prototype.isEnabled = function() {
  return this['enabled'];
};


/**
 * @param {boolean} value
 */
os.filter.FilterEntry.prototype.setEnabled = function(value) {
  this['enabled'] = value;
};


/**
 * Whether or not the filter is temporary. Temporary filters are not persisted across sessions.
 * @return {boolean}
 */
os.filter.FilterEntry.prototype.isTemporary = function() {
  return this.temporary_;
};


/**
 * Set if the filter is temporary.
 * @param {boolean} value
 */
os.filter.FilterEntry.prototype.setTemporary = function(value) {
  this.temporary_ = value;
};


/**
 * @inheritDoc
 */
os.filter.FilterEntry.prototype.getFilter = function() {
  return this.filter_;
};


/**
 * @inheritDoc
 */
os.filter.FilterEntry.prototype.setFilter = function(filter) {
  var old = this.filter_;
  this.filter_ = filter;
  if (this.filter_) {
    try {
      this.filterNode_ = goog.dom.xml.loadXml(this.filter_);
    } catch (e) {}
  }

  this.dispatchEvent(new os.events.PropertyChangeEvent('filter', this.filter_, old));
};


/**
 * Gets the filter node
 * @return {?Node}
 */
os.filter.FilterEntry.prototype.getFilterNode = function() {
  return this.filterNode_ ? goog.dom.getFirstElementChild(this.filterNode_) : null;
};


/**
 * @return {boolean}
 */
os.filter.FilterEntry.prototype.getMatch = function() {
  return this.match_;
};


/**
 * @param {boolean} match
 */
os.filter.FilterEntry.prototype.setMatch = function(match) {
  this.match_ = match;
};


/**
 * @param {?Array<os.ogc.FeatureTypeColumn>} columns
 * @return {boolean}
 */
os.filter.FilterEntry.prototype.matches = function(columns) {
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

        if (goog.string.startsWith(columnType, 'gml:')) {
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
};


/**
 * Clones the entry
 * @return {os.filter.FilterEntry} The new entry
 */
os.filter.FilterEntry.prototype.clone = function() {
  var conf = this.persist();
  var other = new this.constructor();
  other.restore(conf);
  return other;
};


/**
 * @inheritDoc
 */
os.filter.FilterEntry.prototype.persist = function(opt_to) {
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

  return opt_to;
};


/**
 * @inheritDoc
 */
os.filter.FilterEntry.prototype.restore = function(config) {
  this.id_ = config['id'];
  this.title_ = config['title'];
  this.description_ = config['description'];
  this.type = config['type'];
  this.setFilter(config['filter']);
  this.setEnabled(config['enabled']);
  this.setMatch(config['match']);
};


/**
 * Clone a filter entry to the current window context.
 * @param {os.filter.FilterEntry} entry The alleged filter entry.
 * @return {os.filter.FilterEntry} A filter entry created in the current window context.
 */
os.filter.cloneToContext = function(entry) {
  if (entry && !(entry instanceof os.filter.FilterEntry)) {
    try {
      var clone = new os.filter.FilterEntry();
      clone.restore(entry.persist());

      if (clone instanceof os.filter.FilterEntry) {
        entry = clone;
      }
    } catch (e) {
      entry = null;
    }
  }

  return entry;
};
