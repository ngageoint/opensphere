goog.provide('os.ui.draw.DrawControlsCtrl');
goog.provide('os.ui.draw.drawControlsDirective');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.MapEvent');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.draw');
goog.require('os.ui.draw.BaseDrawControlsCtrl');


/**
 * The draw-controls directive
 *
 * @return {angular.Directive}
 */
os.ui.draw.drawControlsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'menu': '=?',
      'olMap': '=?'
    },
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
 *
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.draw.BaseDrawControlsCtrl}
 * @ngInject
 */
os.ui.draw.DrawControlsCtrl = function($scope, $element) {
  this['supportsLines'] = true;
  os.ui.draw.DrawControlsCtrl.base(this, 'constructor', $scope, $element);
  this.log = os.ui.draw.DrawControlsCtrl.LOGGER_;
};
goog.inherits(os.ui.draw.DrawControlsCtrl, os.ui.draw.BaseDrawControlsCtrl);


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
  var map = os.ui.draw.DrawControlsCtrl.base(this, 'getMap');
  return map || os.MapContainer.getInstance().getMap();
};


/**
 * @inheritDoc
 */
os.ui.draw.DrawControlsCtrl.prototype.getMenu = function() {
  var menu = os.ui.draw.DrawControlsCtrl.base(this, 'getMenu');
  return menu || os.ui.draw.MENU;
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
