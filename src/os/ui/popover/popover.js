goog.provide('os.ui.popover.PopoverCtrl');
goog.provide('os.ui.popover.popoverDirective');

goog.require('goog.dom');
goog.require('goog.string');
goog.require('os.ui.Module');


/**
 * A popover directive to generate a popover for tooltips
 * @return {angular.Directive}
 */
os.ui.popover.popoverDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'title': '=',
      'popoverclass': '=',
      'content': '=',
      'pos': '=',
      'icon': '='
    },
    controller: os.ui.popover.PopoverCtrl,
    controllerAs: 'popoverctrl'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('popover', [os.ui.popover.popoverDirective]);



/**
 * Controller for the popover directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.popover.PopoverCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @private
   * @type {?angular.JQLite}
   */
  this.element_ = $element;

  this.scope_['popoverElement'] = null;

  this.element_.on('mouseenter', this.showPopover_.bind(this)).on('mouseleave', this.hidePopover_.bind(this));

  this.createPopoverElement();

  this.scope_.$watch('icon', this.createPopoverElement.bind(this));
  this.scope_.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Cleans up the property change listener
 * @private
 */
os.ui.popover.PopoverCtrl.prototype.onDestroy_ = function() {
  this.element_.off('mouseenter').off('mouseleave');
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Creates a popover element
 */
os.ui.popover.PopoverCtrl.prototype.createPopoverElement = function() {
  var iconEle = this.scope_['icon'] ? this.scope_['icon'] : 'fa fa-question-circle';
  this.scope_['popoverElement'] = $('<i class="' + iconEle + '"></i>');

  this.element_.html(this.scope_['popoverElement']);
};


/**
 * Shows the popover element
 * @param {goog.events.Event} event
 * @private
 */
os.ui.popover.PopoverCtrl.prototype.showPopover_ = function(event) {
  event.stopPropagation();
  if (goog.isDefAndNotNull(this.scope_['title']) && this.scope_['title'].length > 25) {
    this.scope_['title'] = goog.string.truncate(this.scope_['title'], 25);
  }

  var popclass = this.scope_['popoverclass'] ? this.scope_['popoverclass'] : '';
  if (goog.dom.contains(/** @type {Node} */ (event.target), this.scope_['popoverElement'][0])) {
    /** @type {!jQuery} */ (this.scope_['popoverElement']).popover({
      'html': true,
      'placement': this.scope_['pos'] ? this.scope_['pos'] : 'bottom',
      'trigger': 'manual',
      'title': this.scope_['title'],
      'content': this.scope_['content'],
      'template': '<div class="popover ' + popclass + '" role="tooltip">' +
          '<div class="arrow"></div>' +
          '<h3 class="popover-header"></h3>' +
          '<div class="popover-body"></div></div>',
      'boundary': 'window',
      'container': 'body'
    }).popover('show').on('hidden', function(e) {
      e.stopPropagation();
    });

    this.element_.find('popover').children().on('mouseleave', this.hidePopover_.bind(this));
  }
};


/**
 * Hides a popover element
 * @param {goog.events.Event} event
 * @private
 */
os.ui.popover.PopoverCtrl.prototype.hidePopover_ = function(event) {
  event.stopPropagation();
  this.element_.find('popover').children().off('mouseleave');
  this.scope_['popoverElement'].popover('hide');
  this.createPopoverElement();
};
