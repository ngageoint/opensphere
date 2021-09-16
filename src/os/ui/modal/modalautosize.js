goog.module('os.ui.modal.ModalAutoSizeUI');

const Throttle = goog.require('goog.async.Throttle');
const ViewportSizeMonitor = goog.require('goog.dom.ViewportSizeMonitor');
const GoogEventType = goog.require('goog.events.EventType');
const Module = goog.require('os.ui.Module');


/**
 * The modal-auto-size directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'C',
  link: modalAutoSizeLink
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'modal-auto-size';

/**
 * Register modal-auto-size directive.
 */
Module.directive('modalAutoSize', [directive]);

/**
 * Link function for modal-auto-size directive
 *
 * @param {!angular.Scope} $scope angular scope
 * @param {!angular.JQLite} $element to which this directive is applied
 */
const modalAutoSizeLink = function($scope, $element) {
  new Controller($scope, $element);
};

/**
 * Object containing the link function used by the directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope angular scope
   * @param {!angular.JQLite} $element to which this directive is applied
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    var modalEl = this.element_;
    if (!modalEl.hasClass('modal')) {
      return;
    }

    var throttle = new Throttle(this.updateSizeConstraints_, 500, this);
    modalEl.bind('DOMSubtreeModified', throttle.fire.bind(throttle));

    $scope.$on('$destroy', this.onDestroy_.bind(this));

    /**
     * @type {?ViewportSizeMonitor}
     * @private
     */
    this.vsm_ = new ViewportSizeMonitor();
    this.vsm_.listen(GoogEventType.RESIZE, this.updateSizeConstraints_, false, this);
  }

  /**
   * Autoresizes the modal element when the window is resized.
   *
   * @private
   */
  updateSizeConstraints_() {
    if (this.element_) {
      var headerEl = this.element_.find('.modal-header');
      var bodyEl = this.element_.find('.modal-body');
      var footerEl = this.element_.find('.modal-footer');

      var windowHeight = $(window).height() || 0;
      var padding = this.element_.hasClass('modal-huge') ? 12 : Math.floor(windowHeight * 0.1);
      var headerHeight = headerEl.outerHeight() || 0;
      var footerHeight = footerEl.outerHeight() || 0;
      var bodyOffset = (parseInt($('body').css('margin-top'), 10) || 0) +
          (parseInt($('body').css('padding-top'), 10) || 0);
      var maxBodyHeight = (windowHeight - (bodyOffset + padding * 2 + footerHeight + headerHeight));

      bodyEl.css({
        'max-height': maxBodyHeight + 'px'
      });
    }
  }

  /**
   * Clean up
   *
   * @private
   */
  onDestroy_() {
    if (this.vsm_) {
      this.vsm_.dispose();
      this.vsm_ = null;
    }
    this.element_ = null;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
