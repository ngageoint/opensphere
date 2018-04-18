goog.provide('os.ui.data.AddColumnCtrl');
goog.provide('os.ui.data.addColumnDirective');

goog.require('os.data.ColumnDefinition');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.Module');
goog.require('os.ui.data.addColumnFormDirective');


/**
 * The addcolumn directive
 * @return {angular.Directive}
 */
os.ui.data.addColumnDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'source': '='
    },
    templateUrl: os.ROOT + 'views/data/addcolumn.html',
    controller: os.ui.data.AddColumnCtrl,
    controllerAs: 'addcolumn'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('addcolumn', [os.ui.data.addColumnDirective]);



/**
 * Controller function for the addcolumn directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.data.AddColumnCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {os.source.Vector}
   * @private
   */
  this.source_ = $scope['source'];

  /**
   * @type {Array<ol.Feature>}
   * @private
   */
  this.features_ = this.source_.getSelectedItems();

  /**
   * @type {string}
   */
  this['name'] = '';

  /**
   * @type {string}
   */
  this['value'] = '';

  /**
   * Form validators.
   * @type {!Array<!Object>}
   */
  this['validators'] = [];

  if (this.source_) {
    this['validators'].push({
      'id': 'duplicate',
      'model': 'name',
      'handler': os.ui.data.AddColumnFormCtrl.isDuplicate.bind(this, this.source_)
    });
  }

  $timeout(function() {
    $element.find('input[name="name"]').focus();
  });

  $scope.$emit(os.ui.WindowEventType.READY);
  $scope.$on('$destroy', goog.bind(this.destroy_, this));
};


/**
 * Clean up.
 * @private
 */
os.ui.data.AddColumnCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Closes the window.
 */
os.ui.data.AddColumnCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.data.AddColumnCtrl.prototype,
    'cancel',
    os.ui.data.AddColumnCtrl.prototype.cancel);


/**
 * Finishes and adds the column.
 */
os.ui.data.AddColumnCtrl.prototype.finish = function() {
  if (!this.scope_['addColumnForm'].$invalid) {
    var name = /** @type {string} */ (this['name']).toUpperCase();

    if (this.features_.length > 0) {
      for (var i = 0, ii = this.features_.length; i < ii; i++) {
        // set the value on each feature and fire an event to notify that a change occurred
        var feature = this.features_[i];
        var oldVal = feature.get(name);
        feature.set(name, this['value']);
        os.style.setFeatureStyle(feature);
        feature.dispatchFeatureEvent(os.data.FeatureEventType.VALUECHANGE, this['value'], oldVal);
      }

      // add the column to the source
      this.source_.addColumn(name, undefined, true, true);
      var event = new os.events.PropertyChangeEvent(os.source.PropertyChange.DATA);
      this.source_.dispatchEvent(event);

      var layer = os.MapContainer.getInstance().getLayer(this.source_.getId());
      if (layer) {
        os.style.notifyStyleChange(layer, this.features_);
      }
    }

    this.cancel();
  }
};
goog.exportProperty(
    os.ui.data.AddColumnCtrl.prototype,
    'finish',
    os.ui.data.AddColumnCtrl.prototype.finish);


/**
 * Launches the window for the given source.
 * @param {os.source.Vector} source
 */
os.ui.data.AddColumnCtrl.launch = function(source) {
  var options = {
    'id': 'addcolumn',
    'x': 'center',
    'y': 'center',
    'label': 'Add column to ' + source.getTitle(),
    'show-close': true,
    'no-scroll': false,
    'modal': true,
    'width': 500,
    'height': 'auto',
    'icon': 'color-add fa fa-plus'
  };

  var scopeOptions = {
    'source': source
  };

  var template = '<addcolumn source="source"></addcolumn>';
  os.ui.window.create(options, template, undefined, undefined, undefined, scopeOptions);
};
