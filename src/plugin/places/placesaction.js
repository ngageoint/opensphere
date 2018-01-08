goog.provide('plugin.places.action');

goog.require('ol.geom.Point');
goog.require('os');
goog.require('os.action.import');
goog.require('os.action.layer');
goog.require('os.command.SequenceCommand');
goog.require('os.feature');
goog.require('os.interaction');
goog.require('os.metrics.keys');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.menu.map');
goog.require('os.ui.menu.spatial');
goog.require('plugin.file.kml.cmd.KMLNodeAdd');
goog.require('plugin.places');
goog.require('plugin.places.ui.savePlacesDirective');


/**
 * KML groups in the layer menu.
 * @enum {string}
 */
plugin.places.action.GroupType = {
  PLACES: ('2:' + plugin.places.TITLE)
};


/**
 * Geotagging actions.
 * @enum {string}
 */
plugin.places.action.EventType = {
  SAVE_TO: 'places:saveToPlaces',
  EXPORT: 'places:export',

  // create/edit
  ADD_FOLDER: 'places:addFolder',
  ADD_PLACEMARK: 'places:addPlacemark',
  EDIT_FOLDER: 'places:editFolder',
  EDIT_PLACEMARK: 'places:editPlacemark'
};


/**
 * Adds places actions to the import menu.
 */
plugin.places.action.layerSetup = function() {
  if (os.action && os.action.layer) {
    os.action.layer.setup();

    var manager = os.action.layer.manager;

    if (!manager.getAction(plugin.places.action.EventType.SAVE_TO)) {
      var addFolder = new os.ui.action.Action(plugin.places.action.EventType.ADD_FOLDER, 'Add Folder',
          'Creates a new folder and adds it to the tree', 'fa-folder', null,
          new os.ui.action.MenuOptions(null, plugin.places.action.GroupType.PLACES),
          os.metrics.Places.ADD_FOLDER);
      addFolder.enableWhen(plugin.places.action.isTreeActionSupported_.bind(addFolder));
      manager.addAction(addFolder);

      var addPlacemark = new os.ui.action.Action(plugin.places.action.EventType.ADD_PLACEMARK, 'Add Place',
          'Creates a new saved place', 'fa-map-marker', null,
          new os.ui.action.MenuOptions(null, plugin.places.action.GroupType.PLACES),
          os.metrics.Places.ADD_PLACE);
      addPlacemark.enableWhen(plugin.places.action.isTreeActionSupported_.bind(addPlacemark));
      manager.addAction(addPlacemark);

      var editFolder = new os.ui.action.Action(plugin.places.action.EventType.EDIT_FOLDER, 'Edit Folder',
          'Edit the folder label', 'fa-pencil', null,
          new os.ui.action.MenuOptions(null, plugin.places.action.GroupType.PLACES),
          os.metrics.Places.EDIT_FOLDER);
      editFolder.enableWhen(plugin.places.action.isTreeActionSupported_.bind(editFolder));
      manager.addAction(editFolder);

      var editPlacemark = new os.ui.action.Action(plugin.places.action.EventType.EDIT_PLACEMARK, 'Edit Place',
          'Edit the saved place', 'fa-pencil', null,
          new os.ui.action.MenuOptions(null, plugin.places.action.GroupType.PLACES),
          os.metrics.Places.EDIT_PLACEMARK);
      editPlacemark.enableWhen(plugin.places.action.isTreeActionSupported_.bind(editPlacemark));
      manager.addAction(editPlacemark);

      var exportTree = new os.ui.action.Action(plugin.places.action.EventType.EXPORT, 'Export Places...',
          'Exports ' + plugin.places.TITLE + ' from the selected location', 'fa-download', null,
          new os.ui.action.MenuOptions(null, plugin.places.action.GroupType.PLACES),
          os.metrics.Places.EXPORT_CONTEXT);
      exportTree.enableWhen(plugin.places.action.isTreeActionSupported_.bind(exportTree));
      manager.addAction(exportTree);

      var saveTo = new os.ui.action.Action(plugin.places.action.EventType.SAVE_TO, 'Save to Places...',
          'Copies selected features to the ' + plugin.places.TITLE + ' layer, or all features if none selected',
          plugin.places.ICON, null, new os.ui.action.MenuOptions(null, plugin.places.action.GroupType.PLACES),
          os.metrics.Places.SAVE_TO);
      saveTo.enableWhen(plugin.places.action.canSaveToPlaces);
      manager.addAction(saveTo);

      // register event listeners
      manager.listen(plugin.places.action.EventType.ADD_FOLDER, plugin.places.action.onLayerEvent_);
      manager.listen(plugin.places.action.EventType.ADD_PLACEMARK, plugin.places.action.onLayerEvent_);
      manager.listen(plugin.places.action.EventType.EDIT_FOLDER, plugin.places.action.onLayerEvent_);
      manager.listen(plugin.places.action.EventType.EDIT_PLACEMARK, plugin.places.action.onLayerEvent_);
      manager.listen(plugin.places.action.EventType.EXPORT, plugin.places.action.onLayerEvent_);
      manager.listen(plugin.places.action.EventType.SAVE_TO, plugin.places.action.saveToPlaces);
    }
  }
};


/**
 * Removes places actions from the import menu.
 */
plugin.places.action.layerDispose = function() {
  if (os.action && os.action.layer) {
    var manager = os.action.layer.manager;

    // remove places actions
    manager.removeAction(plugin.places.action.EventType.ADD_FOLDER);
    manager.removeAction(plugin.places.action.EventType.ADD_PLACEMARK);
    manager.removeAction(plugin.places.action.EventType.EDIT_FOLDER);
    manager.removeAction(plugin.places.action.EventType.EDIT_PLACEMARK);
    manager.removeAction(plugin.places.action.EventType.EXPORT);
    manager.removeAction(plugin.places.action.EventType.SAVE_TO);

    // unregister listeners
    manager.unlisten(plugin.places.action.EventType.ADD_FOLDER, plugin.places.action.onLayerEvent_);
    manager.unlisten(plugin.places.action.EventType.ADD_PLACEMARK, plugin.places.action.onLayerEvent_);
    manager.unlisten(plugin.places.action.EventType.EDIT_FOLDER, plugin.places.action.onLayerEvent_);
    manager.unlisten(plugin.places.action.EventType.EDIT_PLACEMARK, plugin.places.action.onLayerEvent_);
    manager.unlisten(plugin.places.action.EventType.EXPORT, plugin.places.action.onLayerEvent_);
    manager.unlisten(plugin.places.action.EventType.SAVE_TO, plugin.places.action.saveToPlaces);
  }
};


/**
 * @param {plugin.file.kml.ui.KMLNode} context The KML node
 * @return {boolean}
 * @private
 * @this os.ui.action.Action
 */
plugin.places.action.isTreeActionSupported_ = function(context) {
  if (context && context.length == 1) {
    var eventType = this.getEventType();
    var node = context[0];
    if (node instanceof plugin.file.kml.ui.KMLNode) {
      var pm = plugin.places.PlacesManager.getInstance();
      var placesRoot = pm.getPlacesRoot().getRoot();
      var isPlacesNode = placesRoot === node.getRoot();
      if (!isPlacesNode) {
        return false;
      }

      switch (eventType) {
        case plugin.places.action.EventType.ADD_FOLDER:
        case plugin.places.action.EventType.ADD_PLACEMARK:
          return node.isFolder() && node.canAddChildren;
        case plugin.places.action.EventType.EDIT_FOLDER:
          return node.isFolder() && node.editable;
        case plugin.places.action.EventType.EDIT_PLACEMARK:
          return !node.isFolder() && node.editable;
        case plugin.places.action.EventType.EXPORT:
          return placesRoot != null && node.getRoot() == placesRoot;
        default:
          return node.isFolder();
      }
    } else if (node instanceof plugin.file.kml.ui.KMLLayerNode) {
      var layer = node.getLayer();
      var isPlacesLayer = layer != null && layer.getId() == plugin.places.ID;

      switch (eventType) {
        case plugin.places.action.EventType.EXPORT:
          return isPlacesLayer;
        case plugin.places.action.EventType.ADD_FOLDER:
        case plugin.places.action.EventType.ADD_PLACEMARK:
          return isPlacesLayer && node.isEditable();
        default:
          break;
      }
    }
  }

  return false;
};


/**
 * Set up places items on the map.
 */
plugin.places.action.mapSetup = function() {
  var menu = os.ui.menu.MAP;

  if (menu && !menu.getRoot().find(plugin.places.action.EventType.SAVE_TO)) {
    var group = menu.getRoot().find('Coordinate');
    if (group) {
      group.addChild({
        label: 'Save to Places...',
        eventType: plugin.places.action.EventType.SAVE_TO,
        tooltip: 'Creates a new saved place from this location',
        icons: ['<i class="fa fa-w ' + plugin.places.ICON + '"></i>'],
        handler: plugin.places.action.saveCoordinateToPlaces
      });
    }
  }
};


/**
 * Clean up places items on the map.
 */
plugin.places.action.mapDispose = function() {
  var menu = os.ui.menu.MAP;
  if (menu) {
    var group = menu.getRoot().find('Coordinate');
    if (group) {
      group.removeChild(plugin.places.action.EventType.SAVE_TO);
    }
  }
};


/**
 * Set up places items in the spatial menu.
 */
plugin.places.action.spatialSetup = function() {
  var menu = os.ui.menu.SPATIAL;
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(os.ui.menu.spatial.Group.TOOLS);
    goog.asserts.assert(group, 'Group "' + os.ui.menu.spatial.Group.TOOLS + '" should exist! Check spelling?');

    if (!group.find(plugin.places.action.EventType.SAVE_TO)) {
      group.addChild({
        eventType: plugin.places.action.EventType.SAVE_TO,
        label: 'Save to Places...',
        tooltip: 'Creates a new saved place from the area',
        icons: ['<i class="fa fa-fw ' + plugin.places.ICON + '"></i>'],
        beforeRender: plugin.places.action.visibleIfCanSave,
        handler: plugin.places.action.saveSpatialToPlaces
      });

      group.addChild({
        eventType: plugin.places.action.EventType.EDIT_PLACEMARK,
        label: 'Edit Place',
        tooltip: 'Edit the saved place',
        icons: ['<i class="fa fa-fw fa-pencil"></i>'],
        beforeRender: plugin.places.action.visibleIfIsPlace,
        handler: plugin.places.action.onSpatialEdit_
      });
    }
  }
};


/**
 * Clean up places items in the spatial menu.
 */
plugin.places.action.spatialDispose = function() {
  var menu = os.ui.menu.MAP;
  if (menu) {
    var group = menu.getRoot().find(os.ui.menu.spatial.Group.TOOLS);
    if (group) {
      group.removeChild(plugin.places.action.EventType.SAVE_TO);
      group.removeChild(plugin.places.action.EventType.EDIT_PLACEMARK);
    }
  }
};


/**
 * If arguments from a spatial action can be saved to places.
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
plugin.places.action.spatialCanSave = function(context) {
  if (!plugin.places.action.spatialIsPlace(context)) {
    var geometries = os.ui.menu.spatial.getGeometriesFromContext(context);
    if (geometries.length === 1) {
      // single geometry, okay to add
      return true;
    }
  }

  // ignore everything else
  return false;
};


/**
 * Test if spatial args contain a place.
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
plugin.places.action.spatialIsPlace = function(context) {
  var features = os.ui.menu.spatial.getFeaturesFromContext(context);
  if (features.length === 1) {
    var feature = features[0];
    var sourceId = feature.get(os.data.RecordField.SOURCE_ID);

    return sourceId === plugin.places.ID;
  }

  // ignore everything else
  return false;
};


/**
 * Shows a menu item if the context can be saved to places.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.places.action.visibleIfCanSave = function(context) {
  this.visible = plugin.places.action.spatialCanSave(context);
};


/**
 * Shows a menu item if the context is a saved place.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.places.action.visibleIfIsPlace = function(context) {
  this.visible = plugin.places.action.spatialIsPlace(context);
};


/**
 * Handle Edit Place from spatial menu.
 * @param {os.ui.menu.MenuEvent} event The event.
 * @private
 */
plugin.places.action.onSpatialEdit_ = function(event) {
  var features = os.ui.menu.spatial.getFeaturesFromContext(/** @type {Object} */ (event.getContext()));
  if (features.length === 1) {
    var feature = features[0];
    var source = /** @type {plugin.file.kml.KMLSource} */ (os.dataManager.getSource(plugin.places.ID));
    if (source) {
      var node = source.getFeatureNode(feature);
      if (node) {
        plugin.file.kml.ui.createOrEditPlace({
          'feature': feature,
          'node': node
        });
      }
    }
  }
};


/**
 * Handle places layer actions.
 * @param {os.ui.action.ActionEvent} event
 * @private
 */
plugin.places.action.onLayerEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof plugin.file.kml.ui.KMLNode) {
      var source = node.getSource();
      if (source) {
        switch (event.type) {
          case plugin.places.action.EventType.ADD_FOLDER:
            plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
              'parent': node
            }));
            break;
          case plugin.places.action.EventType.ADD_PLACEMARK:
            plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
              'parent': node
            }));
            break;
          case plugin.places.action.EventType.EDIT_FOLDER:
            plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
              'node': node
            }));
            break;
          case plugin.places.action.EventType.EDIT_PLACEMARK:
            var feature = node.getFeature();
            plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
              'feature': feature,
              'node': node
            }));
            break;
          case plugin.places.action.EventType.EXPORT:
            plugin.file.kml.ui.launchTreeExport(node, 'Export Places');
            break;
          default:
            break;
        }
      }
    } else if (node instanceof plugin.file.kml.ui.KMLLayerNode) {
      var rootNode = plugin.file.kml.ui.getKMLRoot(node).getChildren()[0];
      if (rootNode) {
        switch (event.type) {
          case plugin.places.action.EventType.ADD_FOLDER:
            plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
              'parent': rootNode
            }));
            break;
          case plugin.places.action.EventType.ADD_PLACEMARK:
            plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
              'parent': rootNode
            }));
            break;
          case plugin.places.action.EventType.EXPORT:
            plugin.file.kml.ui.launchTreeExport(/** @type {!plugin.file.kml.ui.KMLNode} */ (rootNode), 'Export Places');
            break;
          default:
            break;
        }
      }
    }
  }
};


/**
 * Check if a layer can be saved to Places.
 * @param {*} context The menu action context
 * @return {boolean}
 */
plugin.places.action.canSaveToPlaces = function(context) {
  if (context && context.length == 1) {
    // don't allow places actions if the places root node doesn't exist
    var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
    if (!rootNode) {
      return false;
    }

    if (context[0] instanceof plugin.file.kml.ui.KMLLayerNode) {
      var kmlRoot = plugin.places.getPlacesRoot(context[0]);
      return kmlRoot != null && kmlRoot != rootNode;
    } else if (context[0] instanceof os.data.LayerNode) {
      var layer = /** @type {os.data.LayerNode} */ (context[0]).getLayer();
      if (layer.getId() != plugin.places.ID && layer instanceof os.layer.Vector) {
        if (layer instanceof plugin.file.kml.KMLLayer) {
          return true;
        }

        var source = layer.getSource();
        if (source instanceof os.source.Vector && source.getFeatureCount() > 0) {
          var features = source.getFilteredFeatures();
          return features != null && features.length > 0;
        }
      }
    } else if (context[0] instanceof plugin.file.kml.ui.KMLNode) {
      var features = context[0].getFeatures();
      return (context[0].getRoot() != rootNode.getRoot()) && (features.length > 0);
    }
  } else if (os.instanceOf(context, os.source.Vector.NAME)) {
    // can launch a save dialog for a source
    var source = /** @type {!os.source.Vector} */ (context);
    return source.getId() !== plugin.places.ID;
  }

  return false;
};


/**
 * Save a coordinate to places.
 * @param {os.ui.menu.MenuEvent<ol.Coordinate>} event The menu event.
 */
plugin.places.action.saveCoordinateToPlaces = function(event) {
  var context = event.getContext();
  if (context && event instanceof goog.events.Event && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
    plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
      'geometry': new ol.geom.Point(context),
      'parent': rootNode
    }));
  }
};


/**
 * Save the spatial menu context to places.
 * @param {os.ui.menu.MenuEvent} event The menu event.
 */
plugin.places.action.saveSpatialToPlaces = function(event) {
  var context = event.getContext();
  if (context && event instanceof goog.events.Event && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
    var geometry;
    var name;

    context = /** @type {Object} */ (context);

    // first check if there are features to buffer
    var features = os.ui.menu.spatial.getFeaturesFromContext(context);
    if (features.length === 1) {
      name = os.feature.getTitle(features[0]);

      var featureGeom = features[0].getGeometry();
      if (featureGeom) {
        geometry = featureGeom.clone();
      }
    } else {
      // next look for geometries
      var geometries = os.ui.menu.spatial.getGeometriesFromContext(context);
      if (geometries.length === 1) {
        geometry = geometries[0].clone();
      }
    }

    if (geometry) {
      // if found, save away
      plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
        'geometry': geometry,
        'parent': rootNode,
        'name': name
      }));
    }
  }
};


/**
 * Save features from a layer to Places.
 * @param {os.ui.action.ActionEvent|os.ui.menu.MenuEvent<ol.Coordinate>} event The menu action event
 */
plugin.places.action.saveToPlaces = function(event) {
  var context = event.getContext();
  if (context && event instanceof goog.events.Event && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
    if (event.target === os.ui.menu.SPATIAL) {
      var geometry;
      var name;

      context = /** @type {Object} */ (context);

      // first check if there are features to buffer
      var features = os.ui.menu.spatial.getFeaturesFromContext(context);
      if (features.length === 1) {
        name = features[0].get('title') || undefined;

        var featureGeom = features[0].getGeometry();
        if (featureGeom) {
          geometry = featureGeom.clone();
        }
      } else {
        // next look for geometries
        var geometries = os.ui.menu.spatial.getGeometriesFromContext(context);
        if (geometries.length === 1) {
          geometry = geometries[0].clone();
        }
      }

      if (geometry) {
        // if found, save away
        plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
          'geometry': geometry,
          'parent': rootNode,
          'name': name
        }));
      }
    } else if (context && context.length == 1) {
      if (context[0] instanceof plugin.file.kml.ui.KMLLayerNode) {
        var kmlRoot = /** @type {Array<plugin.file.kml.ui.KMLNode>} */
            (plugin.file.kml.ui.getKMLRoot(context[0]).getChildren());
        if (kmlRoot && kmlRoot != rootNode) {
          plugin.places.action.saveKMLToPlaces_(kmlRoot);
        }
      } else if (context[0] instanceof os.data.LayerNode) {
        var layer = /** @type {os.data.LayerNode} */ (context[0]).getLayer();
        if (layer.getId() != plugin.places.ID) {
          if (layer instanceof plugin.file.kml.KMLLayer) {
            var source = /** @type {plugin.file.kml.KMLSource} */ (layer.getSource());
            var kmlRoot = source ? source.getRootNode() : undefined;
            if (kmlRoot) {
              plugin.places.action.saveKMLToPlaces_(kmlRoot);
            }
          } else if (layer instanceof os.layer.Vector) {
            plugin.places.action.saveLayerToPlaces_(layer);
          }
        }
      } else if (context[0] instanceof plugin.file.kml.ui.KMLNode && context[0].getRoot() != rootNode) {
        plugin.places.action.saveKMLToPlaces_(context[0]);
      }
    } else if (os.instanceOf(context, os.source.Vector.NAME)) {
      var source = /** @type {!os.source.Vector} */ (context);
      plugin.places.ui.launchSavePlaces(source);
      return;
    }
  }
};


/**
 * Save features from a layer to places.
 * @param {!os.layer.Vector} layer The layer to save
 * @private
 */
plugin.places.action.saveLayerToPlaces_ = function(layer) {
  // don't allow this if the places root node doesn't exist
  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (!rootNode) {
    return;
  }

  plugin.places.ui.launchSavePlaces(/** @type {os.source.Vector} */ (layer.getSource()));
};


/**
 * Save a KML tree to places.
 * @param {!Array<plugin.file.kml.ui.KMLNode>|plugin.file.kml.ui.KMLNode} nodes The root KML node to save
 * @private
 */
plugin.places.action.saveKMLToPlaces_ = function(nodes) {
  // don't allow this if the places root node doesn't exist
  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (!rootNode) {
    return;
  }

  if (!goog.isArray(nodes)) {
    nodes = [nodes];
  }

  var cmds = [];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var clone = plugin.places.action.copyNode_(node);
    if (clone) {
      var cmd = new plugin.file.kml.cmd.KMLNodeAdd(clone, rootNode);
      cmd.title = 'Save ' + node.getLabel() + ' to Places';
      cmds.push(cmd);
    }
  }
  var seq = new os.command.SequenceCommand();
  seq.setCommands(cmds);
  os.command.CommandProcessor.getInstance().addCommand(seq);
};


/**
 * Recursively copy a KML node, including attached features.
 * @param {!plugin.file.kml.ui.KMLNode} node The KML node to copy
 * @return {plugin.file.kml.ui.KMLNode}
 * @private
 */
plugin.places.action.copyNode_ = function(node) {
  var clone = null;
  if (node.isFolder()) {
    clone = plugin.file.kml.ui.updateFolder({
      'name': node.getLabel() || 'Unnamed Folder'
    });

    var children = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (node.getChildren());
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var childClone = plugin.places.action.copyNode_(children[i]);
        if (childClone) {
          clone.addChild(childClone);
        }
      }
    }
  } else {
    var feature = node.getFeature();
    if (feature) {
      feature = plugin.places.copyFeature(feature);
      clone = plugin.file.kml.ui.updatePlacemark({
        'feature': feature
      });
    }
  }

  return clone;
};
