goog.declareModuleId('os.ui.layer.IconStyleControlsUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import VectorStyleControlsEventType from './vectorstylecontrolseventtype.js';

const Disposable = goog.require('goog.Disposable');


/**
 * The icon options directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'columns': '=',
    'showRotation': '=?',
    'rotationColumn': '=?'
  },
  templateUrl: ROOT + 'views/layer/iconstylecontrols.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'iconstylecontrols';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the iconstyleoptions directive.
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @ngInject
   */
  constructor($scope) {
    super();

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    if (this.scope['showRotation'] == null) {
      this.scope['showRotation'] = true;
    }

    if (this.scope['rotationColumn'] == null) {
      this.scope['rotationColumn'] = '';
    }

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.scope = null;
  }

  /**
   * Toggle the Show Rotation.
   *
   * @export
   */
  toggleShowRotation() {
    if (this.scope) {
      this.scope.$emit(VectorStyleControlsEventType.SHOW_ROTATION_CHANGE, this.scope['showRotation']);
    }
  }

  /**
   * Handles column changes to the rotation
   *
   * @export
   */
  onRotationColumnChange() {
    if (this.scope) {
      this.scope.$emit(VectorStyleControlsEventType.ROTATION_COLUMN_CHANGE, this.scope['rotationColumn']);
    }
  }
}
