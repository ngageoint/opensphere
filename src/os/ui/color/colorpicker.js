goog.module('os.ui.color.ColorPickerUI');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');
const osColor = goog.require('os.color');
const Module = goog.require('os.ui.Module');
const ColorPaletteCtrl = goog.require('os.ui.color.ColorPaletteCtrl');
goog.require('goog.events.EventType');


goog.require('os.ui.color.colorPaletteDirective');


/**
 * @type {string}
 */
ui.color.COLOR_PICKER_SELECTOR = 'js-color-picker';


/**
 * @type {string}
 */
ui.color.COLOR_PICKER_TEMPLATE = '<button type="button" class="btn btn-sm bg-transparent border rounded ' +
    'flex-shrink-0 c-colorpicker ' + ui.color.COLOR_PICKER_SELECTOR +
    '" ng-click="colorPicker.togglePopup()" ng-disabled=disabled>' +
      '<i class="fa" ng-class="color && \'fa-square\' || \'fa-ban\'" ng-style="{\'color\': color}"></i>' +
    '</button>';


/**
 * A color picker directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,

  scope: {
    'color': '=',
    'data': '=',
    'disabled': '=',
    'name': '@',
    'showReset': '@'
  },

  template: ui.color.COLOR_PICKER_TEMPLATE,
  controller: Controller,
  controllerAs: 'colorPicker'
});


/**
 * Add the directive to the module
 */
Module.directive('colorpicker', [directive]);



/**
 * Controller for the color picker directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * @type {?angular.$compile}
     * @private
     */
    this.compile_ = $compile;

    /**
     * @type {?angular.Scope}
     * @private
     */
    this.popupScope_ = null;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.popupEl_ = null;

    /**
     * @type {boolean}
     */
    this['showPopup'] = false;

    // the control's color value should be undefined when the picker is set to the default color
    var color = /** @type {Array<number>|string} */ (this.scope['color']) || undefined;
    if (color) {
      // ensure the color is a hex string
      color = osColor.toHexString(color);
    }

    this.scope['color'] = color;

    /**
     * @type {string}
     * @private
     */
    this.name_ = this.scope['name'];

    /**
     * @type {string}
     * @private
     */
    this.containerSelector_ = '.color-picker-container';

    $scope.$on(ColorPaletteCtrl.getEventType(ui.color.ColorPaletteEventType.CHANGE, this.name_),
        this.onChange_.bind(this));
    $scope.$on(ColorPaletteCtrl.getEventType(ui.color.ColorPaletteEventType.RESET, this.name_),
        this.onReset_.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up
   *
   * @private
   */
  onDestroy_() {
    this.destroyControlMenu_();

    this.scope = null;
    this.compile_ = null;
    this.element = null;
  }

  /**
   * Clean up the draw control menu.
   *
   * @private
   */
  destroyControlMenu_() {
    if (this.popupEl_) {
      this.popupEl_.remove();
      this.popupEl_ = null;
    }

    if (this.popupScope_) {
      goog.events.unlisten(document, 'mousedown', this.onMouseDown_, false, this);
      goog.events.unlisten(document, 'mousewheel', this.onMouseDown_, false, this);
      this.popupScope_.$destroy();
      this.popupScope_ = null;
    }
  }

  /**
   * Handles color pick events.
   *
   * @param {angular.Scope.Event} event
   * @param {string} color The new color
   * @private
   */
  onChange_(event, color) {
    event.stopPropagation();
    this.scope['color'] = color;

    if (this.name_) {
      this.scope.$emit(this.name_ + '.change', this.scope['color']);
    } else {
      this.scope.$emit('color.colorChanged', {
        'color': this.scope['color'],
        'data': this.scope['data']
      });
    }

    this.togglePopup(false);
  }

  /**
   * Handles color pick events.
   *
   * @param {angular.Scope.Event} event
   * @private
   */
  onReset_(event) {
    event.stopPropagation();
    this.scope.$emit(this.name_ + '.reset');

    this.togglePopup(false);
  }

  /**
   * @param {goog.events.BrowserEvent} e
   * @private
   */
  onMouseDown_(e) {
    var thisElement = /** @type {Element} */ (this.element[0]);
    if (e.target != thisElement && !goog.dom.contains(thisElement, e.target)) {
      var paletteEl = this.popupEl_ && this.popupEl_[0];
      if (paletteEl && e.target != paletteEl && !goog.dom.contains(paletteEl, e.target)) {
        this.togglePopup(false);
        ui.apply(this.scope);
      }
    }
  }

  /**
   * Toggle the color picker on/off.
   *
   * @param {boolean=} opt_value
   * @export
   */
  togglePopup(opt_value) {
    this['showPopup'] = opt_value !== undefined ? opt_value : !this['showPopup'];

    if (this['showPopup']) {
      // create a new scope
      this.popupScope_ = this.scope.$new();
      goog.asserts.assert(this.popupScope_);
      this.popupScope_['value'] = this.scope['color'];

      // compile and add it to the page body
      this.popupEl_ = /** @type {angular.JQLite} */ (this.compile_(this.getTemplate())(this.popupScope_));

      var container = $(this.containerSelector_);
      container = container.length ? container[0] : document.body;
      goog.dom.append(/** @type {!HTMLElement} */ (container), this.popupEl_[0]);

      // listen for mouse events to remove it
      goog.events.listen(document, 'mousedown', this.onMouseDown_, false, this);
      goog.events.listen(document, 'mousewheel', this.onMouseDown_, false, this);
    } else {
      this.destroyControlMenu_();
    }
  }

  /**
   * Get the template for the color picker popup.
   *
   * @return {string}
   * @protected
   */
  getTemplate() {
    var menuOffset = this.element.offset();
    menuOffset['top'] += this.element.outerHeight();
    var showReset = this.scope['showReset'] !== undefined ? this.scope['showReset'] : 'false';

    return '<colorpalette class="position-fixed" value="value" ' + (this.name_ ? 'name="' + this.name_ + '" ' : '') +
        'show-reset="' + showReset + '" ' +
        'style="top:' + menuOffset['top'] + 'px;left:' + menuOffset['left'] + 'px;"></colorpalette>';
  }
}

exports = {
  Controller,
  directive
};
