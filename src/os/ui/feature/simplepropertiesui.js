goog.declareModuleId('os.ui.feature.SimplePropertiesUI');

import OsSettings from '../../config/settings.js';
import * as OsFeature from '../../feature/feature.js';
import OsModule from '../module.js';
import {directiveTag as cellUi} from './featureinfocell.js';

/**
 * @type {!string}
 * @const
 */
const SIMPLE_PROPERTIES_BASE_KEY = 'featureInfo.simpleProperties';

/**
 * The columns that should appear at the top of the FeatureInfo card; in the following format:
 *   {
 *     "CALLSIGN": ["^flight_[number|no]+$"], // column name, with alternative regex(s) in preference order
 *     "ALT": null, // additional column to show
 *     ...
 *   }
 * @type {!string}
 * @const
 */
const SIMPLE_PROPERTIES_COLUMNS_KEY = SIMPLE_PROPERTIES_BASE_KEY + '.columns';


/**
 * Declare local variables in a SEAF and reuse the simple properties column filter across controller instances
 *
 * @param {Feature} feature
 * @return {Array<Object<string, *>>}
 * @private
 */
const getProperties_ = (() => {
  // flag for first run
  let initialized_ = false;

  /**
   * get the desired columns from config
   * @type {Object<string, osx.feature.SimplePropertyOptions>}
   */
  let config_ = null;

  // lookup array of fields by source
  const lookup_ = {};

  // lookup field by config key
  const best_ = {};

  // lookup default by config key OR field
  const default_ = {};

  /**
   * Get the best field for this key
   * @param {!string} key
   * @param {Array<string>} regexes
   * @param {Array<string>} fields
   * @return {string}
   */
  const best = function(key, regexes, fields) {
    // prefer exact match
    let field = fields.find((f) => {
      return !!f && f.toLocaleLowerCase().localeCompare(key.toLocaleLowerCase()) == 0; // case insensitive
    });
    if (!field && regexes && regexes.length > 0) {
      // regex match
      field = regexes.reduce((agg, regex, idx, arr) => {
        if (!agg) {
          const expr = /** @type {?RegExp} */ (regex && new RegExp(regex, 'i')); // case insensitive
          agg = fields.find((f) => {
            return expr.test(f);
          });
        }
        return agg;
      }, false);
    }
    return field;
  };

  return (feature) => {
    var properties = [];

    if (!initialized_) {
      config_ = /** @type {Object<string, osx.feature.SimplePropertyOptions>} */ (OsSettings.getInstance()
          .get(SIMPLE_PROPERTIES_COLUMNS_KEY)
      );
      initialized_ = true;
    }

    if (config_) {
      const source = OsFeature.getSource(feature);
      let fields = (source) ? lookup_[source.getId()] : null;

      if (!fields) {
        fields = [];

        // for each config, get the column and build the property
        const map = Object.entries(config_);
        for (let [key, options] of map) {
          // help out the compiler
          key = /** @type {string} */ (key);
          options = /** @type {osx.feature.SimplePropertyOptions} */ (options);

          // get the field for this key
          let field = null;
          if (best_[key] && feature.get(best_[key])) {
            field = best_[key];
          } else {
            const regexes = (options) ? options['regexes'] : null;
            const featureFields = (source) ?
              source.getColumns().map((c) => c['field']) : // for source, reuse the column definition
              Object.keys(feature.getProperties()); // for non-source, map the individual feature
            field = best(key, regexes, featureFields);
          }

          // even if the field can't be found, add an entry when there's a default
          if (options && options['default']) {
            if (!field) fields.push(key);
            default_[field || key] = options['default'];
          }

          // return the mapping
          if (field) {
            best_[key] = field; // save for reuse, e.g. "ALT" >> "Altitude (m)"
            fields.push(field);
          }
        }
      }

      // drop in the values for the identified fields
      if (fields.length > 0) {
        // save this mapping for later
        if (source && !lookup_[source.getId()]) {
          lookup_[source.getId()] = fields;
        }
        fields.forEach(function(field) {
          properties.push({
            'id': field,
            'field': field,
            'value': feature.get(field) || default_[field]
          });
        });
      }
    }

    return properties;
  };
})();

/**
 * The controller for the simple properties directive; automatically finds and displays property(ies) as configured.
 * Configurations are layer-agnostic. Basically, if you want to always put an emphasis on columns (or alternate
 * regular expression(s) match on them), then this will add list those values.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {angular.Scope}
     */
    this.scope = $scope;

    /**
     * @type {Array<Object<string, *>>}
     */
    this['properties'] = [];

    $scope.$watch('items', this.onFeatureChange.bind(this));
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.scope = null;
    this['properties'] = null;
  }

  /**
   * Handle feature changes on the scope.
   * @param {Array<ol.Feature>} newVal The new value
   */
  onFeatureChange(newVal) {
    this.updateProperties_();
  }

  /**
   * Update the title for the active feature.
   *
   * @private
   */
  updateProperties_() {
    var feature = /** @type {ol.Feature} */ (
      (this.scope['items'] && this.scope['items'].length) ?
        this.scope['items'][0] :
        null);
    if (feature) {
      this['properties'] = getProperties_(feature);
    }
  }
}

/**
 * The simple properties directive.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'items': '='
  },
  controller: Controller,
  controllerAs: 'propCtrl',
  template: `
<div>
  <span ng-repeat="property in propCtrl.properties">
    <span>{{property.field}}</span>: <${cellUi} property="property"></${cellUi}><br />
  </span>
</div>
`
});

/**
 * Add the directive to the module.
 */
OsModule.directive('simpleProperties', [directive]);
