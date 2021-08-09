goog.module('os.ui.query.area.ChooseAreaUI');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('goog.Disposable');
const GoogEventType = goog.require('goog.events.EventType');
const {ROOT} = goog.require('os');
const {getAreaManager} = goog.require('os.query.instance');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  scope: {
    'area': '=?',
    'areas': '=?',
    'filter': '=?',
    'helpTitle': '@',
    'helpContent': '@'
  },
  templateUrl: ROOT + 'views/query/area/choosearea.html',
  controller: Controller,
  controllerAs: 'choosearea'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'choosearea';

/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

/**
 * @unrestricted
 */
class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    super();

    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    if (!this.scope_['areas']) {
      // if areas aren't defined, then populate them from the area manager and keep them up to date
      this.updateAreas_();
      getAreaManager().listen(GoogEventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);
    }

    // only pick a default value if area is undefined. do *not* pick a default on null. this allows us to control if a
    // default is chosen or not.
    if (this.scope_['area'] === undefined && this.scope_['areas'] && this.scope_['areas'].length > 0) {
      this.scope_['area'] = this.scope_['areas'][0];
    }

    // make it work with the confirm control
    $scope.$watch('area', function(newVal, oldVal) {
      $scope.$parent['confirmValue'] = newVal;
    });


    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    getAreaManager().unlisten(GoogEventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);
  }

  /**
   * @param {os.events.PropertyChangeEvent} event
   * @private
   */
  onAreasChanged_(event) {
    if (this.scope_) {
      this.updateAreas_();

      // area was removed from the manager, so remove it from the list
      if (event.getProperty() == 'remove' && event.getNewValue() == this.scope_['area']) {
        this.scope_['area'] = null;
      }

      apply(this.scope_);
    }
  }

  /**
   * @private
   */
  updateAreas_() {
    if (this.scope_) {
      this.scope_['areas'] = getAreaManager().getAll();

      if (this.scope_['filter']) {
        this.scope_['areas'] = this.scope_['areas'].filter(this.scope_['filter']);
      }
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
