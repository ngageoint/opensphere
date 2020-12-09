goog.module('os.ui.color.ColorPaletteUI');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');
const dom = goog.require('goog.dom');
const ColorPicker = goog.require('goog.ui.ColorPicker');
const osColor = goog.require('os.color');
const Module = goog.require('os.ui.Module');


/**
 * The colorpalette directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
  controller: Controller,
  controllerAs: 'palette'
});


/**
 * Add the directive to the module.
 */
Module.directive('colorpalette', [directive]);


/**
 * Base Angular event types for the color palette.
 * @type {Object}
 */
ui.color.ColorPaletteEventType = {
  CHANGE: 'palette.change',
  RESET: 'palette.reset'
};



/**
 * Controller function for the colorpalette directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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

    var colors = $scope['colors'] || ColorPicker.SIMPLE_GRID_COLORS;
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
      if (top && top + height > dom.getViewportSize().height) {
        $element.css('top', dom.getViewportSize().height - height + 'px');
      }
    });
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Notify parent scope that a color was chosen.
   *
   * @param {string} color The selected color
   * @export
   */
  pick(color) {
    this.scope_['value'] = color;

    var eventType = Controller.getEventType(ui.color.ColorPaletteEventType.CHANGE, this.name_);
    this.scope_.$emit(eventType, color);
  }

  /**
   * Notify parent scope that the color should be reset.
   *
   * @param {string} color The selected color
   * @export
   */
  reset(color) {
    this.scope_['value'] = '';

    var eventType = Controller.getEventType(ui.color.ColorPaletteEventType.RESET, this.name_);
    this.scope_.$emit(eventType);
  }

  /**
   * Get the tooltip to display for a color.
   *
   * @param {string} color The selected color
   * @return {string}
   * @export
   */
  getTitle(color) {
    return osColor.toHexString(color);
  }

  /**
   * Get the event type fired by a color palette directive.
   *
   * @param {string} baseType The base event type
   * @param {?string=} opt_name Optional name
   * @return {string} The event type
   */
  static getEventType(baseType, opt_name) {
    return opt_name ? (opt_name + '.' + baseType) : baseType;
  }
}

exports = {
  Controller,
  directive
};
