goog.declareModuleId('os.ui.NavBarCtrl');

import * as dispatcher from '../../dispatcher.js';
import {get} from '../list.js';
import {resize, removeResize} from '../ui.js';
import EventType from './navbareventtype.js';

const Disposable = goog.require('goog.Disposable');
const GoogEvent = goog.require('goog.events.Event');


/**
 * Controller for NavBars
 * @unrestricted
 */
export default class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * Bound resize handler.
     * @type {Function}
     * @private
     */
    this.resizeFn_ = this.onResize_.bind(this);
    resize(this.element, this.resizeFn_);

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.element && this.resizeFn_) {
      removeResize(this.element, this.resizeFn_);
    }

    this.scope = null;
    this.element = null;
  }

  /**
   * Get the width of the items in the navbar
   *
   * @return {number}
   * @export
   */
  getNavContentSize() {
    var size = 0;
    this.element.find('.nav-item').each(function(el) {
      size += $(this).outerWidth(true);
    });

    return size;
  }

  /**
   * Get footer ng-class string based on loaded navbar lists
   *
   * @param {string=} opt_leftListId The optional left list id
   * @param {string=} opt_middleListId The optional middle list id
   * @param {string=} opt_rightListId The optional right list id
   * @return {Array<string>} The resulting class string
   * @export
   */
  getFooterDynamicClasses(opt_leftListId, opt_middleListId, opt_rightListId) {
    var classes = [];

    var ids = [opt_leftListId, opt_middleListId, opt_rightListId].filter(function(el) {
      return el;
    });

    if (this.navItemsFromSingleList_(ids)) {
      var numItemsLeft = this.numNavItems_(opt_leftListId);
      var numItemsMiddle = this.numNavItems_(opt_middleListId);
      var numItemsRight = this.numNavItems_(opt_rightListId);

      if (numItemsLeft || numItemsMiddle) {
        classes.push('mr-auto');
      } else if (numItemsRight || numItemsMiddle) {
        classes.push('ml-auto');
      }
    } else {
      classes.push('flex-fill');
    }

    return classes;
  }

  /**
   * Returns true if navbar only contains elements from one list
   *
   * @param {Array<string>} listIds Array containing the list ids of the navbar lists
   * @return {boolean} true if NavBar elements come from a single list
   * @private
   */
  navItemsFromSingleList_(listIds) {
    var numListsPopulated = 0;
    listIds.forEach(function(id) {
      var list = get(id);
      if (list && list.length > 0) {
        numListsPopulated++;
      }
    });

    return numListsPopulated == 1;
  }

  /**
   * Number of navItems within the given list id
   *
   * @param {string=} opt_listId The list id
   * @return {number} the number of navItems in the list
   * @private
   */
  numNavItems_(opt_listId) {
    return opt_listId && get(opt_listId) ? get(opt_listId).length : 0;
  }

  /**
   * Handle nav resize events.
   *
   * @private
   */
  onResize_() {
    dispatcher.getInstance().dispatchEvent(new GoogEvent(EventType.RESIZE));
  }
}
