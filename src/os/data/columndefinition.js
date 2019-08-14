goog.provide('os.data.ColumnDefinition');
goog.require('os.IPersistable');
goog.require('os.xsd.DataType');



/**
 * All the properties that can define a column definition for SlickGrid
 *
 * @param {string=} opt_name
 * @param {string=} opt_field
 * @implements {os.IPersistable}
 * @constructor
 */
os.data.ColumnDefinition = function(opt_name, opt_field) {
  /**
   * The ID of the column
   * @type {string}
   */
  this['id'] = opt_name || '';

  /**
   * The name (or human-readable title) of the column
   * @type {string}
   */
  this['name'] = opt_name || '';

  /**
   * The field
   * @type {string}
   */
  this['field'] = opt_field || opt_name || '';

  /**
   * The value type.
   * @type {string}
   */
  this['type'] = os.xsd.DataType.STRING;

  /**
   * If the column is internal to the application
   * @type {boolean}
   */
  this['internal'] = false;

  /**
   * Whether or not the column is resizable
   * @type {boolean}
   */
  this['resizable'] = true;

  /**
   * Whether or not the column is sortable
   * @type {boolean}
   */
  this['sortable'] = true;

  /**
   * The minimum width of the column in pixels
   * @type {number}
   */
  this['minWidth'] = 30;

  /**
   * The maximum width of the column in pixels
   * @type {number}
   */
  this['maxWidth'] = Number.MAX_VALUE;

  /**
   * The width of the column in pixels
   * @type {number}
   */
  this['width'] = 0;

  /**
   * Whether or not to rerender on resize
   * @type {number}
   */
  this['rerenderOnResize'] = false;

  /**
   * The CSS class for the header
   * @type {?string}
   */
  this['headerCssClass'] = '';

  /**
   * The CSS class for the header
   * @type {?string}
   */
  this['cssClass'] = '';

  /**
   * Default sort direction
   * @type {boolean}
   */
  this['defaultSortAsc'] = true;

  /**
   * Whether or not the cell should be focusable
   * @type {boolean}
   */
  this['focusable'] = true;

  /**
   * Whether or not the cell should be selectable
   * @type {boolean}
   */
  this['selectable'] = true;

  /**
   * The format function
   * @type {?function(number, number, string, os.data.ColumnDefinition, *)}
   */
  this['formatter'] = null;

  /**
   * The behavior of the column
   * @type {?string}
   */
  this['behavior'] = null;

  /**
   * The asynchronous post renderer for the column. Note that you have to set <code>enableAsyncPostRender</code>
   * to <code>true</code> in the grid options for this to work.
   * @type {?function(angular.JQLite, number, *, os.data.ColumnDefinition)}
   */
  this['asyncPostRender'] = null;

  /**
   * If the column is visible or not.
   * @type {boolean}
   */
  this['visible'] = true;

  /**
   * If the column is temporary or not. Useful if you want a column to be purged in some cases.
   * @type {boolean}
   */
  this['temp'] = false;

  /**
   * This is not part of the column spec for slickgrid so it will not actually affect the display
   *
   * This column's should not be made visible ever. For example, the columnmanager should check flag before
   * displaying to the user that the column exists and can be made visible/hidden.  It should exclude the column
   * entirely.
   *
   * It is up to the dev to check this and honor it since this['visible'] cannot be protected
   *
   * @type {boolean}
   */
  this['visprotected'] = false;

  /**
   * This is used if we want to provide some additional information about a column header.
   * @type {string}
   */
  this['toolTip'] = '';

  /**
   * The original column this column is derived from.
   * @type {string}
   */
  this['derivedFrom'] = '';

  /**
   * If the user has modified this column. Used to determine if the column (or others with it) should be automatically
   * sized/sorted.
   * @type {boolean}
   */
  this['userModified'] = false;
};


/**
 * @inheritDoc
 */
os.data.ColumnDefinition.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  // always persist/restore these as they are the meat of the column definition
  opt_obj['id'] = this['id'];
  opt_obj['name'] = this['name'];
  opt_obj['field'] = this['field'];

  // only persist these values when they differ from the default to conserve space
  if (this['type'] !== os.xsd.DataType.STRING) {
    opt_obj['type'] = this['type'];
  }
  if (this['resizable'] !== true) {
    opt_obj['resizable'] = this['resizable'];
  }
  if (this['sortable'] !== true) {
    opt_obj['sortable'] = this['sortable'];
  }
  if (this['minWidth'] !== 30) {
    opt_obj['minWidth'] = this['minWidth'];
  }
  if (this['maxWidth'] !== Number.MAX_VALUE) {
    opt_obj['maxWidth'] = this['maxWidth'];
  }
  if (this['width'] !== 0) {
    opt_obj['width'] = this['width'];
  }
  if (this['rerenderOnResize'] !== false) {
    opt_obj['rerenderOnResize'] = this['rerenderOnResize'];
  }
  if (this['headerCssClass'] !== '') {
    opt_obj['headerCssClass'] = this['headerCssClass'];
  }
  if (this['cssClass'] !== '') {
    opt_obj['cssClass'] = this['cssClass'];
  }
  if (this['defaultSortAsc'] !== true) {
    opt_obj['defaultSortAsc'] = this['defaultSortAsc'];
  }
  if (this['focusable'] !== true) {
    opt_obj['focusable'] = this['focusable'];
  }
  if (this['selectable'] !== true) {
    opt_obj['selectable'] = this['selectable'];
  }
  if (this['behavior'] !== null) {
    opt_obj['behavior'] = this['behavior'];
  }
  if (this['visible'] !== true) {
    opt_obj['visible'] = this['visible'];
  }
  if (this['visprotected'] !== false) {
    opt_obj['visprotected'] = this['visprotected'];
  }
  if (this['toolTip'] !== '') {
    opt_obj['toolTip'] = this['toolTip'];
  }
  if (this['derivedFrom'] !== '') {
    opt_obj['derivedFrom'] = this['derivedFrom'];
  }
  if (this['userModified'] !== false) {
    opt_obj['userModified'] = this['userModified'];
  }

  return opt_obj;
};


/**
 * @inheritDoc
 */
os.data.ColumnDefinition.prototype.restore = function(config) {
  this['id'] = config['id'];
  this['name'] = config['name'];
  this['field'] = config['field'];

  // only set these values if these keys are on the config
  if (config.hasOwnProperty('type')) {
    this['type'] = config['type'];
  }
  if (config.hasOwnProperty('resizable')) {
    this['resizable'] = config['resizable'];
  }
  if (config.hasOwnProperty('sortable')) {
    this['sortable'] = config['sortable'];
  }
  if (config.hasOwnProperty('minWidth')) {
    this['minWidth'] = config['minWidth'];
  }
  if (config.hasOwnProperty('maxWidth')) {
    this['maxWidth'] = config['maxWidth'];
  }
  if (config.hasOwnProperty('width')) {
    this['width'] = config['width'];
  }
  if (config.hasOwnProperty('rerenderOnResize')) {
    this['rerenderOnResize'] = config['rerenderOnResize'];
  }
  if (config.hasOwnProperty('headerCssClass')) {
    this['headerCssClass'] = config['headerCssClass'];
  }
  if (config.hasOwnProperty('cssClass')) {
    this['cssClass'] = config['cssClass'];
  }
  if (config.hasOwnProperty('defaultSortAsc')) {
    this['defaultSortAsc'] = config['defaultSortAsc'];
  }
  if (config.hasOwnProperty('focusable')) {
    this['focusable'] = config['focusable'];
  }
  if (config.hasOwnProperty('selectable')) {
    this['selectable'] = config['selectable'];
  }
  if (config.hasOwnProperty('behavior')) {
    this['behavior'] = config['behavior'];
  }
  if (config.hasOwnProperty('visible')) {
    this['visible'] = config['visible'];
  }
  if (config.hasOwnProperty('visprotected')) {
    this['visprotected'] = config['visprotected'];
  }
  if (config.hasOwnProperty('toolTip')) {
    this['toolTip'] = config['toolTip'];
  }
  if (config.hasOwnProperty('derivedFrom')) {
    this['derivedFrom'] = config['derivedFrom'];
  }
  if (config.hasOwnProperty('userModified')) {
    this['userModified'] = config['userModified'];
  }
};


/**
 * Creates a copy of the column definition.
 *
 * @return {os.data.ColumnDefinition}
 */
os.data.ColumnDefinition.prototype.clone = function() {
  var clone = new os.data.ColumnDefinition();

  this.persist(clone);
  clone['formatter'] = this['formatter'];
  clone['asyncPostRender'] = this['asyncPostRender'];

  return clone;
};
