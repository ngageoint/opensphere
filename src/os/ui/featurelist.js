goog.provide('os.ui.FeatureListCtrl');
goog.provide('os.ui.featureListDirective');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('os.source.PropertyChange');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.menu.list');
goog.require('os.ui.sliderDirective');
goog.require('os.ui.sourceGridDirective');
goog.require('os.ui.window');


/**
 * The `featurelist` directive. Displays vector source features in a grid.
 *
 * @return {angular.Directive}
 */
os.ui.featureListDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'source': '='
    },
    templateUrl: os.ROOT + 'views/windows/featurelist.html',
    controller: os.ui.FeatureListCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('featurelist', [os.ui.featureListDirective]);


/**
 * Controller class for the feature list.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.FeatureListCtrl = function($scope, $element) {
  os.ui.FeatureListCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * The root DOM element.
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * The vector source.
   * @type {os.source.Vector}
   * @private
   */
  this.source_ = /** @type {os.source.Vector} */ ($scope['source']);

  /**
   * The context menu for the source grid.
   * @type {os.ui.menu.Menu}
   */
  this['contextMenu'] = os.ui.menu.list.MENU;

  /**
   * If data should be filtered to selected only.
   * @type {boolean}
   */
  this['selectedOnly'] = false;

  /**
   * The grid row height.
   * @type {number}
   */
  this['rowHeight'] = 0;

  /**
   * The row height control step value.
   * @type {number}
   */
  this['rowStep'] = 1;

  /**
   * The status message to display in the footer.
   * @type {string}
   */
  this['status'] = '';

  /**
   * Identifier for control id's.
   * @type {string}
   */
  this['uid'] = os.ui.sanitizeId('featureList-' + this.source_.getId());

  goog.asserts.assert(this.source_ != null, 'Feature list source must be defined');
  ol.events.listen(this.source_, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
  $scope.$watch('ctrl.rowStep', this.updateRowHeight_.bind(this));

  var map = os.MapContainer.getInstance();
  map.listen(os.events.LayerEventType.REMOVE, this.onLayerRemoved_, false, this);

  this.updateRowHeight_();
  this.updateStatus_();
};
goog.inherits(os.ui.FeatureListCtrl, goog.Disposable);


/**
 * The default row height, excluding padding.
 * @type {number}
 * @const
 */
os.ui.FeatureListCtrl.DEFAULT_ROW_HEIGHT = 21;


/**
 * @inheritDoc
 */
os.ui.FeatureListCtrl.prototype.disposeInternal = function() {
  os.ui.FeatureListCtrl.base(this, 'disposeInternal');

  var map = os.MapContainer.getInstance();
  map.unlisten(os.events.LayerEventType.REMOVE, this.onLayerRemoved_, false, this);

  if (this.source_) {
    ol.events.unlisten(this.source_, goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
    this.source_ = null;
  }

  this.scope_ = null;
  this.element_ = null;
};


/**
 * Closes the window.
 *
 * @export
 */
os.ui.FeatureListCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};


/**
 * Updates the row height based on the step
 *
 * @private
 */
os.ui.FeatureListCtrl.prototype.updateRowHeight_ = function() {
  this['rowHeight'] = (os.ui.FeatureListCtrl.DEFAULT_ROW_HEIGHT * this['rowStep']) + 4;
};


/**
 * Handles layer removed event from the map.
 *
 * @param {os.events.LayerEvent} event The layer event.
 * @private
 */
os.ui.FeatureListCtrl.prototype.onLayerRemoved_ = function(event) {
  if (event.layer && event.layer.getSource() === this.source_) {
    // close the window if the layer is removed
    this.close();
  }
};


/**
 * Handles change events on the source.
 *
 * @param {os.events.PropertyChangeEvent} e The change event.
 * @private
 */
os.ui.FeatureListCtrl.prototype.onSourceChange_ = function(e) {
  var p = e.getProperty();
  if (p === os.source.PropertyChange.FEATURES || p === os.source.PropertyChange.FEATURE_VISIBILITY ||
      goog.object.containsValue(os.events.SelectionType, p)) {
    // refresh status if the features or selection changes
    this.updateStatus_();
    os.ui.apply(this.scope_);
  }
};


/**
 * Updates the status text for the current source.
 *
 * @private
 */
os.ui.FeatureListCtrl.prototype.updateStatus_ = function() {
  var message = '';

  if (this.source_ && !this.source_.isDisposed()) {
    var details = [];

    var selected = this.source_.getSelectedItems();
    if (selected && selected.length > 0) {
      details.push(selected.length + ' selected');
    }

    var model = this.source_.getTimeModel();
    if (model) {
      var total = model.getSize();
      var shown = this.source_.getFilteredFeatures().length;
      if (total > 0) {
        message += shown + ' record' + (shown != 1 ? 's' : '');

        var hidden = total - shown;
        if (hidden > 0) {
          details.push(hidden + ' hidden');
        }
      }
    } else {
      var total = this.source_.getFeatures();
      if (total && total.length > 0) {
        message += total.length + ' record' + (total.length != 1 ? 's' : '');
      }
    }

    if (this['selectedOnly']) {
      details.push('showing selected only');
    }

    if (details.length > 0) {
      message += ' (' + details.join(', ') + ')';
    }
  }

  this['status'] = message;
};


/**
 * Launches a feature list for a source.
 *
 * @param {!os.source.Vector} source The source.
 */
os.ui.launchFeatureList = function(source) {
  // only launch a single window per source
  var windowId = os.ui.sanitizeId('featureList-' + source.getId());
  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
  } else {
    var scopeOptions = {
      'source': source
    };

    var windowOptions = {
      'id': windowId,
      'label': source.getTitle(true),
      'icon': 'fa fa-table',
      'x': 'center',
      'y': 'center',
      'width': 800,
      'min-width': 600,
      'max-width': 2000,
      'height': 600,
      'min-height': 400,
      'max-height': 2000,
      'modal': false,
      'show-close': true
    };

    var template = '<featurelist source="source"></featurelist>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
