goog.module('plugin.places');
goog.module.declareLegacyNamespace();

const {removeDuplicates} = goog.require('goog.array');
const {getUid} = goog.require('ol');
const Feature = goog.require('ol.Feature');
const Geometry = goog.require('ol.geom.Geometry');
const Fields = goog.require('os.Fields');
const MapContainer = goog.require('os.MapContainer');
const annotation = goog.require('os.annotation');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const RecordField = goog.require('os.data.RecordField');
const osFeature = goog.require('os.feature');
const osObject = goog.require('os.object');
const osOlFeature = goog.require('os.ol.feature');
const osStyle = goog.require('os.style');
const StyleField = goog.require('os.style.StyleField');
const StyleType = goog.require('os.style.StyleType');
const TimeInstant = goog.require('os.time.TimeInstant');
const TimeRange = goog.require('os.time.TimeRange');
const FeatureEditCtrl = goog.require('os.ui.FeatureEditCtrl');
const kml = goog.require('plugin.file.kml');
const KMLField = goog.require('plugin.file.kml.KMLField');
const KMLTreeExporter = goog.require('plugin.file.kml.KMLTreeExporter');
const KMLNodeAdd = goog.require('plugin.file.kml.cmd.KMLNodeAdd');
const {METHOD_FIELD} = goog.require('os.interpolate');
const {getKMLRoot, updateFolder, updatePlacemark} = goog.require('plugin.file.kml.ui');

const KMLLayerNode = goog.requireType('plugin.file.kml.ui.KMLLayerNode');
const KMLNode = goog.requireType('plugin.file.kml.ui.KMLNode');
const PlacesManager = goog.requireType('plugin.places.PlacesManager');


/**
 * Identifier used by the places plugin.
 * @type {string}
 */
const ID = 'places';

/**
 * Places layer title.
 * @type {string}
 */
const TITLE = 'Saved Places';

/**
 * Places icons.
 * @enum {string}
 */
const Icon = {
  ANNOTATION: 'fa-comment',
  FOLDER: 'fa-folder',
  PLACEMARK: 'fa-map-marker',
  QUICK_ADD: 'fa-bolt'
};

/**
 * Places icon.
 * @type {string}
 */
const ICON = Icon.PLACEMARK;

/**
 * Fields that must be exported to the KML. Any style fields (like shape) that aren't supported by the KML spec must be
 * included here, or features will revert to using an icon on import.
 *
 * @type {!Array<string>}
 */
const ExportFields = [
  KMLField.DESCRIPTION,
  KMLField.MD_DESCRIPTION,
  annotation.OPTIONS_FIELD,
  StyleField.CENTER_SHAPE,
  StyleField.SHAPE,
  StyleField.LABELS,
  StyleField.SHOW_LABELS,
  StyleField.SHOW_LABEL_COLUMNS,
  StyleField.LABEL_COLOR,
  StyleField.LABEL_SIZE,
  StyleField.FILL_COLOR,
  StyleField.SHOW_ROTATION,
  StyleField.ROTATION_COLUMN,
  Fields.ALT,
  Fields.ALT_UNITS,
  RecordField.ALTITUDE_MODE,
  Fields.SEMI_MAJOR,
  Fields.SEMI_MINOR,
  Fields.SEMI_MAJOR_UNITS,
  Fields.SEMI_MINOR_UNITS,
  Fields.ORIENTATION,
  Fields.BEARING,
  RecordField.RING_OPTIONS,
  METHOD_FIELD
];

/**
 * Fields that should be displayed on the Places source.
 *
 * @type {!Array<string>}
 */
const SourceFields = [
  KMLField.NAME,
  KMLField.DESCRIPTION,
  Fields.BEARING,
  Fields.LAT,
  Fields.LON,
  Fields.LAT_DDM,
  Fields.LON_DDM,
  Fields.LAT_DMS,
  Fields.LON_DMS,
  Fields.MGRS,
  Fields.SEMI_MAJOR,
  Fields.SEMI_MINOR,
  Fields.SEMI_MAJOR_UNITS,
  Fields.SEMI_MINOR_UNITS,
  Fields.TIME,
  Fields.ORIENTATION
];

/**
 * Fields that should be copied when cloning KML nodes.
 * This should include all of the KML source fields, and the internal Places fields.
 *
 * @type {!Array<string>}
 */
const CopyableFields = ExportFields.concat(kml.SOURCE_FIELDS);
removeDuplicates(CopyableFields);

/**
 * @typedef {{
 *   name: (string|undefined),
 *   parent: (KMLNode|undefined)
 * }}
 */
let FolderOptions;

/**
 * @typedef {{
 *   description: (string|undefined),
 *   endTime: (number|undefined),
 *   geometry: (ol.geom.Geometry|undefined),
 *   id: (number|string|undefined),
 *   name: (string|undefined),
 *   parent: (KMLNode|undefined),
 *   shape: (osStyle.ShapeType|undefined),
 *   startTime: (number|undefined),
 *   styleConfig: (Object|undefined)
 * }}
 */
let PlaceOptions;

/**
 * The global PlacesManager instance. This is used to deconflict circular dependencies.
 */
let placesManager;

/**
 * Set the global PlacesManager instance.
 * @return {PlacesManager|undefined}
 */
const getPlacesManager = () => placesManager;

/**
 * Set the global PlacesManager instance.
 * @param {!PlacesManager} value The instance.
 */
const setPlacesManager = (value) => {
  placesManager = value;
};

/**
 * Create a KML tree exporter for the provided root node.
 *
 * @param {KMLNode} root The root node to export
 * @return {KMLTreeExporter}
 */
const createExporter = function(root) {
  var exporter = new KMLTreeExporter();
  exporter.setFields(ExportFields);
  exporter.setName(TITLE);

  // don't include the root node to avoid the superfluous folder
  exporter.setItems(root && root.getChildren() || []);

  return exporter;
};

/**
 * If the Places layer is on the map.
 *
 * @return {boolean}
 */
const isLayerPresent = function() {
  return MapContainer.getInstance().getLayer(ID) != null;
};

/**
 * Copy a feature, saving its current style as a local feature style.
 *
 * @param {!Feature} feature The feature to copy
 * @param {Object=} opt_layerConfig The feature's layer config
 * @return {!ol.Feature}
 */
const copyFeature = function(feature, opt_layerConfig) {
  var clone = osOlFeature.clone(feature, CopyableFields);
  clone.setId(getUid(clone));

  // copy the feature's current style to a new config and set it on the cloned feature
  // base config priority: feature config > layer config > default config
  var baseConfig = /** @type {Object|undefined} */ (feature.get(StyleType.FEATURE)) || opt_layerConfig ||
      osStyle.DEFAULT_VECTOR_CONFIG;
  var featureConfig = osStyle.createFeatureConfig(feature, baseConfig, opt_layerConfig);
  var isIcon = osStyle.isIconConfig(featureConfig);
  if (!isIcon && featureConfig['image']) {
    delete featureConfig['image']['src'];
    delete featureConfig['image']['scale'];
  }

  clone.set(StyleType.FEATURE, featureConfig);

  var shapeName = osFeature.getShapeName(feature) || osStyle.ShapeType.DEFAULT;
  if (shapeName) {
    // default shape is point for vector layers, icon for KML layers. check the config to see if it should be an icon.
    if (shapeName == osStyle.ShapeType.DEFAULT) {
      shapeName = isIcon ? osStyle.ShapeType.ICON : osStyle.ShapeType.POINT;
    }

    // places doesn't support selected styles
    shapeName = shapeName.replace(/^Selected /, '');

    clone.set(StyleField.SHAPE, shapeName);
  }

  var centerShapeName = osFeature.getCenterShapeName(feature) || osStyle.ShapeType.DEFAULT;
  if (centerShapeName) {
    // KML center shape is different ... if it is an ellipse, the center shape is controlled by the main shape
    // places doesn't support selected styles
    centerShapeName = centerShapeName.replace(/^Selected /, '');

    clone.set(StyleField.CENTER_SHAPE, centerShapeName);
  }

  return clone;
};


/**
 * Save features from a source to places.
 *
 * @param {!Object} config The save configuration
 */
let saveFromSource_ = function(config) {
  if (!placesManager) {
    return;
  }

  var rootNode = placesManager.getPlacesRoot();
  if (!rootNode) {
    return;
  }

  var features = config['features'];
  if (!features || features.length == 0) {
    return;
  }

  var source = osFeature.getSource(features[0]);
  if (!source) {
    return;
  }

  var layerConfig = features[0] != null ? osStyle.getLayerConfig(features[0], source) : undefined;
  var placemarks = [];
  var noNameCount = 1;
  var folder;

  // create the placemark nodes
  for (var i = 0; i < features.length; i++) {
    var feature = features[i];
    if (!feature) {
      continue;
    }

    var clone = copyFeature(feature, layerConfig);

    // try to set the name from the config
    var featureName;
    if (config['titleColumn']) {
      // try the property value first
      featureName = feature.get(config['titleColumn']['field']);
    } else if (config['title']) {
      // generic title with a one-up counter
      featureName = config['title'];

      if (config['features'].length > 1) {
        // append a counter if there are multiple features sharing the title
        featureName += ' ' + (i + 1);
      }
    }

    // use a default name if the value couldn't be resolved
    if (!featureName) {
      featureName = 'Unnamed Placemark ' + noNameCount++;
    }
    clone.set(KMLField.NAME, featureName);

    // set the description from the config
    var description = config['descColumn'] ? feature.get(config['descColumn']['field']) : config['description'];
    clone.set(KMLField.DESCRIPTION, description);

    var placemark = updatePlacemark({
      'feature': clone
    });

    placemarks.push(placemark);
  }

  // check if the folder already exists in Places
  var title = source.getTitle();
  var children = /** @type {Array<!KMLNode>} */ (rootNode.getChildren());
  if (children) {
    for (var i = 0; i < children.length; i++) {
      if (children[i].getLabel() == title) {
        folder = children[i];
        break;
      }
    }
  }

  var cmd;
  if (!folder) {
    // folder didn't exist, so set placemarks as the children and add it to the root node
    folder = updateFolder({
      'name': title
    });

    folder.setChildren(placemarks);

    cmd = new KMLNodeAdd(folder, rootNode);
  } else {
    // folder already existed, so add the placemarks to it
    var commands = [];
    for (var i = 0; i < placemarks.length; i++) {
      commands.push(new KMLNodeAdd(placemarks[i], folder));
    }

    cmd = new SequenceCommand();
    cmd.setCommands(commands);
  }

  var n = placemarks.length;
  cmd.title = 'Save ' + n + ' Place' + (n > 1 ? 's' : '') + ' from ' + title;

  CommandProcessor.getInstance().addCommand(cmd);
};

/**
 * Save features from a source to places.
 *
 * @param {!Object} config The save configuration
 */
const saveFromSource = function(config) {
  saveFromSource_(config);
};

/**
 * Replace default saveFromSource implementation
 *
 * @param {!function(!Object)} f The new implementation
 */
const setSaveFromSource = function(f) {
  saveFromSource_ = f;
};

/**
 * Gets the root node for places. Places are assumed to have only 1 document.
 *
 * @param {KMLLayerNode=} opt_layerNode The layer node. Searches the map for the layer if not
 *                                                         provided.
 * @return {KMLNode}
 */
const getPlacesRoot = function(opt_layerNode) {
  var root;

  if (opt_layerNode) {
    root = getKMLRoot(opt_layerNode);
  }

  if (!root) {
    var layer = MapContainer.getInstance().getLayer(ID);
    if (layer) {
      var source = layer ? /** @type {plugin.file.kml.KMLSource} */ (layer.getSource()) : null;
      root = source ? source.getRootNode() : null;
    }
  }

  if (root) {
    var children = root.getChildren();
    return children && children.length ? /** @type {KMLNode} */ (children[0]) : null;
  }

  return null;
};

/**
 * Add a new folder to places.
 *
 * @param {!FolderOptions} options The folder options.
 * @return {KMLNode} The folder node, or null if one could not be created.
 */
let addFolder_ = function(options) {
  var name = options.name || 'New Folder';
  var parent = options.parent || getPlacesRoot();
  return parent ? updateFolder({
    'name': name,
    'parent': parent
  }) : null;
};

/**
 * Add a new folder to places.
 *
 * @param {!FolderOptions} options The folder options.
 * @return {KMLNode} The folder node, or null if one could not be created.
 */
const addFolder = function(options) {
  return addFolder_(options);
};

/**
 * Replace default addFolder implementation
 *
 * @param {!function(!FolderOptions):KMLNode} f The new implementation
 */
const setAddFolder = function(f) {
  addFolder_ = f;
};

/**
 * Add a new place.
 *
 * @param {!PlaceOptions} options The save options.
 * @return {KMLNode} The place node, or null if one could not be created.
 */
let addPlace_ = function(options) {
  var parent = options.parent || getPlacesRoot();

  var geometry = options.geometry;
  if (geometry && !(geometry instanceof Geometry)) {
    // geometry created in another window context, clone it so the reference is in this context
    geometry = osOlFeature.cloneGeometry(geometry);
  }

  var feature = new Feature(geometry);

  feature.setId(options.id != null ? options.id : getUid(feature));
  feature.set(KMLField.NAME, options.name || 'New Place');
  feature.set(KMLField.DESCRIPTION, options.description || undefined);

  var time = options.startTime != null ?
    options.endTime != null ? new TimeRange(options.startTime, options.endTime) :
      new TimeInstant(options.startTime) : undefined;
  feature.set(RecordField.TIME, time);

  var styleConfig = osObject.unsafeClone(osStyle.DEFAULT_VECTOR_CONFIG);

  if (options.styleConfig) {
    // merge a provided config onto the default
    osStyle.mergeConfig(options.styleConfig, styleConfig);
  }

  feature.set(StyleType.FEATURE, [styleConfig]);
  feature.set(StyleField.SHAPE, options.shape || osStyle.ShapeType.POINT);

  if (styleConfig && styleConfig[StyleField.LABELS]) {
    osFeature.showLabel(feature);
    FeatureEditCtrl.persistFeatureLabels(feature);
  } else {
    osFeature.hideLabel(feature);
  }

  osStyle.setFeatureStyle(feature);

  return parent ? updatePlacemark({
    'feature': feature,
    'parent': parent
  }) : null;
};

/**
 * Add a new place.
 *
 * @param {!PlaceOptions} options The save options.
 * @return {KMLNode} The place node, or null if one could not be created.
 */
const addPlace = function(options) {
  return addPlace_(options);
};

/**
 * Replace default addPlace implementation
 *
 * @param {!function(!PlaceOptions):KMLNode} f The new implementation
 */
const setAddPlace = function(f) {
  addPlace_ = f;
};

exports = {
  ID,
  TITLE,
  Icon,
  ICON,
  ExportFields,
  SourceFields,
  createExporter,
  getPlacesManager,
  setPlacesManager,
  isLayerPresent,
  copyFeature,
  saveFromSource,
  setSaveFromSource,
  getPlacesRoot,
  addFolder,
  addPlace,
  setAddFolder,
  setAddPlace,
  FolderOptions,
  PlaceOptions
};
