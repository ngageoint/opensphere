goog.module('os.ui.feature.tab.DescriptionTabUI');
goog.module.declareLegacyNamespace();

const RecordField = goog.require('os.data.RecordField');
const Module = goog.require('os.ui.Module');
const AbstractFeatureTabCtrl = goog.require('os.ui.feature.tab.AbstractFeatureTabCtrl');

const Feature = goog.requireType('ol.Feature');


/**
 * The descriptionTabDirective
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  scope: false,
  replace: true,
  templateUrl: os.ROOT + 'views/feature/tab/descriptiontab.html',
  controller: Controller,
  controllerAs: 'descctrl'
});


/**
 * Add the directive to the module.
 */
Module.directive('descriptiontab', [directive]);



/**
 * Controller function for the descriptionTabDirective directive
 * @unrestricted
 */
class Controller extends AbstractFeatureTabCtrl {
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
          description = /** @type {string|undefined} */ (goog.object.findValue(properties, function(val, key) {
            return os.fields.DESC_REGEXP.test(key) && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(val));
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

exports = {
  Controller,
  directive
};
