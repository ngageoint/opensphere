goog.module('os.ui.slick.AbstractNodeUICtrl');
goog.module.declareLegacyNamespace();


/**
 * Abstract UI controller for tree nodes.
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

    // we want to get the cell element (the parent) and listen for changes to the class name
    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.cellEl = $element.parent();

    $scope.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Clean up.
   *
   * @protected
   */
  destroy() {
    this.scope = null;
    this.cellEl = null;
  }

  /**
   * Whether or not to show the element
   *
   * @return {boolean}
   * @export
   */
  show() {
    // selected class may be on the cell or the row
    return this.cellEl.hasClass('hovered') || this.cellEl.hasClass('selected') ||
        this.cellEl.parent().hasClass('selected');
  }
}

exports = Controller;
