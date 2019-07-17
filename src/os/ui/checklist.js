goog.provide('os.ui.ChecklistCtrl');
goog.provide('os.ui.ChecklistEvent');
goog.provide('os.ui.checklistDirective');

goog.require('goog.events.Event');
goog.require('os.ui.Module');


/**
 * @enum {string}
 */
os.ui.ChecklistEvent = {
  CHANGE: 'checklist:change'
};


/**
 * The checklist directive
 *
 * @return {angular.Directive}
 */
os.ui.checklistDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'allowMultiple': '=',
      'items': '=',
      'name': '@'
    },
    templateUrl: os.ROOT + 'views/checklist.html',
    controller: os.ui.ChecklistCtrl,
    controllerAs: 'checklist'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('checklist', [os.ui.checklistDirective]);



/**
 * Controller function for the checklist directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.ChecklistCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   */
  this.element = $element;

  /**
   * @type {?angular.$timeout}
   */
  this.timeout = $timeout;

  /**
   * @type {boolean}
   */
  this['allCheckbox'] = false;
  this.timeout(function() {
    this.updateAllCheckbox_();
  }.bind(this));

  $scope.$watch('allowMultiple', this.onAllowMultipleChange_.bind(this));
  $scope.$watch('items', this.onItemsChange_.bind(this));
  $scope.$watch('items.length', this.onItemsChange_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 *
 * @private
 */
os.ui.ChecklistCtrl.prototype.destroy_ = function() {
  this.scope = null;
  this.element = null;
};


/**
 * Handle changes to the allow multiple flag.
 *
 * @param {boolean} newVal The new value
 * @param {boolean} oldVal The old value
 * @private
 */
os.ui.ChecklistCtrl.prototype.onAllowMultipleChange_ = function(newVal, oldVal) {
  if (newVal !== oldVal && !newVal) {
    // disable all but the first enabled item if multiple items aren't allowed
    var skipFirst = true;
    var changed = false;
    var items = /** @type {Array<!osx.ChecklistItem>} */ (this.scope['items']);
    for (var i = 0, n = items.length; i < n; i++) {
      if (items[i].enabled && skipFirst) {
        skipFirst = false;
      } else if (items[i].enabled) {
        items[i].enabled = false;
        changed = true;
      }
    }

    if (changed) {
      this.emitChangeEvent_();
      this.updateAllCheckbox_();
    }
  }
};


/**
 * Emit an Angular change event, using the scope name if available.
 *
 * @private
 */
os.ui.ChecklistCtrl.prototype.emitChangeEvent_ = function() {
  if (this.scope) {
    var eventType = os.ui.ChecklistEvent.CHANGE;
    if (this.scope['name']) {
      eventType += ':' + this.scope['name'];
    }

    this.scope.$emit(eventType);
  }
};


/**
 * Handle changes to the items array.
 *
 * @private
 */
os.ui.ChecklistCtrl.prototype.onItemsChange_ = function() {
  if (this.scope['items']) {
    /** @type {Array<!osx.ChecklistItem>} */ (this.scope['items']).sort(this.labelCompare_);
  }

  this.updateAllCheckbox_();
};


/**
 * Sort checklist items by label.
 *
 * @param {!osx.ChecklistItem} a A checklist item
 * @param {!osx.ChecklistItem} b Another checklist item
 * @return {number}
 * @private
 */
os.ui.ChecklistCtrl.prototype.labelCompare_ = function(a, b) {
  if (!a.label || !b.label) {
    return goog.array.defaultCompare(a.label, b.label);
  }
  return a.label.localeCompare(/** @type {string} */ (b.label), undefined, {sensitivity: 'base', numeric: true});
};


/**
 * Toggles all items on or off.
 *
 * @export
 */
os.ui.ChecklistCtrl.prototype.toggleAll = function() {
  if (this.scope && this.scope['allowMultiple']) {
    var items = /** @type {Array<!osx.ChecklistItem>} */ (this.scope['items']);
    if (items && items.length > 0) {
      // switch all items to the All state
      for (var i = 0, n = items.length; i < n; i++) {
        items[i].enabled = this['allCheckbox'];
      }

      this.emitChangeEvent_();
    }
  }
};


/**
 * Handle an item being checked on/off.
 *
 * @param {!osx.ChecklistItem} item The changed item
 * @export
 */
os.ui.ChecklistCtrl.prototype.onItemChange = function(item) {
  if (this.scope) {
    if (this.scope['allowMultiple']) {
      // if multiple items are allowed, update the All checkbox state
      this.updateAllCheckbox_();
    } else if (item.enabled) {
      // otherwise if the item was enabled, disable the rest
      var items = /** @type {Array<!osx.ChecklistItem>} */ (this.scope['items']);
      for (var i = 0, n = items.length; i < n; i++) {
        if (items[i] !== item) {
          items[i].enabled = false;
        }
      }
    }

    this.emitChangeEvent_();
  }
};


/**
 * Updates the enable/disable all checkbox.
 *
 * @private
 */
os.ui.ChecklistCtrl.prototype.updateAllCheckbox_ = function() {
  if (this.scope) {
    var hasChecked = false;
    var hasUnchecked = false;
    var items = /** @type {Array<!osx.ChecklistItem>} */ (this.scope['items']);
    if (items && items.length > 0) {
      for (var i = 0, n = items.length; i < n; i++) {
        if (!items[i].enabled) {
          // if at least one isn't checked, uncheck the box
          hasUnchecked = true;
        } else {
          hasChecked = true;
        }
      }

      var allCheckbox = this.element.find('.js-checklist__all');
      // If at least 1 is checked but not all, make indeterminate
      if (hasChecked && hasUnchecked) {
        allCheckbox.prop('checked', true);
        allCheckbox.prop('indeterminate', true);
        this['allCheckbox'] = true;
      } else {
        allCheckbox.prop('checked', hasChecked);
        allCheckbox.prop('indeterminate', false);
        this['allCheckbox'] = hasChecked;
      }
    }
  }
};


/**
 * Launches a floating menu-like element wrapping a checklist directive. Uses the passed in parameters and positioning
 * information to populate/position it.
 *
 * @param {angular.JQLite|string} target The target element/string
 * @param {Array<Object>} items The checklist items
 * @param {boolean=} opt_allowMultiple The directive allow-multiple value
 * @param {string=} opt_name The name for the checklist
 * @param {angular.Scope=} opt_scope The optional scope to compile the directive from
 * @param {boolean=} opt_left Display the menu leftward
 */
os.ui.ChecklistCtrl.launchChecklistMenu = function(target, items, opt_allowMultiple, opt_name, opt_scope, opt_left) {
  var targetEl = typeof target === 'string' ? angular.element(target) : target;
  var allowMultiple = opt_allowMultiple || false;
  var scope = opt_scope || os.ui.injector.get('$rootScope');
  var compile = os.ui.injector.get('$compile');
  var name = opt_name || 'checklistContainer';
  var left = !!opt_left;

  if (os.ui.ChecklistCtrl.checklist_) {
    var s = os.ui.ChecklistCtrl.checklist_.scope();
    if (s) {
      s.$destroy();
    }
    os.ui.ChecklistCtrl.checklist_.remove();
  }

  var checklistHtml = '<div id="checklistContainer" class="position-absolute col px-0 popover">' +
      '<checklist allow-multiple="allow" items="checklistItems" name="' + name + '"></checklist></div>';
  scope = scope.$new();
  scope['allow'] = allowMultiple;
  scope['checklistItems'] = items;
  os.ui.ChecklistCtrl.checklist_ = compile(checklistHtml)(scope);
  angular.element('body').append(os.ui.ChecklistCtrl.checklist_);

  var pos = targetEl.offset();
  var p = {
    x: left ? (pos.left + targetEl.outerWidth() - os.ui.ChecklistCtrl.checklist_.outerWidth()) : (pos.left),
    y: pos.top + targetEl.outerHeight()
  };
  os.ui.ChecklistCtrl.checklist_.css('left', p.x);
  os.ui.ChecklistCtrl.checklist_.css('top', p.y);

  var doc = goog.dom.getDocument();
  doc.addEventListener(goog.events.EventType.MOUSEDOWN, os.ui.ChecklistCtrl.onClick_, true);
  doc.addEventListener(goog.events.EventType.POINTERDOWN, os.ui.ChecklistCtrl.onClick_, true);
};


/**
 * Global reference to the presently-existing checklist.
 * @type {?angular.JQLite}
 * @private
 */
os.ui.ChecklistCtrl.checklist_ = null;


/**
 * Checklist close event type
 * @type {string}
 */
os.ui.ChecklistCtrl.CHECKLIST_CLOSE = 'checklistclose';


/**
 * Click handler
 *
 * @param {Event} e
 * @private
 */
os.ui.ChecklistCtrl.onClick_ = function(e) {
  if (os.ui.ChecklistCtrl.checklist_) {
    // stop the event if the checklist menu is up
    e.stopPropagation();
    e.preventDefault();

    // if we didn't click on something in the menu, close and destroy it
    if (!$(e.target).closest('#checklistContainer').length) {
      var s = os.ui.ChecklistCtrl.checklist_.scope();
      if (s) {
        s.$destroy();
      }
      os.ui.ChecklistCtrl.checklist_.remove();
      os.ui.ChecklistCtrl.checklist_ = null;

      var doc = goog.dom.getDocument();
      doc.removeEventListener(goog.events.EventType.MOUSEDOWN, os.ui.ChecklistCtrl.onClick_, true);
      doc.removeEventListener(goog.events.EventType.POINTERDOWN, os.ui.ChecklistCtrl.onClick_, true);
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.ChecklistCtrl.CHECKLIST_CLOSE));
    }
  }
};
