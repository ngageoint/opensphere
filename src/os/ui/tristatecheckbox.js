goog.provide('os.ui.TriStateCheckboxCtrl');
goog.provide('os.ui.triStateCheckboxDirective');

goog.require('os.ui.Module');


/**
 * The slick tree directive
 *
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
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.TriStateCheckboxCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   */
  this.element = $element;

  var item = /** @type {os.structs.TriStateTreeNode} */ (this.scope['item']);
  if (this.getDisabled(item)) {
    $element.addClass('disabled');
  }

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references
 *
 * @private
 */
os.ui.TriStateCheckboxCtrl.prototype.destroy_ = function() {
  this.scope = null;
  this.element = null;
};


/**
 * Toggles the state on the scope
 *
 * @param {MouseEvent} e The event
 * @export
 */
os.ui.TriStateCheckboxCtrl.prototype.toggle = function(e) {
  if (this.scope) {
    var item = /** @type {os.structs.TriStateTreeNode} */ (this.scope['item']);
    if (!this.getDisabled(item)) {
      // on/both should toggle to the off state
      item.setState(item.getState() == os.structs.TriState.OFF ?
        os.structs.TriState.ON : os.structs.TriState.OFF);

      this.notifyDirty();
    }

    e.stopPropagation();
  }
};


/**
 * Toggles the state on the scope
 *
 * @param {MouseEvent} e The event
 * @export
 */
os.ui.TriStateCheckboxCtrl.prototype.onDblClick = function(e) {
  if (!this.element.hasClass('disabled')) {
    // prevent double click from propagating further if the checkbox is enabled. clicks should only toggle the checkbox.
    e.stopPropagation();
  }
};


/**
 * Gets whether the checkbox is enabled.
 *
 * @param {?os.structs.TriStateTreeNode} item
 * @return {boolean}
 */
os.ui.TriStateCheckboxCtrl.prototype.getDisabled = function(item) {
  if (item) {
    const disabled = item.getCheckboxDisabled();
    if (disabled != null) {
      // if disabled is explicitly true or false, treat it as an override
      return disabled;
    }

    // if disabled is null, use the tree-level flag
    return this.scope['disableFolders'] && item.hasChildren();
  }

  return false;
};


/**
 * Fire a dirty event on the scope to update parents.
 */
os.ui.TriStateCheckboxCtrl.prototype.notifyDirty = function() {
  if (this.scope) {
    this.scope.$emit('dirty');
    os.ui.apply(this.scope);
  }
};
