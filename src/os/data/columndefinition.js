goog.provide('os.data.ColumnDefinition');
goog.require('os.IPersistable');


/**
 * All the properties that can define a column definition for SlickGrid
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
  this['type'] = 'string';

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

  opt_obj['id'] = this['id'];
  opt_obj['name'] = this['name'];
  opt_obj['field'] = this['field'];
  opt_obj['type'] = this['type'];
  opt_obj['resizable'] = this['resizable'];
  opt_obj['sortable'] = this['sortable'];
  opt_obj['minWidth'] = this['minWidth'];
  opt_obj['maxWidth'] = this['maxWidth'];
  opt_obj['width'] = this['width'];
  opt_obj['rerenderOnResize'] = this['rerenderOnResize'];
  opt_obj['headerCssClass'] = this['headerCssClass'];
  opt_obj['cssClass'] = this['cssClass'];
  opt_obj['defaultSortAsc'] = this['defaultSortAsc'];
  opt_obj['focusable'] = this['focusable'];
  opt_obj['selectable'] = this['selectable'];
  opt_obj['behavior'] = this['behavior'];
  opt_obj['visible'] = this['visible'];
  opt_obj['visprotected'] = this['visprotected'];
  opt_obj['toolTip'] = this['toolTip'];
  opt_obj['derivedFrom'] = this['derivedFrom'];
  opt_obj['userModified'] = this['userModified'];

  /**
   * @todo Need a way to persist/restore these.
   */
  opt_obj['formatter'] = null;
  opt_obj['asyncPostRender'] = null;

  return opt_obj;
};


/**
 * @inheritDoc
 */
os.data.ColumnDefinition.prototype.restore = function(config) {
  this['id'] = config['id'];
  this['name'] = config['name'];
  this['field'] = config['field'];
  this['type'] = config['type'] || 'string';
  this['resizable'] = config['resizable'];
  this['sortable'] = config['sortable'];
  this['minWidth'] = config['minWidth'];
  this['maxWidth'] = config['maxWidth'];
  this['width'] = config['width'];
  this['rerenderOnResize'] = config['rerenderOnResize'];
  this['headerCssClass'] = config['headerCssClass'];
  this['cssClass'] = config['cssClass'];
  this['defaultSortAsc'] = config['defaultSortAsc'];
  this['focusable'] = config['focusable'];
  this['selectable'] = config['selectable'];
  this['behavior'] = config['behavior'];
  this['visible'] = config['visible'];
  this['visprotected'] = config['visprotected'];
  this['toolTip'] = config['toolTip'];
  this['derivedFrom'] = config['derivedFrom'];
  this['userModified'] = config['userModified'];

  /**
   * @todo Need a way to persist/restore these.
   */
  this['formatter'] = null;
  this['asyncPostRender'] = null;
};


/**
 * Creates a copy of the column definition.
 * @return {os.data.ColumnDefinition}
 */
os.data.ColumnDefinition.prototype.clone = function() {
  var clone = new os.data.ColumnDefinition();

  this.persist(clone);
  clone['formatter'] = this['formatter'];
  clone['asyncPostRender'] = this['asyncPostRender'];

  return clone;
};
