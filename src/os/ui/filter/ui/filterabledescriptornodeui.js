goog.module('os.ui.filter.ui.FilterableDescriptorNodeUI');

const GoogEventType = goog.require('goog.events.EventType');
const {getFilterManager, getQueryManager} = goog.require('os.query.instance');
const Module = goog.require('os.ui.Module');
const AbstractNodeUICtrl = goog.require('os.ui.slick.AbstractNodeUICtrl');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');
const IFilterable = goog.requireType('os.filter.IFilterable');
const DescriptorNode = goog.requireType('os.ui.data.DescriptorNode');


/**
 * The selected/highlighted node UI directive for filters
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  scope: true,
  template,
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'filterabledescriptornodeui';

/**
 * @type {string}
 */
const template =
    '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
    '<span ng-if="nodeUi.filtersEnabled" ng-click="nodeUi.filter()">' +
    '<i class="fa fa-filter fa-fw c-glyph" title="Manage filters"' +
    'ng-class="{\'text-success\': nodeUi.filtered, \'c-glyph__off\': !nodeUi.filtered}"></i></span></span>';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
 * @unrestricted
 */
class Controller extends AbstractNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * @type {DescriptorNode}
     * @private
     */
    this.node_ = $scope['item'];

    var qm = getQueryManager();
    qm.listen(GoogEventType.PROPERTYCHANGE, this.updateFilters_, false, this);

    this.updateFilters_();
  }

  /**
   * @inheritDoc
   */
  destroy() {
    super.destroy();

    var qm = getQueryManager();
    qm.unlisten(GoogEventType.PROPERTYCHANGE, this.updateFilters_, false, this);
  }

  /**
   * Update filters
   *
   * @param {PropertyChangeEvent=} opt_event
   * @private
   */
  updateFilters_(opt_event) {
    var d = /** @type {IFilterable} */ (this.node_.getDescriptor());

    try {
      this['filtersEnabled'] = d.isFilterable();
    } catch (e) {
      // wasn't filterable, return
      this['filtersEnabled'] = false;
      return;
    }

    d = /** @type {IDataDescriptor} */ (d);
    var aliases = d.getAliases();
    this['filtered'] = aliases.some(function(alias) {
      return getFilterManager().hasEnabledFilters(alias);
    });
  }

  /**
   * Launch the filter manager for the layer
   *
   * @export
   */
  filter() {
    var d = /** @type {IFilterable} */ (this.node_.getDescriptor());
    if (d) {
      d.launchFilterManager();
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
