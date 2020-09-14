goog.provide('os.ui.menu.draw');

goog.require('goog.events.Event');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');


/**
 * Events fired by the draw menu.
 * @enum {string}
 */
os.ui.menu.draw.EventType = {
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
 * @type {os.ui.menu.Menu|undefined}
 */
os.ui.menu.draw.MENU = undefined;


/**
 * Creates a draw menu.
 *
 * @param {function(os.ui.menu.MenuEvent)} handler The menu handler.
 * @return {!os.ui.menu.Menu} The menu.
 */
os.ui.menu.draw.create = function(handler) {
  var mi = new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: [{
      label: 'Box',
      eventType: os.ui.menu.draw.EventType.BOX,
      tooltip: 'Draw a box for query, selection, and zoom',
      icons: ['<i class="fa fa-fw fa-square-o"></i> '],
      handler: handler,
      sort: 10
    }, {
      label: 'Circle',
      eventType: os.ui.menu.draw.EventType.CIRCLE,
      tooltip: 'Draw a circle for query, selection, and zoom',
      icons: ['<i class="fa fa-fw fa-circle-o"></i> '],
      handler: handler,
      sort: 20
    }, {
      label: 'Polygon',
      eventType: os.ui.menu.draw.EventType.POLYGON,
      tooltip: 'Draw a polygon for query, selection, and zoom',
      icons: ['<i class="fa fa-fw fa-star-o"></i> '],
      handler: handler,
      sort: 30
    }, {
      label: 'drawMenuSeparator',
      type: os.ui.menu.MenuItemType.SEPARATOR,
      sort: 100
    }, {
      label: 'Choose Area',
      eventType: os.ui.menu.draw.EventType.CHOOSE_AREA,
      tooltip: 'Load data for a specific area',
      icons: ['<i class="fa fa-fw fa-list-ul"></i> '],
      handler: handler,
      sort: 110
    }, {
      label: 'Enter Coordinates',
      eventType: os.ui.menu.draw.EventType.ENTER_COORDINATES,
      tooltip: 'Enter coordinates to load data',
      icons: ['<i class="fa fa-fw fa-calculator"></i> '],
      handler: handler,
      sort: 120
    }, {
      label: 'Whole World',
      eventType: os.ui.menu.draw.EventType.WHOLE_WORLD,
      tooltip: 'Load data for the whole world',
      icons: ['<i class="fa fa-fw fa-map-o"></i> '],
      handler: handler,
      sort: 140
    }]
  });

  return new os.ui.menu.Menu(mi);
};


/**
 * Create the draw menu.
 */
os.ui.menu.draw.setup = function() {
  os.ui.menu.draw.MENU = os.ui.menu.draw.create(os.ui.menu.draw.handleDrawEvent);
};


/**
 * Dispose the draw menu.
 */
os.ui.menu.draw.dispose = function() {
  goog.dispose(os.ui.menu.draw.MENU);
  os.ui.menu.draw.MENU = undefined;
};


/**
 * Handle draw menu events.
 *
 * @param {os.ui.menu.MenuEvent} event The event.
 */
os.ui.menu.draw.handleDrawEvent = function(event) {
  switch (event.type) {
    case os.ui.menu.draw.EventType.BOX:
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.draw.DrawEventType.DRAWBOX));
      break;
    case os.ui.menu.draw.EventType.CIRCLE:
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.draw.DrawEventType.DRAWCIRCLE));
      break;
    case os.ui.menu.draw.EventType.POLYGON:
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.draw.DrawEventType.DRAWPOLYGON));
      break;
    case os.ui.menu.draw.EventType.LINE:
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.draw.DrawEventType.DRAWLINE));
      break;
    case os.ui.menu.draw.EventType.CHOOSE_AREA:
      os.query.launchChooseArea();
      break;
    case os.ui.menu.draw.EventType.ENTER_COORDINATES:
      os.query.launchCoordinates();
      break;
    case os.ui.menu.draw.EventType.WHOLE_WORLD:
      os.query.queryWorld();
      break;
    default:
      break;
  }
};
