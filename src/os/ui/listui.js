goog.module('os.ui.ListUI');

const {removeNode} = goog.require('goog.dom');
const GoogEventType = goog.require('goog.events.EventType');
const Module = goog.require('os.ui.Module');
const {get, getDispatcher} = goog.require('os.ui.list');
const ListEventType = goog.require('os.ui.list.ListEventType');

const PropertyChangeEvent = goog.requireType('os.events.PropertyChangeEvent');
const {ListEntry} = goog.requireType('os.ui.list');


/**
 * A directive which takes a list of items and compiles them into the DOM
 *
 * Each item in items is passed to the directive function. That function then returns
 * the directive string (e.g. 'my-directive'). The generic directive is used when the
 * directive function returns null or when more than one directive is found for a set
 * of items.
 *
 * The items array is placed on the scope as 'items' for the resulting directive.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'A',
  controller: Controller,
  link: listLink
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'list';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * @param {!angular.Scope} scope The scope
 * @param {!angular.JQLite} element The element
 * @param {!angular.Attributes} attr The element's attributes
 * @param {Controller} ctrl The controller
 */
const listLink = function(scope, element, attr, ctrl) {
  // add the list stuff to the scope
  var id = attr['listId'];
  ctrl.id = id;

  var list = get(id) || scope.$eval(attr['listItems']);

  if (list) {
    ctrl.items = /** @type {!Array<!ListEntry>} */ (list);
  }

  ctrl.prefix = attr['listPrefix'];
  ctrl.suffix = attr['listSuffix'];
  ctrl.update_();
};

/**
 * Controller for the list directive
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
     * @private
     */
    this.element_ = $element;

    /**
     * @type {?angular.$compile}
     * @private
     */
    this.compile_ = $compile;

    /**
     * @type {?string}
     * @protected
     */
    this.id = null;

    /**
     * @type {!Array<!ListEntry>}
     * @protected
     */
    this.items = [];

    /**
     * @type {string}
     * @protected
     */
    this.prefix = '';

    /**
     * @type {string}
     * @protected
     */
    this.suffix = '';

    getDispatcher().listen(GoogEventType.PROPERTYCHANGE, this.onChange, false, this);
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Cleanup
   *
   * @private
   */
  onDestroy_() {
    getDispatcher().unlisten(GoogEventType.PROPERTYCHANGE, this.onChange, false, this);
    this.scope = null;
    this.element_ = null;
    this.compile_ = null;

    // Prevent element leaks when destroying lists by cleaning up the items.
    // Keep around the items so when the list is displayed again it recompiles the items
    this.items.forEach(function(item) {
      item.element = undefined;
    });
  }

  /**
   * Handles list change
   *
   * @param {PropertyChangeEvent} evt The list change event
   * @protected
   */
  onChange(evt) {
    var oldItem = evt.getOldValue();
    var newItem = evt.getNewValue();
    if (evt.getProperty() === this.id) {
      if (oldItem && !newItem) {
        removeNode(oldItem.element[0]);
        this.scope.$emit(ListEventType.CHANGE);
      } else {
        this.update_();
      }
    }
  }

  /**
   * Updates the displayed UI
   *
   * @private
   */
  update_() {
    // Always attempt to get the updated list of items, or use the scope list of items if it doesnt exist
    var items = get(this.id || '') || this.items;

    var prefix = this.prefix || '';
    var suffix = this.suffix || '';

    if (this.scope && items) {
      for (var i = 0, n = items.length; i < n; i++) {
        var item = items[i];

        if (!item.element) {
          var dir = item.markup;
          if (dir.indexOf('<') === -1) {
            dir = '<' + dir + '></' + dir + '>';
          }

          var html = prefix + dir + suffix;
          var elScope = this.scope.$new();
          item.element = this.compile_(html)(elScope);
          item.scope = elScope;

          // Assumption: existing items will not change in priority. If they do, they must be removed and added again.
          if (i === 0) {
            // Insert as the first child.
            this.element_.prepend(item.element);
          } else {
            // Insert after the previous item's element. This takes the extra precaution to insert after the last element,
            // in case the previous markup produced multiple elements.
            const previous = items[i - 1].element;
            item.element.insertAfter(previous[previous.length - 1]);
          }
        }
      }

      this.scope.$emit(ListEventType.CHANGE);
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
