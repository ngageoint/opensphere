goog.provide('os.ui.menu.MenuItem');
goog.provide('os.ui.menu.MenuItemOptions');
goog.provide('os.ui.menu.MenuItemType');

goog.require('goog.array');


goog.require('ol.array');


/**
 * @enum {string}
 */
os.ui.menu.MenuItemType = {
  ROOT: 'root',
  ITEM: 'item',
  SEPARATOR: 'separator',
  GROUP: 'group',
  SUBMENU: 'submenu',
  CHECK: 'check',
  RADIO: 'radio'
};


/**
 * @type {Array<os.ui.menu.MenuItemType>}
 */
os.ui.menu.UnclickableTypes = [
  os.ui.menu.MenuItemType.GROUP,
  os.ui.menu.MenuItemType.SUBMENU,
  os.ui.menu.MenuItemType.SEPARATOR];


/**
 * @typedef {{
 *  type: (os.ui.menu.MenuItemType|undefined),
 *  eventType: (string|undefined),
 *  label: (string|undefined),
 *  metricKey: (string|undefined),
 *  visible: (boolean|undefined),
 *  enabled: (boolean|undefined),
 *  selected: (boolean|undefined),
 *  closeOnSelect: (boolean|undefined),
 *  icons: (!Array<!string>|undefined),
 *  tooltip: (string|undefined),
 *  shortcut: (string|undefined),
 *  sort: (number|undefined),
 *  children: (Array<!os.ui.menu.MenuItemOptions>|undefined),
 *  beforeRender: (function(this: os.ui.menu.MenuItem, *)|undefined),
 *  handler: (function(os.ui.menu.MenuEvent)|undefined)
 * }}
 */
os.ui.menu.MenuItemOptions;


/**
 * @param {os.ui.menu.MenuItemOptions} options The options
 * @constructor
 * @template T
 */
os.ui.menu.MenuItem = function(options) {
  this.type = options.type || os.ui.menu.MenuItemType.ITEM;
  this.eventType = options.eventType;
  this.metricKey = options.metricKey;
  this.label = options.label;
  this.visible = options.visible != null ? options.visible : true;
  this.enabled = options.enabled != null ? options.enabled : true;
  this.selected = options.selected;
  this.icons = options.icons;
  this.tooltip = options.tooltip;
  this.shortcut = options.shortcut;
  this.sort = options.sort || 0;
  this.closeOnSelect = options.closeOnSelect != null ? options.closeOnSelect : true;

  /**
   * @type {Array<!os.ui.menu.MenuItem<T>>|undefined}
   */
  this.children = options.children != null ? options.children.map(function(c) {
    return new os.ui.menu.MenuItem(c);
  }) : undefined;

  /**
   * @type {function(this: os.ui.menu.MenuItem<T>, T, (Object|undefined))|undefined}
   */
  this.beforeRender = options.beforeRender;

  /**
   * @type {function(os.ui.menu.MenuEvent<T>)|undefined}
   */
  this.handler = options.handler;
};


/**
 * @param {!string} eventTypeOrLabel The event type or label to search for
 * @return {?os.ui.menu.MenuItem<T>} The menu item or null if it could not be found
 */
os.ui.menu.MenuItem.prototype.find = function(eventTypeOrLabel) {
  if (this.label === eventTypeOrLabel || this.eventType === eventTypeOrLabel) {
    return this;
  }

  var val = null;
  if (this.children) {
    for (var i = 0, ii = this.children.length; i < ii; i++) {
      val = this.children[i].find(eventTypeOrLabel);

      if (val) {
        break;
      }
    }
  }

  return val;
};


/**
 * Find a menu item, or create it as a child if not found.
 *
 * @param {!os.ui.menu.MenuItemOptions} options The options.
 * @return {?os.ui.menu.MenuItem<T>} The menu item or null if it could not be found
 */
os.ui.menu.MenuItem.prototype.findOrCreate = function(options) {
  var val = null;

  var findKey = options.label || options.eventType;
  if (findKey) {
    val = this.find(findKey);

    if (!val) {
      val = this.addChild(options);
    }
  }

  return val;
};


/**
 * Add a new child to the menu item.
 *
 * @param {!(os.ui.menu.MenuItem<T>|os.ui.menu.MenuItemOptions)} options The options to define a new menu item
 * @return {!os.ui.menu.MenuItem<T>} The added menu item.
 */
os.ui.menu.MenuItem.prototype.addChild = function(options) {
  /** @type {!os.ui.menu.MenuItem<T>} */
  var item = options instanceof os.ui.menu.MenuItem ? options : new os.ui.menu.MenuItem(options);

  if (!this.children) {
    this.children = [];
  }

  // Does this already exist as a child?
  var existingItem = ol.array.find(this.children, function(child) {
    return child.type == item.type &&
      child.eventType == item.eventType &&
      child.label == item.label &&
      child.metricKey == item.metricKey &&
      child.tooltip == item.tooltip &&
      child.sort == item.sort;
  });

  if (!existingItem) {
    this.children.push(item);
    return item;
  } else {
    return existingItem;
  }
};


/**
 * Remove a child from the menu item.
 *
 * @param {string} eventTypeOrLabel The event type or label to remove.
 * @return {boolean} If the child was removed.
 */
os.ui.menu.MenuItem.prototype.removeChild = function(eventTypeOrLabel) {
  var rv = false;
  if (this.children) {
    rv = goog.array.removeIf(this.children, function(item) {
      return item.eventType === eventTypeOrLabel || item.label === eventTypeOrLabel;
    });

    if (!this.children.length) {
      this.children = undefined;
    }
  }
  return rv;
};


/**
 * Generates menu html to be consumed by the JQuery UI menu plugin
 *
 * @param {T} context The menu context.
 * @param {Object=} opt_target The menu event target.
 * @return {!string} The menu html
 */
os.ui.menu.MenuItem.prototype.render = function(context, opt_target) {
  if (this.beforeRender) {
    this.beforeRender(context, opt_target);
  }

  var types = os.ui.menu.MenuItemType;
  var visible = this.visible;
  var enabled = this.enabled;
  var type = this.type != null ? this.type : types.ITEM;
  var tooltip = this.tooltip != null ? this.tooltip : '';
  var html = '';
  var childHtml = '';

  if (type === types.ROOT || type === types.SUBMENU || type === types.GROUP) {
    if (this.children) {
      this.children.sort(os.ui.menu.MenuItem.sort_);

      for (var i = 0, ii = this.children.length; i < ii; i++) {
        childHtml += this.children[i].render(context, opt_target);
      }
    }
  }

  if (type === types.ROOT) {
    return childHtml;
  }

  // hide groups/submenus without children from the menu
  if (!childHtml && (type === types.GROUP || type === types.SUBMENU)) {
    visible = false;
  }

  // visible
  if (!visible) {
    return html;
  }

  html += '<li';
  if (type === types.SEPARATOR) {
    html += '>-</li>';
    return html;
  }

  var classes = [];
  var isItem = type !== types.SUBMENU && type !== types.GROUP;

  // group/category
  if (type === types.GROUP) {
    if (this.label) {
      classes.push('dropdown-header');
    } else {
      classes.push('u-dropdown-header__empty');
    }
  }

  // enabled disabled
  if (!enabled) {
    classes.push('disabled');
  }

  if (isItem) {
    classes.push('dropdown-item');
  }

  if (classes.length > 0) {
    html += ' class="' + classes.join(' ') + '"';
  }

  if (isItem) {
    html += ' evt-type="' + (this.eventType || this.label) + '"';
  }

  html += (tooltip ? ' title="' + tooltip + '"' : '') + '>';

  // start wrapper div (required by jquery-ui 1.12+)
  html += '<div>';

  // hotkey/shortcut
  if (this.shortcut) {
    html += '<span class="text-muted d-inline-block float-right pl-2">' + this.shortcut + '</span>';
  }

  // checkbox type
  if (type === types.CHECK) {
    html += '<i class="fa fa-fw fa-' + (this.selected ? 'check-' : '') + 'square-o"></i>';
  }

  // radio type
  if (type === types.RADIO) {
    html += '<i class="fa fa-fw fa-' + (this.selected ? 'dot-' : '') + 'circle-o"></i>';
  }

  // icons
  if (this.icons) {
    for (i = 0, ii = this.icons.length; i < ii; i++) {
      html += this.icons[i];
    }
  }

  // label
  html += '<span class="text-truncate">' + this.label + '</span>';

  // end wrapper div (required by jquery-ui 1.12+)
  html += '</div>';

  // sub menus
  html += type === types.SUBMENU ? '<ul>' : '</li>';

  html += childHtml;

  // close sub menu
  if (type === types.SUBMENU) {
    html += '</ul></li>';
  }

  return html;
};


/**
 * @param {!os.ui.menu.MenuItem} a The first item
 * @param {!os.ui.menu.MenuItem} b The second item
 * @return {number} per typical compare functions
 * @private
 */
os.ui.menu.MenuItem.sort_ = function(a, b) {
  return goog.array.defaultCompare(a.sort, b.sort) || goog.array.defaultCompare(a.label, b.label);
};
