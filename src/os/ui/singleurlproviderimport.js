goog.module('os.ui.SingleUrlProviderImportCtrl');

goog.require('os.ui.uniqueProviderTitle');
goog.require('os.ui.uniqueServerUrl');

const ProviderImportCtrl = goog.require('os.ui.ProviderImportCtrl');

const OSFile = goog.requireType('os.file.File');
const TreeNode = goog.requireType('os.structs.TreeNode');
const AbstractLoadingServer = goog.requireType('os.ui.server.AbstractLoadingServer');


/**
 * Base controller for server import UIs that use a single URL configuration
 *
 * @abstract
 * @unrestricted
 */
class Controller extends ProviderImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    // focus the form
    this.element.find('input[name="title"]').focus();
  }

  /**
   * @inheritDoc
   */
  initialize() {
    super.initialize();

    var file = /** @type {OSFile} */ (this.scope['config']['file']);
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
  }

  /**
   * @inheritDoc
   */
  formDiff() {
    return this.getUrl() !== this.scope['config']['url'];
  }

  /**
   * @return {!string} url
   */
  getUrl() {
    if (this.dp) {
      return /** @type {AbstractLoadingServer} */ (this.dp).getUrl();
    }

    return '';
  }

  /**
   * @inheritDoc
   */
  getConfig() {
    var conf = {};
    var fields = this.getConfigFields();
    var original = this.scope['config'];

    for (var key in original) {
      if (fields.indexOf(key) > -1) {
        conf[key] = original[key];
      }
    }

    return conf;
  }

  /**
   * Get the fields used in the provider config.
   *
   * @return {!Array<string>}
   * @protected
   */
  getConfigFields() {
    return ['label', 'url', 'enabled', 'type'];
  }

  /**
   * @inheritDoc
   */
  saveAndClose() {
    if (this.dp) {
      /** @type {TreeNode} */ (this.dp).setLabel(this.scope['config']['label']);
    }

    super.saveAndClose();
  }

  /**
   * Handles URL changes
   *
   * @export
   */
  validateUrl() {}
}

exports = Controller;
