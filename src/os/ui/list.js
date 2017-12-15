goog.provide('os.ui.ListCtrl');
goog.provide('os.ui.list');
goog.provide('os.ui.list.ListEventType');
goog.provide('os.ui.listDirective');

goog.require('goog.events.EventTarget');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.Module');


/**
 * List event types.
 * @enum {string}
 */
os.ui.list.ListEventType = {
  CHANGE: 'list:change'
};


/**
 * @typedef {{
 *    markup: string,
 *    priority: number,
 *    element: (angular.JQLite|undefined),
 *    scope: (angular.Scope|undefined)
 *  }}
 */
os.ui.list.ListEntry;


/**
 * @type {Object<string, Array<os.ui.list.ListEntry>>}
 * @private
 */
os.ui.list.map_ = {};


/**
 * @type {goog.events.EventTarget}
 * @const
 * @private
 */
os.ui.list.dispatcher_ = new goog.events.EventTarget();


/**
 * @param {string} id The list ID to which to add
 * @param {string} markup The directive or markup to add
 * @param {number=} opt_priority The sort priority (lowest to highest)
 */
os.ui.list.add = function(id, markup, opt_priority) {
  var map = os.ui.list.map_;

  if (!(id in map)) {
    map[id] = [];
  }

  map[id].push({
    markup: markup,
    priority: opt_priority || 0
  });

  map[id].sort(os.ui.list.sort_);
  os.ui.list.dispatcher_.dispatchEvent(new os.events.PropertyChangeEvent(id));
};


/**
 * @param {string} id The list ID to which to check
 * @param {string} markup The directive or markup to delete
 */
os.ui.list.remove = function(id, markup) {
  var map = os.ui.list.map_[id];
  if (map) {
    var item = goog.array.find(map, function(item) {
      return item.markup == markup;
    });
    if (item) {
      if (item.scope) {
        item.scope.$destroy();
        item.scope = undefined;
      }

      goog.array.remove(map, item);
      os.ui.list.map_[id] = map;
      os.ui.list.dispatcher_.dispatchEvent(new os.events.PropertyChangeEvent(id, null, item));
    }
  }
};


/**
 * @param {os.ui.list.ListEntry} a list entry 1
 * @param {os.ui.list.ListEntry} b list entry 2
 * @return {number} per typical compare function
 * @private
 */
os.ui.list.sort_ = function(a, b) {
  return a.priority - b.priority;
};


/**
 * @param {string} id The list ID to get
 * @return {?Array<!os.ui.list.ListEntry>} the list or null if not found
 */
os.ui.list.get = function(id) {
  return os.ui.list.map_[id] || null;
};


/**
 * Checks to see if the markup already exists in the list
 * @param {string} id The list ID to which to check
 * @param {string} markup The directive or markup to check
 * @return {boolean} if the markup was found or not
 */
os.ui.list.exists = function(id, markup) {
  var found = null;
  var map = os.ui.list.map_[id];
  if (map) {
    found = goog.array.find(map, function(item) {
      return item.markup == markup;
    });
  }
  return !!found;
};


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
os.ui.listDirective = function() {
  return {
    restrict: 'A',
    controller: os.ui.ListCtrl,
    link: os.ui.listLink
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('list', [os.ui.listDirective]);


/**
 * @param {!angular.Scope} scope The scope
 * @param {!angular.JQLite} element The element
 * @param {!angular.Attributes} attr The element's attributes
 * @param {os.ui.ListCtrl} ctrl The controller
 */
os.ui.listLink = function(scope, element, attr, ctrl) {
  // add the list stuff to the scope
  var id = attr['listId'];
  ctrl.id = id;

  var list = os.ui.list.get(id) || scope.$eval(attr['listItems']);

  if (list) {
    ctrl.items = /** @type {!Array<!os.ui.list.ListEntry>} */ (list);
  }

  ctrl.prefix = attr['listPrefix'];
  ctrl.suffix = attr['listSuffix'];
  ctrl.update_();
};



/**
 * Controller for the list directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @constructor
 * @ngInject
 */
os.ui.ListCtrl = function($scope, $element, $compile) {
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
   * @type {!Array<!os.ui.list.ListEntry>}
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

  os.ui.list.dispatcher_.listen(goog.events.EventType.PROPERTYCHANGE, this.onChange, false, this);
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Cleanup
 * @private
 */
os.ui.ListCtrl.prototype.onDestroy_ = function() {
  os.ui.list.dispatcher_.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onChange, false, this);
  this.scope = null;
  this.element_ = null;
  this.compile_ = null;

  // prevent element leaks when destroying lists
  this.items.forEach(function(item) {
    item.element = undefined;
  });

  this.items.length = 0;
};


/**
 * Handles list change
 * @param {os.events.PropertyChangeEvent} evt The list change event
 * @protected
 */
os.ui.ListCtrl.prototype.onChange = function(evt) {
  var oldItem = evt.getOldValue();
  var newItem = evt.getNewValue();
  if (evt.getProperty() === this.id) {
    if (oldItem && !newItem) {
      goog.dom.removeNode(oldItem.element[0]);
      this.scope.$emit(os.ui.list.ListEventType.CHANGE);
    } else {
      this.update_();
    }
  }
};


/**
 * Updates the displayed UI
 * @private
 */
os.ui.ListCtrl.prototype.update_ = function() {
  // Always attempt to get the updated list of items, or use the scope list of items if it doesnt exist
  var items = os.ui.list.get(this.id || '') || this.items;

  var prefix = this.prefix || '';
  var suffix = this.suffix || '';

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      var item = items[i];

      if (!item.element) {
        var dir = item.markup;
        if (dir.indexOf('<') === -1) {
          dir = '<' + dir + '></' + dir + '>';
        }

        var html = prefix + dir + suffix;

        if (this.scope) {
          var elScope = this.scope.$new();
          item.element = this.compile_(html)(elScope);
          item.scope = elScope;
        }
      }

      if (item.element) {
        // Appending an element that already exists in the DOM will update the element's position
        this.element_.append(item.element);
      }
    }

    this.scope.$emit(os.ui.list.ListEventType.CHANGE);
  }
};
