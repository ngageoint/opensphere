goog.provide('os.ui.feature.tab.PropertiesTabCtrl');
goog.provide('os.ui.feature.tab.propertiesTabDirective');


goog.require('ol.Feature');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.ui.Module');
goog.require('os.ui.feature.featureInfoCellDirective');
goog.require('os.ui.feature.tab.AbstractFeatureTabCtrl');


/**
 * The PropertiesTabDirective
 *
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
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.feature.tab.AbstractFeatureTabCtrl}
 * @constructor
 * @ngInject
 */
os.ui.feature.tab.PropertiesTabCtrl = function($scope, $element) {
  $scope['columnToOrder'] = 'field';
  $scope['reverse'] = false;
  $scope['selected'] = null;

  /**
   * The feature.
   * @type {ol.Feature}
   */
  this.feature = null;

  /**
   * The source.
   * @type {os.source.Vector}
   */
  this.source = null;

  /**
   * Array of feature property model objects.
   * @type {Array<Object<string, *>>}
   */
  this['properties'] = null;

  os.ui.feature.tab.PropertiesTabCtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(os.ui.feature.tab.PropertiesTabCtrl, os.ui.feature.tab.AbstractFeatureTabCtrl);


/**
 * @inheritDoc
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.updateTab = function(event, data) {
  if (this.source) {
    ol.events.unlisten(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
  }

  this.feature = data instanceof ol.Feature ? /** @type {ol.Feature} */ (data) : null;
  this.source = os.feature.getSource(this.feature);

  if (this.source) {
    ol.events.listen(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
  }

  this.updateProperties();
};


/**
 * Updates the properties table from the current source columns.
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.updateProperties = function() {
  this['properties'] = [];
  if (this.feature) {
    var source = os.feature.getSource(this.feature);

    if (source) {
      var columns = source.getColumns();

      columns.forEach(function(col) {
        var field = /** @type {string} */ (col['field']);
        var value = this.feature.get(field);

        if (col['visible']) {
          this.addProperty(field, value);
        }
      }, this);
    } else {
      // if we don't have a source, just show the properties
      var featureProperties = this.feature.getProperties();

      for (var key in featureProperties) {
        this.addProperty(key, featureProperties[key]);
      }
    }
  }

  os.ui.apply(this.scope);
};


/**
 * Adds a property.
 *
 * @param {string} field The field to add.
 * @param {*} value The value to add.
 * @private
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.addProperty = function(field, value) {
  if (field && value && !os.feature.isInternalField(field) && os.object.isPrimitive(value)) {
    this['properties'].push({
      'id': field,
      'field': field,
      'value': value
    });
  } else if (field === os.data.RecordField.TIME) {
    this['properties'].push({
      'id': field,
      'field': os.Fields.TIME,
      'value': value
    });
  }
};


/**
 * Handle property changes on the source.
 *
 * @param {os.events.PropertyChangeEvent} e The change event.
 * @private
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.onSourceChange_ = function(e) {
  var p = e.getProperty();
  if (p === os.source.PropertyChange.COLUMNS) {
    this.updateProperties();
  }
};


/**
 * Select this property
 *
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
