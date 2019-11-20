goog.provide('os.ui.UrlDragDrop');
goog.provide('os.ui.urlDragDropDirective');

goog.require('goog.dom.classlist');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.events.FileDropHandler');
goog.require('goog.fx.DragDrop');
goog.require('goog.math.Coordinate');
goog.require('os.ui.DragDropStyle');
goog.require('os.ui.Module');
goog.require('os.ui.windowSelector');
goog.require('os.url');
goog.require('os.url.UrlManager');


/**
 * Enables an element to be a drag-drop target for URLs and files. When a URL drop
 * event is detected, this makes a call to the URL manager in os, which decides
 * what to do with it based on the handlers registered to it
 *
 * @return {angular.Directive}
 */
os.ui.urlDragDropDirective = function() {
  return {
    restrict: 'A',
    replace: false,
    link: os.ui.urlDragDropLink,
    scope: {
      'ddTargetId': '@',
      'ddDrop': '=?',
      'ddCapture': '@',
      'ddElement': '@',
      'ddText': '@?',
      'enabled': '=?',
      'allowInternal': '<?'
    }
  };
};


/**
 * Register url-drag-drop directive.
 */
os.ui.Module.directive('urlDragDrop', [os.ui.urlDragDropDirective]);


/**
 * Link function for draggable directive
 *
 * @param {!angular.Scope} $scope angular scope
 * @param {!angular.JQLite} $element to which this directive is applied
 */
os.ui.urlDragDropLink = function($scope, $element) {
  var urlDragDrop = new os.ui.UrlDragDrop($scope, $element);
  $scope.$on('$destroy', urlDragDrop.destroy.bind(urlDragDrop));
};



/**
 * Object containing the link function used by the URL drag drop directive.
 *
 * @constructor
 * @param {!angular.Scope} $scope angular scope
 * @param {!angular.JQLite} $element to which this directive is applied
 */
os.ui.UrlDragDrop = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $scope['ddElement'] ? /** @type {angular.JQLite} */ ($($scope['ddElement'])) : $element;

  // default to enabled if it's not defined
  $scope['enabled'] = $scope['enabled'] == undefined ? true : $scope['enabled'];

  if (this.element_[0]) {
    goog.events.listen(this.element_[0], 'drop', this.handleDrop_, $scope['ddCapture'] === 'true', this);
    goog.events.listen(this.element_[0], 'dragover', this.handleDrag_, false, this);
    goog.events.listen(this.element_[0], 'dragleave', this.handleDrag_, false, this);

    if (!this.scope_['allowInternal']) {
      goog.events.listen($('html')[0], 'dragstart', this.handleDragStart_, false, this);
    }

    if (this.scope_['ddText']) {
      this.element_.attr('data-text', this.scope_['ddText']);
    } else {
      this.element_.attr('data-text', 'Drag & Drop');
    }
  }

  os.dispatcher.listen(os.ui.UrlDragDrop.CLEAR, this.onClear_, false, this);
};


/**
 * @type {string}
 */
os.ui.UrlDragDrop.CLEAR = 'urldragdrop.clear';


/**
 * @type {string}
 */
os.ui.UrlDragDrop.LOCAL = 'urldragdrop-local-element';


/**
 * @param {goog.events.Event} event
 */
os.ui.UrlDragDrop.prototype.onClear_ = function(event) {
  if (this.scope_['enabled']) {
    if (this.element_[0] != event.target) {
      goog.dom.classlist.remove(/** @type {Element} */ (this.element_[0]), os.ui.DragDropStyle.DRAG_DROP_CLASS);
    }
  }
};


/**
 * If this triggers than you know its from your webpage instead of another page / file
 * So you can add a identifier to the dataTransfer to know its from this page
 *
 * @param {goog.events.BrowserEvent} event The drop event
 * @private
 */
os.ui.UrlDragDrop.prototype.handleDragStart_ = function(event) {
  if (this.scope_['enabled']) {
    event.getBrowserEvent().dataTransfer.setData(os.ui.UrlDragDrop.LOCAL, '');
  }
};


/**
 * Handles an item being dragged over the element
 *
 * @param {goog.events.BrowserEvent} event The drop event
 * @private
 */
os.ui.UrlDragDrop.prototype.handleDrag_ = function(event) {
  if (this.scope_['enabled']) {
    var browserEvent = event.getBrowserEvent();
    browserEvent.preventDefault();
    browserEvent.stopPropagation();

    if (this.isValidTarget_(event) && !document.querySelector(os.ui.windowSelector.MODAL_BG) &&
        browserEvent && browserEvent.currentTarget) {
      if (browserEvent.type == 'dragover') {
        goog.dom.classlist.add(/** @type {Element} */ (browserEvent.currentTarget),
            os.ui.DragDropStyle.DRAG_DROP_CLASS);
        os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.UrlDragDrop.CLEAR, browserEvent.currentTarget));
      } else if (browserEvent.relatedTarget !== undefined
          && $(browserEvent.currentTarget).find(/** @type {Element} */ (browserEvent.relatedTarget)).length == 0) {
        // check to see if the related target is inside the current target, if not then remove the overlay styling
        goog.dom.classlist.remove(/** @type {Element} */ (browserEvent.currentTarget),
            os.ui.DragDropStyle.DRAG_DROP_CLASS);
      }
    }
  }
};


/**
 * If this is from the page its hosted on, ignore it
 * @param {goog.events.BrowserEvent} event The drop event
 * @return {boolean}
 * @private
 */
os.ui.UrlDragDrop.prototype.isValidTarget_ = function(event) {
  if (this.scope_['allowInternal']) {
    return true;
  } else {
    var dt = event.getBrowserEvent().dataTransfer;
    // If its a file, its valid
    if (dt.files.length) {
      return true;
    } else {
      return !dt.types.includes(os.ui.UrlDragDrop.LOCAL);
    }
  }
};


/**
 * Handles an item being dropped in the element.
 *
 * @param {goog.events.BrowserEvent} event The drop event
 * @private
 */
os.ui.UrlDragDrop.prototype.handleDrop_ = function(event) {
  if (this.scope_['enabled']) {
    var browserEvent = event.getBrowserEvent();
    browserEvent.preventDefault();
    browserEvent.stopPropagation();

    goog.dom.classlist.remove(/** @type {Element} */ (browserEvent.currentTarget), os.ui.DragDropStyle.DRAG_DROP_CLASS);

    if (this.isValidTarget_(event) && !document.querySelector(os.ui.windowSelector.MODAL_BG)) {
      if (this.scope_['ddDrop'] != null) {
        this.scope_['ddDrop'](browserEvent);
      } else if (browserEvent.dataTransfer.files && browserEvent.dataTransfer.files.length > 0) {
        os.url.UrlManager.getInstance().handleFiles(browserEvent.dataTransfer.files);
      } else {
        var sourceUri = null;

        try {
          sourceUri = browserEvent.dataTransfer.getData('text') ||
              browserEvent.dataTransfer.getData('text/plain') ||
              browserEvent.dataTransfer.getData('text/x-moz-text-internal');
        } catch (e) {
          // old browser, drag/drop API not implemented correctly
        }

        if (sourceUri) {
          if (os.url.URL_REGEXP.test(sourceUri)) {
            os.url.UrlManager.getInstance().handleUrl(sourceUri);
          } else {
            os.url.UrlManager.getInstance().handleText(sourceUri);
          }
        }
      }
    }
  }
};


/**
 * Clear references to Angular/DOM elements.
 */
os.ui.UrlDragDrop.prototype.destroy = function() {
  goog.events.unlisten(this.element_[0], 'drop', this.handleDrop_, this.scope_['ddCapture'] === 'true', this);
  goog.events.unlisten(this.element_[0], 'dragover', this.handleDrag_, false, this);
  goog.events.unlisten(this.element_[0], 'dragleave', this.handleDrag_, false, this);
  if (!this.scope_['allowInternal']) {
    goog.events.unlisten($('html')[0], 'dragstart', this.handleDragStart_, false, this);
  }
  os.dispatcher.unlisten(os.ui.UrlDragDrop.CLEAR, this.onClear_, false, this);
  this.scope_ = null;
  this.element_ = null;
};
