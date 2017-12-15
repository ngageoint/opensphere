goog.provide('os.ui.TriStateCheckboxCtrl');
goog.provide('os.ui.triStateCheckboxDirective');

goog.require('os.ui.Module');


/**
 * The slick tree directive
 * @return {angular.Directive}
 */
os.ui.triStateCheckboxDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span ng-class="chkClass + \' \' + chkClass + \'-\' + item.state"' +
        'ng-click="checkCtrl.toggle($event)" ng-dblclick="checkCtrl.onDblClick($event)" title="{{chkTooltip}}">' +
        '<label></label></span>',
    controller: os.ui.TriStateCheckboxCtrl,
    controllerAs: 'checkCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('tristatecheckbox', [os.ui.triStateCheckboxDirective]);



/**
 * Controller for tri-state checkbox
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.TriStateCheckboxCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  var item = /** @type {os.structs.TriStateTreeNode} */ (this.scope_['item']);
  if (this.getDisabled_(item)) {
    $element.addClass('disabled');
  }

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references
 * @private
 */
os.ui.TriStateCheckboxCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Toggles the state on the scope
 * @param {MouseEvent} e The event
 */
os.ui.TriStateCheckboxCtrl.prototype.toggle = function(e) {
  if (this.scope_) {
    var item = /** @type {os.structs.TriStateTreeNode} */ (this.scope_['item']);
    if (!this.getDisabled_(item)) {
      // on/both should toggle to the off state
      item.setState(item.getState() == os.structs.TriState.OFF ?
          os.structs.TriState.ON : os.structs.TriState.OFF);

      this.notifyDirty_();
    }

    e.stopPropagation();
  }
};
goog.exportProperty(
    os.ui.TriStateCheckboxCtrl.prototype,
    'toggle',
    os.ui.TriStateCheckboxCtrl.prototype.toggle);


/**
 * Toggles the state on the scope
 * @param {MouseEvent} e The event
 */
os.ui.TriStateCheckboxCtrl.prototype.onDblClick = function(e) {
  if (!this.element_.hasClass('disabled')) {
    // prevent double click from propagating further if the checkbox is enabled. clicks should only toggle the checkbox.
    e.stopPropagation();
  }
};
goog.exportProperty(
    os.ui.TriStateCheckboxCtrl.prototype,
    'onDblClick',
    os.ui.TriStateCheckboxCtrl.prototype.onDblClick);


/**
 * Gets whether the checkbox is enabled.
 * @param {?os.structs.TriStateTreeNode} item
 * @return {boolean}
 * @private
 */
os.ui.TriStateCheckboxCtrl.prototype.getDisabled_ = function(item) {
  return !!item && (item.getCheckboxDisabled() || (this.scope_['disableFolders'] && item.hasChildren()));
};


/**
 * Fire a dirty event on the scope to update parents.
 * @private
 */
os.ui.TriStateCheckboxCtrl.prototype.notifyDirty_ = function() {
  if (this.scope_) {
    this.scope_.$emit('dirty');
    os.ui.apply(this.scope_);
  }
};
