goog.provide('os.ui.menu.areaImport');

goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');


/**
 * Events fired by the query area import menu.
 * @enum {string}
 */
os.ui.menu.areaImport.EventType = {
  FILE: 'query:importFile',
  ENTER_COORDINATES: 'query:enterCoordinates',
  QUERY_WORLD: 'query:queryWorld'
};


/**
 * Menu for importing query areas.
 * @type {os.ui.menu.Menu|undefined}
 */
os.ui.menu.areaImport.MENU = undefined;


/**
 * Create the query area import menu.
 */
os.ui.menu.areaImport.setup = function() {
  os.ui.menu.areaImport.MENU = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
    type: os.ui.menu.MenuItemType.ROOT,
    children: [{
      label: 'Import File/URL',
      eventType: os.ui.menu.areaImport.EventType.FILE,
      tooltip: 'Import areas from a file or URL',
      icons: ['<i class="fa fa-fw fa-cloud-download"></i>'],
      handler: os.ui.menu.areaImport.handleQueryEvent_,
      sort: 1
    }, {
      label: 'Enter Coordinates',
      eventType: os.ui.menu.areaImport.EventType.ENTER_COORDINATES,
      tooltip: 'Enter coordinates to load data for a box, circle, or polygon',
      icons: ['<i class="fa fa-fw fa-calculator"></i>'],
      handler: os.ui.menu.areaImport.handleQueryEvent_,
      sort: 2
    }, {
      label: 'Whole World',
      eventType: os.ui.menu.areaImport.EventType.QUERY_WORLD,
      tooltip: 'Load data for the whole world',
      icons: ['<i class="fa fa-fw fa-map-o"></i>'],
      handler: os.ui.menu.areaImport.handleQueryEvent_,
      sort: 3
    }]
  }));
};


/**
 * Dispose the query area import menu.
 */
os.ui.menu.areaImport.dispose = function() {
  goog.dispose(os.ui.menu.areaImport.MENU);
  os.ui.menu.areaImport.MENU = undefined;
};


/**
 * Handle query area import menu events.
 * @param {!os.ui.menu.MenuEvent} event The menu event.
 * @private
 */
os.ui.menu.areaImport.handleQueryEvent_ = function(event) {
  switch (event.type) {
    case os.ui.menu.areaImport.EventType.FILE:
      os.query.launchQueryImport();
      break;
    case os.ui.menu.areaImport.EventType.ENTER_COORDINATES:
      os.query.launchCoordinates();
      break;
    case os.ui.menu.areaImport.EventType.QUERY_WORLD:
      os.query.queryWorld();
      break;
    default:
      break;
  }
};
