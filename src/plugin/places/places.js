goog.provide('plugin.places');

goog.require('os.command.SequenceCommand');
goog.require('os.data.RecordField');
goog.require('os.style');
goog.require('plugin.file.kml.KMLField');
goog.require('plugin.file.kml.KMLTreeExporter');
goog.require('plugin.file.kml.cmd.KMLNodeAdd');


/**
 * Identifier used by the places plugin.
 * @type {string}
 * @const
 */
plugin.places.ID = 'places';


/**
 * Places layer title.
 * @type {string}
 * @const
 */
plugin.places.TITLE = 'Saved Places';


/**
 * Places icon.
 * @type {string}
 * @const
 */
plugin.places.ICON = 'fa-map-marker';


/**
 * Fields that must be exported to the KML. Any style fields (like shape) that aren't supported by the KML spec must be
 * included here, or features will revert to using an icon on import.
 *
 * @type {!Array<string>}
 * @private
 * @const
 */
plugin.places.EXPORT_FIELDS_ = [
  plugin.file.kml.KMLField.DESCRIPTION,
  plugin.file.kml.KMLField.MD_DESCRIPTION,
  os.style.StyleField.CENTER_SHAPE,
  os.style.StyleField.SHAPE,
  os.style.StyleField.LABELS,
  os.style.StyleField.SHOW_LABELS,
  os.style.StyleField.SHOW_LABEL_COLUMNS,
  os.style.StyleField.LABEL_COLOR,
  os.style.StyleField.LABEL_SIZE,
  os.Fields.SEMI_MAJOR,
  os.Fields.SEMI_MINOR,
  os.Fields.SEMI_MAJOR_UNITS,
  os.Fields.SEMI_MINOR_UNITS,
  os.Fields.ORIENTATION,
  os.Fields.BEARING
];


/**
 * Create a KML tree exporter for the provided root node.
 * @param {plugin.file.kml.ui.KMLNode} root The root node to export
 * @return {plugin.file.kml.KMLTreeExporter}
 */
plugin.places.createExporter = function(root) {
  var exporter = new plugin.file.kml.KMLTreeExporter();
  exporter.setFields(plugin.places.EXPORT_FIELDS_);
  exporter.setName(plugin.places.TITLE);

  // don't include the root node to avoid the superfluous folder
  exporter.setItems(root && root.getChildren() || []);

  return exporter;
};


/**
 * If the Places layer is on the map.
 * @return {boolean}
 */
plugin.places.isLayerPresent = function() {
  return os.MapContainer.getInstance().getLayer(plugin.places.ID) != null;
};


/**
 * Copy a feature, saving its current style as a local feature style.
 * @param {!ol.Feature} feature The feature to copy
 * @param {Object=} opt_layerConfig The feature's layer config
 * @return {!ol.Feature}
 */
plugin.places.copyFeature = function(feature, opt_layerConfig) {
  var clone = os.ol.feature.clone(feature, plugin.file.kml.SOURCE_FIELDS);
  clone.setId(ol.getUid(clone));

  // copy the feature's current style to a new config and set it on the cloned feature
  // base config priority: feature config > layer config > default config
  var baseConfig = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE)) || opt_layerConfig ||
      os.style.DEFAULT_VECTOR_CONFIG;
  var featureConfig = os.style.createFeatureConfig(feature, baseConfig, opt_layerConfig);
  var isIcon = os.style.isIconConfig(featureConfig);
  if (!isIcon && featureConfig['image']) {
    delete featureConfig['image']['src'];
    delete featureConfig['image']['scale'];
  }

  clone.set(os.style.StyleType.FEATURE, featureConfig);

  var shapeName = os.feature.getShapeName(feature) || os.style.ShapeType.DEFAULT;
  if (shapeName) {
    // default shape is point for vector layers, icon for KML layers. check the config to see if it should be an icon.
    if (shapeName == os.style.ShapeType.DEFAULT) {
      shapeName = isIcon ? os.style.ShapeType.ICON : os.style.ShapeType.POINT;
    }

    // places doesn't support selected styles
    shapeName = shapeName.replace(/^Selected /, '');

    clone.set(os.style.StyleField.SHAPE, shapeName);
  }

  var centerShapeName = os.feature.getCenterShapeName(feature) || os.style.ShapeType.DEFAULT;
  if (centerShapeName) {
    // KML center shape is different ... if it is an ellipse, the center shape is controlled by the main shape
    // places doesn't support selected styles
    centerShapeName = centerShapeName.replace(/^Selected /, '');

    clone.set(os.style.StyleField.CENTER_SHAPE, centerShapeName);
  }

  return clone;
};


/**
 * Save features from a source to places.
 * @param {!Object} config The save configuration
 */
plugin.places.saveFromSource = function(config) {
  var rootNode = plugin.places.PlacesManager.getInstance().getPlacesRoot();
  if (!rootNode) {
    return;
  }

  var features = config['features'];
  if (!features || features.length == 0) {
    return;
  }

  var source = os.feature.getSource(features[0]);
  if (!source) {
    return;
  }

  var layerConfig = features[0] != null ? os.style.getLayerConfig(features[0], source) : undefined;
  var placemarks = [];
  var noNameCount = 1;
  var folder;

  // create the placemark nodes
  for (var i = 0; i < features.length; i++) {
    var feature = features[i];
    if (!feature) {
      continue;
    }

    var clone = plugin.places.copyFeature(feature, layerConfig);

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
    clone.set(plugin.file.kml.KMLField.NAME, featureName);

    // set the description from the config
    var description = config['descColumn'] ? feature.get(config['descColumn']['field']) : config['description'];
    clone.set(plugin.file.kml.KMLField.DESCRIPTION, description);

    var placemark = plugin.file.kml.ui.updatePlacemark({
      'feature': clone
    });

    placemarks.push(placemark);
  }

  // check if the folder already exists in Places
  var title = source.getTitle();
  var children = /** @type {Array<!plugin.file.kml.ui.KMLNode>} */ (rootNode.getChildren());
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
    folder = plugin.file.kml.ui.updateFolder({
      'name': title
    });

    folder.setChildren(placemarks);

    cmd = new plugin.file.kml.cmd.KMLNodeAdd(folder, rootNode);
  } else {
    // folder already existed, so add the placemarks to it
    var commands = [];
    for (var i = 0; i < placemarks.length; i++) {
      commands.push(new plugin.file.kml.cmd.KMLNodeAdd(placemarks[i], folder));
    }

    cmd = new os.command.SequenceCommand();
    cmd.setCommands(commands);
  }

  var n = placemarks.length;
  cmd.title = 'Save ' + n + ' Place' + (n > 1 ? 's' : '') + ' from ' + title;

  os.commandStack.addCommand(cmd);
};


/**
 * Gets the root node for places. Places are assumed to have only 1 document.
 * @param {!plugin.file.kml.ui.KMLLayerNode} layerNode The layer node
 * @return {plugin.file.kml.ui.KMLNode}
 */
plugin.places.getPlacesRoot = function(layerNode) {
  var root = plugin.file.kml.ui.getKMLRoot(layerNode);
  if (root) {
    var children = root.getChildren();
    return children && children.length ? /** @type {plugin.file.kml.ui.KMLNode} */ (children[0]) : null;
  }

  return null;
};
