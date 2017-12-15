goog.provide('os.ogc.wfs.FeatureType');
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.string');
goog.require('os.geo');
goog.require('os.ogc.IFeatureType');
goog.require('os.registerClass');



/**
 * @param {string=} opt_typeName
 * @param {Array<!os.ogc.FeatureTypeColumn>=} opt_columns
 * @param {boolean=} opt_isDynamic
 * @implements {os.ogc.IFeatureType}
 * @constructor
 */
os.ogc.wfs.FeatureType = function(opt_typeName, opt_columns, opt_isDynamic) {
  /**
   * @type {Array<!os.ogc.FeatureTypeColumn>}
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
    var columns = goog.isDefAndNotNull(opt_columns) ? opt_columns : [];
    columns.sort(os.ogc.wfs.FeatureType.sortColumns);
    var isDynamic = goog.isDef(opt_isDynamic) ? opt_isDynamic : false;
    this.init(opt_typeName, columns, isDynamic);
  }
};


/**
 * @param {os.ogc.FeatureTypeColumn} a
 * @param {os.ogc.FeatureTypeColumn} b
 * @return {number} per compare function standards
 */
os.ogc.wfs.FeatureType.sortColumns = function(a, b) {
  return goog.string.numerateCompare(a.name, b.name);
};


/**
 * Class name
 * @type {string}
 * @const
 */
os.ogc.wfs.FeatureType.NAME = 'os.ogc.wfs.FeatureType';
os.registerClass(os.ogc.wfs.FeatureType.NAME, os.ogc.wfs.FeatureType);


/**
 * @type {Array<string>}
 * @private
 * @const
 */
os.ogc.wfs.FeatureType.START_TIME_NAMES_ = ['up', 'start', 'begin'];


/**
 * @type {Array<string>}
 * @private
 * @const
 */
os.ogc.wfs.FeatureType.END_TIME_NAMES_ = ['down', 'stop', 'end'];


/**
 * @type {Object<string, Array<string>>}
 * @private
 */
os.ogc.wfs.FeatureType.TIME_COLUMNS_ = {};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.getTypeName = function() {
  return this.typeName_;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.setTypeName = function(value) {
  this.typeName_ = value;

  if (value && this.typeName_) {
    var columns = this.getColumns() || [];
    columns.sort(os.ogc.wfs.FeatureType.sortColumns);
    this.init(this.typeName_, columns, this.isDynamic_);
  }
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.getTimeColumns = function() {
  return goog.array.filter(this.columns_, os.ogc.wfs.FeatureType.filterTime);
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.getGeometryColumnName = function() {
  return this.geometryColumnName_;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.setGeometryColumnName = function(value) {
  this.geometryColumnName_ = value;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.getStartDateColumnName = function() {
  if (this.startDateColumnName_ || !this.isDynamic_) {
    return this.startDateColumnName_;
  } else {
    return 'validTime';
  }
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.setStartDateColumnName = function(value) {
  this.startDateColumnName_ = value;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.getEndDateColumnName = function() {
  if (this.startDateColumnName_ && this.endDateColumnName_) {
    return this.endDateColumnName_;
  } else {
    return this.getStartDateColumnName();
  }
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.setEndDateColumnName = function(value) {
  this.endDateColumnName_ = value;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.getColumns = function() {
  return this.columns_;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.setColumns = function(value) {
  this.columns_ = value;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.getNeedsTimeColumns = function() {
  return !this.isDynamic_ && this.getTimeColumns().length > 1 &&
      (!this.startDateColumnName_ || !this.endDateColumnName_);
};


/**
 * Initialize the feature type.
 * @param {string} typeName
 * @param {Array<!os.ogc.FeatureTypeColumn>} columns
 * @param {boolean} isDynamic
 */
os.ogc.wfs.FeatureType.prototype.init = function(typeName, columns, isDynamic) {
  this.typeName_ = typeName;
  this.columns_ = columns;
  this.isDynamic_ = isDynamic;
  var startDateColumn = null;
  var endDateColumn = null;
  var singleDate = '_';

  var i = columns.length;
  while (i--) {
    var column = columns[i];
    var name = column.name;
    var type = column.type;
    var lcName = name.toLowerCase();
    var lcType = type.toLowerCase();

    if (goog.string.contains(type, 'gml')) {
      this.geometryColumnName_ = name;
    } else if (!startDateColumn && os.ogc.wfs.FeatureType.isDateTime(lcType) && this.isStartDate(lcName)) {
      startDateColumn = name;
    } else if (!endDateColumn && os.ogc.wfs.FeatureType.isDateTime(lcType) && this.isEndDate(lcName)) {
      endDateColumn = name;
    } else if (os.ogc.wfs.FeatureType.isFieldIgnored(name)) {
      this.columns_.splice(i, 1);
    }

    if (startDateColumn && endDateColumn) {
      this.startDateColumnName_ = startDateColumn;
      this.endDateColumnName_ = endDateColumn;
    }

    if (os.ogc.wfs.FeatureType.isDateTime(lcType)) {
      singleDate = singleDate == '_' ? name : null;
    }
  }

  if (!this.startDateColumnName_ && singleDate && singleDate != '_') {
    this.startDateColumnName_ = singleDate;
  }
};


/**
 * @param {string} name
 * @return {boolean}
 * @protected
 */
os.ogc.wfs.FeatureType.prototype.isStartDate = function(name) {
  if (this.typeName_ && this.typeName_ in os.ogc.wfs.FeatureType.TIME_COLUMNS_) {
    return os.ogc.wfs.FeatureType.TIME_COLUMNS_[this.typeName_][0].toLowerCase() == name;
  }

  var i = os.ogc.wfs.FeatureType.START_TIME_NAMES_.length;
  while (i--) {
    if (goog.string.contains(name, os.ogc.wfs.FeatureType.START_TIME_NAMES_[i])) {
      return true;
    }
  }

  return false;
};


/**
 * @param {string} name
 * @return {boolean}
 * @protected
 */
os.ogc.wfs.FeatureType.prototype.isEndDate = function(name) {
  if (this.typeName_ && this.typeName_ in os.ogc.wfs.FeatureType.TIME_COLUMNS_) {
    return os.ogc.wfs.FeatureType.TIME_COLUMNS_[this.typeName_][1].toLowerCase() == name;
  }

  var i = os.ogc.wfs.FeatureType.END_TIME_NAMES_.length;
  while (i--) {
    if (goog.string.contains(name, os.ogc.wfs.FeatureType.END_TIME_NAMES_[i])) {
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.persist = function(opt_to) {
  var options = opt_to || {};
  // NOTE:Presiting these setting in a special key, as most
  // of the fatureType settings are re-set when created.
  options['featureTypeUser'] = {
    'startDateColumnName': this.getStartDateColumnName(),
    'endDateColumnName': this.getEndDateColumnName()
  };
  return options;
};


/**
 * @inheritDoc
 */
os.ogc.wfs.FeatureType.prototype.restore = function(config) {
  if (config['featureTypeUser']) {
    if (this.columnExists(config['featureTypeUser']['startDateColumnName'])) {
      this.setStartDateColumnName(config['featureTypeUser']['startDateColumnName']);
    }
    if (this.columnExists(config['featureTypeUser']['endDateColumnName'])) {
      this.setEndDateColumnName(config['featureTypeUser']['endDateColumnName']);
    }
  }
};


/**
 * Tests for the existence of columnName in columns.
 * @param {string} columnName
 * @return {boolean} true if columnName exists.
 */
os.ogc.wfs.FeatureType.prototype.columnExists = function(columnName) {
  if (columnName && this.columns_ && this.columns_.length > 0) {
    for (var i = 0; i < this.columns_.length; i = i + 1) {
      if (this.columns_[i] && this.columns_[i].name === columnName) {
        return true;
      }
    }
  }
  return false;
};


/**
 * @param {string} type
 * @return {boolean}
 */
os.ogc.wfs.FeatureType.isDateTime = function(type) {
  return goog.string.contains(type, 'datetime');
};


/**
 * @param {os.ogc.FeatureTypeColumn} item
 * @param {number} index
 * @param {Array<!os.ogc.FeatureTypeColumn>} arr
 * @return {boolean}
 */
os.ogc.wfs.FeatureType.filterTime = function(item, index, arr) {
  return os.ogc.wfs.FeatureType.isDateTime(item.type.toLowerCase());
};


/**
 * @param {string} typeName
 * @param {string} beginColumn
 * @param {string} endColumn
 */
os.ogc.wfs.FeatureType.setTimeColumns = function(typeName, beginColumn, endColumn) {
  goog.object.set(os.ogc.wfs.FeatureType.TIME_COLUMNS_, typeName, [beginColumn, endColumn]);
};


/**
 * @param {string} typeName
 */
os.ogc.wfs.FeatureType.removeTimeColumns = function(typeName) {
  goog.object.remove(os.ogc.wfs.FeatureType.TIME_COLUMNS_, typeName);
};


/**
 * @param {string} typeName
 */
os.ogc.wfs.FeatureType.clearTimeColumns = function(typeName) {
  goog.object.clear(os.ogc.wfs.FeatureType.TIME_COLUMNS_);
};


/**
 * @type {Array<string>}
 * @const
 */
os.ogc.wfs.FeatureType.IGNORED_FIELDS = ['ID', 'DATE_TIME'];


/**
 * @param {string} field
 * @return {boolean}
 */
os.ogc.wfs.FeatureType.isFieldIgnored = function(field) {
  return goog.array.contains(os.ogc.wfs.FeatureType.IGNORED_FIELDS, field);
};
