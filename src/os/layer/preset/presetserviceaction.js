goog.module('os.layer.preset.PresetServiceAction');


/**
 * @enum {string}
 */
const PresetServiceAction = {
  INSERT: 'insert',
  UPDATE: 'update',
  FIND: 'find',
  REMOVE: 'remove',
  SET_DEFAULT: 'setDefault',
  SET_PUBLISHED: 'setPublished'
};

exports = PresetServiceAction;
