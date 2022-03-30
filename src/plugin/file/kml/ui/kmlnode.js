goog.declareModuleId('plugin.file.kml.ui.KMLNode');

import '../../../../os/ui/node/defaultlayernodeui.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import {extend, createEmpty, isEmpty} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import {fromExtent} from 'ol/src/geom/Polygon.js';
import ImageStatic from 'ol/src/source/ImageStatic.js';
import * as annotation from '../../../../os/annotation/annotation.js';
import FeatureAnnotation from '../../../../os/annotation/featureannotation.js';
import * as osColor from '../../../../os/color.js';
import IExtent from '../../../../os/data/iextent.js';
import ISearchable from '../../../../os/data/isearchable.js';
import LayerNode from '../../../../os/data/layernode.js';
import PropertyChangeEvent from '../../../../os/events/propertychangeevent.js';
import * as osFeature from '../../../../os/feature/feature.js';
import * as fn from '../../../../os/fn/fn.js';
import osImplements from '../../../../os/implements.js';
import TriState from '../../../../os/structs/tristate.js';
import launchMultiFeatureInfo from '../../../../os/ui/feature/launchmultifeatureinfo.js';
import ILayerUIProvider from '../../../../os/ui/ilayeruiprovider.js';
import {launchScreenOverlay} from '../../../../os/ui/screenoverlay.js';
import SlickTreeNode from '../../../../os/ui/slick/slicktreenode.js';
import * as osWindow from '../../../../os/ui/window.js';
import {directiveTag as kmlNodeLayerUi} from '../kmlnodelayerui.js';
import GeometryIcons from './geometryicons.js';
import KMLNodeAction from './kmlnodeaction.js';
import {directiveTag as kmlNodeUi} from './kmlnodeui.js';
import {createOrEditPlace, setCreateFolderNodeFn, setCreatePlacemarkNodeFn, updatePlacemark} from './kmlui.js';

const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');


/**
 * Create a new KML placemark node.
 * @return {!KMLNode} The placemark node.
 */
const createPlacemarkNode = () => {
  const placemark = new KMLNode();
  placemark.canAddChildren = false;
  placemark.editable = true;
  placemark.internalDrag = true;
  placemark.removable = true;
  placemark.layerUI = kmlNodeLayerUi;

  return placemark;
};


/**
 * Create a new KML folder node.
 * @return {!KMLNode} The folder node.
 */
const createFolderNode = () => {
  const folder = new KMLNode();
  folder.collapsed = false;
  folder.canAddChildren = true;
  folder.editable = true;
  folder.internalDrag = true;
  folder.removable = true;

  return folder;
};

// Register functions used to create KML folder/placemark nodes.
setCreateFolderNodeFn(createFolderNode);
setCreatePlacemarkNodeFn(createPlacemarkNode);


/**
 * Base KML tree node
 *
 * @implements {ISearchable}
 * @implements {IExtent}
 * @implements {ILayerUIProvider}
 */
export default class KMLNode extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.checkboxTooltip = 'Show/hide the node';
    this.nodeUI = `<${kmlNodeUi}></${kmlNodeUi}>`;

    // KML nodes should save their collapsed state in the file content if needed because their getId values are not
    // reliable for saving collapsed state.
    this.saveCollapsed = false;

    // default KML nodes to being turned on
    this.setState(TriState.ON);

    /**
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * If children can be added to the node.
     * @type {boolean}
     */
    this.canAddChildren = false;

    /**
     * If the node can be edited by the user.
     * @type {boolean}
     */
    this.editable = false;

    /**
     * If the node can be removed by the user.
     * @type {boolean}
     */
    this.removable = false;

    /**
     * If the node is loading.
     * @type {boolean}
     * @protected
     */
    this.loading = false;

    /**
     * If the node is marked for removal.
     * @type {boolean}
     */
    this.marked = false;

    /**
     * If the node should be shown during animation.
     * @type {boolean}
     * @private
     */
    this.animationState_ = true;

    /**
     * The feature annotation.
     * @type {FeatureAnnotation}
     * @protected
     */
    this.annotation_ = null;

    /**
     * The kml ground image
     * @type {ImageLayer}
     * @private
     */
    this.image_ = null;

    /**
     * The KML screen overlay options.
     * @type {?osx.window.ScreenOverlayOptions}
     * @private
     */
    this.overlayOptions_ = null;

    /**
     * The map feature
     * @type {Feature}
     * @private
     */
    this.feature_ = null;

    /**
     * Flag to track when the mouse is hovering a feature node
     * @type {boolean}
     * @private
     */
    this.highlight_ = false;

    /**
     * The KML source
     * @type {KMLSource}
     * @protected
     */
    this.source = null;

    /**
     * If the source should be updated on state change
     * @type {boolean}
     * @private
     */
    this.updateSource_ = true;

    /**
     * @type {Object<string, !Array<!KMLNode>>}
     * @protected
     */
    this.childLabelMap = {};

    /**
     * @type {?string}
     */
    this.layerUI = null;

    /**
     * @type {?LayerNode}
     */
    this.layerNode = null;

    this.featureListenKey = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.setFeature(null);
    this.setImage(null);
    this.source = null;
  }

  /**
   * @inheritDoc
   */
  canDropInternal(dropItem, moveMode) {
    return dropItem.isFolder() || moveMode == SlickTreeNode.MOVE_MODE.SIBLING;
  }

  /**
   * Get the feature for this node.
   *
   * @return {Feature} The feature
   */
  getFeature() {
    return this.feature_;
  }

  /**
   * Set the feature for this node.
   *
   * @param {Feature} feature The feature
   */
  setFeature(feature) {
    if (this.feature_) {
      unlistenByKey(this.featureListenKey);
      this.clearAnnotations();
    }

    this.feature_ = feature;

    if (this.feature_) {
      this.featureListenKey = listen(this.feature_, GoogEventType.PROPERTYCHANGE, this.onFeatureChange, this);
    }
    this.loadAnnotation();

    this.dispatchEvent(new PropertyChangeEvent('icons'));
    this.dispatchEvent(new PropertyChangeEvent('label'));
  }

  /**
   * Clean up the annotation for the node and all children.
   */
  clearAnnotations() {
    if (this.annotation_) {
      dispose(this.annotation_);
      this.annotation_ = null;
    }

    var children = this.getChildren();
    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        children[i].clearAnnotations();
      }
    }
  }

  /**
   * Set up the annotation for the node.
   */
  loadAnnotation() {
    if (this.feature_ && !this.annotation_) {
      var annotationOptions = /** @type {osx.annotation.Options|undefined} */ (
        this.feature_.get(annotation.OPTIONS_FIELD));
      if (annotationOptions && annotationOptions.show) {
        if (annotationOptions['showBackground'] === undefined) {
          annotationOptions['showBackground'] = annotation.DEFAULT_OPTIONS['showBackground'];
        }
        this.annotation_ = new FeatureAnnotation(this.feature_);

        // set initial visibility based on the tree/animation state
        this.setAnnotationVisibility_(this.isVisible());
      }
    }
  }

  /**
   * Handle property change events fired on a feature.
   *
   * @param {PropertyChangeEvent|ol.Object.Event} event The change event.
   * @protected
   */
  onFeatureChange(event) {
    if (event instanceof PropertyChangeEvent) {
      var p = event.getProperty();
      switch (p) {
        case 'loading':
          this.setLoading(!!event.getNewValue());
          break;
        case annotation.EventType.UPDATE_PLACEMARK:
          // this event needs to update the placemark (tree node) in addition to dispatching the event
          updatePlacemark(/** @type {!PlacemarkOptions} */ ({
            'feature': this.feature_,
            'node': this
          }));

          this.dispatchEvent(new PropertyChangeEvent(annotation.EventType.CHANGE));
          break;
        case GoogEventType.CHANGE:
        case annotation.EventType.CHANGE:
          // this event just needs to resave the tree
          this.dispatchEvent(new PropertyChangeEvent(annotation.EventType.CHANGE));
          break;
        case annotation.EventType.EDIT:
          createOrEditPlace(/** @type {!PlacemarkOptions} */ ({
            'feature': this.feature_,
            'node': this
          }));
          break;
        case annotation.EventType.HIDE:
          this.clearAnnotations();
          this.dispatchEvent(new PropertyChangeEvent('icons'));
          this.dispatchEvent(new PropertyChangeEvent(annotation.EventType.CHANGE));
          break;
        case osFeature.PropertyChange.COLOR:
          // trigger a node icon update
          this.dispatchEvent(new PropertyChangeEvent('icons'));
          // fire a style change event up the tree so the KML can be saved if necessary
          this.dispatchEvent(new PropertyChangeEvent(osFeature.PropertyChange.STYLE));
          break;
        case osFeature.PropertyChange.STYLE:
          // propagate the event up the tree so the KML can be saved if necessary
          this.dispatchEvent(new PropertyChangeEvent(osFeature.PropertyChange.STYLE));
          break;
        default:
          break;
      }
    }
  }

  /**
   * If the node has one or more features beneath it.
   *
   * @param {boolean=} opt_unchecked If unchecked nodes should be included, defaults to false.
   * @return {boolean} If the node has one or more features beneath it.
   */
  hasFeatures(opt_unchecked) {
    if (this.feature_) {
      return true;
    }

    var children = this.getChildren();
    return !!children && children.some(function(child) {
      return (opt_unchecked || child.getState() != TriState.OFF) && child.hasFeatures(opt_unchecked);
    });
  }

  /**
   * Get the feature(s) associated with this node.
   *
   * @param {boolean=} opt_unchecked If unchecked nodes should be included, defaults to false.
   * @return {!Array<!Feature>} The features
   */
  getFeatures(opt_unchecked) {
    if (this.feature_) {
      return [this.feature_];
    }

    var features = [];
    var children = this.getChildren();
    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        var node = children[i];
        if (node.getState() != TriState.OFF || opt_unchecked) {
          // unchecked nodes are hidden from the map so exclude them unless the flag is set.
          var childFeatures = node.getFeatures(opt_unchecked);
          if (childFeatures) {
            features = features.concat(childFeatures);
          }
        }
      }
    }

    return features;
  }

  /**
   * Get the image layer for this node.
   *
   * @return {ImageLayer} The feature
   */
  getImage() {
    return this.image_;
  }

  /**
   * Set the image layer for this node.
   *
   * @param {ImageLayer} image The feature
   */
  setImage(image) {
    goog.dispose(this.layerNode);
    this.layerNode = null;

    this.image_ = image;
    if (this.image_) {
      // Create a LayerNode that will handle the image style changes
      this.layerNode = new LayerNode();
      this.layerNode.setLayer(this.image_);
    }
  }

  /**
   * Get the overlay window ID for this node.
   *
   * @return {?string} The overlay window ID.
   */
  getOverlayId() {
    return this.overlayOptions_ ? this.overlayOptions_.id : null;
  }

  /**
   * Set the overlay window options for this node.
   *
   * @param {osx.window.ScreenOverlayOptions} options The overlay options.
   */
  setOverlayOptions(options) {
    this.overlayOptions_ = options;
  }

  /**
   * Set the timeline animation state of the node.
   *
   * @param {boolean} value If the node should be shown.
   */
  setAnimationState(value) {
    if (this.animationState_ != value) {
      this.animationState_ = value;
      this.updateVisibility();
    }
  }

  /**
   * Set the visibility of the annotation.
   *
   * @param {boolean} shown If the annotation should be shown.
   * @private
   */
  setAnnotationVisibility_(shown) {
    if (this.annotation_) {
      this.annotation_.setVisible(shown);
    }
  }

  /**
   * Set the visibility of the image.
   *
   * @param {boolean} shown If the image should be shown.
   * @private
   */
  setImageVisibility_(shown) {
    if (this.image_) {
      this.image_.setLayerVisible(shown);
    }
  }

  /**
   * Set the visibility of the overlay.
   *
   * @param {boolean} shown If the overlay should be shown.
   * @private
   */
  setOverlayVisibility_(shown) {
    if (this.overlayOptions_) {
      var overlayWin = osWindow.getById(this.overlayOptions_.id);
      if (!overlayWin && shown) {
        // window does not exist and we want to show it. launch a new window.
        launchScreenOverlay(this.overlayOptions_);
      } else if (overlayWin) {
        // window exists, toggle it.
        overlayWin.removeClass(shown ? 'd-none' : 'd-flex');
        overlayWin.addClass(shown ? 'd-flex' : 'd-none');
      }
    }
  }

  /**
   * If this node is currently visible.
   * @return {boolean}
   */
  isVisible() {
    let isVisible = this.getState() === TriState.ON && this.animationState_;

    if (this.source) {
      isVisible = isVisible && this.source.getVisible();
    }

    return isVisible;
  }

  /**
   * Update visibility of any map items managed by the node (annotation, ground overlay, etc).
   * @param {boolean=} opt_recurse If children should be updated as well.
   */
  updateVisibility(opt_recurse = false) {
    const isVisible = this.isVisible();
    this.setAnnotationVisibility_(isVisible);
    this.setImageVisibility_(isVisible);
    this.setOverlayVisibility_(isVisible);

    if (opt_recurse) {
      const children = this.getChildren();
      if (children) {
        children.forEach((c) => {
          c.updateVisibility(true);
        });
      }
    }
  }

  /**
   * Get the images(s) associated with this node.
   *
   * @param {boolean=} opt_unchecked If unchecked nodes should be included, defaults to false
   * @return {!Array<!ImageLayer>} The image layers
   */
  getImages(opt_unchecked) {
    if (this.image_) {
      return [this.image_];
    }

    var images = [];
    var children = this.getChildren();
    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        var node = children[i];
        if (node.getState() != TriState.OFF || opt_unchecked) {
          // unchecked nodes are hidden from the map so exclude them unless the flag is set.
          var childImages = node.getImages(opt_unchecked);
          if (childImages) {
            images = images.concat(childImages);
          }
        }
      }
    }

    return images;
  }

  /**
   * Get the overlay(s) associated with this node.
   *
   * @param {boolean=} opt_unchecked If unchecked nodes should be included, defaults to false
   * @return {!Array<!string>} The overlay window IDs
   */
  getOverlays(opt_unchecked) {
    var overlayId = this.getOverlayId();
    if (overlayId) {
      return [overlayId];
    }

    var overlays = [];
    var children = this.getChildren();
    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        var node = children[i];
        if (node.getState() != TriState.OFF || opt_unchecked) {
          // unchecked nodes are hidden from the map so exclude them unless the flag is set.
          var childOverlays = node.getOverlays(opt_unchecked);
          if (childOverlays) {
            overlays = overlays.concat(childOverlays);
          }
        }
      }
    }

    return overlays;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  getExtent() {
    var extent = null;

    var children = this.getChildren();
    if (children && children.length) {
      for (var i = 0, n = children.length; i < n; i++) {
        if (osImplements(children[i], IExtent.ID)) {
          var child = /** @type {IExtent} */ (children[i]);
          var ex = child.getExtent();
          if (extent && ex) {
            extend(extent, ex);
          } else if (!extent) {
            extent = ex;
          }
        }
      }
    } else if (this.image_) {
      var source = this.image_.getSource();

      if (source instanceof ImageStatic) {
        extent = /** @type {ol.source.ImageStatic} */ (source).image_.getExtent();
      }
    } else {
      var geoms = this.getFeatures().map(fn.mapFeatureToGeometry);
      extent = geoms.reduce(fn.reduceExtentFromGeometries, createEmpty());
    }

    return extent;
  }

  /**
   * @return {Array<!Feature>|undefined}
   */
  getZoomFeatures() {
    var children = this.getChildren();
    if (children && children.length) {
      var features;
      for (var i = 0, n = children.length; i < n; i++) {
        var childFeatures = children[i].getZoomFeatures();
        if (childFeatures) {
          features = features ? features.concat(childFeatures) : childFeatures;
        }
      }

      return features;
    } else if (this.image_) {
      var extent = this.getExtent();
      if (extent && !isEmpty(extent)) {
        return [new Feature(fromExtent(extent))];
      }
    }

    return this.getFeatures();
  }

  /**
   * @inheritDoc
   */
  getId() {
    if (this.feature_) {
      var id = this.feature_.getId();
      if (id) {
        return id.toString();
      }
    }

    return super.getId();
  }

  /**
   * Whether or not the KML node is loading.
   *
   * @return {boolean}
   * @export
   */
  isLoading() {
    return this.loading;
  }

  /**
   * Set if the node is loading.
   *
   * @param {boolean} value The new value
   * @protected
   */
  setLoading(value) {
    if (this.loading != value) {
      this.loading = value;
      this.dispatchEvent(new PropertyChangeEvent('loading', value, !value));
    }
  }

  /**
   * @inheritDoc
   */
  getSearchText() {
    return this.getLabel() || '';
  }

  /**
   * Get the KML source associated with the node.
   *
   * @return {KMLSource}
   */
  getSource() {
    return this.source;
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return null;
  }

  /**
   * The KML merge requires quick access to the node. Also, the KML parser does not produce consistent
   * IDs for the nodes on subsequent runs. Therefore, the label is going to be used for the index. To
   * support multiple items with the same label, the index points to a list of those items.
   */


  /**
   * @inheritDoc
   */
  index(child) {
    var label = child.getLabel() || '';

    if (child instanceof KMLNode) {
      if (!(label in this.childLabelMap)) {
        this.childLabelMap[label] = [];
      }

      this.childLabelMap[label].push(child);
    }
  }

  /**
   * @inheritDoc
   */
  unindex(child) {
    var label = child.getLabel() || '';

    if (label in this.childLabelMap) {
      var list = /** @type {Array<KMLNode>} */ (this.childLabelMap[label]);

      var x = list.indexOf(/** @type {KMLNode} */ (child));
      if (x > -1) {
        list.splice(x, 1);
      }

      if (list.length === 0) {
        delete this.childLabelMap[label];
      }
    }
  }

  /**
   * @inheritDoc
   */
  hasChild(child) {
    var label = child.getLabel() || '';
    if (label in this.childLabelMap) {
      return /** @type {Array<KMLNode>} */ (
        this.childLabelMap[label]).indexOf(/** @type {KMLNode} */ (child)) !== -1;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  addChild(child, opt_skipaddparent, opt_index) {
    if (child instanceof KMLNode) {
      var previous = this.merge(child);

      if (!previous) {
        return super.addChild(child, opt_skipaddparent, opt_index);
      } else {
        // node was merged with an existing one, so clean up the extra node
        dispose(child);
      }

      return previous;
    }

    log.error(this.log, 'Unable to add non-KML node "' + child.getLabel() + '" to the KML tree!');
    return null;
  }

  /**
   * @param {!KMLNode} child
   * @return {?KMLNode}
   */
  merge(child) {
    var children = /** {Array<!KMLNode>|undefined} */ (this.childLabelMap[child.getLabel() || '']);

    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        var prevChild = children[i];

        if (prevChild.marked) {
          prevChild.setFeature(child.getFeature());
          prevChild.marked = false;
          prevChild.setId(child.getId());
          return prevChild;
        }
      }
    }

    return null;
  }

  /**
   * If the node is a KML Folder.
   *
   * @return {boolean}
   */
  isFolder() {
    return (this.feature_ == null && this.image_ == null && this.overlayOptions_ == null);
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    if (this.isFolder()) {
      var open = this.hasChildren() && !this.collapsed;
      return '<i class="fa fa-folder' + (open ? '-open' : '') + ' fa-fw"></i>';
    } else if (this.image_) {
      return '<i class="fa fa-photo fa-fw compact" title="Ground Overlay"></i>';
    } else if (this.overlayOptions_) {
      return '<i class="fa fa-photo fa-fw compact" title="Screen Overlay"></i>';
    } else {
      var icons = [];

      // if the node has a geometry, add the geometry icon
      var geom = this.feature_.getGeometry();
      if (geom) {
        var type = geom.getType();
        if (type in GeometryIcons) {
          var geomIcon = GeometryIcons[type];
          var color = /** @type {string|undefined} */ (osFeature.getColor(this.feature_));
          if (color) {
            // disregard opacity - only interested in displaying the color
            geomIcon = geomIcon.replace('><', ' style="color:' + osColor.toHexString(color) + '"><');
          }

          icons.push(geomIcon);
        }
      }

      // if an annotation is displayed, add an icon for it
      if (this.annotation_) {
        icons.push('<i class="fa fa-comment fa-fw" title="Text box"></i>');
      }

      // add an info icon to launch feature info
      icons.push('<i class="fa fa-info-circle fa-fw c-glyph" title="Feature Info" ' +
          'ng-click="itemAction(\'' + KMLNodeAction.FEATURE_INFO + '\')"></i>');

      return icons.join('');
    }
  }

  /**
   * @inheritDoc
   */
  performAction(type) {
    if (type == KMLNodeAction.FEATURE_INFO) {
      if (this.feature_) {
        var title = this.source ? this.source.getTitle() : undefined;
        launchMultiFeatureInfo(this.feature_, title);
      }
    }
  }

  /**
   * @inheritDoc
   */
  onChildChange(e) {
    var p = e.getProperty();

    // if the source is loading, filter out which events are handled to avoid excessive tree updates
    if (this.source && this.source.isLoading() &&
        p && childLoadingEvents.indexOf(p) == -1) {
      return;
    }

    super.onChildChange(e);

    if (p === 'collapsed' || p === annotation.EventType.CHANGE || p === osFeature.PropertyChange.STYLE) {
      // propagate the event up the tree so the KML can be saved if necessary
      this.dispatchEvent(new PropertyChangeEvent(p));
    } else if (p === 'loading') {
      // propagate loading events up the tree so the layer can show the overall loading state
      this.dispatchEvent(new PropertyChangeEvent(p, e.getNewValue(), e.getOldValue()));
    }
  }

  /**
   * @inheritDoc
   */
  onMouseEnter() {
    if (this.feature_ && this.source) {
      // always set this to ensure features are immediately highlighted when enabled via their own checkbox
      this.highlight_ = true;

      if (!this.source.isHidden(this.feature_)) {
        // only highlight the feature if it isn't hidden
        this.source.setHighlightedItems([this.feature_]);
      }
    }
  }

  /**
   * @inheritDoc
   */
  onMouseLeave() {
    if (this.feature_ && this.source) {
      this.highlight_ = false;
      this.source.setHighlightedItems(null);
    }
  }

  /**
   * Set the KML source for this node.
   *
   * @param {KMLSource} source The source
   */
  setSource(source) {
    this.source = source;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    var old = this.getState();

    super.setState(value);

    this.updateVisibility();

    var s = this.getState();
    if (old != s && this.updateSource_ && this.source) {
      if (s !== TriState.BOTH) {
        this.source.scheduleUpdateFromNodes();

        if (this.highlight_) {
          if (s === TriState.ON) {
            // mouse is on a leaf node, so highlight the feature
            this.source.setHighlightedItems([this.feature_]);
          } else {
            // mouse is on a leaf node, so remove the highlight feature
            this.source.setHighlightedItems(null);
          }
        }
      }
    }
  }

  /**
   * Sets the state without trying to update features on the source. This is used to prevent duplicate source visibility
   * calls when the source caused the state change, or the state is being propagated through the tree.
   *
   * @param {string} value The new state value
   */
  setStateOnly(value) {
    this.updateSource_ = false;
    this.setState(value);
    this.updateSource_ = true;
  }

  /**
   * Override to type nodes appropriately.
   * @return {Array<!KMLNode>}
   * @override
   */
  getChildren() {
    return /** @type {Array<!KMLNode>} */ (super.getChildren());
  }

  /**
   * @inheritDoc
   */
  updateChild(child, state) {
    // avoid changing source visibility when updating children, so the visibility calls aren't massively duplicated. the
    // visibility will be changed at the level toggled by the user, resulting in a single call to the source.
    /** @type {KMLNode} */ (child).setStateOnly(state);
  }

  /**
   * @inheritDoc
   */
  getLayerUI(item) {
    if (item && item instanceof KMLNode) {
      if (item.editable && item.feature_) {
        return item.layerUI || 'defaultlayerui';
      } else if (item.image_) {
        return item.image_.getLayerUI();
      }
    }

    return null;
  }

  /**
   * Collapses all nodes under the target that do not have children.
   *
   * @param {!KMLNode} target The target node to collapse
   */
  static collapseEmpty(target) {
    var children = target.getChildren();
    if (children && children.length > 0) {
      for (var i = 0, n = children.length; i < n; i++) {
        KMLNode.collapseEmpty(/** @type {!KMLNode} */ (children[i]));
      }
    } else {
      target.collapsed = true;
    }
  }
}

osImplements(KMLNode, IExtent.ID);
osImplements(KMLNode, ISearchable.ID);
osImplements(KMLNode, ILayerUIProvider.ID);


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.file.kml.ui.KMLNode');


/**
 * Tree events that should be handled while the source is loading. Handling all events while loading will result in
 * the Layers window hanging.
 * @type {!Array<string>}
 */
const childLoadingEvents = ['children', 'state', 'collapsed'];
