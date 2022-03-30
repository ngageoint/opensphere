goog.declareModuleId('os.column.ColumnMapping');

import * as olArray from 'ol/src/array.js';

import ColumnMappingEvent from './columnmappingevent.js';
import ColumnMappingEventType from './columnmappingeventtype.js';
import ColumnMappingTag from './columnmappingtag.js';
import IColumnMapping from './icolumnmapping.js';// eslint-disable-line

const asserts = goog.require('goog.asserts');
const dom = goog.require('goog.dom');
const googDomXml = goog.require('goog.dom.xml');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const googString = goog.require('goog.string');

/**
 * Enumeration of column mapping attributes
 * @enum {string}
 */
const ColumnMappingAttr = {
  TYPE: 'type',
  NAME: 'name',
  DESCRIPTION: 'description',
  LAYER: 'layer'
};


/**
 * Base implementation of a column mapping.
 *
 * @implements {IColumnMapping}
 * @unrestricted
 */
export default class ColumnMapping extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {!string}
     * @private
     */
    this.id_ = googString.getRandomString();

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
     * @type {Array<osx.column.ColumnModel>}
     * @private
     */
    this.columns_ = [];
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id_;
  }

  /**
   * @inheritDoc
   */
  setId(value) {
    this.id_ = value || googString.getRandomString();
  }

  /**
   * @inheritDoc
   */
  getName() {
    return this['name'];
  }

  /**
   * @inheritDoc
   */
  setName(value) {
    this['name'] = value;
  }

  /**
   * @inheritDoc
   */
  getDescription() {
    return this['description'];
  }

  /**
   * @inheritDoc
   */
  setDescription(value) {
    this['description'] = value;
  }

  /**
   * @inheritDoc
   */
  getValueType() {
    return this.valueType_;
  }

  /**
   * @inheritDoc
   */
  setValueType(value) {
    this.valueType_ = value;
  }

  /**
   * @inheritDoc
   */
  addColumn(layerKey, column, opt_units) {
    var columnModel = {
      'column': column,
      'layer': layerKey,
      'units': opt_units || ''
    };

    this.columns_.push(columnModel);

    var event = new ColumnMappingEvent(ColumnMappingEventType.COLUMN_ADDED, columnModel);
    this.dispatchEvent(event);
  }

  /**
   * @inheritDoc
   */
  removeColumn(columnModel) {
    var removed = olArray.remove(this.columns_, columnModel);

    var model = removed ? columnModel : null;
    var event = new ColumnMappingEvent(ColumnMappingEventType.COLUMN_REMOVED, model);
    this.dispatchEvent(event);
  }

  /**
   * @inheritDoc
   */
  getColumns() {
    return this.columns_;
  }

  /**
   * @inheritDoc
   */
  getColumn(layerKey) {
    var found = olArray.find(this.columns_, function(columnModel) {
      return columnModel['layer'] === layerKey;
    });

    return found;
  }

  /**
   * Loads raw XML mapping data
   *
   * @param {string} xml
   */
  loadMapping(xml) {
    var doc = googDomXml.loadXml(xml);

    try {
      if (doc) {
        var mappingEl = dom.getFirstElementChild(doc);
        if (mappingEl && mappingEl.tagName === ColumnMappingTag.COLUMN_MAPPING) {
          var type = mappingEl.getAttribute(ColumnMappingAttr.TYPE);
          var name = mappingEl.getAttribute(ColumnMappingAttr.NAME);

          asserts.assertString(type);
          this.setValueType(type);
          asserts.assertString(name);
          this.setName(name);

          var description = /** @type {string} */ (mappingEl.getAttribute(ColumnMappingAttr.DESCRIPTION));
          this.setDescription(description);

          var columns = mappingEl.querySelectorAll(ColumnMappingTag.COLUMN);
          if (columns) {
            for (var i = 0, n = columns.length; i < n; i++) {
              var column = columns[i];
              var layer = column.getAttribute(ColumnMappingAttr.LAYER);
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
      log.error(logger, 'Failed to load column mapping: ' + xml);
    }
  }

  /**
   * @inheritDoc
   */
  writeMapping() {
    var xml = '';
    var cTag = ColumnMappingTag.COLUMN;
    var cmTag = ColumnMappingTag.COLUMN_MAPPING;
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
      log.error(logger, 'Failed to write column mapping: ' + this.getName());
      return '';
    }

    return xml;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    var to = opt_to || {};
    to['id'] = this.getId();
    to['columnMapping'] = this.writeMapping();

    return to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    this.setId(/** @type {!string} */ (config['id']));
    var xml = /** @type {string} */ (config['columnMapping']);
    if (xml) {
      this.loadMapping(xml);
    }
  }

  /**
   * @inheritDoc
   */
  clone() {
    var cm = new ColumnMapping();
    var config = this.persist();
    cm.restore(config);
    return cm;
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.column.ColumnMapping');
