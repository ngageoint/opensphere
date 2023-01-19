goog.declareModuleId('plugin.file.kml.ui');

import {getUid} from 'ol/src/util.js';
import EventType from '../../../../os/action/eventtype.js';
import CommandProcessor from '../../../../os/command/commandprocessor.js';
import SequenceCommand from '../../../../os/command/sequencecommand.js';
import * as dispatcher from '../../../../os/dispatcher.js';
import * as osFeature from '../../../../os/feature/feature.js';
import {Controller as FeatureEditCtrl} from '../../../../os/ui/featureedit.js';
import {launchConfirmText} from '../../../../os/ui/window/confirmtext.js';
import * as osWindow from '../../../../os/ui/window.js';
import KMLNodeAdd from '../cmd/kmlnodeaddcmd.js';
import KMLNodeRemove from '../cmd/kmlnoderemovecmd.js';
import KMLField from '../kmlfield.js';

const GoogEvent = goog.require('goog.events.Event');
const googString = goog.require('goog.string');


/**
 * @typedef {{
 *   node: (KMLNode|undefined),
 *   parent: (KMLNode|undefined),
 *   source: (KMLSource|undefined),
 *   name: string
 * }}
 */
export let FolderOptions;

/**
 * @typedef {{
 *   annotation: (boolean|undefined),
 *   feature: (ol.Feature|undefined),
 *   geometry: (ol.geom.Geometry|undefined),
 *   node: (KMLNode|undefined),
 *   parent: (KMLNode|undefined)
 * }}
 */
export let PlacemarkOptions;

/**
 * Launch a window to create or edit a place.
 *
 * @param {!PlacemarkOptions} options The place options.
 */
export const createOrEditPlace = function(options) {
  var windowId = 'placemarkEdit';
  windowId += options.feature ? getUid(options.feature) : googString.getRandomString();

  var scopeOptions = {
    'options': options
  };

  if (osWindow.exists(windowId)) {
    osWindow.bringToFront(windowId);
  } else {
    var label = options.label || (options.feature ? 'Edit' : 'Add') + ' Place';
    var geom = /** @type {ol.geom.SimpleGeometry} */ (options.geometry) ||
        (options.feature ? options.feature.getGeometry() : null);
    var x = FeatureEditCtrl.calculateXPosition(geom);

    var windowOptions = {
      'id': windowId,
      'label': label,
      'icon': 'fa fa-map-marker',
      'x': x,
      'y': 'center',
      'width': 600,
      'min-width': 400,
      'max-width': 1000,
      'height': 'auto',
      'modal': false,
      'show-close': true
    };

    var template = '<placemarkedit></placemarkedit>';
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};

/**
 * Default function to create a KML placemark node.
 * @return {KMLNode}
 */
let createPlacemarkNode = () => null;

/**
 * Set the default function used to create a placemark node.
 * @param {function():KMLNode} fn The function.
 */
export const setCreatePlacemarkNodeFn = (fn) => {
  createPlacemarkNode = fn;
};

/**
 * Updates a placemark from the provided options.
 *
 * @param {!PlacemarkOptions} options The placemark options.
 * @return {KMLNode}
 */
export const updatePlacemark = function(options) {
  var placemark = /** @type {KMLNode|undefined} */ (options['node']) || createPlacemarkNode();

  if (placemark) {
    var feature = options['feature'] || null;
    placemark.setFeature(feature);

    if (feature) {
      // feature already exists, so update it
      placemark.setLabel(feature.get(KMLField.NAME) || 'Unnamed Place');
      osFeature.update(feature);
      feature.changed();
      dispatcher.getInstance().dispatchEvent(new GoogEvent(EventType.REFRESH));
    }

    // add the placemark to a parent if provided
    if (options['parent']) {
      var parent = verifyNodeInTree(/** @type {!KMLNode} */ (options['parent']));
      var currentParent = placemark.getParent();
      var cmds = [new KMLNodeAdd(placemark, parent)];
      if (currentParent) {
        cmds.push(new KMLNodeRemove(placemark));
      }
      var sequence = new SequenceCommand();
      sequence.setCommands(cmds);
      CommandProcessor.getInstance().addCommand(sequence);
    }
  }

  return placemark;
};

/**
 * Default function to create a KML folder node.
 * @return {KMLNode}
 */
let createFolderNode = () => null;

/**
 * Set the default function used to create a folder node.
 * @param {function():KMLNode} fn The function.
 */
export const setCreateFolderNodeFn = (fn) => {
  createFolderNode = fn;
};

/**
 * Launch a window to create or edit a KML Folder.
 *
 * @param {!FolderOptions} options The folder options.
 */
export const createOrEditFolder = function(options) {
  var node = options['node'];
  var label = node ? node.getLabel() : 'New Folder';
  var winLabel = (node ? 'Edit' : 'Add') + ' Folder';

  var confirmOptions = /** @type {!osx.window.ConfirmTextOptions} */ ({
    confirm: (name) => {
      options['name'] = name;
      updateFolder(options);
    },
    defaultValue: label,
    prompt: 'Please choose a label for the folder:',

    windowOptions: /** @type {!osx.window.WindowOptions} */ ({
      icon: 'fa fa-folder',
      label: winLabel
    })
  });
  launchConfirmText(confirmOptions);
};

/**
 * Updates a folder from the provided options.
 * @param {!FolderOptions} options The folder options.
 * @return {KMLNode} The folder node.
 */
export const updateFolder = function(options) {
  var folder = /** @type {KMLNode|undefined} */ (options['node']) || createFolderNode();
  if (folder) {
    folder.setLabel(options['name'] || 'Unnamed Folder');

    // add the folder to a parent if provided
    if (options['parent']) {
      var parent = verifyNodeInTree(/** @type {!KMLNode} */ (options['parent']));
      var cmd = new KMLNodeAdd(folder, parent);
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }

  return folder;
};

/**
 * Verifies the KML node is still in the tree if it has a KML source defined.
 *
 * @param {!KMLNode} node The node to verify
 * @return {!KMLNode} The same node if it's in the tree, otherwise the root of the tree.
 */
export const verifyNodeInTree = function(node) {
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
 * @param {!KMLLayerNode} layerNode The layer node
 * @return {KMLNode}
 */
export const getKMLRoot = function(layerNode) {
  var layer = /** @type {KMLLayer} */ (layerNode.getLayer());
  var source = layer ? /** @type {KMLSource} */ (layer.getSource()) : null;
  return source ? source.getRootNode() : null;
};
