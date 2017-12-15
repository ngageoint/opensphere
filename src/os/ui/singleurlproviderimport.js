goog.provide('os.ui.SingleUrlProviderImportCtrl');

goog.require('os.ui.Module');
goog.require('os.ui.ProviderImportCtrl');
goog.require('os.ui.uniqueProviderTitle');
goog.require('os.ui.uniqueServerUrl');



/**
 * Base controller for server import UIs that use a single URL configuration
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.ProviderImportCtrl}
 * @constructor
 * @ngInject
 */
os.ui.SingleUrlProviderImportCtrl = function($scope, $element) {
  os.ui.SingleUrlProviderImportCtrl.base(this, 'constructor', $scope, $element);

  // focus the form
  this.element.find('input[name="title"]').focus();
};
goog.inherits(os.ui.SingleUrlProviderImportCtrl, os.ui.ProviderImportCtrl);


/**
 * @inheritDoc
 */
os.ui.SingleUrlProviderImportCtrl.prototype.initialize = function() {
  os.ui.SingleUrlProviderImportCtrl.base(this, 'initialize');

  var file = /** @type {os.file.File} */ (this.scope['config']['file']);
  if (file) {
    var content = file.getContent();
    if (content) {
      var titles = content.match(/title>([^<]*)<\//i);

      if (titles && titles.length > 1) {
        this.scope['config']['label'] = titles[1];
      }
    }
  } else if (this.dp) {
    this.scope['config']['label'] = this.dp.getLabel();
  }
};


/**
 * @inheritDoc
 */
os.ui.SingleUrlProviderImportCtrl.prototype.formDiff = function() {
  return this.getUrl() !== this.scope['config']['url'];
};


/**
 * @return {!string} url
 */
os.ui.SingleUrlProviderImportCtrl.prototype.getUrl = function() {
  if (this.dp) {
    return /** @type {os.ui.server.AbstractLoadingServer} */ (this.dp).getUrl();
  }

  return '';
};


/**
 * @return {!string} url
 */
os.ui.SingleUrlProviderImportCtrl.prototype.getLabel = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.ui.SingleUrlProviderImportCtrl.prototype.getConfig = function() {
  var conf = {};
  var fields = this.getConfigFields();
  var original = this.scope['config'];

  for (var key in original) {
    if (fields.indexOf(key) > -1) {
      conf[key] = original[key];
    }
  }

  return conf;
};


/**
 * Get the fields used in the provider config.
 * @return {!Array<string>}
 * @protected
 */
os.ui.SingleUrlProviderImportCtrl.prototype.getConfigFields = function() {
  return ['label', 'url', 'enabled', 'type'];
};


/**
 * @inheritDoc
 */
os.ui.SingleUrlProviderImportCtrl.prototype.saveAndClose = function() {
  if (this.dp) {
    /** @type {os.structs.TreeNode} */ (this.dp).setLabel(this.scope['config']['label']);
  }

  os.ui.SingleUrlProviderImportCtrl.base(this, 'saveAndClose');
};
