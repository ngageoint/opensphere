goog.module('os.string.Pluralize');
goog.module.declareLegacyNamespace();

const Settings = goog.require('os.config.Settings');
const Module = goog.require('os.ui.Module');

/**
 * If rules have been initialized.
 * @type {boolean}
 */
let initialized = false;

/**
 * Initialize pluralization rules
 */
const initialize = function() {
  if (!initialized) {
    /** @type {!Array<!Object>} */ (Settings.getInstance().get('pluralize.pluralRules', [])).forEach((rule) => {
      pluralize.addPluralRule(rule['re'], rule['plural']);
    });

    /** @type {!Array<!Object>} */ (Settings.getInstance().get('pluralize.irregularRules', [])).forEach((rule) => {
      pluralize.addIrregularRule(rule['irregular'], rule['plural']);
    });
    initialized = true;
  }
};

/**
 * Controller for pluralize
 * @unrestricted
 */
class Controller {
  /**
   * Controller for the pluralize directive.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    initialize();

    this.pluralize_();
  }

  /**
   * @private
   */
  pluralize_() {
    this['value'] = pluralize(this.scope_['word'], this.scope_['count'], this.scope_['inclusive']);
    os.ui.apply(this.scope_);
  }

  /**
   * Clean up.
   */
  $onDestroy() {
    this.scope_ = null;
  }
}

/**
 * The marking directive. This control is used in forms to choose a classification value.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'word': '@',
    'count': '@?',
    'inclusive': '@?'
  },
  template: '<div class="d-inline">{{ctrl.value}}</div>',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * Add the directive to the module.
 */
Module.directive('pluralize', [directive]);

exports = {Controller, directive};
