goog.provide('os.column.ColumnMapping');
goog.provide('os.column.ColumnMappingTag');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('os.column.ColumnMappingEvent');
goog.require('os.column.ColumnMappingEventType');
goog.require('os.column.ColumnModel');
goog.require('os.column.IColumnMapping');


/**
 * Enumeration of column mapping tags
 * @enum {string}
 */
os.column.ColumnMappingTag = {
  COLUMN_MAPPING: 'columnMapping',
  COLUMN_MAPPINGS: 'columnMappings',
  COLUMN: 'column'
};


/**
 * Enumeration of column mapping attributes
 * @enum {string}
 */
os.column.ColumnMappingAttr = {
  TYPE: 'type',
  NAME: 'name',
  DESCRIPTION: 'description',
  LAYER: 'layer'
};



/**
 * Base implementation of a column mapping.
 * @implements {os.column.IColumnMapping}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.column.ColumnMapping = function() {
  os.column.ColumnMapping.base(this, 'constructor');

  /**
   * @type {!string}
   * @private
   */
  this.id_ = goog.string.getRandomString();

  /**
   * @type {?string}
   * @private
   */
  this['name'] = null;

  /**
   * @type {?string}
   * @private
   */
  this['description'] = null;

  /**
   * @type {?string}
   * @private
   */
  this.valueType_ = null;

  /**
   * Array of column models.
   * @type {Array<os.column.ColumnModel>}
   * @private
   */
  this.columns_ = [];
};
goog.inherits(os.column.ColumnMapping, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 */
os.column.ColumnMapping.LOGGER_ = goog.log.getLogger('os.column.ColumnMapping');


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.setId = function(value) {
  this.id_ = value || goog.string.getRandomString();
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.getName = function() {
  return this['name'];
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.setName = function(value) {
  this['name'] = value;
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.getDescription = function() {
  return this['description'];
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.setDescription = function(value) {
  this['description'] = value;
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.getValueType = function() {
  return this.valueType_;
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.setValueType = function(value) {
  this.valueType_ = value;
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.addColumn = function(layerKey, column, opt_units) {
  var columnModel = {
    'column': column,
    'layer': layerKey,
    'units': opt_units || ''
  };

  this.columns_.push(columnModel);

  var event = new os.column.ColumnMappingEvent(os.column.ColumnMappingEventType.COLUMN_ADDED, columnModel);
  this.dispatchEvent(event);
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.removeColumn = function(columnModel) {
  var removed = goog.array.remove(this.columns_, columnModel);

  var model = removed ? columnModel : null;
  var event = new os.column.ColumnMappingEvent(os.column.ColumnMappingEventType.COLUMN_REMOVED, model);
  this.dispatchEvent(event);
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.getColumns = function() {
  return this.columns_;
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.getColumn = function(layerKey) {
  var found = goog.array.find(this.columns_, function(columnModel) {
    return columnModel['layer'] === layerKey;
  });

  return found;
};


/**
 * Loads raw XML mapping data
 * @param {string} xml
 */
os.column.ColumnMapping.prototype.loadMapping = function(xml) {
  var doc = goog.dom.xml.loadXml(xml);

  try {
    if (doc) {
      var mappingEl = goog.dom.getFirstElementChild(doc);
      if (mappingEl && mappingEl.tagName === os.column.ColumnMappingTag.COLUMN_MAPPING) {
        var type = mappingEl.getAttribute(os.column.ColumnMappingAttr.TYPE);
        var name = mappingEl.getAttribute(os.column.ColumnMappingAttr.NAME);

        goog.asserts.assertString(type);
        this.setValueType(type);
        goog.asserts.assertString(name);
        this.setName(name);

        var description = /** @type {string} */ (mappingEl.getAttribute(os.column.ColumnMappingAttr.DESCRIPTION));
        this.setDescription(description);

        var columns = mappingEl.querySelectorAll(os.column.ColumnMappingTag.COLUMN);
        if (columns) {
          for (var i = 0, n = columns.length; i < n; i++) {
            var column = columns[i];
            var layer = column.getAttribute(os.column.ColumnMappingAttr.LAYER);
            var columnText = column.textContent;

            if (layer && columnText) {
              this.addColumn(layer, columnText);
            }
          }
        }
      }
    }
  } catch (e) {
    // log it, shouldn't break anything
    goog.log.error(os.column.ColumnMapping.LOGGER_, 'Failed to load column mapping: ' + xml);
  }
};


/**
 * Writes raw XML mapping data
 * @return {string}
 */
os.column.ColumnMapping.prototype.writeMapping = function() {
  var xml = '';
  var cTag = os.column.ColumnMappingTag.COLUMN;
  var cmTag = os.column.ColumnMappingTag.COLUMN_MAPPING;
  var name = this['name'] || 'New Association';
  var type = this.valueType_ || 'string';
  var desc = this['description'] || '';

  try {
    xml += '<' + cmTag + ' name="' + name + '" type="' + type + '" description="' + desc + '">';

    for (var i = 0, ii = this.columns_.length; i < ii; i++) {
      var columnModel = this.columns_[i];
      var layer = columnModel['layer'];
      var columnText = columnModel['column'];
      xml += '<' + cTag + ' layer="' + layer + '">' + columnText + '</' + cTag + '>';
    }

    xml += '</' + cmTag + '>';
  } catch (e) {
    goog.log.error(os.column.ColumnMapping.LOGGER_, 'Failed to write column mapping: ' + this.getName());
    return '';
  }

  return xml;
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.persist = function(opt_to) {
  var to = opt_to || {};
  to['id'] = this.getId();
  to['columnMapping'] = this.writeMapping();

  return to;
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.restore = function(config) {
  this.setId(/** @type {!string} */ (config['id']));
  var xml = /** @type {string} */ (config['columnMapping']);
  if (xml) {
    this.loadMapping(xml);
  }
};


/**
 * @inheritDoc
 */
os.column.ColumnMapping.prototype.clone = function() {
  var cm = new os.column.ColumnMapping();
  var config = this.persist();
  cm.restore(config);
  return cm;
};
