goog.provide('os.ui.query.ui.ComboNodeUICtrl');
goog.provide('os.ui.query.ui.comboNodeUIDirective');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
os.ui.query.ui.comboNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span class="pull-right slick-node-ui"">' +
        '<span class="group" ng-if="nodeUi.isGroup()" title="Whether to pass all filters (AND) or any filter (OR)">' +
        '<span class="glyph" style="text-decoration:underline;" ng-click="nodeUi.toggleGroup()">' +
        '{{nodeUi.group ? "All (AND)" : "Any (OR)"}}</span>' +
        '</span>' +
        '<span class="glyphs">' +
        '<span ng-if="nodeUi.isArea() && nodeUi.isEnabled()" ng-click="nodeUi.toggleQuery()" title="' +
        'Toggles between querying and excluding the area">' +
        '<i class="fa fa-fw glyph" ng-class="{\'fa-ban red-icon\': !nodeUi.include, \'fa-circle-o yellow-icon\'' +
        ': nodeUi.include}"></i>' +
        '</span>' +
        '<span ng-if="nodeUi.isFilter() && nodeUi.showCopy()" ng-click="nodeUi.copy()">' +
        '<i class="fa fa-copy fa-fw glyph" title="Copy"></i></span>' +
        '<span ng-if="nodeUi.isFilter() || nodeUi.isArea()" ng-click="nodeUi.edit()">' +
        '<i class="fa fa-pencil fa-fw glyph" title="Edit"></i></span>' +
        '<span ng-if="nodeUi.isFilter() || nodeUi.isArea()" ng-click="nodeUi.remove()">' +
        '<i class="fa fa-times fa-fw glyph glyph-remove" title="Remove"></i></span>' +
        '</span></span>',
    controller: os.ui.query.ui.ComboNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('combonodeui', [os.ui.query.ui.comboNodeUIDirective]);



/**
 * Controller for above directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.query.ui.ComboNodeUICtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {os.ui.query.ComboNode}
   * @private
   */
  this.node_ = $scope['item'];

  this['group'] = this.getFilterGroup();
  this['include'] = this.getInclude();

  var entry = this.getEntry();
  if (entry && !goog.isDef(entry['filterGroup'])) {
    entry['filterGroup'] = this['group'];
  }

  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up
 * @private
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;
};


/**
 * Gets the filter group value
 * @return {boolean}
 * @protected
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.getFilterGroup = function() {
  var children = this.node_.getChildren();

  if (children && children.length) {
    // check all of the children to see if we are AND or we are OR
    var returnValue = true;

    for (var x = 0; x < children.length; x++) {
      var entry = children[x].getEntry();
      if (entry && goog.isDef(entry['filterGroup']) && !entry['filterGroup']) {
        returnValue = false;
      }
    }

    return returnValue;
  }

  return true;
};


/**
 * Gets include value
 * @return {boolean}
 * @protected
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.getInclude = function() {
  var entry = this.node_.getEntry();

  if (entry && entry['areaId']) {
    var value = /** @type {boolean} */ (entry['includeArea']);
    return goog.isDef(value) ? value : true;
  }

  return true;
};


/**
 * Toggles the filter group value
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.toggleGroup = function() {
  this['group'] = !this['group'];
  this.getEntry()['filterGroup'] = this['group'];
  var children = this.node_.getChildren();

  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      var node = /** @type {os.ui.query.ComboNode} */ (children[i]);

      if (node) {
        var entry = node.getEntry();

        if (entry && entry['filterId']) {
          entry['filterGroup'] = this['group'];
        }
      }
    }
  }

  this.scope_.$emit('dirty');
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'toggleGroup',
    os.ui.query.ui.ComboNodeUICtrl.prototype.toggleGroup);


/**
 * @return {boolean} Whether or not to show the filter group UI
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.isGroup = function() {
  var children = this.node_.getChildren();

  if (children && children.length) {
    var entry = /** @type {os.ui.query.ComboNode} */ (children[0]).getEntry();
    return !!entry && !!entry['filterId'] && entry['filterId'] !== '*';
  }

  return false;
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'isGroup',
    os.ui.query.ui.ComboNodeUICtrl.prototype.isGroup);


/**
 * @return {Object<string, string|boolean>}
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.getEntry = function() {
  return this.node_.getEntry();
};


/**
 * Toggles area query/exclude
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.toggleQuery = function() {
  this['include'] = !this['include'];
  var entry = this.getEntry();

  if (entry) {
    entry['includeArea'] = /** @type {boolean} */ (this['include']);
  }
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.ADVANCED_AREA_INCLUDE_TOGGLE, 1);
  this.scope_.$emit('dirty');
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'toggleQuery',
    os.ui.query.ui.ComboNodeUICtrl.prototype.toggleQuery);


/**
 * @return {boolean} Whether or not to show the area UI
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.isArea = function() {
  var entry = this.getEntry();
  return !!entry && !!entry['areaId'] && entry['areaId'] !== '*';
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'isArea',
    os.ui.query.ui.ComboNodeUICtrl.prototype.isArea);


/**
 * @return {boolean} Whether or not the node is enabled
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.isEnabled = function() {
  return this.node_.getState() !== os.structs.TriState.OFF;
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'isEnabled',
    os.ui.query.ui.ComboNodeUICtrl.prototype.isEnabled);


/**
 * @return {boolean} Whether or not to show the filter entry UI
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.isFilter = function() {
  var entry = this.getEntry();
  return !!entry && !!entry['filterId'] && entry['filterId'] !== '*';
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'isFilter',
    os.ui.query.ui.ComboNodeUICtrl.prototype.isFilter);


/**
 * Edit a thing
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.edit = function() {
  this.scope_.$emit('edit', this.isFilter(), this.getEntry());
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.ADVANCED_AREA_EDIT, 1);
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'edit',
    os.ui.query.ui.ComboNodeUICtrl.prototype.edit);


/**
 * View a thing
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.view = function() {
  this.scope_.$emit('view', this.isFilter(), this.getEntry());
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'view',
    os.ui.query.ui.ComboNodeUICtrl.prototype.view);


/**
 * Whether to show the filter copy glyph.
 * @return {boolean}
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.showCopy = function() {
  // we must have both a descriptor for the layer and more than 1 layer loaded
  var layerId = /** @type {string} */ (this.getEntry()['layerId']);
  var d = os.dataManager.getDescriptor(layerId);
  var layers = os.ui.queryManager.getLayerSet();
  return goog.object.getCount(layers) > 0 && !!d;
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'showCopy',
    os.ui.query.ui.ComboNodeUICtrl.prototype.showCopy);


/**
 * Copy a thing
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.copy = function() {
  this.scope_.$emit('copy', this.getEntry());
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.ADVANCED_AREA_COPY, 1);
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'copy',
    os.ui.query.ui.ComboNodeUICtrl.prototype.copy);


/**
 * Remove a thing
 */
os.ui.query.ui.ComboNodeUICtrl.prototype.remove = function() {
  this.scope_.$emit('remove', this.isFilter(), this.getEntry());
  this.scope_.$emit('dirty');
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.ADVANCED_AREA_REMOVE, 1);
};
goog.exportProperty(os.ui.query.ui.ComboNodeUICtrl.prototype, 'remove',
    os.ui.query.ui.ComboNodeUICtrl.prototype.remove);
