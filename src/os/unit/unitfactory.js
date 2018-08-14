goog.provide('os.unit.UnitFactory');
goog.require('os.unit.EnglishDistanceUnits');
goog.require('os.unit.FeetUnits');
goog.require('os.unit.MetricUnits');
goog.require('os.unit.MileUnits');
goog.require('os.unit.NauticalMileUnits');
goog.require('os.unit.NauticalUnits');
goog.require('os.unit.YardUnits');


/**
 * Descriptor metrics tracked
 * @enum {string}
 */
os.unit.unitSystem = {
  METRIC: 'metric',
  ENGLISH: 'imperial',
  NAUTICAL: 'nautical',
  NAUTICALMILE: 'nauticalmile',
  MILE: 'mile',
  YARD: 'yard',
  FEET: 'feet'
};


/**
 * @type {string}
 * @const
 */
os.unit.UNIT_TYPE_DISTANCE = 'distance';



/**
* Responsible for defining and organizing application units.  Provide easy lookup for units based on a provided
* system or by their name.
*
* A 'system' is a series of units (english, metric, nautical, etc).
* A 'type' is what it being measured (distance, liquid, digital, etc).
* A 'unit' is a series of multipliers for a given system and type, also contains a conversion rate from the
* application's default
* A 'multiplier' defines how to convert values within a unit (milli, kilo, mega, tera, etc)
* @constructor
*/
os.unit.UnitFactory = function() {
  /**
   * @type {Object}
   * @private
   */
  this.systems_ = {};

  this.initialize_();
};


/**
 * Instantiate and organize unit multiplier by their system and type.  Create a dictionary where 'system' is
 * the key and dictionaries are the value, of which 'type' is the key and 'unit' is the value.
 * @private
 */
os.unit.UnitFactory.prototype.initialize_ = function() {
  var englishMultipliers = {};
  englishMultipliers[os.unit.UNIT_TYPE_DISTANCE] = new os.unit.EnglishDistanceUnits();
  this.systems_[os.unit.unitSystem.ENGLISH] = englishMultipliers;

  var metricMultipliers = {};
  metricMultipliers[os.unit.UNIT_TYPE_DISTANCE] = new os.unit.MetricUnits();
  this.systems_[os.unit.unitSystem.METRIC] = metricMultipliers;

  var nauticalMultipliers = {};
  nauticalMultipliers[os.unit.UNIT_TYPE_DISTANCE] = new os.unit.NauticalUnits();
  this.systems_[os.unit.unitSystem.NAUTICAL] = nauticalMultipliers;

  var nauticalMileMultipliers = {};
  nauticalMileMultipliers[os.unit.UNIT_TYPE_DISTANCE] = new os.unit.NauticalMileUnits();
  this.systems_[os.unit.unitSystem.NAUTICALMILE] = nauticalMileMultipliers;

  var mileMultipliers = {};
  mileMultipliers[os.unit.UNIT_TYPE_DISTANCE] = new os.unit.MileUnits();
  this.systems_[os.unit.unitSystem.MILE] = mileMultipliers;

  var yardMultipliers = {};
  yardMultipliers[os.unit.UNIT_TYPE_DISTANCE] = new os.unit.YardUnits();
  this.systems_[os.unit.unitSystem.YARD] = yardMultipliers;

  var feetMultipliers = {};
  feetMultipliers[os.unit.UNIT_TYPE_DISTANCE] = new os.unit.FeetUnits();
  this.systems_[os.unit.unitSystem.FEET] = feetMultipliers;
};


/**
 * Retrieve a unit definition for the provided system and type.
 * For example: getUnit('english', 'distance') returns the unit that contains inches, yards, feet, miles, etc.
 * @param {?string} system
 * @param {?string} type
 * @return {?os.unit.IUnit}
 */
os.unit.UnitFactory.prototype.getUnit = function(system, type) {
  var sys = /** @type {os.unit.IUnit} */ (this.systems_[system]);
  return sys ? sys[type] : null;
};


/**
 * Retrieve all of the defined systems in the application ('english', 'metric', 'nautical', etc)
 * @return {Array}
 */
os.unit.UnitFactory.prototype.getSystems = function() {
  return Object.keys(this.systems_ ? this.systems_ : {});
};


/**
 * Retrieve all of the fully defined systems in the application ('english', 'metric', 'nautical', etc)
 * @return {Object}
 */
os.unit.UnitFactory.prototype.getFullSystems = function() {
  return this.systems_;
};
