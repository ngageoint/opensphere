goog.provide('os.ui.ol.IMap');
goog.require('goog.events.Listenable');



/**
 * Interface representing a wrapper class for an OL3 map.
 * @extends {goog.events.Listenable}
 * @interface
 */
os.ui.ol.IMap = function() {};


/**
 * Checks whether the drawing layer contains a feature.
 * @param {ol.Feature|number|string|undefined} feature
 * @return {boolean} True if the feature is on the map, false otherwise
 */
os.ui.ol.IMap.prototype.containsFeature;


/**
 * Adds a feature to the drawing layer.
 * @param {!(ol.Feature)} feature The feature or coordinate to add
 * @param {Object=} opt_style Optional feature style
 * @return {(ol.Feature|undefined)} The feature's id, or undefined if the feature wasn't added
 */
os.ui.ol.IMap.prototype.addFeature;


/**
 * Adds an array of features to the drawing layer.
 * @param {!Array<!ol.Feature>} features The features to add
 * @return {!Array<!ol.Feature>}
 */
os.ui.ol.IMap.prototype.addFeatures;


/**
 * Removes a feature from the drawing layer
 * @param {ol.Feature|number|string|undefined} feature The feature or feature id
 * @param {boolean=} opt_dispose If the feature should be disposed
 */
os.ui.ol.IMap.prototype.removeFeature;


/**
 * Removes an array of features from the drawing layer.
 * @param {!Array<!ol.Feature>} features The features to remove
 * @param {boolean=} opt_dispose If the feature should be disposed
 */
os.ui.ol.IMap.prototype.removeFeatures;


/**
 * Gets a layer by ID, layer, or feature.
 * @param {!(string|ol.layer.Layer|ol.Feature)} layerOrFeature
 * @param {ol.Collection=} opt_search
 * @param {boolean=} opt_remove This is for INTERNAL use only.
 * @return {?ol.layer.Layer} The layer or null if no layer was found
 */
os.ui.ol.IMap.prototype.getLayer;


/**
 * @return {?ol.Map}
 */
os.ui.ol.IMap.prototype.getMap;
