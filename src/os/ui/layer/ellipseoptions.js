goog.declareModuleId('os.ui.layer.EllipseOptionsUI');

import VectorLayerShowEllipsoids from '../../command/vectorlayershowellipsoidscmd.js';
import VectorLayerShowGroundReference from '../../command/vectorlayershowgroundreferencecmd.js';
import {ROOT} from '../../os.js';
import StyleField from '../../style/stylefield.js';
import StyleManager from '../../style/stylemanager_shim.js';
import Module from '../module.js';
import AbstractLayerUICtrl from './abstractlayerui.js';


/**
 * The ellipseoptions directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/layer/ellipseoptions.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'ellipseoptions';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the ellipseoptions directive.
 * @unrestricted
 */
export class Controller extends AbstractLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * The Show Ellipsoids checkbox state.
     * @type {boolean}
     */
    this['showEllipsoids'] = false;

    /**
     * The Show Ground Reference checkbox state.
     * @type {boolean}
     */
    this['showGroundReference'] = false;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope = null;
    this.element = null;
  }

  /**
   * @inheritDoc
   */
  initUI() {
    super.initUI();

    if (!this.isDisposed()) {
      this['showEllipsoids'] = this.getShowEllipsoids_();
      this['showGroundReference'] = this.getShowGroundReference_();
    }
  }

  /**
   * If ellipsoids should be displayed for the layer(s).
   *
   * @return {boolean}
   * @private
   */
  getShowEllipsoids_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return !!config[StyleField.SHOW_ELLIPSOIDS];
      }
    }

    return false;
  }

  /**
   * If ellipses should also show a ground reference line.
   *
   * @return {boolean}
   * @private
   */
  getShowGroundReference_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items && items.length > 0) {
      var config = StyleManager.getInstance().getLayerConfig(items[0].getId());
      if (config) {
        return !!config[StyleField.SHOW_GROUND_REF];
      }
    }

    return false;
  }

  /**
   * Handle changes to the Show Ellipsoids option.
   *
   * @export
   */
  onShowEllipsoidsChange() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      var value = this['showEllipsoids'];
      var fn =
          /**
           * @param {os.layer.ILayer} layer
           * @return {os.command.ICommand}
           */
          function(layer) {
            return new VectorLayerShowEllipsoids(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }

  /**
   * Handle changes to the Show Ground Reference option.
   *
   * @export
   */
  onShowGroundReferenceChange() {
    var items = /** @type {Array} */ (this.scope['items']);
    if (items && items.length > 0) {
      var value = this['showGroundReference'];
      var fn =
          /**
           * @param {os.layer.ILayer} layer
           * @return {os.command.ICommand}
           */
          function(layer) {
            return new VectorLayerShowGroundReference(layer.getId(), value);
          };

      this.createCommand(fn);
    }
  }
}
