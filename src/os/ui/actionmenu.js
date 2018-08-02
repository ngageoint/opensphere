goog.provide('os.ui.ActionMenuCtrl');
goog.provide('os.ui.actionMenuDirective');

goog.require('goog.events.EventType');
goog.require('os.metrics.Metrics');
goog.require('os.ui.Module');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.action.MenuItem');
goog.require('os.ui.action.MenuItemAction');
goog.require('os.ui.action.MenuItemList');
goog.require('os.ui.action.MenuItemSeparator');
goog.require('os.ui.action.MenuItemSeparatorHeader');
goog.require('os.ui.action.MenuOptions');



/**
 * Controller function for the ActionMenu directive
 * @constructor
 * @param {angular.Scope} $scope
 * @param {angular.JQLite} $element
 * @param {angular.$timeout} $timeout
 * @ngInject
 */
os.ui.ActionMenuCtrl = function($scope, $element, $timeout) {
  $scope['path'] = os.ROOT;

  /**
   * @type {boolean}
   */
  $scope['isFlat'] = $scope['flatten'] == 'true';

  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {?angular.$timeout}
   * @protected
   */
  this.timeout = $timeout;

  /**
   * @type {Array}
   * @private
   */
  this.destroyers_ = [];

  if (this.element && this.element[0]) {
    this.key = goog.events.listen(this.element[0], goog.events.EventType.CONTEXTMENU, this.killRightClick_, true, this);
  }

  if (this.scope['titletext'] && this.scope['titleselector']) {
    this.addTitle(this.scope['titleselector'], this.scope['titletext']);
  }

  var provider = /** @type {os.ui.action.ActionManager} */ (this.scope['provider']);
  if ($scope['visible'] == 'true' && provider && provider.hasEnabledActions()) {
    this.position();
  }

  $scope.$on('$destroy', this.destroy.bind(this));
  this.destroyers_.push($scope.$watch('provider', this.onProviderChange_.bind(this)));
  this.destroyers_.push($scope.$watch('position', this.onPositionChange_.bind(this)));
};


/**
 * Clean up
 * @protected
 */
os.ui.ActionMenuCtrl.prototype.destroy = function() {
  this.onProviderChange_(null, this.scope['provider']);

  for (var i = 0, n = this.destroyers_.length; i < n; i++) {
    this.destroyers_[i]();
  }

  if (this.key) {
    goog.events.unlistenByKey(this.key);
    this.key = null;
  }

  this.element = null;
  this.timeout_ = null;
  this.scope = null;
};


/**
 * @param {goog.events.BrowserEvent} event
 * @private
 */
os.ui.ActionMenuCtrl.prototype.killRightClick_ = function(event) {
  if (event.button === 2) {
    event.preventDefault();
    event.stopPropagation();
  }
};


/**
 * Invokes a menu action on the provider
 * @param {os.ui.action.Action} action
 * @return {boolean} True if an action was invoked, false otherwise
 */
os.ui.ActionMenuCtrl.prototype.invoke = function(action) {
  var provider = this.scope['provider'];
  if (action && goog.isFunction(action.getEventType)) {
    // record action metric
    os.metrics.Metrics.getInstance().updateMetric(action.getMetricKey(), 1);
    provider.invoke(action.getEventType());
    return true;
  }

  return false;
};
goog.exportProperty(os.ui.ActionMenuCtrl.prototype, 'invoke', os.ui.ActionMenuCtrl.prototype.invoke);


/**
 * Handler for changes to position on the $scope.
 * @param {Object.<string, number>|undefined} newVal
 * @param {Object.<string, number>|undefined} oldVal
 * @private
 */
os.ui.ActionMenuCtrl.prototype.onPositionChange_ = function(newVal, oldVal) {
  if (newVal != oldVal) {
    this.position();
  }
};


/**
 * Handles changes to the provider
 * @param {os.ui.action.ActionManager} newVal
 * @param {os.ui.action.ActionManager} oldVal
 * @private
 */
os.ui.ActionMenuCtrl.prototype.onProviderChange_ = function(newVal, oldVal) {
  if (oldVal) {
    oldVal.unlisten(os.ui.action.EventType.ENABLED_ACTIONS_CHANGED, this.onActionsChanged_, false, this);
  }

  if (newVal) {
    this.onActionsChanged_();
    newVal.listen(os.ui.action.EventType.ENABLED_ACTIONS_CHANGED, this.onActionsChanged_, false, this);
  }
};


/**
 * Arrange actions with structure based on their groupings and order.  Pulls all enabled actions, which may have been
 * contributed from multiple providers, and combines common sub-menus.  The return value is an array of
 * {os.ui.action.MenuItem} with nested {os.ui.action.MenuItemAction} and/or {os.ui.action.MenuItemList} entries.
 * @param {!Array.<!os.ui.action.Action>} actions List of enabled actions in any arbitrary order
 * @return {Array.<os.ui.action.MenuItem>}
 * @private
 */
os.ui.ActionMenuCtrl.prototype.constructMenu_ = function(actions) {
  if (!actions) {
    return [];
  }

  // Establish nested menu structure by placing all contributed actions into a JSON object using utility functions
  var menuStructure = {};
  goog.array.forEach(actions, function(action) {
    var menuOptions = action.getMenuOptions();
    if (menuOptions) {
      var subMenu = menuOptions.menu;
      if (subMenu) {
        var menuItemPlacement = subMenu.split('.');
        var existingEntry = goog.object.getValueByKeys(menuStructure, menuItemPlacement);

        if (existingEntry) {
          existingEntry[action.getTitle()] = action;
        } else {
          var actionDef = {};
          actionDef[action.getTitle()] = action;
          os.object.set(menuStructure, menuItemPlacement, actionDef);
        }
      } else {
        menuStructure[action.getTitle()] = action;
      }
    } else {
      menuStructure[action.getTitle()] = action;
    }
  }, this);

  // Convert the JSON menu structure into appropriately nested menu items
  var menuItems = [];
  this.insertMenuItems_(menuStructure, menuItems);
  return menuItems;
};


/**
 * Convenience function for converting a JSON object definition of menu items into an appropriate array of
 * {os.ui.action.MenuItem} with nested {os.ui.action.MenuItemAction} and/or {os.ui.action.MenuItemList} entries.
 * @param {Object} menuStructure JSON object structure which declares the depth and placement of the menu items
 * @param {Array} menuItems The list of menu items to which the converted menuStructure actions are placed.
 * @private
 * @suppress {deprecated}
 */
os.ui.ActionMenuCtrl.prototype.insertMenuItems_ = function(menuStructure, menuItems) {
  // insert item is sorted order
  goog.array.forEach(goog.object.getKeys(menuStructure), function(key) {
    var value = menuStructure[key];

    // You shouldn't use "value instanceof os.ui.action.Action" here because there is no guarantee that the
    // value was created in the same window context (instanceof does not work across window contexts). Therefore,
    // we'll use duck-typing.

    var action = /** @type {os.ui.action.Action} */ (value);
    if (action && action.getMenuOptions && action.getTitle) {
      goog.array.binaryInsert(
          menuItems,
          new os.ui.action.MenuItemAction(action),
          this.sortByDivisionThenOrder_);
    } else if (goog.isObject(value)) {
      var division;
      var keyTokens = key.split('/');
      if (keyTokens.length > 1) {
        key = keyTokens[1];
        division = keyTokens[0];
      }
      var menuItemList = new os.ui.action.MenuItemList(key, new os.ui.action.MenuOptions(null, division));
      var menuItemListActions = menuItemList.getItems();
      goog.array.binaryInsert(menuItems, menuItemList, this.sortByDivisionThenOrder_);
      this.insertMenuItems_(value, menuItemListActions);
    }
  }, this);

  // insert menu dividers and headings where appropriate
  var previousDivision = undefined;
  for (var i = 0; i < menuItems.length; i++) {
    var menuItem = menuItems[i];
    var division = undefined;
    var menuOptions = menuItem.getMenuOptions();
    division = menuOptions && menuOptions.division;
    if (previousDivision != division) {
      if (i > 0) {
        goog.array.insertAt(menuItems, new os.ui.action.MenuItemSeparator(), i);
        i++;
      }
      if (goog.isDefAndNotNull(division)) {
        goog.array.insertAt(menuItems, new os.ui.action.MenuItemSeparatorHeader(division.replace(/^[0-9]*:/, '')), i);
        i++;
      }
    }
    previousDivision = division;
  }
};


/**
 * Sorting function for actions based on their menu option settings
 * @param {!os.ui.action.MenuItem} a
 * @param {!os.ui.action.MenuItem} b
 * @return {number} A positive number if a is greater than or equal to b; a negative number otherwise.
 * @private
 */
os.ui.ActionMenuCtrl.prototype.sortByDivisionThenOrder_ = function(a, b) {
  var aDiv = a.getMenuOptions().division;
  var bDiv = b.getMenuOptions().division;
  var aOrder = undefined;
  var bOrder = undefined;

  if (aDiv === bDiv) {
    aOrder = a.getMenuOptions().order;
    bOrder = b.getMenuOptions().order;
    return (aOrder === bOrder) ? 1 : ((aOrder > bOrder) ? 1 : -1);
  } else {
    return (goog.isDefAndNotNull(aDiv) ?
        (goog.isDefAndNotNull(bDiv) ?
            ((aDiv === bDiv) ? 1 : ((aDiv > bDiv) ? 1 : -1)) : -1) : 1);
  }
};


/**
 * Checks the position and ensures that the menu doesn't run off the screen
 * @protected
 */
os.ui.ActionMenuCtrl.prototype.position = function() {
  var element = this.element;
  var pos = this.scope['position'] || element.position();

  this.timeout(function() {
    element.removeClass('right-menu');

    if (goog.isObject(pos)) {
      var x = pos.left || pos.x;
      var y = pos.top || pos.y;
      var w = element.outerWidth();
      var h = element.outerHeight();
      var viewportSize = goog.dom.getViewportSize();

      if (x + w > viewportSize.width - 5) {
        x = viewportSize.width - 5 - w;
        element.addClass('right-menu');
      } else if (x + 2 * w > viewportSize.width - 5) {
        element.addClass('right-menu');
      }

      x = x < 0 ? 5 : x;
      y = y < 0 ? 5 : y;

      if (y + h > viewportSize.height - 30) {
        y = viewportSize.height - 30 - h;
      }

      element.css('left', x + 'px');
      element.css('top', y + 'px');
    } else if (pos == 'right') {
      element.addClass('right-menu');
    }

    element.css('visibility', 'visible');
  }, 25);
};


/**
 * Called when a submenu is initialized. At initialization, the submenu DOM element does not exist yet,
 * so the DOM manipulation is done inside of a timeout which gives sufficient time for the element to
 * be added and its height/position to be read and set based on the viewport boundaries.
 */
os.ui.ActionMenuCtrl.prototype.positionSubmenu = function() {
  this.timeout(goog.bind(function() {
    if (this.element) {
      var submenu = this.element.find('.menu-item > .menu-container');
      if (submenu) {
        var pos = submenu.offset();

        if (goog.isObject(pos)) {
          var y = pos.top || pos.y;
          var h = submenu.outerHeight();
          var viewportSize = goog.dom.getViewportSize();
          y = y < 0 ? 5 : y;

          if (y + h > viewportSize.height - 30) {
            y = (viewportSize.height - y - h - 30);
            submenu.css('top', y + 'px');
          }
        }
      }
    }
  }, this), 50);
};
goog.exportProperty(os.ui.ActionMenuCtrl.prototype, 'positionSubmenu',
    os.ui.ActionMenuCtrl.prototype.positionSubmenu);


/**
 * Handle changes to the list of available actions
 * @private
 */
os.ui.ActionMenuCtrl.prototype.onActionsChanged_ = function() {
  var provider = /** @type {os.ui.action.ActionManager} */ (this.scope['provider']);
  this.scope['actions'] = this.constructMenu_(provider.getEnabledActions());
  os.ui.apply(this.scope);
};


/**
 * Add title to menu
 * @param {string} selector
 * @param {string} title
 */
os.ui.ActionMenuCtrl.prototype.addTitle = function(selector, title) {
  $(selector).children().prepend(title);
};


/**
 * Define the directive.
 * Provider passed into scope is of type {os.ui.action.ActionManager}
 * Position passed into scope is either and object with x, y attributes or a string indicating placement, like 'right'
 * Scope variables need surrounded in '' to work when compiled
 * @return {angular.Directive} the directive definition
 */
os.ui.actionMenuDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/menu/actionmenu.html',
    controller: os.ui.ActionMenuCtrl,
    controllerAs: 'actionMenu',
    scope: {
      'provider': '=',
      'position': '=',
      'visible': '@',
      'flatten': '@',
      'titletext': '@',
      'titleselector': '@'
    }
  };
};


os.ui.Module.directive('actionMenu', os.ui.actionMenuDirective);
