goog.module('os.ui.UrlDragDrop');
goog.module.declareLegacyNamespace();

const classlist = goog.require('goog.dom.classlist');
const googEvents = goog.require('goog.events');
const GoogEvent = goog.require('goog.events.Event');
const dispatcher = goog.require('os.Dispatcher');
const DragDropStyle = goog.require('os.ui.DragDropStyle');
const windowSelector = goog.require('os.ui.windowSelector');
const {URL_REGEXP} = goog.require('os.url');
const UrlManager = goog.require('os.url.UrlManager');

const BrowserEvent = goog.requireType('goog.events.BrowserEvent');


/**
 * Object containing the link function used by the URL drag drop directive.
 */
class UrlDragDrop {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope angular scope
   * @param {!angular.JQLite} $element to which this directive is applied
   */
  constructor($scope, $element) {
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
      googEvents.listen(this.element_[0], 'drop', this.handleDrop_, $scope['ddCapture'] === 'true', this);
      googEvents.listen(this.element_[0], 'dragover', this.handleDrag_, false, this);
      googEvents.listen(this.element_[0], 'dragleave', this.handleDrag_, false, this);

      if (!this.scope_['allowInternal']) {
        googEvents.listen($('html')[0], 'dragstart', this.handleDragStart_, false, this);
      }

      if (this.scope_['ddText']) {
        this.element_.attr('data-text', this.scope_['ddText']);
      } else {
        this.element_.attr('data-text', 'Drag & Drop');
      }
    }

    dispatcher.getInstance().listen(UrlDragDrop.CLEAR, this.onClear_, false, this);
  }

  /**
   * @param {GoogEvent} event
   */
  onClear_(event) {
    if (this.scope_['enabled']) {
      if (this.element_[0] != event.target) {
        classlist.remove(/** @type {Element} */ (this.element_[0]), DragDropStyle.DRAG_DROP_CLASS);
      }
    }
  }

  /**
   * If this triggers than you know its from your webpage instead of another page / file
   * So you can add a identifier to the dataTransfer to know its from this page
   *
   * @param {BrowserEvent} event The drop event
   * @private
   */
  handleDragStart_(event) {
    if (this.scope_['enabled']) {
      event.getBrowserEvent().dataTransfer.setData(UrlDragDrop.LOCAL, '');
    }
  }

  /**
   * Handles an item being dragged over the element
   *
   * @param {BrowserEvent} event The drop event
   * @private
   */
  handleDrag_(event) {
    if (this.scope_['enabled']) {
      var browserEvent = event.getBrowserEvent();
      browserEvent.preventDefault();
      browserEvent.stopPropagation();

      if (this.isValidTarget_(event) && this.isDropAllowed_(event) && browserEvent && browserEvent.currentTarget) {
        if (browserEvent.type == 'dragover') {
          classlist.add(/** @type {Element} */ (browserEvent.currentTarget),
              DragDropStyle.DRAG_DROP_CLASS);
          dispatcher.getInstance().dispatchEvent(new GoogEvent(UrlDragDrop.CLEAR, browserEvent.currentTarget));
        } else if (browserEvent.relatedTarget !== undefined &&
            $(browserEvent.currentTarget).find(/** @type {Element} */ (browserEvent.relatedTarget)).length == 0) {
          // check to see if the related target is inside the current target, if not then remove the overlay styling
          classlist.remove(/** @type {Element} */ (browserEvent.currentTarget),
              DragDropStyle.DRAG_DROP_CLASS);
        }
      }
    }
  }

  /**
   * If drag/drop is allowed.
   * @param {BrowserEvent} event The event
   * @return {boolean}
   * @private
   */
  isDropAllowed_(event) {
    return !document.querySelector(windowSelector.MODAL_BG) || this.scope_['allowModal'];
  }

  /**
   * If this is from the page its hosted on, ignore it
   * @param {BrowserEvent} event The drop event
   * @return {boolean}
   * @private
   */
  isValidTarget_(event) {
    if (this.scope_['allowInternal']) {
      return true;
    } else {
      var dt = event.getBrowserEvent().dataTransfer;
      // If its a file, its valid
      if (dt.files.length) {
        return true;
      } else {
        return !dt.types.includes(UrlDragDrop.LOCAL);
      }
    }
  }

  /**
   * Handles an item being dropped in the element.
   *
   * @param {BrowserEvent} event The drop event
   * @private
   */
  handleDrop_(event) {
    // always remove all drop classes, even when disabled, to ensure they don't get stuck
    var dropEles = document.querySelectorAll('.' + DragDropStyle.DRAG_DROP_CLASS);
    if (dropEles && dropEles.length > 0) {
      for (var i = 0, ii = dropEles.length; i < ii; i++) {
        classlist.remove(dropEles[i], DragDropStyle.DRAG_DROP_CLASS);
      }
    }

    if (this.scope_['enabled']) {
      var browserEvent = event.getBrowserEvent();
      browserEvent.preventDefault();
      browserEvent.stopPropagation();

      if (this.isValidTarget_(event) && this.isDropAllowed_(event)) {
        if (this.scope_['ddDrop'] != null) {
          this.scope_['ddDrop'](browserEvent);
        } else if (browserEvent.dataTransfer.files && browserEvent.dataTransfer.files.length > 0) {
          UrlManager.getInstance().handleFiles(browserEvent.dataTransfer.files);
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
            sourceUri = sourceUri.trim(); // clean up newlines and spaces

            if (URL_REGEXP.test(sourceUri)) {
              UrlManager.getInstance().handleUrl(sourceUri);
            } else {
              UrlManager.getInstance().handleText(sourceUri);
            }
          }
        }
      }
    }
  }

  /**
   * Clear references to Angular/DOM elements.
   */
  destroy() {
    googEvents.unlisten(this.element_[0], 'drop', this.handleDrop_, this.scope_['ddCapture'] === 'true', this);
    googEvents.unlisten(this.element_[0], 'dragover', this.handleDrag_, false, this);
    googEvents.unlisten(this.element_[0], 'dragleave', this.handleDrag_, false, this);
    if (!this.scope_['allowInternal']) {
      googEvents.unlisten($('html')[0], 'dragstart', this.handleDragStart_, false, this);
    }
    dispatcher.getInstance().unlisten(UrlDragDrop.CLEAR, this.onClear_, false, this);
    this.scope_ = null;
    this.element_ = null;
  }
}

/**
 * @type {string}
 */
UrlDragDrop.CLEAR = 'urldragdrop.clear';

/**
 * @type {string}
 */
UrlDragDrop.LOCAL = 'urldragdrop-local-element';

exports = UrlDragDrop;
