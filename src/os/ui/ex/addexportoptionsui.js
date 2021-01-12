goog.module('os.ui.AddExportOptionsUI');

const Module = goog.require('os.ui.Module');


/**
 * Directive
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'options': '=',
    'showcount': '='
  },
  templateUrl: os.ROOT + 'views/file/addexportoptions.html',
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * Add the directive to the module
 */
Module.directive('addexportoptions', [directive]);


/**
 * Controller function for the addExportOptions directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * Radio option selected
     * @type {string}
     */
    this.scope['option'] = 'allData';

    /**
     * Toggle to show count next to each option
     * @type {string}
     */
    this['showcount'] = this.scope['showcount'] || false;

    /**
     * All data
     * @type {string}
     */
    this['allData'] = this.scope['options'].allData;

    /**
     * Only selected Data
     * @type {string}
     */
    this['selectedData'] = this.scope['options'].selectedData;

    /**
     * Only active (checked) data
     * @type {string}
     */
    this['activeData'] = this.scope['options'].activeData;

    this.scope.$watch('option', function(newVal) {
      this.scope.$emit('addexportoptions.updateitem', this[newVal]);
    }.bind(this));
  }
}


exports = {
  Controller,
  directive
};
