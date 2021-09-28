goog.declareModuleId('os.parse.BaseParserConfig');

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');


/**
 * Base configuration for a parser.  The template indicates the type created for preview.
 *
 * @unrestricted
 * @template T
 */
export default class BaseParserConfig {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {?string}
     */
    this['id'] = null;

    /**
     * @type {Array<ColumnDefinition>}
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
     * @type {Array<IMapping>}
     */
    this['mappings'] = [];

    /**
     * @type {Array<T>}
     */
    this['preview'] = [];

    /**
     * @type {T}
     */
    this['previewSelection'] = null;

    /**
     * @type {?boolean}
     */
    this['keepUrl'] = null;
  }

  /**
   * Updates the preview data and columns from the source.
   *
   * @param {Array<IMapping>=} opt_mappings Mappings to apply to preview items.
   */
  updatePreview(opt_mappings) {}
}
