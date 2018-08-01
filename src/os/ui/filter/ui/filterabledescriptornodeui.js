goog.provide('os.ui.filter.ui.FilterableDescriptorNodeUICtrl');
goog.provide('os.ui.filter.ui.filterableDescriptorNodeUIDirective');

goog.require('os.ui.Module');
goog.require('os.ui.slick.AbstractNodeUICtrl');


/**
 * The selected/highlighted node UI directive for filters
 * @return {angular.Directive}
 */
os.ui.filter.ui.filterableDescriptorNodeUIDirective = function() {
  return {
    restrict: 'E',
    scope: true,
    template: os.ui.filter.ui.filterableDescriptorNodeUIDirective.TEMPLATE_,
    controller: os.ui.filter.ui.FilterableDescriptorNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * @type {string}
 * @private
 */
os.ui.filter.ui.filterableDescriptorNodeUIDirective.TEMPLATE_ =
    '<span class="float-right" ng-if="nodeUi.show()">' +
    '<span ng-if="nodeUi.filtersEnabled" ng-click="nodeUi.filter()">' +
    '<i class="fa fa-filter fa-fw c-glyph" title="Manage filters"' +
    'ng-class="{\'text-success\': nodeUi.filtered, \'c-glyph__off\': !nodeUi.filtered}"></i></span></span>';


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('filterabledescriptornodeui', [os.ui.filter.ui.filterableDescriptorNodeUIDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractNodeUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.FilterableDescriptorNodeUICtrl = function($scope, $element) {
  os.ui.filter.ui.FilterableDescriptorNodeUICtrl.base(this, 'constructor', $scope, $element);

  /**
   * @type {os.ui.data.DescriptorNode}
   * @private
   */
  this.node_ = $scope['item'];

  var qm = os.ui.queryManager;
  qm.listen(goog.events.EventType.PROPERTYCHANGE, this.updateFilters_, false, this);

  this.updateFilters_();
};
goog.inherits(os.ui.filter.ui.FilterableDescriptorNodeUICtrl, os.ui.slick.AbstractNodeUICtrl);


/**
 * @inheritDoc
 */
os.ui.filter.ui.FilterableDescriptorNodeUICtrl.prototype.destroy = function() {
  os.ui.filter.ui.FilterableDescriptorNodeUICtrl.base(this, 'destroy');

  var qm = os.ui.queryManager;
  qm.unlisten(goog.events.EventType.PROPERTYCHANGE, this.updateFilters_, false, this);
};


/**
 * Update filters
 * @param {os.events.PropertyChangeEvent=} opt_event
 * @private
 */
os.ui.filter.ui.FilterableDescriptorNodeUICtrl.prototype.updateFilters_ = function(opt_event) {
  var d = /** @type {os.filter.IFilterable} */ (this.node_.getDescriptor());

  try {
    this['filtersEnabled'] = d.isFilterable();
  } catch (e) {
    // wasn't filterable, return
    this['filtersEnabled'] = false;
    return;
  }

  d = /** @type {os.data.IDataDescriptor} */ (d);
  var aliases = d.getAliases();
  this['filtered'] = goog.array.some(aliases, function(alias) {
    return os.ui.filterManager.hasEnabledFilters(alias);
  });
};


/**
 * Launch the filter manager for the layer
 * @export
 */
os.ui.filter.ui.FilterableDescriptorNodeUICtrl.prototype.filter = function() {
  var d = this.node_.getDescriptor();
  if (d) {
    d.launchFilterManager();
  }
};
