goog.declareModuleId('os.interaction.Hover');

import DataManager from '../data/datamanager.js';
import DataEventType from '../data/event/dataeventtype.js';
import RecordField from '../data/recordfield.js';
import * as osFeature from '../feature/feature.js';
import AnimationOverlay from '../layer/animationoverlay.js';
import AnimationVector from '../layer/animationvector.js';
import LayerId from '../layer/layerid.js';
import {getMapContainer} from '../map/mapinstance.js';
import {getAreaManager, getQueryManager} from '../query/queryinstance.js';
import PropertyChange from '../source/propertychange.js';
import VectorSource from '../source/vectorsource.js';
import * as osStyle from '../style/style.js';
import StyleType from '../style/styletype.js';
import Select from './selectinteraction.js';

const GoogEventType = goog.require('goog.events.EventType');
const Feature = goog.require('ol.Feature');
const ViewHint = goog.require('ol.ViewHint');
const {listen, unlisten} = goog.require('ol.events');
const EventType = goog.require('ol.events.EventType');
const {pointerMove} = goog.require('ol.events.condition');

const OLEvent = goog.requireType('ol.events.Event');
const OLEventTarget = goog.requireType('ol.events.EventTarget');
const Layer = goog.requireType('ol.layer.Layer');
const RenderFeature = goog.requireType('ol.render.Feature');
const OLVectorSource = goog.requireType('ol.source.Vector');
const {default: DataEvent} = goog.requireType('os.data.event.DataEvent');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: ISource} = goog.requireType('os.source.ISource');


/**
 * Handles hover/highlight of vector features
 */
export default class Hover extends Select {
  /**
   * Constructor.
   * @param {olx.interaction.SelectOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super(opt_options);
    this.handleEvent = this.onMouseMove_;

    var options = opt_options !== undefined ? opt_options : {};
    this.condition = options.condition !== undefined ? options.condition : pointerMove;

    /**
     * Overlay for rendering hovered features.
     * @type {AnimationOverlay}
     * @private
     */
    this.featureOverlay_ = new AnimationOverlay();
    this.featureOverlay_.setZIndex(AnimationVector.Z_OFFSET * 2);

    /**
     * Currently highlighted features.
     * @type {Array<!Feature>}
     * @private
     */
    this.highlightedItems_ = null;

    // hook up to the data manager so that we can get highlight events from sources
    var dm = DataManager.getInstance();
    dm.listen(DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
    dm.listen(DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

    /**
     * @type {boolean}
     * @private
     */
    this.inEvent_ = false;

    /**
     * The last hovered feature
     * @type {Feature|undefined}
     * @private
     */
    this.lastFeature_ = undefined;

    /**
     * The pixel for the last mouse move event.
     * @type {Array<number>}
     * @private
     */
    this.lastPixel_ = null;

    /**
     * @type {Element}
     * @private
     */
    this.viewport_ = null;
  }

  /**
   * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} 'false' to stop event propagation.
   * @private
   */
  onMouseMove_(mapBrowserEvent) {
    var map = mapBrowserEvent.map;

    if (!this.condition(mapBrowserEvent)) {
      return true;
    }

    if (map.getView().getHints()[ViewHint.INTERACTING] > 0) {
      if (this.lastFeature_) {
        this.setHighlightFeature_(undefined);
      }

      return true;
    }

    this.inEvent_ = true;

    var feature;
    var source;
    var hitHighlightedFeature = false;

    feature = /** @type {Feature} */ (map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
        /**
         * @param {Feature|RenderFeature} feature Feature.
         * @param {Layer} layer Layer.
         * @return {ol.Feature|RenderFeature|undefined} The feature, or undefined if no feature hit
         */
        function(feature, layer) {
          if (feature instanceof Feature) {
            if (feature.getStyle()) {
              source = osFeature.getSource(feature, layer);

              //
              // no layer means the feature was hit in an overlay - either for highlight or animation. if the feature is
              // currently highlighted, fall through to the next one since highlighted features are z-ordered on top and
              // will be hit first.
              //
              // if the next hit feature is also the highlighted feature (hit once in the highlight overlay, and again in
              // the animation overlay), return it so it stays highlighted.
              //
              if (source && !layer && !hitHighlightedFeature) {
                var highlighted = source.getHighlightedItems();
                if (highlighted && highlighted.length === 1 && highlighted[0] === feature) {
                  hitHighlightedFeature = true;
                  source = null;
                  feature = null;
                }
              }

              return feature;
            }

            return null;
          }
        }, {
          layerFilter: this.layerFilter
        }));

    // if the highlighted feature was hit and `feature` is undefined, it means we skipped the highlight and nothing was
    // behind it.
    if (!hitHighlightedFeature || feature) {
      this.setHighlightFeature_(feature, source);
    }

    // if a feature was detected, save the pixel so the feature can be updated if it moves.
    this.lastPixel_ = feature ? mapBrowserEvent.pixel.slice() : null;

    this.inEvent_ = false;

    return true;
  }

  /**
   * Handle mouseout on the map viewport.
   *
   * @param {MouseEvent} event The event
   * @private
   */
  onMouseOut_(event) {
    this.setHighlightFeature_(undefined);
  }

  /**
   * Handle change events on the hovered feature.
   *
   * @param {OLEvent} event The event
   * @private
   */
  onFeatureChange_(event) {
    if (this.highlightedItems_) {
      if (this.lastPixel_) {
        // highlight is coming from the hover interaction, so determine if the feature is still under the mouse
        var map = this.getMap();
        if (map) {
          var targetFeature = this.highlightedItems_[0];
          var layer = osFeature.getLayer(targetFeature);
          var feature = /** @type {Feature} */ (map.forEachFeatureAtPixel(this.lastPixel_,
              /**
               * @param {Feature|RenderFeature} feature Feature.
               * @param {Layer} layer Layer.
               * @return {Feature|RenderFeature|undefined} The feature, or undefined if no feature hit
               */
              function(feature, layer) {
                return feature === targetFeature ? feature : null;
              }, {
                layerFilter: function(l) {
                  return l === layer;
                }
              }));

          if (feature) {
            this.highlight_(this.highlightedItems_);
          } else {
            this.setHighlightFeature_(undefined);
          }
        }
      } else {
        // highlight is coming from the source, so just update the overlay
        this.highlight_(this.highlightedItems_);
      }
    }
  }

  /**
   * Set the highlighted feature.
   *
   * @param {Feature|undefined} feature The feature
   * @param {OLVectorSource=} opt_source The source
   * @private
   *
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  setHighlightFeature_(feature, opt_source) {
    var source = opt_source || null;
    var mm = getMapContainer();
    var drawLayer = mm.getLayer(LayerId.DRAW);
    var drawSource = drawLayer.getSource();

    if (feature != this.lastFeature_) {
      if (this.lastFeature_) {
        if (getAreaManager().get(this.lastFeature_) ||
            (mm.containsFeature(this.lastFeature_) && this.lastFeature_.get(RecordField.INTERACTIVE))) {
          // handle both areas and interactive features in the drawing layer
          this.lastFeature_.values_[StyleType.HIGHLIGHT] = null;
          osStyle.setFeatureStyle(this.lastFeature_);
          osFeature.update(this.lastFeature_, drawSource);
        } else {
          // otherwise the feature was hopefully on a os vector source, so get the source and clear highlight
          var oldSource = osFeature.getSource(this.lastFeature_);
          if (oldSource) {
            oldSource.handleFeatureHover(null);
          }
        }
      }

      this.lastFeature_ = feature || undefined;

      // default to resetting the cursor style
      var pointerStyle = 'auto';
      if (feature) {
        if (source instanceof VectorSource) {
          // call hover on target source and set the cursor to a pointer
          source.handleFeatureHover(feature);
          pointerStyle = 'pointer';
        } else if (getAreaManager().get(feature)) {
          if (getQueryManager().isExclusion(/** @type {!string} */ (feature.getId()))) {
            // use the inverse style for exclusion areas since they're already red
            feature.values_[StyleType.HIGHLIGHT] = osStyle.INVERSE_SELECT_CONFIG;
          } else {
            // and the default style for all other areas
            feature.values_[StyleType.HIGHLIGHT] = osStyle.DEFAULT_SELECT_CONFIG;
          }

          // update the feature style and set the cursor to a pointer
          osStyle.setFeatureStyle(feature);
          osFeature.update(feature, drawSource);
          pointerStyle = 'pointer';
        } else if (mm.containsFeature(feature) && feature.get(RecordField.INTERACTIVE)) {
          // drawing layer, but also interactive, so hover it
          feature.values_[StyleType.HIGHLIGHT] = osStyle.DEFAULT_SELECT_CONFIG;
          osStyle.setFeatureStyle(feature);
          osFeature.update(feature, drawSource);
          pointerStyle = 'pointer';
        }
      }

      // update the cursor style
      if (this.viewport_) {
        this.viewport_.style['cursor'] = pointerStyle;
      }

      this.highlight_(feature ? [feature] : null);
    }
  }

  /**
   * @inheritDoc
   */
  setMap(map) {
    if (this.viewport_) {
      unlisten(this.viewport_, EventType.MOUSEOUT, this.onMouseOut_, this);
    }

    super.setMap(map);

    this.viewport_ = map ? map.getViewport() : null;
    if (this.viewport_) {
      // clear the highlight feature when the mouse leaves the viewport
      listen(this.viewport_, EventType.MOUSEOUT, this.onMouseOut_, this);
    }

    this.featureOverlay_.setMap(map);
  }

  /**
   * Set features in the highlight overlay.
   *
   * @param {Array<!Feature>} items Features to highlight
   * @private
   */
  highlight_(items) {
    if (this.highlightedItems_ && this.highlightedItems_ !== items) {
      // highlighted items are changing, remove old feature listeners
      this.highlightedItems_.forEach(function(feature) {
        unlisten(feature, EventType.CHANGE, this.onFeatureChange_, this);
      }, this);
    }

    this.featureOverlay_.setFeatures(items);

    if (this.highlightedItems_ !== items) {
      // new items - update them and attach feature listeners
      this.highlightedItems_ = items;

      if (this.highlightedItems_) {
        this.highlightedItems_.forEach(function(feature) {
          listen(feature, EventType.CHANGE, this.onFeatureChange_, this);
        }, this);
      }
    }
  }

  /**
   * Handles source add events
   *
   * @param {DataEvent} e The event
   * @private
   */
  onSourceAdded_(e) {
    listen(/** @type {OLEventTarget} */ (e.source), GoogEventType.PROPERTYCHANGE,
        this.onSourceChange_, this);
  }

  /**
   * Handles source remove events
   *
   * @param {DataEvent} e The event
   * @private
   */
  onSourceRemoved_(e) {
    unlisten(/** @type {OLEventTarget} */ (e.source), GoogEventType.PROPERTYCHANGE,
        this.onSourceChange_, this);
  }

  /**
   * Handles source change events
   *
   * @param {PropertyChangeEvent} e
   * @private
   */
  onSourceChange_(e) {
    if (!this.inEvent_ && e.getProperty) {
      var p = e.getProperty();

      if (p === PropertyChange.HIGHLIGHTED_ITEMS) {
        var source = /** @type {ISource} */ (e.target);
        this.highlight_(source && source.getVisible() ? source.getHighlightedItems() : null);
      }
    }
  }
}
