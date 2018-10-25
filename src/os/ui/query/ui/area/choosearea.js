goog.provide('os.ui.query.ui.area.ChooseAreaCtrl');
goog.provide('os.ui.query.ui.area.chooseAreaDirective');

goog.require('goog.Disposable');
goog.require('os.ui.Module');
goog.require('os.ui.window.confirmDirective');


/**
 * @return {angular.Directive}
 */
os.ui.query.ui.area.chooseAreaDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'area': '=?',
      'areas': '=?',
      'filter': '=?',
      'helpTitle': '@',
      'helpContent': '@'
    },
    templateUrl: os.ROOT + 'views/query/area/choosearea.html',
    controller: os.ui.query.ui.area.ChooseAreaCtrl,
    controllerAs: 'choosearea'
  };
};


/**
 * Add the directive to the os module
 */
os.ui.Module.directive('choosearea', [os.ui.query.ui.area.chooseAreaDirective]);



/**
 * @param {!angular.Scope} $scope
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.query.ui.area.ChooseAreaCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  if (!this.scope_['areas']) {
    // if areas aren't defined, then populate them from the area manager and keep them up to date
    this.updateAreas_();
    os.ui.areaManager.listen(goog.events.EventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);
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
};
goog.inherits(os.ui.query.ui.area.ChooseAreaCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.query.ui.area.ChooseAreaCtrl.prototype.disposeInternal = function() {
  os.ui.query.ui.area.ChooseAreaCtrl.base(this, 'disposeInternal');
  os.ui.areaManager.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onAreasChanged_, false, this);
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.ui.query.ui.area.ChooseAreaCtrl.prototype.onAreasChanged_ = function(event) {
  if (this.scope_) {
    this.updateAreas_();

    // area was removed from the manager, so remove it from the list
    if (event.getProperty() == 'remove' && event.getNewValue() == this.scope_['area']) {
      this.scope_['area'] = null;
    }

    os.ui.apply(this.scope_);
  }
};


/**
 * @private
 */
os.ui.query.ui.area.ChooseAreaCtrl.prototype.updateAreas_ = function() {
  if (this.scope_) {
    this.scope_['areas'] = os.ui.areaManager.getAll();

    if (this.scope_['filter']) {
      this.scope_['areas'] = this.scope_['areas'].filter(this.scope_['filter']);
    }
  }
};


/**
 * @param {function(!ol.Feature)} confirm
 * @param {ol.Feature=} opt_default The default area to select
 */
os.ui.query.ui.area.launchChooseArea = function(confirm, opt_default) {
  os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    confirmValue: opt_default,
    prompt: '<span>Please choose an area from the list:</span><choosearea></choosearea>',
    windowOptions: {
      'label': 'Choose Area',
      'icon': 'fa fa-list-ul',
      'x': 'center',
      'y': 'center',
      'width': '400',
      'height': 'auto',
      'show-close': 'true',
      'no-scroll': 'true',
      'modal': 'true'
    }
  }));
};
