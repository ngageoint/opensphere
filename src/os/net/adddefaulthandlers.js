goog.declareModuleId('os.net.addDefaultHandlers');

import ExtDomainHandler from './extdomainhandler.js';
import LocalFileHandler from './localfilehandler.js';
import * as RequestHandlerFactory from './requesthandlerfactory.js';
import SameDomainHandler from './samedomainhandler.js';


/**
 * Adds the default set of handlers to the factory.
 */
const addDefaultHandlers = function() {
  RequestHandlerFactory.addHandler(ExtDomainHandler);
  RequestHandlerFactory.addHandler(LocalFileHandler);
  RequestHandlerFactory.addHandler(SameDomainHandler);
};

export default addDefaultHandlers;
