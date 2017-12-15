goog.provide('os.ui.filter.ui.FilterNodeUICtrl');
goog.provide('os.ui.filter.ui.filterNodeUIDirective');
goog.require('os.ui.Module');
goog.require('os.ui.filter.ui.FilterNode');
goog.require('os.ui.query.QueryManager');
goog.require('os.ui.query.cmd.FilterRemove');
goog.require('os.ui.slick.AbstractNodeUICtrl');


/**
 * The selected/highlighted node UI directive for filters
 * @return {angular.Directive}
 */
os.ui.filter.ui.filterNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span class="glyphs pull-right slick-node-ui" ng-if="nodeUi.show()">' +
        '<span ng-if="nodeUi.canCopy()" ng-click="nodeUi.copy()">' +
        '<i class="fa fa-copy fa-fw glyph" title="Copy"></i></span>' +
        '<span ng-if="nodeUi.canEdit()" ng-click="nodeUi.edit()">' +
        '<i class="fa fa-pencil fa-fw glyph" title="Edit"></i></span>' +
        '<span ng-click="nodeUi.remove()">' +
        '<i class="fa fa-times fa-fw glyph glyph-remove" title="Remove"></i></span>' +
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
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.remove = function() {
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  var cmd = new os.ui.query.cmd.FilterRemove(filter);
  os.command.CommandProcessor.getInstance().addCommand(cmd);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.REMOVE, 1);
};
goog.exportProperty(
    os.ui.filter.ui.FilterNodeUICtrl.prototype,
    'remove',
    os.ui.filter.ui.FilterNodeUICtrl.prototype.remove);


/**
 * Is this filter able to be editted
 * @return {boolean}
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.canEdit = function() {
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  return goog.isDef(os.ui.queryManager.getLayerSet()[filter.getType()]);
};
goog.exportProperty(
    os.ui.filter.ui.FilterNodeUICtrl.prototype,
    'canEdit',
    os.ui.filter.ui.FilterNodeUICtrl.prototype.canEdit);


/**
 * Edits the filter
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.edit = function() {
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  this.scope.$emit('filterEdit', filter);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.EDIT, 1);
};
goog.exportProperty(
    os.ui.filter.ui.FilterNodeUICtrl.prototype,
    'edit',
    os.ui.filter.ui.FilterNodeUICtrl.prototype.edit);


/**
 * Whether to show the filter copy glyph
 * @return {boolean}
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.canCopy = function() {
  // we must have both a descriptor for the layer and more than 1 layer loaded
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  var d = os.dataManager.getDescriptor(filter.getType());
  var layers = os.ui.queryManager.getLayerSet();
  return goog.object.getCount(layers) > 0 && !!d;
};
goog.exportProperty(os.ui.filter.ui.FilterNodeUICtrl.prototype, 'canCopy',
    os.ui.filter.ui.FilterNodeUICtrl.prototype.canCopy);


/**
 * Copy a thing
 */
os.ui.filter.ui.FilterNodeUICtrl.prototype.copy = function() {
  var filter = /** @type {os.ui.filter.ui.FilterNode} */ (this.scope['item']).getEntry();
  this.scope.$emit('filterCopy', filter);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.COPY, 1);
};
goog.exportProperty(os.ui.filter.ui.FilterNodeUICtrl.prototype, 'copy',
    os.ui.filter.ui.FilterNodeUICtrl.prototype.copy);
