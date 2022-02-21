goog.declareModuleId('plugin.places.save');

import CommandProcessor from '../../os/command/commandprocessor.js';
import SequenceCommand from '../../os/command/sequencecommand.js';
import KMLNodeAdd from '../file/kml/cmd/kmlnodeaddcmd.js';
import {copyNode} from './places.js';
import PlacesManager from './placesmanager.js';

/**
 * Save a KML tree to places.
 * @param {!Array<KMLNode>|KMLNode} nodes The root KML node(s) to save.
 */
export const saveKMLToPlaces = function(nodes) {
  // don't allow this if the places root node doesn't exist
  const rootNode = PlacesManager.getInstance().getPlacesRoot();
  if (!rootNode) {
    return;
  }

  if (!Array.isArray(nodes)) {
    nodes = [nodes];
  }

  const cmds = nodes.map((node) => {
    let cmd = null;

    const clone = copyNode(node);
    if (clone && rootNode) {
      cmd = new KMLNodeAdd(clone, rootNode);
      cmd.title = 'Save ' + node.getLabel() + ' to Places';
    }

    return cmd;
  }).filter((node) => !!node);

  if (cmds.length > 0) {
    if (cmds.length > 1) {
      const seq = new SequenceCommand();
      seq.setCommands(cmds);
      CommandProcessor.getInstance().addCommand(seq);
    } else {
      CommandProcessor.getInstance().addCommand(cmds[0]);
    }
  }
};
