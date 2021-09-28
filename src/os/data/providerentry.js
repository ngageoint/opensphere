goog.declareModuleId('os.data.ProviderEntry');

const {default: IDataProvider} = goog.requireType('os.data.IDataProvider');


/**
 * An entry for the provider registry in the data manager
 */
export default class ProviderEntry {
  /**
   * Constructor.
   * @param {!string} type The type
   * @param {!function()} clazz The class
   * @param {!string} title The title
   * @param {?string} desc The description
   */
  constructor(type, clazz, title, desc) {
    /**
     * The provider type
     * @type {!string}
     */
    this.type = type.toLowerCase();

    /**
     * The class
     * @type {!function(new:IDataProvider)}
     */
    this.clazz = clazz;

    /**
     * The title
     * @type {!string}
     */
    this.title = title;

    /**
     * The description
     * @type {?string}
     */
    this.desc = desc;
  }
}
