goog.declareModuleId('plugin.file.kml.ui.KMLLayerNode');

import {listen, unlistenByKey} from 'ol/src/events.js';
import {extend} from 'ol/src/extent.js';
import LayerNode from '../../../../os/data/layernode.js';
import PropertyChangeEvent from '../../../../os/events/propertychangeevent.js';
import PropertyChange from '../../../../os/source/propertychange.js';
import KMLSource from '../kmlsource.js';

const googEvents = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');


/**
 * Tree node for KML layers
 */
export default class KMLLayerNode extends LayerNode {
  /**
   * Constructor.
   * @param {VectorLayer} layer The KML layer
   */
  constructor(layer) {
    super();

    // Do not bubble the node visibility state up to the layer, where the checkbox controls the enabled state.
    this.setBubbleState(false);

    /**
     * The KML data source
     * @type {KMLSource}
     * @private
     */
    this.source_ = null;

    /**
     * Number of loading children.
     * @type {number}
     * @private
     */
    this.childLoadCount_ = 0;

    /**
     * Root node listen key.
     * @type {goog.events.ListenableKey|undefined}
     * @private
     */
    this.rootListenKey_ = undefined;

    this.sourceListenKey = null;

    this.setLayer(layer);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    var layer = /** @type {KMLLayer} */ (this.getLayer());
    if (layer) {
      layer.collapsed = this.collapsed;
    }

    if (this.rootListenKey_) {
      googEvents.unlistenByKey(this.rootListenKey_);
      this.rootListenKey_ = undefined;
    }

    // update the layer first so it isn't affected by the children changing
    this.setLayer(null);

    // remove child nodes so the KML tree isn't destroyed
    this.setChildren(null);

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  onChildChange(e) {
    super.onChildChange(e);

    var p = e.getProperty();
    if (p == 'loading') {
      if (e.getNewValue()) {
        this.childLoadCount_++;
      } else {
        this.childLoadCount_--;
      }

      this.dispatchEvent(new PropertyChangeEvent('loading'));
    }
  }

  /**
   * @inheritDoc
   * @export
   */
  isLoading() {
    return this.childLoadCount_ > 0 || super.isLoading();
  }

  /**
   * If the KML can be edited.
   *
   * @return {boolean}
   */
  isEditable() {
    var layer = /** @type {KMLLayer} */ (this.getLayer());
    if (layer) {
      return layer.editable != null ? layer.editable : false;
    }

    return false;
  }

  /**
   * Set the KML data source
   *
   * @param {KMLSource} source The source
   * @private
   */
  setSource_(source) {
    if (this.source_) {
      unlistenByKey(this.sourceListenKey);
    }

    this.source_ = source;

    if (source) {
      this.sourceListenKey = listen(source, GoogEventType.PROPERTYCHANGE, this.onSourceChange_, this);
      this.updateFromSource_();
    }
  }

  /**
   * @inheritDoc
   */
  setLayer(value) {
    super.setLayer(value);

    var layer = /** @type {KMLLayer} */ (value);
    if (layer) {
      this.collapsed = layer.collapsed;

      var layerSource = layer.getSource();
      if (layerSource instanceof KMLSource) {
        this.setSource_(layerSource);
      }
    }
  }

  /**
   * Handles changes on the source
   *
   * @param {PropertyChangeEvent} e The event
   * @private
   */
  onSourceChange_(e) {
    if (e instanceof PropertyChangeEvent) {
      var p = e.getProperty();
      if (p === PropertyChange.ENABLED || p === PropertyChange.LOADING) {
        this.updateFromSource_();
      }
    }
  }

  /**
   * Updates the tree from the KML source
   *
   * @private
   */
  updateFromSource_() {
    if (this.source_ && !this.source_.isLoading()) {
      // call getRoot to handle both when the root node is shown/not shown
      var children = this.getChildren();
      var currentRoot = children && children.length > 0 ? children[0].getRoot() : null;

      // only update the children if the root node has changed
      var rootNode = this.source_.getRootNode();
      if (currentRoot !== rootNode) {
        // remove existing listener
        if (this.rootListenKey_) {
          googEvents.unlistenByKey(this.rootListenKey_);
          this.rootListenKey_ = undefined;
        }

        var showRoot = true;
        var layer = /** @type {KMLLayer} */ (this.getLayer());
        try {
          showRoot = layer != null && layer.showRoot && layer.isEnabled();
        } catch (e) {
          // Not a KML layer
        }

        if (rootNode) {
          if (showRoot) {
            // we are showing all of the children of the kml root node
            this.setChildren(rootNode.getChildren());
          } else {
            // we are not showing the children of the kml root node, so we must listen for change events to update the
            // displayed children
            this.updateFromRoot_();
            this.rootListenKey_ = rootNode.listen(GoogEventType.PROPERTYCHANGE, this.onRootChange_, false, this);
          }
        } else {
          this.setChildren(null);
        }
      }
    }
  }

  /**
   * Handle changes to the KML root node when it isn't being displayed in the tree.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onRootChange_(event) {
    var p = event.getProperty();
    if (p == 'children') {
      this.updateFromRoot_();
    }
  }

  /**
   * Updates the tree from the root node.
   *
   * @private
   */
  updateFromRoot_() {
    var rootNode = this.source_ ? this.source_.getRootNode() : null;

    var children = null;
    if (rootNode) {
      if (rootNode.getLabel() == 'kmlroot') {
        // a main kml root node exists, go down one more layer to get to the nodes we care about
        children = rootNode.getChildren()[0].getChildren();
      } else {
        // there was no parsed kml root node...just proceed
        children = rootNode.getChildren();
      }
    }

    // do not reparent the children
    this.setChildren(children, true);
  }

  /**
   * @inheritDoc
   */
  getExtent() {
    var extent = null;

    var children = this.getChildren();
    if (children) {
      for (var i = 0, n = children.length; i < n; i++) {
        var cExtent = /** @type {KMLNode} */ (children[i]).getExtent();

        if (cExtent) {
          if (!extent) {
            extent = cExtent;
          } else {
            extend(extent, cExtent);
          }
        }
      }
    }

    return extent;
  }
}
