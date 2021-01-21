goog.provide('os.ui.feature.tab.PropertiesTabCtrl');
goog.provide('os.ui.feature.tab.propertiesTabDirective');


goog.require('ol.Feature');
goog.require('ol.render.Feature');
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
  os.ui.feature.tab.PropertiesTabCtrl.base(this, 'constructor', $scope, $element);

  $scope['columnToOrder'] = 'field';
  $scope['reverse'] = false;
  $scope['selected'] = null;

  /**
   * The feature.
   * @type {ol.Feature|ol.render.Feature}
   */
  this.feature = null;

  /**
   * The source.
   * @type {os.source.Vector}
   */
  this.source = null;

  /**
   * Number of properties hidden from view.
   * @type {number}
   * @private
   */
  this.hiddenProperties_ = 0;

  /**
   * Array of feature property model objects.
   * @type {Array<Object<string, *>>}
   */
  this['properties'] = null;

  /**
   * If empty properties should be shown.
   * @type {boolean}
   */
  this['showEmpty'] = os.settings.get(os.ui.feature.tab.PropertiesTabCtrl.SHOW_EMPTY_KEY, true);

  /**
   * Status message to display below the table.
   * @type {string}
   */
  this['status'] = '';
};
goog.inherits(os.ui.feature.tab.PropertiesTabCtrl, os.ui.feature.tab.AbstractFeatureTabCtrl);


/**
 * Settings key to manage the show empty state.
 * @type {string}
 * @const
 */
os.ui.feature.tab.PropertiesTabCtrl.SHOW_EMPTY_KEY = 'ui.featureInfo.showEmptyProperties';


/**
 * @inheritDoc
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.destroy = function() {
  os.ui.feature.tab.PropertiesTabCtrl.base(this, 'destroy');
  this.setFeature(null);
};


/**
 * @inheritDoc
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.updateTab = function(event, data) {
  const feature = this.isFeature(data) ? /** @type {ol.Feature|ol.render.Feature} */ (data) : null;
  this.setFeature(feature);
  this.updateProperties();
};


/**
 * Set the feature displayed by the tab.
 * @param {ol.Feature|ol.render.Feature} feature The feature.
 * @protected
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.setFeature = function(feature) {
  if (this.source) {
    ol.events.unlisten(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
  }

  this.feature = feature;
  this.source = feature ? os.feature.getSource(feature) : null;

  if (this.source) {
    ol.events.listen(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
  }
};


/**
 * Toggle if empty values are displayed in the table.
 * @export
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.toggleEmpty = function() {
  // Update locally and in settings, then refresh the displayed properties.
  this['showEmpty'] = !this['showEmpty'];
  os.settings.set(os.ui.feature.tab.PropertiesTabCtrl.SHOW_EMPTY_KEY, this['showEmpty']);

  this.updateProperties();
};


/**
 * Update the status message.
 * @private
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.updateStatus_ = function() {
  if (this['properties']) {
    const numProps = this['properties'].length;
    const fieldsText = `${numProps} field${numProps > 1 ? 's' : ''}`;
    const hiddenText = this.hiddenProperties_ > 0 ? `(${this.hiddenProperties_} hidden)` : '';
    this['status'] = `${fieldsText} ${hiddenText}`;
  } else {
    this['status'] = '';
  }
};


/**
 * Updates the properties table from the current source columns.
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.updateProperties = function() {
  this['properties'] = [];
  this.hiddenProperties_ = 0;

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

  this.sortProperties_();
  this.updateStatus_();

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
  if (this['showEmpty'] || (value != null && value !== '')) {
    if (field && !os.feature.isInternalField(field) && os.object.isPrimitive(value)) {
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
  } else {
    this.hiddenProperties_++;
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
 * Set the property order column.
 * @param {string} key The order column.
 * @export
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.setOrderColumn = function(key) {
  if (key) {
    if (key === this.scope['columnToOrder']) {
      this.scope['reverse'] = !this.scope['reverse'];
    } else {
      this.scope['columnToOrder'] = key;
    }
  }

  this.sortProperties_();
};


/**
 * Sort the properties.
 * @private
 */
os.ui.feature.tab.PropertiesTabCtrl.prototype.sortProperties_ = function() {
  var field = this.scope['columnToOrder'];
  var reverse = this.scope['reverse'];

  this['properties'].sort(function(a, b) {
    if (a[field] == b[field]) {
      return 0;
    } else if (a[field] == null) {
      return 1;
    } else if (b[field] == null) {
      return -1;
    }

    // remove span tags if they are present before comparison
    var v1 = a[field].toString().replace(/<\/*span>/g, '');
    var v2 = b[field].toString().replace(/<\/*span>/g, '');
    return goog.string.numerateCompare(v1, v2) * (reverse ? -1 : 1);
  });
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
