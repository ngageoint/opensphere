goog.provide('os.ui.node.DefaultLayerNodeUICtrl');
goog.provide('os.ui.node.defaultLayerNodeUIDirective');

goog.require('goog.events.EventType');
goog.require('os.events.LayerEvent');
goog.require('os.events.LayerEventType');
goog.require('os.filter.IFilterable');
goog.require('os.implements');
goog.require('os.layer.ILayer');
goog.require('os.query.FilterManager');
goog.require('os.ui.Module');
goog.require('os.ui.slick.AbstractNodeUICtrl');


/**
 * @type {string}
 */
os.ui.node.DefaultLayerNodeUITemplate = '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
    '<span ng-if="nodeUi.canFavorite()">' +
    '<favorite ng-show="nodeUi.show()" type="descriptor" key="{{nodeUi.descId}}" ' +
      'value="{{nodeUi.layerLabel}}"></favorite></span>' +

    '<span ng-if="nodeUi.filtersEnabled" ng-click="nodeUi.filter()">' +
      '<i class="fa fa-filter fa-fw c-glyph" title="Manage filters"' +
      'ng-class="{\'text-success\': nodeUi.filtered, \'c-glyph__off\': !nodeUi.filtered}"></i></span>' +

    '<span ng-if="nodeUi.isRemovable()" ng-click="nodeUi.remove()">' +
      '<i class="fa fa-times fa-fw c-glyph" title="Remove the layer"></i></span>' +

    '</span>';

/**
 * The selected/highlighted node UI directive
 * @return {angular.Directive}
 */
os.ui.node.defaultLayerNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: os.ui.node.DefaultLayerNodeUITemplate,
    controller: os.ui.node.DefaultLayerNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('defaultlayernodeui', [os.ui.node.defaultLayerNodeUIDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractNodeUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.node.DefaultLayerNodeUICtrl = function($scope, $element) {
  os.ui.node.DefaultLayerNodeUICtrl.base(this, 'constructor', $scope, $element);

  var qm = os.ui.queryManager;
  qm.listen(goog.events.EventType.PROPERTYCHANGE, this.updateFilters_, false, this);

  this.updateFilters_();
  this.updateFavorites_();
};
goog.inherits(os.ui.node.DefaultLayerNodeUICtrl, os.ui.slick.AbstractNodeUICtrl);


/**
 * @inheritDoc
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.destroy = function() {
  os.ui.node.DefaultLayerNodeUICtrl.base(this, 'destroy');

  var qm = os.ui.queryManager;
  qm.unlisten(goog.events.EventType.PROPERTYCHANGE, this.updateFilters_, false, this);
};


/**
 * Get the layer for this node.
 * @return {os.layer.ILayer}
 * @protected
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.getLayer = function() {
  if (this.scope && this.scope['item'] instanceof os.data.LayerNode) {
    return /** @type {os.data.LayerNode} */ (this.scope['item']).getLayer();
  }

  return null;
};


/**
 * Get the source for this node.
 * @return {ol.source.Source}
 * @protected
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.getSource = function() {
  var layer = this.getLayer();
  if (layer instanceof ol.layer.Layer) {
    return layer.getSource();
  }

  return null;
};


/**
 * If the layer is removable.
 * @return {boolean}
 * @export
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.isRemovable = function() {
  var node = /** @type {os.data.LayerNode} */ (this.scope['item']);
  if (node && node instanceof os.data.LayerNode) {
    var layer = node.getLayer();
    if (node && layer && os.implements(layer, os.layer.ILayer.ID)) {
      return /** @type {!os.layer.ILayer} */ (layer).isRemovable();
    }
  }

  return false;
};


/**
 * Remove the layer
 * @export
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.remove = function() {
  // the node should be on the scope as 'item'
  var node = /** @type {os.data.LayerNode} */ (this.scope['item']);
  if (node.getLayer() instanceof os.layer.LayerGroup) {
    // if the node being removed is a group, pick the first child and remove that instead. this should cause
    // all other children in the group to be removed because they're synchronized.
    var children = node.getChildren().slice();
    if (children && children.length > 0) {
      var i = children.length;
      while (i--) {
        this.removeNode_(children[i]);
      }
    }
  } else {
    this.removeNode_(node);
  }
};


/**
 * Fires an event to remove a layer node.
 * @param {!os.structs.ITreeNode} node The node to remove
 * @private
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.removeNode_ = function(node) {
  var removeEvent = new os.events.LayerEvent(os.events.LayerEventType.REMOVE, node.getId());
  os.dispatcher.dispatchEvent(removeEvent);
};


/**
 * If the layer is favoritable.
 * @return {boolean}
 * @export
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.canFavorite = function() {
  var id = this.getLayerId();
  if (id) {
    var descriptor = os.dataManager.getDescriptor(id);
    return !!(descriptor && (descriptor instanceof os.data.LayerSyncDescriptor));
  }

  return false;
};


/**
 * Launch the filter manager for the layer
 * @export
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.filter = function() {
  var id = this.getLayerId();
  if (id) {
    var descriptor = os.dataManager.getDescriptor(id);
    var layer = this.getLayer();
    var list = [descriptor, layer];

    for (var i = 0, n = list.length; i < n; i++) {
      var thing = list[i];
      if (os.implements(thing, os.filter.IFilterable.ID) && thing.isFilterable()) {
        /** @type {os.filter.IFilterable} */ (thing).launchFilterManager();
        break;
      }
    }
  }
};


/**
 * Update filters
 * @param {os.events.PropertyChangeEvent=} opt_event
 * @private
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.updateFilters_ = function(opt_event) {
  var node = /** @type {os.data.LayerNode} */ (this.scope['item']);

  var fqm = os.query.FilterManager.getInstance();
  this['filtered'] = fqm.hasEnabledFilters(node.getId());

  if (this['filtered']) {
    this.cellEl.addClass('font-italic');
  } else {
    this.cellEl.removeClass('font-italic');
  }

  var layer = this.getLayer();
  if (os.implements(layer, os.filter.IFilterable.ID)) {
    this['filtersEnabled'] = layer.isFilterable();
  } else {
    this['filtersEnabled'] = false;
  }
};


/**
 * Update favorite information on the node scope
 * @protected
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.updateFavorites_ = function() {
  var node = /** @type {os.data.LayerNode} */ (this.scope['item']);
  this['layerLabel'] = node.getLabel();
  var desc = os.dataManager.getDescriptor(node.getId());
  if (desc) {
    this['descId'] = desc.getId();
  }
};


/**
 * Get the layer id
 * @return {string}
 * @protected
 */
os.ui.node.DefaultLayerNodeUICtrl.prototype.getLayerId = function() {
  var node = /** @type {os.data.LayerNode} */ (this.scope['item']);
  return node.getId();
};
