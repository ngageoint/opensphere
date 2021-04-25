goog.module('plugin.openpage.Handler');

const CommandProcessor = goog.require('os.command.CommandProcessor');
const googString = goog.require('goog.string');
const LayerAdd = goog.require('os.command.LayerAdd');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const {TYPE} = goog.require('plugin.openpage');

const IMessageHandler = goog.requireType('os.xt.IMessageHandler');


/**
 * @implements {IMessageHandler}
 */
class Handler {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @inheritDoc
   */
  getTypes() {
    return [TYPE];
  }

  /**
   * @inheritDoc
   */
  process(data, type, sender, time) {
    if (data) {
      if (!Array.isArray(data)) {
        data = [data];
      }

      var cmds = data.filter(function(item) {
        return goog.isObject(item);
      }).map(function(config) {
        config['id'] = config['id'] || googString.getRandomString();
        return new LayerAdd(config);
      });

      if (cmds.length) {
        var cmd;
        if (cmds.length > 1) {
          cmd = new SequenceCommand();
          cmd.setCommands(cmds);
        } else {
          cmd = cmds[0];
        }

        CommandProcessor.getInstance().addCommand(cmd);
      }
    }
  }
}

exports = Handler;
