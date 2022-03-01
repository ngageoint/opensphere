goog.declareModuleId('plugin.georss.mime');

import {register} from 'opensphere/src/os/file/mime.js';
import {TYPE as XMLTYPE, createDetect} from 'opensphere/src/os/file/mime/xml.js';

/**
 * @type {string}
 */
export const TYPE = 'application/rss+xml+geo';

register(
    // the type for this detection
    TYPE,
    // os.file.mime.xml provides a function that creates a detection function for a
    // given root tag regex and xmlns regex
    createDetect(/^feed$/, /^http:\/\/www.w3.org\/2005\/Atom$/),
    // the priority of this detection. 0 is the default, lower numbers run earlier
    0,
    // the parent type; XML in this case
    XMLTYPE);
