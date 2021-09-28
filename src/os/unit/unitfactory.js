goog.declareModuleId('os.unit.UnitFactory');

import EnglishDistanceUnits from './englishdistanceunits.js';
import FeetUnits from './feetunits.js';
import MetricUnits from './metricunits.js';
import MileUnits from './mileunits.js';
import NauticalMileUnits from './nauticalmileunits.js';
import NauticalUnits from './nauticalunits.js';
import {UNIT_TYPE_DISTANCE, UnitSystem} from './unit.js';
import YardUnits from './yardunits.js';

const {default: IUnit} = goog.requireType('os.unit.IUnit');


/**
 * Responsible for defining and organizing application units.  Provide easy lookup for units based on a provided
 * system or by their name.
 *
 * A 'system' is a series of units (english, metric, nautical, etc).
 * A 'type' is what it being measured (distance, liquid, digital, etc).
 * A 'unit' is a series of multipliers for a given system and type, also contains a conversion rate from the
 * application's default
 * A 'multiplier' defines how to convert values within a unit (milli, kilo, mega, tera, etc)
 */
export default class UnitFactory {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {!Object<?string, Object<?string, IUnit>>}
     * @private
     */
    this.systems_ = {};

    this.initialize_();
  }

  /**
   * Instantiate and organize unit multiplier by their system and type.  Create a dictionary where 'system' is
   * the key and dictionaries are the value, of which 'type' is the key and 'unit' is the value.
   *
   * @private
   */
  initialize_() {
    var englishMultipliers = {};
    englishMultipliers[UNIT_TYPE_DISTANCE] = new EnglishDistanceUnits();
    this.systems_[UnitSystem.ENGLISH] = englishMultipliers;

    var metricMultipliers = {};
    metricMultipliers[UNIT_TYPE_DISTANCE] = new MetricUnits();
    this.systems_[UnitSystem.METRIC] = metricMultipliers;

    var nauticalMultipliers = {};
    nauticalMultipliers[UNIT_TYPE_DISTANCE] = new NauticalUnits();
    this.systems_[UnitSystem.NAUTICAL] = nauticalMultipliers;

    var nauticalMileMultipliers = {};
    nauticalMileMultipliers[UNIT_TYPE_DISTANCE] = new NauticalMileUnits();
    this.systems_[UnitSystem.NAUTICALMILE] = nauticalMileMultipliers;

    var mileMultipliers = {};
    mileMultipliers[UNIT_TYPE_DISTANCE] = new MileUnits();
    this.systems_[UnitSystem.MILE] = mileMultipliers;

    var yardMultipliers = {};
    yardMultipliers[UNIT_TYPE_DISTANCE] = new YardUnits();
    this.systems_[UnitSystem.YARD] = yardMultipliers;

    var feetMultipliers = {};
    feetMultipliers[UNIT_TYPE_DISTANCE] = new FeetUnits();
    this.systems_[UnitSystem.FEET] = feetMultipliers;
  }

  /**
   * Retrieve a unit definition for the provided system and type.
   * For example: getUnit('english', 'distance') returns the unit that contains inches, yards, feet, miles, etc.
   *
   * @param {?string} system
   * @param {?string} type
   * @return {?IUnit}
   */
  getUnit(system, type) {
    var sys = /** @type {Object<?string, IUnit>} */ (this.systems_[system]);
    return sys ? sys[type] : null;
  }

  /**
   * Retrieve all of the defined systems in the application ('english', 'metric', 'nautical', etc)
   *
   * @return {Array}
   */
  getSystems() {
    return Object.keys(this.systems_);
  }

  /**
   * Retrieve all of the fully defined systems in the application ('english', 'metric', 'nautical', etc)
   *
   * @return {!Object<?string, Object<?string, IUnit>>}
   */
  getFullSystems() {
    return this.systems_;
  }
}
