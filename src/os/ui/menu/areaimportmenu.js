goog.declareModuleId('os.ui.menu.areaImport');

import Menu from './menu.js';
import MenuItem from './menuitem.js';
import MenuItemType from './menuitemtype.js';

const googDispose = goog.require('goog.dispose');
const osQuery = goog.require('os.query');

const {default: MenuEvent} = goog.requireType('os.ui.menu.MenuEvent');


/**
 * Events fired by the query area import menu.
 * @enum {string}
 */
export const EventType = {
  FILE: 'query:importFile',
  ENTER_COORDINATES: 'query:enterCoordinates',
  QUERY_WORLD: 'query:queryWorld'
};

/**
 * Menu for importing query areas.
 * @type {Menu|undefined}
 */
let MENU = undefined;

/**
 * Get the menu.
 * @return {Menu|undefined}
 */
export const getMenu = () => MENU;

/**
 * Set the menu.
 * @param {Menu|undefined} menu The menu.
 */
export const setMenu = (menu) => {
  MENU = menu;
};

/**
 * Create the query area import menu.
 */
export const setup = function() {
  MENU = new Menu(new MenuItem({
    type: MenuItemType.ROOT,
    children: [{
      label: 'Import File/URL',
      eventType: EventType.FILE,
      tooltip: 'Import areas or filters from a file or URL',
      icons: ['<i class="fa fa-fw fa-cloud-download"></i>'],
      handler: handleQueryEvent,
      sort: 1
    }, {
      label: 'Enter Coordinates',
      eventType: EventType.ENTER_COORDINATES,
      tooltip: 'Enter coordinates to load data for a box, circle, or polygon',
      icons: ['<i class="fa fa-fw fa-calculator"></i>'],
      handler: handleQueryEvent,
      sort: 2
    }, {
      label: 'Whole World',
      eventType: EventType.QUERY_WORLD,
      tooltip: 'Load data for the whole world',
      icons: ['<i class="fa fa-fw fa-map-o"></i>'],
      handler: handleQueryEvent,
      sort: 3
    }]
  }));
};

/**
 * Dispose the query area import menu.
 */
export const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Handle query area import menu events.
 *
 * @param {!MenuEvent} event The menu event.
 */
export const handleQueryEvent = function(event) {
  switch (event.type) {
    case EventType.FILE:
      osQuery.launchQueryImport();
      break;
    case EventType.ENTER_COORDINATES:
      osQuery.launchCoordinates();
      break;
    case EventType.QUERY_WORLD:
      osQuery.queryWorld();
      break;
    default:
      break;
  }
};
