goog.declareModuleId('os.ui.filter.ui.FilterNodeUI');

import CommandProcessor from '../../../command/commandprocessor.js';
import DataManager from '../../../data/datamanager.js';
import Metrics from '../../../metrics/metrics.js';
import {Filters} from '../../../metrics/metricskeys.js';
import {getQueryManager} from '../../../query/queryinstance.js';
import Module from '../../module.js';
import FilterRemove from '../../query/cmd/filterremovecmd.js';
import AbstractNodeUICtrl from '../../slick/abstractnodeui.js';

const {getCount} = goog.require('goog.object');

const {default: FilterNode} = goog.requireType('os.ui.filter.ui.FilterNode');


/**
 * The selected/highlighted node UI directive for filters
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
      '<span ng-if="nodeUi.canCopy()" ng-click="nodeUi.copy()">' +
      '<i class="fa fa-copy fa-fw c-glyph" title="Copy"></i></span>' +
      '<span ng-if="nodeUi.canEdit()" ng-click="nodeUi.edit()">' +
      '<i class="fa fa-pencil fa-fw c-glyph" title="Edit"></i></span>' +

      '<span ng-click="nodeUi.remove()">' +
      '<i class="fa fa-times fa-fw c-glyph" title="Remove"></i></span>' +
      '</span>',
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filternodeui';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
 * @unrestricted
 */
export class Controller extends AbstractNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * Removes the filter
   *
   * @export
   */
  remove() {
    var filter = /** @type {FilterNode} */ (this.scope['item']).getEntry();
    var cmd = new FilterRemove(filter);
    CommandProcessor.getInstance().addCommand(cmd);
    Metrics.getInstance().updateMetric(Filters.REMOVE, 1);
  }

  /**
   * Is this filter able to be editted
   *
   * @return {boolean}
   * @export
   */
  canEdit() {
    var filter = /** @type {FilterNode} */ (this.scope['item']).getEntry();
    return getQueryManager().getLayerSet()[filter.getType()] !== undefined;
  }

  /**
   * Edits the filter
   *
   * @export
   */
  edit() {
    var filter = /** @type {FilterNode} */ (this.scope['item']).getEntry();
    this.scope.$emit('filterEdit', filter);
    Metrics.getInstance().updateMetric(Filters.EDIT, 1);
  }

  /**
   * Whether to show the filter copy glyph
   *
   * @return {boolean}
   * @export
   */
  canCopy() {
    // we must have both a descriptor for the layer and more than 1 layer loaded
    var filter = /** @type {FilterNode} */ (this.scope['item']).getEntry();
    var d = DataManager.getInstance().getDescriptor(filter.getType());
    var layers = getQueryManager().getLayerSet();
    return getCount(layers) > 0 && !!d;
  }

  /**
   * Copy a thing
   *
   * @export
   */
  copy() {
    var filter = /** @type {FilterNode} */ (this.scope['item']).getEntry();
    this.scope.$emit('filterCopy', filter);
    Metrics.getInstance().updateMetric(Filters.COPY, 1);
  }

  /**
   * If this is a default filter.
   *
   * @return {boolean}
   * @export
   */
  isDefault() {
    var entry = /** @type {FilterNode} */ (this.scope['item']).getEntry();
    return !!entry && entry.isDefault();
  }
}
