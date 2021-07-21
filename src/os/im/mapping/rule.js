goog.module('os.im.mapping.Rule');
goog.module.declareLegacyNamespace();

const IPersistable = goog.requireType('os.IPersistable');


/**
 * Represents a rule for mapping a string field value to a target value.
 *
 * @implements {IPersistable}
 * @template T
 * @unrestricted
 */
class Rule {
  /**
   * Constructor.
   * @param {string=} opt_initialValue The initial field value
   * @param {T=} opt_mappedValue The value to map to
   */
  constructor(opt_initialValue, opt_mappedValue) {
    /**
     * @type {string}
     */
    this['initialValue'] = opt_initialValue || '';

    /**
     * @type {T|undefined}
     */
    this['mappedValue'] = opt_mappedValue;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = opt_to || {};

    opt_to['initialValue'] = this['initialValue'];
    opt_to['mappedValue'] = this['mappedValue'];

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    this['initialValue'] = config['initialValue'];
    this['mappedValue'] = config['mappedValue'];
  }
}

exports = Rule;
