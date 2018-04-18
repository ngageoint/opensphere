goog.provide('plugin.ogc.ui.ChooseTimeColumnCtrl');
goog.provide('plugin.ogc.ui.chooseTimeColumnDirective');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('goog.events');
goog.require('os.action.EventType');
goog.require('os.data.DataManager');
goog.require('os.defines');
goog.require('os.layer');
goog.require('os.ui.Module');
goog.require('plugin.ogc.OGCLayerDescriptor');


/**
 * A spinner directive for a node that loads items
 * @return {angular.Directive}
 */
plugin.ogc.ui.chooseTimeColumnDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'id': '=',
      'deferred': '='
    },
    templateUrl: os.ROOT + 'views/plugin/ogc/ui/choosetimecolumn.html',
    controller: plugin.ogc.ui.ChooseTimeColumnCtrl,
    controllerAs: 'chooseTime'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('chooseTimeColumn', [plugin.ogc.ui.chooseTimeColumnDirective]);



/**
 * Allow the user to choose time columns and save it to the descriptor
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
plugin.ogc.ui.ChooseTimeColumnCtrl = function($scope, $element) {
  plugin.ogc.ui.ChooseTimeColumnCtrl.base(this, 'constructor');

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
   * @type {plugin.ogc.OGCLayerDescriptor}
   * @private
   */
  this.descriptor_ = /** @type {plugin.ogc.OGCLayerDescriptor} */ (
      os.dataManager.getDescriptor(this.scope_['id']));

  /**
   * @type {os.ogc.wfs.FeatureType}
   * @private
   */
  this.featureType_ = null;

  if (this.descriptor_) {
    this.featureType_ = this.descriptor_.getFeatureType();

    this.scope_['title'] = this.descriptor_.getTitle();
    this['start'] = this.featureType_.getStartDateColumnName();
    this['end'] = this.featureType_.getEndDateColumnName();
    this['timeColumns'] = this.descriptor_.getFeatureType().getTimeColumns();

    $scope.$emit(os.ui.WindowEventType.READY);
  } else {
    os.ui.window.close(this.element_);
  }
};
goog.inherits(plugin.ogc.ui.ChooseTimeColumnCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
plugin.ogc.ui.ChooseTimeColumnCtrl.prototype.disposeInternal = function() {
  plugin.ogc.ui.ChooseTimeColumnCtrl.base(this, 'disposeInternal');
  this.scope_ = null;
};


/**
 * Save the time columns to the descriptor
 */
plugin.ogc.ui.ChooseTimeColumnCtrl.prototype.save = function() {
  this.featureType_.setStartDateColumnName(this['start']);
  this.featureType_.setEndDateColumnName(this['end']);

  if (this.scope_['deferred']) {
    this.scope_['deferred'].callback();
  }
  this.close_();
};
goog.exportProperty(
    plugin.ogc.ui.ChooseTimeColumnCtrl.prototype,
    'save',
    plugin.ogc.ui.ChooseTimeColumnCtrl.prototype.save);


/**
 * Close the window
 * @private
 */
plugin.ogc.ui.ChooseTimeColumnCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element_);
  this.dispose();
};


/**
 * Launch the choose time column directive
 * @param {string} layerId
 * @param {goog.async.Deferred=} opt_deferred - call the deferred on save/cancel if provided
 */
plugin.ogc.ui.ChooseTimeColumnCtrl.launch = function(layerId, opt_deferred) {
  var id = 'chooseTimeColumn';

  if (os.ui.window.exists(id)) {
    os.ui.window.bringToFront(id);
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

    os.ui.window.create(winOptions, '<choose-time-column id="id" deferred="deferred"></choose-time-column>',
        undefined, undefined, undefined, scopeOptions);
  }
};
