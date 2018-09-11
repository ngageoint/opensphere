goog.provide('os.ui.feature.tab.DescriptionTabCtrl');
goog.provide('os.ui.feature.tab.descriptionEnableFunction');
goog.provide('os.ui.feature.tab.descriptionTabDirective');


goog.require('ol.Feature');
goog.require('os.ui.Module');


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
 * @constructor
 * @ngInject
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

  // Control is constructed after the first broadcast
  // so the description need to be updated once during construction
  if (this.scope && this.scope['items'] && this.scope['items'].length > 0) {
    this.updateDescription(null, this.scope['items'][0]['data']);
  }

  $scope.$on(os.ui.feature.FeatureInfoCtrl.UPDATE_TABS, this.updateDescription.bind(this));
  $scope.$on('$destroy', goog.bind(this.destroy_, this));
};


/**
 * Clean up.
 * @private
 */
os.ui.feature.tab.DescriptionTabCtrl.prototype.destroy_ = function() {
  this.scope = null;
  this.element = null;
};


/**
 * Update the description information displayed for the feature.
 * @param {?angular.Scope.Event} event The broadcast event
 * @param {*} data The event data
 * @protected
 */
os.ui.feature.tab.DescriptionTabCtrl.prototype.updateDescription = function(event, data) {
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
