/**
 * @fileoverview This module was replaced by os.classRegistry in order to share the local registry between instanceOf
 *               and registerClass. That module should be preferred, but keeping these around for backward
 *               compatibility. They should eventually be deprecated and removed, but for now we'll avoid adding noise
 *               to the build warnings.
 */
goog.declareModuleId('os.registerClass');

import {registerClass} from './classregistry.js';


export default registerClass;
