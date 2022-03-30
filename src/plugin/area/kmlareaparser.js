goog.declareModuleId('plugin.area.KMLAreaParser');

import {isDocument} from 'ol/src/xml.js';

import ColumnDefinition from '../../os/data/columndefinition.js';
import * as text from '../../os/file/mime/text.js';
import * as mimeZip from '../../os/file/mime/zip.js';
import {PROJECTION} from '../../os/map/map.js';
import KML from '../../os/ol/format/KML.js';
import AsyncZipParser from '../../os/parse/asynczipparser.js';
import * as osXml from '../../os/xml.js';

const dom = goog.require('goog.dom');
const googDomXml = goog.require('goog.dom.xml');
const GoogFileReader = goog.require('goog.fs.FileReader');
const log = goog.require('goog.log');


/**
 * Simple KML parser that extracts areas from a KML. Has asynchronous support for KMZ files.
 *
 * @implements {IParser.<ol.Feature>}
 * @template T
 */
class KMLAreaParser extends AsyncZipParser {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {KML}
     * @private
     */
    this.format_ = new KML({
      showPointNames: false
    });

    /**
     * @type {?Document}
     * @private
     */
    this.document_ = null;

    /**
     * @type {Object<string, !zip.Entry>} entries
     * @private
     */
    this.kmlEntries_ = {};

    /**
     * @type {Array<ColumnDefinition>}
     * @protected
     */
    this.columns = null;

    /**
     * @type {goog.log.Logger}
     * @private
     */
    this.log_ = logger;
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    this.cleanup();

    if (isDocument(source)) {
      this.document_ = /** @type {Document} */ (source);
    } else if (typeof source === 'string') {
      this.document_ = googDomXml.loadXml(source);
    } else if (source instanceof ArrayBuffer) {
      if (mimeZip.isZip(source)) {
        this.createZipReader(source);
        return;
      } else {
        var s = text.getText(source);
        if (s) {
          this.document_ = googDomXml.loadXml(s);
        } else {
          log.error(this.log_, 'The buffer source does not appear to be text');
          this.onError();
        }
      }
    } else if (source instanceof Blob) {
      GoogFileReader.readAsArrayBuffer(source).addCallback(this.setSource, this);
      return;
    }

    if (this.document_) {
      var rootEl = dom.getFirstElementChild(this.document_);
      if (rootEl && rootEl.localName.toLowerCase() !== 'kml') {
        // Sometimes people are dumb and create documents without a root <kml> tag.
        // This is technically invalid KML and even invalid XML.  Because Google Earth
        // accepts this crap, add a special case to put the proper root tag.
        var newRoot = osXml.createElement('kml', this.document_);
        newRoot.appendChild(rootEl);
        this.document_.appendChild(newRoot);
        rootEl = newRoot;
      }

      if (rootEl) {
        this.onReady();
      } else {
        log.error(this.log_, 'No KML content to parse!');
        this.onError();
      }
    } else {
      log.error(this.log_, 'Content must be a valid KML document!');
      this.onError();
    }
  }

  /**
   * HACK ALERT! zip.js has a zip.TextWriter() class that directly turns the zip entry into the string we want.
   * Unfortunately, it doesn't work in FF24 for some reason, but luckily, the BlobWriter does. Here, we read
   * the zip as a Blob, then feed it to a FileReader in the next callback in order to extract the text.
   *
   * @inheritDoc
   */
  handleZipEntries(entries) {
    var mainEntry = null;
    var firstEntry = null;
    var mainKml = /(doc|index)\.kml$/i;
    var anyKml = /\.kml$/i;

    for (var i = 0, n = entries.length; i < n; i++) {
      // if we have multiple entries, try to find one titled either doc.kml or index.kml as these
      // are generally the most important ones
      var entry = entries[i];
      if (!mainEntry && mainKml.test(entry.filename)) {
        mainEntry = entry;
      } else if (anyKml.test(entry.filename)) {
        if (!firstEntry) {
          firstEntry = entry;
        }

        this.kmlEntries_[entry.filename] = entry;
      }
    }

    mainEntry = mainEntry || firstEntry;

    if (mainEntry) {
      this.processMainEntry_(mainEntry);
    } else {
      log.error(this.log_, 'No KML found in the ZIP!');
      this.onError();
    }
  }

  /**
   * Parse the main kml file
   *
   * @param {zip.Entry} mainEntry
   * @private
   */
  processMainEntry_(mainEntry) {
    mainEntry.getData(new zip.BlobWriter(), this.processZIPEntry_.bind(this, mainEntry.filename));
  }

  /**
   * Unzips the main entry.
   *
   * @param {string} filename
   * @param {*} content
   * @private
   */
  processZIPEntry_(filename, content) {
    if (content && content instanceof Blob) {
      var reader = new FileReader();
      reader.onload = this.handleZIPText_.bind(this, filename);
      reader.readAsText(content);
    } else {
      log.error(this.log_, 'There was a problem unzipping the KMZ!');
      this.onError();
    }
  }

  /**
   * @param {string} filename
   * @param {Event} event
   * @private
   */
  handleZIPText_(filename, event) {
    var content = event.target.result;

    if (content && typeof content === 'string') {
      if (!this.document_) {
        this.setSource(content);
      }
    } else {
      log.error(this.log_, 'There was a problem reading the ZIP content!');
      this.onError();
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.document_ = null;

    this.zipReaders.forEach(function(reader) {
      reader.close();
    });

    this.zipReaders.length = 0;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.document_ != null;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    var features = null;
    if (this.document_) {
      // make sure the document reference is cleared so errors don't result in hasNext continuing to return true. the
      // importer will catch and report the error so we don't do it here.
      var doc = this.document_;
      this.document_ = null;
      features = this.format_.readFeatures(doc, {
        featureProjection: PROJECTION
      });
    }

    if (features) {
      this.columns = [];
      var columnMap = {};
      features.forEach(function(feature) {
        var values = feature.getProperties();
        if (values) {
          for (var key in values) {
            columnMap[key] = true;
          }
        }
      });

      for (var key in columnMap) {
        var definition = new ColumnDefinition(key);
        this.columns.push(definition);
      }
    }

    this.cleanup();
    return features;
  }

  /**
   * Get the columns.
   *
   * @return {?Array<ColumnDefinition>} The definitions
   */
  getColumns() {
    return this.columns;
  }
}


/**
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('plugin.area.KMLAreaParser');


export default KMLAreaParser;
