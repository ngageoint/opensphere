goog.declareModuleId('os.ui.wiz.GeometryStepUI');

import './wizardpreview.js';
import LatMapping from '../../im/mapping/latmapping.js';
import LonMapping from '../../im/mapping/lonmapping.js';
import PositionMapping from '../../im/mapping/positionmapping.js';
import WKTMapping from '../../im/mapping/wktmapping.js';
import Units from '../../math/units.js';
import {ROOT} from '../../os.js';
import AbstractCsvParser from '../file/csv/abstractcsvparser.js';
import Module from '../module.js';
import {numerateNameCompare} from '../slick/column.js';
import * as GeoHelpUI from '../window/geohelp.js';
import WizardStepEvent from './step/wizardstepevent.js';

const {default: ColumnDefinition} = goog.requireType('os.data.ColumnDefinition');
const {default: AbstractPositionMapping} = goog.requireType('os.im.mapping.AbstractPositionMapping');
const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');
const {default: GeometryStep} = goog.requireType('os.ui.wiz.GeometryStep');


/**
 * @typedef {{
 *   test: number,
 *   sample: string,
 *   result: !string
 * }}
 */
let GeoMapTestRes;


/**
 * The import wizard geometry step directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/wiz/geometrystep.html',
  controller: Controller,
  controllerAs: 'geomStep'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'geometrystep';


/**
 * Add the directive to the module
 */
Module.directive('geometrystep', [directive]);


/**
 * Controller for the import wizard geometry step
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {Array<ColumnDefinition>}
     */
    this['columns'] = $scope['config']['columns'] || [];
    this['columns'].sort(numerateNameCompare);

    /**
     * @type {Array<string>}
     */
    this['errors'] = [];

    /**
     * @type {Array<string>}
     */
    this['warnings'] = [];

    /**
     * @type {Object<string, IMapping>}
     */
    this['posTypes'] = Object.assign({}, PositionMapping.TYPES);
    this['posTypes']['WKT'] = new WKTMapping();

    /**
     * @type {Array<string>}
     */
    this['units'] = Object.values(Units);

    /**
     * @type {Array<string>}
     */
    this['altUnits'] = ['autodetect'];
    for (var unit in Units) {
      this['altUnits'].push(Units[unit]);
    }

    $scope.$watch('ellipseForm.$valid', this.validate.bind(this));
    $scope.$watch('step.geomType', this.validate.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Verifies the provided form data is valid and complete.
   *
   * @export
   */
  validate() {
    this['sample'] = null;
    this['result'] = null;
    this['errors'] = [];
    this['warnings'] = [];

    var config = this.scope_['config'];
    config['skipGeoMappings'] = false;
    if (!config['preview'] || config['preview'].length < 0) {
      return;
    }

    var geomStep = /** @type {GeometryStep} */ (this.scope_['step']);

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
              pm = new WKTMapping();
              pm.field = posColumn;
            } else {
              pm = new PositionMapping();
              pm.field = posColumn;
              pm.setType(geomStep['posType']);
            }
            var fmt = !geomStep['useGeoSingleAutoFormat'] ? geomStep['geoSingleFormat'] : undefined;
            var compareLatLon = /** @type {GeoMapTestRes} */ (this.testMappingAndEmpty_(pm, posColumn, fmt));
            if (compareLatLon['test'] === 0) {
              this['warnings'].push('Caution: No data found in first ' + AbstractCsvParser.PREVIEW_SIZE +
                  ' rows from column "' + posColumn + '"!');
            } else if (compareLatLon['test'] < 0) {
              this['errors'].push('Unable to parse geometry from column "' + posColumn + '"!');
            } else if (geomStep['posType'] && geomStep['posType'] == 'Lat/Lon' || geomStep['posType'] == 'Lon/Lat') {
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
            var latm = new LatMapping();
            latm.field = geomStep['latColumn'];
            var fmtLat = !geomStep['useGeoSeparateAutoFormat'] ? geomStep['geoSeparateFormat'] : undefined;
            var compareLat = /** @type {GeoMapTestRes} */ (this.testMappingAndEmpty_(latm, latm.field || '', fmtLat));
            if (compareLat['test'] === 0) {
              this['warnings'].push('Caution: No data found in first ' + AbstractCsvParser.PREVIEW_SIZE +
                  ' rows from latitude column "' + latm.field + '"!');
            } else if (compareLat['test'] < 0) {
              this['errors'].push('Unable to parse latitude from column "' + latm.field + '"!');
            } else {
              this['result'] = 'Latitude: ' + compareLat['result'];
            }
            this['sample'] = compareLat['sample'];

            var lonm = new LonMapping();
            lonm.field = geomStep['lonColumn'];
            var fmtLon = !geomStep['useGeoSeparateAutoFormat'] ? geomStep['geoSeparateFormat'] : undefined;
            var compareLon = /** @type {GeoMapTestRes} */ (this.testMappingAndEmpty_(lonm, lonm.field || '', fmtLon));
            if (compareLon['test'] === 0) {
              this['warnings'].push('Caution: No data found in first ' + AbstractCsvParser.PREVIEW_SIZE +
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
    this.scope_.$emit(WizardStepEvent.VALIDATE, this['errors'].length === 0 &&
        (!this.scope_['step']['showEllipse'] || this.scope_['ellipseForm'].$valid));
    this.scope_.$broadcast('resizePreview');
  }

  /**
   * Tests a field in preview features against a mapping. Also checks if the field is empty.
   *
   * @param {AbstractPositionMapping} mapping
   * @param {string} field
   * @param {string=} opt_format Custom format string
   * @return {GeoMapTestRes} test field meaning: 1 -> passes; 0 -> empty column; -1 -> not empty, fails mapping
   * @private
   */
  testMappingAndEmpty_(mapping, field, opt_format) {
    var features = this.scope_['config']['preview'];
    var invalidSample = null;
    // var fmt = geo.parseFormat(); // TODO:parse format in advance?
    for (var i = 0, n = features.length; i < n; i++) {
      var testValue = features[i].get(field);
      if (testValue) {
        invalidSample = testValue;
        var sample = mapping.testAndGetField(testValue, opt_format);
        if (sample != null) {
          return /** @type {GeoMapTestRes} */ ({'test': 1, 'result': sample, 'sample': testValue});
        }
      }
    }
    return /** @type {GeoMapTestRes} */ ({
      'test': !invalidSample ? 0 : -1,
      'result': null,
      'sample': invalidSample
    });
  }

  /**
   * Launches the geo formatting help dialog.
   *
   * @export
   */
  launchHelp() {
    GeoHelpUI.launchGeoHelp();
  }
}
