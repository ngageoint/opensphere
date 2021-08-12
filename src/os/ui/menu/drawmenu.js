goog.module('os.ui.menu.draw');
goog.module.declareLegacyNamespace();

const googDispose = goog.require('goog.dispose');
const GoogEvent = goog.require('goog.events.Event');
const dispatcher = goog.require('os.Dispatcher');
const {launchChooseArea, launchCoordinates, queryWorld} = goog.require('os.query');
const DrawEventType = goog.require('os.ui.draw.DrawEventType');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');

const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');


/**
 * Events fired by the draw menu.
 * @enum {string}
 */
const EventType = {
  BOX: 'box',
  CIRCLE: 'circle',
  POLYGON: 'polygon',
  LINE: 'line',
  CHOOSE_AREA: 'chooseArea',
  ENTER_COORDINATES: 'enterCoordinates',
  WHOLE_WORLD: 'queryWorld'
};

/**
 * Menu for drawing shapes and areas
 * @type {Menu|undefined}
 */
let MENU = undefined;

/**
 * Creates a draw menu.
 *
 * @param {function(MenuEvent)} handler The menu handler.
 * @return {!Menu} The menu.
 */
const create = function(handler) {
  var mi = new MenuItem({
    type: MenuItemType.ROOT,
    children: [{
      label: 'Box',
      eventType: EventType.BOX,
      tooltip: 'Draw a box for query, selection, and zoom',
      icons: ['<i class="fa fa-fw fa-square-o"></i> '],
      handler: handler,
      sort: 10
    }, {
      label: 'Circle',
      eventType: EventType.CIRCLE,
      tooltip: 'Draw a circle for query, selection, and zoom',
      icons: ['<i class="fa fa-fw fa-circle-o"></i> '],
      handler: handler,
      sort: 20
    }, {
      label: 'Polygon',
      eventType: EventType.POLYGON,
      tooltip: 'Draw a polygon for query, selection, and zoom',
      icons: ['<i class="fa fa-fw fa-star-o"></i> '],
      handler: handler,
      sort: 30
    }, {
      label: 'drawMenuSeparator',
      type: MenuItemType.SEPARATOR,
      sort: 100
    }, {
      label: 'Choose Area',
      eventType: EventType.CHOOSE_AREA,
      tooltip: 'Load data for a specific area',
      icons: ['<i class="fa fa-fw fa-list-ul"></i> '],
      handler: handler,
      sort: 110
    }, {
      label: 'Enter Coordinates',
      eventType: EventType.ENTER_COORDINATES,
      tooltip: 'Enter coordinates to load data',
      icons: ['<i class="fa fa-fw fa-calculator"></i> '],
      handler: handler,
      sort: 120
    }, {
      label: 'Whole World',
      eventType: EventType.WHOLE_WORLD,
      tooltip: 'Load data for the whole world',
      icons: ['<i class="fa fa-fw fa-map-o"></i> '],
      handler: handler,
      sort: 140
    }]
  });

  return new Menu(mi);
};

/**
 * Create the draw menu.
 */
const setup = function() {
  MENU = create(handleDrawEvent);
};

/**
 * Dispose the draw menu.
 */
const dispose = function() {
  googDispose(MENU);
  MENU = undefined;
};

/**
 * Handle draw menu events.
 *
 * @param {MenuEvent} event The event.
 */
const handleDrawEvent = function(event) {
  switch (event.type) {
    case EventType.BOX:
      dispatcher.getInstance().dispatchEvent(new GoogEvent(DrawEventType.DRAWBOX));
      break;
    case EventType.CIRCLE:
      dispatcher.getInstance().dispatchEvent(new GoogEvent(DrawEventType.DRAWCIRCLE));
      break;
    case EventType.POLYGON:
      dispatcher.getInstance().dispatchEvent(new GoogEvent(DrawEventType.DRAWPOLYGON));
      break;
    case EventType.LINE:
      dispatcher.getInstance().dispatchEvent(new GoogEvent(DrawEventType.DRAWLINE));
      break;
    case EventType.CHOOSE_AREA:
      launchChooseArea();
      break;
    case EventType.ENTER_COORDINATES:
      launchCoordinates();
      break;
    case EventType.WHOLE_WORLD:
      queryWorld();
      break;
    default:
      break;
  }
};

exports = {
  EventType,
  MENU,
  create,
  setup,
  dispose,
  handleDrawEvent
};
