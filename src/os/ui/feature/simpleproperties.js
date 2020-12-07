goog.module('os.ui.feature.simpleproperties');
goog.module.declareLegacyNamespace();

goog.require('os.ui.feature.featureInfoCellDirective');

const OsFeature = goog.require('os.feature');
const OsModule = goog.require('os.ui.Module');
const OsSettings = goog.require('os.config.Settings');

const Feature = goog.requireType('ol.Feature');



/**
 * @type {!string}
 * @const
 */
const SIMPLE_PROPERTIES = 'feature.info.simple';


/**
 * Reuse the simple properties column filter across controller instances
 * @param {Feature} feature
 * @return {Array<Object<string, *>>}
 * @private
 */
const getProperties_ = (() => {
  // flag for first run
  var initialized_ = false;

  // get the desired columns from config
  var config_ = null;

  // lookup by source
  var lookup_ = {};

  // lookup by column name/field
  var matches_ = {};

  /**
   * Check the configs against the current column. If the key matches one of the configs, save it
   * into matches_ for faster comparisons in the future
   * @param {string} key
   * @return {boolean}
   */
  var match = function(key) {
    if (matches_[key]) return true;

    // TODO loosen this up; use regex?
    var found = config_[key];

    if (found) {
      matches_[key] = true; // this column hit on one or more of the configs; save it for future use
    }

    return found;
  };

  return (feature) => {
    var properties = [];

    if (!initialized_) {
      config_ = OsSettings.getInstance().get(SIMPLE_PROPERTIES, {
        'CALLSIGN': true
      });
      initialized_ = true;
    }

    if (config_) {
      var source = OsFeature.getSource(feature);

      if (source) {
        // try the lookup... otherwise build a list of column(s)
        var columns = lookup_[source.getId()] || source.getColumns().filter(
            (column) => {
              return match(column['field']);
            });

        // save the entire collection of columns for next time
        if (!lookup_[source.getId()]) {
          lookup_[source.getId()] = columns;
        }

        // get values of configured columns
        columns.forEach(function(col) {
          var field = /** @type {string} */ (col['field']);
          var value = feature.get(field);

          properties.push({
            'id': field,
            'field': field,
            'value': value
          });
        }, this);
      } else {
        // if we don't have a source, look at the properties by hand
        var featureProperties = feature.getProperties();

        for (var key in featureProperties) {
          if (match(key)) {
            properties.push({
              'id': key,
              'field': key,
              'value': featureProperties[key]
            });
          }
        }
      }
    }

    return properties;
  };
})();

/**
 * The controller for the simple properties directive; automatically finds and displays property(ies) as configured
 * @unrestricted
 */
class Controller {
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
      (this.scope['items'] && this.scope['items'].length)
        ? this.scope['items'][0]
        : null);
    if (feature) {
      this['properties'] = getProperties_(feature);
    }
  }
}

/**
 * The simple properties directive.
 * @return {angular.Directive}
 */
const directive = () => ({
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
    <span>{{property.field}}</span>: <featureinfocell property="property"></featureinfocell><br />
  </span>
</div>
`
});

/**
 * Add the directive to the module.
 */
OsModule.directive('simpleProperties', [directive]);

exports = {
  Controller,
  directive
};
