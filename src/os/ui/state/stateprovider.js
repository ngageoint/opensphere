goog.provide('os.ui.state.StateProvider');

goog.require('os.config');
goog.require('os.data.BaseDescriptor');
goog.require('os.ui.action.Action');
goog.require('os.ui.action.MenuOptions');
goog.require('os.ui.data.DescriptorProvider');
goog.require('os.ui.state.AbstractStateDescriptor');



/**
 * State file provider
 * @extends {os.ui.data.DescriptorProvider<!os.ui.state.AbstractStateDescriptor>}
 * @constructor
 */
os.ui.state.StateProvider = function() {
  os.ui.state.StateProvider.base(this, 'constructor');
};
goog.inherits(os.ui.state.StateProvider, os.ui.data.DescriptorProvider);
goog.addSingletonGetter(os.ui.state.StateProvider);


/**
 * @inheritDoc
 */
os.ui.state.StateProvider.prototype.configure = function(config) {
  this.setId(os.ui.state.AbstractStateDescriptor.ID);
  this.setLabel('State Files');

  os.ui.state.StateProvider.base(this, 'configure', config);

  // this provider should not show up in the server manager
  this.listInServers = false;
};


/**
 * @inheritDoc
 */
os.ui.state.StateProvider.prototype.load = function(opt_ping) {
  os.ui.state.StateProvider.base(this, 'load', opt_ping);

  // After loading activate the states.
  var descriptors = this.getDescriptors();
  for (var i = 0, n = descriptors.length; i < n; i++) {
    var descriptor = descriptors[i];
    descriptor.updateActiveFromTemp();
  }
};


/**
 * @inheritDoc
 */
os.ui.state.StateProvider.prototype.getToolTip = function() {
  var appName = os.config.getAppName('the application');
  return 'Contains all state files that have been imported into ' + appName;
};
