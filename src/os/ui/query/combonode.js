goog.module('os.ui.query.ComboNode');
goog.module.declareLegacyNamespace();

const DataManager = goog.require('os.data.DataManager');
const {getAreaManager, getFilterManager} = goog.require('os.query.instance');
const TriState = goog.require('os.structs.TriState');
const {toFilterString} = goog.require('os.ui.filter');
const {directiveTag} = goog.require('os.ui.query.ComboNodeUI');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');


/**
 * Tree nodes for layers
 */
class ComboNode extends SlickTreeNode {
  /**
   * Constructor.
   * @param {string=} opt_nodeUI
   */
  constructor(opt_nodeUI) {
    super();

    /**
     * @type {?Object<string, string|boolean>}
     * @private
     */
    this.entry_ = null;
    this.collapsed = false;

    var nodeUI = opt_nodeUI || directiveTag;
    this.nodeUI = '<' + nodeUI + '></' + nodeUI + '>';
  }

  /**
   * @return {Object<string, string|boolean>} entry
   */
  getEntry() {
    return this.entry_;
  }

  /**
   * @param {Object<string, string|boolean>} value
   */
  setEntry(value) {
    this.entry_ = value;

    var toolTip = '';
    if (this.entry_ && this.entry_['filterId']) {
      var filter = getFilterManager().getFilter(/** @type {string} */ (this.entry_['filterId']));
      if (filter) {
        toolTip = toFilterString(filter.getFilterNode(), 1000);
      }
    }

    this.setToolTip(toolTip);
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    var s = null;

    if (this.entry_ && this.entry_['layerId'] && !this.entry_['filterId'] && !this.entry_['areaId']) {
      var layer = DataManager.getInstance().getDescriptor(/** @type {string} */ (this.entry_['layerId']));
      s = layer ? layer.getIcons() : '';
    }

    if (!s) {
      return super.formatIcons();
    }

    return s;
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    this.setEntry(/** @type {ComboNode} */ (other).getEntry());
    super.updateFrom(other);
  }

  /**
   * @inheritDoc
   */
  onMouseEnter() {
    if (this.entry_) {
      var areaId = /** @type {string} */ (this.entry_['areaId']);

      if (areaId && areaId !== '*') {
        getAreaManager().highlight(areaId);
      }
    }
  }

  /**
   * @inheritDoc
   */
  onMouseLeave() {
    if (this.entry_) {
      var areaId = /** @type {string} */ (this.entry_['areaId']);

      if (areaId && areaId !== '*') {
        getAreaManager().unhighlight(areaId);
      }
    }
  }

  /**
   * @return {boolean}
   * @protected
   */
  isNoEntry() {
    var label = this.getLabel();
    var regex = /^No (layers|filters|areas)$/;
    return !!label && regex.test(label);
  }

  /**
   * @inheritDoc
   */
  getState() {
    var val = super.getState();
    return val == TriState.BOTH ? TriState.ON : val;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    var isNoEntry = this.isNoEntry();
    var p = /** @type {ComboNode} */ (this.getParent());

    if (p) {
      var parentEntry = p.getEntry();
      if (this.entry_ && parentEntry && parentEntry['filterGroup'] !== undefined) {
        // propagate the filter group from the parent entry to the entry where it actually matters
        this.entry_['filterGroup'] = parentEntry['filterGroup'];
      }

      if (value !== TriState.OFF && !this.getChildren()) {
        // this node is not off and it has no children, check it and our siblings to see if any are no entries
        var siblings = p.getChildren();
        if (siblings) {
          for (var i = 0, n = siblings.length; i < n; i++) {
            var sibling = /** @type {ComboNode} */ (siblings[i]);
            if (sibling !== this) {
              if (isNoEntry || sibling.isNoEntry()) {
                // if either this or the sibling is a no entry, turn it off
                sibling.setState(TriState.OFF);
              }
            }
          }
        }

        // check if this or any of our cousins are no entries
        var gp = p.getParent();
        if (gp) {
          var parentIsNoEntry = p.isNoEntry();
          var uncles = gp.getChildren();
          for (var i = 0, ii = uncles.length; i < ii; i++) {
            var uncle = /** @type {ComboNode} */ (uncles[i]);
            if (uncle !== p) {
              var cousins = uncle.getChildren();
              if (cousins) {
                for (var j = 0, jj = cousins.length; j < jj; j++) {
                  var cousin = /** @type {ComboNode} */ (cousins[j]);
                  // if the IDs match, the cousin represents the same entry, turn it off if either this is the child
                  // of a no entry or the cousin is the child of a no entry
                  if (cousin.getId() === this.getId() && (parentIsNoEntry || uncle.isNoEntry())) {
                    cousin.setState(TriState.OFF);
                  }
                }
              }
            }
          }
        }
      }
    }

    super.setState(value);
  }
}

exports = ComboNode;
