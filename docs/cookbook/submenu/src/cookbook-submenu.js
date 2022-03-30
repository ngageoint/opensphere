goog.declareModuleId('plugin.cookbook_submenu.CookbookSubmenu');

import Point from 'ol/src/geom/Point.js';
import {toLonLat} from 'ol/src/proj.js';

import {PROJECTION} from 'opensphere/src/os/map/map.js';
import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';
import MenuItemType from 'opensphere/src/os/ui/menu/menuitemtype.js';
import * as spatial from 'opensphere/src/os/ui/menu/spatial.js';

const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');


/**
 * Cookbook example of a submenu
 */
export default class CookbookSubmenu extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    const menu = spatial.getMenu();
    if (menu) {
      const root = menu.getRoot();
      let group = root.find(MYGROUP);
      if (!group) {
        group = root.addChild({
          type: MenuItemType.GROUP,
          label: MYGROUP,
          tooltip: 'Added by cookbook submenu example',
          beforeRender: shouldShowGroup
        });
      }
      const submenu1 = group.addChild({
        type: MenuItemType.SUBMENU,
        label: 'SubMenu 1'
      });
      // Submenus can be nested
      const submenu2 = submenu1.addChild({
        type: MenuItemType.SUBMENU,
        label: 'SubSubMenu',

        // You can specify child menu items directly
        children: [{
          type: MenuItemType.ITEM,
          label: 'Item 1',
          sort: 10,
          handler: handleItem1
        }, {
          type: MenuItemType.ITEM,
          eventType: EventType.DO_SOMETHING,
          label: 'Item 2',
          sort: 30,
          handler: handleItem,
          beforeRender: visibleIfIsPointInSouthernHemisphere
        }]
      });

      // You can also add items programmatically
      submenu2.addChild({
        type: MenuItemType.ITEM,
        eventType: EventType.DO_ANOTHER_THING,
        label: 'Another item',
        sort: 20,
        handler: handleItem
      });
    }
  }
}

/**
 * @type {string}
 */
const ID = 'cookbook_submenu';

/**
 * @type {string}
 */
const MYGROUP = 'Cookbook Group';

/**
 * Our event types
 * @enum {string}
 */
const EventType = {
  DO_SOMETHING: 'cookbook:do_y',
  DO_ANOTHER_THING: 'cookbook:do_x'
};

/**
 * If our example group should be shown.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const shouldShowGroup = function(context) {
  // This shows always, and could just be omitted from the menu item definition.
  // Your code could use the menu context if needed.
  this.visible = true;
};

/**
 * If our item should be shown.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
const visibleIfIsPointInSouthernHemisphere = function(context) {
  this.visible = ifIsPointInSouthernHemisphere(context);
};

/**
 * If feature associated with menu entry is a point in southern hemisphere.
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
const ifIsPointInSouthernHemisphere = function(context) {
  // Get feature associated with menu context
  const features = spatial.getFeaturesFromContext(context);
  if (features.length === 1) {
    const feature = features[0];
    const geom = feature.getGeometry();
    if (geom instanceof Point) {
      const coords = toLonLat(geom.getFlatCoordinates(), PROJECTION);
      if (coords[1] < 0) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Process a menu item
 * @param {MenuEvent} event The menu event.
 */
const handleItem1 = function(event) {
  alert('cookbook_submenu item1 selected');
};

/**
 * Process a menu item
 * @param {MenuEvent} event The menu event.
 */
const handleItem = function(event) {
  // event provides context for the elected item
  const eventType = event.type;
  alert('cookbook_submenu item selected:' + eventType);
};

// add the plugin to the application
PluginManager.getInstance().addPlugin(new CookbookSubmenu());
