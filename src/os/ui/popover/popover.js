goog.module('os.ui.popover.PopoverUI');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');
const googString = goog.require('goog.string');
const Module = goog.require('os.ui.Module');


goog.require('goog.dom');

/**
 * A popover directive to generate a popover for tooltips
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,

  scope: {
    'title': '=',
    'popoverclass': '=',
    'content': '=?',
    'pos': '=',
    'icon': '=?'
  },

  template: '<i ng-class="popoverctrl.icon"></i>',
  controller: Controller,
  controllerAs: 'popoverctrl'
});

/**
 * Add the directive to the ui module
 */
Module.directive('popover', [directive]);



/**
 * Controller for the popover directive
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
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;

    /**
     * The icon for the popover. Can be set on the scope
     * @type {string}
     */
    this['icon'] = 'fa fa-question-circle';

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.popover_ = null;

    this.update_();

    this.scope_.$watch('icon', this.update_.bind(this));
    this.scope_.$watch('content', this.update_.bind(this));
    this.scope_.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Cleans up the property change listener
   *
   * @private
   */
  onDestroy_() {
    if (this.popover_) {
      this.popover_.off('mouseenter').off('mouseleave');
      this.popover_.popover('dispose');
      this.popover_ = null;
    }

    this.scope_ = null;
    this.element_ = null;
    this.timeout_ = null;
  }

  /**
   * Update the popover
   *
   * @private
   */
  update_() {
    if (this.scope_['content']) {
      if (this.popover_) {
        this.popover_.popover('dispose');
        this.popover_ = null;
      }

      // Default the icon to ? if not set
      this['icon'] = this.scope_['icon'] ? this.scope_['icon'] : 'fa fa-question-circle';

      // Truncate the title
      if (this.scope_['title'] != null && this.scope_['title'].length > 25) {
        this.scope_['title'] = googString.truncate(this.scope_['title'], 25);
      }

      // Create the popover
      this.popover_ = this.element_.popover({
        'html': true,
        'sanitize': false,
        'placement': this.scope_['pos'] ? this.scope_['pos'] : 'bottom',
        'trigger': 'manual',
        'title': this.scope_['title'],
        'content': this.scope_['content'],
        'template': '<div class="popover ' + (this.scope_['popoverclass'] ? this.scope_['popoverclass'] : '') +
            '" role="tooltip">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-header"></h3>' +
            '<div class="popover-body"></div></div>',
        'boundary': 'window',
        'container': 'body'
      });

      // When hovering on the popover
      this.popover_.on('mouseenter', function() {
        // Show the popover, watch for leaving
        this.element_.popover('show');

        // If we leave the popover, hide
        $('.popover').on('mouseleave', function() {
          if (this.element_) {
            this.element_.popover('hide');
          }
        }.bind(this));
      }.bind(this));

      // When exiting the popover trigger
      this.popover_.on('mouseleave', function() {
        // Check to see if we are hovering the popover contents
        this.timeout_(function() {
          // If we arent hovering contents, hide
          if (!$('.popover:hover').length) {
            this.element_.popover('hide');
          }
        }.bind(this));
      }.bind(this));
    }

    ui.apply(this.scope_);
  }
}

exports = {
  Controller,
  directive
};
