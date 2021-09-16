goog.module('os.ui.query.cmd.AreaRemove');

const State = goog.require('os.command.State');
const {getAreaManager, getQueryManager} = goog.require('os.query.instance');
const AbstractArea = goog.require('os.ui.query.cmd.AbstractArea');

const Feature = goog.requireType('ol.Feature');
const ICommand = goog.requireType('os.command.ICommand');


/**
 * Command for removing an area
 *
 * @implements {ICommand}
 */
class AreaRemove extends AbstractArea {
  /**
   * Constructor.
   * @param {!Feature} area
   */
  constructor(area) {
    super(area);
    this.title = 'Remove area';

    if (area) {
      var areaTitle = area.get('title');
      if (areaTitle) {
        this.title += ' "' + areaTitle + '"';
      }
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.canExecute()) {
      this.state = State.EXECUTING;

      var am = getAreaManager();
      var qm = getQueryManager();

      if (this.entries) {
        qm.removeEntriesArr(this.entries);
      }

      am.remove(this.area);

      this.state = State.SUCCESS;
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    var am = getAreaManager();
    var qm = getQueryManager();

    am.add(this.area);
    qm.addEntries(this.entries);

    this.state = State.READY;
    return true;
  }
}

exports = AreaRemove;
