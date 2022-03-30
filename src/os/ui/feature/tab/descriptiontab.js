goog.declareModuleId('os.ui.feature.tab.DescriptionTabUI');

import RecordField from '../../../data/recordfield.js';
import {DESC_REGEXP} from '../../../fields/index.js';
import {ROOT} from '../../../os.js';
import Module from '../../module.js';
import AbstractFeatureTabCtrl from './abstractfeaturetabctrl.js';

const {findValue} = goog.require('goog.object');
const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');

/**
 * The descriptionTabDirective
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  scope: false,
  replace: true,
  templateUrl: ROOT + 'views/feature/tab/descriptiontab.html',
  controller: Controller,
  controllerAs: 'descctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'descriptiontab';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the descriptionTabDirective directive
 * @unrestricted
 */
export class Controller extends AbstractFeatureTabCtrl {
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
  updateTab(event, data) {
    if (data) {
      var feature = /** @type {Feature|undefined} */ (data);
      if (feature) {
        var properties = feature.getProperties();
        var description = properties[RecordField.HTML_DESCRIPTION];
        if (!description) {
          description = /** @type {string|undefined} */ (findValue(properties, function(val, key) {
            return DESC_REGEXP.test(key) && !isEmptyOrWhitespace(makeSafe(val));
          })) || '';
        }

        if (description != null && description != '') {
          description = description.replace(/<a /g, '<a target="_blank" ');

          var iframe = this.element.find('iframe')[0];
          if (iframe) {
            var frameDoc = iframe.contentWindow.document;
            frameDoc.open();
            frameDoc.write(description);
            frameDoc.close();
          }
        }
      }
    }
  }
}
