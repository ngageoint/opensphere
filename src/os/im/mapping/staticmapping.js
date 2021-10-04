goog.declareModuleId('os.im.mapping.StaticMapping');

import AbstractMapping from './abstractmapping.js';
import {getItemField, setItemField} from './mapping.js';


/**
 * Maps a field to a static value.
 *
 * @extends {AbstractMapping<Object>}
 */
export default class StaticMapping extends AbstractMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Static value. If defined, the mapping will assign this value to the field.
     * @type {*}
     */
    this.value = null;

    /**
     * If an existing value should be replaced. Defaults to true.
     * @type {boolean}
     */
    this.replace = true;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return StaticMapping.ID;
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'Set ' + this.field + ' to ' + this.value;
  }

  /**
   * @inheritDoc
   */
  execute(item) {
    if (item && this.field && (this.replace || getItemField(item, this.field) == null)) {
      setItemField(item, this.field, this.value);
    }
  }

  /**
   * @inheritDoc
   */
  clone() {
    var other = /** @type {StaticMapping} */ (super.clone());
    other.value = this.value;
    other.replace = this.replace;
    return other;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);
    opt_to['value'] = this.value;
    opt_to['replace'] = this.replace;

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);
    this.value = config['value'];
    this.replace = config['replace'];
  }
}

/**
 * @type {string}
 */
StaticMapping.ID = 'Static';
