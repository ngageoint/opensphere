goog.provide('os.ui.color.ColorPaletteCtrl');
goog.provide('os.ui.color.colorPaletteDirective');
goog.require('goog.dom');
goog.require('goog.ui.ColorPicker');
goog.require('os.color');
goog.require('os.ui.Module');


/**
 * The colorpalette directive
 *
 * @return {angular.Directive}
 */
os.ui.color.colorPaletteDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'colors': '=?',
      'value': '=',
      'name': '@',
      'columns': '@',
      'showReset': '@'
    },
    templateUrl: os.ROOT + 'views/color/colorpalette.html',
    controller: os.ui.color.ColorPaletteCtrl,
    controllerAs: 'palette'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('colorpalette', [os.ui.color.colorPaletteDirective]);


/**
 * Base Angular event types for the color palette.
 * @type {Object}
 */
os.ui.color.ColorPaletteEventType = {
  CHANGE: 'palette.change',
  RESET: 'palette.reset'
};



/**
 * Controller function for the colorpalette directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.color.ColorPaletteCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?string}
   * @private
   */
  this.name_ = $scope['name'] || null;

  /**
   * If a reset button should be displayed.
   * @type {boolean}
   */
  this['showReset'] = $scope['showReset'] === 'true';

  var colors = $scope['colors'] || goog.ui.ColorPicker.SIMPLE_GRID_COLORS;
  var columns = $scope['columns'] || 7;
  var rows = [];
  for (var i = 0, ii = colors.length; i < ii; i++) {
    if (i % columns == 0) {
      rows.push([]);
    }

    rows[rows.length - 1].push(colors[i]);
  }

  $scope['rows'] = rows;

  // If this has a top associated with it, make sure it stays within the bounds of the viewport
  $timeout(function() {
    var top = $element.offset().top;
    var height = $element.height();
    // If theres a top, make sure the element fits in the viewport. Otherwise adjust it
    if (top && top + height > goog.dom.getViewportSize().height) {
      $element.css('top', goog.dom.getViewportSize().height - height + 'px');
    }
  });
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 *
 * @private
 */
os.ui.color.ColorPaletteCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Notify parent scope that a color was chosen.
 *
 * @param {string} color The selected color
 * @export
 */
os.ui.color.ColorPaletteCtrl.prototype.pick = function(color) {
  this.scope_['value'] = color;

  var eventType = os.ui.color.ColorPaletteCtrl.getEventType(os.ui.color.ColorPaletteEventType.CHANGE, this.name_);
  this.scope_.$emit(eventType, color);
};


/**
 * Notify parent scope that the color should be reset.
 *
 * @param {string} color The selected color
 * @export
 */
os.ui.color.ColorPaletteCtrl.prototype.reset = function(color) {
  this.scope_['value'] = '';

  var eventType = os.ui.color.ColorPaletteCtrl.getEventType(os.ui.color.ColorPaletteEventType.RESET, this.name_);
  this.scope_.$emit(eventType);
};


/**
 * Get the tooltip to display for a color.
 *
 * @param {string} color The selected color
 * @return {string}
 * @export
 */
os.ui.color.ColorPaletteCtrl.prototype.getTitle = function(color) {
  return os.color.toHexString(color);
};


/**
 * Get the event type fired by a color palette directive.
 *
 * @param {string} baseType The base event type
 * @param {?string=} opt_name Optional name
 * @return {string} The event type
 */
os.ui.color.ColorPaletteCtrl.getEventType = function(baseType, opt_name) {
  return opt_name ? (opt_name + '.' + baseType) : baseType;
};
