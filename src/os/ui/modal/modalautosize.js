goog.provide('os.ui.modal.ModalAutoSize');
goog.provide('os.ui.modal.modalAutoSizeDirective');

goog.require('goog.async.Throttle');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('goog.events.EventType');
goog.require('os.ui.Module');


/**
 * The modal-auto-size directive
 * @return {angular.Directive}
 */
os.ui.modal.modalAutoSizeDirective = function() {
  return {
    restrict: 'C',
    link: os.ui.modal.modalAutoSizeLink
  };
};


/**
 * Register modal-auto-size directive.
 */
os.ui.Module.directive('modalAutoSize', [os.ui.modal.modalAutoSizeDirective]);


/**
 * Link function for modal-auto-size directive
 * @param {!angular.Scope} $scope angular scope
 * @param {!angular.JQLite} $element to which this directive is applied
 */
os.ui.modal.modalAutoSizeLink = function($scope, $element) {
  new os.ui.modal.ModalAutoSize($scope, $element);
};



/**
 * Object containing the link function used by the directive.
 * @param {!angular.Scope} $scope angular scope
 * @param {!angular.JQLite} $element to which this directive is applied
 * @constructor
 */
os.ui.modal.ModalAutoSize = function($scope, $element) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  var modalEl = this.element_;
  if (!modalEl.hasClass('modal')) {
    return;
  }

  var throttle = new goog.async.Throttle(this.updateSizeConstraints_, 500, this);
  modalEl.bind('DOMSubtreeModified', throttle.fire.bind(throttle));

  $scope.$on('$destroy', this.onDestroy_.bind(this));

  /**
   * @type {?goog.dom.ViewportSizeMonitor}
   * @private
   */
  this.vsm_ = new goog.dom.ViewportSizeMonitor();
  this.vsm_.listen(goog.events.EventType.RESIZE, this.updateSizeConstraints_, false, this);
};


/**
 * Autoresizes the modal element when the window is resized.
 * @private
 */
os.ui.modal.ModalAutoSize.prototype.updateSizeConstraints_ = function() {
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
};


/**
 * Clean up
 * @private
 */
os.ui.modal.ModalAutoSize.prototype.onDestroy_ = function() {
  if (this.vsm_) {
    this.vsm_.dispose();
    this.vsm_ = null;
  }
  this.element_ = null;
};
