goog.provide('plugin.cookbook_submenu.CookbookSubmenu');

goog.require('os.plugin.AbstractPlugin');
goog.require('os.plugin.PluginManager');


/**
 * Cookbook example of a submenu
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.cookbook_submenu.CookbookSubmenu = function() {
  plugin.cookbook_submenu.CookbookSubmenu.base(this, 'constructor');
  this.id = plugin.cookbook_submenu.ID;
  this.errorMessage = null;
};
goog.inherits(plugin.cookbook_submenu.CookbookSubmenu, os.plugin.AbstractPlugin);

/**
 * @type {string}
 * @const
 */
plugin.cookbook_submenu.ID = 'cookbook_submenu';

/**
 * @type {string}
 * @const
 */
plugin.cookbook_submenu.MYGROUP = 'Cookbook Group';

/**
 * Our event types
 * @enum {string}
 */
plugin.cookbook_submenu.EventType = {
  DO_SOMETHING: 'cookbook:do_y',
  DO_ANOTHER_THING: 'cookbook:do_x'
};


/**
 * @inheritDoc
 */
plugin.cookbook_submenu.CookbookSubmenu.prototype.init = function() {
  var menu = os.ui.menu.SPATIAL;
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(plugin.cookbook_submenu.MYGROUP);
    if (!group) {
      group = root.addChild({
        type: os.ui.menu.MenuItemType.GROUP,
        label: plugin.cookbook_submenu.MYGROUP,
        tooltip: 'Added by cookbook submenu example',
        beforeRender: plugin.cookbook_submenu.shouldShowGroup_
      });
    }
    var submenu1 = group.addChild({
      type: os.ui.menu.MenuItemType.SUBMENU,
      label: 'SubMenu 1'
    });
    // Submenus can be nested
    var submenu2 = submenu1.addChild({
      type: os.ui.menu.MenuItemType.SUBMENU,
      label: 'SubSubMenu',
      
      // You can specify child menu items directly
      children: [{
        type: os.ui.menu.MenuItemType.ITEM,
        label: 'Item 1',
        sort: 10,
        handler: plugin.cookbook_submenu.handleItem1
      }, {
        type: os.ui.menu.MenuItemType.ITEM,
        eventType: plugin.cookbook_submenu.EventType.DO_SOMETHING,
        label: 'Item 2',
        sort: 30,
        handler: plugin.cookbook_submenu.handleItem,
        beforeRender: plugin.cookbook_submenu.visibileIfIsPointInSouthernHemisphere_
      }]
    });

    // You can also add items programmatically
    submenu2.addChild({
      type: os.ui.menu.MenuItemType.ITEM,
      eventType: plugin.cookbook_submenu.EventType.DO_ANOTHER_THING,
      label: 'Another item',
      sort: 20,
      handler: plugin.cookbook_submenu.handleItem
    });
  }

};


/**
 * If our example group should be shown.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 * @private
 */
plugin.cookbook_submenu.shouldShowGroup_ = function(context) {
  // This shows always, and could just be omitted from the menu item definition.
  // Your code could use the menu context if needed.
  this.visible = true;
};

/**
 * If our item should be shown.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 * @private
 */
plugin.cookbook_submenu.visibileIfIsPointInSouthernHemisphere_ = function(context) {
  this.visible = plugin.cookbook_submenu.ifIsPointInSouthernHemisphere_(context);
};

/**
 * If feature associated with menu entry is a point in southern hemisphere.
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 * @private
 */
plugin.cookbook_submenu.ifIsPointInSouthernHemisphere_ = function(context) {
  // Get feature associated with menu context
  var features = os.ui.menu.spatial.getFeaturesFromContext(context);
  if (features.length === 1) {
    var feature = features[0];
    var geom = feature.getGeometry();
    if (geom instanceof ol.geom.Point) {
      var coords = ol.proj.toLonLat(geom.getFlatCoordinates(), os.map.PROJECTION);
      if (coords[1] < 0) {
        return true;
      } 
    }
  }
  return false;
};


/**
 * Process a menu item
 * @param {os.ui.menu.MenuEvent} event The menu event.
 */
plugin.cookbook_submenu.handleItem1 = function(event) {
  alert('cookbook_submenu item1 selected');
}


/**
 * Process a menu item
 * @param {os.ui.menu.MenuEvent} event The menu event.
 */
plugin.cookbook_submenu.handleItem = function(event) {
  // event provides context for the elected item
  var eventType = event.type;
  alert('cookbook_submenu item selected:' + eventType);
}
 
// add the plugin to the application
os.plugin.PluginManager.getInstance().addPlugin(new plugin.cookbook_submenu.CookbookSubmenu());
