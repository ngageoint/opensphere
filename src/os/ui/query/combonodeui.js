goog.module('os.ui.query.ComboNodeUI');

const {getCount} = goog.require('goog.object');
const DataManager = goog.require('os.data.DataManager');
const Metrics = goog.require('os.metrics.Metrics');
const {Filters} = goog.require('os.metrics.keys');
const {getQueryManager} = goog.require('os.query.instance');
const TriState = goog.require('os.structs.TriState');
const Module = goog.require('os.ui.Module');

const ComboNode = goog.requireType('os.ui.query.ComboNode');


/**
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span class="form-inline">' +
      '<span ng-if="nodeUi.isGroup()" title="Whether to pass all filters (AND) or any filter (OR)">' +
      '<span><select class="custom-select" ng-model="nodeUi.activeGroup" ng-change="nodeUi.toggleGroup()"' +
      'ng-options="item as item for item in nodeUi.groups"/></select></span>' +
      '</span>' +
      '<span class="ml-2">' +
      '<span ng-if="nodeUi.isArea() && nodeUi.isEnabled()" ng-click="nodeUi.toggleQuery()" title="' +
      'Toggles between querying and excluding the area">' +
      '<i class="fa fa-fw c-glyph" ' +
      'ng-class="{\'fa-ban text-danger\': !nodeUi.include, \'fa-circle u-text-yellow\': nodeUi.include}"></i>' +
      '</span>' +
      '<span ng-if="nodeUi.isFilter() && nodeUi.showCopy()" ng-click="nodeUi.copy()">' +
      '<i class="fa fa-copy fa-fw c-glyph" title="Copy"></i></span>' +
      '<span ng-if="nodeUi.isFilter() || nodeUi.isArea()" ng-click="nodeUi.edit()">' +
      '<i class="fa fa-pencil fa-fw c-glyph" title="Edit"></i></span>' +
      '<span ng-if="nodeUi.isFilter() || nodeUi.isArea()" ng-click="nodeUi.remove()">' +
      '<i class="fa fa-times fa-fw c-glyph" title="Remove"></i></span>' +
      '</span></span>',
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'combonodeui';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for above directive
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
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {ComboNode}
     * @private
     */
    this.node_ = $scope['item'];

    this['group'] = this.getFilterGroup();
    this['activeGroup'] =
      this['group'] ? Controller.GROUPS[0] : Controller.GROUPS[1];
    this['include'] = this.getInclude();

    var entry = this.getEntry();
    if (entry && entry['filterGroup'] === undefined) {
      entry['filterGroup'] = this['group'];
    }

    this['groups'] = Controller.GROUPS;

    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up
   *
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
  }

  /**
   * Gets the filter group value
   *
   * @return {boolean}
   * @protected
   */
  getFilterGroup() {
    var children = /** @type {Array<ComboNode>} */ (this.node_.getChildren());

    if (children && children.length) {
      // check all of the children to see if we are AND or we are OR
      var returnValue = true;

      for (var x = 0; x < children.length; x++) {
        var entry = children[x].getEntry();
        if (entry && entry['filterGroup'] !== undefined && !entry['filterGroup']) {
          returnValue = false;
        }
      }

      return returnValue;
    }

    return true;
  }

  /**
   * Gets include value
   *
   * @return {boolean}
   * @protected
   */
  getInclude() {
    var entry = this.node_.getEntry();

    if (entry && entry['areaId']) {
      var value = /** @type {boolean} */ (entry['includeArea']);
      return value !== undefined ? value : true;
    }

    return true;
  }

  /**
   * Toggles the filter group value
   *
   * @export
   */
  toggleGroup() {
    this['group'] = !this['group'];
    this.getEntry()['filterGroup'] = this['group'];
    var children = /** @type {Array<ComboNode>} */ (this.node_.getChildren());

    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        var node = /** @type {ComboNode} */ (children[i]);

        if (node) {
          var entry = node.getEntry();

          if (entry && entry['filterId']) {
            entry['filterGroup'] = this['group'];
          }
        }
      }
    }

    this.scope_.$emit('dirty');
  }

  /**
   * @return {boolean} Whether or not to show the filter group UI
   * @export
   */
  isGroup() {
    var children = this.node_.getChildren();

    if (children && children.length) {
      var entry = /** @type {ComboNode} */ (children[0]).getEntry();
      return !!entry && !!entry['filterId'] && entry['filterId'] !== '*';
    }

    return false;
  }

  /**
   * @return {Object<string, string|boolean>}
   */
  getEntry() {
    return this.node_.getEntry();
  }

  /**
   * Toggles area query/exclude
   *
   * @export
   */
  toggleQuery() {
    this['include'] = !this['include'];
    var entry = this.getEntry();

    if (entry) {
      entry['includeArea'] = /** @type {boolean} */ (this['include']);
    }
    Metrics.getInstance().updateMetric(Filters.ADVANCED_AREA_INCLUDE_TOGGLE, 1);
    this.scope_.$emit('dirty');
  }

  /**
   * @return {boolean} Whether or not to show the area UI
   * @export
   */
  isArea() {
    var entry = this.getEntry();
    return !!entry && !!entry['areaId'] && entry['areaId'] !== '*';
  }

  /**
   * @return {boolean} Whether or not the node is enabled
   * @export
   */
  isEnabled() {
    return this.node_.getState() !== TriState.OFF;
  }

  /**
   * @return {boolean} Whether or not to show the filter entry UI
   * @export
   */
  isFilter() {
    var entry = this.getEntry();
    return !!entry && !!entry['filterId'] && entry['filterId'] !== '*';
  }

  /**
   * Edit a thing
   *
   * @export
   */
  edit() {
    this.scope_.$emit('edit', this.isFilter(), this.getEntry());
    Metrics.getInstance().updateMetric(Filters.ADVANCED_AREA_EDIT, 1);
  }

  /**
   * View a thing
   *
   * @export
   */
  view() {
    this.scope_.$emit('view', this.isFilter(), this.getEntry());
  }

  /**
   * Whether to show the filter copy glyph.
   *
   * @return {boolean}
   * @export
   */
  showCopy() {
    // we must have both a descriptor for the layer and more than 1 layer loaded
    var layerId = /** @type {string} */ (this.getEntry()['layerId']);
    var d = DataManager.getInstance().getDescriptor(layerId);
    var layers = getQueryManager().getLayerSet();
    return getCount(layers) > 0 && !!d;
  }

  /**
   * Copy a thing
   *
   * @export
   */
  copy() {
    this.scope_.$emit('copy', this.getEntry());
    Metrics.getInstance().updateMetric(Filters.ADVANCED_AREA_COPY, 1);
  }

  /**
   * Remove a thing
   *
   * @export
   */
  remove() {
    this.scope_.$emit('remove', this.isFilter(), this.getEntry());
    this.scope_.$emit('dirty');
    Metrics.getInstance().updateMetric(Filters.ADVANCED_AREA_REMOVE, 1);
  }
}

/**
 * Available groupings for filter grouping nodes.
 * Not is not included because a node can be unchecked to achieve the same thing.
 * @type {Array<string>}
 * @const
 */
Controller.GROUPS = [
  'All (AND)',
  'Any (OR)'
];

exports = {
  Controller,
  directive,
  directiveTag
};
