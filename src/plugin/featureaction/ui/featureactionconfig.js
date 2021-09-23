goog.declareModuleId('plugin.im.action.feature.ui.ActionConfigCtrl');

const Disposable = goog.require('goog.Disposable');
const WindowEventType = goog.require('os.ui.WindowEventType');


/**
 * Base controller for configuring a feature action.
 *
 * @template T
 * @unrestricted
 */
export default class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root element for the directive.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * The feature action.
     * @type {T}
     * @protected
     */
    this.action = /** @type {T|undefined} */ ($scope['action']);

    /**
     * The feature action.
     * @type {string}
     * @protected
     */
    this.type = /** @type {string|undefined} */ ($scope['type']) || '';

    // set up values on the confirm directive scope
    $scope.$parent['confirmCallback'] = this.saveAction.bind(this);
    $scope.$parent['confirmValue'] = this.action;

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.action = null;
    this.element = null;
    this.scope = null;
  }

  /**
   * Initialize the UI from the action.
   *
   * @protected
   */
  initialize() {
    if (this.scope) {
      this.scope.$emit(WindowEventType.READY);
    }
  }

  /**
   * Save changes to the action.
   * @protected
   */
  saveAction() {}
}
