goog.module('os.im.Importer');
goog.module.declareLegacyNamespace();

const dispose = goog.require('goog.dispose');
const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const googObject = goog.require('goog.object');
const dispatcher = goog.require('os.Dispatcher');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const OSEventType = goog.require('os.events.EventType');
const IImporter = goog.require('os.im.IImporter'); // eslint-disable-line
const ImporterEvent = goog.require('os.im.ImporterEvent');
const AltMappingId = goog.require('os.im.mapping.AltMappingId');
const MappingManager = goog.require('os.im.mapping.MappingManager');
const osImplements = goog.require('os.implements');
const AsyncParser = goog.require('os.parse.AsyncParser');
const ThreadEventType = goog.require('os.thread.EventType');
const Thread = goog.require('os.thread.Thread');

const Logger = goog.requireType('goog.log.Logger');
const IMapping = goog.requireType('os.im.mapping.IMapping');
const IParser = goog.requireType('os.parse.IParser');
const IThreadJob = goog.requireType('os.thread.IThreadJob');


/**
 * Imports a set of items via a parser
 *
 * @implements {IImporter}
 * @implements {IThreadJob}
 * @template T
 */
class Importer extends EventTarget {
  /**
   * Constructor.
   * @param {IParser<T>} parser The parser
   */
  constructor(parser) {
    super();

    /**
     * @type {IParser<T>}
     * @protected
     */
    this.parser = parser;

    /**
     * @type {boolean}
     * @protected
     */
    this.stopThread = false;

    /**
     * @type {?Thread}
     * @protected
     */
    this.currThread = null;

    /**
     * @type {?Array<IMapping>}
     * @protected
     */
    this.mappings = null;

    /**
     * the list of mappings for use with autodetection
     * @type {Object}
     */
    this.autoMappings = googObject.clone(MappingManager.getInstance().getMappings());

    /**
     * a set of mappings for execution only (i.e. no autodetection)
     * @type {Object}
     */
    this.execOnlyMappings = {};

    /**
     * flag indicating whether autodetection is enabled
     * @type {boolean}
     * @protected
     */
    this.autoDetectEnabled = false;

    /**
     * upper limit for performing autodetection to aid with performance
     * @type {number}
     */
    this.autoDetectLimit = 100;

    /**
     * the current number of detections
     * @type {number}
     */
    this.numDetections = 0;

    /**
     * @type {!Array<!T>}
     * @private
     */
    this.data_ = [];
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.reset();

    if (this.parser) {
      this.parser.cleanup();
      dispose(this.parser);
      this.parser = null;
    }

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  setMappings(value) {
    this.mappings = value;
  }

  /**
   * @inheritDoc
   */
  getMappings() {
    return this.mappings;
  }

  /**
   * get the current list of autodetection mappings
   *
   * @return {Object}
   */
  getAutoMappings() {
    return this.autoMappings;
  }

  /**
   * Sets the column limit used to determine how many features to check for unique column keys
   *
   * @param {number} value
   */
  setAutoDetectLimit(value) {
    this.autoDetectLimit = value;
  }

  /**
   * Sets the column limit used to determine how many features to check for unique column keys
   *
   * @return {number}
   */
  getAutoDetectLimit() {
    return this.autoDetectLimit;
  }

  /**
   * specify a subset of existing mappings to use for autodetection
   *
   * @param {Array<string>} mappingIds
   */
  selectAutoMappings(mappingIds) {
    if (mappingIds) {
      var oldMappings = googObject.clone(this.autoMappings);
      this.autoMappings = {};

      for (var i = 0; i < mappingIds.length; i++) {
        var id = mappingIds[i];
        // find the id and build up the new autoMappings
        if (googObject.containsKey(oldMappings, id)) {
          this.autoMappings[id] = googObject.get(oldMappings, id);
        }
      }
    }
    this.autoDetectEnabled = true;
  }

  /**
   * define a different set of mappings to use for autodetection
   *
   * @param {?Array<IMapping>} mapList
   */
  setAutoMappings(mapList) {
    this.autoMappings = {};

    if (mapList && mapList.length) {
      mapList.forEach(function(mapping) {
        this.autoMappings[mapping.getId()] = mapping;
      }, this);
      this.autoDetectEnabled = true;
    }
  }

  /**
   * indicate a list of mappings that will only be executed (no autodetection)
   *
   * @param {Array<IMapping>} mapList
   */
  setExecMappings(mapList) {
    if (mapList) {
      mapList.forEach(function(mapping) {
        var key = mapping.getId();
        this.execOnlyMappings[key] = mapping;

        // remove the mapping from the autoMappings list
        if (key in this.autoMappings) {
          googObject.remove(this.autoMappings, key);
        }

        // seed the mapping list with these mappings
        this.addMapping_(mapping);
      }, this);
    }
  }

  /**
   * Set mappings configured by the user
   *
   * @param {Array<IMapping>} mapList
   */
  setUserMappings(mapList) {
    if (mapList && mapList.length > 0) {
      mapList.forEach((mapping) => this.addMapping_(mapping));
    }
  }

  /**
   * @inheritDoc
   */
  startImport(source) {
    try {
      // notify the application that parsing is about to begin
      dispatcher.getInstance().dispatchEvent(ImporterEvent.START);

      if (this.parser instanceof AsyncParser) {
        this.parser.listenOnce(OSEventType.COMPLETE, this.onParserReady, false, this);
        this.parser.listenOnce(OSEventType.ERROR, this.onParserError, false, this);
        this.parser.setSource(source);
      } else {
        this.parser.setSource(source);
        this.onParserReady();
      }
    } catch (e) {
      log.error(logger, 'Error while configuring parser.', e);
      this.onParserError();
    }
  }

  /**
   * Initiates parsing of individual results once the parser is ready.
   *
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onParserReady(opt_event) {
    if (this.parser instanceof AsyncParser) {
      this.parser.unlisten(OSEventType.COMPLETE, this.onParserReady, false, this);
      this.parser.unlisten(OSEventType.ERROR, this.onParserError, false, this);
    }

    try {
      if (!this.currThread) {
        this.stopThread = false;

        this.currThread = new Thread(this);
        this.currThread.listenOnce(ThreadEventType.COMPLETE, this.onParsingComplete, false, this);
        this.currThread.start();
      }
    } catch (e) {
      log.error(logger, 'Error while importing data.', e);
      this.onParsingComplete();
    }
  }

  /**
   * Initiates parsing of individual results once the parser is ready.
   *
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onParserError(opt_event) {
    if (this.parser instanceof AsyncParser) {
      this.parser.unlisten(OSEventType.COMPLETE, this.onParserReady, false, this);
      this.parser.unlisten(OSEventType.ERROR, this.onParserError, false, this);
    }

    AlertManager.getInstance().sendAlert('Error while parsing data. Please see the log for more details.',
        AlertEventSeverity.ERROR, logger);
    this.onParsingComplete();
  }

  /**
   * Handles parser completion
   *
   * @param {GoogEvent=} opt_event
   * @protected
   */
  onParsingComplete(opt_event) {
    if (this.currThread) {
      dispose(this.currThread);
      this.currThread = null;
    }

    // dispatch the stop event first to notify the application parsing is complete
    dispatcher.getInstance().dispatchEvent(ImporterEvent.STOP);

    // dispatch the complete event before cleaning up the parser in case listeners need to reference it
    this.dispatchEvent(new GoogEvent(OSEventType.COMPLETE));

    // now clean up the parser
    if (this.parser) {
      this.parser.cleanup();
    }
  }

  /**
   * Checks whether the parser has another record
   *
   * @return {boolean}
   * @protected
   */
  parserHasNext() {
    try {
      return !this.stopThread && this.parser.hasNext();
    } catch (e) {
      log.error(logger, 'Error while checking for next record', e);
    }

    return false;
  }

  /**
   * Parses a single record and adds it to the list
   *
   * @protected
   */
  parseOne() {
    try {
      var item = this.parser.parseNext();
      this.addItem(item);
    } catch (e) {
      log.error(logger, 'Error while parsing record', e);
    }
  }

  /**
   * Adds a single record to the list
   *
   * @param {T|Array<T>} item
   */
  addItem(item) {
    if (item) {
      if (Array.isArray(item)) {
        var arr = /** @type {Array<T>} */ (item);

        for (var i = 0, n = arr.length; i < n; i++) {
          if (arr[i]) {
            this.addItemInternal(arr[i]);
          }
        }
      } else {
        this.addItemInternal(item);
      }
    }
  }

  /**
   * @param {T} item
   * @protected
   * @suppress {accessControls}
   */
  addItemInternal(item) {
    this.performMappings(item);
    this.data_.push(item);
  }

  /**
   * @inheritDoc
   */
  getData(opt_reset) {
    var reset = opt_reset != null ? opt_reset : true;
    var ret = this.data_;
    if (reset) {
      this.data_ = [];
    }

    return ret;
  }

  /**
   * @inheritDoc
   */
  getParser() {
    return this.parser;
  }

  /**
   * @inheritDoc
   */
  executeNext() {
    var s = Date.now();
    log.fine(logger, 'processing new chunk');

    var i = 0;
    var t = Date.now();

    while (this.parserHasNext() && (t - s) < 250) {
      this.parseOne();
      t = Date.now();
      i++;
    }

    var elapsed = Date.now() - s;
    log.fine(logger, 'finished processing chunk of ' + i + ' items in ' + elapsed + ' ms.');
    this.dispatchEvent(new GoogEvent(ThreadEventType.PROGRESS));

    return !this.parserHasNext();
  }

  /**
   * Enable/disable autodetection.  When enabled, this will default to all
   * of the mappings unless a different set is specified.
   *
   * @param {boolean} value
   */
  setAutoDetect(value) {
    this.autoDetectEnabled = value;
  }

  /**
   * @return {boolean} whether autodetection is enabled/disabled
   */
  getAutoDetect() {
    return this.autoDetectEnabled;
  }

  /**
   * autodetect and/or execute mappings that have been chosen
   *
   * @param {T} item
   * @protected
   */
  performMappings(item) {
    // not all fields exist on every feature, so we have to check this each time
    // (at least until we reach our defined limit)

    // don't bother with any autodetection stuff if the flag is not set
    if (this.autoDetectEnabled) {
      this.numDetections++;
      // check if there are any mappings that need autodetection/configuration
      // perform the autodetection before adding them to the overall map
      if (this.autoMappings) {
        // run autodetect on the mappings
        for (var key in this.autoMappings) {
          // check if this exists in execMappings, if so, skip it
          if (!(key in this.execOnlyMappings)) {
            var detected = this.autoMappings[key].autoDetect([item]);
            //  add our new mapping (created from the autodetect), to the overall mappings array
            if (detected) {
              // remove the detected mapping from the automappings
              googObject.remove(this.autoMappings, key);
              this.addMapping_(detected);
            }
          }
        }
      }

      if (this.numDetections >= this.autoDetectLimit) {
        // shut off autodetection
        this.autoDetectEnabled = false;
      }
    }

    this.executeMapping(item);
  }

  /**
   * Execute the mapping on the item
   *
   * @param {T} item
   * @protected
   */
  executeMapping(item) {
    if (item && this.mappings) {
      for (var i = 0, n = this.mappings.length; i < n; i++) {
        var m = this.mappings[i];

        try {
          m.execute(item);
        } catch (e) {
          log.error(logger,
              'Error applying mapping "' + m.field + ' > ' + m.getLabel() + '"! ', e);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  reset() {
    this.stop();
    this.parser.cleanup();
    this.data_ = [];
  }

  /**
   * @inheritDoc
   */
  stop() {
    this.stopThread = true;
  }

  /**
   * @inheritDoc
   */
  getLoaded() {
    return -1;
  }

  /**
   * @inheritDoc
   */
  getTotal() {
    return -1;
  }

  /**
   * Build up our overall mapping array.  Items in this array
   * have already been through autodetection or have been directly configured.
   *
   * @param {IMapping} mapping
   * @private
   */
  addMapping_(mapping) {
    if (!this.mappings) {
      this.mappings = [mapping];
    } else {
      var endIndex = this.mappings.length - 1;

      if (osImplements(this.mappings[endIndex], AltMappingId)) {
        // if alt mapping is already at the end, leave it there
        this.mappings.splice(endIndex, 0, mapping);
      } else {
        this.mappings.push(mapping);
      }
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.im.Importer');

exports = Importer;
