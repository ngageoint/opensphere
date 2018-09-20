goog.provide('os.ui.GlobalMenuCtrl');
goog.provide('os.ui.GlobalMenuEventType');
goog.provide('os.ui.globalMenuDirective');

goog.require('goog.async.Delay');
goog.require('goog.events.Event');
goog.require('os.ui.ActionMenuCtrl');
goog.require('os.ui.Module');


/**
 * @enum {string}
 */
os.ui.GlobalMenuEventType = {
  MENU_CLOSE: 'menuclose'
};



/**
 * Controller function for the ActionMenu directive
 * @constructor
 * @param {angular.Scope} $scope
 * @param {angular.JQLite} $element
 * @param {angular.$timeout} $timeout
 * @ngInject
 * @extends {os.ui.ActionMenuCtrl}
 */
os.ui.GlobalMenuCtrl = function($scope, $element, $timeout) {
  os.ui.GlobalMenuCtrl.base(this, 'constructor', $scope, $element, $timeout);

  this.element.removeClass('show');
  this.onDownBind_ = this.onClick_.bind(this);

  /**
   * @type {angular.JQLite|string|null}
   */
  this.target = null;

  /**
   * @type {Object?}
   */
  this.targetOffset = null;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.listenerDelay_ = new goog.async.Delay(this.onAddOutsideListener_, 25, this);
};
goog.inherits(os.ui.GlobalMenuCtrl, os.ui.ActionMenuCtrl);


/**
 * @inheritDoc
 */
os.ui.GlobalMenuCtrl.prototype.destroy = function() {
  os.ui.GlobalMenuCtrl.base(this, 'destroy');

  this.listenerDelay_.dispose();
  this.listenerDelay_ = null;
};


/**
 * Closes an already-open menu and dispatches a menu close event
 * @param {boolean=} opt_dispatch
 */
os.ui.GlobalMenuCtrl.prototype.close = function(opt_dispatch) {
  if (!goog.isDef(opt_dispatch)) {
    opt_dispatch = true;
  }

  this.target = null;
  this.targetOffset = null;

  if (this.element.hasClass('show')) {
    if (opt_dispatch && os.dispatcher) {
      os.dispatcher.dispatchEvent(os.ui.GlobalMenuEventType.MENU_CLOSE);
    }

    this.element.removeClass('show');
    this.element.removeClass('right-menu');
    this.element.blur();
  }
  this.element.find('#js-global-menu__title').remove();

  var doc = goog.dom.getDocument();
  doc.removeEventListener(goog.events.EventType.MOUSEDOWN, this.onDownBind_, true);
  doc.removeEventListener(goog.events.EventType.POINTERDOWN, this.onDownBind_, true);
  doc.removeEventListener(goog.events.EventType.SCROLL, this.onScroll_.bind(this), true);

  os.ui.apply(this.scope);
};


/**
 * Opens a menu
 */
os.ui.GlobalMenuCtrl.prototype.open = function() {
  os.ui.apply(this.scope);
  this.listenerDelay_.start();
};


/**
 * @private
 */
os.ui.GlobalMenuCtrl.prototype.onAddOutsideListener_ = function() {
  var doc = goog.dom.getDocument();
  doc.addEventListener(goog.events.EventType.MOUSEDOWN, this.onDownBind_, true);
  doc.addEventListener(goog.events.EventType.POINTERDOWN, this.onDownBind_, true);
  doc.addEventListener(goog.events.EventType.SCROLL, this.onScroll_.bind(this), true);
};


/**
 * Click handler
 * @param {Event} e
 * @private
 */
os.ui.GlobalMenuCtrl.prototype.onClick_ = function(e) {
  // if we didn't click on something in the menu
  if (!$(e.target).closest('#js-global-menu').length) {
    // close the menu
    this.close();
  }
};


/**
 * @inheritDoc
 */
os.ui.GlobalMenuCtrl.prototype.invoke = function(action) {
  if (os.ui.GlobalMenuCtrl.superClass_.invoke.call(this, action) && !action.doNotCloseOnInvoke) {
    this.close();
    return true;
  }

  return false;
};


/**
 * Checks the position and ensures that the menu doesn't run off the screen
 * @override
 * @protected
 */
os.ui.GlobalMenuCtrl.prototype.position = function() {
  var element = this.element;
  var pos = this.scope['position'] || element.position();

  this.timeout(function() {
    if (goog.isObject(pos)) {
      var x = pos.left || pos.right || pos.x;
      var y = pos.top || pos.bottom || pos.y;
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

      // offset the menu from the bottom if it's too tall
      var yThreshold = 50;
      if (y + h > viewportSize.height - yThreshold) {
        y = viewportSize.height - yThreshold - h;
      }

      // clear everything before setting
      element.css('top', '');
      element.css('bottom', '');
      element.css('left', '');
      element.css('right', '');

      element.css(goog.isDef(pos['right']) ? 'right' : 'left', x + 'px');
      element.css(goog.isDef(pos['bottom']) ? 'bottom' : 'top', y + 'px');
    } else if (pos == 'right') {
      element.addClass('right-menu');
    }

    element.addClass('show');
  }, 5);
};


/**
 * Set target
 * @param {angular.JQLite|string} target
 */
os.ui.GlobalMenuCtrl.prototype.setTarget = function(target) {
  this.target = target;
  this.targetOffset = $(target).offset();
};


/**
 * Close window if target position changed
 * @private
 */
os.ui.GlobalMenuCtrl.prototype.onScroll_ = function() {
  if (this.targetOffset) {
    var currPos = $(this.target).offset();
    if (this.targetOffset['left'] != currPos['left'] || this.targetOffset['top'] != currPos['top']) {
      os.ui.GlobalMenuCtrl.closeMenu();
    }
  }
};


/**
 * Opens a menu
 * @param {os.ui.action.ActionManager|os.ui.menu.Menu} provider The action menu manager that supplies the menu
 * @param {{
 *  x: (number|undefined),
 *  y: (number|undefined),
 *  left: (number|undefined),
 *  right: (number|undefined),
 *  top: (number|undefined),
 *  bottom: (number|undefined)
 *  }|string} position The position relative to the target
 * @param {(angular.JQLite|string)=} opt_target An optional target selector to position from
 * @param {?angular.JQLite=} opt_root Optional root element containing the target
 * @param {?string=} opt_title Optional title html for the menu
 */
os.ui.openMenu = function(provider, position, opt_target, opt_root, opt_title) {
  var menuEl = angular.element('#js-global-menu');
  var s = menuEl.scope();
  s['provider'] = provider;
  var ctrl = /** @type {os.ui.GlobalMenuCtrl} */ (s['actionMenu']);
  os.ui.GlobalMenuCtrl.closeMenu();

  // update the menu title if provided
  if (opt_title) {
    ctrl.addTitle('#js-global-menu', '<div id="js-global-menu__title" class="text-truncate">' + opt_title + '</div>');
  }

  if (opt_target) {
    ctrl.setTarget(opt_target);
  }

  var timeout = /** @type {angular.$timeout} */ (os.ui.injector.get('$timeout'));
  if (timeout) {
    // the menu may need to be updated before we position it, in particular for right orientation. call the positioning
    // logic after a timeout so the menu is reconstructed first.
    timeout(goog.partial(os.ui.positionMenu_, position, opt_target, opt_root));
  } else {
    // this shouldn't happen, but if it does we don't want to prevent the menu from being opened
    os.ui.positionMenu_(position, opt_target, opt_root);
  }
};


/**
 * Allow closing the current global menu if its up
 */
os.ui.GlobalMenuCtrl.closeMenu = function() {
  var menuEl = angular.element('#js-global-menu');
  var s = menuEl.scope();
  var ctrl = /** @type {os.ui.GlobalMenuCtrl} */ (s['actionMenu']);

  // close any open menu
  ctrl.close();
};


/**
 * Opens a menu
 * @param {{
 *  x: (number|undefined),
 *  y: (number|undefined),
 *  left: (number|undefined),
 *  right: (number|undefined),
 *  top: (number|undefined),
 *  bottom: (number|undefined)
 *  }|string} position The position relative to the target
 * @param {(angular.JQLite|string)=} opt_target An optional target selector to position from
 * @param {?angular.JQLite=} opt_root Optional root element containing the target
 * @private
 */
os.ui.positionMenu_ = function(position, opt_target, opt_root) {
  var menuEl = angular.element('#js-global-menu');
  var s = menuEl.scope();
  var ctrl = /** @type {os.ui.GlobalMenuCtrl} */ (s['actionMenu']);

  var targetEl;
  if (goog.isString(opt_target)) {
    // target is a selector from the document or a root element
    targetEl = goog.isDefAndNotNull(opt_root) ? opt_root.find(opt_target) : angular.element(opt_target);
  } else if (goog.isDef(opt_target)) {
    // target is an element
    targetEl = opt_target;
  }

  var p = position;
  if (goog.isDefAndNotNull(targetEl)) {
    var pos = /** @type {{left: number, top:number}} */ (targetEl.offset());
    if (pos.top) {
      pos.top -= $(document).scrollTop();
    }
    if (goog.isString(position)) {
      var parts = position.split(/\s+/);
      position = parts[0];
      var offset = parts.length > 1 ? parseInt(parts[1], 10) : 2;

      if (position == 'right') {
        // align the right edges of the target/menu, position offset px below the target
        var menuX = pos.left - menuEl.outerWidth() + targetEl.outerWidth();
        var menuY = pos.top + targetEl.outerHeight() + offset;
        p = /** @type {{x: number, y: number}} */ ({x: menuX, y: menuY});
      } else if (position == 'bottom') {
        // align the bottom edge of the menu with the offset px above the top edge of the target
        menuY = pos.top - offset;
        p = {x: pos.left, bottom: menuEl.parent().outerHeight() - menuY};
      } else {
        // align the left edges of the target/menu, position offset below the target
        p = {x: pos.left, y: pos.top + targetEl.outerHeight() + offset};
      }
    } else {
      p.x += pos.left;
      p.y += pos.top;
    }
  }

  s = menuEl.scope();
  s['position'] = p;

  // if we want to support animation in the future, this needs to be delayed by the amount of
  // time it takes the animation to finish
  ctrl.open();
};


/**
 * Defines a global menu directive. You should only need one of these. See os.ui.openMenu().
 * @return {angular.Directive} the directive definition
 */
os.ui.globalMenuDirective = function() {
  var dir = os.ui.actionMenuDirective();
  dir['scope'] = true;
  dir['controller'] = os.ui.GlobalMenuCtrl;
  return dir;
};

os.ui.Module.directive('globalMenu', os.ui.globalMenuDirective);
