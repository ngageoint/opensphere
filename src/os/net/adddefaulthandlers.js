goog.module('os.net.addDefaultHandlers');

const ExtDomainHandler = goog.require('os.net.ExtDomainHandler');
const LocalFileHandler = goog.require('os.net.LocalFileHandler');
const SameDomainHandler = goog.require('os.net.SameDomainHandler');
const RequestHandlerFactory = goog.require('os.net.RequestHandlerFactory');


/**
 * Adds the default set of handlers to the factory.
 */
const addDefaultHandlers = function() {
  RequestHandlerFactory.addHandler(ExtDomainHandler);
  RequestHandlerFactory.addHandler(LocalFileHandler);
  RequestHandlerFactory.addHandler(SameDomainHandler);
};

exports = addDefaultHandlers;
