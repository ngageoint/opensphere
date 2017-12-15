goog.provide('os.im.Importer');
goog.provide('os.im.ImporterEvent');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alertManager');
goog.require('os.events.EventType');
goog.require('os.im.IImporter');
goog.require('os.im.mapping.AltMapping');
goog.require('os.parse.AsyncParser');
goog.require('os.parse.IParser');
goog.require('os.thread.EventType');
goog.require('os.thread.IThreadJob');
goog.require('os.thread.Thread');


/**
 * @enum {string}
 */
os.im.ImporterEvent = {
  START: 'importer:startImport',
  STOP: 'importer:stopImport'
};



/**
 * Imports a set of items via a parser
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {os.parse.IParser<T>} parser The parser
 * @implements {os.im.IImporter}
 * @implements {os.thread.IThreadJob}
 * @template T
 */
os.im.Importer = function(parser) {
  os.im.Importer.base(this, 'constructor');

  /**
   * @type {os.parse.IParser<T>}
   * @protected
   */
  this.parser = parser;

  /**
   * @type {boolean}
   * @protected
   */
  this.stopThread = false;

  /**
   * @type {?os.thread.Thread}
   * @protected
   */
  this.currThread = null;

  /**
   * @type {?Array<os.im.mapping.IMapping>}
   * @protected
   */
  this.mappings = null;

  /**
   * the list of mappings for use with autodetection
   * @type {Object}
   */
  this.autoMappings = goog.object.clone(os.im.mapping.MappingManager.getInstance().getMappings());

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
};
goog.inherits(os.im.Importer, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.im.Importer.LOGGER_ = goog.log.getLogger('os.im.Importer');


/**
 * @inheritDoc
 */
os.im.Importer.prototype.disposeInternal = function() {
  this.reset();

  if (this.parser) {
    this.parser.cleanup();
    goog.dispose(this.parser);
    this.parser = null;
  }

  os.im.Importer.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.setMappings = function(value) {
  this.mappings = value;
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.getMappings = function() {
  return this.mappings;
};


/**
 * get the current list of autodetection mappings
 * @return {Object}
 */
os.im.Importer.prototype.getAutoMappings = function() {
  return this.autoMappings;
};


/**
 * Sets the column limit used to determine how many features to check for unique column keys
 * @param {number} value
 */
os.im.Importer.prototype.setAutoDetectLimit = function(value) {
  this.autoDetectLimit = value;
};


/**
 * Sets the column limit used to determine how many features to check for unique column keys
 * @return {number}
 */
os.im.Importer.prototype.getAutoDetectLimit = function() {
  return this.autoDetectLimit;
};


/**
 * specify a subset of existing mappings to use for autodetection
 * @param {Array<string>} mappingIds
 */
os.im.Importer.prototype.selectAutoMappings = function(mappingIds) {
  if (mappingIds) {
    var oldMappings = goog.object.clone(this.autoMappings);
    this.autoMappings = {};

    for (var i = 0; i < mappingIds.length; i++) {
      var id = mappingIds[i];
      // find the id and build up the new autoMappings
      if (goog.object.containsKey(oldMappings, id)) {
        this.autoMappings[id] = goog.object.get(oldMappings, id);
      }
    }
  }
  this.autoDetectEnabled = true;
};


/**
 * define a different set of mappings to use for autodetection
 * @param {?Array<os.im.mapping.IMapping>} mapList
 */
os.im.Importer.prototype.setAutoMappings = function(mapList) {
  this.autoMappings = {};

  if (mapList && mapList.length) {
    mapList.forEach(function(mapping) {
      this.autoMappings[mapping.getId()] = mapping;
    }, this);
    this.autoDetectEnabled = true;
  }
};


/**
 * indicate a list of mappings that will only be executed (no autodetection)
 * @param {Array<os.im.mapping.IMapping>} mapList
 */
os.im.Importer.prototype.setExecMappings = function(mapList) {
  if (mapList) {
    mapList.forEach(function(mapping) {
      var key = mapping.getId();
      this.execOnlyMappings[key] = mapping;

      // remove the mapping from the autoMappings list
      if (key in this.autoMappings) {
        goog.object.remove(this.autoMappings, key);
      }

      // seed the mapping list with these mappings
      this.addMapping_(mapping);
    }, this);
  }
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.startImport = function(source) {
  try {
    // notify the application that parsing is about to begin
    os.dispatcher.dispatchEvent(os.im.ImporterEvent.START);

    if (this.parser instanceof os.parse.AsyncParser) {
      this.parser.listenOnce(os.events.EventType.COMPLETE, this.onParserReady, false, this);
      this.parser.listenOnce(os.events.EventType.ERROR, this.onParserError, false, this);
      this.parser.setSource(source);
    } else {
      this.parser.setSource(source);
      this.onParserReady();
    }
  } catch (e) {
    goog.log.error(os.im.Importer.LOGGER_, 'Error while configuring parser.', e);
    this.onParserError();
  }
};


/**
 * Initiates parsing of individual results once the parser is ready.
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.im.Importer.prototype.onParserReady = function(opt_event) {
  if (this.parser instanceof os.parse.AsyncParser) {
    this.parser.unlisten(os.events.EventType.COMPLETE, this.onParserReady, false, this);
    this.parser.unlisten(os.events.EventType.ERROR, this.onParserError, false, this);
  }

  try {
    if (!this.currThread) {
      this.stopThread = false;

      this.currThread = new os.thread.Thread(this);
      this.currThread.listenOnce(os.thread.EventType.COMPLETE, this.onParsingComplete, false, this);
      this.currThread.start();
    }
  } catch (e) {
    goog.log.error(os.im.Importer.LOGGER_, 'Error while importing data.', e);
    this.onParsingComplete();
  }
};


/**
 * Initiates parsing of individual results once the parser is ready.
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.im.Importer.prototype.onParserError = function(opt_event) {
  if (this.parser instanceof os.parse.AsyncParser) {
    this.parser.unlisten(os.events.EventType.COMPLETE, this.onParserReady, false, this);
    this.parser.unlisten(os.events.EventType.ERROR, this.onParserError, false, this);
  }

  os.alertManager.sendAlert('Error while parsing data. Please see the log for more details.',
      os.alert.AlertEventSeverity.ERROR, os.im.Importer.LOGGER_);
  this.onParsingComplete();
};


/**
 * Handles parser completion
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.im.Importer.prototype.onParsingComplete = function(opt_event) {
  if (this.currThread) {
    goog.dispose(this.currThread);
    this.currThread = null;
  }

  // dispatch the stop event first to notify the application parsing is complete
  os.dispatcher.dispatchEvent(os.im.ImporterEvent.STOP);

  // dispatch the complete event before cleaning up the parser in case listeners need to reference it
  this.dispatchEvent(new goog.events.Event(os.events.EventType.COMPLETE));

  // now clean up the parser
  if (this.parser) {
    this.parser.cleanup();
  }
};


/**
 * Checks whether the parser has another record
 * @return {boolean}
 * @protected
 */
os.im.Importer.prototype.parserHasNext = function() {
  try {
    return !this.stopThread && this.parser.hasNext();
  } catch (e) {
    goog.log.error(os.im.Importer.LOGGER_, 'Error while checking for next record', e);
  }

  return false;
};


/**
 * Parses a single record and adds it to the list
 * @protected
 */
os.im.Importer.prototype.parseOne = function() {
  try {
    var item = this.parser.parseNext();
    this.addItem(item);
  } catch (e) {
    goog.log.error(os.im.Importer.LOGGER_, 'Error while parsing record', e);
  }
};


/**
 * Adds a single record to the list
 * @param {T|Array<T>} item
 */
os.im.Importer.prototype.addItem = function(item) {
  if (item) {
    if (goog.isArray(item)) {
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
};


/**
 * @param {T} item
 * @protected
 */
os.im.Importer.prototype.addItemInternal = function(item) {
  this.performMappings(item);
  this.data_.push(item);
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.getData = function(opt_reset) {
  var reset = goog.isDefAndNotNull(opt_reset) ? opt_reset : true;
  var ret = this.data_;
  if (reset) {
    this.data_ = [];
  }

  return ret;
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.getParser = function() {
  return this.parser;
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.executeNext = function() {
  var s = goog.now();
  goog.log.fine(os.im.Importer.LOGGER_, 'processing new chunk');

  var i = 0;
  var t = goog.now();

  while (this.parserHasNext() && (t - s) < 250) {
    this.parseOne();
    t = goog.now();
    i++;
  }

  var elapsed = goog.now() - s;
  goog.log.fine(os.im.Importer.LOGGER_, 'finished processing chunk of ' + i + ' items in ' + elapsed + ' ms.');
  this.dispatchEvent(new goog.events.Event(os.thread.EventType.PROGRESS));

  return !this.parserHasNext();
};


/**
 * Enable/disable autodetection.  When enabled, this will default to all
 * of the mappings unless a different set is specified.
 * @param {boolean} value
 */
os.im.Importer.prototype.setAutoDetect = function(value) {
  this.autoDetectEnabled = value;
};


/**
 * @return {boolean} whether autodetection is enabled/disabled
 */
os.im.Importer.prototype.getAutoDetect = function() {
  return this.autoDetectEnabled;
};


/**
 * autodetect and/or execute mappings that have been chosen
 * @param {T} item
 * @protected
 */
os.im.Importer.prototype.performMappings = function(item) {
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
            goog.object.remove(this.autoMappings, key);
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
};


/**
 * Execute the mapping on the item
 * @param {T} item
 * @protected
 */
os.im.Importer.prototype.executeMapping = function(item) {
  if (item && this.mappings) {
    for (var i = 0, n = this.mappings.length; i < n; i++) {
      var m = this.mappings[i];

      try {
        m.execute(item);
      } catch (e) {
        goog.log.error(os.im.Importer.LOGGER_,
            'Error applying mapping "' + m.field + ' > ' + m.getLabel() + '"! ', e);
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.reset = function() {
  this.stop();
  this.parser.cleanup();
  this.data_ = [];
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.stop = function() {
  this.stopThread = true;
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.getLoaded = function() {
  return -1;
};


/**
 * @inheritDoc
 */
os.im.Importer.prototype.getTotal = function() {
  return -1;
};


/**
 * Build up our overall mapping array.  Items in this array
 * have already been through autodetection or have been directly configured.
 * @param {os.im.mapping.IMapping} mapping
 * @private
 */
os.im.Importer.prototype.addMapping_ = function(mapping) {
  if (!this.mappings) {
    this.mappings = [mapping];
  } else {
    var endIndex = this.mappings.length - 1;
    if (this.mappings[endIndex] instanceof os.im.mapping.AltMapping) {
      // if alt mapping is already at the end, leave it there
      this.mappings.splice(endIndex, 0, mapping);
    } else {
      this.mappings.push(mapping);
    }
  }
};
