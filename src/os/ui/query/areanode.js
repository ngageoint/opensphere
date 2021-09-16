goog.module('os.ui.query.AreaNode');

const {listen, unlisten} = goog.require('ol.events');
const {getAreaManager} = goog.require('os.query.instance');
const TriState = goog.require('os.structs.TriState');
const {HOVER_STYLE} = goog.require('os.style.area');
const {tagsFromString} = goog.require('os.tag');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');

const GoogEvent = goog.requireType('goog.events.Event');
const Feature = goog.requireType('ol.Feature');
const ISearchable = goog.requireType('os.data.ISearchable');


/**
 * Tree nodes for areas
 *
 * @implements {ISearchable}
 */
class AreaNode extends SlickTreeNode {
  /**
   * Constructor.
   * @param {Feature=} opt_area
   */
  constructor(opt_area) {
    super();

    /**
     * @type {?Feature}
     * @protected
     */
    this.area = null;

    if (opt_area) {
      this.setArea(opt_area);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.setArea(null);
  }

  /**
   * @return {?Feature} the area
   */
  getArea() {
    return this.area;
  }

  /**
   * Sets the area
   *
   * @param {?Feature} area the area
   */
  setArea(area) {
    if (this.area) {
      unlisten(this.area, 'toggle', this.onAreaToggled, this);
    }

    this.area = area;
    this.updateFromArea();

    if (this.area) {
      listen(this.area, 'toggle', this.onAreaToggled, this);
    }
  }

  /**
   * Update the node from the current area.
   *
   * @protected
   */
  updateFromArea() {
    this.setId(this.getId());
    this.setLabel(this.getLabel());

    if (this.area) {
      this.setToolTip(/** @type {string} */ (this.area.get('description') || ''));
      this.setState(this.area.get('shown') ? TriState.ON : TriState.OFF);
    }
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    if (value !== TriState.BOTH) {
      var old = this.getState();
      super.setState(value);
      var s = this.getState();

      if (old != s && this.area) {
        var show = s !== TriState.OFF;
        var shown = /** @type {boolean} */ (this.area.get('shown'));

        if (show !== shown) {
          this.area.set('shown', show);
          this.area.dispatchEvent('toggle');
        }
      }
    }
  }

  /**
   * @param {GoogEvent} event
   * @protected
   */
  onAreaToggled(event) {
    this.setState(this.area.get('shown') ? TriState.ON : TriState.OFF);
  }

  /**
   * @inheritDoc
   */
  getId() {
    if (this.area) {
      return /** @type {!string} */ (this.area.getId());
    }

    return super.getId();
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    if (this.area) {
      return /** @type {!string} */ (this.area.get('title')) || '';
    }

    return super.getLabel();
  }

  /**
   * @inheritDoc
   */
  getSearchText() {
    var t = '';

    if (this.area) {
      t += this.area.get('title') || '';
      t += ' ' + (this.area.get('description') || '');
      t += ' ' + (this.area.get('tags') || '');
    }

    return t;
  }

  /**
   * @inheritDoc
   */
  getTags() {
    if (this.area) {
      var tags = /** @type {string} */ (this.area.get('tags'));

      if (tags) {
        return tagsFromString(tags);
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  onMouseEnter() {
    var map = getAreaManager().getMap();

    if (map) {
      this.area.setStyle(HOVER_STYLE);
      map.addFeature(this.area);
    }
  }

  /**
   * @inheritDoc
   */
  onMouseLeave() {
    var map = getAreaManager().getMap();

    if (map) {
      map.removeFeature(this.area);
    }
  }

  /**
   * Whether or not the layer is loading
   *
   * @return {boolean}
   * @export
   */
  isLoading() {
    return false;
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    this.setArea(/** @type {AreaNode} */ (other).getArea());
    super.updateFrom(other);
  }
}

exports = AreaNode;
