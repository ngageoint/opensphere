goog.declareModuleId('plugin.places.KMLPlacesImportUI');

import EventType from '../../os/events/eventtype.js';
import FileImportUI from '../../os/ui/im/fileimportui.js';
import KMLImporter from '../file/kml/kmlimporter.js';
import KMLParser from '../file/kml/kmlparser.js';
import {getPlacesManager} from './places.js';
import {saveKMLToPlaces} from './placessave.js';


/**
 */
export default class KMLPlacesImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // file contents are only used in memory, not loaded from storage
    this.requiresStorage = false;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'Place Import - KML';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    // A KML tree can be dropped into Saved Places without user intervention, so parse the file and add it.
    const parser = new KMLParser({});
    const importer = new KMLImporter(parser);
    importer.listenOnce(EventType.COMPLETE, this.onImportComplete, false, this);
    importer.startImport(file.getContent());
  }

  /**
   * Handle KML import success.
   * @param {GoogEvent} event The event.
   * @protected
   */
  onImportComplete(event) {
    const importer = /** @type {KMLImporter} */ (event.target);
    const importNodes = getImportRoot(importer.getRootNode());
    const placesManager = getPlacesManager();
    const placesRoot = placesManager ? placesManager.getPlacesRoot() : null;
    if (importNodes && placesRoot) {
      saveKMLToPlaces(importNodes);
    }

    importer.dispose();
  }
}

/**
 * Get the root KML node to import.
 * @param {KMLNode} node The root KML node to import.
 * @return {KMLNode}
 */
const getImportRoot = (node) => {
  // Ignore the root 'kml' node and the Saved Places root node, as long as the node only has a single child.
  if (node && node.getLabel() === 'kmlroot' || node.getLabel() === 'Saved Places') {
    const children = node.getChildren();
    if (children && children.length === 1) {
      return getImportRoot(children[0]);
    }
  }

  return node;
};
