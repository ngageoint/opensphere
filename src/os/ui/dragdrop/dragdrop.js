goog.module('os.ui.DragDrop');
goog.module.declareLegacyNamespace();

const {getAncestorByClass} = goog.require('goog.dom');
const classlist = goog.require('goog.dom.classlist');
const EventType = goog.require('goog.fx.AbstractDragDrop.EventType');
const GoogDragDrop = goog.require('goog.fx.DragDrop');
const Coordinate = goog.require('goog.math.Coordinate');
const DragDropStyle = goog.require('os.ui.DragDropStyle');

const DragDropEvent = goog.requireType('goog.fx.DragDropEvent');


/**
 * Object containing the link function used by the directive.
 */
class DragDrop {
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
     * @type {?GoogDragDrop}
     * @private
     */
    this.source_ = null;

    /**
     * @type {?GoogDragDrop}
     * @private
     */
    this.target_ = null;

    /**
     * The parent element that has selection class
     * @type {jQuery}
     * @private
     */
    this.parent_ = null;

    /**
     * @type {number}
     */
    this.scope_['ddMin'] = $scope['ddMin'] ? $scope['ddMin'] : 50;

    this.source_ = new GoogDragDrop($element[0], $scope['ddData']);
    this.target_ = new GoogDragDrop($scope['ddTargetId']);
    this.source_.addTarget(this.target_);

    this.source_.setDragClass('c-dd-source__dragging');
    this.source_.setSourceClass('c-dd-source');
    this.target_.setTargetClass('c-dd-target');

    this.source_.init();
    this.target_.init();

    // register the fundamental event handlers
    this.target_.listen(EventType.DRAGOVER, this.addOverClass);
    this.target_.listen(EventType.DRAGOUT, this.removeOverClass);
    this.target_.listen(EventType.DROP, this.removeOverClass);

    // register the client's event handlers
    this.source_.listen(EventType.DRAGSTART, this.onDragStart, false, this);
    this.source_.listen(EventType.DRAGEND, this.onDragEnd, false, this);

    if ($scope['ddOver']) {
      this.target_.listen(EventType.DRAGOVER, this.onDragOver, false, this);
    }
    if ($scope['ddOut']) {
      this.target_.listen(
          EventType.DRAGOUT, this.onDragOut, false, this);
    }
    if ($scope['ddDrop']) {
      this.target_.listen(EventType.DROP, this.onDrop, false, this);
    }
  }

  /**
   * Clear references to Angular/DOM elements.
   */
  destroy() {
    if (this.scope_) {
      this.source_.dispose();
      this.target_.dispose();
      this.source_ = null;
      this.target_ = null;
      this.scope_ = null;
    }
  }

  /**
   * Handle event when dragging starts.
   *
   * @param {DragDropEvent} event
   */
  onDragStart(event) {
    this.clearTextSelection_();
    // To fix firefox selection issue, remove the parent selection (if it exists)
    var dragEle = event.dragSourceItem.element;
    if (dragEle) {
      var parent = getAncestorByClass(dragEle, 'selectable');
      if (parent) {
        this.parent_ = $(parent);
        this.parent_.removeClass('selectable');
        this.parent_.addClass('unselectable');
      }
    }

    if (this.scope_['ddStart']) {
      this.scope_['ddStart'](event.dragSourceItem.data, event);
    }
  }

  /**
   * Handle event when a dragging ends
   *
   * @param {DragDropEvent} event
   */
  onDragEnd(event) {
    this.clearTextSelection_();
    if (this.parent_) {
      this.parent_.removeClass('unselectable');
      this.parent_.addClass('selectable');
      this.parent_ = null;
    }
    if (this.scope_['ddEnd']) {
      this.scope_['ddEnd'](event.dragSourceItem.data, event);
    }
  }

  /**
   * Remove any highlighting that happened due to dragging
   *
   * @private
   */
  clearTextSelection_() {
    if (document.selection && document.selection.empty) {
      try {
        // IE fails here if selected element is not in dom
        document.selection.empty();
      } catch (e) { }
    } else if (window.getSelection) {
      var sel = window.getSelection();
      if (sel && sel.removeAllRanges) {
        sel.removeAllRanges();
      }
    }
  }

  /**
   * Handle event when a dragged source is over a drag target.
   *
   * @param {DragDropEvent} event
   */
  onDragOver(event) {
    this.scope_['ddOver'](event.dragSourceItem.data, event);
  }

  /**
   * Handle event when a dragged source leaves a drag target.
   *
   * @param {DragDropEvent} event
   */
  onDragOut(event) {
    this.scope_['ddOut'](event.dragSourceItem.data, event);
  }

  /**
   * Handle event when a dragged source is dropped on a drag target.
   * If the target has not moved more than ['ddMin'] number of pixels,
   * the event handler will not be called.
   *
   * @param {DragDropEvent} event
   */
  onDrop(event) {
    this.removeOverClass(event);
    var startCoord = new Coordinate(event.dragSource.getDragger().startX, event.dragSource.getDragger().startY);
    var endCoord = new Coordinate(event.clientX, event.clientY);
    var displacement = Coordinate.distance(startCoord, endCoord);
    if (displacement < this.scope_['ddMin']) {
      return;
    }
    this.scope_['ddDrop'](event.dragSourceItem.data, event);
  }

  /**
   * Respond to drag enter event by adding appropriate css to the elements.
   *
   * @param {DragDropEvent} event
   */
  addOverClass(event) {
    classlist.add(event.dropTargetItem.element, DragDropStyle.DRAG_DROP_CLASS);
  }

  /**
   * Respond to drag out event by removing appropriate css from the elements.
   *
   * @param {DragDropEvent} event
   */
  removeOverClass(event) {
    classlist.remove(event.dropTargetItem.element, DragDropStyle.DRAG_DROP_CLASS);
  }
}

exports = DragDrop;
