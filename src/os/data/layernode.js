goog.module('os.data.LayerNode');
goog.module.declareLegacyNamespace();

goog.require('os.ui.triStateCheckboxDirective');

const GoogEventType = goog.require('goog.events.EventType');
const events = goog.require('ol.events');
const {instanceOf, registerClass} = goog.require('os.classRegistry');
const {NodeClass} = goog.require('os.data');
const DataManager = goog.require('os.data.DataManager');
const LayerEventType = goog.require('os.events.LayerEventType');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const ImportActionEventType = goog.require('os.im.action.ImportActionEventType');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const osImplements = goog.require('os.implements');
const ILayerProvider = goog.require('os.layer.ILayerProvider');
const LayerClass = goog.require('os.layer.LayerClass');
const LayerGroup = goog.require('os.layer.LayerGroup');
const LayerPropertyChange = goog.require('os.layer.PropertyChange');
const {getMapContainer} = goog.require('os.map.instance');
const {getQueryManager} = goog.require('os.query.instance');
const PropertyChange = goog.require('os.source.PropertyChange');
const VectorSource = goog.require('os.source.Vector');
const TriState = goog.require('os.structs.TriState');
const ILayerUIProvider = goog.require('os.ui.ILayerUIProvider');
const {directiveTag: layerVisibility} = goog.require('os.ui.layer.LayerVisibilityUI');
const {directiveTag: featureCount} = goog.require('os.ui.node.FeatureCountUI');
const {directiveTag: layerType} = goog.require('os.ui.node.LayerTypeUI');
const {directiveTag: tileLoading} = goog.require('os.ui.node.TileLoadingUI');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');

const IExtent = goog.requireType('os.data.IExtent');
const ISearchable = goog.requireType('os.data.ISearchable');
const VectorLayer = goog.requireType('os.layer.Vector');

/**
 * Tree nodes for layers
 *
 * @implements {ISearchable}
 * @implements {IExtent}
 * @implements {ILayerProvider}
 * @implements {ILayerUIProvider}
 */
class LayerNode extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {os.layer.ILayer}
     * @private
     */
    this.layer_ = null;

    getQueryManager().listen(GoogEventType.PROPERTYCHANGE, this.onNodeChanged_, false, this);
    ImportActionManager
        .getInstance().listen(ImportActionEventType.REFRESH, this.onNodeChanged_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    getQueryManager().unlisten(GoogEventType.PROPERTYCHANGE, this.onNodeChanged_, false, this);
    ImportActionManager
        .getInstance().unlisten(ImportActionEventType.REFRESH, this.onNodeChanged_, false, this);

    this.onMouseLeave();
    this.setLayer(null);
  }

  /**
   * @inheritDoc
   */
  getExtent() {
    var extent = null;
    var layer = this.getLayer();

    if (instanceOf(layer, LayerClass.VECTOR)) {
      extent = /** @type {VectorLayer} */ (layer).getSource().getExtent();
    }

    return extent;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    var children = this.getChildren();
    if (value !== TriState.BOTH || (children && children.length)) {
      var old = this.getState();
      super.setState(value);
      var s = this.getState();

      if (old != s && value !== TriState.BOTH && this.layer_) {
        this.layer_.setEnabled(s !== TriState.OFF);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * @inheritDoc
   */
  formatCheckbox() {
    const checkboxParts = [];

    const layer = this.getLayer();
    if (layer) {
      // add a normal checkbox (layer enable/disable) if the layer is not removable
      const layerOptions = layer.getLayerOptions();
      if (layer.isRemovable() && layerOptions && !layerOptions['hideDisable']) {
        checkboxParts.push('<tristatecheckbox></tristatecheckbox>');
      }

      // add a separate visibility toggle for feature layers
      if (instanceOf(layer, LayerClass.VECTOR)) {
        const padClass = checkboxParts.length ? 'pl-1' : '';
        checkboxParts.push(`<${layerVisibility} class="c-glyph ${padClass}"></${layerVisibility}>`);
      }
    }

    return checkboxParts.join('');
  }

  /**
   * Sets the layer
   *
   * @param {os.layer.ILayer} value
   */
  setLayer(value) {
    if (value !== this.layer_) {
      if (this.layer_) {
        events.unlisten(/** @type {events.EventTarget} */ (this.layer_), GoogEventType.PROPERTYCHANGE,
            this.onPropertyChange, this);
      }

      var old = this.layer_;
      this.layer_ = value;

      if (value) {
        events.listen(/** @type {events.EventTarget} */ (value), GoogEventType.PROPERTYCHANGE,
            this.onPropertyChange, this);
        this.setId(value.getId());
        this.setLabel(value.getTitle());

        var result = undefined;
        if (value instanceof LayerGroup) {
          var layers = /** @type {LayerGroup} */ (value).getLayers();
          for (var i = 0, n = layers.length; i < n; i++) {
            if (result === undefined) {
              result = layers[i].isEnabled();
            } else if (result != layers[i].isEnabled()) {
              this.setState(TriState.BOTH);
              result = undefined;
              break;
            }
          }
        } else {
          result = value.isEnabled();
        }

        if (result !== undefined) {
          this.setState(result ? TriState.ON : TriState.OFF);
        }

        this.nodeUI = value.getNodeUI();
      }

      this.dispatchEvent(new PropertyChangeEvent('layer', value, old));
    }
  }

  /**
   * @inheritDoc
   */
  getId() {
    if (this.layer_) {
      return this.layer_.getId();
    }

    return super.getId();
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    if (this.layer_) {
      return this.layer_.getTitle();
    }

    return this.getId();
  }

  /**
   * @inheritDoc
   */
  getSearchText() {
    var t = '';

    if (this.layer_) {
      t += this.layer_.getTitle();
      t += this.getTags() ? ' ' + this.getTags().join(' ') : '';
      t += ' ' + this.layer_.getOSType();

      // see if there is a descriptor for this guy and add its search text as well
      var dm = DataManager.getInstance();
      var d = dm.getDescriptor(this.layer_.getId());

      if (d) {
        t += ' ' + d.getSearchText();
      }
    }

    return t;
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return this.layer_ ? this.layer_.getTags() : null;
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    var s = null;

    if (this.layer_) {
      s = this.layer_.getIcons();
    }

    if (!s) {
      return super.formatIcons();
    }

    return s;
  }

  /**
   * Whether or not the layer is loading
   *
   * @return {boolean}
   * @export
   */
  isLoading() {
    if (this.layer_) {
      return this.layer_.isLoading();
    }

    return false;
  }

  /**
   * Handles changes on the layer
   *
   * @param {PropertyChangeEvent} e The event
   * @protected
   */
  onPropertyChange(e) {
    if (e instanceof PropertyChangeEvent) {
      var p = e.getProperty();
      switch (p) {
        case LayerPropertyChange.LOADING:
          this.dispatchEvent(new PropertyChangeEvent('loading', e.getOldValue(), e.getNewValue()));
          break;
        case LayerPropertyChange.ENABLED:
          // force the checkbox to update
          this.setState(e.getNewValue() ? TriState.ON : TriState.OFF);
          // update the label (styled differently when disabled/hidden)
          this.dispatchEvent(new PropertyChangeEvent('label'));
          break;
        case LayerPropertyChange.VISIBLE:
          // update the label (styled differently when disabled/hidden)
          this.dispatchEvent(new PropertyChangeEvent('label'));
          break;
        case PropertyChange.HAS_MODIFICATIONS:
        case LayerPropertyChange.TITLE:
          // change the label
          this.setLabel(this.layer_.getTitle());
          this.dispatchEvent(new PropertyChangeEvent('label'));
          break;
        case LayerPropertyChange.GROUP_ID:
          getMapContainer().dispatchEvent(LayerEventType.CHANGE);
          break;
        case LayerPropertyChange.COLOR_MODEL:
        case LayerPropertyChange.ERROR:
        case LayerPropertyChange.ICONS:
        case LayerPropertyChange.LOCK:
        case LayerPropertyChange.STYLE:
        case LayerPropertyChange.TIME_ENABLED:
          // updates icons on the node
          this.dispatchEvent(new PropertyChangeEvent('icons'));
          break;
        default:
          break;
      }
    }
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    this.setLayer(other.getLayer());
    super.updateFrom(other);
  }

  /**
   * @inheritDoc
   */
  formatLabel(value) {
    var labelClass = 'text-truncate flex-fill';
    if (this.layer_ && (!this.layer_.isEnabled() || !this.layer_.getLayerVisible())) {
      // if the layer is disabled/hidden, adjust the style to indicate the change
      labelClass += ' text-muted';
    }

    return `<span class="${labelClass}">${this.formatValue(value)}</span>`;
  }

  /**
   * @inheritDoc
   */
  formatValue(value) {
    var s = super.formatValue(value);
    var layer = this.getLayer();

    if (layer instanceof LayerGroup) {
      s += ' (' + this.getLayer().getProvider() + ')';
    } else {
      s += ` <${layerType}></${layerType}>`;

      if (instanceOf(layer, LayerClass.VECTOR)) {
        s += ` <${featureCount}></${featureCount}>`;

        var source = layer.getSource();
        if (source instanceof VectorSource && source.getHasModifications()) {
          s = `<span title="This layer has unsaved changes. Right click to save them."
              class="font-weight-bolder">  •  </span>${s}`;
        }
      } else if (instanceOf(layer, LayerClass.TILE)) {
        s += ` <${tileLoading}></${tileLoading}>`;
      }
    }

    return s;
  }

  /**
   * @inheritDoc
   */
  getLayerUI(item) {
    if (item && item instanceof LayerNode) {
      var node = /** @type {os.data.LayerNode} */ (item);
      var l = node.getLayer();

      return l.getLayerUI() || 'defaultlayerui';
    }

    return null;
  }

  /**
   * @param {PropertyChangeEvent} event
   * @private
   */
  onNodeChanged_(event) {
    this.dispatchEvent(new PropertyChangeEvent('icons'));
  }
}

osImplements(LayerNode, ILayerProvider.ID);
osImplements(LayerNode, ILayerUIProvider.ID);
registerClass(NodeClass.LAYER, LayerNode);

exports = LayerNode;
