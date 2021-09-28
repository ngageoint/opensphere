goog.declareModuleId('os.file.mime.xml');

import * as mime from '../mime.js';
import * as text from './text.js';
import Types from './types.js';

const Promise = goog.require('goog.Promise');

const {default: OSFile} = goog.requireType('os.file.File');
const {default: Context} = goog.requireType('os.file.mime.xml.Context');


/**
 * @type {string}
 */
export const TYPE = 'text/xml';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @param {*=} opt_context
 * @return {!Promise<{content: string, rootNS: string, rootTag: string}|undefined>}
 */
export const isXML = function(buffer, opt_file, opt_context) {
  var retVal;

  if (opt_context && typeof opt_context === 'string') {
    var lexer = xmlLexer.create();

    // I know this looks async. Technically it is, but because we synchronously send the
    // data to the lexer, the events fire in a synchronous manner.

    var expectedTypes = [Types.OPEN_TAG];

    var namespaceKey = '';
    var namespaceIncoming = false;

    var listener = function(data) {
      if (expectedTypes.indexOf(data.type) > -1) {
        if (data.type === Types.OPEN_TAG) {
          if (retVal) {
            // we're past the root tag so just stop
            lexer.off('data', listener);
          } else {
            var colon = data.value.indexOf(':');
            var tag = data.value;

            if (colon > -1) {
              namespaceKey = ':' + data.value.substring(0, colon);
              tag = data.value.substring(colon + 1);
            }

            retVal = /** @type {Context} */ ({
              content: opt_context,
              rootTag: tag,
              rootNS: '',
              checkTag: data.value
            });
          }

          expectedTypes.push(Types.CLOSE_TAG);
          expectedTypes.push(Types.ATTRIBUTE_NAME);
        } else if (data.type === Types.ATTRIBUTE_NAME) {
          expectedTypes.pop();

          if (data.value === 'xmlns' + namespaceKey) {
            namespaceIncoming = true;
          }

          expectedTypes.push(Types.ATTRIBUTE_VALUE);
        } else if (data.type === Types.ATTRIBUTE_VALUE) {
          expectedTypes.pop();

          if (namespaceIncoming) {
            retVal.rootNS = data.value;
          }

          namespaceIncoming = false;
          expectedTypes.push(Types.ATTRIBUTE_NAME);
        } else if (data.type === Types.CLOSE_TAG) {
          expectedTypes.pop();
          expectedTypes.push(Types.OPEN_TAG);
        }
      } else {
        // malformed nonsense
        retVal = undefined;
      }
    };

    lexer.on('data', listener);

    // the lexer doesn't handle comments, so don't send it any
    // the . doesn't match \n, \r, \u2028, or \u2029, so use [^] instead
    var noComments = opt_context.replace(/\s*<!--[^]*?(-->|$)\s*/g, '');
    lexer.write(noComments);

    if (retVal) {
      // The lexer is a little loose with the term "XML", so we'll validate the results.
      // Basically, if the file STARTS with XML, we'll call it XML. Anything else is just
      // something else (like markdown or txt or - god forbid - json) with XML inside it.
      var rootTagIndex = noComments.indexOf('<' + retVal.checkTag);
      if (rootTagIndex > -1) {
        var checkStr = noComments.substring(0, rootTagIndex);
        // ditch the xml header
        checkStr = checkStr.replace(/^\s*<\?xml .*?\?>\s*/g, '');
        // ditch any <!> headers such as <!DOCTYPE...>
        checkStr = checkStr.replace(/^\s*<!.*?>\s*/g, '').trim();
        if (checkStr) {
          // there was non-comment data before the root node
          retVal = undefined;
        }
      } else {
        // couldn't find resulting tag in string, this shouldn't ever actually occur
        retVal = undefined;
      }
    }
  }

  return Promise.resolve(retVal);
};

mime.register(TYPE, isXML, 0, text.TYPE);


/**
 * @param {?RegExp} rootTagRegex Regular expression for testing against root tag names
 * @param {?RegExp} rootNSRegex Regular express for testing against root tag namespaces
 * @return {!function(ArrayBuffer, OSFile, *=):!Promise<*|undefined>} The detect function for registering with `mime`
 */
export const createDetect = function(rootTagRegex, rootNSRegex) {
  if (!rootTagRegex && !rootNSRegex) {
    throw new Error('At least one of the [rootTagRegex, rootNSRegex] must be defined and not null');
  }

  return (
    /**
     * @param {ArrayBuffer} buffer
     * @param {OSFile=} opt_file
     * @param {*=} opt_context
     * @return {!Promise<*|undefined>}
     */
    function(buffer, opt_file, opt_context) {
      var retVal;
      if (opt_context && (
        (!rootNSRegex || rootNSRegex.test(opt_context.rootNS)) &&
          (!rootTagRegex || rootTagRegex.test(opt_context.rootTag)))) {
        retVal = opt_context;
      }

      return Promise.resolve(retVal);
    }
  );
};
