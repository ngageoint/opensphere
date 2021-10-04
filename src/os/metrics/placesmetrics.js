goog.declareModuleId('os.metrics.PlacesMetrics');

import MetricsPlugin from '../ui/metrics/metricsplugin.js';
import {Places} from './metricskeys.js';


/**
 */
export default class PlacesMetrics extends MetricsPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Places');
    // this.setDescription('Places description');
    // this.setTags(['TODO']);
    this.setIcon('fa fa-circle-o');
    this.setCollapsed(true);

    // manually build the tree
    var leaf = this.getLeafNode();
    this.addChild(leaf, {
      label: 'Add Place',
      description: 'Add a Place to your Places list.',
      key: Places.ADD_PLACE
    });
    this.addChild(leaf, {
      label: 'Add Folder',
      description: 'Add a folder to your Places list.',
      key: Places.ADD_FOLDER
    });
    this.addChild(leaf, {
      label: 'Export',
      description: 'Export your Places list.',
      key: Places.EXPORT
    });
    this.addChild(leaf, {
      label: 'Expand All',
      description: 'Click the expand all button on your Places list.',
      key: Places.EXPAND_ALL
    });
    this.addChild(leaf, {
      label: 'Collapse All',
      description: 'Click the collapse all button on your Places list.',
      key: Places.COLLAPSE_ALL
    });

    // context menu
    var contextMenu = this.addChild(leaf, {
      label: 'Places Context Menu'
    });

    this.addChild(contextMenu, {
      label: 'Edit Folder',
      description: 'Edit a Places folder.',
      key: Places.EDIT_FOLDER
    });
    this.addChild(contextMenu, {
      label: 'Edit Place',
      description: 'Edit a Place.',
      key: Places.EDIT_PLACEMARK
    });
    this.addChild(contextMenu, {
      label: 'Export Node',
      description: 'Export a Place or a folder from the Places list.',
      key: Places.EXPORT_CONTEXT
    });
  }
}
