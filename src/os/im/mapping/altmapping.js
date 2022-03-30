goog.declareModuleId('os.im.mapping.AltMapping');

import {setAltitude} from '../../feature/feature.js';
import Fields from '../../fields/fields.js';
import {DEFAULT_ALT_COL_NAME, DEFAULT_ALT_UNIT} from '../../fields/index.js';
import * as geo from '../../geo/geo.js';
import {convertUnits} from '../../math/math.js';
import UnitLabels from '../../math/unitlabels.js';
import Units from '../../math/units.js';
import AltMappingId from './altmappingid.js';
import * as osMapping from './mapping.js';
import MappingRegistry from './mappingregistry.js';
import RenameMapping from './renamemapping.js';

const googObject = goog.require('goog.object');
const {toTitleCase} = goog.require('goog.string');

/**
 * Altitude mapping.
 *
 * @extends {RenameMapping<Feature>}
 */
export default class AltMapping extends RenameMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.field = Fields.ALT;
    this.toField = DEFAULT_ALT_COL_NAME;
    this.xmlType = AltMapping.ID;

    /**
     * The mapping type.
     * @type {string}
     * @protected
     */
    this.type = AltMapping.ID;

    /**
     * The original altitude units field.
     * @type {string}
     */
    this.unitsField = Fields.ALT_UNITS;

    /**
     * The target altitude units field.
     * @type {string}
     */
    this.unitsToField = Fields.ALT_UNITS;

    /**
     * The altitude units.
     * @type {string}
     */
    this.units = DEFAULT_ALT_UNIT;

    /**
     * Regular expression to match an altitude column.
     * @type {!RegExp}
     * @protected
     */
    this.altRegEx = geo.ALT_REGEXP;

    /**
     * Regular expression to match an altitude units column.
     * @type {!RegExp}
     * @protected
     */
    this.altUnitsRegEx = geo.ALT_UNITS_REGEXP;

    /**
     * Regular expression to match an inverse altitude column.
     * @type {!RegExp}
     * @protected
     */
    this.inverseAltRegEx = geo.ALT_INVERSE_REGEXP;

    /**
     * Regular expression to match an inverse altitude units column.
     * @type {!RegExp}
     * @protected
     */
    this.inverseAltUnitsRegEx = geo.ALT_INVERSE_UNITS_REGEXP;

    /**
     * If the detected column is inverse altitude.
     * @type {boolean}
     */
    this.isInverse = false;

    /**
     * If a manual units override has been set.
     * @type {boolean}
     */
    this.unitsOverride = false;
  }

  /**
   * Get the units used by the mapping.
   *
   * @return {string}
   */
  getUnits() {
    return this.units;
  }

  /**
   * Override any units columns that may have been detected with an externally defined value
   * This is currently only used by CSV import when the user chooses a different starting unit
   *
   * @param {string} units
   */
  setUnits(units) {
    this.units = units;
    if (this.units != DEFAULT_ALT_UNIT) {
      this.unitsOverride = true;
    }
  }

  /**
   * Get if the mapping is for inverse altitude.
   *
   * @return {boolean}
   */
  getInverse() {
    return this.isInverse;
  }

  /**
   * Set if parsed altitude values should be inverted.
   *
   * @param {boolean} isInverse If parsed altitude values should be inverted.
   */
  setInverse(isInverse) {
    this.isInverse = isInverse;
  }

  /**
   * Get the altitude units regular expression.
   *
   * @return {!RegExp}
   * @protected
   */
  getUnitsRegExp() {
    return this.isInverse ? this.inverseAltUnitsRegEx : this.altUnitsRegEx;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.xmlType;
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return this.type;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  execute(feature) {
    if (feature && this.field) {
      var targetField = this.toField || this.field;
      if (feature && feature.values_[Fields.GEOM_ALT] != null) {
        // don't do a thing.  the alt was set in the point geom
        // just set our derived column to whatever that says
        osMapping.setItemField(feature, targetField, Math.round(feature.values_[Fields.GEOM_ALT]));
      } else {
        // perform the mapping
        var current = Number(osMapping.getItemField(feature, this.field));
        if (!isNaN(current)) {
          // convert to units set externally.  This defaults to meters, so if it
          // hasn't been changed externally, we are just doing meters to meters
          // i.e. nothing changes
          if (this.units !== Units.METERS) {
            current = convertUnits(current, Units.METERS, this.units);
          }

          if (!this.unitsOverride) {
            // check for a units field
            var u = osMapping.getBestFieldMatch(feature, this.getUnitsRegExp());
            if (u) {
              this.unitsField = u;
            }
            // if a unit field was detected, get the value and convert it to meters from that
            var curUnits = /** @type {string|undefined} */(osMapping.getItemField(feature, this.unitsField));

            // look up the units from the data in our list of known units (example: FEET ->ft)
            if (curUnits) {
              curUnits = this.lookupUnits(curUnits);
            }

            // convert the value to the found units
            if (curUnits) {
              current = convertUnits(current, Units.METERS, curUnits);
            }
          }

          current = Math.round(current);

          if (this.isInverse) {
            current = -current;
          }
        } else {
          current = 0;
        }

        // set the new field
        osMapping.setItemField(feature, targetField, current);

        setAltitude(feature, targetField);
      }
    }
  }

  /**
   * @inheritDoc
   */
  testField(value) {
    // we always want an altitude component on coordinates, even if its zero
    return true;
  }

  /**
   * @inheritDoc
   */
  autoDetect(items) {
    if (items) {
      var i = items.length;
      while (i--) {
        var feature = items[i];
        var f = osMapping.getBestFieldMatch(feature, this.altRegEx);

        if (!f) {
          f = osMapping.getBestFieldMatch(feature, this.inverseAltRegEx);

          if (f) {
            this.setInverse(true);
          }
        } else {
          this.setInverse(false);
        }

        if (f) {
          var m = new this.constructor();
          m.field = f;
          m.isInverse = this.isInverse;

          // try to detect the units
          var u = osMapping.getBestFieldMatch(feature, this.getUnitsRegExp());
          if (u) {
            m.unitsField = u;
          }

          // don't forget to grab the units and override flag if they have been set externally
          m.units = this.units;
          m.unitsOverride = this.unitsOverride;
          return m;
        }
      }
    }

    return null;
  }

  /**
   * Determine if the provided string is a recognized units value in Units
   *
   * @param {string} units the string representing units
   * @return {?string} A recognizable unit value from math.Units or null if one was not found
   */
  lookupUnits(units) {
    var ret = null;
    var u = toTitleCase(units.toLowerCase());

    // check if the value is a key within our defined units object
    if (googObject.containsKey(UnitLabels, u)) {
      ret = /** @type {?string} */ (googObject.getValueByKeys(UnitLabels, u));
    } else if (googObject.containsValue(Units, u.toLowerCase())) {
      ret = u.toLowerCase();
    }

    return ret;
  }

  /**
   * @inheritDoc
   */
  clone() {
    var other = /** @type {AltMapping} */ (super.clone());
    other.setUnits(this.getUnits());
    other.unitsField = this.unitsField;
    other.unitsToField = this.unitsToField;
    other.unitsOverride = this.unitsOverride;
    other.setInverse(this.isInverse);
    return other;
  }
}

/**
 * @type {string}
 * @override
 */
AltMapping.ID = AltMappingId;

// Register the mapping.
MappingRegistry.getInstance().registerMapping(AltMapping.ID, AltMapping);
