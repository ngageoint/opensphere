goog.provide('os.ui.data.DescriptorNodeUICtrl');
goog.provide('os.ui.data.descriptorNodeUIDirective');

goog.require('os.ui.Module');
goog.require('os.ui.data.DescriptorProvider');
goog.require('os.ui.slick.AbstractNodeUICtrl');
goog.require('os.ui.window.confirmDirective');


/**
 * Generic node UI for descriptors.
 * @return {angular.Directive}
 */
os.ui.data.descriptorNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/data/descriptornodeui.html',
    controller: os.ui.data.DescriptorNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('descriptornodeui', [os.ui.data.descriptorNodeUIDirective]);



/**
 * Controller for descriptor node UI.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractNodeUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.data.DescriptorNodeUICtrl = function($scope, $element) {
  os.ui.data.DescriptorNodeUICtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(os.ui.data.DescriptorNodeUICtrl, os.ui.slick.AbstractNodeUICtrl);


/**
 * Prompt the user to remove the descriptor from the application.
 * @export
 */
os.ui.data.DescriptorNodeUICtrl.prototype.tryRemove = function() {
  os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: this.remove.bind(this),
    cancel: goog.nullFunction,
    prompt: this.getRemoveWindowText(),
    yesText: 'Remove',
    yesIcon: 'fa fa-trash-o',
    yesButtonClass: 'btn-danger',
    windowOptions: this.getRemoveWindowOptions()
  }));
};


/**
 * Get the window options for the remove prompt.
 * @return {Object<string, string>} The window options.
 * @protected
 */
os.ui.data.DescriptorNodeUICtrl.prototype.getRemoveWindowOptions = function() {
  var title = '';
  var descriptor = this.getDescriptor();
  if (descriptor) {
    title = descriptor.getTitle();
  }

  return {
    'label': 'Remove ' + title + '?',
    'icon': 'fa fa-trash-o',
    'headerClass': 'bg-danger u-bg-danger-text',
    'x': 'center',
    'y': 'center',
    'width': '325',
    'height': 'auto',
    'modal': 'true',
    'no-scroll': 'true'
  };
};


/**
 * Get the text to display in the remove prompt.
 * @return {!string} The text.
 * @protected
 */
os.ui.data.DescriptorNodeUICtrl.prototype.getRemoveWindowText = function() {
  return 'Are you sure you want to remove this layer from the application?' +
      '<b>This action cannot be undone</b>, and will clear the application history.';
};


/**
 * Get the descriptor for the node.
 * @return {os.data.IDataDescriptor} The descriptor.
 * @protected
 */
os.ui.data.DescriptorNodeUICtrl.prototype.getDescriptor = function() {
  // the node should be on the scope as 'item'
  var node = /** @type {os.ui.data.DescriptorNode} */ (this.scope['item']);
  return node.getDescriptor();
};


/**
 * Remove the descriptor.
 * @protected
 */
os.ui.data.DescriptorNodeUICtrl.prototype.remove = function() {
  this.removeDescriptor();
};


/**
 * Permanently remove the descriptor and associated data from the application.
 * @protected
 */
os.ui.data.DescriptorNodeUICtrl.prototype.removeDescriptor = function() {
  var descriptor = this.getDescriptor();
  var dm = os.dataManager;
  if (descriptor && descriptor instanceof os.data.BaseDescriptor) {
    // remove the descriptor from the data manager
    dm.removeDescriptor(descriptor);

    var provider = /** @type {os.ui.data.DescriptorProvider} */ (dm.getProvider(descriptor.getId()));
    if (provider && provider instanceof os.ui.data.DescriptorProvider) {
      // remove the descriptor from the provider
      provider.removeDescriptor(descriptor, true);
    }

    descriptor.dispose();

    // restoring descriptors is currently not supported, so clear the application stack to avoid conflicts
    os.command.CommandProcessor.getInstance().clearHistory();
  }
};
