goog.declareModuleId('plugin.area.AreaImportCtrl');

import RecordField from '../../os/data/recordfield.js';
import AreaImportCtrl from '../../os/ui/query/areaimportctrl.js';
import {processFeatures} from './area.js';


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
    this.config[RecordField.SOURCE_NAME] = this.getFileName();
    processFeatures(features, this.config);
  }
}

export default Controller;
