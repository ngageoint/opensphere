goog.declareModuleId('os.ogc.wfs.FeatureType');

import {registerClass} from '../../classregistry.js';
import IFeatureType from '../ifeaturetype.js';// eslint-disable-line

const {numerateCompare} = goog.require('goog.string');

const {default: FeatureTypeColumn} = goog.requireType('os.ogc.FeatureTypeColumn');


/**
 * @implements {IFeatureType}
 */
export default class FeatureType {
  /**
   * Constructor.
   * @param {string=} opt_typeName
   * @param {Array<!FeatureTypeColumn>=} opt_columns
   * @param {boolean=} opt_isDynamic
   */
  constructor(opt_typeName, opt_columns, opt_isDynamic) {
    /**
     * @type {Array<!FeatureTypeColumn>}
     * @private
     */
    this.columns_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.geometryColumnName_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.isDynamic_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.overrideDynamic_ = false;

    /**
     * @type {?string}
     * @private
     */
    this.startDateColumnName_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.endDateColumnName_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.typeName_ = null;

    if (opt_typeName) {
      var columns = opt_columns != null ? opt_columns : [];
      columns.sort(FeatureType.sortColumns);
      var isDynamic = opt_isDynamic !== undefined ? opt_isDynamic : false;
      this.init(opt_typeName, columns, isDynamic);
    }
  }

  /**
   * @inheritDoc
   */
  getTypeName() {
    return this.typeName_;
  }

  /**
   * @inheritDoc
   */
  setTypeName(value) {
    this.typeName_ = value;

    if (value && this.typeName_) {
      var columns = this.getColumns() || [];
      columns.sort(FeatureType.sortColumns);
      this.init(this.typeName_, columns, this.isDynamic_);
    }
  }

  /**
   * @inheritDoc
   */
  getTimeColumns() {
    return this.columns_.filter(FeatureType.filterTime);
  }

  /**
   * @inheritDoc
   */
  getGeometryColumnName() {
    return this.geometryColumnName_;
  }

  /**
   * @inheritDoc
   */
  setGeometryColumnName(value) {
    this.geometryColumnName_ = value;
  }

  /**
   * @inheritDoc
   */
  getStartDateColumnName() {
    if (this.isDynamic_ && !this.overrideDynamic_) {
      return 'validTime';
    }

    return this.startDateColumnName_;
  }

  /**
   * @inheritDoc
   */
  setStartDateColumnName(value) {
    this.overrideDynamic_ = true;
    this.startDateColumnName_ = value;
  }

  /**
   * @inheritDoc
   */
  getEndDateColumnName() {
    if (this.isDynamic_ && !this.overrideDynamic_) {
      return 'validTime';
    }

    return this.endDateColumnName_ || this.startDateColumnName_;
  }

  /**
   * @inheritDoc
   */
  setEndDateColumnName(value) {
    this.overrideDynamic_ = true;
    this.endDateColumnName_ = value;
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
  setColumns(value) {
    this.columns_ = value;
  }

  /**
   * @inheritDoc
   */
  getNeedsTimeColumns() {
    return !this.isDynamic_ && this.getTimeColumns().length > 1 &&
        (!this.startDateColumnName_ || !this.endDateColumnName_);
  }

  /**
   * Initialize the feature type.
   *
   * @param {string} typeName
   * @param {Array<!FeatureTypeColumn>} columns
   * @param {boolean} isDynamic
   */
  init(typeName, columns, isDynamic) {
    this.typeName_ = typeName;
    this.columns_ = columns;
    this.isDynamic_ = isDynamic;
    var startDateColumn = null;
    var endDateColumn = null;
    var singleDate = null;

    var i = columns.length;
    while (i--) {
      var column = columns[i];
      var name = column.name;
      var type = column.type;
      var lcName = name.toLowerCase();
      var lcType = type.toLowerCase();

      if (!this.geometryColumnName_ && FeatureType.SUPPORTED_GEOMETRY_TYPES.indexOf(type) > -1) {
        this.geometryColumnName_ = name;
      } else if (!startDateColumn && FeatureType.isDateTime(lcType) && this.isStartDate(lcName)) {
        startDateColumn = name;
      } else if (!endDateColumn && FeatureType.isDateTime(lcType) && this.isEndDate(lcName)) {
        endDateColumn = name;
      } else if (FeatureType.isFieldIgnored(name)) {
        this.columns_.splice(i, 1);
      }

      if (!isDynamic && FeatureType.isDateTime(lcType) && !singleDate) {
        singleDate = name;
      }
    }

    if (startDateColumn && endDateColumn) {
      this.startDateColumnName_ = startDateColumn;
      this.endDateColumnName_ = endDateColumn;
    }

    if (!this.startDateColumnName_ && singleDate) {
      this.startDateColumnName_ = singleDate;
    }
  }

  /**
   * @param {string} name
   * @return {boolean}
   * @protected
   */
  isStartDate(name) {
    if (this.typeName_ && this.typeName_ in FeatureType.TIME_COLUMNS_) {
      var val = FeatureType.TIME_COLUMNS_[this.typeName_][0].toLowerCase() == name;
      if (val) {
        this.overrideDynamic_ = true;
      }

      return val;
    }

    var i = FeatureType.START_TIME_NAMES_.length;
    while (i--) {
      if (name.includes(FeatureType.START_TIME_NAMES_[i])) {
        return true;
      }
    }

    return /^date_?time$/i.test(name);
  }

  /**
   * @param {string} name
   * @return {boolean}
   * @protected
   */
  isEndDate(name) {
    if (this.typeName_ && this.typeName_ in FeatureType.TIME_COLUMNS_) {
      var val = FeatureType.TIME_COLUMNS_[this.typeName_][1].toLowerCase() == name;
      if (val) {
        this.overrideDynamic_ = true;
      }
      return val;
    }

    var i = FeatureType.END_TIME_NAMES_.length;
    while (i--) {
      if (name.includes(FeatureType.END_TIME_NAMES_[i])) {
        return true;
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    var options = opt_to || {};
    // NOTE:Presiting these setting in a special key, as most
    // of the fatureType settings are re-set when created.
    options['featureTypeUser'] = {
      'startDateColumnName': this.getStartDateColumnName(),
      'endDateColumnName': this.getEndDateColumnName()
    };
    return options;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    if (config['featureTypeUser']) {
      if (this.columnExists(config['featureTypeUser']['startDateColumnName'])) {
        this.setStartDateColumnName(config['featureTypeUser']['startDateColumnName']);
      }
      if (this.columnExists(config['featureTypeUser']['endDateColumnName'])) {
        this.setEndDateColumnName(config['featureTypeUser']['endDateColumnName']);
      }
    }
  }

  /**
   * Tests for the existence of columnName in columns.
   *
   * @param {string} columnName
   * @return {boolean} true if columnName exists.
   */
  columnExists(columnName) {
    if (columnName && this.columns_ && this.columns_.length > 0) {
      for (var i = 0; i < this.columns_.length; i = i + 1) {
        if (this.columns_[i] && this.columns_[i].name === columnName) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @param {FeatureTypeColumn} a
   * @param {FeatureTypeColumn} b
   * @return {number} per compare function standards
   */
  static sortColumns(a, b) {
    return numerateCompare(a.name, b.name);
  }

  /**
   * @param {string} type
   * @return {boolean}
   */
  static isDateTime(type) {
    return type.includes('datetime');
  }

  /**
   * @param {FeatureTypeColumn} item
   * @param {number} index
   * @param {Array<!FeatureTypeColumn>} arr
   * @return {boolean}
   */
  static filterTime(item, index, arr) {
    return FeatureType.isDateTime(item.type.toLowerCase());
  }

  /**
   * @param {string} typeName
   * @param {string} beginColumn
   * @param {string} endColumn
   */
  static setTimeColumns(typeName, beginColumn, endColumn) {
    FeatureType.TIME_COLUMNS_[typeName] = [beginColumn, endColumn];
  }

  /**
   * @param {string} typeName
   */
  static removeTimeColumns(typeName) {
    delete FeatureType.TIME_COLUMNS_[typeName];
  }

  /**
   * @param {string} typeName
   */
  static clearTimeColumns(typeName) {
    FeatureType.TIME_COLUMNS_ = {};
  }

  /**
   * @param {string} field
   * @return {boolean}
   */
  static isFieldIgnored(field) {
    return FeatureType.IGNORED_FIELDS.includes(field);
  }
}

/**
 * Class name
 * @type {string}
 * @const
 */
FeatureType.NAME = 'os.ogc.wfs.FeatureType';
registerClass(FeatureType.NAME, FeatureType);

/**
 * @type {Array<string>}
 * @private
 * @const
 */
FeatureType.START_TIME_NAMES_ = ['up', 'start', 'begin'];

/**
 * @type {Array<string>}
 * @private
 * @const
 */
FeatureType.END_TIME_NAMES_ = ['down', 'stop', 'end'];

/**
 * @type {Object<string, Array<string>>}
 * @private
 */
FeatureType.TIME_COLUMNS_ = {};

/**
 * @type {!Array<!string>}
 * @const
 */
FeatureType.SUPPORTED_GEOMETRY_TYPES = [
  'gml:Point',
  'gml:LineString',
  'gml:Polygon',
  'gml:MultiPoint',
  'gml:MultiLineString',
  'gml:MultiPolygon',
  'gml:GeometryCollection',
  'gml:Geometry',
  'gml:Surface',
  'gml:MultiSurface',
  'gml:Curve',
  'gml:PointPropertyType',
  'gml:LineStringPropertyType',
  'gml:PolygonPropertyType',
  'gml:MultiPointPropertyType',
  'gml:MultiLineStringPropertyType',
  'gml:MultiPolygonPropertyType',
  'gml:GeometryCollectionPropertyType',
  'gml:GeometryPropertyType',
  'gml:SurfacePropertyType',
  'gml:MultiSurfacePropertyType',
  'gml:CurvePropertyType'
];

/**
 * @type {Array<string>}
 * @const
 */
FeatureType.IGNORED_FIELDS = ['ID'];
