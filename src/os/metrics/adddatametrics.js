goog.module('os.metrics.AddDataMetrics');

const {AddData} = goog.require('os.metrics.keys');
const MetricsPlugin = goog.require('os.ui.metrics.MetricsPlugin');


/**
 */
class AddDataMetrics extends MetricsPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Add Data');
    this.setDescription('The Add Data window allows' +
        ' both feature and imagery data from an expanding pool of data providers to be added to the map.');
    this.setTags(['data', 'providers', 'search']);
    this.setIcon('fa fa-plus');
    this.setCollapsed(true);

    // manually build the tree
    var leaf = this.getLeafNode();

    this.addChild(leaf, {
      label: 'Open',
      description: 'Open Add Data window.',
      key: AddData.OPEN
    });
    this.addChild(leaf, {
      label: 'Add Data',
      icon: 'fa fa-plus',
      description: 'Add a data layer to the map.',
      key: AddData.ADD_LAYER_COMMAND
    });
    this.addChild(leaf, {
      label: 'Remove Data',
      icon: 'fa fa-plus',
      description: 'Remove a data layer from the map',
      key: AddData.REMOVE_LAYER_COMMAND
    });
    this.addChild(leaf, {
      label: 'Search',
      description: 'Perform a search through the available data layers.',
      key: AddData.SEARCH
    });
    this.addChild(leaf, {
      label: 'Group By',
      description: 'Group the available data layers by a facet.',
      key: AddData.GROUP_BY
    });
    this.addChild(leaf, {
      label: 'Open File/URL',
      description: 'Import data from a local file or URL.',
      key: AddData.IMPORT
    });
    this.addChild(leaf, {
      label: 'View Layer Info',
      description: 'Click on a layer to see information about it.',
      key: AddData.GET_INFO
    });
  }
}

exports = AddDataMetrics;
