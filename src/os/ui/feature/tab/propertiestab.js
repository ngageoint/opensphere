goog.declareModuleId('os.ui.feature.tab.PropertiesTabUI');

import {listen, unlistenByKey} from 'ol/src/events.js';

import '../featureinfocell.js';
import Settings from '../../../config/settings.js';
import RecordField from '../../../data/recordfield.js';
import * as osFeature from '../../../feature/feature.js';
import Fields from '../../../fields/fields.js';
import {isPrimitive} from '../../../object/object.js';
import {ROOT} from '../../../os.js';
import PropertyChange from '../../../source/propertychange.js';
import Module from '../../module.js';
import {apply} from '../../ui.js';
import AbstractFeatureTabCtrl from './abstractfeaturetabctrl.js';

const GoogEventType = goog.require('goog.events.EventType');
const {numerateCompare} = goog.require('goog.string');

const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: VectorSource} = goog.requireType('os.source.Vector');


/**
 * The PropertiesTabDirective
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: false,
  templateUrl: ROOT + 'views/feature/tab/propertiestab.html',
  controller: Controller,
  controllerAs: 'propctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'propertiestab';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the propertiesTabDirective directive
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

    $scope['columnToOrder'] = 'field';
    $scope['reverse'] = false;
    $scope['selected'] = null;

    /**
     * The feature.
     * @type {Feature|RenderFeature}
     */
    this.feature = null;

    /**
     * The source.
     * @type {VectorSource}
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
    this['showEmpty'] = Settings.getInstance().get(Controller.SHOW_EMPTY_KEY, true);

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
    const feature = this.isFeature(data) ? /** @type {Feature|RenderFeature} */ (data) : null;
    this.setFeature(feature);
    this.updateProperties();
  }

  /**
   * Set the feature displayed by the tab.
   * @param {Feature|RenderFeature} feature The feature.
   * @protected
   */
  setFeature(feature) {
    if (this.source) {
      unlistenByKey(this.source, GoogEventType.PROPERTYCHANGE, this.onSourceChange_, this);
    }

    this.feature = feature;
    this.source = feature ? osFeature.getSource(feature) : null;

    if (this.source) {
      listen(this.source, GoogEventType.PROPERTYCHANGE, this.onSourceChange_, this);
    }
  }

  /**
   * Toggle if empty values are displayed in the table.
   * @export
   */
  toggleEmpty() {
    // Update locally and in settings, then refresh the displayed properties.
    this['showEmpty'] = !this['showEmpty'];
    Settings.getInstance().set(Controller.SHOW_EMPTY_KEY, this['showEmpty']);

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

    apply(this.scope);
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
      if (field && !osFeature.isInternalField(field) && isPrimitive(value)) {
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
   * @param {PropertyChangeEvent} e The change event.
   * @private
   */
  onSourceChange_(e) {
    var p = e.getProperty();
    if (p === PropertyChange.COLUMNS) {
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
      return numerateCompare(v1, v2) * (reverse ? -1 : 1);
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
