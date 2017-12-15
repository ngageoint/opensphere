goog.provide('os.ui.query.ComboNode');
goog.require('os.ui.filter');
goog.require('os.ui.query.ui.comboNodeUIDirective');
goog.require('os.ui.slick.SlickTreeNode');


/**
 * Tree nodes for layers
 * @param {string=} opt_nodeUI
 * @extends {os.ui.slick.SlickTreeNode}
 * @constructor
 */
os.ui.query.ComboNode = function(opt_nodeUI) {
  os.ui.query.ComboNode.base(this, 'constructor');

  /**
   * @type {?Object<string, string|boolean>}
   * @private
   */
  this.entry_ = null;
  this.collapsed = false;

  var nodeUI = opt_nodeUI || 'combonodeui';
  this.nodeUI = '<' + nodeUI + '></' + nodeUI + '>';
};
goog.inherits(os.ui.query.ComboNode, os.ui.slick.SlickTreeNode);


/**
 * @return {Object<string, string|boolean>} entry
 */
os.ui.query.ComboNode.prototype.getEntry = function() {
  return this.entry_;
};


/**
 * @param {Object<string, string|boolean>} value
 */
os.ui.query.ComboNode.prototype.setEntry = function(value) {
  this.entry_ = value;

  var toolTip = '';
  if (this.entry_ && this.entry_['filterId']) {
    var filter = os.ui.filterManager.getFilter(/** @type {string} */ (this.entry_['filterId']));
    if (filter) {
      toolTip = os.ui.filter.toFilterString(filter.getFilterNode(), 1000);
    }
  }

  this.setToolTip(toolTip);
};


/**
 * @inheritDoc
 */
os.ui.query.ComboNode.prototype.formatIcons = function() {
  var s = null;

  if (this.entry_ && this.entry_['layerId'] && !this.entry_['filterId'] && !this.entry_['areaId']) {
    var layer = os.dataManager.getDescriptor(/** @type {string} */ (this.entry_['layerId']));
    s = layer ? layer.getIcons() : '';
  }

  if (!s) {
    return os.ui.query.ComboNode.superClass_.formatIcons.call(this);
  }

  return s;
};


/**
 * @inheritDoc
 */
os.ui.query.ComboNode.prototype.updateFrom = function(other) {
  this.setEntry(other.getEntry());
  os.ui.query.ComboNode.base(this, 'updateFrom', other);
};


/**
 * @inheritDoc
 */
os.ui.query.ComboNode.prototype.onMouseEnter = function() {
  if (this.entry_) {
    var areaId = /** @type {string} */ (this.entry_['areaId']);

    if (areaId && areaId !== '*') {
      os.ui.areaManager.highlight(areaId);
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.query.ComboNode.prototype.onMouseLeave = function() {
  if (this.entry_) {
    var areaId = /** @type {string} */ (this.entry_['areaId']);

    if (areaId && areaId !== '*') {
      os.ui.areaManager.unhighlight(areaId);
    }
  }
};


/**
 * @return {boolean}
 * @protected
 */
os.ui.query.ComboNode.prototype.isNoEntry = function() {
  var label = this.getLabel();
  var regex = /^No (layers|filters|areas)$/;
  return !!label && regex.test(label);
};


/**
 * @inheritDoc
 */
os.ui.query.ComboNode.prototype.getState = function() {
  var val = os.ui.query.ComboNode.base(this, 'getState');
  return val == os.structs.TriState.BOTH ? os.structs.TriState.ON : val;
};


/**
 * @inheritDoc
 */
os.ui.query.ComboNode.prototype.setState = function(value) {
  var isNoEntry = this.isNoEntry();
  var p = /** @type {os.ui.query.ComboNode} */ (this.getParent());

  if (p) {
    var parentEntry = p.getEntry();
    if (this.entry_ && parentEntry && goog.isDef(parentEntry['filterGroup'])) {
      // propagate the filter group from the parent entry to the entry where it actually matters
      this.entry_['filterGroup'] = parentEntry['filterGroup'];
    }

    if (value !== os.structs.TriState.OFF && !this.getChildren()) {
      // this node is not off and it has no children, check it and our siblings to see if any are no entries
      var siblings = p.getChildren();
      if (siblings) {
        for (var i = 0, n = siblings.length; i < n; i++) {
          var sibling = /** @type {os.ui.query.ComboNode} */ (siblings[i]);
          if (sibling !== this) {
            if (isNoEntry || sibling.isNoEntry()) {
              // if either this or the sibling is a no entry, turn it off
              sibling.setState(os.structs.TriState.OFF);
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
          var uncle = /** @type {os.ui.query.ComboNode} */ (uncles[i]);
          if (uncle !== p) {
            var cousins = uncle.getChildren();
            if (cousins) {
              for (var j = 0, jj = cousins.length; j < jj; j++) {
                var cousin = /** @type {os.ui.query.ComboNode} */ (cousins[j]);
                // if the IDs match, the cousin represents the same entry, turn it off if either this is the child
                // of a no entry or the cousin is the child of a no entry
                if (cousin.getId() === this.getId() && (parentIsNoEntry || uncle.isNoEntry())) {
                  cousin.setState(os.structs.TriState.OFF);
                }
              }
            }
          }
        }
      }
    }
  }

  os.ui.query.ComboNode.base(this, 'setState', value);
};
