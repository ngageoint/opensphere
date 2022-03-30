goog.declareModuleId('os.im.mapping.RadiusMapping');

import Fields from '../../fields/fields.js';
import {DEFAULT_RADIUS_COL_NAME, DEFAULT_RADIUS_UNIT} from '../../fields/index.js';
import {convertUnits, parseNumber} from '../../math/math.js';
import Units from '../../math/units.js';
import {appendElement} from '../../xml.js';
import * as osMapping from './mapping.js';
import MappingRegistry from './mappingregistry.js';
import RenameMapping from './renamemapping.js';

/**
 * Ellipse radius mapping.
 *
 * @extends {RenameMapping<Feature>}
 */
export default class RadiusMapping extends RenameMapping {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.toField = DEFAULT_RADIUS_COL_NAME;
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
    this.units = DEFAULT_RADIUS_UNIT;
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
      var current = parseNumber(osMapping.getItemField(item, this.field));
      if (!isNaN(current)) {
        if (this.units) {
          current = convertUnits(current, DEFAULT_RADIUS_UNIT, this.units);
        }

        osMapping.setItemField(item, this.toField, current);

        if (this.units && this.unitsField) {
          osMapping.setItemField(item, this.unitsField, this.units);
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
        var f = osMapping.getBestFieldMatch(item, this.regex);

        if (f) {
          var m = new this.constructor();
          m.field = f;

          if (this.unitsRegex) {
            var unitsField = osMapping.getBestFieldMatch(item, this.unitsRegex);
            if (unitsField) {
              var units = osMapping.getItemField(item, unitsField);
              if (typeof units == 'string') {
                units = units.toLowerCase();

                if (Object.values(Units).indexOf(units) !== -1) {
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
    var other = /** @type {RadiusMapping} */ (super.clone());
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
    appendElement('units', xml, this.getUnits());

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
