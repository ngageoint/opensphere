goog.provide('plugin.im.action.feature.ui.LabelConfigCtrl');
goog.provide('plugin.im.action.feature.ui.labelConfigDirective');

goog.require('goog.async.Delay');
goog.require('os.color');
goog.require('os.data.ColumnDefinition');
goog.require('os.implements');
goog.require('os.layer.ILayer');
goog.require('os.object');
goog.require('os.style');
goog.require('os.style.label');
goog.require('os.ui.Module');
goog.require('os.ui.data.addColumnFormDirective');
goog.require('os.ui.layer.labelControlsDirective');
goog.require('os.ui.popover.popoverDirective');
goog.require('plugin.im.action.feature.LabelAction');
goog.require('plugin.im.action.feature.ui.ActionConfigCtrl');


/**
 * Directive to configure a feature label action.
 * @return {angular.Directive}
 */
plugin.im.action.feature.ui.labelConfigDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/featureaction/featurelabelactionconfig.html',
    controller: plugin.im.action.feature.ui.LabelConfigCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive(plugin.im.action.feature.LabelAction.CONFIG_UI,
    [plugin.im.action.feature.ui.labelConfigDirective]);



/**
 * Controller for setting a feature label.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {plugin.im.action.feature.ui.ActionConfigCtrl<plugin.im.action.feature.LabelAction>}
 * @constructor
 * @ngInject
 */
plugin.im.action.feature.ui.LabelConfigCtrl = function($scope, $element) {
  plugin.im.action.feature.ui.LabelConfigCtrl.base(this, 'constructor', $scope, $element);

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
   * @type {!os.data.ColumnDefinition}
   * @protected
   */
  this.customColumn = new os.data.ColumnDefinition();

  /**
   * Delay to handle updating the custom column.
   * @type {goog.async.Delay}
   * @protected
   */
  this.updateCustomColumnDelay = new goog.async.Delay(this.updateCustomColumn, 100, this);

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
    this.labelConfig = /** @type {!Object} */ (os.object.unsafeClone(this.action.labelConfig));
  } else {
    this.labelConfig = /** @type {!Object} */ (os.object.unsafeClone(
        plugin.im.action.feature.LabelAction.DEFAULT_CONFIG));
  }

  $scope.$on('labelColor.change', this.onColorChange.bind(this));
  $scope.$on('labelColor.reset', this.onColorReset.bind(this));
  $scope.$on('labelSize.spinstop', this.onSizeChange.bind(this));
  $scope.$on(os.ui.layer.LabelControlsEventType.COLUMN_CHANGE, this.validate.bind(this));
  $scope.$watch('config.customName', this.onCustomNameChange.bind(this));

  this.initialize();
};
goog.inherits(plugin.im.action.feature.ui.LabelConfigCtrl, plugin.im.action.feature.ui.ActionConfigCtrl);


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.LabelConfigCtrl.prototype.disposeInternal = function() {
  plugin.im.action.feature.ui.LabelConfigCtrl.base(this, 'disposeInternal');

  goog.dispose(this.updateCustomColumnDelay);
  this.updateCustomColumnDelay = null;
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.LabelConfigCtrl.prototype.initialize = function() {
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

    var color = this.labelConfig['color'] || os.style.DEFAULT_LAYER_COLOR;
    this.scope['color'] = this.initialColor = os.color.toHexString(color);
    this.scope['size'] = this.labelConfig['size'] || os.style.label.DEFAULT_SIZE;

    var layer = os.MapContainer.getInstance().getLayer(this.type);
    if (os.implements(layer, os.layer.ILayer.ID)) {
      this.scope['columns'] = os.ui.layer.getColumns(/** @type {os.layer.ILayer} */ (layer));
    }

    if (!this.scope['columns']) {
      this.scope['columns'] = [];
    }

    if (this.labelConfig['customName'] && this.labelConfig['customValue']) {
      this['addCustomLabel'] = true;
    }
  }

  this.updateCustomColumn();

  plugin.im.action.feature.ui.LabelConfigCtrl.base(this, 'initialize');
};


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.LabelConfigCtrl.prototype.saveAction = function() {
  if (this.action && this.labelConfig) {
    // if not adding a custom label, clear out the values
    if (!this['addCustomLabel']) {
      this.labelConfig['customName'] = '';
      this.labelConfig['customValue'] = '';
    }

    this.action.labelConfig = this.labelConfig;

    // send a message indicating an update occurred
    os.dispatcher.dispatchEvent(os.ui.im.action.EventType.UPDATE);
  }
};


/**
 * Validate the form.
 * @protected
 */
plugin.im.action.feature.ui.LabelConfigCtrl.prototype.validate = function() {
  var columnName = this.customColumn['name'];
  if (this['addCustomLabel'] && columnName) {
    this['showCustomWarning'] = !this.scope['config']['labels'].some(function(obj) {
      return obj['column'] === columnName;
    });
  } else {
    this['showCustomWarning'] = false;
  }
};


/**
 * Handle changes to the custom column name.
 * @param {string=} opt_new The new value.
 * @param {string=} opt_old The old value.
 * @protected
 */
plugin.im.action.feature.ui.LabelConfigCtrl.prototype.onCustomNameChange = function(opt_new, opt_old) {
  if (opt_new != opt_old && this.updateCustomColumnDelay) {
    this.updateCustomColumnDelay.start();
  }
};


/**
 * Update the custom column and add it to the column list if necessary.
 */
plugin.im.action.feature.ui.LabelConfigCtrl.prototype.updateCustomColumn = function() {
  goog.array.remove(this.scope['columns'], this.customColumn);

  var name = (this.labelConfig && this.labelConfig['customName'] || '').trim();
  if (name) {
    // update the custom column if the column name has been set
    this.customColumn['name'] = name;
    this.customColumn['field'] = name;
    this['showCustomWarning'] = false;

    // if a custom label is configured, make it available for selection in the column picker
    if (this['addCustomLabel'] && this.scope && this.scope['columns']) {
      var findFn = os.ui.slick.column.findByField.bind(undefined, 'field', name);
      if (!goog.array.find(this.scope['columns'], findFn)) {
        this.scope['columns'].push(this.customColumn);
        this.scope['columns'].sort(os.ui.slick.column.nameCompare);
      }
    }
  }

  this.validate();
  os.ui.apply(this.scope);
};
goog.exportProperty(
    plugin.im.action.feature.ui.LabelConfigCtrl.prototype,
    'updateCustomColumn',
    plugin.im.action.feature.ui.LabelConfigCtrl.prototype.updateCustomColumn);


/**
 * Handle color change.
 * @param {angular.Scope.Event} event The Angular event.
 * @param {string|undefined} value The new color value.
 * @protected
 */
plugin.im.action.feature.ui.LabelConfigCtrl.prototype.onColorChange = function(event, value) {
  event.stopPropagation();

  if (this.labelConfig) {
    var color = value ? os.style.toRgbaString(value) : os.style.DEFAULT_LAYER_COLOR;
    this.labelConfig['color'] = color;
    this.scope['color'] = os.color.toHexString(color);
  }
};


/**
 * Handle color reset.
 * @param {angular.Scope.Event} event
 * @protected
 */
plugin.im.action.feature.ui.LabelConfigCtrl.prototype.onColorReset = function(event) {
  event.stopPropagation();

  // reset the color to the initial value
  this.onColorChange(event, this.initialColor);
};


/**
 * Handle changes to size.
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
plugin.im.action.feature.ui.LabelConfigCtrl.prototype.onSizeChange = function(event, value) {
  event.stopPropagation();

  if (this.labelConfig && value != null) {
    this.labelConfig['size'] = value;
  }
};
