goog.declareModuleId('os.ui.search.FeatureResultCardCtrl');

import {listen, unlistenByKey} from 'ol/src/events.js';

import EventType from '../../action/eventtype.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import SelectionType from '../../events/selectiontype.js';
import Fields from '../../fields/fields.js';
import {noop} from '../../fn/fn.js';
import VectorLayer from '../../layer/vector.js';
import MapContainer from '../../mapcontainer.js';
import PropertyChange from '../../source/propertychange.js';
import VectorSource from '../../source/vectorsource.js';
import {DEFAULT_HIGHLIGHT_CONFIG, DEFAULT_VECTOR_CONFIG, notifyStyleChange, setFeatureStyle} from '../../style/style.js';

import StyleField from '../../style/stylefield.js';
import StyleManager from '../../style/stylemanager_shim.js';
import StyleType from '../../style/styletype.js';

const Disposable = goog.require('goog.Disposable');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');

const {default: AbstractSearchResult} = goog.requireType('os.search.AbstractSearchResult');
const {StyleConfigLike} = goog.requireType('os.style');


/**
 * @unrestricted
 */
export default class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super();

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
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * The search result.
     * @type {AbstractSearchResult<!Feature>}
     * @protected
     */
    this.result = /** @type {AbstractSearchResult<!Feature>} */ (this.scope['result']);

    /**
     * The feature representing the search result.
     * @type {Feature}
     * @protected
     */
    this.feature = this.result.getResult();

    /**
     * The style config to use when highlighting the search result.
     * @type {!StyleConfigLike}
     * @protected
     */
    this.highlightConfig = DEFAULT_HIGHLIGHT_CONFIG;

    /**
     * The search layer.
     * @type {VectorLayer}
     * @protected
     */
    this.layer;

    var l = MapContainer.getInstance().getLayer(Controller.SEARCH_LAYER_ID);
    if (l instanceof VectorLayer) {
      this.layer = l;
    }

    if (!this.layer) {
      this.layer = this.addSearchLayer();
    }

    this.addFeatureToLayer();

    this.listenKey = listen(this.layer.getSource(), GoogEventType.PROPERTYCHANGE, this.onSourceChange_, this);
    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    var mm = MapContainer.getInstance();

    unlistenByKey(this.listenKey);

    this.removeFeatureFromLayer();
    this.feature = null;

    var source = this.layer.getSource();
    if (!source.getFeatures().length) {
      this.layer.setRemovable(true);
      mm.removeLayer(this.layer);
    }

    this.element = null;
    this.scope = null;
  }

  /**
   * Add the feature to the search results layer.
   * @protected
   */
  addFeatureToLayer() {
    if (this.layer && this.feature) {
      var source = this.layer.getSource();
      var featureId = this.feature.getId();
      if (featureId != null && !source.getFeatureById(featureId)) {
        source.addFeature(this.feature);
      }
    }
  }

  /**
   * Remove the feature to the search results layer.
   * @protected
   */
  removeFeatureFromLayer() {
    this.removeFeatureHighlight();

    if (this.layer && this.feature) {
      var source = this.layer.getSource();
      var featureId = this.feature.getId();
      if (featureId != null && source.getFeatureById(featureId)) {
        source.removeFeature(this.feature);
      }
    }
  }

  /**
   * Add feature highlight styling.
   * @protected
   */
  addFeatureHighlight() {
    if (this.feature && this.layer) {
      const highlightConfig = typeof this.highlightConfig === 'function' ?
          this.highlightConfig(this.feature) : this.highlightConfig;
      this.feature.set(StyleType.HIGHLIGHT, highlightConfig);
      setFeatureStyle(this.feature);
      notifyStyleChange(this.layer, [this.feature]);
    }
  }

  /**
   * Remove feature highlight styling.
   * @protected
   */
  removeFeatureHighlight() {
    if (this.feature && this.layer) {
      this.feature.set(StyleType.HIGHLIGHT, undefined);
      setFeatureStyle(this.feature);
      notifyStyleChange(this.layer, [this.feature]);
    }
  }

  /**
   * Set the card's highlighted state.
   * @param {boolean} value If the card is highlighted.
   * @protected
   */
  setCardHighlighted(value) {
    if (value) {
      this.element.addClass('u-card-highlight');
    } else {
      this.element.removeClass('u-card-highlight');
    }
  }

  /**
   * Set the card's selected state.
   * @param {boolean} value If the card is selected.
   * @protected
   */
  setCardSelected(value) {
    if (value) {
      this.element.addClass('u-card-selected');
    } else {
      this.element.removeClass('u-card-selected');
    }
  }

  /**
   * Setup the search layer
   *
   * @return {VectorLayer}
   * @protected
   */
  addSearchLayer() {
    var src = new VectorSource();
    src.setTitle('Search Results');
    src.setId(Controller.SEARCH_LAYER_ID);
    src.setSupportsAction(EventType.BUFFER, false);
    src.setSupportsAction(EventType.EXPORT, false);
    var searchLayer = new VectorLayer({
      source: src
    });

    searchLayer.setTitle('Search Results');
    searchLayer.setId(Controller.SEARCH_LAYER_ID);
    searchLayer.setStyle(StyleManager.getInstance().getOrCreateStyle(DEFAULT_VECTOR_CONFIG));
    searchLayer.setExplicitType('');
    searchLayer.setRemovable(false);
    searchLayer.setNodeUI('');
    searchLayer.setLayerUI('');
    searchLayer.setSticky(true);
    searchLayer.renderLegend = noop;

    var layerConfig = StyleManager.getInstance().getOrCreateLayerConfig(
        Controller.SEARCH_LAYER_ID);
    layerConfig[StyleField.SHOW_LABELS] = true;
    Object.assign(layerConfig, Controller.SEARCH_LAYER_LABELS);

    var mm = MapContainer.getInstance();
    mm.addLayer(searchLayer);

    return searchLayer;
  }

  /**
   * Handles property changes on the source
   *
   * @param {PropertyChangeEvent} event
   * @param {VectorSource} item
   * @private
   */
  onSourceChange_(event, item) {
    if (event instanceof PropertyChangeEvent) {
      const p = event.getProperty();

      const newValue = event.getNewValue();
      const newContainsFeature = Array.isArray(newValue) && newValue.indexOf(this.feature) > -1;

      if (p === SelectionType.ADDED) {
        // If the feature was added to the selection, select the card.
        if (newContainsFeature) {
          this.setCardSelected(true);
        }
      } else if (p === SelectionType.REMOVED) {
        // If the feature was removed from the selection, deselect the card.
        if (newContainsFeature) {
          this.setCardSelected(false);
        }
      } else if (p === SelectionType.CHANGED) {
        // When the selection changes, select the card if the feature is in the new array, otherwise deselect.
        this.setCardSelected(newContainsFeature);
      } else if (p === PropertyChange.HIGHLIGHTED_ITEMS) {
        // When the highlight changes, highlight the card if the feature is in the new array, otherwise remove highlight.
        this.setCardHighlighted(newContainsFeature);
      }
    }
  }

  /**
   * Get a field from the result.
   *
   * @param {string} field
   * @return {string}
   * @export
   */
  getField(field) {
    return /** @type {string} */ (this.feature.get(field));
  }

  /**
   * Fly to the location on the map.
   *
   * @export
   */
  goTo() {
    this.result.performAction();
  }

  /**
   * Highlights the feature on mouse over
   *
   * @export
   */
  over() {
    var source = this.layer.getSource();
    var featureId = this.feature.getId();
    if (featureId != null && source.getFeatureById(featureId)) {
      this.addFeatureHighlight();
    }
  }

  /**
   * Removes the highlight on mouse out
   *
   * @export
   */
  out() {
    var source = this.layer.getSource();
    var featureId = this.feature.getId();
    if (featureId != null && source.getFeatureById(featureId)) {
      this.removeFeatureHighlight();
    }
  }

  /**
   * If the result has a coordinate.
   * @return {boolean}
   * @export
   */
  hasCoordinate() {
    return !!this.feature && !!this.feature.getGeometry();
  }
}

/**
 * The ID for the search layer.
 * @type {string}
 * @const
 */
Controller.SEARCH_LAYER_ID = 'search';

/**
 * Default label style config for the search layer.
 * @type {!Object}
 * @const
 */
Controller.SEARCH_LAYER_LABELS = {
  'labelColor': 'rgba(255,255,255,1)',
  'labels': [{
    'column': Fields.LOWERCASE_NAME,
    'showColumn': false
  }]
};

/**
 * Logger for os.ui.search.FeatureResultCardCtrl
 * @type {log.Logger}
 */
const logger = log.getLogger('os.ui.search.FeatureResultCardCtrl');
