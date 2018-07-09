goog.provide('os.ui.color.ColorPickerCtrl');
goog.provide('os.ui.color.colorPickerDirective');
goog.require('goog.color');
goog.require('goog.color.alpha');
goog.require('goog.events.EventType');
goog.require('os.ui.Module');
goog.require('os.ui.color.ColorPaletteCtrl');
goog.require('os.ui.color.colorPaletteDirective');


/**
 * @type {string}
 */
os.ui.color.COLOR_PICKER_SELECTOR = 'js-color-picker';


/**
 * @type {string}
 */
os.ui.color.COLOR_PICKER_TEMPLATE = '<button class="btn bg-transparent border ' + os.ui.color.COLOR_PICKER_SELECTOR +
    '" ng-click="colorPicker.togglePopup()" ng-disabled=disabled>' +
    '<i class="fa fa-square" ng-style="{\'color\': color}"></i></button>';


/**
 * A color picker directive
 * @return {angular.Directive}
 */
os.ui.color.colorPickerDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'color': '=',
      'data': '=',
      'disabled': '=',
      'name': '@',
      'showReset': '@'
    },
    template: os.ui.color.COLOR_PICKER_TEMPLATE,
    controller: os.ui.color.ColorPickerCtrl,
    controllerAs: 'colorPicker'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('colorpicker', [os.ui.color.colorPickerDirective]);



/**
 * Controller for the color picker directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @constructor
 * @ngInject
 */
os.ui.color.ColorPickerCtrl = function($scope, $element, $compile) {
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

  var color = /** @type {string} */ (this.scope['color']);

  // default color is white if one was not set
  if (!color) {
    color = '#ffffff';
  }

  // if color was set to something other than a hex string (rgb() or rgba()), then fix it
  if (color.indexOf('#') !== 0) {
    color = (color.indexOf('a(') > -1 ? goog.color.alpha.parse(color) : goog.color.parse(color)).hex.substring(0, 7);
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

  $scope.$on(os.ui.color.ColorPaletteCtrl.getEventType(os.ui.color.ColorPaletteEventType.CHANGE, this.name_),
      this.onChange_.bind(this));
  $scope.$on(os.ui.color.ColorPaletteCtrl.getEventType(os.ui.color.ColorPaletteEventType.RESET, this.name_),
      this.onReset_.bind(this));
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Clean up
 * @private
 */
os.ui.color.ColorPickerCtrl.prototype.onDestroy_ = function() {
  this.destroyControlMenu_();

  this.scope = null;
  this.compile_ = null;
  this.element = null;
};


/**
 * Clean up the draw control menu.
 * @private
 */
os.ui.color.ColorPickerCtrl.prototype.destroyControlMenu_ = function() {
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
};


/**
 * Handles color pick events.
 * @param {angular.Scope.Event} event
 * @param {string} color The new color
 * @private
 */
os.ui.color.ColorPickerCtrl.prototype.onChange_ = function(event, color) {
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
};


/**
 * Handles color pick events.
 * @param {angular.Scope.Event} event
 * @private
 */
os.ui.color.ColorPickerCtrl.prototype.onReset_ = function(event) {
  event.stopPropagation();
  this.scope.$emit(this.name_ + '.reset');

  this.togglePopup(false);
};


/**
 * @param {goog.events.BrowserEvent} e
 * @private
 */
os.ui.color.ColorPickerCtrl.prototype.onMouseDown_ = function(e) {
  var thisElement = /** @type {Element} */ (this.element[0]);
  if (e.target != thisElement && !goog.dom.contains(thisElement, e.target)) {
    var paletteEl = this.popupEl_ && this.popupEl_[0];
    if (paletteEl && e.target != paletteEl && !goog.dom.contains(paletteEl, e.target)) {
      this.togglePopup(false);
      os.ui.apply(this.scope);
    }
  }
};


/**
 * Toggle the color picker on/off.
 * @param {boolean=} opt_value
 */
os.ui.color.ColorPickerCtrl.prototype.togglePopup = function(opt_value) {
  this['showPopup'] = goog.isDef(opt_value) ? opt_value : !this['showPopup'];

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
};
goog.exportProperty(
    os.ui.color.ColorPickerCtrl.prototype,
    'togglePopup',
    os.ui.color.ColorPickerCtrl.prototype.togglePopup);


/**
 * Get the template for the color picker popup.
 * @return {string}
 * @protected
 */
os.ui.color.ColorPickerCtrl.prototype.getTemplate = function() {
  var menuOffset = this.element.offset();
  menuOffset['top'] += this.element.outerHeight();
  var showReset = goog.isDef(this.scope['showReset']) ? this.scope['showReset'] : 'false';

  return '<colorpalette class="position-fixed" value="value" ' + (this.name_ ? 'name="' + this.name_ + '" ' : '') +
      'show-reset="' + showReset + '" ' +
      'style="top:' + menuOffset['top'] + 'px;left:' + menuOffset['left'] + 'px;"></colorpalette>';
};
