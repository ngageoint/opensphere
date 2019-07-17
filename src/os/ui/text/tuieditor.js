goog.provide('os.ui.text.TuiEditor');
goog.provide('os.ui.text.TuiEditor.READY');
goog.provide('os.ui.text.TuiEditorCtrl');
goog.provide('os.ui.text.tuiEditorDirective');
goog.require('goog.dom.safe');
goog.require('ol.xml');
goog.require('os.ui.Module');
goog.require('os.ui.text.TuiEditorMarkdownIt');


/**
 * @type {string}
 */
os.ui.text.TuiEditor.MODE_KEY = 'tuieditor.mode';


/**
 * @type {string}
 */
os.ui.text.TuiEditor.READY = 'tui.editor.ready';


/**
 * The URL to the Javascript library.
 * @type {string}
 * @const
 */
os.ui.text.TuiEditor.SCRIPT_URL = ROOT + 'vendor/os-minified/os-tui-editor.min.js';


/**
 * If the editor script loadeded, but failed, then stop trying (probably old browser)
 * @type {boolean}
 */
os.ui.text.TuiEditor.STOP_LOADING = false;


/**
 * @enum {string}
 */
os.ui.text.TuiEditor.Mode = {
  WYSIWYG: 'wysiwyg',
  MARKDOWN: 'markdown'
};


/**
 * @return {angular.Directive}
 */
os.ui.text.tuiEditorDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'text': '=',
      'edit': '<',
      'maxlength': '=',
      'isRequired': '='
    },
    templateUrl: os.ROOT + 'views/text/tuieditor.html',
    controller: os.ui.text.TuiEditorCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the tools module
 */
os.ui.Module.directive('tuieditor', [os.ui.text.tuiEditorDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.text.TuiEditorCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * the tuieditor object
   * @type {Object}
   */
  this['tuiEditor'] = null;

  /**
   * The display only mode HTML (parsed markdown)
   * @type {string}
   */
  this['displayHtml'] = '';

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * If for some reason the editor doesnt load, just give them a text area
   * @type {boolean}
   */
  this['textAreaBackup'] = false;

  /**
   * @type {string}
   */
  this['text'] = $scope['text'] || '';
  $scope['edit'] = goog.isDef($scope['edit']) ? $scope['edit'] : false;

  this.element_.on('keydown', this.onKeyboardEvent_);
  this.element_.on('keypress', this.onKeyboardEvent_);

  $scope.$watch('text', this.onScopeChange_.bind(this));
  $scope.$watch('edit', this.switchModes_.bind(this));
  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * Cleanup
 */
os.ui.text.TuiEditorCtrl.prototype.destroy = function() {
  if (this['tuiEditor']) {
    this['tuiEditor'].remove();
    this['tuiEditor'] = null;
  }

  this.element_.off('keydown');
  this.element_.off('keypress');
  this.element_ = null;
  this.timeout_ = null;
  this.scope = null;
};


/**
 * Change between edit and view mode
 * @private
 */
os.ui.text.TuiEditorCtrl.prototype.switchModes_ = function() {
  // Since we put it behind a ng-if, we need to wait for the dom element to be back
  this.timeout_(function() {
    if (this.scope) {
      if (this.scope['edit'] && !window['tui'] && !os.ui.text.TuiEditor.STOP_LOADING) {
        this['loading'] = true;
        var trustedUrl =
            goog.html.TrustedResourceUrl.fromConstant(os.string.createConstant(os.ui.text.TuiEditor.SCRIPT_URL));
        goog.net.jsloader.safeLoad(trustedUrl, {
          'timeout': 30000
        }).addCallbacks(this.init, this.onScriptLoadError, this);
      } else {
        this.init();
      }
    }
  }.bind(this));
};


/**
 * Since we couldnt load the js, just display the content
 * @param {boolean=} opt_suppressAlert
 */
os.ui.text.TuiEditorCtrl.prototype.onScriptLoadError = function(opt_suppressAlert) {
  if (!opt_suppressAlert) {
    os.alertManager.sendAlert('Failed to load editor');
  }

  this['textAreaBackup'] = true;
  this['loading'] = false;
  os.ui.apply(this.scope);
};


/**
 * Consume keydown events so they are not passed to the map.
 * Without this event listener the following characters
 * will not be received by editor in WYSIWYG mode:
 *  'r', 'u', 'v', 'n', '>', '.', and arrow keys.
 * We had a discussion to add this to ol.events.condition.targetNotEditable but
 * decided since its an isolated case to do it here
 * @param {Object} event
 * @private
 */
os.ui.text.TuiEditorCtrl.prototype.onKeyboardEvent_ = function(event) {
  event.stopPropagation();
};


/**
 * @return {string}
 * @export
 */
os.ui.text.TuiEditorCtrl.prototype.getWordCount = function() {
  var len = this['text'] ? this['text'].length : 0;
  var value = len;
  if (this.scope['maxlength']) {
    value += ' / ' + this.scope['maxlength'];
  }

  return value;
};


/**
 * @return {Object}
 */
os.ui.text.TuiEditorCtrl.prototype.getOptions = function() {
  var options = {
    'el': this.element_.find('.js-tui-editor__editor')[0],
    'height': 'auto',
    'min-height': '10rem',
    'linkAttribute': {
      'target': 'blank'
    },
    'initialValue': this['text'],
    'initialEditType': os.settings.get(os.ui.text.TuiEditor.MODE_KEY, os.ui.text.TuiEditor.Mode.WYSIWYG),
    'toolbarItems': this.getToolbar(),
    'events': {
      'change': this.onEditorChange_.bind(this)
    },
    'codeBlockLanguages': ['markdown'],
    'usedefaultHTMLSanitizer': true,
    'useCommandShortcut': false,
    'usageStatistics': false,
    'exts': this.getExtensions(),
    'hooks': this.getHooks()
  };

  return options;
};


/**
 * Initialize tuieditor
 */
os.ui.text.TuiEditorCtrl.prototype.init = function() {
  // If we are toggling between edit and view mode. Cleanup the editor
  if (this['tuiEditor']) {
    this['tuiEditor'].remove();
    this['tuiEditor'] = null;
  }

  if (this.scope['edit']) {
    if (tui.Editor) {
      this['textAreaBackup'] = false;
      this['loading'] = false;
      this['tuiEditor'] = new tui.Editor(this.getOptions());

      // HACK. There are no hooks to change the button text. So change it after the editor renders
      // Opened issue #524 on github
      this.timeout_(function() {
        if (this.element_) {
          var markdownButtonElement = this.element_.find('button.te-switch-button.markdown');
          if (markdownButtonElement.length) {
            markdownButtonElement.text('Text');
          }
          var wysiwygButtonElement = this.element_.find('button.te-switch-button.wysiwyg');
          if (wysiwygButtonElement.length) {
            wysiwygButtonElement.text('Visual');
          }

          if (os.settings.get(os.ui.text.TuiEditor.MODE_KEY) == os.ui.text.TuiEditor.Mode.MARKDOWN) {
            this.fixCodemirrorInit_();
          }
        }
      }.bind(this));
    } else {
      // If after we've loaded the editor script and it doesnt run correctly
      // (happened in chrome 36. Just default to text area)
      os.ui.text.TuiEditor.STOP_LOADING = true;
      this.onScriptLoadError(true);
    }
  } else {
    this['displayHtml'] = os.ui.text.TuiEditor.render(this['text']);
  }

  this.scope.$emit(os.ui.text.TuiEditor.READY);
};


/**
 * @private
 */
os.ui.text.TuiEditorCtrl.prototype.onScopeChange_ = function() {
  this['text'] = this.scope['text'];

  if (this.scope['edit'] && this['tuiEditor'] && this['text'] != this['tuiEditor'].getValue()) {
    this['tuiEditor'].setValue(this['text']);
  } else if (!this.scope['edit']) {
    this['displayHtml'] = os.ui.text.TuiEditor.render(this['text']);
    this.setTargetBlankPropertyInLinks();
  }

  os.ui.apply(this.scope);
};


/**
 * @private
 */
os.ui.text.TuiEditorCtrl.prototype.onEditorChange_ = function() {
  if (this.scope && this.scope['tuiEditorForm'] && this['tuiEditor'].getValue()) {
    this.scope['tuiEditorForm'].$setDirty();
  }

  this['text'] = this.scope['text'] = this['tuiEditor'].getValue();
  os.ui.apply(this.scope);
};


/**
 * @export
 */
os.ui.text.TuiEditorCtrl.prototype.onTextEditChange = function() {
  this.scope['text'] = this['text'];
};


/**
 * @param {string} url
 * @param {string=} opt_altText
 */
os.ui.text.TuiEditorCtrl.prototype.insertImage = function(url, opt_altText) {
  this['tuiEditor'].eventManager.emit('command', 'AddImage', {
    'imageUrl': url,
    'altText': opt_altText || 'image'
  });
};


/**
 * @param {string} linkText
 * @param {string} url
 */
os.ui.text.TuiEditorCtrl.prototype.insertLink = function(linkText, url) {
  this['tuiEditor'].eventManager.emit('command', 'AddLink', {
    'linkText': linkText,
    'url': url
  });
};



/**
 * Get all the hooks we support
 * @return {Object}
 */
os.ui.text.TuiEditorCtrl.prototype.getHooks = function() {
  return {
    'changeMode': function(mode) {
      os.settings.set(os.ui.text.TuiEditor.MODE_KEY, mode);
    }
  };
};


/**
 * Get all the extensions we support
 * @return {Array<string>}
 */
os.ui.text.TuiEditorCtrl.prototype.getExtensions = function() {
  return [
    // 'colorSyntax', This is a really cool extension, however it addes invalid markdown that we sanitize out
    // After we fix the sanitizer, we can re-enable it. Leaving this code comment in for people to know why
    // it was excluded
    'table'
  ];
};


/**
 * Get all the toolbar buttons we support (undefined is default library toolbar)
 * @return {Array|undefined}
 */
os.ui.text.TuiEditorCtrl.prototype.getToolbar = function() {
  return undefined;
};


/**
 * Temporary until option is added to tui-editor viewer mode (commented on issue #527)
 */
os.ui.text.TuiEditorCtrl.prototype.setTargetBlankPropertyInLinks = function() {
  if (this.element_ && this.element_.find('.js-tui-editor__viewer')) {
    var links = this.element_.find('.js-tui-editor__viewer a');
    if (links.length) {
      links.prop('target', '_blank');
    }
  }
};


/**
 * Codemirror has the same issues that it did in simpleMDE with initalization.
 * Codemirror issue #798. when its put in a textarea with display none it needs a refresh
 * After Codemirror is added, call refresh on it
 * Commented on tuieditor issue #191
 * @private
 */
os.ui.text.TuiEditorCtrl.prototype.fixCodemirrorInit_ = function() {
  if (this.element_) {
    this.cmFixAttempt_ = this.cmFixAttempt_ ? this.cmFixAttempt_ + 1 : 1;
    var codeMirror = this.element_.find('.te-md-container .CodeMirror');
    if (this['tuiEditor'] && codeMirror.length) {
      this.timeout_(function() {
        this['tuiEditor'].mdEditor.cm.refresh();
      }.bind(this));
    } else if (this.cmFixAttempt_ < 50) {
      goog.Timer.callOnce(this.fixCodemirrorInit_, 250, this);
    }
  }
};


/**
 * @param {string=} opt_markdown
 * @return {string} - markdown parsed to html
 */
os.ui.text.TuiEditor.render = function(opt_markdown) {
  return opt_markdown ? os.ui.text.TuiEditorMarkdownIt.render(opt_markdown) : '';
};


/**
 * Convert markdown text to html free string.
 * @param {string=} opt_markdown
 * @return {string}
 */
os.ui.text.TuiEditor.getUnformatedText = function(opt_markdown) {
  var html = $(os.ui.text.TuiEditor.render(opt_markdown));
  if (html && html.length) {
    return goog.string.normalizeSpaces(goog.string.normalizeWhitespace(/** @type {string} */ (html.text())));
  } else {
    return '';
  }
};
