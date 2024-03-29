/* eslint-disable import/no-deprecated */
goog.declareModuleId('os.ui.ActionMenuUI');

import Metrics from '../metrics/metrics.js';
import {setValue} from '../object/object.js';
import {ROOT} from '../os.js';
import EventType from './action/actioneventtype.js';
import MenuItemAction from './action/menuitemaction.js';
import MenuItemList from './action/menuitemlist.js';
import MenuItemSeparator from './action/menuitemseparator.js';
import MenuItemSeparatorHeader from './action/menuitemseparatorheader.js';
import MenuOptions from './action/menuoptions.js';
import Module from './module.js';
import {apply} from './ui.js';

const {binaryInsert, insertAt} = goog.require('goog.array');
const {getViewportSize} = goog.require('goog.dom');
const {listen, unlistenByKey} = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const {getValueByKeys} = goog.require('goog.object');

const {default: Action} = goog.requireType('os.ui.action.Action');
const {default: ActionManager} = goog.requireType('os.ui.action.ActionManager');
const {default: MenuItem} = goog.requireType('os.ui.action.MenuItem');


/**
 * Define the directive.
 * Provider passed into scope is of type {ActionManager}
 * Position passed into scope is either and object with x, y attributes or a string indicating placement, like 'right'
 * Scope variables need surrounded in '' to work when compiled
 *
 * @return {angular.Directive} the directive definition
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/menu/actionmenu.html',
  controller: Controller,
  controllerAs: 'actionMenu',
  scope: {
    'provider': '=',
    'position': '=',
    'visible': '@',
    'flatten': '@',
    'titletext': '@',
    'titleselector': '@',
    'isSubmenu': '=?',
    'isMoreButton': '=?'
  }
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'action-menu';

Module.directive('actionMenu', directive);

/**
 * Controller function for the ActionMenu directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {angular.Scope} $scope
   * @param {angular.JQLite} $element
   * @param {angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    $scope['path'] = ROOT;

    /**
     * @type {boolean}
     */
    $scope['isFlat'] = $scope['flatten'] == 'true';

    /**
     * @type {number}
     */
    $scope['menuLimit'] = 25;

    /**
     * @type {boolean}
     */
    $scope['isSubmenu'] = false;

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
      this.key = listen(this.element[0], GoogEventType.CONTEXTMENU, this.killRightClick_, true, this);
    }

    if (this.scope['titletext'] && this.scope['titleselector']) {
      this.addTitle(this.scope['titleselector'], this.scope['titletext']);
    }

    var provider = /** @type {ActionManager} */ (this.scope['provider']);
    if ($scope['visible'] == 'true' && provider && provider.hasEnabledActions()) {
      this.position();
    }

    $scope.$on('$destroy', this.destroy.bind(this));
    this.destroyers_.push($scope.$watch('provider', this.onProviderChange_.bind(this)));
    this.destroyers_.push($scope.$watch('position', this.onPositionChange_.bind(this)));
  }

  /**
   * Clean up
   *
   * @protected
   */
  destroy() {
    this.onProviderChange_(null, this.scope['provider']);

    for (var i = 0, n = this.destroyers_.length; i < n; i++) {
      this.destroyers_[i]();
    }

    if (this.key) {
      unlistenByKey(this.key);
      this.key = null;
    }

    this.element = null;
    this.timeout_ = null;
    this.scope = null;
  }

  /**
   * @param {goog.events.BrowserEvent} event
   * @private
   */
  killRightClick_(event) {
    if (event.button === 2) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Invokes a menu action on the provider
   *
   * @param {Action} action
   * @return {boolean} True if an action was invoked, false otherwise
   * @export
   */
  invoke(action) {
    var provider = this.scope['provider'];
    if (action && typeof action.getEventType === 'function') {
      // record action metric
      Metrics.getInstance().updateMetric(action.getMetricKey(), 1);
      provider.invoke(action.getEventType());
      return true;
    }

    return false;
  }

  /**
   * Handler for changes to position on the $scope.
   *
   * @param {Object<string, number>|undefined} newVal
   * @param {Object<string, number>|undefined} oldVal
   * @private
   */
  onPositionChange_(newVal, oldVal) {
    if (newVal != oldVal) {
      this.position();
    }
  }

  /**
   * Handles changes to the provider
   *
   * @param {ActionManager} newVal
   * @param {ActionManager} oldVal
   * @private
   */
  onProviderChange_(newVal, oldVal) {
    if (oldVal) {
      oldVal.unlisten(EventType.ENABLED_ACTIONS_CHANGED, this.onActionsChanged_, false, this);
    }

    if (newVal) {
      this.onActionsChanged_();
      newVal.listen(EventType.ENABLED_ACTIONS_CHANGED, this.onActionsChanged_, false, this);
    }
  }

  /**
   * Arrange actions with structure based on their groupings and order.  Pulls all enabled actions, which may have been
   * contributed from multiple providers, and combines common sub-menus.  The return value is an array of
   * {MenuItem} with nested {MenuItemAction} and/or {MenuItemList} entries.
   *
   * @param {!Array<!Action>} actions List of enabled actions in any arbitrary order
   * @return {Array<MenuItem>}
   * @private
   */
  constructMenu_(actions) {
    if (!actions) {
      return [];
    }

    // Establish nested menu structure by placing all contributed actions into a JSON object using utility functions
    var menuStructure = {};
    actions.forEach(function(action) {
      var menuOptions = action.getMenuOptions();
      if (menuOptions) {
        var subMenu = menuOptions.menu;
        if (subMenu) {
          var menuItemPlacement = subMenu.split('.');
          var existingEntry = getValueByKeys(menuStructure, menuItemPlacement);

          if (existingEntry) {
            existingEntry[action.getTitle()] = action;
          } else {
            var actionDef = {};
            actionDef[action.getTitle()] = action;
            setValue(menuStructure, menuItemPlacement, actionDef);
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
  }

  /**
   * Convenience function for converting a JSON object definition of menu items into an appropriate array of
   * {MenuItem} with nested {MenuItemAction} and/or {MenuItemList} entries.
   *
   * @param {Object} menuStructure JSON object structure which declares the depth and placement of the menu items
   * @param {Array} menuItems The list of menu items to which the converted menuStructure actions are placed.
   * @private
   * @suppress {deprecated}
   */
  insertMenuItems_(menuStructure, menuItems) {
    // insert item is sorted order
    if (menuStructure) {
      Object.keys(menuStructure).forEach(function(key) {
        var value = menuStructure[key];

        // You shouldn't use "value instanceof Action" here because there is no guarantee that the
        // value was created in the same window context (instanceof does not work across window contexts). Therefore,
        // we'll use duck-typing.

        var action = /** @type {Action} */ (value);
        if (action && action.getMenuOptions && action.getTitle) {
          binaryInsert(
              menuItems,
              new MenuItemAction(action),
              this.sortByDivisionThenOrder_);
        } else if (goog.isObject(value)) {
          var division;
          var keyTokens = key.split('/');
          if (keyTokens.length > 1) {
            key = keyTokens[1];
            division = keyTokens[0];
          }
          var menuItemList = new MenuItemList(key, new MenuOptions(null, division));
          var menuItemListActions = menuItemList.getItems();
          binaryInsert(menuItems, menuItemList, this.sortByDivisionThenOrder_);
          this.insertMenuItems_(value, menuItemListActions);
        }
      }, this);
    }

    // insert menu dividers and headings where appropriate
    var previousDivision = undefined;
    for (var i = 0; i < menuItems.length; i++) {
      var menuItem = menuItems[i];
      var division = undefined;
      var menuOptions = menuItem.getMenuOptions();
      division = menuOptions && menuOptions.division;
      if (previousDivision != division) {
        if (i > 0) {
          insertAt(menuItems, new MenuItemSeparator(), i);
          i++;
        }
        if (division != null) {
          insertAt(menuItems, new MenuItemSeparatorHeader(division.replace(/^[0-9]*:/, '')), i);
          i++;
        }
      }
      previousDivision = division;
    }
  }

  /**
   * Sorting function for actions based on their menu option settings
   *
   * @param {!MenuItem} a
   * @param {!MenuItem} b
   * @return {number} A positive number if a is greater than or equal to b; a negative number otherwise.
   * @private
   */
  sortByDivisionThenOrder_(a, b) {
    var aDiv = a.getMenuOptions().division;
    var bDiv = b.getMenuOptions().division;
    var aOrder = undefined;
    var bOrder = undefined;

    if (aDiv === bDiv) {
      aOrder = a.getMenuOptions().order;
      bOrder = b.getMenuOptions().order;
      return (aOrder === bOrder) ? 1 : ((aOrder > bOrder) ? 1 : -1);
    } else {
      return aDiv != null ?
        (bDiv != null ?
          ((aDiv === bDiv) ? 1 : ((aDiv > bDiv) ? 1 : -1)) : -1) : 1;
    }
  }

  /**
   * Checks the position and ensures that the menu doesn't run off the screen
   *
   * @protected
   */
  position() {
    var element = this.element;
    var pos = this.scope['position'] || element.position();

    this.timeout(function() {
      element.removeClass('right-menu');

      if (goog.isObject(pos)) {
        var x = pos.left || pos.x;
        var y = pos.top || pos.y;
        var w = element.outerWidth();
        var h = element.outerHeight();
        var viewportSize = getViewportSize();

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

      element.addClass('show');
    }, 25);
  }

  /**
   * Called when a submenu is initialized. At initialization, the submenu DOM element does not exist yet,
   * so the DOM manipulation is done inside of a timeout which gives sufficient time for the element to
   * be added and its height/position to be read and set based on the viewport boundaries.
   *
   * @export
   */
  positionSubmenu() {
    this.timeout(function() {
      if (this.element && !this.scope['isFlat']) {
        var submenus = this.element.find('.js-action-menu-item-list .js-dropdown-submenu');
        var submenu = submenus.find('.js-action-menu-item-list');
        if (submenu && submenu.length > 0) {
          submenu.scope()['menuLimit'] = this.calcNumItemsToDisplay_(submenu);
          apply(submenu.scope());

          var pos = submenu.offset();

          if (goog.isObject(pos)) {
            var y = pos.top || pos.y;
            var h = submenu.outerHeight();
            var viewportSize = getViewportSize();
            var outerMenuWidth = this.element.outerWidth();
            var outerMenuPos = this.element.offset();
            y = y < 0 ? 5 : y;

            var parentEl = submenu[0].parentElement;
            var hoveredElPos = submenu.closest('.js-dropdown-submenu, .dropdown-item').offset();

            if (h > viewportSize.height - 30) {
              y = outerMenuPos.top * -1;
              parentEl.style.top = y + 'px';
            } else if (y + h > viewportSize.height - 30) {
              y = (viewportSize.height - h - 30 - this.element.offset().top);
              parentEl.style.top = y + 'px';
            } else {
              y = hoveredElPos.top - outerMenuPos.top;
              parentEl.style.top = y + 'px';
            }

            var x = outerMenuPos.left || outerMenuPos.x;
            if (x + outerMenuWidth + parentEl.offsetWidth > viewportSize.width &&
                parentEl.offsetWidth <= x) {
              parentEl.style.left = 'auto';
              parentEl.style.right = '100%';
            }
          }
        }
      }
    }.bind(this), 50, true);
  }

  /**
   * Calculate the number of items to show on the screen.
   *
   * @param {Object} submenu Submenu element
   * @return {number} Number of menu/submenu items to display
   * @private
   */
  calcNumItemsToDisplay_(submenu) {
    var viewportSize = getViewportSize();
    var items = submenu.find('.js-dropdown-item');
    var numItemsToDisplay = 0;
    if (items && items.length > 0) {
      var itemHeight = items[0].offsetHeight;
      var numTotalItems = items.length;
      var usedHeight = submenu.outerHeight() - (numTotalItems * itemHeight);
      numItemsToDisplay = parseInt(((viewportSize.height - usedHeight) / itemHeight) - 1, 10);
    }

    if (numItemsToDisplay < numTotalItems) {
      submenu.scope()['isMoreButton'] = true;
    }
    return numItemsToDisplay;
  }

  /**
   * Handle changes to the list of available actions
   *
   * @private
   */
  onActionsChanged_() {
    var provider = /** @type {ActionManager} */ (this.scope['provider']);
    this.scope['actions'] = this.constructMenu_(provider.getEnabledActions());
    this.scope['menuLimit'] = 100;
    this.scope['isMoreButton'] = false;
    apply(this.scope);
  }

  /**
   * Add title to menu
   *
   * @param {string} selector
   * @param {string} title
   */
  addTitle(selector, title) {
    $(selector).children().prepend(title);
  }

  /**
   * Get the limit of actions to show in the menu.
   *
   * @return {number} Action item menu limit
   */
  getLimit() {
    if (this.scope['isFlat']) {
      return 100;
    }

    return this.scope['menuLimit'];
  }

  /**
   * Reset the flag to show the more button.
   */
  clearMoreButton() {
    this.scope['isMoreButton'] = false;
  }

  /**
   * Take action since there are more reults in the submenu than what will fit on the screen.
   *
   * @export
   */
  handleMoreResults() {
    this.scope['provider'].invokeMoreResultsAction(this.element);

    this.close();
  }
}
