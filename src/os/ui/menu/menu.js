goog.declareModuleId('os.ui.menu.Menu');

import * as dispatcher from '../../dispatcher.js';
import GlobalMenuEventType from '../globalmenueventtype.js';
import * as osUi from '../ui.js';
import MenuEvent from './menuevent.js';
import MenuEventType from './menueventtype.js';
import UnclickableTypes from './unclickabletypes.js';

const Delay = goog.require('goog.async.Delay');
const {getAncestorByClass, getDocument} = goog.require('goog.dom');
const classlist = goog.require('goog.dom.classlist');
const {listen, unlisten} = goog.require('goog.events');
const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const Metrics = goog.require('os.metrics.Metrics');

const {default: MenuItem} = goog.requireType('os.ui.menu.MenuItem');


/**
 * Wrapper for a jQuery UI menu.
 *
 * @template T
 */
export default class Menu extends EventTarget {
  /**
   * Constructor.
   * @param {!MenuItem<T>} root The menu item data
   */
  constructor(root) {
    super();

    /**
     * The root menu item.
     * @type {!MenuItem<T>}
     * @private
     */
    this.root_ = root;

    /**
     * The menu context.
     * @type {T|undefined}
     * @private
     */
    this.context_ = undefined;

    /**
     * The position options.
     * @type {jQuery.PositionOptions}
     * @private
     */
    this.position_ = {};

    /**
     * The menu event target.
     * @type {Object|undefined}
     * @private
     */
    this.target_ = undefined;

    /**
     * @type {Delay}
     * @private
     */
    this.listenerDelay_ = new Delay(this.onAddOutsideListener_, 25, this);

    /**
     * @type {boolean}
     * @private
     */
    this.isOpen_ = false;

    /**
     * The menu HTML.
     * @type {?jQuery}
     * @private
     */
    this.menu_ = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.close();
    this.listenerDelay_.dispose();
  }

  /**
   * Get the root menu item.
   *
   * @return {!MenuItem<T>} The menu data
   */
  getRoot() {
    return this.root_;
  }

  /**
   * Set the root menu item.
   *
   * @param {!MenuItem<T>} root The menu data
   */
  setRoot(root) {
    this.root_ = root;
  }

  /**
   * If the menu is currently open.
   *
   * @return {boolean}
   */
  isOpen() {
    return this.isOpen_;
  }

  /**
   * Handle click event.
   *
   * @param {Event} e The event.
   * @private
   */
  onClick_(e) {
    // if we didn't click on something in the menu
    if (!$(e.target).closest('#menu').length) {
      // check to see if what was clicked was what originally opened the menu
      var opener = this.position_.of;
      var openerEl = null;
      var openerClicked = false;

      if (opener && opener.length && opener[0] instanceof Element) {
        // jQuery element
        openerEl = opener[0];
        openerClicked = !!openerEl && $(e.target).closest(openerEl).length;
      } else if (typeof opener === 'string' && e.target) {
        var jqEl = $(e.target).closest(opener);
        openerEl = jqEl[0];
        openerClicked = !!jqEl[0];
      }

      if (openerClicked && Menu.supportsToggle(openerEl)) {
        // the opener was clicked again. leave the open flag if the opener supports toggling a menu.
        this.close(false, true);
      } else {
        // close the menu
        this.close();
      }
    }
  }

  /**
   * Open the menu.
   *
   * @param {T} context The menu context.
   * @param {jQuery.PositionOptions} position The position options.
   * @param {Object=} opt_target The menu event target.
   * @param {boolean=} opt_dispatch Whether or not to dispatch an event. Defaults to true.
   */
  open(context, position, opt_target, opt_dispatch) {
    if (this.isOpen_) {
      // we clicked on whatever opened the menu, so close it and leave it closed
      this.close(opt_dispatch);
      return;
    }
    this.close(opt_dispatch);
    this.context_ = context || undefined;
    this.position_ = position || {};
    this.target_ = opt_target || this;

    var html = this.getRoot().render(this.context_, this.target_);
    html = '<ul id="menu" class="c-menu dropdown-menu show">' + html + '</ul>';

    // prune leading and trailing separators
    html = html.replace(/<ul><li>-<\/li>/g, '<ul>');
    html = html.replace(/<li>-<\/li><\/ul>/g, '</ul>');

    // verify that we have at least one item in the menu
    if (!/<li(\s|>)/.test(html)) {
      return;
    }

    this.menu_ = $(html);
    this.position_.collision = this.position_.collision || 'fit';

    $(document.body).append(
        // You might be tempted to use the 'position' field in this options object.
        // You'd be wrong. That only relates to sub-menu positioning.
        this.menu_.menu({
          'items': '> :not(.dropdown-header)',
          'select': this.onSelect.bind(this)
        }));

    // Some themes change the dropdown color based on if they are in the navbar. Lets do the same!
    var navbarParent = getAncestorByClass(this.position_.of[0], 'navbar');
    if (navbarParent) {
      var classParts = navbarParent.className.split(' ');
      var classes = classParts.filter(function(classname) {
        return classname.indexOf('bg-') != -1;
      });
      if (classes.length) {
        this.menu_.wrap('<div id="js-menu__wrapper" class="' + classes.join(' ') + '"></div>');
      }
    }

    this.menu_['position'](this.position_);
    this.listenerDelay_.start();

    var dispatch = opt_dispatch != null ? opt_dispatch : true;
    if (dispatch) {
      this.dispatchEvent(MenuEventType.OPEN);
    }

    this.isOpen_ = true;
    // jQuery menu is outside of the Angular lifecycle, so the menu needs to trigger a digest on its own
    osUi.apply(osUi.injector.get('$rootScope'));
  }

  /**
   * Reopen the menu to update it. If the menu isn't already open, nothing will happen.
   */
  reopen() {
    if (this.target_ && this.isOpen_) {
      // prevent open from closing the menu and returning early
      this.isOpen_ = false;
      this.open(this.context_, this.position_, this.target_, false);
    }
  }

  /**
   * Add listeners for mouse events outside the menu.
   *
   * @private
   */
  onAddOutsideListener_() {
    // ensure any previous listeners are removed prior to adding
    this.onRemoveOutsideListener_();

    var doc = getDocument();
    listen(doc, GoogEventType.MOUSEDOWN, this.onClick_, true, this);
    listen(doc, GoogEventType.POINTERDOWN, this.onClick_, true, this);
  }

  /**
   * Remove listeners for mouse events outside the menu.
   *
   * @private
   */
  onRemoveOutsideListener_() {
    var doc = getDocument();
    unlisten(doc, GoogEventType.MOUSEDOWN, this.onClick_, true, this);
    unlisten(doc, GoogEventType.POINTERDOWN, this.onClick_, true, this);
  }

  /**
   * Handle menu item selection.
   *
   * @param {Object} evt The jquery event
   * @param {angular.JQLite} ui The selected jquery element
   * @protected
   */
  onSelect(evt, ui) {
    var type = ui.item.attr('evt-type');

    if (type) {
      var item = this.getRoot().find(type);

      if (item && item.enabled && UnclickableTypes.indexOf(item.type) === -1) {
        /** @type {MenuEvent<T>} */
        var e = new MenuEvent(type, this.context_, this.target_);
        if (item.handler) {
          item.handler(e);
        } else {
          this.dispatchEvent(e);
        }

        if (item.metricKey) {
          Metrics.getInstance().updateMetric(item.metricKey, 1);
        }

        if (item.closeOnSelect) {
          this.close();
        }
      }
    }
  }

  /**
   * Close the menu.
   *
   * @param {boolean=} opt_dispatch Whether or not to dispatch an event. Defaults to true.
   * @param {boolean=} opt_leaveOpen Whether or not to leave isOpen_ alone (i.e. not set to false)
   */
  close(opt_dispatch, opt_leaveOpen) {
    if (this.menu_) {
      var dispatch = opt_dispatch != null ? opt_dispatch : true;
      if (dispatch && dispatcher.getInstance()) {
        dispatcher.getInstance().dispatchEvent(GlobalMenuEventType.MENU_CLOSE);
      }

      this.menu_.unwrap('#js-menu__wrapper');
      this.menu_.remove();
      this.menu_ = null;
    }

    this.context_ = undefined;
    this.position_ = {};
    this.target_ = undefined;

    this.onRemoveOutsideListener_();

    this.isOpen_ = opt_leaveOpen ? this.isOpen_ : false;
    // jQuery menu is outside of the Angular lifecycle, so the menu needs to trigger a digest on its own
    osUi.apply(osUi.injector.get('$rootScope'));
  }

  /**
   * @inheritDoc
   */
  dispatchEvent(evt) {
    var val = super.dispatchEvent(evt);
    var val2 = !evt.defaultPrevented ? dispatcher.getInstance().dispatchEvent(evt) : false;
    return val || val2;
  }

  /**
   * If an element supports toggling a menu.
   * @param {Element} el The element.
   * @return {boolean}
   */
  static supportsToggle(el) {
    return !!el &&
      (el.nodeName.toLowerCase() == 'button' ||
        classlist.contains(el, 'btn-group') ||
        classlist.contains(el, 'js-menu__toggle')
      );
  }
}
