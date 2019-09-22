goog.provide('os.ui.search.FeatureResultCardCtrl');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.log');
goog.require('ol.extent');
goog.require('os.Fields');
goog.require('os.layer.Vector');
goog.require('os.source.Vector');



/**
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.search.FeatureResultCardCtrl = function($scope, $element) {
  os.ui.search.FeatureResultCardCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * The root DOM element.
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * The logger.
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.search.FeatureResultCardCtrl.LOGGER_;

  /**
   * @type {os.search.AbstractSearchResult<!ol.Feature>}
   * @protected
   */
  this.result = /** @type {os.search.AbstractSearchResult<!ol.Feature>} */ (this.scope['result']);

  /**
   * @type {ol.Feature}
   * @protected
   */
  this.feature = this.result.getResult();

  /**
   * @type {os.layer.Vector}
   * @protected
   */
  this.layer;

  var l = os.MapContainer.getInstance().getLayer(os.ui.search.FeatureResultCardCtrl.SEARCH_LAYER_ID);
  if (l instanceof os.layer.Vector) {
    this.layer = l;
  }

  if (!this.layer) {
    this.layer = this.addSearchLayer();
  }

  this.addFeatureToLayer();

  ol.events.listen(this.layer.getSource(), goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);
  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.search.FeatureResultCardCtrl, goog.Disposable);


/**
 * The ID for the search layer.
 * @type {string}
 * @const
 */
os.ui.search.FeatureResultCardCtrl.SEARCH_LAYER_ID = 'search';


/**
 * Default label style config for the search layer.
 * @type {!Object}
 * @const
 */
os.ui.search.FeatureResultCardCtrl.SEARCH_LAYER_LABELS = {
  'labelColor': 'rgba(255,255,255,1)',
  'labels': [{
    'column': os.Fields.LOWERCASE_NAME,
    'showColumn': false
  }]
};

/**
 * Logger for os.ui.search.FeatureResultCardCtrl
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.search.FeatureResultCardCtrl.LOGGER_ = goog.log.getLogger('os.ui.search.FeatureResultCardCtrl');


/**
 * @inheritDoc
 */
os.ui.search.FeatureResultCardCtrl.prototype.disposeInternal = function() {
  os.ui.search.FeatureResultCardCtrl.base(this, 'disposeInternal');

  var mm = os.MapContainer.getInstance();

  ol.events.unlisten(this.layer.getSource(), goog.events.EventType.PROPERTYCHANGE, this.onSourceChange_, this);

  this.removeFeatureFromLayer();
  this.feature = null;

  var source = this.layer.getSource();
  if (!source.getFeatures().length) {
    this.layer.setRemovable(true);
    mm.removeLayer(this.layer);
  }

  this.element = null;
  this.scope = null;
};


/**
 * Add the feature to the search results layer.
 * @protected
 */
os.ui.search.FeatureResultCardCtrl.prototype.addFeatureToLayer = function() {
  if (this.layer && this.feature) {
    var source = this.layer.getSource();
    var featureId = this.feature.getId();
    if (featureId != null && !source.getFeatureById(featureId)) {
      source.addFeature(this.feature);
    }
  }
};


/**
 * Remove the feature to the search results layer.
 * @protected
 */
os.ui.search.FeatureResultCardCtrl.prototype.removeFeatureFromLayer = function() {
  this.removeFeatureHighlight();

  if (this.layer && this.feature) {
    var source = this.layer.getSource();
    var featureId = this.feature.getId();
    if (featureId != null && source.getFeatureById(featureId)) {
      source.removeFeature(this.feature);
    }
  }
};


/**
 * Add feature highlight styling.
 * @protected
 */
os.ui.search.FeatureResultCardCtrl.prototype.addFeatureHighlight = function() {
  if (this.feature && this.layer) {
    this.feature.set(os.style.StyleType.HIGHLIGHT, os.style.DEFAULT_HIGHLIGHT_CONFIG);
    os.style.setFeatureStyle(this.feature);
    os.style.notifyStyleChange(this.layer, [this.feature]);
  }
};


/**
 * Remove feature highlight styling.
 * @protected
 */
os.ui.search.FeatureResultCardCtrl.prototype.removeFeatureHighlight = function() {
  if (this.feature && this.layer) {
    this.feature.set(os.style.StyleType.HIGHLIGHT, undefined);
    os.style.setFeatureStyle(this.feature);
    os.style.notifyStyleChange(this.layer, [this.feature]);
  }
};


/**
 * Setup the search layer
 *
 * @return {os.layer.Vector}
 * @protected
 */
os.ui.search.FeatureResultCardCtrl.prototype.addSearchLayer = function() {
  var src = new os.source.Vector();
  src.setTitle('Search Results');
  src.setId(os.ui.search.FeatureResultCardCtrl.SEARCH_LAYER_ID);
  src.setSupportsAction(os.action.EventType.BUFFER, false);
  src.setSupportsAction(os.action.EventType.EXPORT, false);
  var searchLayer = new os.layer.Vector({
    source: src
  });

  searchLayer.setTitle('Search Results');
  searchLayer.setId(os.ui.search.FeatureResultCardCtrl.SEARCH_LAYER_ID);
  searchLayer.setStyle(os.style.StyleManager.getInstance().getOrCreateStyle(os.style.DEFAULT_VECTOR_CONFIG));
  searchLayer.setExplicitType('');
  searchLayer.setRemovable(false);
  searchLayer.setNodeUI('');
  searchLayer.setLayerUI('');
  searchLayer.setSticky(true);
  searchLayer.renderLegend = goog.nullFunction;

  var layerConfig = os.style.StyleManager.getInstance().getOrCreateLayerConfig(
      os.ui.search.FeatureResultCardCtrl.SEARCH_LAYER_ID);
  layerConfig[os.style.StyleField.SHOW_LABELS] = true;
  ol.obj.assign(layerConfig, os.ui.search.FeatureResultCardCtrl.SEARCH_LAYER_LABELS);

  var mm = os.MapContainer.getInstance();
  mm.addLayer(searchLayer);

  return searchLayer;
};


/**
 * Handles property changes on the source
 *
 * @param {os.events.PropertyChangeEvent} event
 * @param {os.source.Vector} item
 * @private
 */
os.ui.search.FeatureResultCardCtrl.prototype.onSourceChange_ = function(event, item) {
  if (event instanceof os.events.PropertyChangeEvent) {
    var p = event.getProperty();
    var feature = event.getNewValue();

    // unhighlight case
    if (!feature) {
      feature = event.getOldValue();
    }

    if (feature && feature.length) {
      var hoverWrapper = this.element;
      for (var y = 0; y < feature.length; y++) {
        if (feature[y] === this.feature) {
          if (p === os.events.SelectionType.ADDED) {
            hoverWrapper.addClass('u-card-selected');
          } else if (p === os.events.SelectionType.REMOVED) {
            hoverWrapper.removeClass('u-card-selected');
          } else if (p === os.source.PropertyChange.HIGHLIGHTED_ITEMS) {
            if (!event.getNewValue()) { // unhighlight event
              hoverWrapper.removeClass('u-card-highlight'); // use two classes to enforce proper selection color
            } else {
              hoverWrapper.addClass('u-card-highlight');
            }
          }
        } else if (hoverWrapper.hasClass('u-card-highlight')) { // address case where overlapping features stay highlighted
          hoverWrapper.removeClass('u-card-highlight');
        }
      }
    }
  }
};


/**
 * Get a field from the result.
 *
 * @param {string} field
 * @return {string}
 * @export
 */
os.ui.search.FeatureResultCardCtrl.prototype.getField = function(field) {
  return /** @type {string} */ (this.feature.get(field));
};


/**
 * Fly to the location on the map.
 *
 * @export
 */
os.ui.search.FeatureResultCardCtrl.prototype.goTo = function() {
  this.result.performAction();
};


/**
 * Highlights the feature on mouse over
 *
 * @export
 */
os.ui.search.FeatureResultCardCtrl.prototype.over = function() {
  var source = this.layer.getSource();
  var featureId = this.feature.getId();
  if (featureId != null && source.getFeatureById(featureId)) {
    this.addFeatureHighlight();
  }
};


/**
 * Removes the highlight on mouse out
 *
 * @export
 */
os.ui.search.FeatureResultCardCtrl.prototype.out = function() {
  var source = this.layer.getSource();
  var featureId = this.feature.getId();
  if (featureId != null && source.getFeatureById(featureId)) {
    this.removeFeatureHighlight();
  }
};
