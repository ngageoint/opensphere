goog.provide('os.ui.filter.ui.FilterNodeUICtrl');
goog.provide('os.ui.filter.ui.filterNodeUIDirective');

goog.require('os.query.BaseQueryManager');
goog.require('os.ui.Module');
goog.require('os.ui.filter.ui.FilterNode');
goog.require('os.ui.query.cmd.FilterRemove');
goog.require('os.ui.slick.AbstractNodeUICtrl');


/**
 * The selected/highlighted node UI directive for filters
 *
 * @return {angular.Directive}
 */
os.ui.filter.ui.filterNodeUIDirective = function() {
  return {
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
    controller: os.ui.filter.ui.FilterNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('filternodeui', [os.ui.filter.ui.filterNodeUIDirective]);



/**
 * Controller for selected/highlighted node UI
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractNodeUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.FilterNodeUICtrl = function($scope, $element) {
  os.ui.filter.ui.FilterNodeUICtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(os.ui.filter.ui.FilterNodeUICtrl, os.ui.slick.AbstractNodeUICtrl);


/**
 * Removes the filter
 *
 * @export
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.remove = function() {
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  var cmd = new os.ui.query.cmd.FilterRemove(filter);
  os.command.CommandProcessor.getInstance().addCommand(cmd);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.REMOVE, 1);
};


/**
 * Is this filter able to be editted
 *
 * @return {boolean}
 * @export
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.canEdit = function() {
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  return os.ui.queryManager.getLayerSet()[filter.getType()] !== undefined;
};


/**
 * Edits the filter
 *
 * @export
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.edit = function() {
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  this.scope.$emit('filterEdit', filter);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.EDIT, 1);
};


/**
 * Whether to show the filter copy glyph
 *
 * @return {boolean}
 * @export
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.canCopy = function() {
  // we must have both a descriptor for the layer and more than 1 layer loaded
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  var d = os.dataManager.getDescriptor(filter.getType());
  var layers = os.ui.queryManager.getLayerSet();
  return goog.object.getCount(layers) > 0 && !!d;
};


/**
 * Copy a thing
 *
 * @export
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.copy = function() {
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  this.scope.$emit('filterCopy', filter);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.COPY, 1);
};


/**
 * If this is a default filter.
 *
 * @return {boolean}
 * @export
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.isDefault = function() {
  var entry = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  return !!entry && entry.isDefault();
};
