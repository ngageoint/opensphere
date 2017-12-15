goog.provide('os.im.mapping.AltMapping');

goog.require('os.Fields');
goog.require('os.feature');
goog.require('os.geo');
goog.require('os.im.mapping');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.RenameMapping');
goog.require('os.math');
goog.require('os.math.Units');


/**
 * Altitude mapping.
 * @extends {os.im.mapping.RenameMapping<ol.Feature>}
 * @constructor
 */
os.im.mapping.AltMapping = function() {
  os.im.mapping.AltMapping.base(this, 'constructor');
  this.field = os.Fields.ALT;
  this.toField = os.fields.DEFAULT_ALT_COL_NAME;
  this.xmlType = os.im.mapping.AltMapping.ID;

  /**
   * The mapping type.
   * @type {string}
   * @protected
   */
  this.type = os.im.mapping.AltMapping.ID;

  /**
   * The original altitude units field.
   * @type {string}
   */
  this.unitsField = os.Fields.ALT_UNITS;

  /**
   * The target altitude units field.
   * @type {string}
   */
  this.unitsToField = os.Fields.ALT_UNITS;

  /**
   * The altitude units.
   * @type {string}
   */
  this.units = os.fields.DEFAULT_ALT_UNIT;

  /**
   * Regular expression to match an altitude column.
   * @type {!RegExp}
   * @protected
   */
  this.altRegEx = os.geo.ALT_REGEXP;

  /**
   * Regular expression to match an altitude units column.
   * @type {!RegExp}
   * @protected
   */
  this.altUnitsRegEx = os.geo.ALT_UNITS_REGEXP;

  /**
   * Regular expression to match an inverse altitude column.
   * @type {!RegExp}
   * @protected
   */
  this.inverseAltRegEx = os.geo.ALT_INVERSE_REGEXP;

  /**
   * Regular expression to match an inverse altitude units column.
   * @type {!RegExp}
   * @protected
   */
  this.inverseAltUnitsRegEx = os.geo.ALT_INVERSE_UNITS_REGEXP;

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
};
goog.inherits(os.im.mapping.AltMapping, os.im.mapping.RenameMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.AltMapping.ID = 'Altitude';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.AltMapping.ID, os.im.mapping.AltMapping);


/**
 * Get the units used by the mapping.
 * @return {string}
 */
os.im.mapping.AltMapping.prototype.getUnits = function() {
  return this.units;
};


/**
 * Override any units columns that may have been detected with an externally defined value
 * This is currently only used by CSV import when the user chooses a different starting unit
 * @param {string} units
 */
os.im.mapping.AltMapping.prototype.setUnits = function(units) {
  this.units = units;
  if (this.units != os.fields.DEFAULT_ALT_UNIT) {
    this.unitsOverride = true;
  }
};


/**
 * Get if the mapping is for inverse altitude.
 * @return {boolean}
 */
os.im.mapping.AltMapping.prototype.getInverse = function() {
  return this.isInverse;
};


/**
 * Set if parsed altitude values should be inverted.
 * @param {boolean} isInverse If parsed altitude values should be inverted.
 */
os.im.mapping.AltMapping.prototype.setInverse = function(isInverse) {
  this.isInverse = isInverse;
};


/**
 * Get the altitude units regular expression.
 * @return {!RegExp}
 * @protected
 */
os.im.mapping.AltMapping.prototype.getUnitsRegExp = function() {
  return this.isInverse ? this.inverseAltUnitsRegEx : this.altUnitsRegEx;
};


/**
 * @inheritDoc
 */
os.im.mapping.AltMapping.prototype.getId = function() {
  return this.xmlType;
};


/**
 * @inheritDoc
 */
os.im.mapping.AltMapping.prototype.getLabel = function() {
  return this.type;
};


/**
 * @inheritDoc
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.im.mapping.AltMapping.prototype.execute = function(feature) {
  if (feature && this.field) {
    var targetField = this.toField || this.field;
    if (feature && feature.values_[os.Fields.GEOM_ALT] != null) {
      // don't do a thing.  the alt was set in the point geom
      // just set our derived column to whatever that says
      os.im.mapping.setItemField(feature, targetField, Math.round(feature.values_[os.Fields.GEOM_ALT]));
    } else {
      // perform the mapping
      var current = Number(os.im.mapping.getItemField(feature, this.field));
      if (!isNaN(current)) {
        // convert to units set externally.  This defaults to meters, so if it
        // hasn't been changed externally, we are just doing meters to meters
        // i.e. nothing changes
        if (this.units !== os.math.Units.METERS) {
          current = os.math.convertUnits(current, os.math.Units.METERS, this.units);
        }

        if (!this.unitsOverride) {
          // check for a units field
          var u = os.im.mapping.getBestFieldMatch(feature, this.getUnitsRegExp());
          if (u) {
            this.unitsField = u;
          }
          // if a unit field was detected, get the value and convert it to meters from that
          var curUnits = /** @type {string|undefined} */(os.im.mapping.getItemField(feature, this.unitsField));

          // look up the units from the data in our list of known units (example: FEET ->ft)
          if (curUnits) {
            curUnits = this.lookupUnits(curUnits);
          }

          // convert the value to the found units
          if (curUnits) {
            current = os.math.convertUnits(current, os.math.Units.METERS, curUnits);
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
      os.im.mapping.setItemField(feature, targetField, current);

      os.feature.setAltitude(feature, targetField);
    }
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.AltMapping.prototype.testField = function(value) {
  // we always want an altitude component on coordinates, even if its zero
  return true;
};


/**
 * @inheritDoc
 */
os.im.mapping.AltMapping.prototype.autoDetect = function(items) {
  if (items) {
    var i = items.length;
    while (i--) {
      var feature = items[i];
      var f = os.im.mapping.getBestFieldMatch(feature, this.altRegEx);

      if (!f) {
        f = os.im.mapping.getBestFieldMatch(feature, this.inverseAltRegEx);

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
        var u = os.im.mapping.getBestFieldMatch(feature, this.getUnitsRegExp());
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
};


/**
 * Determine if the provided string is a recognized units value in os.math.Units
 * @param {string} units the string representing units
 * @return {?string} A recognizable unit value from os.math.Units or null if one was not found
 */
os.im.mapping.AltMapping.prototype.lookupUnits = function(units) {
  var ret = null;
  var u = goog.string.toTitleCase(units.toLowerCase());

  // check if the value is a key within our defined units object
  if (goog.object.containsKey(os.math.UnitLabels, u)) {
    ret = /** @type {?string} */ (goog.object.getValueByKeys(os.math.UnitLabels, u));
  } else if (goog.object.containsValue(os.math.Units, u.toLowerCase())) {
    ret = u.toLowerCase();
  }

  return ret;
};


/**
 * @inheritDoc
 */
os.im.mapping.AltMapping.prototype.clone = function() {
  var other = os.im.mapping.AltMapping.base(this, 'clone');
  other.setUnits(this.getUnits());
  other.unitsField = this.unitsField;
  other.unitsToField = this.unitsToField;
  other.unitsOverride = this.unitsOverride;
  other.setInverse(this.isInverse);
  return other;
};
