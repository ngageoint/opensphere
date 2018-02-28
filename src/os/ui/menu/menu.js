goog.provide('os.ui.menu');
goog.provide('os.ui.menu.Menu');

goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('os.ui');
goog.require('os.ui.menu.MenuEvent');
goog.require('os.ui.menu.MenuEventType');
goog.require('os.ui.menu.MenuItem');



/**
 * Wrapper for a jQuery UI menu.
 * @param {!os.ui.menu.MenuItem<T>} root The menu item data
 * @constructor
 * @extends {goog.events.EventTarget}
 * @template T
 */
os.ui.menu.Menu = function(root) {
  os.ui.menu.Menu.base(this, 'constructor');

  /**
   * The root menu item.
   * @type {!os.ui.menu.MenuItem<T>}
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
   * The menu event target.
   * @type {Object|undefined}
   * @private
   */
  this.target_ = undefined;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.listenerDelay_ = new goog.async.Delay(this.onAddOutsideListener_, 25, this);
};
goog.inherits(os.ui.menu.Menu, goog.events.EventTarget);


/**
 * @inheritDoc
 */
os.ui.menu.Menu.prototype.disposeInternal = function() {
  os.ui.menu.Menu.base(this, 'disposeInternal');
  this.close();
  this.listenerDelay_.dispose();
};


/**
 * Get the root menu item.
 * @return {!os.ui.menu.MenuItem<T>} The menu data
 */
os.ui.menu.Menu.prototype.getRoot = function() {
  return this.root_;
};


/**
 * Set the root menu item.
 * @param {!os.ui.menu.MenuItem<T>} root The menu data
 */
os.ui.menu.Menu.prototype.setRoot = function(root) {
  this.root_ = root;
};


/**
 * Handle click event.
 * @param {Event} e The event.
 * @private
 */
os.ui.menu.Menu.prototype.onClick_ = function(e) {
  // if we didn't click on something in the menu
  if (!$(e.target).closest('#menu').length) {
    // close the menu
    this.close();
  }
};


/**
 * Open the menu.
 * @param {T} context The menu context.
 * @param {jQuery.PositionOptions} position The position options.
 * @param {Object=} opt_target The menu event target.
 */
os.ui.menu.Menu.prototype.open = function(context, position, opt_target) {
  this.close();
  this.context_ = context || undefined;
  this.target_ = opt_target || this;

  var html = this.getRoot().render(this.context_, this.target_);
  html = '<ul id="menu">' + html + '</ul>';

  // prune leading and trailing separators
  html = html.replace(/<ul><li>-<\/li>/g, '<ul>');
  html = html.replace(/<li>-<\/li><\/ul>/g, '</ul>');

  // verify that we have at least one item in the menu
  if (!/<li(\s|>)/.test(html)) {
    return;
  }

  this.menu_ = $(html);

  position = position || {};
  position.within = position.within || '#win-container';
  position.collision = position.collision || 'fit';

  $(document.body).append(
      // You might be tempted to use the 'position' field in this options object.
      // You'd be wrong. That only relates to sub-menu positioning.
      this.menu_.menu({
        'items': '> :not(.nav-header)',
        'select': this.onSelect.bind(this)
      }));

  this.menu_['position'](position);
  this.listenerDelay_.start();

  this.dispatchEvent(os.ui.menu.MenuEventType.OPEN);

  // jQuery menu is outside of the Angular lifecycle, so the menu needs to trigger a digest on its own
  os.ui.apply(os.ui.injector.get('$rootScope'));
};


/**
 * Add listeners for mouse events outside the menu.
 * @private
 */
os.ui.menu.Menu.prototype.onAddOutsideListener_ = function() {
  // ensure any previous listeners are removed prior to adding
  this.onRemoveOutsideListener_();

  var doc = goog.dom.getDocument();
  goog.events.listen(doc, goog.events.EventType.MOUSEDOWN, this.onClick_, true, this);
  goog.events.listen(doc, goog.events.EventType.POINTERDOWN, this.onClick_, true, this);
};


/**
 * Remove listeners for mouse events outside the menu.
 * @private
 */
os.ui.menu.Menu.prototype.onRemoveOutsideListener_ = function() {
  var doc = goog.dom.getDocument();
  goog.events.unlisten(doc, goog.events.EventType.MOUSEDOWN, this.onClick_, true, this);
  goog.events.unlisten(doc, goog.events.EventType.POINTERDOWN, this.onClick_, true, this);
};


/**
 * Handle menu item selection.
 * @param {Object} evt The jquery event
 * @param {angular.JQLite} ui The selected jquery element
 * @protected
 */
os.ui.menu.Menu.prototype.onSelect = function(evt, ui) {
  var type = ui.item.attr('evt-type');

  if (type) {
    var item = this.getRoot().find(type);

    if (item && item.enabled && os.ui.menu.UnclickableTypes.indexOf(item.type) === -1) {
      /** @type {os.ui.menu.MenuEvent<T>} */
      var e = new os.ui.menu.MenuEvent(type, this.context_, this.target_);
      if (item.handler) {
        item.handler(e);
      } else {
        this.dispatchEvent(e);
      }

      if (item.metricKey) {
        os.metrics.Metrics.getInstance().updateMetric(item.metricKey, 1);
      }

      this.close();
    }
  }
};


/**
 * Close the menu.
 * @param {boolean=} opt_dispatch Whether or not to dispatch an event. Defaults to true.
 */
os.ui.menu.Menu.prototype.close = function(opt_dispatch) {
  if (this.menu_) {
    var dispatch = opt_dispatch != null ? opt_dispatch : true;
    if (dispatch && os.dispatcher) {
      os.dispatcher.dispatchEvent(os.ui.GlobalMenuEventType.MENU_CLOSE);
    }

    this.menu_.remove();
    this.menu_ = null;
  }

  this.context_ = undefined;
  this.target_ = undefined;

  this.onRemoveOutsideListener_();

  // jQuery menu is outside of the Angular lifecycle, so the menu needs to trigger a digest on its own
  os.ui.apply(os.ui.injector.get('$rootScope'));
};


/**
 * @inheritDoc
 */
os.ui.menu.Menu.prototype.dispatchEvent = function(evt) {
  var val = os.ui.menu.Menu.base(this, 'dispatchEvent', evt);
  var val2 = !evt.defaultPrevented ? os.dispatcher.dispatchEvent(evt) : false;
  return val || val2;
};
