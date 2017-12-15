goog.provide('os.im.mapping.RadiusMapping');
goog.require('os.Fields');
goog.require('os.geo');
goog.require('os.im.mapping.MappingRegistry');
goog.require('os.im.mapping.RenameMapping');



/**
 * Ellipse radius mapping.
 * @extends {os.im.mapping.RenameMapping.<ol.Feature>}
 * @constructor
 */
os.im.mapping.RadiusMapping = function() {
  os.im.mapping.RadiusMapping.base(this, 'constructor');
  this.toField = os.Fields.RADIUS;
  this.xmlType = os.im.mapping.RadiusMapping.ID;

  /**
   * @type {?string}
   * @protected
   */
  this.unitsField = os.Fields.RADIUS_UNITS;

  /**
   * @type {RegExp}
   * @protected
   */
  this.unitsRegex = os.im.mapping.RadiusMapping.UNITS_REGEX;

  /**
   * @type {RegExp}
   * @protected
   */
  this.regex = os.im.mapping.RadiusMapping.REGEX;

  /**
   * @type {?string}
   * @protected
   */
  this.units = os.fields.DEFAULT_RADIUS_UNIT;
};
goog.inherits(os.im.mapping.RadiusMapping, os.im.mapping.RenameMapping);


/**
 * @type {string}
 * @const
 */
os.im.mapping.RadiusMapping.ID = 'Radius';


// Register the mapping.
os.im.mapping.MappingRegistry.getInstance().registerMapping(
    os.im.mapping.RadiusMapping.ID, os.im.mapping.RadiusMapping);


/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.RadiusMapping.REGEX = /(^|[^A-Za-z0-9]+)(cep|radius)($|[^A-Za-z0-9]+)/i;


/**
 * @type {RegExp}
 * @const
 */
os.im.mapping.RadiusMapping.UNITS_REGEX = /(^|[^A-Za-z0-9]+)(cep|radius)(_units)($|[^A-Za-z0-9]+)/i;


/**
 * Get the units used by the mapping.
 * @return {?string}
 */
os.im.mapping.RadiusMapping.prototype.getUnits = function() {
  return this.units;
};


/**
 * Set the units used by the mapping.
 * @param {?string} units
 */
os.im.mapping.RadiusMapping.prototype.setUnits = function(units) {
  this.units = units;
};


/**
 * @inheritDoc
 */
os.im.mapping.RadiusMapping.prototype.getId = function() {
  return this.xmlType;
};


/**
 * @inheritDoc
 */
os.im.mapping.RadiusMapping.prototype.getLabel = function() {
  return this.toField || null;
};


/**
 * @inheritDoc
 */
os.im.mapping.RadiusMapping.prototype.execute = function(item) {
  if (this.field && this.toField) {
    var current = os.math.parseNumber(os.im.mapping.getItemField(item, this.field));
    if (!isNaN(current)) {
      if (this.units) {
        current = current * os.geo.UNIT_MULTIPLIERS[this.units];
      }

      os.im.mapping.setItemField(item, this.toField, current);

      if (this.units && this.unitsField) {
        os.im.mapping.setItemField(item, this.unitsField, this.units);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.mapping.RadiusMapping.prototype.autoDetect = function(items) {
  if (items) {
    var i = items.length;
    while (i--) {
      var item = items[i];
      var f = os.im.mapping.getBestFieldMatch(item, this.regex);

      if (f) {
        var m = new this.constructor();
        m.field = f;

        if (this.unitsRegex) {
          var unitsField = os.im.mapping.getBestFieldMatch(item, this.unitsRegex);
          if (unitsField) {
            var units = os.im.mapping.getItemField(item, unitsField);
            if (typeof units == 'string') {
              units = units.toLowerCase();

              if (units in os.geo.UNIT_MULTIPLIERS) {
                m.setUnits(units);
              }
            }
          }
        }

        return m;
      }
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
os.im.mapping.RadiusMapping.prototype.clone = function() {
  var other = os.im.mapping.RadiusMapping.base(this, 'clone');
  other.setUnits(this.getUnits());
  return other;
};


/**
 * @inheritDoc
 */
os.im.mapping.RadiusMapping.prototype.persist = function(opt_to) {
  opt_to = os.im.mapping.RadiusMapping.base(this, 'persist', opt_to);
  opt_to['units'] = this.getUnits();

  return opt_to;
};


/**
 * @inheritDoc
 */
os.im.mapping.RadiusMapping.prototype.restore = function(config) {
  os.im.mapping.RadiusMapping.base(this, 'restore', config);
  this.setUnits(config['units']);
};


/**
 * @inheritDoc
 */
os.im.mapping.RadiusMapping.prototype.toXml = function() {
  var xml = os.im.mapping.RadiusMapping.base(this, 'toXml');
  os.xml.appendElement('units', xml, this.getUnits());

  return xml;
};


/**
 * @inheritDoc
 */
os.im.mapping.RadiusMapping.prototype.fromXml = function(xml) {
  os.im.mapping.RadiusMapping.base(this, 'fromXml', xml);
  this.setUnits(this.getXmlValue(xml, 'units'));
};
