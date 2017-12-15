goog.provide('os.action.query');
goog.provide('os.action.query.import');

goog.require('os.ui.action.Action');
goog.require('os.ui.action.ActionManager');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.im.ImportEventType');


/**
 * @enum {string}
 */
os.action.query.EventType = {
  FILE: 'query:importFile',
  ENTER_COORDINATES: 'query:enterCoordinates',
  QUERY_WORLD: 'query:queryWorld'
};


/**
 * @type {os.ui.action.ActionManager}
 */
os.action.query.import.manager = null;


/**
 * Sets up layer actions
 */
os.action.query.import.setup = function() {
  if (!os.action.query.import.manager) {
    os.action.query.import.manager = new os.ui.action.ActionManager();
  }

  var manager = os.action.query.import.manager;
  if (!manager.getAction(os.ui.im.ImportEventType.FILE)) {
    var importFile = new os.ui.action.Action(os.action.query.EventType.FILE, 'Import File/URL',
        'Import areas from a file or URL', 'fa-cloud-download', undefined, new os.ui.action.MenuOptions(null, null, 0));
    manager.addAction(importFile);

    var enterCoordinates = new os.ui.action.Action(os.action.query.EventType.ENTER_COORDINATES, 'Enter Coordinates',
        'Enter coordinates to load data for a box, circle, or polygon', 'fa-calculator',
        undefined, new os.ui.action.MenuOptions(null, null, 1));
    manager.addAction(enterCoordinates);

    var queryWorld = new os.ui.action.Action(os.action.query.EventType.QUERY_WORLD, 'Whole World',
        'Load data for the whole world', 'fa-map-o', undefined, new os.ui.action.MenuOptions(null, null, 3));
    manager.addAction(queryWorld);
  }

  os.action.query.import.manager.listen(os.action.query.EventType.FILE, os.action.query.import.handleQueryEvent_);
  os.action.query.import.manager.listen(os.action.query.EventType.ENTER_COORDINATES,
      os.action.query.import.handleQueryEvent_);
  os.action.query.import.manager.listen(os.action.query.EventType.QUERY_WORLD,
      os.action.query.import.handleQueryEvent_);
};


/**
 * Disposes layer actions
 */
os.action.query.import.dispose = function() {
  if (os.action.query.import.manager) {
    os.action.query.import.manager.dispose();
    os.action.query.import.manager = null;
  }
};


/**
 * Handles query events.
 * @param {os.ui.action.ActionEvent} event [description]
 * @private
 */
os.action.query.import.handleQueryEvent_ = function(event) {
  switch (event.type) {
    case os.action.query.EventType.FILE:
      os.query.launchQueryImport();
      break;
    case os.action.query.EventType.ENTER_COORDINATES:
      os.query.launchCoordinates();
      break;
    case os.action.query.EventType.QUERY_WORLD:
      os.query.queryWorld();
      break;
    default:
      break;
  }
};
