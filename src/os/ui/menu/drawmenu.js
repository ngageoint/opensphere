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
  COUNTRY_BORDER: 'countryBorder',
  WHOLE_WORLD: 'queryWorld'
};


/**
 * Menu for drawing shapes and areas
 * @type {os.ui.menu.Menu|undefined}
 */
os.ui.menu.draw.MENU = undefined;


/**
 * Create the draw menu.
 */
os.ui.menu.draw.setup = function() {
  var mi = new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: [{
      label: 'Box',
      eventType: os.ui.menu.draw.EventType.BOX,
      tooltip: 'Draw a box for query, selection, and zoom',
      icons: ['<i class="fa fa-fw fa-square-o"></i> '],
      handler: os.ui.menu.draw.handleDrawEvent,
      sort: 10
    }, {
      label: 'Circle',
      eventType: os.ui.menu.draw.EventType.CIRCLE,
      tooltip: 'Draw a circle for query, selection, and zoom',
      icons: ['<i class="fa fa-fw fa-circle-o"></i> '],
      handler: os.ui.menu.draw.handleDrawEvent,
      sort: 20
    }, {
      label: 'Polygon',
      eventType: os.ui.menu.draw.EventType.POLYGON,
      tooltip: 'Draw a polygon for query, selection, and zoom',
      icons: ['<i class="fa fa-fw fa-star-o"></i> '],
      handler: os.ui.menu.draw.handleDrawEvent,
      sort: 30
    }, {
      label: 'Choose Area',
      eventType: os.ui.menu.draw.EventType.CHOOSE_AREA,
      tooltip: 'Load data for a specific area',
      icons: ['<i class="fa fa-fw fa-list-ul"></i> '],
      handler: os.ui.menu.draw.handleDrawEvent,
      sort: 110
    }, {
      label: 'Enter Coordinates',
      eventType: os.ui.menu.draw.EventType.ENTER_COORDINATES,
      tooltip: 'Enter coordinates to load data',
      icons: ['<i class="fa fa-fw fa-calculator"></i> '],
      handler: os.ui.menu.draw.handleDrawEvent,
      sort: 120
    }, {
      label: 'Whole World',
      eventType: os.ui.menu.draw.EventType.WHOLE_WORLD,
      tooltip: 'Load data for the whole world',
      icons: ['<i class="fa fa-fw fa-map-o"></i> '],
      handler: os.ui.menu.draw.handleDrawEvent,
      sort: 140
    }]
  });

  mi.addChild({
    label: 'drawMenuSeparator',
    type: os.ui.menu.MenuItemType.SEPARATOR,
    sort: 100
  });
  os.ui.menu.draw.MENU = new os.ui.menu.Menu(mi);
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
 * @param {!goog.events.Event} event The event.
 */
os.ui.menu.draw.handleDrawEvent = function(event) {
  switch (event.type) {
    case os.ui.menu.draw.EventType.BOX:
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.ol.draw.DrawEventType.DRAWBOX));
      break;
    case os.ui.menu.draw.EventType.CIRCLE:
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.ol.draw.DrawEventType.DRAWCIRCLE));
      break;
    case os.ui.menu.draw.EventType.POLYGON:
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.ol.draw.DrawEventType.DRAWPOLYGON));
      break;
    case os.ui.menu.draw.EventType.LINE:
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.ol.draw.DrawEventType.DRAWLINE));
      break;
    case os.ui.menu.draw.EventType.CHOOSE_AREA:
      os.query.launchChooseArea();
      break;
    case os.ui.menu.draw.EventType.ENTER_COORDINATES:
      os.query.launchCoordinates();
      break;
    case os.ui.menu.draw.EventType.COUNTRY_BORDER:
      os.dispatcher.dispatchEvent(new goog.events.Event(os.ui.ol.draw.DrawEventType.DRAWLINE));
      break;
    case os.ui.menu.draw.EventType.WHOLE_WORLD:
      os.query.queryWorld();
      break;
    default:
      break;
  }
};
