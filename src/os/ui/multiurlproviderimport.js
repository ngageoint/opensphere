goog.provide('os.ui.MultiUrlProviderImportCtrl');

goog.require('os.ui.SingleUrlProviderImportCtrl');
goog.require('os.ui.uniqueServerUrl');



/**
 * Base controller for server import UIs that use a single URL configuration
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.SingleUrlProviderImportCtrl}
 * @constructor
 * @ngInject
 */
os.ui.MultiUrlProviderImportCtrl = function($scope, $element) {
  os.ui.MultiUrlProviderImportCtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(os.ui.MultiUrlProviderImportCtrl, os.ui.SingleUrlProviderImportCtrl);


/**
 * @inheritDoc
 */
os.ui.MultiUrlProviderImportCtrl.prototype.initialize = function() {
  os.ui.MultiUrlProviderImportCtrl.base(this, 'initialize');
  this.scope['config']['alternateUrls'] = this.getAlternateUrls();
};


/**
 * @inheritDoc
 */
os.ui.MultiUrlProviderImportCtrl.prototype.cleanConfig = function() {
  os.ui.MultiUrlProviderImportCtrl.base(this, 'cleanConfig');

  // compare alternate URLs
  if (this.scope && this.scope['config']) {
    var alternateUrls = this.scope['config']['alternateUrls'];
    if (alternateUrls) {
      var validUrls = [];

      var i = alternateUrls.length;
      while (i--) {
        // trim whitespace and make sure the URL isn't empty, and do not allow duplicate URLs
        var url = alternateUrls[i] || '';
        url = url.trim();

        if (url && validUrls.indexOf(url) == -1) {
          validUrls.push(url);
        }
      }

      if (validUrls.length > 0) {
        this.scope['config']['alternateUrls'] = validUrls;
      } else {
        this.scope['config']['alternateUrls'] = undefined;
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.MultiUrlProviderImportCtrl.prototype.formDiff = function() {
  // compare alternate URLs
  if (this.scope && this.scope['config']) {
    var alternateUrls = this.scope['config']['alternateUrls'];
    var originals = this.getAlternateUrls();
    if (alternateUrls && originals) {
      // both defined, so compare the URLs
      if (!goog.array.equals(alternateUrls, originals)) {
        return true;
      }
    } else if (alternateUrls != originals) {
      // one or both not defined, so check equality (different unless both are undefined)
      return true;
    }
  }

  // check the URL
  return os.ui.MultiUrlProviderImportCtrl.base(this, 'formDiff');
};


/**
 * @return {!Array<string>} urls
 */
os.ui.MultiUrlProviderImportCtrl.prototype.getAlternateUrls = function() {
  if (this.dp) {
    var urls = /** @type {os.ui.server.AbstractLoadingServer} */ (this.dp).getAlternateUrls();
    if (urls) {
      return urls.slice();
    }
  }

  return [];
};


/**
 * @inheritDoc
 */
os.ui.MultiUrlProviderImportCtrl.prototype.getConfigFields = function() {
  var fields = os.ui.MultiUrlProviderImportCtrl.base(this, 'getConfigFields');
  fields.push('alternateUrls');
  return fields;
};


/**
 * Add a new alternate URL to the list.
 */
os.ui.MultiUrlProviderImportCtrl.prototype.addAlternateUrl = function() {
  if (!this.scope['config']['alternateUrls']) {
    this.scope['config']['alternateUrls'] = [];
  }

  this.scope['config']['alternateUrls'].push('');
};
goog.exportProperty(
    os.ui.MultiUrlProviderImportCtrl.prototype,
    'addAlternateUrl',
    os.ui.MultiUrlProviderImportCtrl.prototype.addAlternateUrl);


/**
 * Remove an alternate URL from the list at the provided index.
 * @param {number} index The alternate URL index to remove
 */
os.ui.MultiUrlProviderImportCtrl.prototype.removeAlternateUrl = function(index) {
  if (this.scope['config']['alternateUrls'] && this.scope['config']['alternateUrls'].length > index) {
    this.scope['config']['alternateUrls'].splice(index, 1);
  }
};
goog.exportProperty(
    os.ui.MultiUrlProviderImportCtrl.prototype,
    'removeAlternateUrl',
    os.ui.MultiUrlProviderImportCtrl.prototype.removeAlternateUrl);
