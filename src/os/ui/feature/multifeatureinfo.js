goog.module('os.ui.feature.MultiFeatureInfoUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.location.SimpleLocationUI');

const Disposable = goog.require('goog.Disposable');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const {caseInsensitiveContains} = goog.require('goog.string');
const {ROOT} = goog.require('os');
const {toHexString} = goog.require('os.color');
const ColumnDefinition = goog.require('os.data.ColumnDefinition');
const RecordField = goog.require('os.data.RecordField');
const osFeature = goog.require('os.feature');
const instanceOf = goog.require('os.instanceOf');
const LayerClass = goog.require('os.layer.LayerClass');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const {directiveTag: featureInfoUi} = goog.require('os.ui.feature.FeatureInfoUI');
const slickColumn = goog.require('os.ui.slick.column');
const {urlNewTabFormatter} = goog.require('os.ui.slick.formatter');

const Feature = goog.requireType('ol.Feature');
const VectorLayer = goog.requireType('os.layer.Vector');

/**
 * The featureinfo directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'features': '='
  },
  templateUrl: ROOT + 'views/feature/multifeatureinfo.html',
  controller: Controller,
  controllerAs: 'multiCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'multifeatureinfo';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the featureinfo directive
 * @unrestricted
 */
class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super();

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
     * @type {Delay}
     * @private
     */
    this.searchDelay_ = new Delay(this.onSearchDelay_, 250, this);

    /**
     * The search term.
     * @type {?string}
     */
    this['term'] = null;

    var column = new ColumnDefinition('Time', RecordField.TIME);
    var colorColumn = slickColumn.color();
    /**
     * @type {Array<ColumnDefinition>}
     */
    this['columns'] = [colorColumn, column];

    /**
     * Slickgrid options.
     * @type {Object}
     */
    this['options'] = {
      'dataItemColumnValueExtractor': this.getValueFromFeature.bind(this),
      'multiColumnSort': true,
      'multiSelect': false,
      'defaultFormatter': urlNewTabFormatter,
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
      $scope['features'].sort(osFeature.sortByTimeDesc);
      $scope['selected'] = $scope['features'][0];
      $scope['filteredFeatures'] = $scope['features'].slice();
    }

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispose(this.searchDelay_);

    this.element = null;
    this.scope = null;
  }

  /**
   * Getter for the directive on the selected feature.
   *
   * @return {string} The directive.
   */
  getUiInternal() {
    var directive = featureInfoUi;

    if (this.scope['selected']) {
      var layer = osFeature.getLayer(this.scope['selected']);

      if (layer && instanceOf(layer, LayerClass.VECTOR)) {
        return /** @type {VectorLayer} */ (layer).getFeatureDirective() || directive;
      }
    }

    return directive;
  }

  /**
   * Starts the search delay.
   *
   * @export
   */
  search() {
    this.searchDelay_.start();
  }

  /**
   * Searches the selected features.
   */
  onSearchDelay_() {
    var result = [];

    if (this['term']) {
      result = this.scope['features'].filter(function(feature) {
        for (var key in feature.values_) {
          var value = feature.values_[key];
          if (value) {
            try {
              var strVal = String(value);
              if (typeof strVal === 'string' && caseInsensitiveContains(strVal, this['term'])) {
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
    apply(this.scope);
  }

  /**
   * Gets a value from a feature.
   *
   * @param {Feature} feature
   * @param {(ColumnDefinition|string)} col
   * @return {*} The value
   * @protected
   *
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  getValueFromFeature(feature, col) {
    if (col['id'] == slickColumn.COLOR_ID) {
      var color = /** @type {Array<number>|string|undefined} */ (osFeature.getColor(feature, this.source));
      if (color) {
        // disregard opacity - only interested in displaying the color
        color = toHexString(color);
      }

      return color || '#ffffff';
    }

    return feature.values_[col['field'] || col] || 'No time';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
