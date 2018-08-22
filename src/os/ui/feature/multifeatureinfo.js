goog.provide('os.ui.feature.MultiFeatureInfoCtrl');
goog.provide('os.ui.feature.multiFeatureInfoDirective');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.RecordField');
goog.require('os.ui.Module');
goog.require('os.ui.location.SimpleLocationDirective');
goog.require('os.ui.slick.column');
goog.require('os.ui.window');


/**
 * The featureinfo directive
 * @return {angular.Directive}
 */
os.ui.feature.multiFeatureInfoDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'features': '='
    },
    templateUrl: os.ROOT + 'views/feature/multifeatureinfo.html',
    controller: os.ui.feature.MultiFeatureInfoCtrl,
    controllerAs: 'multiCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('multifeatureinfo', [os.ui.feature.multiFeatureInfoDirective]);



/**
 * Controller function for the featureinfo directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.feature.MultiFeatureInfoCtrl = function($scope, $element) {
  os.ui.feature.MultiFeatureInfoCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   */
  this.element = $element;

  /**
   * Delay for debouncing searches.
   * @type {goog.async.Delay}
   * @private
   */
  this.searchDelay_ = new goog.async.Delay(this.onSearchDelay_, 250, this);

  /**
   * The search term.
   * @type {?string}
   */
  this['term'] = null;

  var column = new os.data.ColumnDefinition('Time', os.data.RecordField.TIME);
  var colorColumn = os.ui.slick.column.color();
  /**
   * @type {Array.<os.data.ColumnDefinition>}
   */
  this['columns'] = [colorColumn, column];

  /**
   * Slickgrid options.
   * @type {Object}
   */
  this['options'] = {
    'dataItemColumnValueExtractor': this.getValueFromFeature_.bind(this),
    'multiColumnSort': true,
    'multiSelect': false,
    'defaultFormatter': os.ui.slick.formatter.urlNewTabFormatter,
    'enableAsyncPostRender': true,
    'forceFitColumns': true
  };

  /**
   * Getter for the directive on the selected feature.
   * @return {string} The directive.
   */
  this['getUi'] = this.getUiInternal.bind(this);

  $scope['selected'] = null;
  if ($scope['features']) {
    $scope['features'].sort(os.feature.sortByTimeDesc);
    $scope['selected'] = $scope['features'][0];
    $scope['filteredFeatures'] = $scope['features'].slice();
  }

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.feature.MultiFeatureInfoCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.feature.MultiFeatureInfoCtrl.prototype.disposeInternal = function() {
  os.ui.feature.MultiFeatureInfoCtrl.base(this, 'disposeInternal');

  goog.dispose(this.searchDelay_);

  this.element = null;
  this.scope = null;
};


/**
 * Getter for the directive on the selected feature.
 * @return {string} The directive.
 */
os.ui.feature.MultiFeatureInfoCtrl.prototype.getUiInternal = function() {
  var directive = 'featureinfo';

  if (this.scope['selected']) {
    var layer = os.feature.getLayer(this.scope['selected']);

    if (layer && layer instanceof os.layer.Vector) {
      return layer.getFeatureDirective() || directive;
    }
  }

  return directive;
};


/**
 * Starts the search delay.
 * @export
 */
os.ui.feature.MultiFeatureInfoCtrl.prototype.search = function() {
  this.searchDelay_.start();
};


/**
 * Searches the selected features.
 */
os.ui.feature.MultiFeatureInfoCtrl.prototype.onSearchDelay_ = function() {
  var result = [];

  if (this['term']) {
    result = this.scope['features'].filter(function(feature) {
      for (var key in feature.values_) {
        var value = feature.values_[key];
        if (value) {
          try {
            var strVal = String(value);
            if (goog.isString(strVal) && goog.string.caseInsensitiveContains(strVal, this['term'])) {
              return true;
            }
          } catch (e) {
            // not a string so skipperino
          }
        }
      }
    }, this);
  } else {
    result = this.scope['features'].slice();
  }

  this.scope['filteredFeatures'] = result;
  os.ui.apply(this.scope);
};


/**
 * Gets a value from a feature.
 * @param {ol.Feature} feature
 * @param {(os.data.ColumnDefinition|string)} col
 * @return {*} The value
 * @private
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.ui.feature.MultiFeatureInfoCtrl.prototype.getValueFromFeature_ = function(feature, col) {
  if (col['id'] == os.ui.slick.column.COLOR_ID) {
    var color = /** @type {Array<number>|string|undefined} */ (os.feature.getColor(feature, this.source));
    if (color) {
      // disregard opacity - only interested in displaying the color
      color = os.color.toHexString(color);
    }

    return color || '#ffffff';
  }

  return feature.values_[col['field'] || col] || 'No time';
};


/**
 * Launches a feature info window for the provided feature(s).
 * @param {Array<ol.Feature>|ol.Feature} features The feature or array of features to show.
 * @param {string=} opt_titleDetail Title of the containing layer
 */
os.ui.feature.launchMultiFeatureInfo = function(features, opt_titleDetail) {
  features = goog.isArray(features) ? features : [features];
  var winLabel = opt_titleDetail || 'Feature Info';
  var windowId = 'featureInfo';

  // create a new window
  var scopeOptions = {
    'features': features
  };

  // don't constrain the max width/height since content varies widely per feature
  var windowOptions = {
    'id': windowId,
    'label': winLabel,
    'icon': 'fa fa-map-marker',
    'key': 'featureinfo',
    'x': 'center',
    'y': 'center',
    'width': 600,
    'min-width': 500,
    'max-width': 0,
    'height': 350,
    'min-height': 200,
    'max-height': 0,
    'show-close': true
  };

  var template = '<multifeatureinfo features="features"></multifeatureinfo>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};
