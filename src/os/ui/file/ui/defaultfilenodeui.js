goog.provide('os.ui.file.ui.DefaultFileNodeUICtrl');
goog.provide('os.ui.file.ui.defaultFileNodeUIDirective');

goog.require('goog.events.EventType');
goog.require('os.file.FileStorage');
goog.require('os.ui.Module');
goog.require('os.ui.data.DescriptorProvider');
goog.require('os.ui.slick.AbstractNodeUICtrl');
goog.require('os.ui.window.confirmDirective');


/**
 * The selected/highlighted file node UI directive
 * @return {angular.Directive}
 */
os.ui.file.ui.defaultFileNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/file/defaultfilenodeui.html',
    controller: os.ui.file.ui.DefaultFileNodeUICtrl,
    controllerAs: 'nodeUi'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('defaultfilenodeui', [os.ui.file.ui.defaultFileNodeUIDirective]);



/**
 * Controller for selected/highlighted file node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.slick.AbstractNodeUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.file.ui.DefaultFileNodeUICtrl = function($scope, $element) {
  os.ui.file.ui.DefaultFileNodeUICtrl.base(this, 'constructor', $scope, $element);

  /**
   * @type {boolean}
   */
  this['confirmRemove'] = false;
};
goog.inherits(os.ui.file.ui.DefaultFileNodeUICtrl, os.ui.slick.AbstractNodeUICtrl);


/**
 * Prompt the user to remove the file from the application
 */
os.ui.file.ui.DefaultFileNodeUICtrl.prototype.tryRemove = function() {
  os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: this.remove.bind(this),
    cancel: goog.nullFunction,
    prompt: this.getRemoveWindowText(),
    yesText: 'Remove',
    yesIcon: 'fa fa-trash-o',
    yesButtonClass: 'btn-danger',
    noText: 'Cancel',
    noIcon: 'fa fa-ban',
    windowOptions: this.getRemoveWindowOptions()
  }));
};
goog.exportProperty(os.ui.file.ui.DefaultFileNodeUICtrl.prototype, 'tryRemove',
    os.ui.file.ui.DefaultFileNodeUICtrl.prototype.tryRemove);


/**
 * @return {Object<string, string>} The window options for the remove dialog
 * @protected
 */
os.ui.file.ui.DefaultFileNodeUICtrl.prototype.getRemoveWindowOptions = function() {
  return {
    'label': 'Remove File',
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
 * @return {!string}
 * @protected
 */
os.ui.file.ui.DefaultFileNodeUICtrl.prototype.getRemoveWindowText = function() {
  return 'Are you sure you want to remove this file from the application? ' +
      '<b>This action cannot be undone</b>, and will clear the application history.';
};


/**
 * @return {os.data.IDataDescriptor}
 * @protected
 */
os.ui.file.ui.DefaultFileNodeUICtrl.prototype.getDescriptor = function() {
  // the node should be on the scope as 'item'
  var node = /** @type {os.ui.data.DescriptorNode} */ (this.scope['item']);
  return node.getDescriptor();
};


/**
 * Permanently remove the file layer and associated data from the application.
 * @protected
 */
os.ui.file.ui.DefaultFileNodeUICtrl.prototype.remove = function() {
  var descriptor = this.getDescriptor();
  var dm = os.dataManager;
  if (descriptor && descriptor instanceof os.data.BaseDescriptor) {
    // remove the descriptor from the data manager
    dm.removeDescriptor(descriptor);

    var provider = /** @type {os.ui.data.DescriptorProvider} */ (dm.getProvider(descriptor.getDescriptorType()));
    if (provider && provider instanceof os.ui.data.DescriptorProvider) {
      // remove the descriptor from the provider
      provider.removeDescriptor(descriptor, true);
    }

    descriptor.dispose();

    // since the file has been removed from indexedDB, we can no longer depend on anything in the command
    // history since it may reference a file we can no longer access, so clear it
    var cp = os.command.CommandProcessor.getInstance();
    cp.clearHistory();
  }
};
