goog.provide('os.ui.DragDrop');
goog.provide('os.ui.DragDropStyle');
goog.provide('os.ui.dragDropDirective');

goog.require('goog.dom.classlist');
goog.require('goog.events.EventType');
goog.require('goog.events.FileDropHandler');
goog.require('goog.fx.DragDrop');
goog.require('goog.math.Coordinate');
goog.require('os.ui.Module');
goog.require('os.ui.windowSelector');
goog.require('os.url');
goog.require('os.url.UrlManager');


/**
 * Enables elements as draggable (creating drag source and drop targets).
 * Provides basic behavior for drag and drop events and accepts function
 * parameters for the client to handle specialized behavior.
 *
 * Directive parameters:
 * dd-target-id The ID of the drop target. Turns the element into a drag target.
 *
 * Note: All event handler functions accept data and event as their parameters.
 *
 * dd-data Data to be passed along with drag/drop events.  Useful to carry the
 *    object which will be acted on.
 * dd-start Event handler function for drag start.
 * dd-end Event handler function for drag end.
 * dd-over Event handler function for drag over.
 * dd-out Event handler function for drag put.
 * dd-drop Event handler function for drag drop.
 * dd-min Setting for the minimum desired displacement before executing dd-drop
 *
 * Example usage:
 * ```
 * <div drag-drop dd-data="myObject" dd-drop="myLoadFunc">{{object.name}}></div>
 * ```
 *
 * @return {angular.Directive}
 */
os.ui.dragDropDirective = function() {
  return {
    restrict: 'A',
    replace: false,
    link: os.ui.dragDropLink,
    scope: {
      'ddTargetId': '@',
      'ddData': '=',
      'ddStart': '=?',
      'ddEnd': '=?',
      'ddOver': '=?',
      'ddOut': '=?',
      'ddDrop': '=',
      'ddMin': '=?'
    }
  };
};


/**
 * Register drag-drop directive.
 */
os.ui.Module.directive('dragDrop', [os.ui.dragDropDirective]);


/**
 * @enum {string}
 */
os.ui.DragDropStyle = {
  DRAG_DROP_CLASS: 'c-dd-target__dragover'
};


/**
 * Link function for draggable directive
 *
 * @param {!angular.Scope} $scope angular scope
 * @param {!angular.JQLite} $element to which this directive is applied
 */
os.ui.dragDropLink = function($scope, $element) {
  var dragDrop = new os.ui.DragDrop($scope, $element);
  $scope.$on('$destroy', dragDrop.destroy.bind(dragDrop));
};



/**
 * Object containing the link function used by the directive.
 *
 * @constructor
 * @param {!angular.Scope} $scope angular scope
 * @param {!angular.JQLite} $element to which this directive is applied
 */
os.ui.DragDrop = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?goog.fx.DragDrop}
   * @private
   */
  this.source_ = null;

  /**
   * @type {?goog.fx.DragDrop}
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

  this.source_ = new goog.fx.DragDrop($element[0], $scope['ddData']);
  this.target_ = new goog.fx.DragDrop($scope['ddTargetId']);
  this.source_.addTarget(this.target_);

  this.source_.setDragClass('c-dd-source__dragging');
  this.source_.setSourceClass('c-dd-source');
  this.target_.setTargetClass('c-dd-target');

  this.source_.init();
  this.target_.init();

  // register the fundamental event handlers
  this.target_.listen(goog.fx.AbstractDragDrop.EventType.DRAGOVER, this.addOverClass);
  this.target_.listen(goog.fx.AbstractDragDrop.EventType.DRAGOUT, this.removeOverClass);
  this.target_.listen(goog.fx.AbstractDragDrop.EventType.DROP, this.removeOverClass);

  // register the client's event handlers
  this.source_.listen(goog.fx.AbstractDragDrop.EventType.DRAGSTART, this.onDragStart, false, this);
  this.source_.listen(goog.fx.AbstractDragDrop.EventType.DRAGEND, this.onDragEnd, false, this);

  if ($scope['ddOver']) {
    this.target_.listen(goog.fx.AbstractDragDrop.EventType.DRAGOVER, this.onDragOver, false, this);
  }
  if ($scope['ddOut']) {
    this.target_.listen(
        goog.fx.AbstractDragDrop.EventType.DRAGOUT, this.onDragOut, false, this);
  }
  if ($scope['ddDrop']) {
    this.target_.listen(goog.fx.AbstractDragDrop.EventType.DROP, this.onDrop, false, this);
  }
};


/**
 * Clear references to Angular/DOM elements.
 */
os.ui.DragDrop.prototype.destroy = function() {
  this.source_.dispose();
  this.target_.dispose();
  this.source_ = null;
  this.target_ = null;
  this.scope_ = null;
};


/**
 * Handle event when dragging starts.
 *
 * @param {goog.fx.DragDropEvent} event
 */
os.ui.DragDrop.prototype.onDragStart = function(event) {
  this.clearTextSelection_();
  // To fix firefox selection issue, remove the parent selection (if it exists)
  var dragEle = event.dragSourceItem.element;
  if (dragEle) {
    var parent = goog.dom.getAncestorByClass(dragEle, 'selectable');
    if (parent) {
      this.parent_ = $(parent);
      this.parent_.removeClass('selectable');
      this.parent_.addClass('unselectable');
    }
  }

  if (this.scope_['ddStart']) {
    this.scope_['ddStart'](event.dragSourceItem.data, event);
  }
};


/**
 * Handle event when a dragging ends
 *
 * @param {goog.fx.DragDropEvent} event
 */
os.ui.DragDrop.prototype.onDragEnd = function(event) {
  this.clearTextSelection_();
  if (this.parent_) {
    this.parent_.removeClass('unselectable');
    this.parent_.addClass('selectable');
    this.parent_ = null;
  }
  if (this.scope_['ddEnd']) {
    this.scope_['ddEnd'](event.dragSourceItem.data, event);
  }
};


/**
 * Remove any highlighting that happened due to dragging
 *
 * @private
 */
os.ui.DragDrop.prototype.clearTextSelection_ = function() {
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
};


/**
 * Handle event when a dragged source is over a drag target.
 *
 * @param {goog.fx.DragDropEvent} event
 */
os.ui.DragDrop.prototype.onDragOver = function(event) {
  this.scope_['ddOver'](event.dragSourceItem.data, event);
};


/**
 * Handle event when a dragged source leaves a drag target.
 *
 * @param {goog.fx.DragDropEvent} event
 */
os.ui.DragDrop.prototype.onDragOut = function(event) {
  this.scope_['ddOut'](event.dragSourceItem.data, event);
};


/**
 * Handle event when a dragged source is dropped on a drag target.
 * If the target has not moved more than ['ddMin'] number of pixels,
 * the event handler will not be called.
 *
 * @param {goog.fx.DragDropEvent} event
 */
os.ui.DragDrop.prototype.onDrop = function(event) {
  this.removeOverClass(event);
  var startCoord = new goog.math.Coordinate(event.dragSource.getDragger().startX, event.dragSource.getDragger().startY);
  var endCoord = new goog.math.Coordinate(event.clientX, event.clientY);
  var displacement = goog.math.Coordinate.distance(startCoord, endCoord);
  if (displacement < this.scope_['ddMin']) {
    return;
  }
  this.scope_['ddDrop'](event.dragSourceItem.data, event);
};


/**
 * Respond to drag enter event by adding appropriate css to the elements.
 *
 * @param {goog.fx.DragDropEvent} event
 */
os.ui.DragDrop.prototype.addOverClass = function(event) {
  goog.dom.classlist.add(event.dropTargetItem.element, os.ui.DragDropStyle.DRAG_DROP_CLASS);
};


/**
 * Respond to drag out event by removing appropriate css from the elements.
 *
 * @param {goog.fx.DragDropEvent} event
 */
os.ui.DragDrop.prototype.removeOverClass = function(event) {
  goog.dom.classlist.remove(event.dropTargetItem.element, os.ui.DragDropStyle.DRAG_DROP_CLASS);
};
