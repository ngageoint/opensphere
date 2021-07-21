goog.module('os.im.mapping.RuleMapping');
goog.module.declareLegacyNamespace();

const {getBestFieldMatch, getItemField} = goog.require('os.im.mapping');
const AbstractMapping = goog.require('os.im.mapping.AbstractMapping');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const Rule = goog.require('os.im.mapping.Rule');


/**
 * This mapping uses a set of rules or a static value to map values.
 *
 * @extends {AbstractMapping<Object>}
 * @template S
 * @unrestricted
 */
class RuleMapping extends AbstractMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {string}
     * @protected
     */
    this.type = RuleMapping.ID;

    /**
     * Static value. If defined, the mapping will map everything to this.
     * @type {?S}
     * @protected
     */
    this.staticValue = null;

    /**
     * The rules map string values to items of type S
     * @type {?Array<Rule<S>>}
     * @protected
     */
    this.rules = null;

    /**
     * The field on the target item to modify.
     * @type {string|undefined}
     */
    this.targetField = undefined;

    /**
     * @type {RegExp}
     */
    this.regex = /\*/i;

    /**
     * Whether this mapping is valid.
     * @type {boolean}
     */
    this['valid'] = true;

    /**
     * @type {?string}
     */
    this['displayValue'] = null;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.type;
  }

  /**
   * @inheritDoc
   */
  getFieldsChanged() {
    return [this.field, this.targetField];
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return this.type;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    if (this.type && this.field) {
      return this.type.toLowerCase().indexOf(this.field.toLowerCase()) == 0 ? 11 : 10;
    }

    return super.getScore();
  }

  /**
   * @inheritDoc
   */
  getScoreType() {
    return 'rule';
  }

  /**
   * @inheritDoc
   */
  execute(item, targetItem) {
    if (this.field && this.targetField) {
      var fieldValue = getItemField(item, this.field);
      var rules = this.getRules();
      var staticValue = this.staticValue;

      if (staticValue) {
        // map to the static value every time
        targetItem[this.targetField] = staticValue;
      } else if (fieldValue && rules) {
        // select the appropriate rule and use its mappedValue
        var rule = rules.find(function(r) {
          return r['initialValue'] == fieldValue;
        });

        if (rule) {
          targetItem[this.targetField] = rule['mappedValue'];
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    return false;
  }

  /**
   * @inheritDoc
   */
  autoDetect(items) {
    var m = null;
    if (items) {
      var i = items.length;
      var f = undefined;
      while (i--) {
        var item = items[i];
        f = getBestFieldMatch(item, this.regex, f);

        if (f) {
          m = new this.constructor();
          m.field = f;
        }
      }
    }

    return m;
  }

  /**
   * Sets the rules object that the mapping uses to map individual fieldValues to finalValues.
   * Nulls the static value when set.
   *
   * @param {Array<Rule>} rules
   */
  setRules(rules) {
    this.rules = rules;
    this.staticValue = null;
  }

  /**
   * Sets the rules object that the mapping uses to map individual fieldValues to finalValues.
   *
   * @return {Array<Rule>}
   */
  getRules() {
    return this.rules;
  }

  /**
   * Sets the static value for all items. Nulls the mapping rules when set.
   *
   * @param {?S} value
   */
  setStaticValue(value) {
    this.staticValue = value;
    this.field = undefined;
    this.rules = null;
  }

  /**
   * Sets the rules object that the mapping uses to map individual fieldValues to finalValues.
   *
   * @return {?S}
   */
  getStaticValue() {
    return this.staticValue;
  }

  /**
   * Return the display
   *
   * @return {string}
   * @export
   */
  getDisplay() {
    return this.staticValue ? this.staticValue : this.field;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);

    this.persistValues(opt_to);

    opt_to['field'] = this.field;
    opt_to['targetField'] = this.targetField;
    opt_to['displayValue'] = this['displayValue'];

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);

    this.restoreValues(config);

    this.field = config['field'];
    this.targetField = config['targetField'];
    this['displayValue'] = config['displayValue'];
  }

  /**
   * Persister for values. They can contain complex items that need special persistence calls in subclasses.
   *
   * @param {Object} to The object to persist to.
   */
  persistValues(to) {
    var rules = this.getRules();
    if (rules) {
      var ruleConfigs = [];
      for (var i = 0, ii = rules.length; i < ii; i++) {
        ruleConfigs.push(rules[i].persist());
      }

      to['rules'] = ruleConfigs;
    }

    to['staticValue'] = this.staticValue;
  }

  /**
   * Restorer for values. They can contain complex items that need special restoration calls.
   *
   * @param {Object} config The config to restore from.
   */
  restoreValues(config) {
    var ruleConfigs = config['rules'];
    if (ruleConfigs) {
      var rules = [];

      for (var i = 0, ii = ruleConfigs.length; i < ii; i++) {
        var rule = new Rule();
        rule.restore(config);
        rules.push(rule);
      }

      this.setRules(rules);
    }

    this.setStaticValue(config['staticValue']);
  }
}

/**
 * @type {string}
 */
RuleMapping.ID = 'Rule';

MappingRegistry.getInstance().registerMapping(RuleMapping.ID, Rule);

exports = RuleMapping;
