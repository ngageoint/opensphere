goog.declareModuleId('plugin.cesium.sync.BaseConverter');

import {deletePrimitive, getPrimitive} from '../primitive.js';

const {default: IConverter} = goog.requireType('plugin.cesium.sync.IConverter');


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
