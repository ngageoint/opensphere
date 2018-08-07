goog.provide('os.ui.search.FacetNode');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * @constructor
 * @extends {os.ui.slick.SlickTreeNode}
 */
os.ui.search.FacetNode = function() {
  os.ui.search.FacetNode.base(this, 'constructor');

  /**
   * @type {number}
   * @private
   */
  this.count_ = 0;

  /**
   * @type {string}
   * @private
   */
  this.value_ = '';

  this.listen(goog.events.EventType.PROPERTYCHANGE, this.onChange, false, this);
};
goog.inherits(os.ui.search.FacetNode, os.ui.slick.SlickTreeNode);


/**
 * @type {string}
 * @const
 */
os.ui.search.FacetNode.TYPE = 'facet';


/**
 * @param {os.events.PropertyChangeEvent} evt
 * @protected
 */
os.ui.search.FacetNode.prototype.onChange = function(evt) {
  if (evt.getProperty() == 'state') {
    // force a change dispatch on the root
    this.getRoot().dispatchEvent(os.ui.search.FacetNode.TYPE);
  }
};


/**
 * @return {string}
 */
os.ui.search.FacetNode.prototype.getValue = function() {
  return this.value_;
};


/**
 * @param {string} value
 */
os.ui.search.FacetNode.prototype.setValue = function(value) {
  this.value_ = value;
};


/**
 * @return {number}
 */
os.ui.search.FacetNode.prototype.getCount = function() {
  return this.count_;
};


/**
 * @param {number} value
 */
os.ui.search.FacetNode.prototype.setCount = function(value) {
  this.count_ = value;
  this['count'] = value;
};


/**
 * @inheritDoc
 */
os.ui.search.FacetNode.prototype.formatValue = function(value) {
  if (this.parentIndex > -1) {
    value += ' (' + this.getCount() + ')';
  }

  return value;
};


/**
 * @inheritDoc
 */
os.ui.search.FacetNode.prototype.getCheckboxDisabled = function() {
  return !this.getCount();
};


/**
 * @inheritDoc
 */
os.ui.search.FacetNode.prototype.format = function(row, cell, value) {
  if (!goog.isDefAndNotNull(value)) {
    return '';
  }

  var html = this.formatNodeUI();
  html += '<span class="facet';

  if (this.parentIndex === -1) {
    html += ' c-node-toggle';
  }

  html += '" style="left:' + (15 * this.depth + 5) + 'px" ';
  html += 'ng-class="{\'disabled\': item.count === 0}" ng-click="item.toggle($event)">';

  if (this.parentIndex > -1) {
    html += '<i class="fa fa-{{item.state === \'on\' ? \'check-square-o\' : \'square-o\'}}"></i> ';
  }

  html += this.formatValue(os.ui.sanitize(value));
  html += '</span>';

  return html;
};


/**
 * Toggles the state
 * @param {MouseEvent} e the event
 */
os.ui.search.FacetNode.prototype.toggle = function(e) {
  if (this.parentIndex > -1) {
    if (!this.getCheckboxDisabled()) {
      this.setState(
          this.getState() == os.structs.TriState.OFF ? os.structs.TriState.ON : os.structs.TriState.OFF);
    }

    e.stopPropagation();
  }
};
goog.exportProperty(os.ui.search.FacetNode.prototype, 'toggle', os.ui.search.FacetNode.prototype.toggle);
