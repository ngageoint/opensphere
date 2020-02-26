goog.module('plugin.cesium.sync.BaseConverter');

const {getPrimitive, deletePrimitive} = goog.require('plugin.cesium.primitive');

const IConverter = goog.requireType('plugin.cesium.sync.IConverter');


/**
 * @abstract
 * @implements {IConverter}
 */
class BaseConverter {}


/**
 * @inheritDoc
 */
BaseConverter.prototype.retrieve = getPrimitive;

/**
 * @inheritDoc
 */
BaseConverter.prototype.delete = deletePrimitive;

exports = BaseConverter;
