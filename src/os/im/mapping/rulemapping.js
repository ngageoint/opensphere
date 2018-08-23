goog.provide('os.im.mapping.Rule');
goog.provide('os.im.mapping.RuleMapping');

goog.require('os.IPersistable');
goog.require('os.geo');
goog.require('os.im.mapping.AbstractMapping');
goog.require('os.im.mapping.MappingRegistry');



/**
 * Represents a rule for mapping a string field value to a target value.
 * @param {string=} opt_initialValue The initial field value
 * @param {T=} opt_mappedValue The value to map to
 * @implements {os.IPersistable}
 * @constructor
 * @template T
 */
os.im.mapping.Rule = function(opt_initialValue, opt_mappedValue) {
  /**
   * @type {string}
   */
  this['initialValue'] = opt_initialValue || '';

  /**
   * @type {T|undefined}
   */
  this['mappedValue'] = opt_mappedValue;
};


/**
 * @inheritDoc
 */
os.im.mapping.Rule.prototype.persist = function(opt_to) {
  opt_to = opt_to || {};

  opt_to['initialValue'] = this['initialValue'];
  opt_to['mappedValue'] = this['mappedValue'];

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.mapping.Rule.prototype.restore = function(config) {
  this['initialValue'] = config['initialValue'];
  this['mappedValue'] = config['mappedValue'];
};



/**
 * This mapping uses a set of rules or a static value to map values.
 * @extends {os.im.mapping.AbstractMapping<Object>}
 * @constructor
 * @template S
 */
os.im.mapping.RuleMapping = function() {
  os.im.mapping.RuleMapping.base(this, 'constructor');

  /**
   * @type {string}
   * @protected
   */
  this.type = os.im.mapping.RuleMapping.ID;

  /**
   * Static value. If defined, the mapping will map everything to this.
   * @type {?S}
   * @protected
   */
  this.staticValue = null;

  /**
   * The rules map string values to items of type S
   * @type {?Array<os.im.mapping.Rule<S>>}
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
};
goog.inherits(os.im.mapping.RuleMapping, os.im.mapping.AbstractMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.RuleMapping.ID = 'Rule';
os.im.mapping.MappingRegistry.getInstance().registerMapping(os.im.mapping.RuleMapping.ID, os.im.mapping.Rule);


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.getId = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.getFieldsChanged = function() {
  return [this.field, this.targetField];
};


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.getLabel = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.getScore = function() {
  if (this.type && this.field) {
    return this.type.toLowerCase().indexOf(this.field.toLowerCase()) == 0 ? 11 : 10;
  }

  return os.im.mapping.RuleMapping.base(this, 'getScore');
};


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.getScoreType = function() {
  return 'rule';
};


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.execute = function(item, targetItem) {
  if (this.field && this.targetField) {
    var fieldValue = os.im.mapping.getItemField(item, this.field);
    var rules = this.getRules();
    var staticValue = this.staticValue;

    if (staticValue) {
      // map to the static value every time
      targetItem[this.targetField] = staticValue;
    } else if (fieldValue && rules) {
      // select the appropriate rule and use its mappedValue
      var rule = goog.array.find(rules, function(r) {
        return r['initialValue'] == fieldValue;
      });

      if (rule) {
        targetItem[this.targetField] = rule['mappedValue'];
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.testField = function(value) {
  return false;
};


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.autoDetect = function(items) {
  var m = null;
  if (items) {
    var i = items.length;
    var f = undefined;
    while (i--) {
      var item = items[i];
      f = os.im.mapping.getBestFieldMatch(item, this.regex, f);

      if (f) {
        m = new this.constructor();
        m.field = f;
      }
    }
  }

  return m;
};


/**
 * Sets the rules object that the mapping uses to map individual fieldValues to finalValues.
 * Nulls the static value when set.
 * @param {Array<os.im.mapping.Rule>} rules
 */
os.im.mapping.RuleMapping.prototype.setRules = function(rules) {
  this.rules = rules;
  this.staticValue = null;
};


/**
 * Sets the rules object that the mapping uses to map individual fieldValues to finalValues.
 * @return {Array<os.im.mapping.Rule>}
 */
os.im.mapping.RuleMapping.prototype.getRules = function() {
  return this.rules;
};


/**
 * Sets the static value for all items. Nulls the mapping rules when set.
 * @param {?S} value
 */
os.im.mapping.RuleMapping.prototype.setStaticValue = function(value) {
  this.staticValue = value;
  this.field = undefined;
  this.rules = null;
};


/**
 * Sets the rules object that the mapping uses to map individual fieldValues to finalValues.
 * @return {?S}
 */
os.im.mapping.RuleMapping.prototype.getStaticValue = function() {
  return this.staticValue;
};


/**
 * Return the display
 * @return {string}
 * @export
 */
os.im.mapping.RuleMapping.prototype.getDisplay = function() {
  return this.staticValue ? this.staticValue : this.field;
};


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.persist = function(opt_to) {
  opt_to = os.im.mapping.RuleMapping.base(this, 'persist', opt_to);

  this.persistValues(opt_to);

  opt_to['field'] = this.field;
  opt_to['targetField'] = this.targetField;

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.mapping.RuleMapping.prototype.restore = function(config) {
  os.im.mapping.RuleMapping.base(this, 'restore', config);

  this.restoreValues(config);

  this.field = config['field'];
  this.targetField = config['targetField'];
};


/**
 * Persister for values. They can contain complex items that need special persistence calls in subclasses.
 * @param {Object} to The object to persist to.
 */
os.im.mapping.RuleMapping.prototype.persistValues = function(to) {
  var rules = this.getRules();
  if (rules) {
    var ruleConfigs = [];
    for (var i = 0, ii = rules.length; i < ii; i++) {
      ruleConfigs.push(rules[i].persist());
    }

    to['rules'] = ruleConfigs;
  }

  to['staticValue'] = this.staticValue;
};


/**
 * Restorer for values. They can contain complex items that need special restoration calls.
 * @param {Object} config The config to restore from.
 */
os.im.mapping.RuleMapping.prototype.restoreValues = function(config) {
  var ruleConfigs = config['rules'];
  if (ruleConfigs) {
    var rules = [];

    for (var i = 0, ii = ruleConfigs.length; i < ii; i++) {
      var rule = new os.im.mapping.Rule();
      rule.restore(config);
      rules.push(rule);
    }

    this.setRules(rules);
  }

  this.staticValue = config['staticValue'];
};
