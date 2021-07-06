goog.module('os.config.UnitSettingsUI');
goog.module.declareLegacyNamespace();

const GoogEventType = goog.require('goog.events.EventType');
const {ROOT} = goog.require('os');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const UnitManager = goog.require('os.unit.UnitManager');

const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');


/**
 * The unit settings UI directive
 *
 * @return {angular.Directive}
 */
const directive = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: ROOT + 'views/config/unitsettings.html',
    controller: Controller,
    controllerAs: 'unitsCtrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'unitsettings';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for unit settings
 * @unrestricted
 */
class Controller {
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
     * @type {UnitManager}
     * @private
     */
    this.unitManager_ = UnitManager.getInstance();
    this.unitManager_.listen(GoogEventType.PROPERTYCHANGE, this.onUnitsChange_, false, this);
    var systems = this.unitManager_.getFullSystems();
    this['allUnits'] = [];

    for (var system in systems) {
      var sys = systems[system]['distance'];
      if (sys) {
        this['allUnits'].push({
          'title': sys.getTitle(),
          'system': sys.getSystem()
        });
      }
    }
    // initialize units from settings
    this['units'] = this.unitManager_.getSelectedSystem();
    this.scope_.$watch('unitsCtrl.units', this.updateUnits_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    this.unitManager_.unlisten(GoogEventType.PROPERTYCHANGE, this.onUnitsChange_, false, this);
    this.unitManager_ = null;
    this.scope_ = null;
  }

  /**
   * Handle units change via settings.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onUnitsChange_(event) {
    var newVal = event.getNewValue();
    if (newVal && newVal !== this['units']) {
      this['units'] = newVal;
      apply(this.scope_);
    }
  }

  /**
   * Save the new units settings.
   *
   * @param {string=} opt_new
   * @param {string=} opt_old
   * @private
   */
  updateUnits_(opt_new, opt_old) {
    if (this.unitManager_ && opt_new && opt_old && opt_new !== opt_old) {
      this.unitManager_.setSelectedSystem(opt_new);
    }
  }
}

exports = {
  directive,
  directiveTag,
  Controller
};
