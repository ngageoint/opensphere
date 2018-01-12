goog.provide('os.parse.BaseParserConfig');
goog.require('os.data.ColumnDefinition');



/**
 * Base configuration for a parser.  The template indicates the type created for preview.
 * @constructor
 * @template T
 */
os.parse.BaseParserConfig = function() {
  /**
   * @type {Array.<os.data.ColumnDefinition>}
   */
  this['columns'] = [];

  /**
   * @type {string}
   */
  this['color'] = '#ffffff';

  /**
   * @type {string}
   */
  this['description'] = '';

  /**
   * @type {string}
   */
  this['tags'] = '';

  /**
   * @type {string}
   */
  this['title'] = '';

  /**
   * @type {Array.<os.im.mapping.IMapping>}
   */
  this['mappings'] = null;

  /**
   * @type {Array.<T>}
   */
  this['preview'] = [];

  /**
   * @type {T}
   */
  this['previewSelection'] = null;
};


/**
 * Updates the preview data and columns from the source.
 * @param {Array.<os.im.mapping.IMapping>=} opt_mappings Mappings to apply to preview items.
 */
os.parse.BaseParserConfig.prototype.updatePreview = goog.abstractMethod;
