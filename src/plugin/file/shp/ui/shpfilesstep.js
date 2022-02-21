goog.declareModuleId('plugin.file.shp.ui.SHPFilesStep');

import EventType from '../../../../os/events/eventtype.js';
import FileStorage from '../../../../os/file/filestorage.js';
import * as osFile from '../../../../os/file/index.js';
import MappingManager from '../../../../os/im/mapping/mappingmanager.js';
import {ROOT} from '../../../../os/os.js';
import UrlMethod from '../../../../os/ui/file/method/urlmethod.js';
import Module from '../../../../os/ui/module.js';
import * as ui from '../../../../os/ui/ui.js';
import AbstractWizardStep from '../../../../os/ui/wiz/step/abstractwizardstep.js';
import WizardStepEvent from '../../../../os/ui/wiz/step/wizardstepevent.js';
import * as shp from '../shp.js';

const googEvents = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');


/**
 * SHP import file selection step
 *
 * @extends {AbstractWizardStep<SHPParserConfig>}
 */
export default class SHPFilesStep extends AbstractWizardStep {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.template = `<${filesStepDirectiveTag}></${filesStepDirectiveTag}>`;
    this.title = 'Files';
  }

  /**
   * @inheritDoc
   */
  finalize(config) {
    try {
      config.updatePreview();

      var features = config['preview'];
      if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
        // no mappings have been set yet, so try to auto detect them
        var mm = MappingManager.getInstance();
        var mappings = mm.autoDetect(features);
        if (mappings && mappings.length > 0) {
          config['mappings'] = mappings;
        }
      }
    } catch (e) {
    }
  }
}


/**
 * The SHP import file selection step directive
 *
 * @return {angular.Directive}
 */
const filesStepDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: ROOT + 'views/plugin/shp/shpfilesstep.html',
    controller: Controller,
    controllerAs: 'filesStep'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const filesStepDirectiveTag = 'shpfilesstep';


/**
 * Add the directive to the module
 */
Module.directive(filesStepDirectiveTag, [filesStepDirective]);



/**
 * Controller for the SHP import file selection step
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {SHPParserConfig}
     * @private
     */
    this.config_ = /** @type {SHPParserConfig} */ ($scope['config']);

    /**
     * @type {Element}
     * @private
     */
    this.dbfFileEl_ = document.getElementById('dbfFile');
    googEvents.listen(this.dbfFileEl_, GoogEventType.CHANGE, this.onFileChange_, false, this);

    /**
     * @type {Element}
     * @private
     */
    this.shpFileEl_ = document.getElementById('shpFile');
    googEvents.listen(this.shpFileEl_, GoogEventType.CHANGE, this.onFileChange_, false, this);

    /**
     * @type {boolean}
     */
    this['loading'] = false;

    /**
     * @type {string}
     */
    this['dbfName'] = this.getDisplayName_(this.config_['file2']);

    /**
     * @type {boolean}
     */
    this['dbfValid'] = !!this['dbfName'];

    /**
     * @type {?string}
     */
    this['dbfError'] = null;

    /**
     * @type {string}
     */
    this['shpName'] = this.getDisplayName_(this.config_['file']);

    /**
     * @type {boolean}
     */
    this['shpValid'] = !!this['shpName'];

    /**
     * @type {?string}
     */
    this['shpError'] = null;

    $scope.$on('$destroy', this.destroy_.bind(this));

    this.updateErrorText_('shp');
    this.updateErrorText_('dbf');
    this.validate_();
  }

  /**
   * @private
   */
  destroy_() {
    googEvents.unlisten(this.dbfFileEl_, GoogEventType.CHANGE, this.onFileChange_, false, this);
    googEvents.unlisten(this.shpFileEl_, GoogEventType.CHANGE, this.onFileChange_, false, this);
    this.dbfFileEl_ = null;
    this.shpFileEl_ = null;
    this.config_ = null;
    this.scope_ = null;
  }

  /**
   * Checks if both files have been chosen/validated.
   *
   * @private
   */
  validate_() {
    this.scope_.$emit(WizardStepEvent.VALIDATE, this['dbfValid'] && this['shpValid']);
    ui.apply(this.scope_);
  }

  /**
   * Launches a file browser for the specified file type.
   *
   * @param {string} type The file type
   * @export
   */
  onBrowse(type) {
    if (type == 'dbf' && this.dbfFileEl_) {
      this.dbfFileEl_.click();
    } else if (type == 'shp' && this.shpFileEl_) {
      this.shpFileEl_.click();
    }
  }

  /**
   * Handles changes to the hidden file inputs, validating the chosen file.
   *
   * @param {goog.events.BrowserEvent} event
   * @private
   */
  onFileChange_(event) {
    var inputEl = /** @type {HTMLInputElement} */ (event.target);
    var type = inputEl == this.dbfFileEl_ ? 'dbf' : 'shp';
    if (inputEl.files && inputEl.files.length > 0) {
      this['loading'] = true;

      const file = inputEl.files[0];
      if (file.path && osFile.isFileUrlEnabled()) {
        this[type + 'Name'] = osFile.getFileUrl(file.path);
        this.loadUrl(type);
      } else {
        var reader = osFile.createFromFile(file);
        reader.addCallbacks(goog.partial(this.handleResult_, type), goog.partial(this.handleError_, type), this);
      }
    } else {
      this.onClear(type);
    }
  }

  /**
   * Handler for successful file read.
   *
   * @param {string} type The file type
   * @param {OSFile} file The file.
   * @private
   */
  handleResult_(type, file) {
    this['loading'] = false;

    if (file) {
      // make sure the file is given a unique name, unless this is a replace
      if (!this.config_['descriptor']) {
        FileStorage.getInstance().setUniqueFileName(file);
      }

      var method = type == 'dbf' ? shp.isDBFFileType : shp.isSHPFileType;
      var content = file.getContent();

      if (content && content instanceof ArrayBuffer && method(content)) {
        if (type == 'dbf') {
          this.config_['file2'] = file;
        } else {
          this.config_['file'] = file;
        }

        this[type + 'Name'] = this.getDisplayName_(file);
        this[type + 'Valid'] = true;
      } else {
        this[type + 'Valid'] = false;
      }
    }

    this.updateErrorText_(type);
    this.validate_();
  }

  /**
   * Updates the error text displayed for the SHP/DBF file based on the UI state.
   *
   * @param {string} type The file type
   * @param {string=} opt_text Custom error text
   * @private
   */
  updateErrorText_(type, opt_text) {
    if (!this[type + 'Valid']) {
      if (opt_text) {
        this[type + 'Error'] = opt_text;
      } else if (this[type + 'Name']) {
        this[type + 'Error'] = 'Selected file is not ' + this.getTypeString_(type) + '.';
      } else {
        this[type + 'Error'] = 'Please choose ' + this.getTypeString_(type) + '.';
      }
    } else {
      this[type + 'Error'] = null;
    }
  }

  /**
   * Gets the user-facing name for the provided file. Remote files will return the URL, while local files will return
   * the file name.
   *
   * @param {?OSFile} file The file
   * @return {string}
   * @private
   */
  getDisplayName_(file) {
    if (!file) {
      return '';
    }

    var url = file.getUrl();
    if (url && !osFile.isLocal(url)) {
      return url;
    }

    return file.getFileName() || '';
  }

  /**
   * Handler for failed file read. Display an error message and close the window.
   *
   * @param {string} type The file type
   * @param {string} errorMsg The error message.
   * @private
   */
  handleError_(type, errorMsg) {
    this['loading'] = false;

    var file = type + 'File';
    if (!errorMsg || typeof errorMsg !== 'string') {
      var fileName = this.scope_[file] ? this.scope_[file].name : 'unknown';
      errorMsg = 'Unable to load file "' + fileName + '".';
    }

    this[type + 'Valid'] = false;
    this.updateErrorText_(type, errorMsg);
    this.validate_();

    log.error(logger, errorMsg);
  }

  /**
   * Clears the file associated with the specified type.
   *
   * @param {string} type The file type
   * @export
   */
  onClear(type) {
    if (type == 'dbf') {
      this.config_['file2'] = null;
      this.dbfFileEl_.value = null;
    } else {
      this.config_['file'] = null;
      this.shpFileEl_.value = null;
    }

    this[type + 'Name'] = '';
    this[type + 'Valid'] = false;

    this.updateErrorText_(type);
    this.validate_();
  }

  /**
   * Convenience function for returning 'a DBF file' or 'an SHP file' for error messages. I know, it's best
   * not to ask.
   *
   * @param {string} type
   * @return {string}
   * @private
   */
  getTypeString_(type) {
    return 'a' + (type == 'shp' ? 'n ' : ' ') + type.toUpperCase() + ' file';
  }

  /**
   * Loads the provided URL to see if it's a valid SHP/DBF file.
   *
   * @param {string} type The file type
   * @export
   */
  loadUrl(type) {
    var method = new UrlMethod();
    var url = this[type + 'Name'];
    method.setUrl(url);
    method.listen(EventType.COMPLETE, goog.partial(this.onUrlComplete_, type), false, this);
    method.listen(EventType.CANCEL, goog.partial(this.onUrlError_, type), false, this);
    method.loadUrl();
  }

  /**
   * Handles URL import completion.
   *
   * @param {string} type
   * @param {goog.events.Event} event
   * @private
   */
  onUrlComplete_(type, event) {
    var method = /** @type {UrlMethod} */ (event.target);
    method.removeAllListeners();

    var file = method.getFile();
    if (file) {
      this.handleResult_(type, file);
    } else {
      this.handleError_(type, 'Unable to load URL!');
    }
  }

  /**
   * Handles URL import error.
   *
   * @param {string} type
   * @param {goog.events.Event} event
   * @private
   */
  onUrlError_(type, event) {
    var method = /** @type {UrlMethod} */ (event.target);
    method.removeAllListeners();

    this.handleError_(type, 'Unable to load URL!');
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('plugin.file.shp.ui.SHPFilesStep');
