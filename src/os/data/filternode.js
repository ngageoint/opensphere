goog.provide('os.data.FilterNode');

goog.require('goog.events.EventType');
goog.require('ol.events');
goog.require('os.MapContainer');
goog.require('os.command.FilterEnable');
goog.require('os.command.SequenceCommand');
goog.require('os.data.ISearchable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.feature');
goog.require('os.structs.TriState');
goog.require('os.ui.filter.ui.FilterNode');
goog.require('os.ui.filter.ui.filterNodeUIDirective');
goog.require('os.ui.node.areaNodeUIDirective');
goog.require('os.ui.query.cmd.QueryEntries');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree nodes for areas
 * @extends {os.ui.filter.ui.FilterNode}
 * @implements {os.data.ISearchable}
 * @param {os.filter.FilterEntry=} opt_filter
 * @constructor
 */
os.data.FilterNode = function(opt_filter) {
  os.data.FilterNode.base(this, 'constructor', opt_filter);

  var qm = os.ui.queryManager;
  qm.listen(goog.events.EventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
};
goog.inherits(os.data.FilterNode, os.ui.filter.ui.FilterNode);


/**
 * @inheritDoc
 */
os.data.FilterNode.prototype.disposeInternal = function() {
  var qm = os.ui.queryManager;
  qm.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
  os.data.FilterNode.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
os.data.FilterNode.prototype.setEntry = function(value) {
  if (value !== this.entry) {
    if (this.entry) {
      this.entry.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
    }

    var old = this.entry;
    this.entry = value;

    if (value) {
      this.entry.listen(goog.events.EventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
      this.setId(this.entry.getId());
      this.setLabel(this.entry.getTitle());
      this.setState(this.entry.isEnabled() ? os.structs.TriState.ON : os.structs.TriState.OFF);
      this.setToolTip(os.ui.filter.toFilterString(this.entry.getFilterNode(), 1000));
      this.nodeUI = '<filternodeui></filternodeui>';
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent('filter', value, old));
  }
  if (!goog.isDefAndNotNull(os.MapContainer.getInstance().getLayer(this.entry.getType()))) {
    this.setCheckboxDisabled(true);
  }
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.data.FilterNode.prototype.onQueriesChanged_ = function(event) {
  this.dispatchEvent(new os.events.PropertyChangeEvent('icons'));
};


/**
 * @inheritDoc
 */
os.data.FilterNode.prototype.setState = function(value) {
  if (value !== os.structs.TriState.BOTH) {
    var old = this.getState();
    this.setStateInternal(value);
    var s = this.getState();

    if (old != s && this.entry) {
      var enable = s === os.structs.TriState.ON;
      var enabled = /** @type {boolean} */ (this.entry.isEnabled());

      // we only need to fire a command if the feature differs
      if (enable !== enabled) {
        var cmds = [];
        cmds.push(new os.command.FilterEnable(this.entry, enable));
        if (enable) {
          var entries = os.ui.queryManager.getEntries(this.entry.getType());

          // Wipe out old entries and set wildcards
          var entry = {
            'layerId': this.entry.getType(),
            'areaId': '*',
            'filterId': this.entry.getId(),
            'includeArea': true,
            'filterGroup': true
          };
          entries.push(entry);
          cmds.push(new os.ui.query.cmd.QueryEntries(entries, true, undefined, true));
        }

        if (cmds.length > 0) {
          var cmd = new os.command.SequenceCommand();
          cmd.setCommands(cmds);
          cmd.title = enable ? 'Enable' : 'Disable' + ' Filter';
          os.command.CommandProcessor.getInstance().addCommand(cmd);
        }
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.data.FilterNode.prototype.formatIcons = function() {
  var filter = this.getEntry();
  var found = os.ui.queryManager.hasFilter(/** @type {string} */ (filter.getId()));
  var color = '';
  var status = 'inactive';
  if (found && goog.isDefAndNotNull(os.MapContainer.getInstance().getLayer(filter.getType()))) {
    color = 'green-icon';
    status = 'active';
  }

  return ' <i class="fa fa-fw fa-filter ' + color + '" title="This filter is ' + status + '"></i> ';
};
