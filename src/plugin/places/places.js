goog.declareModuleId('plugin.places');

import Feature from 'ol/src/Feature.js';
import Geometry from 'ol/src/geom/Geometry.js';
import {getUid} from 'ol/src/util.js';
import * as annotation from '../../os/annotation/annotation.js';
import CommandProcessor from '../../os/command/commandprocessor.js';
import SequenceCommand from '../../os/command/sequencecommand.js';
import ColumnDefinition from '../../os/data/columndefinition.js';
import RecordField from '../../os/data/recordfield.js';
import * as osFeature from '../../os/feature/feature.js';
import Fields from '../../os/fields/fields.js';
import {METHOD_FIELD} from '../../os/interpolate.js';
import MapContainer from '../../os/mapcontainer.js';
import * as osObject from '../../os/object/object.js';
import * as osOlFeature from '../../os/ol/feature.js';
import * as osStyle from '../../os/style/style.js';
import StyleField from '../../os/style/stylefield.js';
import StyleType from '../../os/style/styletype.js';
import TimeInstant from '../../os/time/timeinstant.js';
import TimeRange from '../../os/time/timerange.js';
import {Controller as FeatureEditCtrl} from '../../os/ui/featureedit.js';
import KMLNodeAdd from '../file/kml/cmd/kmlnodeaddcmd.js';
import * as kml from '../file/kml/kml.js';
import KMLField from '../file/kml/kmlfield.js';
import KMLTreeExporter from '../file/kml/kmltreeexporter.js';
import {getKMLRoot, updateFolder, updatePlacemark} from '../file/kml/ui/kmlui.js';


const {removeDuplicates} = goog.require('goog.array');


/**
 * Identifier used by the places plugin.
 * @type {string}
 */
export const ID = 'places';

/**
 * Places layer title.
 * @type {string}
 */
export const TITLE = 'Saved Places';

/**
 * Places icons.
 * @enum {string}
 */
export const Icon = {
  ANNOTATION: 'fa-comment',
  FOLDER: 'fa-folder',
  PLACEMARK: 'fa-map-marker',
  QUICK_ADD: 'fa-bolt'
};

/**
 * Places icon.
 * @type {string}
 */
export const ICON = Icon.PLACEMARK;

/**
 * Fields that must be exported to the KML. Any style fields (like shape) that aren't supported by the KML spec must be
 * included here, or features will revert to using an icon on import.
 *
 * @type {!Array<string>}
 */
export const ExportFields = [
  KMLField.DESCRIPTION,
  KMLField.MD_DESCRIPTION,
  annotation.OPTIONS_FIELD,
  StyleField.CENTER_SHAPE,
  StyleField.SHAPE,
  StyleField.LABELS,
  RecordField.FORCE_SHOW_LABEL,
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
 * Fields that should be displayed on the Places source. These will be set on the source via ISource#setColumns.
 *
 * @type {!Array<!(ColumnDefinition|string)>}
 */
export const SourceFields = [
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
  Fields.ALT,
  Fields.SEMI_MAJOR,
  Fields.SEMI_MINOR,
  Fields.SEMI_MAJOR_UNITS,
  Fields.SEMI_MINOR_UNITS,
  Fields.ORIENTATION,
  new ColumnDefinition(Fields.TIME, RecordField.TIME)
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
export let FolderOptions;

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
export let PlaceOptions;

/**
 * Get the default label config for Places.
 * @return {!Array<!LabelConfig>}
 */
export const getDefaultLabels = () => ([{
  'column': KMLField.NAME,
  'showColumn': false
}]);

/**
 * The global PlacesManager instance. This is used to deconflict circular dependencies.
 */
let placesManager;

/**
 * Set the global PlacesManager instance.
 * @return {PlacesManager|undefined}
 */
export const getPlacesManager = () => placesManager;

/**
 * Set the global PlacesManager instance.
 * @param {!PlacesManager} value The instance.
 */
export const setPlacesManager = (value) => {
  placesManager = value;
};

/**
 * Create a KML tree exporter for the provided root node.
 *
 * @param {KMLNode} root The root node to export
 * @return {KMLTreeExporter}
 */
export const createExporter = function(root) {
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
export const isLayerPresent = function() {
  return MapContainer.getInstance().getLayer(ID) != null;
};

/**
 * Copy a feature, saving its current style as a local feature style.
 *
 * @param {!Feature} feature The feature to copy
 * @param {Object=} opt_layerConfig The feature's layer config
 * @return {!Feature}
 */
export const copyFeature = function(feature, opt_layerConfig) {
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

  if (!featureConfig[StyleField.LABELS]) {
    featureConfig[StyleField.LABELS] = getDefaultLabels();
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
 * Recursively copy a KML node, including attached features.
 * @param {!KMLNode} node The KML node to copy.
 * @return {KMLNode} The copied node, if supported.
 */
export const copyNode = function(node) {
  let clone = null;
  if (node.isFolder()) {
    clone = updateFolder({
      'name': node.getLabel() || 'Unnamed Folder'
    });

    // Keep the collapsed state of the cloned folder.
    clone.setCollapsed(node.isCollapsed());

    const children = /** @type {Array<!KMLNode>} */ (node.getChildren());
    if (children) {
      for (let i = 0; i < children.length; i++) {
        const childClone = copyNode(children[i]);
        if (childClone) {
          clone.addChild(childClone);
        }
      }
    }
  } else {
    const feature = node.getFeature();
    if (feature) {
      clone = updatePlacemark({
        'feature': copyFeature(feature)
      });
    }
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
export const saveFromSource = function(config) {
  saveFromSource_(config);
};

/**
 * Replace default saveFromSource implementation
 *
 * @param {!function(!Object)} f The new implementation
 */
export const setSaveFromSource = function(f) {
  saveFromSource_ = f;
};

/**
 * Gets the root node for places. Places are assumed to have only 1 document.
 *
 * @param {KMLLayerNode=} opt_layerNode The layer node. Searches the map for the layer if not
 *                                                         provided.
 * @return {KMLNode}
 */
export const getPlacesRoot = function(opt_layerNode) {
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
export const addFolder = function(options) {
  return addFolder_(options);
};

/**
 * Replace default addFolder implementation
 *
 * @param {!function(!FolderOptions):KMLNode} f The new implementation
 */
export const setAddFolder = function(f) {
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
export const addPlace = function(options) {
  return addPlace_(options);
};

/**
 * Replace default addPlace implementation
 *
 * @param {!function(!PlaceOptions):KMLNode} f The new implementation
 */
export const setAddPlace = function(f) {
  addPlace_ = f;
};
