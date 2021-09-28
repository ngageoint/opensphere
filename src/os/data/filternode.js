goog.declareModuleId('os.data.FilterNode');

import CommandProcessor from '../command/commandprocessor.js';
import FilterEnable from '../command/filterenablecmd.js';
import SequenceCommand from '../command/sequencecommand.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {getMapContainer} from '../map/mapinstance.js';
import {getQueryManager} from '../query/queryinstance.js';
import {isStateFile} from '../state/state.js';
import TriState from '../structs/tristate.js';
import {toFilterString} from '../ui/filter/filter.js';
import UIFilterNode from '../ui/filter/ui/filternode.js';
import {directiveTag} from '../ui/filter/ui/filternodeui.js';
import QueryEntries from '../ui/query/cmd/queryentriescmd.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: ISearchable} = goog.requireType('os.data.ISearchable');


/**
 * Tree nodes for areas
 *
 * @implements {ISearchable}
 */
export default class FilterNode extends UIFilterNode {
  /**
   * Constructor.
   * @param {os.filter.FilterEntry=} opt_filter
   */
  constructor(opt_filter) {
    super(opt_filter);

    var qm = getQueryManager();
    qm.listen(GoogEventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    var qm = getQueryManager();
    qm.unlisten(GoogEventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  setEntry(value) {
    if (value !== this.entry) {
      if (this.entry) {
        this.entry.unlisten(GoogEventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
      }

      var old = this.entry;
      this.entry = value;

      if (value) {
        this.entry.listen(GoogEventType.PROPERTYCHANGE, this.onPropertyChange, false, this);
        this.setId(this.entry.getId());
        this.setLabel(this.entry.getTitle());
        this.setState(this.entry.isEnabled() ? TriState.ON : TriState.OFF);
        this.setToolTip(toFilterString(this.entry.getFilterNode(), 1000));
        this.nodeUI = `<${directiveTag}></${directiveTag}>`;
      }

      this.dispatchEvent(new PropertyChangeEvent('filter', value, old));
    }
    if (getMapContainer().getLayer(this.entry.getType()) == null) {
      this.setCheckboxDisabled(true);
    }
  }

  /**
   * @param {PropertyChangeEvent} event
   * @private
   */
  onQueriesChanged_(event) {
    this.dispatchEvent(new PropertyChangeEvent('icons'));
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    if (value !== TriState.BOTH) {
      var old = this.getState();
      this.setStateInternal(value);
      var s = this.getState();

      if (old != s && this.entry) {
        var enable = s === TriState.ON;
        var enabled = /** @type {boolean} */ (this.entry.isEnabled());

        // we only need to fire a command if the feature differs
        if (enable !== enabled) {
          var cmds = [];
          cmds.push(new FilterEnable(this.entry, enable));
          if (enable) {
            var entries = getQueryManager().getEntries(this.entry.getType());

            // Wipe out old entries and set wildcards
            var entry = {
              'layerId': this.entry.getType(),
              'areaId': '*',
              'filterId': this.entry.getId(),
              'includeArea': true,
              'filterGroup': true
            };
            entries.push(entry);
            cmds.push(new QueryEntries(entries, true, this.entry.getType(), true));
          }

          if (cmds.length > 0) {
            var cmd = new SequenceCommand();
            cmd.setCommands(cmds);
            cmd.title = enable ? 'Enable' : 'Disable' + ' Filter';
            CommandProcessor.getInstance().addCommand(cmd);
          }
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    var filter = this.getEntry();
    var clazz = 'u-fa-badge-times';
    var status = 'inactive';
    var layerId = filter.getType();
    var layer = getMapContainer().getLayer(layerId);
    if (layer && getQueryManager().hasEnabledEntries(layerId, undefined, filter.getId())) {
      clazz = 'u-fa-badge-check';
      status = 'active';
    }
    if (isStateFile(this.getEntry().getId())) {
      var statecopy = 'fa fa-bookmark';
      return ' <i class="fa fa-fw fa-filter position-relative ' + clazz + '" title="This filter is ' +
        status + '"></i> <i class=" ' + statecopy + '" title="This is from a state file"></i> ';
    } else {
      return ' <i class="fa fa-fw fa-filter position-relative ' + clazz + '" title="This filter is ' +
        status + '"></i> ';
    }
  }
}
