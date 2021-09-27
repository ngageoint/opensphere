goog.module('os.metrics.ServersMetrics');

const {Servers} = goog.require('os.metrics.keys');
const {default: MetricsPlugin} = goog.require('os.ui.metrics.MetricsPlugin');


/**
 */
class ServersMetrics extends MetricsPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Servers');
    this.setDescription('The servers window can be accessed through the settings window. It shows all of the ' +
        'servers that are currently configured. It also allows you to add, edit, refresh and remove servers.');
    // this.setTags(['TODO']);
    this.setIcon('fa fa-database');
    this.setCollapsed(true);

    // manually build the tree
    var leaf = this.getLeafNode();
    this.addChild(leaf, {
      label: 'Add Server',
      description: 'Add a new server in the Servers section in settings.',
      key: Servers.ADD_SERVER
    });
    this.addChild(leaf, {
      label: 'View Server',
      description: 'View details about a server in the Servers section in settings.',
      key: Servers.VIEW
    });
    this.addChild(leaf, {
      label: 'Refresh a server in the Servers section in settings.',
      key: Servers.REFRESH
    });
    this.addChild(leaf, {
      label: 'Edit a server in the Servers section in settings.',
      key: Servers.EDIT
    });
    this.addChild(leaf, {
      label: 'Delete a server in the Servers section in settings.',
      key: Servers.REMOVE
    });
  }
}

exports = ServersMetrics;
