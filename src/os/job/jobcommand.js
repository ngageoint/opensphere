goog.module('os.job.JobCommand');
goog.module.declareLegacyNamespace();

/**
 * Worker control commands.
 * @enum {number}
 */
const JobCommand = {
  'START': 0,
  'STOP': 1,
  'PAUSE': 2
};

goog.exportSymbol('os.job.JobCommand', JobCommand);

exports = JobCommand;
