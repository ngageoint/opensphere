goog.module('plugin.im.action.feature.ui.LabelConfigUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.data.addColumnFormDirective');
goog.require('os.ui.layer.labelControlsDirective');
goog.require('os.ui.popover.popoverDirective');

const {ROOT} = goog.require('os');
const Delay = goog.require('goog.async.Delay');
const olArray = goog.require('ol.array');
const dispatcher = goog.require('os.Dispatcher');
const osColor = goog.require('os.color');
const ColumnDefinition = goog.require('os.data.ColumnDefinition');
const osImplements = goog.require('os.implements');
const ILayer = goog.require('os.layer.ILayer');
const osObject = goog.require('os.object');
const osStyle = goog.require('os.style');
const label = goog.require('os.style.label');
const Module = goog.require('os.ui.Module');
const ActionConfigCtrl = goog.require('plugin.im.action.feature.ui.ActionConfigCtrl');

const LabelAction = goog.requireType('plugin.im.action.feature.LabelAction');


/**
 * Directive to configure a feature label action.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/featureaction/featurelabelactionconfig.html',
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'featurelabelaction';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for setting a feature label.
 *
 * @extends {ActionConfigCtrl<LabelAction>}
 * @unrestricted
 */
class Controller extends ActionConfigCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * If a custom label should be added.
     * @type {boolean}
     */
    this['addCustomLabel'] = false;

    /**
     * Form validators.
     * @type {!Array<!Object>}
     */
    this['validators'] = [];

    this['customLabelWarning'] = 'The custom label will be added to each feature, but will not appear on the map ' +
        'unless selected in the columns above.';

    /**
     * The custom column definition.
     * @type {!ColumnDefinition}
     * @protected
     */
    this.customColumn = new ColumnDefinition();

    /**
     * Delay to handle updating the custom column.
     * @type {Delay}
     * @protected
     */
    this.updateCustomColumnDelay = new Delay(this.updateCustomColumn, 100, this);

    /**
     * The action label config.
     * @type {Object}
     * @protected
     */
    this.labelConfig;

    /**
     * The original label color, for the Reset button.
     * @type {string|undefined}
     * @protected
     */
    this.initialColor = undefined;

    if (this.action && this.action.labelConfig) {
      this.labelConfig = /** @type {!Object} */ (osObject.unsafeClone(this.action.labelConfig));
    } else {
      this.labelConfig = /** @type {!Object} */ (osObject.unsafeClone(defaultConfig));
    }

    $scope.$on('labelColor.change', this.onColorChange.bind(this));
    $scope.$on('labelColor.reset', this.onColorReset.bind(this));
    $scope.$on(os.ui.layer.LabelControlsEventType.COLUMN_CHANGE, this.validate.bind(this));
    $scope.$watch('size', this.onSizeChange.bind(this));
    $scope.$watch('config.customName', this.onCustomNameChange.bind(this));

    this.initialize();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    goog.dispose(this.updateCustomColumnDelay);
    this.updateCustomColumnDelay = null;
  }

  /**
   * @inheritDoc
   */
  initialize() {
    if (this.type) {
      // add duplicate validator for the custom column name
      var source = os.data.DataManager.getInstance().getSource(this.type);
      if (source) {
        this['validators'].push({
          'id': 'duplicate',
          'model': 'name',
          'handler': os.ui.data.AddColumnFormCtrl.isDuplicate.bind(this, source)
        });
      }
    }

    if (this.labelConfig) {
      this.scope['config'] = this.labelConfig;

      var color = this.labelConfig['color'] || osStyle.DEFAULT_LAYER_COLOR;
      this.scope['color'] = this.initialColor = osColor.toHexString(color);
      this.scope['size'] = this.labelConfig['size'] || label.DEFAULT_SIZE;

      var layer = os.MapContainer.getInstance().getLayer(this.type);
      if (osImplements(layer, ILayer.ID)) {
        this.scope['columns'] = os.ui.layer.getColumns(/** @type {ILayer} */ (layer));
      }

      if (!this.scope['columns']) {
        this.scope['columns'] = [];
      }

      if (this.labelConfig['customName'] && this.labelConfig['customValue']) {
        this['addCustomLabel'] = true;
      }
    }

    this.updateCustomColumn();

    super.initialize();
  }

  /**
   * @inheritDoc
   */
  saveAction() {
    if (this.action && this.labelConfig) {
      // if not adding a custom label, clear out the values
      if (!this['addCustomLabel']) {
        this.labelConfig['customName'] = '';
        this.labelConfig['customValue'] = '';
      }

      this.action.labelConfig = this.labelConfig;

      // send a message indicating an update occurred
      dispatcher.getInstance().dispatchEvent(os.ui.im.action.EventType.UPDATE);
    }
  }

  /**
   * Validate the form.
   *
   * @protected
   */
  validate() {
    var columnName = this.customColumn['name'];
    if (this['addCustomLabel'] && columnName) {
      this['showCustomWarning'] = !this.scope['config']['labels'].some(function(obj) {
        return obj['column'] === columnName;
      });
    } else {
      this['showCustomWarning'] = false;
    }
  }

  /**
   * Handle changes to the custom column name.
   *
   * @param {string=} opt_new The new value.
   * @param {string=} opt_old The old value.
   * @protected
   */
  onCustomNameChange(opt_new, opt_old) {
    if (opt_new != opt_old && this.updateCustomColumnDelay) {
      this.updateCustomColumnDelay.start();
    }
  }

  /**
   * Update the custom column and add it to the column list if necessary.
   *
   * @export
   */
  updateCustomColumn() {
    olArray.remove(this.scope['columns'], this.customColumn);

    var name = (this.labelConfig && this.labelConfig['customName'] || '').trim();
    if (name) {
      // update the custom column if the column name has been set
      this.customColumn['name'] = name;
      this.customColumn['field'] = name;
      this['showCustomWarning'] = false;

      // if a custom label is configured, make it available for selection in the column picker
      if (this['addCustomLabel'] && this.scope && this.scope['columns']) {
        var findFn = os.ui.slick.column.findByField.bind(undefined, 'field', name);
        if (!olArray.find(this.scope['columns'], findFn)) {
          this.scope['columns'].push(this.customColumn);
          this.scope['columns'].sort(os.ui.slick.column.nameCompare);
        }
      }
    }

    this.validate();
    os.ui.apply(this.scope);
  }

  /**
   * Handle color change.
   *
   * @param {angular.Scope.Event} event The Angular event.
   * @param {string|undefined} value The new color value.
   * @protected
   */
  onColorChange(event, value) {
    event.stopPropagation();

    if (this.labelConfig) {
      var color = value ? osStyle.toRgbaString(value) : osStyle.DEFAULT_LAYER_COLOR;
      this.labelConfig['color'] = color;
      this.scope['color'] = osColor.toHexString(color);
    }
  }

  /**
   * Handle color reset.
   *
   * @param {angular.Scope.Event} event
   * @protected
   */
  onColorReset(event) {
    event.stopPropagation();

    // reset the color to the initial value
    this.onColorChange(event, this.initialColor);
  }

  /**
   * Handle changes to size.
   *
   * @param {number} newVal
   * @param {number} oldVal
   * @protected
   */
  onSizeChange(newVal, oldVal) {
    if (this.labelConfig && newVal != null) {
      this.labelConfig['size'] = newVal;
    }
  }
}


/**
 * The default config for the action.
 * @type {!Object}
 */
let defaultConfig = {};


/**
 * Set the default config for the action.
 * @param {!Object} config The config.
 */
const setDefaultConfig = (config) => {
  defaultConfig = config;
};


exports = {
  Controller,
  directive,
  directiveTag,
  setDefaultConfig
};
