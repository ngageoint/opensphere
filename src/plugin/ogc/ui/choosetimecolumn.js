goog.declareModuleId('plugin.ogc.ui.ChooseTimeColumnUI');

import '../../../os/ui/util/validationmessage.js';
import DataManager from '../../../os/data/datamanager.js';
import * as os from '../../../os/os.js';
import Module from '../../../os/ui/module.js';
import * as osWindow from '../../../os/ui/window.js';
import WindowEventType from '../../../os/ui/windoweventtype.js';

const Disposable = goog.require('goog.Disposable');


/**
 * A spinner directive for a node that loads items
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,

  scope: {
    'id': '=',
    'deferred': '='
  },

  templateUrl: os.ROOT + 'views/plugin/ogc/ui/choosetimecolumn.html',
  controller: Controller,
  controllerAs: 'chooseTime'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'choose-time-column';


/**
 * Add the directive to the module
 */
Module.directive('chooseTimeColumn', [directive]);



/**
 * Allow the user to choose time columns and save it to the descriptor
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super();

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

    /**
     * @type {OGCLayerDescriptor}
     * @private
     */
    this.descriptor_ = /** @type {OGCLayerDescriptor} */ (
      DataManager.getInstance().getDescriptor(this.scope_['id']));

    /**
     * @type {IFeatureType}
     * @private
     */
    this.featureType_ = null;

    if (this.descriptor_) {
      this.featureType_ = this.descriptor_.getFeatureType();

      this.scope_['title'] = this.descriptor_.getTitle();
      this['start'] = this.featureType_.getStartDateColumnName();
      this['end'] = this.featureType_.getEndDateColumnName();
      this['timeColumns'] = this.descriptor_.getFeatureType().getTimeColumns();

      $scope.$emit(WindowEventType.READY);
    } else {
      osWindow.close(this.element_);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.scope_ = null;
  }

  /**
   * Save the time columns to the descriptor
   *
   * @export
   */
  save() {
    this.featureType_.setStartDateColumnName(this['start']);
    this.featureType_.setEndDateColumnName(this['end']);

    if (this.scope_['deferred']) {
      this.scope_['deferred'].callback();
    }
    this.close();
  }

  /**
   * Close the window
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
    this.dispose();
  }

  /**
   * Launch the choose time column directive
   *
   * @param {string} layerId
   * @param {goog.async.Deferred=} opt_deferred - call the deferred on save/cancel if provided
   */
  static launch(layerId, opt_deferred) {
    var id = 'chooseTimeColumn';

    if (osWindow.exists(id)) {
      osWindow.bringToFront(id);
    } else {
      var winOptions = {
        'id': id,
        'label': 'Choose Time Columns',
        'icon': 'fa fa-clock-o',
        'x': 'center',
        'y': 'center',
        'width': '425',
        'min-width': '400',
        'max-width': '800',
        'height': 'auto',
        'min-height': '200',
        'max-height': '900',
        'modal': 'true'
      };
      var scopeOptions = {
        'id': layerId,
        'deferred': opt_deferred
      };

      osWindow.create(winOptions, '<choose-time-column id="id" deferred="deferred"></choose-time-column>',
          undefined, undefined, undefined, scopeOptions);
    }
  }
}
