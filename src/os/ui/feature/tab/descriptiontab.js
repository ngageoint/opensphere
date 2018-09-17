goog.provide('os.ui.feature.tab.DescriptionTabCtrl');
goog.provide('os.ui.feature.tab.descriptionEnableFunction');
goog.provide('os.ui.feature.tab.descriptionTabDirective');

goog.require('ol.Feature');
goog.require('os.data.RecordField');
goog.require('os.ui.Module');
goog.require('os.ui.feature.tab.AbstractFeatureTabCtrl');


/**
 * The descriptionTabDirective
 * @return {angular.Directive}
 */
os.ui.feature.tab.descriptionTabDirective = function() {
  return {
    restrict: 'E',
    scope: false,
    replace: true,
    templateUrl: os.ROOT + 'views/feature/tab/descriptiontab.html',
    controller: os.ui.feature.tab.DescriptionTabCtrl,
    controllerAs: 'descctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('descriptiontab', [os.ui.feature.tab.descriptionTabDirective]);



/**
 * Controller function for the descriptionTabDirective directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.feature.tab.AbstractFeatureTabCtrl}
 * @constructor
 */
os.ui.feature.tab.DescriptionTabCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   */
  this.element = $element;

  os.ui.feature.tab.DescriptionTabCtrl.base(this, 'constructor');
};
goog.inherits(os.ui.feature.tab.DescriptionTabCtrl, os.ui.feature.tab.AbstractFeatureTabCtrl);


/**
 * @inheritDoc
 */
os.ui.feature.tab.DescriptionTabCtrl.prototype.updateTab = function(event, data) {
  if (data) {
    var feature = /** @type {ol.Feature|undefined} */ (data);
    if (feature) {
      var properties = feature.getProperties();
      var description = properties[os.data.RecordField.HTML_DESCRIPTION];
      if (!description) {
        description = /** @type {string|undefined} */ (goog.object.findValue(properties, function(val, key) {
          return os.fields.DESC_REGEXP.test(key) && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(val));
        })) || '';
      }

      if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(description))) {
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
};


/**
 * The tab enable function for the description tab.
 * @param {?Object} tabData The data represented in tab
 * @return {!boolean} true if tab should be shown
 */
os.ui.feature.tab.descriptionEnableFunction = function(tabData) {
  var feature = /** @type {ol.Feature|undefined} */ (tabData);
  if (feature) {
    var properties = feature.getProperties();
    var description = properties[os.data.RecordField.HTML_DESCRIPTION];
    if (!description) {
      description = /** @type {string|undefined} */ (goog.object.findValue(properties, function(val, key) {
        return os.fields.DESC_REGEXP.test(key) && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(val));
      })) || '';
    }

    if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(description))) {
      return true;
    }
  }
  return false;
};
