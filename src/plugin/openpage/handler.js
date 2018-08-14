goog.provide('plugin.openpage.Handler');

goog.require('goog.string');
goog.require('os.command.LayerAdd');
goog.require('os.command.SequenceCommand');
goog.require('os.xt.IMessageHandler');
goog.require('plugin.openpage');


/**
 * @constructor
 * @implements {os.xt.IMessageHandler}
 */
plugin.openpage.Handler = function() {};


/**
 * @inheritDoc
 */
plugin.openpage.Handler.prototype.getTypes = function() {
  return [plugin.openpage.TYPE];
};

/**
 * @inheritDoc
 */
plugin.openpage.Handler.prototype.process = function(data, type, sender, time) {
  if (data) {
    if (!goog.isArray(data)) {
      data = [data];
    }

    var cmds = data.filter(function(item) {
      return goog.isObject(item);
    }).map(function(config) {
      config['id'] = config['id'] || goog.string.getRandomString();
      return new os.command.LayerAdd(config);
    });

    if (cmds.length) {
      var cmd;
      if (cmds.length > 1) {
        cmd = new os.command.SequenceCommand();
        cmd.setCommands(cmds);
      } else {
        cmd = cmds[0];
      }

      os.commandStack.addCommand(cmd);
    }
  }
};
