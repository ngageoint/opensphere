goog.provide('os.ui.feature.tab.PropertiesTabCtrl');
goog.provide('os.ui.feature.tab.propertiesTabDirective');


goog.require('ol.Feature');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.ui.Module');
goog.require('os.ui.feature.tab.AbstractFeatureTabCtrl');


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
 * @param {!angular.JQLite} $element
 * @extends {os.ui.feature.tab.AbstractFeatureTabCtrl}
 * @constructor
 */
os.ui.feature.tab.PropertiesTabCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   */
  this.element = $element;


  this.scope['columnToOrder'] = 'field';
  this.scope['reverse'] = false;
  this.scope['selected'] = null;

  os.ui.feature.tab.PropertiesTabCtrl.base(this, 'constructor');
};
goog.inherits(os.ui.feature.tab.PropertiesTabCtrl, os.ui.feature.tab.AbstractFeatureTabCtrl);


/**
 * @inheritDoc
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.updateTab = function(event, data) {
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
