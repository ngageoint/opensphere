goog.provide('os.metrics.ServersMetrics');

goog.require('os.ui.metrics.MetricNode');
goog.require('os.ui.metrics.MetricsPlugin');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * @extends {os.ui.metrics.MetricsPlugin}
 * @constructor
 */
os.metrics.ServersMetrics = function() {
  os.metrics.ServersMetrics.base(this, 'constructor');

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
    key: os.metrics.Servers.ADD_SERVER
  });
  this.addChild(leaf, {
    label: 'View Server',
    description: 'View details about a server in the Servers section in settings.',
    key: os.metrics.Servers.VIEW
  });
  this.addChild(leaf, {
    label: 'Refresh a server in the Servers section in settings.',
    key: os.metrics.Servers.REFRESH
  });
  this.addChild(leaf, {
    label: 'Edit a server in the Servers section in settings.',
    key: os.metrics.Servers.EDIT
  });
  this.addChild(leaf, {
    label: 'Delete a server in the Servers section in settings.',
    key: os.metrics.Servers.REMOVE
  });
};
goog.inherits(os.metrics.ServersMetrics, os.ui.metrics.MetricsPlugin);
