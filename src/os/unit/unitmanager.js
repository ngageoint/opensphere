goog.provide('os.unit.UNITS');
goog.provide('os.unit.UnitChange');
goog.provide('os.unit.UnitManager');
goog.require('goog.events.EventTarget');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.unit.IUnit');
goog.require('os.unit.UnitFactory');


/**
 * @type {string}
 */
os.unit.UnitChange = 'unit:change';


/**
 * The base key used by all unit settings.
 * @type {string}
 * @const
 */
os.unit.UNITS = 'os.map.units';



/**
 * Handles conversion between unit systems (metric, imperial, etc)
 * Provides formatting convenience functions
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.unit.UnitManager = function() {
  os.unit.UnitManager.base(this, 'constructor');

  /**
   * @type {os.unit.UnitFactory}
   * @private
   */
  this.unitFactory_ = new os.unit.UnitFactory();

  /**
   * @type {string}
   * @private
   */
  this.baseSystem_ = os.unit.unitSystem.METRIC;

  /**
   * @type {string}
   * @private
   */
  this.selectedSystem_ = /** @type {string} */ (os.settings.get(os.unit.UNITS, this.baseSystem_));

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
  goog.array.sort(this.systems_);

  os.settings.listen(os.unit.UNITS, this.onUnitsChange_, false, this);
};
goog.inherits(os.unit.UnitManager, goog.events.EventTarget);
goog.addSingletonGetter(os.unit.UnitManager);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.unit.UnitManager.LOGGER_ = goog.log.getLogger('os.unit.UnitManager');


/**
 * @return {Array}
 */
os.unit.UnitManager.prototype.getSystems = function() {
  return this.systems_;
};


/**
 * @return {Object}
 */
os.unit.UnitManager.prototype.getFullSystems = function() {
  return this.fullSystems_;
};


/**
 * Retrieve the system currently applied in the application ('english', 'nautical, 'metric', etc)
 * @return {string}
 */
os.unit.UnitManager.prototype.getSelectedSystem = function() {
  return this.selectedSystem_;
};


/**
 * @param {string} system
 */
os.unit.UnitManager.prototype.setSelectedSystem = function(system) {
  var oldSystem = this.selectedSystem_;
  this.selectedSystem_ = system;
  os.settings.set(os.unit.UNITS, system);
  this.dispatchEvent(new os.events.PropertyChangeEvent(os.unit.UnitChange, system, oldSystem));
};


/**
 * Retrieve the application's default system ('metric')
 * @return {string}
 */
os.unit.UnitManager.prototype.getBaseSystem = function() {
  return this.baseSystem_;
};


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
 * @param {?string} unitType
 * @param {number} valueToConvert
 * @param {?string} multFromKey
 * @param {?string} fromSys
 * @param {?string} multToKey
 * @param {?string} toSys
 * @return {number}
 */
os.unit.UnitManager.prototype.convert = function(unitType, valueToConvert, multFromKey, fromSys, multToKey, toSys) {
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
  if (toMultiplier !== toDefaultMultiplier) {
    valueToConvert /= toMultiplier.getMultiplier();
  }
  return valueToConvert;
};


/**
 * Retrieve the application's base unit - the unit definition that acts as common ground for all conversions.
 * @param {?string} unitType - the type of measurement being taken ('distance', etc)
 * @return {?os.unit.IUnit}
 */
os.unit.UnitManager.prototype.getBaseUnits = function(unitType) {
  return this.unitFactory_.getUnit(this.baseSystem_, unitType);
};


/**
* Convert the provided value into its best suitable unit multiplier (e.g.:feet vs. miles) in the current
* selected system.
* Return a human-readable string of the conversion.  If no suitable unit multiplier can be established, the
* default multiplier for that unit is used.
* @param {?string} unitType - the type of measurement ('distance', etc)
* @param {number} value - the value to be converted and formatted
* @param {?string} multFromKey - the key of the multiplier that <code>value</code> is currently specified in ('Km')
* @param {?string} fromSystem - the system that <code>multiplierFromKey</code> belongs to
* @param {number=} opt_fixed - optional, the number of decimal digits to use when formatting <code>value</code>
* @return {string}
*/
os.unit.UnitManager.prototype.formatToBestFit = function(unitType, value, multFromKey, fromSystem, opt_fixed) {
  // convert incoming value to application's base
  var baseMultiplKey = this.getBaseUnits(unitType).getDefaultMultiplier().getName();
  var baseValue = this.convert(unitType, value, multFromKey, fromSystem, baseMultiplKey, this.baseSystem_);

  // determine the best fit multiplier for selected the unit
  var selectedUnit = this.unitFactory_.getUnit(this.selectedSystem_, unitType);
  var bestFitMult = selectedUnit.getBestFitMultiplier(baseValue);

  // convert the value to the established multiplier
  var convertedValue = this.convert(unitType, baseValue, baseMultiplKey, this.baseSystem_, bestFitMult.getName(),
      this.selectedSystem_);
  return selectedUnit.format(convertedValue, bestFitMult, opt_fixed ? opt_fixed : -1);
};


/**
 * Handle units setting change.
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.unit.UnitManager.prototype.onUnitsChange_ = function(event) {
  if (typeof event.newVal === 'string') {
    this.setSelectedSystem(event.newVal);
  } else {
    goog.log.warning(os.unit.UnitManager.LOGGER_, 'Unrecognized units change value: ' + event.newVal);
  }
};
