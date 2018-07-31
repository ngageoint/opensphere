goog.provide('os.ui.draw.DrawControlsCtrl');
goog.provide('os.ui.draw.drawControlsDirective');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.MapEvent');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.draw');
goog.require('os.ui.ol.draw.DrawControlsCtrl');
goog.require('os.ui.ol.draw.drawMenuDirective');


/**
 * The draw-controls directive
 * @return {angular.Directive}
 */
os.ui.draw.drawControlsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/draw/drawcontrols.html',
    controller: os.ui.draw.DrawControlsCtrl,
    controllerAs: 'drawControls'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('osDrawControls', [os.ui.draw.drawControlsDirective]);



/**
 * Controller for the draw-controls directive.
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {os.ui.ol.draw.DrawControlsCtrl}
 * @ngInject
 */
os.ui.draw.DrawControlsCtrl = function($scope, $element, $compile) {
  this['supportsLines'] = true;
  os.ui.draw.DrawControlsCtrl.base(this, 'constructor', $scope, $element, $compile);
  this.log = os.ui.draw.DrawControlsCtrl.LOGGER_;
};
goog.inherits(os.ui.draw.DrawControlsCtrl, os.ui.ol.draw.DrawControlsCtrl);


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
os.ui.draw.DrawControlsCtrl.LOGGER_ = goog.log.getLogger('os.ui.draw.DrawControlsCtrl');


/**
 * @inheritDoc
 */
os.ui.draw.DrawControlsCtrl.prototype.disposeInternal = function() {
  os.ui.draw.DrawControlsCtrl.base(this, 'disposeInternal');
  goog.events.unlisten(os.MapContainer.getInstance(), os.MapEvent.MAP_READY, this.onMapReady, false, this);
};


/**
 * @inheritDoc
 */
os.ui.draw.DrawControlsCtrl.prototype.getMap = function() {
  return os.MapContainer.getInstance().getMap();
};


/**
 * @inheritDoc
 */
os.ui.draw.DrawControlsCtrl.prototype.getMenu = function() {
  return os.ui.draw.MENU;
};


/**
 * @inheritDoc
 */
os.ui.draw.DrawControlsCtrl.prototype.setFeature = function(f) {
  if (this.feature) {
    os.MapContainer.getInstance().removeFeature(this.feature.getId(), true);
  }

  this.feature = f;

  if (this.feature) {
    os.MapContainer.getInstance().addFeature(this.feature);
  }
};


/**
 * @inheritDoc
 */
os.ui.draw.DrawControlsCtrl.prototype.listenForMapReady = function() {
  goog.events.listenOnce(os.MapContainer.getInstance(), os.MapEvent.MAP_READY, this.onMapReady, false, this);
};
