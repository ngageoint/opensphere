goog.module('os.ui.MultiUrlProviderImportCtrl');
goog.module.declareLegacyNamespace();

goog.require('os.ui.uniqueServerUrl');

const {equals} = goog.require('goog.array');
const SingleUrlProviderImportCtrl = goog.require('os.ui.SingleUrlProviderImportCtrl');

const AbstractLoadingServer = goog.requireType('os.ui.server.AbstractLoadingServer');


/**
 * Base controller for server import UIs that use a single URL configuration
 *
 * @abstract
 * @unrestricted
 */
class Controller extends SingleUrlProviderImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * @inheritDoc
   */
  initialize() {
    super.initialize();
    this.scope['config']['alternateUrls'] = this.getAlternateUrls();
  }

  /**
   * @inheritDoc
   */
  cleanConfig() {
    super.cleanConfig();

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
  }

  /**
   * @inheritDoc
   */
  formDiff() {
    // compare alternate URLs
    if (this.scope && this.scope['config']) {
      var alternateUrls = this.scope['config']['alternateUrls'];
      var originals = this.getAlternateUrls();
      if (alternateUrls && originals) {
        // both defined, so compare the URLs
        if (!equals(alternateUrls, originals)) {
          return true;
        }
      } else if (alternateUrls != originals) {
        // one or both not defined, so check equality (different unless both are undefined)
        return true;
      }
    }

    // check the URL
    return super.formDiff();
  }

  /**
   * @return {!Array<string>} urls
   */
  getAlternateUrls() {
    if (this.dp) {
      var urls = /** @type {AbstractLoadingServer} */ (this.dp).getAlternateUrls();
      if (urls) {
        return urls.slice();
      }
    }

    return [];
  }

  /**
   * @inheritDoc
   */
  getConfigFields() {
    var fields = super.getConfigFields();
    fields.push('alternateUrls');
    return fields;
  }

  /**
   * Add a new alternate URL to the list.
   *
   * @export
   */
  addAlternateUrl() {
    if (!this.scope['config']['alternateUrls']) {
      this.scope['config']['alternateUrls'] = [];
    }

    this.scope['config']['alternateUrls'].push('');
  }

  /**
   * Remove an alternate URL from the list at the provided index.
   *
   * @param {number} index The alternate URL index to remove
   * @export
   */
  removeAlternateUrl(index) {
    if (this.scope['config']['alternateUrls'] && this.scope['config']['alternateUrls'].length > index) {
      this.scope['config']['alternateUrls'].splice(index, 1);
    }
  }
}

exports = Controller;
