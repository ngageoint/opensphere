goog.module('os.ui.menu.MenuItem');

const {defaultCompare, removeIf} = goog.require('goog.array');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');

const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const MenuItemOptions = goog.requireType('os.ui.menu.MenuItemOptions');


/**
 * @template T
 */
class MenuItem {
  /**
   * Constructor.
   * @param {MenuItemOptions} options The options
   */
  constructor(options) {
    this.type = options.type || MenuItemType.ITEM;
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
     * @type {Array<!MenuItem<T>>|undefined}
     */
    this.children = options.children != null ? options.children.map(function(c) {
      return new MenuItem(c);
    }) : undefined;

    /**
     * @type {function(this: MenuItem<T>, T, (Object|undefined))|undefined}
     */
    this.beforeRender = options.beforeRender;

    /**
     * @type {function(MenuEvent<T>)|undefined}
     */
    this.handler = options.handler;
  }

  /**
   * @param {!string} eventTypeOrLabel The event type or label to search for
   * @return {?MenuItem<T>} The menu item or null if it could not be found
   */
  find(eventTypeOrLabel) {
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
  }

  /**
   * Find a menu item, or create it as a child if not found.
   *
   * @param {!MenuItemOptions} options The options.
   * @return {?MenuItem<T>} The menu item or null if it could not be found
   */
  findOrCreate(options) {
    var val = null;

    var findKey = options.label || options.eventType;
    if (findKey) {
      val = this.find(findKey);

      if (!val) {
        val = this.addChild(options);
      }
    }

    return val;
  }

  /**
   * Add a new child to the menu item.
   *
   * @param {!(MenuItem<T>|MenuItemOptions)} options The options to define a new menu item
   * @return {!MenuItem<T>} The added menu item.
   */
  addChild(options) {
    /** @type {!MenuItem<T>} */
    var item = options instanceof MenuItem ? options : new MenuItem(options);

    if (!this.children) {
      this.children = [];
    }

    // Does this already exist as a child?
    var existingItem = this.children.find(function(child) {
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
  }

  /**
   * Remove a child from the menu item.
   *
   * @param {string} eventTypeOrLabel The event type or label to remove.
   * @return {boolean} If the child was removed.
   */
  removeChild(eventTypeOrLabel) {
    var rv = false;
    if (this.children) {
      rv = removeIf(this.children, function(item) {
        return item.eventType === eventTypeOrLabel || item.label === eventTypeOrLabel;
      });

      if (!this.children.length) {
        this.children = undefined;
      }
    }
    return rv;
  }

  /**
   * Generates menu html to be consumed by the JQuery UI menu plugin
   *
   * @param {T} context The menu context.
   * @param {Object=} opt_target The menu event target.
   * @return {!string} The menu html
   */
  render(context, opt_target) {
    if (this.beforeRender) {
      this.beforeRender(context, opt_target);
    }

    var types = MenuItemType;
    var visible = this.visible;
    var enabled = this.enabled;
    var type = this.type != null ? this.type : types.ITEM;
    var tooltip = this.tooltip != null ? this.tooltip : '';
    var html = '';
    var childHtml = '';

    if (type === types.ROOT || type === types.SUBMENU || type === types.GROUP) {
      if (this.children) {
        this.children.sort(MenuItem.sort_);

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

    var classes = [];
    var isItem = type !== types.SUBMENU && type !== types.GROUP && type !== types.SEPARATOR;

    html += '<li';
    if (type === types.SEPARATOR) {
      if (this.label) {
        classes.push('dropdown-header');
      } else {
        html += '>-</li>';
        return html;
      }
    }

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
  }

  /**
   * @param {!MenuItem} a The first item
   * @param {!MenuItem} b The second item
   * @return {number} per typical compare functions
   * @private
   */
  static sort_(a, b) {
    return defaultCompare(a.sort, b.sort) || defaultCompare(a.label, b.label);
  }
}

exports = MenuItem;
