goog.module('os.ui.feature.tab.PropertiesTabUI');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');
const osFeature = goog.require('os.feature');
const settings = goog.require('os.config.Settings');
const Feature = goog.require('ol.Feature');
const Fields = goog.require('os.Fields');
const RecordField = goog.require('os.data.RecordField');
const Module = goog.require('os.ui.Module');
const AbstractFeatureTabCtrl = goog.require('os.ui.feature.tab.AbstractFeatureTabCtrl');


goog.require('os.ui.feature.featureInfoCellDirective');

/**
 * The PropertiesTabDirective
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: false,
  templateUrl: os.ROOT + 'views/feature/tab/propertiestab.html',
  controller: Controller,
  controllerAs: 'propctrl'
});


/**
 * Add the directive to the module.
 */
Module.directive('propertiestab', [directive]);



/**
 * Controller function for the propertiesTabDirective directive
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

    $scope['columnToOrder'] = 'field';
    $scope['reverse'] = false;
    $scope['selected'] = null;

    /**
     * The feature.
     * @type {Feature}
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
    this['showEmpty'] = settings.getInstance().get(Controller.SHOW_EMPTY_KEY, true);

    /**
     * Status message to display below the table.
     * @type {string}
     */
    this['status'] = '';
  }

  /**
   * @inheritDoc
   */
  destroy() {
    super.destroy();
    this.setFeature(null);
  }

  /**
   * @inheritDoc
   */
  updateTab(event, data) {
    const feature = data instanceof Feature ? /** @type {Feature} */ (data) : null;
    this.setFeature(feature);
    this.updateProperties();
  }

  /**
   * Set the feature displayed by the tab.
   * @param {Feature} feature The feature.
   * @protected
   */
  setFeature(feature) {
    if (this.source) {
      ol.events.unlisten(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
    }

    this.feature = feature;
    this.source = feature ? osFeature.getSource(feature) : null;

    if (this.source) {
      ol.events.listen(this.source, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
    }
  }

  /**
   * Toggle if empty values are displayed in the table.
   * @export
   */
  toggleEmpty() {
    // Update locally and in settings, then refresh the displayed properties.
    this['showEmpty'] = !this['showEmpty'];
    settings.getInstance().set(Controller.SHOW_EMPTY_KEY, this['showEmpty']);

    this.updateProperties();
  }

  /**
   * Update the status message.
   * @private
   */
  updateStatus_() {
    if (this['properties']) {
      const numProps = this['properties'].length;
      const fieldsText = `${numProps} field${numProps > 1 ? 's' : ''}`;
      const hiddenText = this.hiddenProperties_ > 0 ? `(${this.hiddenProperties_} hidden)` : '';
      this['status'] = `${fieldsText} ${hiddenText}`;
    } else {
      this['status'] = '';
    }
  }

  /**
   * Updates the properties table from the current source columns.
   */
  updateProperties() {
    this['properties'] = [];
    this.hiddenProperties_ = 0;

    if (this.feature) {
      var source = osFeature.getSource(this.feature);

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

    ui.apply(this.scope);
  }

  /**
   * Adds a property.
   *
   * @param {string} field The field to add.
   * @param {*} value The value to add.
   * @private
   */
  addProperty(field, value) {
    if (this['showEmpty'] || (value != null && value !== '')) {
      if (field && !osFeature.isInternalField(field) && os.object.isPrimitive(value)) {
        this['properties'].push({
          'id': field,
          'field': field,
          'value': value
        });
      } else if (field === RecordField.TIME) {
        this['properties'].push({
          'id': field,
          'field': Fields.TIME,
          'value': value
        });
      }
    } else {
      this.hiddenProperties_++;
    }
  }

  /**
   * Handle property changes on the source.
   *
   * @param {os.events.PropertyChangeEvent} e The change event.
   * @private
   */
  onSourceChange_(e) {
    var p = e.getProperty();
    if (p === os.source.PropertyChange.COLUMNS) {
      this.updateProperties();
    }
  }

  /**
   * Set the property order column.
   * @param {string} key The order column.
   * @export
   */
  setOrderColumn(key) {
    if (key) {
      if (key === this.scope['columnToOrder']) {
        this.scope['reverse'] = !this.scope['reverse'];
      } else {
        this.scope['columnToOrder'] = key;
      }
    }

    this.sortProperties_();
  }

  /**
   * Sort the properties.
   * @private
   */
  sortProperties_() {
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
  }

  /**
   * Select this property
   *
   * @param {Event} event
   * @param {Object} property
   * @export
   */
  select(event, property) {
    if (this.scope['selected'] == property && event.ctrlKey) {
      this.scope['selected'] = null;
    } else {
      this.scope['selected'] = property;
    }
  }
}


/**
 * Settings key to manage the show empty state.
 * @type {string}
 * @const
 */
Controller.SHOW_EMPTY_KEY = 'ui.featureInfo.showEmptyProperties';


exports = {
  Controller,
  directive
};
