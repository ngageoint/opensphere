goog.declareModuleId('os.ui.wiz.GeometryStep');

import {DEFAULT_ALT_UNIT} from '../../fields/index.js';
import AltMapping from '../../im/mapping/altmapping.js';
import BearingMapping from '../../im/mapping/bearingmapping.js';
import LatMapping from '../../im/mapping/latmapping.js';
import LonMapping from '../../im/mapping/lonmapping.js';
import OrientationMapping from '../../im/mapping/orientationmapping.js';
import PositionMapping from '../../im/mapping/positionmapping.js';
import RadiusMapping from '../../im/mapping/radiusmapping.js';
import SemiMajorMapping from '../../im/mapping/semimajormapping.js';
import SemiMinorMapping from '../../im/mapping/semiminormapping.js';
import WKTMapping from '../../im/mapping/wktmapping.js';
import {directiveTag as stepUi} from './geometrystepui.js';
import AbstractWizardStep from './step/abstractwizardstep.js';

const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');


/**
 * Import wizard geometry step
 * @unrestricted
 */
export default class GeometryStep extends AbstractWizardStep {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.template = `<${stepUi}></${stepUi}>`;
    this.title = 'Geometry';

    /**
     * @type {string}
     */
    this['latColumn'] = '';

    /**
     * @type {string}
     */
    this['lonColumn'] = '';

    /**
     * @type {string}
     */
    this['posColumn'] = '';

    /**
     * @type {string}
     */
    this['posType'] = 'Lat/Lon';

    /**
     * @type {string}
     */
    this['geomType'] = 'none';

    /**
     * @type {boolean}
     */
    this['showEllipse'] = false;

    /**
     * @type {boolean}
     */
    this['ignoreMissingGeomRows'] = false;

    /**
     * @type {Object<string, *>}
     */
    this['ellipse'] = {
      'radius': {'column': '', 'units': 'nmi'},
      'semiMajor': {'column': '', 'units': 'nmi'},
      'semiMinor': {'column': '', 'units': 'nmi'},
      'orientation': {'column': ''}
    };

    /**
     * @type {Object<string, *>}
     */
    this['bearing'] = {
      'column': ''
    };

    /**
     * @type {Object<string, *>}
     */
    this['altitude'] = {
      'column': '',
      'units': 'autodetect'
    };

    /**
     * @type {Array<Object<string, string>>}
     */
    this['geoFormats'] = [
      {'format': 'DMS', 'description': 'DMS - Degrees, minutes, seconds'},
      {'format': 'DDM', 'description': 'DDM - Degrees and decimal minutes'},
      {'format': 'DD', 'description': 'DD - Decimal degrees'}
    ];

    /**
     * @type {boolean}
     */
    this['useGeoSeparateAutoFormat'] = true;

    /**
     * @type {boolean}
     */
    this['useGeoSingleAutoFormat'] = true;

    /**
     * @type {Object}
     */
    this['geoSeparateFormat'] = this['geoFormats'][0]['format'];

    /**
     * @type {Object}
     */
    this['geoSingleFormat'] = this['geoFormats'][0]['format'];

    /**
     * @type {string}
     */
    this['sample'] = '';

    /**
     * @type {?string}
     */
    this['result'] = null;
  }

  /**
   * @inheritDoc
   */
  initialize(config) {
    if (!this.initialized && config['mappings'] && config['mappings'].length > 0) {
      for (var i = 0, n = config['mappings'].length; i < n; i++) {
        var m = config['mappings'][i];
        if (m instanceof PositionMapping) {
          this['posColumn'] = m.field;
          this['posType'] = /** @type {PositionMapping} */ (m).getType();
          this['geomType'] = 'single';
        } else if (m instanceof LonMapping && this['geomType'] != 'single') {
          this['lonColumn'] = m.field;
          this['geomType'] = 'separate';
        } else if (m instanceof LatMapping && this['geomType'] != 'single') {
          this['latColumn'] = m.field;
          this['geomType'] = 'separate';
        } else if (m instanceof WKTMapping) {
          this['posColumn'] = m.field;
          this['posType'] = 'WKT';
          this['geomType'] = 'single';
        } else if (m instanceof BearingMapping) { // must be before RadiusMapping
          this['bearing']['column'] = m.field;
        } else if (m instanceof SemiMajorMapping) {
          this['ellipse']['semiMajor']['column'] = m.field;
          this['ellipse']['semiMajor']['units'] = /** @type {RadiusMapping} */ (m).getUnits();
          this['showEllipse'] = true;
        } else if (m instanceof SemiMinorMapping) {
          this['ellipse']['semiMinor']['column'] = m.field;
          this['ellipse']['semiMinor']['units'] = /** @type {RadiusMapping} */ (m).getUnits();
          this['showEllipse'] = true;
        } else if (m instanceof OrientationMapping) {
          this['ellipse']['orientation']['column'] = m.field;
          this['showEllipse'] = true;
        } else if (m instanceof RadiusMapping) {
          this['ellipse']['radius']['column'] = m.field;
          this['ellipse']['radius']['units'] = /** @type {RadiusMapping} */ (m).getUnits();
          this['showEllipse'] = true;
        } else if (m instanceof AltMapping) {
          this['altitude']['column'] = m.field;
          this['altitude']['units'] = m.units;
        }
      }

      super.initialize(config);
    }

    if (config['ignoreMissingGeomRows']) {
      this['ignoreMissingGeomRows'] = config['ignoreMissingGeomRows'];
    }
  }

  /**
   * @inheritDoc
   */
  finalize(config) {
    var altMapping;
    if (config['mappings']) {
      var i = config['mappings'].length;
      while (i--) {
        // remove old geometry/ellipse mappings
        var m = config['mappings'][i];
        if (m instanceof PositionMapping || m instanceof LatMapping ||
            m instanceof LonMapping || m instanceof WKTMapping ||
            m instanceof RadiusMapping) {
          config['mappings'].splice(i, 1);
        } else if (m instanceof AltMapping) {
          // if this is an altitude mapping, we want to use the initial column mapping but update based on user inputs
          // we don't want to lose the units column name mapping that was autodetected
          altMapping = /** @type {AltMapping} */ (m.clone());
          config['mappings'].splice(i, 1);
        }
      }
    }

    var mappings = this.createMappings();
    if (mappings.length > 0) {
      if (config['mappings']) {
        config['mappings'] = config['mappings'].concat(mappings);
      } else {
        config['mappings'] = mappings;
      }

      if (!altMapping && this['altitude']['column']) {
        altMapping = new AltMapping();
      }

      // add the alt mapping at the end of the list since it relies on the other mappings for the geometry to exist
      if (altMapping) {
        this.updateAltMapping(altMapping);
        config['mappings'].push(altMapping);
      }
    }
  }

  /**
   * Creates new mappings from the current step configuration.
   *
   * @return {Array<IMapping>}
   */
  createMappings() {
    var mappings = [];

    // add new geometry mapping(s)
    if (this['geomType'] == 'single') {
      if (this['posColumn'] && this['posType']) {
        if (this['posType'] == 'WKT') {
          var wm = new WKTMapping();
          wm.field = this['posColumn'];
          mappings.push(wm);
        } else {
          var pm = new PositionMapping();
          pm.field = this['posColumn'];
          pm.setType(this['posType']);
          if (!this['useGeoSingleAutoFormat'] && (this['posType'] == 'Lat/Lon' || this['posType'] == 'Lon/Lat')) {
            pm.customFormat = this['geoSingleFormat'];
          }
          mappings.push(pm);
        }
      }
    } else if (this['geomType'] == 'separate') {
      if (this['latColumn'] && this['lonColumn']) {
        var latm = new LatMapping();
        latm.field = this['latColumn'];
        if (!this['useGeoSeparateAutoFormat']) {
          latm.customFormat = this['geoSeparateFormat'];
        }
        mappings.push(latm);

        var lonm = new LonMapping();
        lonm.field = this['lonColumn'];
        if (!this['useGeoSeparateAutoFormat']) {
          lonm.customFormat = this['geoSeparateFormat'];
        }
        mappings.push(lonm);
      }
    }

    if (this['bearing']['column']) {
      var bm = new BearingMapping();
      bm.field = this['bearing']['column'];
      mappings.push(bm);
    }

    if (this['showEllipse'] && (this.scope && this.scope['confirmValue'])) {
      this.scope['confirmValue'].forEach((mapping) => {
        mappings.push(mapping);
      });
    }

    return mappings;
  }

  /**
   * Update an existing altitude mapping with user selected overrides
   *
   * @param {AltMapping} mapping
   */
  updateAltMapping(mapping) {
    mapping.field = this['altitude']['column'];
    // set this back to the default in case it was overridden previously
    mapping.setUnits(DEFAULT_ALT_UNIT);
    mapping.unitsOverride = false;
    // override the autodetection of the units
    if ((this['altitude']['units']) && (this['altitude']['units'] != 'autodetect')) {
      mapping.setUnits(this['altitude']['units']);
    }
  }

  /**
   * @inheritDoc
   */
  isValid(config) {
    // step validation simply requires fields to be set to something
    if (this['geomType'] == 'single' && (!this['posColumn'] || !this['posType'])) {
      return false;
    } else if (this['geomType'] == 'separate' && (!this['latColumn'] || !this['lonColumn'])) {
      return false;
    }

    return this.valid;
  }
}
