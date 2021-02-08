goog.declareModuleId('plugin.cesium.sync.BaseConverterTemp');

import {getPrimitive, deletePrimitive} from '../primitive';

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

export default BaseConverter;
