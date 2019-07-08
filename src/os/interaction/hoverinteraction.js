goog.provide('os.interaction.Hover');

goog.require('ol.Feature');
goog.require('ol.ViewHint');
goog.require('ol.events.condition');
goog.require('os.data.DataManager');
goog.require('os.data.RecordField');
goog.require('os.data.event.DataEvent');
goog.require('os.data.event.DataEventType');
goog.require('os.feature');
goog.require('os.interaction.Select');
goog.require('os.layer.AnimationOverlay');
goog.require('os.layer.Vector');
goog.require('os.source.Vector');
goog.require('os.style');



/**
 * Handles hover/highlight of vector features
 *
 * @constructor
 * @extends {os.interaction.Select}
 * @param {olx.interaction.SelectOptions=} opt_options Options.
 */
os.interaction.Hover = function(opt_options) {
  os.interaction.Hover.base(this, 'constructor', opt_options);
  this.handleEvent = this.onMouseMove_;

  var options = opt_options !== undefined ? opt_options : {};
  this.condition = options.condition !== undefined ? options.condition : ol.events.condition.pointerMove;

  /**
   * Overlay for rendering hovered features.
   * @type {os.layer.AnimationOverlay}
   * @private
   */
  this.featureOverlay_ = new os.layer.AnimationOverlay();
  this.featureOverlay_.setZIndex(os.layer.AnimationVector.Z_OFFSET * 2);

  /**
   * Currently highlighted features.
   * @type {Array<!ol.Feature>}
   * @private
   */
  this.highlightedItems_ = null;

  // hook up to the data manager so that we can get highlight events from sources
  var dm = os.dataManager;
  dm.listen(os.data.event.DataEventType.SOURCE_ADDED, this.onSourceAdded_, false, this);
  dm.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onSourceRemoved_, false, this);

  /**
   * @type {boolean}
   * @private
   */
  this.inEvent_ = false;

  /**
   * The last hovered feature
   * @type {ol.Feature|undefined}
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
};
goog.inherits(os.interaction.Hover, os.interaction.Select);


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} 'false' to stop event propagation.
 * @private
 */
os.interaction.Hover.prototype.onMouseMove_ = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;

  if (!this.condition(mapBrowserEvent)) {
    return true;
  }

  if (map.getView().getHints()[ol.ViewHint.INTERACTING] > 0) {
    if (this.lastFeature_) {
      this.setHighlightFeature_(undefined);
    }

    return true;
  }

  this.inEvent_ = true;

  var feature;
  var source;
  var hitHighlightedFeature = false;

  feature = /** @type {ol.Feature} */ (map.forEachFeatureAtPixel(mapBrowserEvent.pixel,
      /**
       * @param {ol.Feature|ol.render.Feature} feature Feature.
       * @param {ol.layer.Layer} layer Layer.
       * @return {ol.Feature|ol.render.Feature|undefined} The feature, or undefined if no feature hit
       */
      function(feature, layer) {
        if (feature instanceof ol.Feature) {
          if (feature.getStyle()) {
            source = os.feature.getSource(feature, layer);

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

        return feature;
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
};


/**
 * Handle mouseout on the map viewport.
 *
 * @param {MouseEvent} event The event
 * @private
 */
os.interaction.Hover.prototype.onMouseOut_ = function(event) {
  this.setHighlightFeature_(undefined);
};


/**
 * Handle change events on the hovered feature.
 *
 * @param {ol.events.Event} event The event
 * @private
 */
os.interaction.Hover.prototype.onFeatureChange_ = function(event) {
  if (this.highlightedItems_) {
    if (this.lastPixel_) {
      // highlight is coming from the hover interaction, so determine if the feature is still under the mouse
      var map = this.getMap();
      if (map) {
        var targetFeature = this.highlightedItems_[0];
        var layer = os.feature.getLayer(targetFeature);
        var feature = /** @type {ol.Feature} */ (map.forEachFeatureAtPixel(this.lastPixel_,
            /**
             * @param {ol.Feature|ol.render.Feature} feature Feature.
             * @param {ol.layer.Layer} layer Layer.
             * @return {ol.Feature|ol.render.Feature|undefined} The feature, or undefined if no feature hit
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
};


/**
 * Set the highlighted feature.
 *
 * @param {ol.Feature|undefined} feature The feature
 * @param {ol.source.Vector=} opt_source The source
 * @private
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.interaction.Hover.prototype.setHighlightFeature_ = function(feature, opt_source) {
  var source = opt_source || null;
  var mm = os.MapContainer.getInstance();
  var drawLayer = mm.getLayer(os.MapContainer.DRAW_ID);
  var drawSource = drawLayer.getSource();

  if (feature != this.lastFeature_) {
    if (this.lastFeature_) {
      if (os.ui.areaManager.get(this.lastFeature_) ||
          (mm.containsFeature(this.lastFeature_) && this.lastFeature_.get(os.data.RecordField.INTERACTIVE))) {
        // handle both areas and interactive features in the drawing layer
        this.lastFeature_.values_[os.style.StyleType.HIGHLIGHT] = null;
        os.style.setFeatureStyle(this.lastFeature_);
        os.feature.update(this.lastFeature_, drawSource);
      } else {
        // otherwise the feature was hopefully on a os vector source, so get the source and clear highlight
        var oldSource = os.feature.getSource(this.lastFeature_);
        if (oldSource) {
          oldSource.handleFeatureHover(null);
        }
      }
    }

    this.lastFeature_ = feature || undefined;

    // default to resetting the cursor style
    var pointerStyle = 'auto';
    if (feature) {
      if (source instanceof os.source.Vector) {
        // call hover on target source and set the cursor to a pointer
        source.handleFeatureHover(feature);
        pointerStyle = 'pointer';
      } else if (os.ui.areaManager.get(feature)) {
        if (os.ui.queryManager.isExclusion(/** @type {!string} */ (feature.getId()))) {
          // use the inverse style for exclusion areas since they're already red
          feature.values_[os.style.StyleType.HIGHLIGHT] = os.style.INVERSE_SELECT_CONFIG;
        } else {
          // and the default style for all other areas
          feature.values_[os.style.StyleType.HIGHLIGHT] = os.style.DEFAULT_SELECT_CONFIG;
        }

        // update the feature style and set the cursor to a pointer
        os.style.setFeatureStyle(feature);
        os.feature.update(feature, drawSource);
        pointerStyle = 'pointer';
      } else if (mm.containsFeature(feature) && feature.get(os.data.RecordField.INTERACTIVE)) {
        // drawing layer, but also interactive, so hover it
        feature.values_[os.style.StyleType.HIGHLIGHT] = os.style.DEFAULT_SELECT_CONFIG;
        os.style.setFeatureStyle(feature);
        os.feature.update(feature, drawSource);
        pointerStyle = 'pointer';
      }
    }

    // update the cursor style
    if (this.viewport_) {
      this.viewport_.style['cursor'] = pointerStyle;
    }

    this.highlight_(feature ? [feature] : null);
  }
};


/**
 * @inheritDoc
 */
os.interaction.Hover.prototype.setMap = function(map) {
  if (this.viewport_) {
    ol.events.unlisten(this.viewport_, ol.events.EventType.MOUSEOUT, this.onMouseOut_, this);
  }

  os.interaction.Hover.base(this, 'setMap', map);

  this.viewport_ = map ? map.getViewport() : null;
  if (this.viewport_) {
    // clear the highlight feature when the mouse leaves the viewport
    ol.events.listen(this.viewport_, ol.events.EventType.MOUSEOUT, this.onMouseOut_, this);
  }

  this.featureOverlay_.setMap(map);
};


/**
 * Set features in the highlight overlay.
 *
 * @param {Array<!ol.Feature>} items Features to highlight
 * @private
 */
os.interaction.Hover.prototype.highlight_ = function(items) {
  if (this.highlightedItems_ && this.highlightedItems_ !== items) {
    // highlighted items are changing, remove old feature listeners
    this.highlightedItems_.forEach(function(feature) {
      ol.events.unlisten(feature, ol.events.EventType.CHANGE, this.onFeatureChange_, this);
    }, this);
  }

  this.featureOverlay_.setFeatures(items);

  if (this.highlightedItems_ !== items) {
    // new items - update them and attach feature listeners
    this.highlightedItems_ = items;

    if (this.highlightedItems_) {
      this.highlightedItems_.forEach(function(feature) {
        ol.events.listen(feature, ol.events.EventType.CHANGE, this.onFeatureChange_, this);
      }, this);
    }
  }
};


/**
 * Handles source add events
 *
 * @param {os.data.event.DataEvent} e The event
 * @private
 */
os.interaction.Hover.prototype.onSourceAdded_ = function(e) {
  ol.events.listen(/** @type {ol.events.EventTarget} */ (e.source), goog.events.EventType.PROPERTYCHANGE,
      this.onSourceChange_, this);
};


/**
 * Handles source remove events
 *
 * @param {os.data.event.DataEvent} e The event
 * @private
 */
os.interaction.Hover.prototype.onSourceRemoved_ = function(e) {
  ol.events.unlisten(/** @type {ol.events.EventTarget} */ (e.source), goog.events.EventType.PROPERTYCHANGE,
      this.onSourceChange_, this);
};


/**
 * Handles source change events
 *
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.interaction.Hover.prototype.onSourceChange_ = function(e) {
  if (!this.inEvent_ && e.getProperty) {
    var p = e.getProperty();

    if (p === os.source.PropertyChange.HIGHLIGHTED_ITEMS) {
      var source = /** @type {os.source.ISource} */ (e.target);
      this.highlight_(source.getHighlightedItems());
    }
  }
};
