goog.module('os.im.mapping.RadiusMapping');
goog.module.declareLegacyNamespace();

const googObject = goog.require('goog.object');
const Fields = goog.require('os.Fields');
const fields = goog.require('os.fields');
const mapping = goog.require('os.im.mapping');
const MappingRegistry = goog.require('os.im.mapping.MappingRegistry');
const RenameMapping = goog.require('os.im.mapping.RenameMapping');
const math = goog.require('os.math');
const Units = goog.require('os.math.Units');
const osXml = goog.require('os.xml');

const Feature = goog.requireType('ol.Feature');


/**
 * Ellipse radius mapping.
 *
 * @extends {RenameMapping.<Feature>}
 */
class RadiusMapping extends RenameMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.toField = fields.DEFAULT_RADIUS_COL_NAME;
    this.xmlType = RadiusMapping.ID;

    /**
     * @type {?string}
     * @protected
     */
    this.unitsField = Fields.RADIUS_UNITS;

    /**
     * @type {RegExp}
     * @protected
     */
    this.unitsRegex = RadiusMapping.UNITS_REGEX;

    /**
     * @type {RegExp}
     * @protected
     */
    this.regex = RadiusMapping.REGEX;

    /**
     * @type {?string}
     * @protected
     */
    this.units = fields.DEFAULT_RADIUS_UNIT;
  }

  /**
   * Get the units used by the mapping.
   *
   * @return {?string}
   */
  getUnits() {
    return this.units;
  }

  /**
   * Set the units used by the mapping.
   *
   * @param {?string} units
   */
  setUnits(units) {
    this.units = units;
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
    return this.toField || null;
  }

  /**
   * @inheritDoc
   */
  execute(item) {
    if (this.field && this.toField) {
      var current = math.parseNumber(mapping.getItemField(item, this.field));
      if (!isNaN(current)) {
        if (this.units) {
          current = math.convertUnits(current, fields.DEFAULT_RADIUS_UNIT, this.units);
        }

        mapping.setItemField(item, this.toField, current);

        if (this.units && this.unitsField) {
          mapping.setItemField(item, this.unitsField, this.units);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  autoDetect(items) {
    if (items) {
      var i = items.length;
      while (i--) {
        var item = items[i];
        var f = mapping.getBestFieldMatch(item, this.regex);

        if (f) {
          var m = new this.constructor();
          m.field = f;

          if (this.unitsRegex) {
            var unitsField = mapping.getBestFieldMatch(item, this.unitsRegex);
            if (unitsField) {
              var units = mapping.getItemField(item, unitsField);
              if (typeof units == 'string') {
                units = units.toLowerCase();

                if (googObject.getValues(Units).indexOf(units) !== -1) {
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
  }

  /**
   * @inheritDoc
   */
  clone() {
    var other = super.clone();
    other.setUnits(this.getUnits());
    return other;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to);
    opt_to['units'] = this.getUnits();

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);
    this.setUnits(config['units']);
  }

  /**
   * @inheritDoc
   */
  toXml() {
    var xml = super.toXml();
    osXml.appendElement('units', xml, this.getUnits());

    return xml;
  }

  /**
   * @inheritDoc
   */
  fromXml(xml) {
    super.fromXml(xml);
    this.setUnits(this.getXmlValue(xml, 'units'));
  }

  /**
   * Static getter that stores String-compiled regular expression to a private property.
   * @type {RegExp}
   */
  static get REGEX() {
    return /(^|[^A-Za-z0-9]+)(cep|radius)($|[^A-Za-z0-9]+)/i;
  }

  /**
   * Static getter that stores String-compiled regular expression to a private property.
   * @type {RegExp}
   */
  static get UNITS_REGEX() {
    return /(^|[^A-Za-z0-9]+)(cep|radius)(_units)($|[^A-Za-z0-9]+)/i;
  }
}


/**
 * @type {string}
 * @override
 */
RadiusMapping.ID = 'Radius';


// Register the mapping.
MappingRegistry.getInstance().registerMapping(RadiusMapping.ID, RadiusMapping);


exports = RadiusMapping;
