goog.provide('os.map.IMapContainer');

goog.require('goog.events.Listenable');



/**
 * Interface representing a wrapper class for an Openlayers map.
 * @extends {goog.events.Listenable}
 * @interface
 */
os.map.IMapContainer = function() {};


/**
 * Checks whether the drawing layer contains a feature.
 * @param {ol.Feature|number|string|undefined} feature
 * @return {boolean} True if the feature is on the map, false otherwise
 */
os.map.IMapContainer.prototype.containsFeature;


/**
 * Adds a feature to the drawing layer.
 * @param {!(ol.Feature)} feature The feature or coordinate to add
 * @param {Object=} opt_style Optional feature style
 * @return {(ol.Feature|undefined)} The feature's id, or undefined if the feature wasn't added
 */
os.map.IMapContainer.prototype.addFeature;


/**
 * Adds an array of features to the drawing layer.
 * @param {!Array<!ol.Feature>} features The features to add
 * @param {Object=} opt_style Optional feature style
 * @return {!Array<!ol.Feature>}
 */
os.map.IMapContainer.prototype.addFeatures;


/**
 * Removes a feature from the drawing layer
 * @param {ol.Feature|number|string|undefined} feature The feature or feature id
 * @param {boolean=} opt_dispose If the feature should be disposed
 */
os.map.IMapContainer.prototype.removeFeature;


/**
 * Removes an array of features from the drawing layer.
 * @param {!Array<!ol.Feature>} features The features to remove
 * @param {boolean=} opt_dispose If the feature should be disposed
 */
os.map.IMapContainer.prototype.removeFeatures;


/**
 * Gets a layer by ID, layer, or feature.
 * @param {!(string|ol.layer.Layer|ol.Feature)} layerOrFeature
 * @param {ol.Collection=} opt_search
 * @param {boolean=} opt_remove This is for INTERNAL use only.
 * @return {ol.layer.Layer} The layer or null if no layer was found
 */
os.map.IMapContainer.prototype.getLayer;


/**
 * Get all map layers ordered from top to bottom.
 * @return {!Array<!ol.layer.Layer>}
 */
os.map.IMapContainer.prototype.getLayers;


/**
 * Get the Openlayers map reference.
 * @return {ol.PluggableMap}
 */
os.map.IMapContainer.prototype.getMap;


/**
 * Add a layer to the map.
 * @param {!(os.layer.ILayer|ol.layer.Layer)} layer The layer to add.
 */
os.map.IMapContainer.prototype.addLayer;


/**
 * Remove a layer from the map.
 * @param {!(os.layer.ILayer|ol.layer.Layer|string)} layer The layer to remove.
 * @param {boolean=} opt_dispose If the layer should be disposed. Defaults to true.
 */
os.map.IMapContainer.prototype.removeLayer;


/**
 * If the 3D globe is the active view.
 * @return {boolean}
 */
os.map.IMapContainer.prototype.is3DEnabled;


/**
 * If a WebGL 3D globe is supported by the map container.
 * @return {boolean}
 */
os.map.IMapContainer.prototype.is3DSupported;


/**
 * Get the extent of the current view.
 * @return {ol.Extent}
 */
os.map.IMapContainer.prototype.getViewExtent;
