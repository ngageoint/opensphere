goog.module('plugin.places.menu');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const Point = goog.require('ol.geom.Point');
const os = goog.require('os');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const ParallelCommand = goog.require('os.command.ParallelCommand');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const DataManager = goog.require('os.data.DataManager');
const LayerNode = goog.require('os.data.LayerNode');
const RecordField = goog.require('os.data.RecordField');
const osFeature = goog.require('os.feature');
const {ORIGINAL_GEOM_FIELD} = goog.require('os.interpolate');
const VectorLayer = goog.require('os.layer.Vector');
const {Places: PlacesKeys} = goog.require('os.metrics.keys');
const VectorSource = goog.require('os.source.Vector');
const {launchFeatureList} = goog.require('os.ui.FeatureListUI');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const layerMenu = goog.require('os.ui.menu.layer');
const mapMenu = goog.require('os.ui.menu.map');
const spatial = goog.require('os.ui.menu.spatial');
const KMLLayer = goog.require('plugin.file.kml.KMLLayer');
const KMLNodeAdd = goog.require('plugin.file.kml.cmd.KMLNodeAdd');
const KMLNodeRemove = goog.require('plugin.file.kml.cmd.KMLNodeRemove');
const {
  createOrEditFolder,
  createOrEditPlace,
  getKMLRoot,
  updateFolder,
  updatePlacemark
} = goog.require('plugin.file.kml.ui');
const KMLLayerNode = goog.require('plugin.file.kml.ui.KMLLayerNode');
const KMLNode = goog.require('plugin.file.kml.ui.KMLNode');
const places = goog.require('plugin.places');
const EventType = goog.require('plugin.places.EventType');
const PlacesManager = goog.require('plugin.places.PlacesManager');
const PlacesUI = goog.require('plugin.places.ui.PlacesUI');
const QuickAddPlacesUI = goog.require('plugin.places.ui.QuickAddPlacesUI');
const {launchSavePlaces} = goog.require('plugin.places.ui.launchSavePlaces');

const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');
const MenuItem = goog.requireType('os.ui.menu.MenuItem');
const {FolderOptions, PlacemarkOptions} = goog.requireType('plugin.file.kml.ui');


/**
 * Places group label for menus.
 * @type {string}
 */
const GROUP_LABEL = places.TITLE;

/**
 * Add places items to the layer menu.
 */
const layerSetup = function() {
  var menu = layerMenu.getMenu();
  if (menu && !menu.getRoot().find(GROUP_LABEL)) {
    var menuRoot = menu.getRoot();
    menuRoot.addChild({
      label: GROUP_LABEL,
      type: MenuItemType.GROUP,
      sort: layerMenu.GroupSort.GROUPS++,
      children: [
        {
          label: 'Create Folder...',
          eventType: EventType.ADD_FOLDER,
          tooltip: 'Creates a new folder and adds it to the tree',
          icons: ['<i class="fa fa-fw fa-folder-plus"></i>'],
          beforeRender: visibleIfLayerNodeSupported_,
          handler: onLayerEvent_,
          metricKey: PlacesKeys.ADD_FOLDER,
          sort: 100
        },
        {
          label: 'Create Place...',
          eventType: EventType.ADD_PLACEMARK,
          tooltip: 'Creates a new saved place',
          icons: ['<i class="fa fa-fw fa-map-marker"></i>'],
          beforeRender: visibleIfLayerNodeSupported_,
          handler: onLayerEvent_,
          metricKey: PlacesKeys.ADD_PLACE,
          sort: 110
        },
        {
          label: 'Quick Add Places...',
          eventType: EventType.QUICK_ADD_PLACES,
          tooltip: 'Quickly add places to the selected folder',
          icons: ['<i class="fa fa-fw ' + places.Icon.QUICK_ADD + '"></i>'],
          beforeRender: visibleIfLayerNodeSupported_,
          handler: onLayerEvent_,
          metricKey: PlacesKeys.QUICK_ADD_PLACES,
          sort: 120
        },
        {
          label: 'Show Features',
          eventType: EventType.FEATURE_LIST,
          tooltip: 'Displays features in the layer',
          icons: ['<i class="fa fa-fw fa-table"></i>'],
          beforeRender: visibleIfLayerNodeSupported_,
          handler: onLayerEvent_,
          metricKey: PlacesKeys.FEATURE_LIST,
          sort: 125
        },
        {
          label: 'Edit Folder...',
          eventType: EventType.EDIT_FOLDER,
          tooltip: 'Edit the folder label',
          icons: ['<i class="fa fa-fw fa-pencil"></i>'],
          beforeRender: visibleIfLayerNodeSupported_,
          handler: onLayerEvent_,
          metricKey: PlacesKeys.EDIT_FOLDER,
          sort: 130
        },
        {
          label: 'Edit Place...',
          eventType: EventType.EDIT_PLACEMARK,
          tooltip: 'Edit the saved place',
          icons: ['<i class="fa fa-fw fa-pencil"></i>'],
          beforeRender: visibleIfLayerNodeSupported_,
          handler: onLayerEvent_,
          metricKey: PlacesKeys.EDIT_PLACEMARK,
          sort: 140
        },
        {
          label: 'Export Places...',
          eventType: EventType.EXPORT,
          tooltip: 'Exports ' + places.TITLE + ' from the selected location',
          icons: ['<i class="fa fa-fw fa-download"></i>'],
          beforeRender: visibleIfLayerNodeSupported_,
          handler: onLayerEvent_,
          metricKey: PlacesKeys.EXPORT_CONTEXT,
          sort: 150
        },
        {
          label: 'Save to Places...',
          eventType: EventType.SAVE_TO,
          tooltip: 'Copies selected features to the ' + places.TITLE +
              ' layer, or all features if none selected',
          icons: ['<i class="fa fa-fw ' + places.Icon.PLACEMARK + '"></i>'],
          beforeRender: visibleIfCanSaveLayer,
          handler: saveLayerToPlaces,
          metricKey: PlacesKeys.SAVE_TO,
          sort: 160
        },
        {
          label: 'Remove',
          eventType: EventType.REMOVE_PLACE,
          tooltip: 'Removes the place',
          icons: ['<i class="fa fa-fw fa-times"></i>'],
          beforeRender: visibleIfLayerNodeSupported_,
          handler: onLayerEvent_,
          metricKey: PlacesKeys.REMOVE_PLACE,
          sort: 170
        },
        {
          label: 'Remove All',
          eventType: EventType.REMOVE_ALL,
          tooltip: 'Removes all of the places',
          icons: ['<i class="fa fa-fw fa-times"></i>'],
          beforeRender: visibleIfLayerNodeSupported_,
          handler: onLayerEvent_,
          metricKey: PlacesKeys.REMOVE_ALL,
          sort: 180
        }
      ]
    });
  }
};

/**
 * Remove places items from the layer menu.
 */
const layerDispose = function() {
  var menu = layerMenu.getMenu();
  var group = menu ? menu.getRoot().find(layerMenu.GroupLabel.TOOLS) : undefined;
  if (group) {
    // remove the entire places group
    group.removeChild(GROUP_LABEL);
  }
};

/**
 * Show the places menu item if layers in the context support it.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfLayerNodeSupported_ = function(context) {
  this.visible = false;

  if (this.eventType && context && context.length == 1) {
    var node = context[0];
    if (node instanceof KMLNode) {
      var pm = PlacesManager.getInstance();
      var placesRoot = pm.getPlacesRoot().getRoot();
      var isPlacesNode = placesRoot === node.getRoot();
      if (!isPlacesNode) {
        return;
      }

      switch (this.eventType) {
        case EventType.ADD_FOLDER:
        case EventType.ADD_PLACEMARK:
        case EventType.QUICK_ADD_PLACES:
          this.visible = node.isFolder() && node.canAddChildren;
          break;
        case EventType.EDIT_FOLDER:
          this.visible = node.isFolder() && node.editable;
          break;
        case EventType.EDIT_PLACEMARK:
          this.visible = !node.isFolder() && node.editable;
          break;
        case EventType.EXPORT:
          this.visible = placesRoot != null && node.getRoot() == placesRoot;
          break;
        case EventType.FEATURE_LIST:
          this.visible = node.isFolder() || node.hasChildren();
          break;
        case EventType.REMOVE_PLACE:
          if (node.isFolder() || node.hasChildren()) {
            this.visible = false;
          } else {
            this.visible = node.removable;
          }
          break;
        case EventType.REMOVE_ALL:
          this.visible = false;
          break;
        default:
          this.visible = node.isFolder();
          break;
      }
    } else if (node instanceof KMLLayerNode) {
      var layer = node.getLayer();
      var isPlacesLayer = layer != null && layer.getId() == places.ID;

      switch (this.eventType) {
        case EventType.EXPORT:
          this.visible = isPlacesLayer;
          break;
        case EventType.ADD_FOLDER:
        case EventType.ADD_PLACEMARK:
        case EventType.QUICK_ADD_PLACES:
          this.visible = isPlacesLayer && node.isEditable();
          break;
        case EventType.FEATURE_LIST:
        case EventType.REMOVE_ALL:
          this.visible = isPlacesLayer && node.hasChildren();
          break;
        default:
          break;
      }
    }
  } else if (context && context.length > 1) {
    for (var i = 0; i < context.length; i++) {
      var node = context[i];
      if (node instanceof KMLNode) {
        var pm = PlacesManager.getInstance();
        var placesRoot = pm.getPlacesRoot().getRoot();
        var isPlacesNode = placesRoot === node.getRoot();
        if (!isPlacesNode) {
          this.visible = false;
          return;
        }

        switch (this.eventType) {
          case EventType.REMOVE_PLACE:
            this.visible = node.removable;
            break;
          default:
            this.visible = false;
            break;
        }
      } else {
        this.visible = false;
      }
      // If the event is not visible for one node, then quit checking
      if (!this.visible) {
        break;
      }
    }
  }
};

/**
 * Set up places items on the map.
 */
const mapSetup = function() {
  var menu = mapMenu.getMenu();

  if (menu && !menu.getRoot().find(GROUP_LABEL)) {
    var root = menu.getRoot();
    root.addChild({
      label: GROUP_LABEL,
      type: MenuItemType.GROUP,
      sort: 50,
      children: [
        {
          label: 'Create Place...',
          eventType: EventType.SAVE_TO,
          tooltip: 'Creates a new saved place from this location',
          icons: ['<i class="fa fa-fw ' + places.Icon.PLACEMARK + '"></i>'],
          beforeRender: mapMenu.showIfHasCoordinate,
          handler: saveCoordinateToPlaces,
          metricKey: PlacesKeys.ADD_PLACE,
          sort: 0
        }, {
          label: 'Create Text Box...',
          eventType: EventType.SAVE_TO_ANNOTATION,
          tooltip: 'Creates a new saved place with a text box at this location',
          icons: ['<i class="fa fa-fw ' + places.Icon.ANNOTATION + '"></i>'],
          beforeRender: mapMenu.showIfHasCoordinate,
          handler: createAnnotationFromCoordinate,
          metricKey: PlacesKeys.ADD_ANNOTATION,
          sort: 1
        },
        {
          label: 'Quick Add Places...',
          eventType: EventType.QUICK_ADD_PLACES,
          tooltip: 'Quickly add places to the selected folder',
          icons: ['<i class="fa fa-fw ' + places.Icon.QUICK_ADD + '"></i>'],
          beforeRender: mapMenu.showIfHasCoordinate,
          handler: quickAddFromCoordinate,
          metricKey: PlacesKeys.QUICK_ADD_PLACES,
          sort: 120
        }
      ]
    });
  }
};

/**
 * Clean up places items on the map.
 */
const mapDispose = function() {
  var menu = mapMenu.getMenu();
  if (menu) {
    var group = menu.getRoot().find(mapMenu.GroupLabel.COORDINATE);
    if (group) {
      group.removeChild(EventType.SAVE_TO);
    }
  }
};

/**
 * Set up places items in the spatial menu.
 */
const spatialSetup = function() {
  var menu = spatial.getMenu();

  if (menu && !menu.getRoot().find(GROUP_LABEL)) {
    var root = menu.getRoot();
    root.addChild({
      label: GROUP_LABEL,
      type: MenuItemType.GROUP,
      sort: 50,
      children: [
        {
          label: 'Create Place...',
          eventType: EventType.SAVE_TO,
          tooltip: 'Creates a new place from the feature',
          icons: ['<i class="fa fa-fw ' + places.Icon.PLACEMARK + '"></i>'],
          beforeRender: visibleIfCanSaveSpatial,
          handler: saveSpatialToPlaces,
          metricKey: PlacesKeys.ADD_PLACE,
          sort: 100
        }, {
          label: 'Edit Place',
          eventType: EventType.EDIT_PLACEMARK,
          tooltip: 'Edit the saved place',
          icons: ['<i class="fa fa-fw fa-pencil"></i>'],
          beforeRender: visibleIfIsPlace,
          handler: onSpatialEdit_,
          sort: 110
        },
        {
          label: 'Create Text Box...',
          eventType: EventType.SAVE_TO_ANNOTATION,
          tooltip: 'Creates a new place with a text box',
          icons: ['<i class="fa fa-fw ' + places.Icon.ANNOTATION + '"></i>'],
          beforeRender: visibleIfCanSaveSpatial,
          handler: saveSpatialToAnnotation,
          metricKey: PlacesKeys.ADD_ANNOTATION,
          sort: 120
        },
        {
          label: 'Quick Add Places...',
          eventType: EventType.QUICK_ADD_PLACES,
          tooltip: 'Quickly add places to the selected folder',
          icons: ['<i class="fa fa-fw ' + places.Icon.QUICK_ADD + '"></i>'],
          beforeRender: visibleIfCanSaveSpatial,
          handler: quickAddFromSpatial,
          metricKey: PlacesKeys.QUICK_ADD_PLACES,
          sort: 120
        }
      ]
    });
  }
};

/**
 * Clean up places items in the spatial menu.
 */
const spatialDispose = function() {
  var menu = mapMenu.getMenu();
  if (menu) {
    var group = menu.getRoot().find(spatial.Group.TOOLS);
    if (group) {
      group.removeChild(EventType.SAVE_TO);
      group.removeChild(EventType.EDIT_PLACEMARK);
    }
  }
};

/**
 * Test if spatial args contain a place.
 *
 * @param {Object|undefined} context The menu context.
 * @return {boolean}
 */
const spatialIsPlace = function(context) {
  var features = spatial.getFeaturesFromContext(context);
  if (features.length === 1) {
    var feature = features[0];
    var sourceId = feature.get(RecordField.SOURCE_ID);

    return sourceId === places.ID;
  }

  // ignore everything else
  return false;
};

/**
 * Shows a menu item if the context can be saved to places.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfCanSaveSpatial = function(context) {
  this.visible = false;

  if (!spatialIsPlace(context)) {
    var geometries = spatial.getGeometriesFromContext(context);
    if (geometries.length === 1) {
      // single geometry, okay to add
      this.visible = true;
    }
  }
};

/**
 * Shows a menu item if the context is a saved place.
 *
 * @param {Object|undefined} context The menu context.
 * @this {MenuItem}
 */
const visibleIfIsPlace = function(context) {
  this.visible = spatialIsPlace(context);
};

/**
 * Handle Edit Place from spatial menu.
 *
 * @param {MenuEvent} event The event.
 */
const onSpatialEdit_ = function(event) {
  var features = spatial.getFeaturesFromContext(/** @type {Object} */ (event.getContext()));
  if (features.length === 1) {
    var feature = features[0];
    var source = /** @type {plugin.file.kml.KMLSource} */ (DataManager.getInstance().getSource(places.ID));
    if (source) {
      var node = source.getFeatureNode(feature);
      if (node) {
        createOrEditPlace({
          'feature': feature,
          'node': node
        });
      }
    }
  }
};

/**
 * Handle menu events from the layer menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const onLayerEvent_ = function(event) {
  var context = event.getContext();
  if (context && context.length == 1) {
    var node = context[0];
    if (node instanceof KMLNode) {
      var source = node.getSource();
      if (source) {
        switch (event.type) {
          case EventType.ADD_FOLDER:
            createOrEditFolder(/** @type {!FolderOptions} */ ({
              'parent': node
            }));
            break;
          case EventType.ADD_PLACEMARK:
            createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
              'parent': node
            }));
            break;
          case EventType.QUICK_ADD_PLACES:
            QuickAddPlacesUI.launch(node);
            break;
          case EventType.FEATURE_LIST:
            if (source instanceof VectorSource) {
              launchFeatureList(source);
            }
            break;
          case EventType.EDIT_FOLDER:
            createOrEditFolder(/** @type {!FolderOptions} */ ({
              'node': node
            }));
            break;
          case EventType.EDIT_PLACEMARK:
            var feature = node.getFeature();
            createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
              'feature': feature,
              'node': node
            }));
            break;
          case EventType.EXPORT:
            PlacesUI.launchExportUI(/** @type {!KMLNode} */ (node));
            break;
          case EventType.REMOVE_PLACE:
            var cmd = new KMLNodeRemove(node);
            CommandProcessor.getInstance().addCommand(cmd);
            break;
          default:
            break;
        }
      }
    } else if (node instanceof KMLLayerNode) {
      var rootNode = getKMLRoot(node).getChildren()[0];
      if (rootNode) {
        switch (event.type) {
          case EventType.ADD_FOLDER:
            createOrEditFolder(/** @type {!FolderOptions} */ ({
              'parent': rootNode
            }));
            break;
          case EventType.ADD_PLACEMARK:
            createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
              'parent': rootNode
            }));
            break;
          case EventType.QUICK_ADD_PLACES:
            QuickAddPlacesUI.launch();
            break;
          case EventType.EXPORT:
            PlacesUI.launchExportUI(/** @type {!KMLNode} */ (rootNode));
            break;
          case EventType.REMOVE_ALL:
            var children = /** @type {Array<!KMLNode>} */ (node.getChildren());
            var cmds = [];

            for (var i = 0; i < children.length; i++) {
              var rmCmd = new KMLNodeRemove(children[i]);
              cmds.push(rmCmd);
            }
            if (cmds.length) {
              var cmd = new ParallelCommand();
              cmd.setCommands(cmds);
              cmd.title = 'Remove Place' + (cmds.length > 1 ? 's' : '');
              CommandProcessor.getInstance().addCommand(cmd);
            }
            break;
          default:
            break;
        }
      }
    }
  } else if (context && context.length > 1) {
    var cmds = [];
    for (var i = 0; i < context.length; i++) {
      var node = context[i];
      if (node instanceof KMLNode) {
        var source = node.getSource();
        if (source) {
          switch (event.type) {
            case EventType.REMOVE_PLACE:
              var rmCmd = new KMLNodeRemove(node);
              cmds.push(rmCmd);
              break;
            default:
              break;
          }
        }
      }
    }

    if (cmds.length) {
      var cmd = new ParallelCommand();
      cmd.setCommands(cmds);
      cmd.title = 'Remove Place' + (cmds.length > 1 ? 's' : '');
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }
};

/**
 * Show a layer menu item if the context can be saved to Places.
 *
 * @param {layerMenu.Context} context The menu context.
 * @this {MenuItem}
 */
const visibleIfCanSaveLayer = function(context) {
  this.visible = false;

  if (context && context.length == 1) {
    // don't handle places events if the places root node doesn't exist
    var rootNode = PlacesManager.getInstance().getPlacesRoot();
    if (!rootNode) {
      return;
    }

    if (context[0] instanceof KMLLayerNode) {
      var layerNode = /** @type {!KMLLayerNode} */ (context[0]);
      var kmlRoot = places.getPlacesRoot(layerNode);
      this.visible = kmlRoot != null && kmlRoot != rootNode;
    } else if (context[0] instanceof LayerNode) {
      var layer = /** @type {!LayerNode} */ (context[0]).getLayer();
      if (layer.getId() != places.ID && layer instanceof VectorLayer) {
        if (layer instanceof KMLLayer) {
          this.visible = true;
        } else {
          var source = layer.getSource();
          if (source instanceof VectorSource && source.getFeatureCount() > 0) {
            var features = source.getFilteredFeatures();
            this.visible = features != null && features.length > 0;
          }
        }
      }
    } else if (context[0] instanceof KMLNode) {
      var node = /** @type {KMLNode} */ (context[0]);
      var features = node.getFeatures();
      this.visible = (node.getRoot() != rootNode.getRoot()) && (features.length > 0);
    }
  }
};

/**
 * Save a coordinate to places.
 *
 * @param {MenuEvent<ol.Coordinate>} event The menu event.
 */
const saveCoordinateToPlaces = function(event) {
  var context = event.getContext();
  if (context && event instanceof GoogEvent && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    var rootNode = PlacesManager.getInstance().getPlacesRoot();
    createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
      'geometry': new Point(context),
      'parent': rootNode
    }));
  }
};

/**
 * Save a coordinate to places as an annotation.
 *
 * @param {MenuEvent<ol.Coordinate>} event The menu event.
 */
const createAnnotationFromCoordinate = function(event) {
  var context = event.getContext();
  if (context && event instanceof GoogEvent && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    var rootNode = PlacesManager.getInstance().getAnnotationsFolder();
    createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
      'annotation': true,
      'geometry': new Point(context),
      'parent': rootNode
    }));
  }
};

/**
 * Launch the quick add dialog with an initial seed point.
 *
 * @param {MenuEvent<ol.Coordinate>} event The menu event.
 */
const quickAddFromCoordinate = function(event) {
  var context = event.getContext();
  if (context && event instanceof GoogEvent && !os.inIframe()) {
    event.preventDefault();
    event.stopPropagation();

    QuickAddPlacesUI.launch(undefined, new Point(context));
  }
};

/**
 * Launch the quick add dialog with an initial seed point.
 *
 * @param {MenuEvent<Object>} event The menu event.
 */
const quickAddFromSpatial = function(event) {
  var context = event.getContext();
  if (context) {
    var geom = /** @type {ol.geom.SimpleGeometry} */ (context['geometry']);
    QuickAddPlacesUI.launch(undefined, geom);
  }
};

/**
 * Save the spatial menu context to an annotation.
 *
 * @param {MenuEvent} event The menu event.
 */
const saveSpatialToAnnotation = function(event) {
  saveSpatialToPlaces(event, true);
};

/**
 * Save the spatial menu context to places.
 *
 * @param {MenuEvent} event The menu event.
 * @param {boolean=} opt_annotation Whether the spatial save is an annotation.
 */
const saveSpatialToPlaces = function(event, opt_annotation) {
  var context = event.getContext();
  if (context && event instanceof GoogEvent && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    var rootNode = opt_annotation ? PlacesManager.getInstance().getAnnotationsFolder() :
      PlacesManager.getInstance().getPlacesRoot();
    var geometry;
    var name;
    var time;

    context = /** @type {Object} */ (context);

    // first check if there are features to buffer
    var features = spatial.getFeaturesFromContext(context);
    if (features.length === 1) {
      name = osFeature.getTitle(features[0]);

      var featureGeom = features[0].get(ORIGINAL_GEOM_FIELD) || features[0].getGeometry();
      if (featureGeom) {
        geometry = featureGeom.clone();
      }

      time = features[0].get(RecordField.TIME);
    } else {
      // next look for geometries
      var geometries = spatial.getGeometriesFromContext(context);
      if (geometries.length === 1) {
        geometry = geometries[0].clone();
      }
    }

    if (geometry) {
      // if found, save away
      createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
        'annotation': opt_annotation,
        'geometry': geometry,
        'parent': rootNode,
        'name': name,
        'time': time
      }));
    }
  }
};

/**
 * Handle "Save to Places" events from the layer menu.
 *
 * @param {!MenuEvent<layerMenu.Context>} event The menu event.
 */
const saveLayerToPlaces = function(event) {
  var context = event.getContext();
  if (context && event instanceof GoogEvent && !os.inIframe()) {
    // Here's a fun exploitation of the whole window context and instanceof problem.
    // We only want to handle the event if it was created in *this* window context and
    // this context isn't in an iframe.
    event.preventDefault();
    event.stopPropagation();

    var rootNode = PlacesManager.getInstance().getPlacesRoot();
    if (context && context.length == 1) {
      if (context[0] instanceof KMLLayerNode) {
        var layerNode = /** @type {!KMLLayerNode} */ (context[0]);
        var kmlRoot = /** @type {Array<KMLNode>} */
            (getKMLRoot(layerNode).getChildren());
        if (kmlRoot && kmlRoot != rootNode) {
          saveKMLToPlaces(kmlRoot);
        }
      } else if (context[0] instanceof LayerNode) {
        var layer = /** @type {LayerNode} */ (context[0]).getLayer();
        if (layer.getId() != places.ID) {
          if (layer instanceof KMLLayer) {
            var source = /** @type {plugin.file.kml.KMLSource} */ (layer.getSource());
            var kmlRoot = source ? source.getRootNode() : undefined;
            if (kmlRoot) {
              saveKMLToPlaces(kmlRoot);
            }
          } else if (rootNode && layer instanceof VectorLayer) {
            launchSavePlaces(/** @type {os.source.Vector} */ (layer.getSource()));
          }
        }
      } else if (context[0] instanceof KMLNode && context[0].getRoot() != rootNode) {
        saveKMLToPlaces(/** @type {!KMLNode} */ (context[0]));
      }
    }
  }
};

/**
 * Save a KML tree to places.
 *
 * @param {!Array<KMLNode>|KMLNode} nodes The root KML node to save
 */
const saveKMLToPlaces = function(nodes) {
  // don't allow this if the places root node doesn't exist
  var rootNode = PlacesManager.getInstance().getPlacesRoot();
  if (!rootNode) {
    return;
  }

  if (!Array.isArray(nodes)) {
    nodes = [nodes];
  }

  var cmds = [];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var clone = copyNode_(node);
    if (clone) {
      var cmd = new KMLNodeAdd(clone, rootNode);
      cmd.title = 'Save ' + node.getLabel() + ' to Places';
      cmds.push(cmd);
    }
  }
  var seq = new SequenceCommand();
  seq.setCommands(cmds);
  CommandProcessor.getInstance().addCommand(seq);
};

/**
 * Recursively copy a KML node, including attached features.
 *
 * @param {!KMLNode} node The KML node to copy
 * @return {KMLNode}
 */
const copyNode_ = function(node) {
  var clone = null;
  if (node.isFolder()) {
    clone = updateFolder({
      'name': node.getLabel() || 'Unnamed Folder'
    });

    var children = /** @type {Array<!KMLNode>} */ (node.getChildren());
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var childClone = copyNode_(children[i]);
        if (childClone) {
          clone.addChild(childClone);
        }
      }
    }
  } else {
    var feature = node.getFeature();
    if (feature) {
      feature = places.copyFeature(feature);
      clone = updatePlacemark({
        'feature': feature
      });
    }
  }

  return clone;
};

exports = {
  GROUP_LABEL,
  layerSetup,
  layerDispose,
  mapSetup,
  mapDispose,
  spatialSetup,
  spatialDispose,
  spatialIsPlace,
  visibleIfCanSaveSpatial,
  visibleIfIsPlace,
  visibleIfCanSaveLayer,
  saveCoordinateToPlaces,
  createAnnotationFromCoordinate,
  quickAddFromCoordinate,
  quickAddFromSpatial,
  saveSpatialToAnnotation,
  saveSpatialToPlaces,
  saveLayerToPlaces,
  saveKMLToPlaces
};
