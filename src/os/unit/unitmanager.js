goog.declareModuleId('os.unit.UnitManager');

import Settings from '../config/settings.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {UNITS, UnitSystem} from './unit.js';
import UnitChange from './unitchange.js';
import UnitFactory from './unitfactory.js';

const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const {default: SettingChangeEvent} = goog.requireType('os.events.SettingChangeEvent');


const {default: IMultiplier} = goog.requireType('os.unit.IMultiplier');
const {default: IUnit} = goog.requireType('os.unit.IUnit');


/**
 * Handles conversion between unit systems (metric, imperial, etc)
 * Provides formatting convenience functions
 */
export default class UnitManager extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {UnitFactory}
     * @private
     */
    this.unitFactory_ = new UnitFactory();

    /**
     * @type {string}
     * @private
     */
    this.baseSystem_ = UnitSystem.METRIC;

    /**
     * @type {string}
     * @private
     */
    this.selectedSystem_ = /** @type {string} */ (Settings.getInstance().get(UNITS, this.baseSystem_));

    /**
     * @type {Object}
     * @private
     */
    this.fullSystems_ = this.unitFactory_.getFullSystems();

    /**
     * @type {Array}
     * @private
     */
    this.systems_ = this.unitFactory_.getSystems();
    this.systems_.sort();

    Settings.getInstance().listen(UNITS, this.onUnitsChange_, false, this);
  }

  /**
   * @return {Array}
   */
  getSystems() {
    return this.systems_;
  }

  /**
   * @return {Object}
   */
  getFullSystems() {
    return this.fullSystems_;
  }

  /**
   * Retrieve the system currently applied in the application ('english', 'nautical, 'metric', etc)
   *
   * @return {string}
   */
  getSelectedSystem() {
    return this.selectedSystem_;
  }

  /**
   * @param {string} system
   */
  setSelectedSystem(system) {
    var oldSystem = this.selectedSystem_;
    this.selectedSystem_ = system;
    Settings.getInstance().set(UNITS, system);
    this.dispatchEvent(new PropertyChangeEvent(UnitChange, system, oldSystem));
  }

  /**
   * Retrieve the application's default system ('metric')
   *
   * @return {string}
   */
  getBaseSystem() {
    return this.baseSystem_;
  }

  /**
   * Retrieve the application's default system ('metric')
   * Converts a given value (<code>valueToConvert</code>) to the currently selected units, based on unit type.
   *
   * 4 steps taken to convert the value (skipping steps that are unnecessary):
   * 1. Convert from the multiplier of the 'from' to the default multiplier of the 'from'.
   * * This allows us to be able to convert among units.
   * 2. Convert from the 'from' unit to the application's base unit.
   * 3. Convert from the applications base unit to the 'to' unit
   * 4. Convert from the 'to' unit's default multiplier to the desired multiplier
   *
   * That is, in order to get from inches to nautical feet:
   * 1. convert inches to miles
   * 2. convert miles to meters
   * 3. convert meters to nautical miles
   * 4. convert nautical miles to nautical feet
   *
   * @param {?string} unitType
   * @param {number} valueToConvert
   * @param {?string} multFromKey
   * @param {?string} fromSys
   * @param {?string} multToKey
   * @param {?string} toSys
   * @return {number}
   */
  convert(unitType, valueToConvert, multFromKey, fromSys, multToKey, toSys) {
    // Convert fromUnit to base, then base to toUnit:
    // Convert to the default multiplier within the 'from' units
    var fromUnit = this.unitFactory_.getUnit(fromSys, unitType);
    var fromMultiplier = fromUnit.getMultiplier(multFromKey);
    var fromDefaultMultiplier = fromUnit.getDefaultMultiplier();
    if (fromMultiplier !== fromDefaultMultiplier) {
      valueToConvert *= fromMultiplier.getMultiplier();
    }

    // Convert units by applying the factor of the default 'from' multiplier to the default app multiplier
    var baseUnit = this.getBaseUnits(unitType);
    if (baseUnit !== fromUnit) {
      valueToConvert /= fromUnit.getConversionFactor();
    }

    // Convert units by applying the factor of the default app multiplier to the default 'to' multiplier
    var toUnit = this.unitFactory_.getUnit(toSys, unitType);
    if (toUnit !== baseUnit) {
      valueToConvert *= toUnit.getConversionFactor();
    }

    // Convert to the default multiplier within the 'to' units
    var toMultiplier = toUnit.getMultiplier(multToKey);
    var toDefaultMultiplier = toUnit.getDefaultMultiplier();
    if (toMultiplier && toMultiplier !== toDefaultMultiplier) {
      valueToConvert /= toMultiplier.getMultiplier();
    }
    return valueToConvert;
  }

  /**
   * Retrieve the application's base unit - the unit definition that acts as common ground for all conversions.
   *
   * @param {?string} unitType - the type of measurement being taken ('distance', etc)
   * @return {?IUnit}
   */
  getBaseUnits(unitType) {
    return this.unitFactory_.getUnit(this.baseSystem_, unitType);
  }

  /**
   * Convert the provided value into its best suitable unit multiplier (e.g.:feet vs. miles) in the current
   * selected system.
   * Return a human-readable string of the conversion.  If no suitable unit multiplier can be established, the
   * default multiplier for that unit is used.
   *
   * @param {?string} unitType - the type of measurement ('distance', etc)
   * @param {number} value - the value to be converted and formatted
   * @param {?string} multFromKey - the key of the multiplier that <code>value</code> is currently specified in ('Km')
   * @param {?string} fromSystem - the system that <code>multiplierFromKey</code> belongs to
   * @param {number=} opt_fixed - optional, the number of decimal digits to use when formatting <code>value</code>
   * @return {string}
   */
  formatToBestFit(unitType, value, multFromKey, fromSystem, opt_fixed) {
    // convert incoming value to application's base
    var baseMultiplKey = this.getBaseUnits(unitType).getDefaultMultiplier().getName();
    var baseValue = this.convert(unitType, value, multFromKey, fromSystem, baseMultiplKey, this.baseSystem_);

    // determine the best fit multiplier for selected the unit
    var selectedUnit = this.unitFactory_.getUnit(this.selectedSystem_, unitType);
    var bestFitMult = this.getBestFitMultiplier(selectedUnit, baseValue);

    // convert the value to the established multiplier
    var convertedValue = this.convert(unitType, baseValue, baseMultiplKey, this.baseSystem_, bestFitMult.getName(),
        this.selectedSystem_);
    return selectedUnit.format(convertedValue, bestFitMult, opt_fixed ? opt_fixed : -1);
  }

  /**
   * Calculate the best mutliplier of this unit to use for the given value.  The <code>value</code> is expected
   * to be specified in the application's base unit's default multiplier ('meter')
   * @param {IUnit} unit The unit to calculate a best fit on.
   * @param {number} value The value for which to calculate a best fit multiplier
   * @return {IMultiplier}
   */
  getBestFitMultiplier(unit, value) {
    var um = this;
    var bestMult;
    var baseMult = um.getBaseUnits(unit.getUnitType());

    if (value == 0.0) {
      return baseMult.getDefaultMultiplier();
    }

    var size = unit.bestFitCandidates.length;
    if (baseMult) {
      var baseMultKey = baseMult.getDefaultMultiplier().getName();
      for (var i = 0; i < size; i++) {
        var testValue = Math.abs(um.convert(unit.getUnitType(), value, baseMultKey, um.getBaseSystem(),
            unit.bestFitCandidates[i].getName(), unit.getSystem()));
        if (testValue >= unit.bestFitCandidates[i].getThreshold()) {
          bestMult = unit.bestFitCandidates[i];
          break;
        }
      }
    }

    return (bestMult != null) ? bestMult : size > 0 ? unit.bestFitCandidates[size - 1] : null; // fallback to smallest
  }

  /**
   * Handle units setting change.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onUnitsChange_(event) {
    if (typeof event.newVal === 'string') {
      this.setSelectedSystem(event.newVal);
    } else {
      log.warning(UnitManager.LOGGER_, 'Unrecognized units change value: ' + event.newVal);
    }
  }
}

goog.addSingletonGetter(UnitManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
UnitManager.LOGGER_ = log.getLogger('os.unit.UnitManager');
