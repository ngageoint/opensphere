goog.provide('plugin.file.kml.ui');

goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('os.action.EventType');
goog.require('os.command.SequenceCommand');
goog.require('os.object');
goog.require('os.style');
goog.require('plugin.file.kml.KMLField');
goog.require('plugin.file.kml.cmd.KMLNodeAdd');
goog.require('plugin.file.kml.cmd.KMLNodeRemove');
goog.require('plugin.file.kml.kmlNodeLayerUIDirective');
goog.require('plugin.file.kml.ui.KMLNode');


/**
 * @typedef {{
 *   node: (plugin.file.kml.ui.KMLNode|undefined),
 *   parent: (plugin.file.kml.ui.KMLNode|undefined),
 *   source: (plugin.file.kml.KMLSource|undefined),
 *   name: string
 * }}
 */
plugin.file.kml.ui.FolderOptions;


/**
 * @typedef {{
 *   annotation: (boolean|undefined),
 *   feature: (ol.Feature|undefined),
 *   geometry: (ol.geom.Geometry|undefined),
 *   node: (plugin.file.kml.ui.KMLNode|undefined),
 *   parent: (plugin.file.kml.ui.KMLNode|undefined)
 * }}
 */
plugin.file.kml.ui.PlacemarkOptions;


/**
 * Launch a window to create or edit a KML Folder.
 *
 * @param {!plugin.file.kml.ui.FolderOptions} options The folder options.
 */
plugin.file.kml.ui.createOrEditFolder = function(options) {
  var node = options['node'];
  var label = node ? node.getLabel() : 'New Folder';
  var winLabel = (node ? 'Edit' : 'Add') + ' Folder';

  var confirmOptions = /** @type {!osx.window.ConfirmTextOptions} */ ({
    confirm: goog.partial(plugin.file.kml.ui.onFolderName_, options),
    defaultValue: label,
    prompt: 'Please choose a label for the folder:',

    windowOptions: /** @type {!osx.window.WindowOptions} */ ({
      icon: 'fa fa-folder',
      label: winLabel
    })
  });
  os.ui.window.launchConfirmText(confirmOptions);
};


/**
 * Handle folder choice selection.
 *
 * @param {!plugin.file.kml.ui.FolderOptions} options The folder options.
 * @param {string} name The new name.
 * @private
 */
plugin.file.kml.ui.onFolderName_ = function(options, name) {
  options['name'] = name;
  plugin.file.kml.ui.updateFolder(options);
};


/**
 * Updates a folder from the provided options.
 *
 * @param {!plugin.file.kml.ui.FolderOptions} options The folder options.
 * @return {!plugin.file.kml.ui.KMLNode}
 */
plugin.file.kml.ui.updateFolder = function(options) {
  var folder = options['node'];

  if (!folder) {
    // new folder - create it
    folder = new plugin.file.kml.ui.KMLNode();
    folder.collapsed = false;
    folder.canAddChildren = true;
    folder.editable = true;
    folder.internalDrag = true;
    folder.removable = true;
  }

  folder.setLabel(options['name'] || 'Unnamed Folder');

  // add the folder to a parent if provided
  if (options['parent']) {
    var parent = plugin.file.kml.ui.verifyNodeInTree_(/** @type {!plugin.file.kml.ui.KMLNode} */ (options['parent']));
    var cmd = new plugin.file.kml.cmd.KMLNodeAdd(folder, parent);
    os.commandStack.addCommand(cmd);
  }

  return folder;
};


/**
 * Launch a window to create or edit a place.
 *
 * @param {!plugin.file.kml.ui.PlacemarkOptions} options The place options.
 */
plugin.file.kml.ui.createOrEditPlace = function(options) {
  var windowId = 'placemarkEdit';
  windowId += options['feature'] ? ol.getUid(options['feature']) : goog.string.getRandomString();

  var scopeOptions = {
    'options': options
  };
  var label = options['label'] || (options['feature'] ? 'Edit' : 'Add') + ' Place';

  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
  } else {
    var windowOptions = {
      'id': windowId,
      'label': label,
      'icon': 'fa fa-map-marker',
      'x': 'center',
      'y': 'center',
      'width': 700,
      'min-width': 400,
      'max-width': 2000,
      'height': 'auto',
      'min-height': 300,
      'max-height': 2000,
      'modal': false,
      'show-close': true
    };

    var template = '<placemarkedit></placemarkedit>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};


/**
 * Updates a placemark from the provided options.
 *
 * @param {!plugin.file.kml.ui.PlacemarkOptions} options The placemark options.
 * @return {!plugin.file.kml.ui.KMLNode}
 */
plugin.file.kml.ui.updatePlacemark = function(options) {
  var placemark = options['node'];

  if (!placemark) {
    // new placemark - create it
    placemark = new plugin.file.kml.ui.KMLNode();
    placemark.canAddChildren = false;
    placemark.editable = true;
    placemark.internalDrag = true;
    placemark.removable = true;
    placemark.layerUI = 'kmlnodelayerui';
  }

  var feature = options['feature'] || null;
  placemark.setFeature(feature);

  if (feature) {
    // feature already exists, so update it
    placemark.setLabel(feature.get(plugin.file.kml.KMLField.NAME) || 'Unnamed Place');
    os.feature.update(feature);
    feature.changed();
    os.dispatcher.dispatchEvent(new goog.events.Event(os.action.EventType.REFRESH));
  }

  // add the placemark to a parent if provided
  if (options['parent']) {
    var parent = plugin.file.kml.ui.verifyNodeInTree_(/** @type {!plugin.file.kml.ui.KMLNode} */ (options['parent']));
    var currentParent = placemark.getParent();
    var cmds = [new plugin.file.kml.cmd.KMLNodeAdd(placemark, parent)];
    if (currentParent) {
      cmds.push(new plugin.file.kml.cmd.KMLNodeRemove(placemark));
    }
    var sequence = new os.command.SequenceCommand();
    sequence.setCommands(cmds);
    os.commandStack.addCommand(sequence);
  }

  return placemark;
};


/**
 * Verifies the KML node is still in the tree if it has a KML source defined.
 *
 * @param {!plugin.file.kml.ui.KMLNode} node The node to verify
 * @return {!plugin.file.kml.ui.KMLNode} The same node if it's in the tree, otherwise the root of the tree.
 * @private
 */
plugin.file.kml.ui.verifyNodeInTree_ = function(node) {
  var result = node;

  // if the parent has a source defined, make sure the node's root is the same as the source root. if not, the node
  // was probably removed from the tree.
  var kmlSource = node.getSource();
  if (kmlSource) {
    var kmlRoot = kmlSource.getRootNode();
    if (kmlRoot && kmlRoot != node.getRoot()) {
      // node was removed from the tree, so use the source root node instead
      result = kmlRoot;
    }
  }

  return result;
};


/**
 * Get the KML root node from a KML layer node. Assumes the layer node may not be displaying the root.
 *
 * @param {!plugin.file.kml.ui.KMLLayerNode} layerNode The layer node
 * @return {plugin.file.kml.ui.KMLNode}
 */
plugin.file.kml.ui.getKMLRoot = function(layerNode) {
  var layer = /** @type {plugin.file.kml.KMLLayer} */ (layerNode.getLayer());
  var source = layer ? /** @type {plugin.file.kml.KMLSource} */ (layer.getSource()) : null;
  return source ? source.getRootNode() : null;
};
