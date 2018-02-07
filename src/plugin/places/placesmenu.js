goog.provide('plugin.places.menu');

goog.require('ol.geom.Point');
goog.require('os');
goog.require('os.command.SequenceCommand');
goog.require('os.feature');
goog.require('os.interaction');
goog.require('os.metrics.keys');
goog.require('os.ui.menu.layer');
goog.require('os.ui.menu.map');
goog.require('os.ui.menu.spatial');
goog.require('plugin.file.kml.cmd.KMLNodeAdd');
goog.require('plugin.places');
goog.require('plugin.places.ui.savePlacesDirective');


/**
 * Places group label for menus.
 * @type {string}
 * @const
 */
plugin.places.menu.GROUP_LABEL = plugin.places.TITLE;


/**
 * Places menu event types.
 * @enum {string}
 */
plugin.places.menu.EventType = {
  SAVE_TO: 'places:saveToPlaces',
  EXPORT: 'places:export',

  // create/edit
  ADD_FOLDER: 'places:addFolder',
  ADD_PLACEMARK: 'places:addPlacemark',
  EDIT_FOLDER: 'places:editFolder',
  EDIT_PLACEMARK: 'places:editPlacemark'
};


/**
 * Add places items to the layer menu.
 */
plugin.places.menu.layerSetup = function() {
  var menu = os.ui.menu.layer.MENU;
  if (menu && !menu.getRoot().find(plugin.places.menu.GROUP_LABEL)) {
    var menuRoot = menu.getRoot();
    menuRoot.addChild({
      label: plugin.places.menu.GROUP_LABEL,
      type: os.ui.menu.MenuItemType.GROUP,
      sort: os.ui.menu.layer.GroupSort.GROUPS++,
      children: [
        {
          label: 'Add Folder',
          eventType: plugin.places.menu.EventType.ADD_FOLDER,
          tooltip: 'Creates a new folder and adds it to the tree',
          icons: ['<i class="fa fa-fw fa-folder"></i>'],
          beforeRender: plugin.places.menu.visibleIfLayerNodeSupported_,
          handler: plugin.places.menu.onLayerEvent_,
          metricKey: os.metrics.Places.ADD_FOLDER
        },
        {
          label: 'Add Place',
          eventType: plugin.places.menu.EventType.ADD_PLACEMARK,
          tooltip: 'Creates a new saved place',
          icons: ['<i class="fa fa-fw fa-map-marker"></i>'],
          beforeRender: plugin.places.menu.visibleIfLayerNodeSupported_,
          handler: plugin.places.menu.onLayerEvent_,
          metricKey: os.metrics.Places.ADD_PLACE
        },
        {
          label: 'Edit Folder',
          eventType: plugin.places.menu.EventType.EDIT_FOLDER,
          tooltip: 'Edit the folder label',
          icons: ['<i class="fa fa-fw fa-pencil"></i>'],
          beforeRender: plugin.places.menu.visibleIfLayerNodeSupported_,
          handler: plugin.places.menu.onLayerEvent_,
          metricKey: os.metrics.Places.EDIT_FOLDER
        },
        {
          label: 'Edit Place',
          eventType: plugin.places.menu.EventType.EDIT_PLACEMARK,
          tooltip: 'Edit the saved place',
          icons: ['<i class="fa fa-fw fa-pencil"></i>'],
          beforeRender: plugin.places.menu.visibleIfLayerNodeSupported_,
          handler: plugin.places.menu.onLayerEvent_,
          metricKey: os.metrics.Places.EDIT_PLACEMARK
        },
        {
          label: 'Export Places...',
          eventType: plugin.places.menu.EventType.EXPORT,
          tooltip: 'Exports ' + plugin.places.TITLE + ' from the selected location',
          icons: ['<i class="fa fa-fw fa-download"></i>'],
          beforeRender: plugin.places.menu.visibleIfLayerNodeSupported_,
          handler: plugin.places.menu.onLayerEvent_,
          metricKey: os.metrics.Places.EXPORT_CONTEXT
        },
        {
          label: 'Save to Places...',
          eventType: plugin.places.menu.EventType.SAVE_TO,
          tooltip: 'Copies selected features to the ' + plugin.places.TITLE +
              ' layer, or all features if none selected',
          icons: ['<i class="fa fa-fw ' + plugin.places.ICON + '"></i>'],
          beforeRender: plugin.places.menu.visibleIfCanSaveLayer,
          handler: plugin.places.menu.saveLayerToPlaces,
          metricKey: os.metrics.Places.SAVE_TO
        }
      ]
    });
  }
};


/**
 * Remove places items from the layer menu.
 */
plugin.places.menu.layerDispose = function() {
  var menu = os.ui.menu.layer.MENU;
  var group = menu ? menu.getRoot().find(os.ui.menu.layer.GroupLabel.TOOLS) : undefined;
  if (group) {
    // remove the entire places group
    group.removeChild(plugin.places.menu.GROUP_LABEL);
  }
};


/**
 * Show the places menu item if layers in the context support it.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @private
 * @this {os.ui.menu.MenuItem}
 */
plugin.places.menu.visibleIfLayerNodeSupported_ = function(context) {
  this.visible = false;

  if (this.eventType && context && context.length == 1) {
    var node = context[0];
    if (node instanceof plugin.file.kml.ui.KMLNode) {
      var pm = plugin.places.PlacesManager.getInstance();
      var placesRoot = pm.getPlacesRoot().getRoot();
      var isPlacesNode = placesRoot === node.getRoot();
      if (!isPlacesNode) {
        return;
      }

      switch (this.eventType) {
        case plugin.places.menu.EventType.ADD_FOLDER:
        case plugin.places.menu.EventType.ADD_PLACEMARK:
          this.visible = node.isFolder() && node.canAddChildren;
          break;
        case plugin.places.menu.EventType.EDIT_FOLDER:
          this.visible = node.isFolder() && node.editable;
          break;
        case plugin.places.menu.EventType.EDIT_PLACEMARK:
          this.visible = !node.isFolder() && node.editable;
          break;
        case plugin.places.menu.EventType.EXPORT:
          this.visible = placesRoot != null && node.getRoot() == placesRoot;
          break;
        default:
          this.visible = node.isFolder();
          break;
      }
    } else if (node instanceof plugin.file.kml.ui.KMLLayerNode) {
      var layer = node.getLayer();
      var isPlacesLayer = layer != null && layer.getId() == plugin.places.ID;

      switch (this.eventType) {
        case plugin.places.menu.EventType.EXPORT:
          this.visible = isPlacesLayer;
          break;
        case plugin.places.menu.EventType.ADD_FOLDER:
        case plugin.places.menu.EventType.ADD_PLACEMARK:
          this.visible = isPlacesLayer && node.isEditable();
          break;
        default:
          break;
      }
    }
  }
};


/**
 * Set up places items on the map.
 */
plugin.places.menu.mapSetup = function() {
  var menu = os.ui.menu.MAP;

  if (menu && !menu.getRoot().find(plugin.places.menu.EventType.SAVE_TO)) {
    var group = menu.getRoot().find('Coordinate');
    if (group) {
      group.addChild({
        label: 'Save to Places...',
        eventType: plugin.places.menu.EventType.SAVE_TO,
        tooltip: 'Creates a new saved place from this location',
        icons: ['<i class="fa fa-fw ' + plugin.places.ICON + '"></i>'],
        handler: plugin.places.menu.saveCoordinateToPlaces
      });
    }
  }
};


/**
 * Clean up places items on the map.
 */
plugin.places.menu.mapDispose = function() {
  var menu = os.ui.menu.MAP;
  if (menu) {
    var group = menu.getRoot().find('Coordinate');
    if (group) {
      group.removeChild(plugin.places.menu.EventType.SAVE_TO);
    }
  }
};


/**
 * Set up places items in the spatial menu.
 */
plugin.places.menu.spatialSetup = function() {
  var menu = os.ui.menu.SPATIAL;
  if (menu) {
    var root = menu.getRoot();
    var group = root.find(os.ui.menu.spatial.Group.TOOLS);
    goog.asserts.assert(group, 'Group "' + os.ui.menu.spatial.Group.TOOLS + '" should exist! Check spelling?');

    if (!group.find(plugin.places.menu.EventType.SAVE_TO)) {
      group.addChild({
        eventType: plugin.places.menu.EventType.SAVE_TO,
        label: 'Save to Places...',
        tooltip: 'Creates a new saved place from the area',
        icons: ['<i class="fa fa-fw ' + plugin.places.ICON + '"></i>'],
        beforeRender: plugin.places.menu.visibleIfCanSaveSpatial,
        handler: plugin.places.menu.saveSpatialToPlaces
      });

      group.addChild({
        eventType: plugin.places.menu.EventType.EDIT_PLACEMARK,
        label: 'Edit Place',
        tooltip: 'Edit the saved place',
        icons: ['<i class="fa fa-fw fa-pencil"></i>'],
        beforeRender: plugin.places.menu.visibleIfIsPlace,
        handler: plugin.places.menu.onSpatialEdit_
      });
    }
  }
};


/**
 * Clean up places items in the spatial menu.
 */
plugin.places.menu.spatialDispose = function() {
  var menu = os.ui.menu.MAP;
  if (menu) {
    var group = menu.getRoot().find(os.ui.menu.spatial.Group.TOOLS);
    if (group) {
      group.removeChild(plugin.places.menu.EventType.SAVE_TO);
      group.removeChild(plugin.places.menu.EventType.EDIT_PLACEMARK);
    }
  }
};


/**
 * Test if spatial args contain a place.
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
plugin.places.menu.spatialIsPlace = function(context) {
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
plugin.places.menu.visibleIfCanSaveSpatial = function(context) {
  this.visible = false;

  if (!plugin.places.menu.spatialIsPlace(context)) {
    var geometries = os.ui.menu.spatial.getGeometriesFromContext(context);
    if (geometries.length === 1) {
      // single geometry, okay to add
      this.visible = true;
    }
  }
};


/**
 * Shows a menu item if the context is a saved place.
 * @param {Object|undefined} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.places.menu.visibleIfIsPlace = function(context) {
  this.visible = plugin.places.menu.spatialIsPlace(context);
};


/**
 * Handle Edit Place from spatial menu.
 * @param {os.ui.menu.MenuEvent} event The event.
 * @private
 */
plugin.places.menu.onSpatialEdit_ = function(event) {
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
 * Handle menu events from the layer menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 * @private
 */
plugin.places.menu.onLayerEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof plugin.file.kml.ui.KMLNode) {
      var source = node.getSource();
      if (source) {
        switch (event.type) {
          case plugin.places.menu.EventType.ADD_FOLDER:
            plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
              'parent': node
            }));
            break;
          case plugin.places.menu.EventType.ADD_PLACEMARK:
            plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
              'parent': node
            }));
            break;
          case plugin.places.menu.EventType.EDIT_FOLDER:
            plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
              'node': node
            }));
            break;
          case plugin.places.menu.EventType.EDIT_PLACEMARK:
            var feature = node.getFeature();
            plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
              'feature': feature,
              'node': node
            }));
            break;
          case plugin.places.menu.EventType.EXPORT:
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
          case plugin.places.menu.EventType.ADD_FOLDER:
            plugin.file.kml.ui.createOrEditFolder(/** @type {!plugin.file.kml.ui.FolderOptions} */ ({
              'parent': rootNode
            }));
            break;
          case plugin.places.menu.EventType.ADD_PLACEMARK:
            plugin.file.kml.ui.createOrEditPlace(/** @type {!plugin.file.kml.ui.PlacemarkOptions} */ ({
              'parent': rootNode
            }));
            break;
          case plugin.places.menu.EventType.EXPORT:
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
 * Show a layer menu item if the context can be saved to Places.
 * @param {os.ui.menu.layer.Context} context The menu context.
 * @this {os.ui.menu.MenuItem}
 */
plugin.places.menu.visibleIfCanSaveLayer = function(context) {
  this.visible = false;

  if (context && context.length == 1) {
    // don't handle places events if the places root node doesn't exist
    var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
    if (!rootNode) {
      return;
    }

    if (context[0] instanceof plugin.file.kml.ui.KMLLayerNode) {
      var layerNode = /** @type {!plugin.file.kml.ui.KMLLayerNode} */ (context[0]);
      var kmlRoot = plugin.places.getPlacesRoot(layerNode);
      this.visible = kmlRoot != null && kmlRoot != rootNode;
    } else if (context[0] instanceof os.data.LayerNode) {
      var layer = /** @type {!os.data.LayerNode} */ (context[0]).getLayer();
      if (layer.getId() != plugin.places.ID && layer instanceof os.layer.Vector) {
        if (layer instanceof plugin.file.kml.KMLLayer) {
          this.visible = true;
        } else {
          var source = layer.getSource();
          if (source instanceof os.source.Vector && source.getFeatureCount() > 0) {
            var features = source.getFilteredFeatures();
            this.visible = features != null && features.length > 0;
          }
        }
      }
    } else if (context[0] instanceof plugin.file.kml.ui.KMLNode) {
      var features = context[0].getFeatures();
      this.visible = (context[0].getRoot() != rootNode.getRoot()) && (features.length > 0);
    }
  }
};


/**
 * Save a coordinate to places.
 * @param {os.ui.menu.MenuEvent<ol.Coordinate>} event The menu event.
 */
plugin.places.menu.saveCoordinateToPlaces = function(event) {
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
plugin.places.menu.saveSpatialToPlaces = function(event) {
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
 * Handle "Save to Places" events from the layer menu.
 * @param {!os.ui.menu.MenuEvent<os.ui.menu.layer.Context>} event The menu event.
 */
plugin.places.menu.saveLayerToPlaces = function(event) {
  var context = event.getContext();
  if (context && event instanceof goog.events.Event && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
    if (context && context.length == 1) {
      if (context[0] instanceof plugin.file.kml.ui.KMLLayerNode) {
        var layerNode = /** @type {!plugin.file.kml.ui.KMLLayerNode} */ (context[0]);
        var kmlRoot = /** @type {Array<plugin.file.kml.ui.KMLNode>} */
            (plugin.file.kml.ui.getKMLRoot(layerNode).getChildren());
        if (kmlRoot && kmlRoot != rootNode) {
          plugin.places.menu.saveKMLToPlaces_(kmlRoot);
        }
      } else if (context[0] instanceof os.data.LayerNode) {
        var layer = /** @type {os.data.LayerNode} */ (context[0]).getLayer();
        if (layer.getId() != plugin.places.ID) {
          if (layer instanceof plugin.file.kml.KMLLayer) {
            var source = /** @type {plugin.file.kml.KMLSource} */ (layer.getSource());
            var kmlRoot = source ? source.getRootNode() : undefined;
            if (kmlRoot) {
              plugin.places.menu.saveKMLToPlaces_(kmlRoot);
            }
          } else if (rootNode && layer instanceof os.layer.Vector) {
            plugin.places.ui.launchSavePlaces(/** @type {os.source.Vector} */ (layer.getSource()));
          }
        }
      } else if (context[0] instanceof plugin.file.kml.ui.KMLNode && context[0].getRoot() != rootNode) {
        plugin.places.menu.saveKMLToPlaces_(/** @type {!plugin.file.kml.ui.KMLNode} */ (context[0]));
      }
    }
  }
};


/**
 * Save a KML tree to places.
 * @param {!Array<plugin.file.kml.ui.KMLNode>|plugin.file.kml.ui.KMLNode} nodes The root KML node to save
 * @private
 */
plugin.places.menu.saveKMLToPlaces_ = function(nodes) {
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
    var clone = plugin.places.menu.copyNode_(node);
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
plugin.places.menu.copyNode_ = function(node) {
  var clone = null;
  if (node.isFolder()) {
    clone = plugin.file.kml.ui.updateFolder({
      'name': node.getLabel() || 'Unnamed Folder'
    });

    var children = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (node.getChildren());
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var childClone = plugin.places.menu.copyNode_(children[i]);
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
