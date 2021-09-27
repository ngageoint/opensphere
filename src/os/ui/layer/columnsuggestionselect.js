goog.declareModuleId('os.ui.layer.ColumnSuggestionSelect');
import Module from '../module.js';


/**
 * An attribute directive to generate column suggestion option groups for select elements.
 * Simpler and easier "group" functionality from ngOptions.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'A',
  scope: {
    'suggested': '=',
    'options': '=',
    'field': '=?'
  },
  template: `
    <optgroup label="Suggested Columns" ng-if="suggested.length > 0">
      <option ng-repeat="opt in suggested" ng-value="opt">{{field ? opt[field] : opt}}</option>
    </optgroup>
    <optgroup label="Available Columns">
      <option ng-repeat="opt in options" ng-value="opt">{{field ? opt[field] : opt}}</option>
    </optgroup>`
});

Module.directive('columnSuggestion', [directive]);
