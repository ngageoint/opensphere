goog.module('plugin.places.EventType');

/**
 * Places menu event types.
 * @enum {string}
 */
const EventType = {
  SAVE_TO: 'places:saveToPlaces',
  SAVE_TO_ANNOTATION: 'places:saveToAnnotation',
  EXPORT: 'places:export',

  // create/edit
  ADD_FOLDER: 'places:addFolder',
  ADD_ANNOTATION: 'places:addAnnotation',
  ADD_PLACEMARK: 'places:addPlacemark',
  EDIT_FOLDER: 'places:editFolder',
  EDIT_PLACEMARK: 'places:editPlacemark',
  QUICK_ADD_PLACES: 'places:quickAdd',
  FEATURE_LIST: 'places:featureList',
  REMOVE_PLACE: 'places:removePlace',
  REMOVE_ALL: 'places:removeAll'
};

exports = EventType;
