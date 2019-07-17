goog.provide('os.ui.ol.draw.DrawMenuCtrl');
goog.provide('os.ui.ol.draw.drawMenuDirective');

goog.require('os.query');
goog.require('os.ui.Module');
goog.require('os.ui.query.area.chooseAreaDirective');
goog.require('os.ui.query.cmd.AreaAdd');


/**
 * The draw-menu directive
 *
 * @return {angular.Directive}
 */
os.ui.ol.draw.drawMenuDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/ol/draw/drawmenu.html',
    controller: os.ui.ol.draw.DrawMenuCtrl,
    controllerAs: 'drawMenu'
  };
};


/**
 * Add the directive to the corui module.
 */
os.ui.Module.directive('drawMenu', [os.ui.ol.draw.drawMenuDirective]);



/**
 * Controller for the draw-menu directive.
 *
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @ngInject
 */
os.ui.ol.draw.DrawMenuCtrl = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?os.ui.ol.draw.DrawControlsCtrl}
   * @private
   */
  this['drawControls'] = $scope.$parent['drawControls'];

  /**
   * @type {boolean}
   */
  this['showChooseArea'] = os.ui.areaManager.getAll().length > 0;

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references/listeners.
 *
 * @private
 */
os.ui.ol.draw.DrawMenuCtrl.prototype.destroy_ = function() {
  this.element_.remove();
  this.element_ = null;
  this['drawControls'] = null;
};


/**
 * @return {boolean} Whether or not picking by country is enabled
 * @export
 */
os.ui.ol.draw.DrawMenuCtrl.prototype.isCountryEnabled = function() {
  return false;
};


/**
 * Launched adding areas by coordinates
 *
 * @export
 */
os.ui.ol.draw.DrawMenuCtrl.prototype.launchAreaByCoordinates = function() {
  os.query.launchCoordinates();
  /** @type {os.ui.ol.draw.DrawControlsCtrl} */ (this['drawControls']).toggleMenu(false);
};


/**
 * Launched adding areas by coordinates
 *
 * @export
 */
os.ui.ol.draw.DrawMenuCtrl.prototype.launchChooseArea = function() {
  os.query.launchChooseArea();
  /** @type {os.ui.ol.draw.DrawControlsCtrl} */ (this['drawControls']).toggleMenu(false);
};


/**
 * Adds an area querying the whole world.
 *
 * @export
 */
os.ui.ol.draw.DrawMenuCtrl.prototype.queryWorld = function() {
  os.query.queryWorld();
  /** @type {os.ui.ol.draw.DrawControlsCtrl} */ (this['drawControls']).toggleMenu(false);
};
