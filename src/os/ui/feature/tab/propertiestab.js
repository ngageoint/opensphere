goog.provide('os.ui.feature.tab.PropertiesTabCtrl');
goog.provide('os.ui.feature.tab.propertiesTabDirective');


goog.require('ol.Feature');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.ui.Module');


/**
 * The PropertiesTabDirective
 * @return {angular.Directive}
 */
os.ui.feature.tab.propertiesTabDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: false,
    templateUrl: os.ROOT + 'views/feature/tab/propertiestab.html',
    controller: os.ui.feature.tab.PropertiesTabCtrl,
    controllerAs: 'propctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('propertiestab', [os.ui.feature.tab.propertiesTabDirective]);



/**
 * Controller function for the propertiesTabDirective directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.feature.tab.PropertiesTabCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;

  this.scope['columnToOrder'] = 'field';
  this.scope['reverse'] = false;
  this.scope['selected'] = null;

  // Control is constructed after the first broadcast
  // so the properties need to be updated once during construction
  if (this.scope && this.scope['items'] && this.scope['items'].length > 0) {
    this.updateProperties(null, this.scope['items'][0]['data']);
  }


  $scope.$on('$destroy', goog.bind(this.destroy_, this));
  $scope.$on(os.ui.feature.FeatureInfoCtrl.UPDATE_TABS, this.updateProperties.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.destroy_ = function() {
  this.scope = null;
};


/**
 * Update the properties/description information displayed for the feature
 * @param {?angular.Scope.Event} event The broadcast event
 * @param {*} data The event data
 * @protected
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.updateProperties = function(event, data) {
  if (data) {
    this.scope['properties'] = [];

    var feature = /** @type {ol.Feature|undefined} */ (data);
    if (feature) {
      var properties = feature.getProperties();
      // create content for the property grid
      var time = /** @type {os.time.ITime|undefined} */ (feature.get(os.data.RecordField.TIME));
      if (time) {
        // add the record time to the property grid and make sure it isn't duplicated
        this.scope['properties'].push({
          'id': 'TIME',
          'field': 'TIME',
          'value': time
        });

        delete properties['TIME'];
      }

      for (var key in properties) {
        if (key === os.Fields.GEOTAG) {
          // associate the feature with the CX report it came from
          this.scope['properties'].push({
            'id': os.Fields.GEOTAG,
            'field': os.Fields.GEOTAG,
            'value': properties[os.data.RecordField.SOURCE_ID],
            'CX': true
          });
        } else if (key === os.Fields.PROPERTIES) {
          this.scope['properties'].push({
            'id': key,
            'field': key,
            'value': properties[key],
            'feature': feature
          });
        } else if (!os.feature.isInternalField(key) && os.object.isPrimitive(properties[key])) {
          this.scope['properties'].push({
            'id': key,
            'field': key,
            'value': properties[key]
          });
        }
      }
    }
  }

  this.order();

  // os.ui.apply(this.scope);
};


/**
 * Allow ordering
 * @param {string=} opt_key
 * @export
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.order = function(opt_key) {
  if (opt_key) {
    if (opt_key === this.scope['columnToOrder']) {
      this.scope['reverse'] = !this.scope['reverse'];
    } else {
      this.scope['columnToOrder'] = opt_key;
    }
  }

  var field = this.scope['columnToOrder'];
  var reverse = this.scope['reverse'];

  this.scope['properties'].sort(function(a, b) {
    var v1 = a[field].toString();
    var v2 = b[field].toString();
    return goog.string.numerateCompare(v1, v2) * (reverse ? -1 : 1);
  });
};


/**
 * Select this property
 * @param {Event} event
 * @param {Object} property
 * @export
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.select = function(event, property) {
  if (this.scope['selected'] == property && event.ctrlKey) {
    this.scope['selected'] = null;
  } else {
    this.scope['selected'] = property;
  }
};
