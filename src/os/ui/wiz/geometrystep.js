goog.provide('os.ui.wiz.GeometryStep');
goog.provide('os.ui.wiz.GeometryStepCtrl');

goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('os.defines');
goog.require('os.geo');
goog.require('os.im.mapping.AltMapping');
goog.require('os.im.mapping.BearingMapping');
goog.require('os.im.mapping.LatMapping');
goog.require('os.im.mapping.LonMapping');
goog.require('os.im.mapping.OrientationMapping');
goog.require('os.im.mapping.PositionMapping');
goog.require('os.im.mapping.RadiusMapping');
goog.require('os.im.mapping.SemiMajorMapping');
goog.require('os.im.mapping.SemiMinorMapping');
goog.require('os.im.mapping.WKTMapping');
goog.require('os.ui.Module');
goog.require('os.ui.window.geoHelpDirective');
goog.require('os.ui.wiz.step.AbstractWizardStep');
goog.require('os.ui.wiz.step.WizardStepEvent');
goog.require('os.ui.wiz.wizardPreviewDirective');


/**
 * @typedef {{
 *   test: number,
 *   sample: string,
 *   result: !string
 * }}
 */
os.GeoMapTestRes;



/**
 * Import wizard geometry step
 * @extends {os.ui.wiz.step.AbstractWizardStep}
 * @constructor
 */
os.ui.wiz.GeometryStep = function() {
  os.ui.wiz.GeometryStep.base(this, 'constructor');
  this.template = '<geometrystep></geometrystep>';
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
    {'format': 'DMM', 'description': 'DMM - Degrees and decimal minutes'},
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
};
goog.inherits(os.ui.wiz.GeometryStep, os.ui.wiz.step.AbstractWizardStep);


/**
 * @inheritDoc
 */
os.ui.wiz.GeometryStep.prototype.initialize = function(config) {
  if (!this.initialized && config['mappings'] && config['mappings'].length > 0) {
    for (var i = 0, n = config['mappings'].length; i < n; i++) {
      var m = config['mappings'][i];
      if (m instanceof os.im.mapping.PositionMapping) {
        this['posColumn'] = m.field;
        this['posType'] = /** @type {os.im.mapping.PositionMapping} */ (m).getType();
        this['geomType'] = 'single';
      } else if (m instanceof os.im.mapping.LonMapping && this['geomType'] != 'single') {
        this['lonColumn'] = m.field;
        this['geomType'] = 'separate';
      } else if (m instanceof os.im.mapping.LatMapping && this['geomType'] != 'single') {
        this['latColumn'] = m.field;
        this['geomType'] = 'separate';
      } else if (m instanceof os.im.mapping.WKTMapping) {
        this['posColumn'] = m.field;
        this['posType'] = 'WKT';
        this['geomType'] = 'single';
      } else if (m instanceof os.im.mapping.BearingMapping) { // must be before RadiusMapping
        this['bearing']['column'] = m.field;
      } else if (m instanceof os.im.mapping.SemiMajorMapping) {
        this['ellipse']['semiMajor']['column'] = m.field;
        this['ellipse']['semiMajor']['units'] = /** @type {os.im.mapping.RadiusMapping} */ (m).getUnits();
        this['showEllipse'] = true;
      } else if (m instanceof os.im.mapping.SemiMinorMapping) {
        this['ellipse']['semiMinor']['column'] = m.field;
        this['ellipse']['semiMinor']['units'] = /** @type {os.im.mapping.RadiusMapping} */ (m).getUnits();
        this['showEllipse'] = true;
      } else if (m instanceof os.im.mapping.OrientationMapping) {
        this['ellipse']['orientation']['column'] = m.field;
        this['showEllipse'] = true;
      } else if (m instanceof os.im.mapping.RadiusMapping) {
        this['ellipse']['radius']['column'] = m.field;
        this['ellipse']['radius']['units'] = /** @type {os.im.mapping.RadiusMapping} */ (m).getUnits();
        this['showEllipse'] = true;
      } else if (m instanceof os.im.mapping.AltMapping) {
        this['altitude']['column'] = m.field;
        this['altitude']['units'] = m.units;
      }
    }

    os.ui.wiz.GeometryStep.base(this, 'initialize', config);
  }

  if (config['ignoreMissingGeomRows']) {
    this['ignoreMissingGeomRows'] = config['ignoreMissingGeomRows'];
  }
};


/**
 * @inheritDoc
 */
os.ui.wiz.GeometryStep.prototype.finalize = function(config) {
  var altMapping;
  if (config['mappings']) {
    var i = config['mappings'].length;
    while (i--) {
      // remove old geometry/ellipse mappings
      var m = config['mappings'][i];
      if (m instanceof os.im.mapping.PositionMapping || m instanceof os.im.mapping.LatMapping ||
          m instanceof os.im.mapping.LonMapping || m instanceof os.im.mapping.WKTMapping ||
          m instanceof os.im.mapping.RadiusMapping) {
        config['mappings'].splice(i, 1);
      } else if (m instanceof os.im.mapping.AltMapping) {
        // if this is an altitude mapping, we want to use the initial column mapping but update based on user inputs
        // we don't want to lose the units column name mapping that was autodetected
        altMapping = /** @type {os.im.mapping.AltMapping} */ (m.clone());
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
      altMapping = new os.im.mapping.AltMapping();
    }

    // add the alt mapping at the end of the list since it relies on the other mappings for the geometry to exist
    if (altMapping) {
      this.updateAltMapping(altMapping);
      config['mappings'].push(altMapping);
    }
  }
};


/**
 * Creates new mappings from the current step configuration.
 * @return {Array<os.im.mapping.IMapping>}
 */
os.ui.wiz.GeometryStep.prototype.createMappings = function() {
  var mappings = [];

  // add new geometry mapping(s)
  if (this['geomType'] == 'single') {
    if (this['posColumn'] && this['posType']) {
      if (this['posType'] == 'WKT') {
        var wm = new os.im.mapping.WKTMapping();
        wm.field = this['posColumn'];
        mappings.push(wm);
      } else {
        var pm = new os.im.mapping.PositionMapping();
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
      var latm = new os.im.mapping.LatMapping();
      latm.field = this['latColumn'];
      if (!this['useGeoSeparateAutoFormat']) {
        latm.customFormat = this['geoSeparateFormat'];
      }
      mappings.push(latm);

      var lonm = new os.im.mapping.LonMapping();
      lonm.field = this['lonColumn'];
      if (!this['useGeoSeparateAutoFormat']) {
        lonm.customFormat = this['geoSeparateFormat'];
      }
      mappings.push(lonm);
    }
  }

  if (this['bearing']['column']) {
    var bm = new os.im.mapping.BearingMapping();
    bm.field = this['bearing']['column'];
    mappings.push(bm);
  }

  if (this['showEllipse']) {
    if (this['ellipse']['radius']['column']) {
      var rm = new os.im.mapping.RadiusMapping();
      rm.field = this['ellipse']['radius']['column'];
      rm.setUnits(this['ellipse']['radius']['units']);
      mappings.push(rm);
    }
    if (this['ellipse']['semiMajor']['column']) {
      var smaj = new os.im.mapping.SemiMajorMapping();
      smaj.field = this['ellipse']['semiMajor']['column'];
      smaj.setUnits(this['ellipse']['semiMajor']['units']);
      mappings.push(smaj);
    }
    if (this['ellipse']['semiMinor']['column']) {
      var smin = new os.im.mapping.SemiMinorMapping();
      smin.field = this['ellipse']['semiMinor']['column'];
      smin.setUnits(this['ellipse']['semiMinor']['units']);
      mappings.push(smin);
    }
    if (this['ellipse']['orientation']['column']) {
      var om = new os.im.mapping.OrientationMapping();
      om.field = this['ellipse']['orientation']['column'];
      mappings.push(om);
    }
  }

  return mappings;
};


/**
 * Update an existing altitude mapping with user selected overrides
 * @param {os.im.mapping.AltMapping} mapping
 */
os.ui.wiz.GeometryStep.prototype.updateAltMapping = function(mapping) {
  mapping.field = this['altitude']['column'];
  // set this back to the default in case it was overridden previously
  mapping.setUnits(os.fields.DEFAULT_ALT_UNIT);
  mapping.unitsOverride = false;
  // override the autodetection of the units
  if ((this['altitude']['units']) && (this['altitude']['units'] != 'autodetect')) {
    mapping.setUnits(this['altitude']['units']);
  }
};


/**
 * @inheritDoc
 */
os.ui.wiz.GeometryStep.prototype.isValid = function(config) {
  // step validation simply requires fields to be set to something
  if (this['geomType'] == 'single' && (!this['posColumn'] || !this['posType'])) {
    return false;
  } else if (this['geomType'] == 'separate' && (!this['latColumn'] || !this['lonColumn'])) {
    return false;
  }

  return this.valid;
};


/**
 * The import wizard geometry step directive
 * @return {angular.Directive}
 */
os.ui.wiz.geometryStepDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/wiz/geometrystep.html',
    controller: os.ui.wiz.GeometryStepCtrl,
    controllerAs: 'geomStep'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('geometrystep', [os.ui.wiz.geometryStepDirective]);



/**
 * Controller for the import wizard geometry step
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.wiz.GeometryStepCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {Array<os.data.ColumnDefinition>}
   */
  this['columns'] = $scope['config']['columns'] || [];
  this['columns'].sort(os.ui.slick.column.numerateNameCompare);

  /**
   * @type {Array<string>}
   */
  this['errors'] = [];

  /**
   * @type {Array<string>}
   */
  this['warnings'] = [];

  /**
   * @type {Object<string, os.im.mapping.IMapping>}
   */
  this['posTypes'] = goog.object.clone(os.im.mapping.PositionMapping.TYPES);
  this['posTypes']['WKT'] = new os.im.mapping.WKTMapping();

  /**
   * @type {Array<string>}
   */
  this['units'] = goog.object.getKeys(os.geo.UNIT_MULTIPLIERS);

  /**
   * @type {Array<string>}
   */
  this['altUnits'] = ['autodetect'];
  for (var unit in os.math.Units) {
    this['altUnits'].push(os.math.Units[unit]);
  }

  $scope.$watch('ellipseForm.$valid', this.validate.bind(this));
  $scope.$watch('step.geomType', this.validate.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.ui.wiz.GeometryStepCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Verifies the provided form data is valid and complete.
 */
os.ui.wiz.GeometryStepCtrl.prototype.validate = function() {
  this['sample'] = null;
  this['result'] = null;
  this['errors'] = [];
  this['warnings'] = [];

  var config = this.scope_['config'];
  config['skipGeoMappings'] = false;
  if (!config['preview'] || config['preview'].length < 0) {
    return;
  }

  var geomStep = /** @type {os.ui.wiz.GeometryStep} */ (this.scope_['step']);

  if (geomStep) {
    if (geomStep['geomType'] != 'none') {
      config['ignoreMissingGeomRows'] = geomStep['ignoreMissingGeomRows'];

      if (geomStep['geomType'] == 'single') {
        if (!geomStep['posColumn']) {
          this['errors'].push('Please choose a geometry column.');
        } else {
          var pm = null;
          var posColumn = geomStep['posColumn'];
          if (geomStep['posType'] == 'WKT') {
            pm = new os.im.mapping.WKTMapping();
            pm.field = posColumn;
          } else {
            pm = new os.im.mapping.PositionMapping();
            pm.field = posColumn;
            pm.setType(geomStep['posType']);
          }
          var fmt = !geomStep['useGeoSingleAutoFormat'] ? geomStep['geoSingleFormat'] : undefined;
          var compareLatLon = /** @type {os.GeoMapTestRes} */ (this.testMappingAndEmpty_(pm, posColumn, fmt));
          if (compareLatLon['test'] === 0) {
            this['warnings'].push('Caution: No data found in first ' + os.ui.file.csv.AbstractCsvParser.PREVIEW_SIZE +
                ' rows from column "' + posColumn + '"!');
          } else if (compareLatLon['test'] < 0) {
            this['errors'].push('Unable to parse geometry from column "' + posColumn + '"!');
          } else if (geomStep['posType'] && (geomStep['posType'] == 'Lat/Lon') || (geomStep['posType'] == 'Lon/Lat')) {
            var g = compareLatLon['result'] ? compareLatLon['result'].split(' ') : [];
            this['result'] = g.length !== 2 ? compareLatLon['result'] : 'Latitude: ' + g[0] + ' Longitude: ' + g[1];
          } else {
            this['result'] = compareLatLon['result'];
          }
          this['sample'] = compareLatLon['sample'];
        }
      } else if (geomStep['geomType'] == 'separate') {
        if (!geomStep['latColumn'] || !geomStep['lonColumn']) {
          this['errors'].push('Please choose latitude/longitude columns.');
        } else {
          var latm = new os.im.mapping.LatMapping();
          latm.field = geomStep['latColumn'];
          var fmtLat = !geomStep['useGeoSeparateAutoFormat'] ? geomStep['geoSeparateFormat'] : undefined;
          var compareLat = /** @type {os.GeoMapTestRes} */ (this.testMappingAndEmpty_(latm, latm.field, fmtLat));
          if (compareLat['test'] === 0) {
            this['warnings'].push('Caution: No data found in first ' + os.ui.file.csv.AbstractCsvParser.PREVIEW_SIZE +
                ' rows from latitude column "' + latm.field + '"!');
          } else if (compareLat['test'] < 0) {
            this['errors'].push('Unable to parse latitude from column "' + latm.field + '"!');
          } else {
            this['result'] = 'Latitude: ' + compareLat['result'];
          }
          this['sample'] = compareLat['sample'];

          var lonm = new os.im.mapping.LonMapping();
          lonm.field = geomStep['lonColumn'];
          var fmtLon = !geomStep['useGeoSeparateAutoFormat'] ? geomStep['geoSeparateFormat'] : undefined;
          var compareLon = /** @type {os.GeoMapTestRes} */ (this.testMappingAndEmpty_(lonm, lonm.field, fmtLon));
          if (compareLon['test'] === 0) {
            this['warnings'].push('Caution: No data found in first ' + os.ui.file.csv.AbstractCsvParser.PREVIEW_SIZE +
                ' rows from longitude column "' + lonm.field + '"!');
            this['result'] = null;
          } else if (compareLon['test'] < 0) {
            this['errors'].push('Unable to parse longitude from column "' + lonm.field + '"!');
            this['result'] = null;
          } else {
            this['result'] = this['result'] ? this['result'] + ' Longitude: ' + compareLon['result'] : null;
          }
          this['sample'] = (this['sample'] ? this['sample'] + ' ' : '') + compareLon['sample'];

          if (this['errors'].length === 0 && latm.field == lonm.field) {
            this['warnings'].push('Caution: The same column will be used for longitude and latitude - is this a ' +
                'Single Geometry Field?');
          }
        }
      }
    } else {
      config['ignoreMissingGeomRows'] = false; // geometry is turned off
      config['skipGeoMappings'] = true;
    }
  }

  config.updatePreview(geomStep.createMappings());

  // form is considered valid if none of the above errors were generated
  this.scope_.$emit(os.ui.wiz.step.WizardStepEvent.VALIDATE, this['errors'].length === 0 &&
      (!this.scope_['step']['showEllipse'] || this.scope_['ellipseForm'].$valid));
  this.scope_.$broadcast('resizePreview');
};
goog.exportProperty(
    os.ui.wiz.GeometryStepCtrl.prototype,
    'validate',
    os.ui.wiz.GeometryStepCtrl.prototype.validate);


/**
 * Tests a field in preview features against a mapping. Also checks if the field is empty.
 * @param {os.im.mapping.IMapping} mapping
 * @param {string} field
 * @param {string=} opt_format Custom format string
 * @return {os.GeoMapTestRes} test field meaning: 1 -> passes; 0 -> empty column; -1 -> not empty, fails mapping
 * @private
 */
os.ui.wiz.GeometryStepCtrl.prototype.testMappingAndEmpty_ = function(mapping, field, opt_format) {
  var features = this.scope_['config']['preview'];
  var invalidSample = null;
  // var fmt = geo.parseFormat(); // TODO:parse format in advance?
  for (var i = 0, n = features.length; i < n; i++) {
    var testValue = features[i].get(field);
    if (testValue) {
      invalidSample = testValue;
      var sample = mapping.testAndGetField(testValue, opt_format);
      if (goog.isDefAndNotNull(sample)) {
        return /** @type {os.GeoMapTestRes} */ ({'test': 1, 'result': sample, 'sample': testValue});
      }
    }
  }
  return /** @type {os.GeoMapTestRes} */ ({'test': !invalidSample ? 0 : -1, 'result': null, 'sample': invalidSample});
};


/**
 * Launches the geo formatting help dialog.
 */
os.ui.wiz.GeometryStepCtrl.prototype.launchHelp = function() {
  os.ui.window.launchGeoHelp();
};
goog.exportProperty(
    os.ui.wiz.GeometryStepCtrl.prototype,
    'launchHelp',
    os.ui.wiz.GeometryStepCtrl.prototype.launchHelp);
