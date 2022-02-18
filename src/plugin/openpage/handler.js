goog.declareModuleId('plugin.openpage.Handler');

import CommandProcessor from '../../os/command/commandprocessor.js';
import LayerAdd from '../../os/command/layeraddcmd.js';
import SequenceCommand from '../../os/command/sequencecommand.js';
import {isObject} from '../../os/object/object.js';
import {TYPE} from './openpage.js';

const googString = goog.require('goog.string');

const {default: IMessageHandler} = goog.requireType('os.xt.IMessageHandler');


/**
 * @implements {IMessageHandler}
 */
export default class Handler {
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
        return isObject(item);
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
