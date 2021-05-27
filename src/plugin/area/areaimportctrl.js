goog.module('plugin.area.AreaImportCtrl');
goog.module.declareLegacyNamespace();

const AreaImportCtrl = goog.require('os.ui.query.AreaImportCtrl');
const area = goog.require('plugin.area');


/**
 * Abstract controller for importing areas from a file.
 *
 * @template T
 * @unrestricted
 */
class Controller extends AreaImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);
  }

  /**
   * Get the filename for the source file.
   *
   * @return {string|undefined}
   * @protected
   */
  getFileName() {
    return this.config && this.config['title'] || undefined;
  }

  /**
   * Process imported features.
   *
   * @param {Array<ol.Feature>} features
   * @protected
   */
  processFeatures(features) {
    this.config[os.data.RecordField.SOURCE_NAME] = this.getFileName();
    area.processFeatures(features, this.config);
  }
}

exports = Controller;
