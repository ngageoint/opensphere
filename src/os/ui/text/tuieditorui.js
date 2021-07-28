goog.module('os.ui.text.TuiEditorUI');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const Timer = goog.require('goog.Timer');
const {assert} = goog.require('goog.asserts');
const TrustedResourceUrl = goog.require('goog.html.TrustedResourceUrl');
const {safeLoad} = goog.require('goog.net.jsloader');
const {normalizeSpaces, normalizeWhitespace} = goog.require('goog.string');
const {ROOT} = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const Settings = goog.require('os.config.Settings');
const {createConstant} = goog.require('os.string');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const TuiEditor = goog.require('os.ui.text.TuiEditor');
const TuiEditorLang = goog.require('os.ui.text.TuiEditorLang');
const {getMarkdownIt} = goog.require('os.ui.text.TuiEditorMarkdownIt');


/**
 * If the editor script loadeded, but failed, then stop trying (probably old browser)
 * @type {boolean}
 */
let stopLoading = false;

/**
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'text': '=',
    'edit': '<',
    'maxlength': '=',
    'isRequired': '=',
    /* @type {function({'html': string}): Promise} */
    'postProcessFn': '&?',
    'hideWc': '=?'
  },
  templateUrl: ROOT + 'views/text/tuieditor.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'tuieditor';

/**
 * Add the directive to the tools module
 */
Module.directive(directiveTag, [directive]);

/**
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

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
     * The intial mode of the editor
     * @type {string}
     */
    this.initialEditType =
      /** @type {string} */ (Settings.getInstance().get(TuiEditor.MODE_KEY, TuiEditor.Mode.WYSIWYG));

    /**
     * @type {string}
     */
    this['text'] = $scope['text'] || '';
    $scope['edit'] = ($scope['edit'] === undefined) ? false : $scope['edit'];

    /**
     * The intial text of the editor
     * @type {string}
     * @private
     */
    this.initialText_ = this['text'];

    this.element.on('keydown', this.onKeyboardEvent_);
    this.element.on('keypress', this.onKeyboardEvent_);

    dispatcher.getInstance().listen('tuieditor.refresh', this.fixCodemirrorInit_, false, this);

    $scope.$watch('text', this.onScopeChange_.bind(this));
    $scope.$watch('edit', this.switchModes_.bind(this));
    $scope.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this['tuiEditor']) {
      this['tuiEditor'].remove();
      this['tuiEditor'] = null;
    }

    if (this.element) {
      this.element.off('keydown');
      this.element.off('keypress');
      this.element = null;
    }

    this.timeout_ = null;
    this.scope = null;
  }

  /**
   * Change between edit and view mode
   * @private
   */
  switchModes_() {
    // Since we put it behind a ng-if, we need to wait for the dom element to be back
    this.timeout_(function() {
      if (this.scope) {
        if (this.scope['edit'] && !window['tui'] && !stopLoading) {
          this['loading'] = true;
          var trustedUrl =
              TrustedResourceUrl.fromConstant(createConstant(TuiEditor.SCRIPT_URL));
          safeLoad(trustedUrl, {
            'timeout': 30000
          }).addCallbacks(this.onScriptLoaded_, this.onScriptLoadError, this);
        } else {
          this.init();
        }
      }
    }.bind(this));
  }

  /**
   * @private
   */
  onScriptLoaded_() {
    // Changes words in the editor, adds hotkeys to tooltips
    TuiEditorLang.setup(this.getOptions()['useCommandShortcut']);
    this.init();
  }

  /**
   * Since we couldnt load the js, just display the content
   * @param {boolean=} opt_suppressAlert
   */
  onScriptLoadError(opt_suppressAlert) {
    if (!opt_suppressAlert) {
      AlertManager.getInstance().sendAlert('Failed to load editor');
    }

    this['textAreaBackup'] = true;
    this['loading'] = false;
    apply(this.scope);
  }

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
  onKeyboardEvent_(event) {
    event.stopPropagation();
  }

  /**
   * @return {string}
   * @export
   */
  getWordCount() {
    var len = this['text'] ? this['text'].length : 0;
    var value = len;
    if (this.scope && this.scope['maxlength']) {
      value += ' / ' + this.scope['maxlength'];
    }

    return value;
  }

  /**
   * @return {Object}
   */
  getOptions() {
    const options = {
      'el': this.element.find('.js-tui-editor__editor')[0],
      'height': 'auto',
      'min-height': '10rem',
      'linkAttribute': {
        'target': 'blank'
      },
      'initialValue': this['text'],
      'initialEditType': this.initialEditType,
      'events': {
        'change': this.onEditorChange_.bind(this)
      },
      'codeBlockLanguages': ['markdown'],
      'usedefaultHTMLSanitizer': true,
      'useCommandShortcut': true,
      'usageStatistics': false,
      'exts': this.getExtensions(),
      'hooks': this.getHooks()
    };

    const toolbarItems = this.getToolbar();

    if (toolbarItems instanceof Array && toolbarItems.length > 0) {
      options['toolbarItems'] = toolbarItems;
    }

    options['plugins'] = this.getPlugins();

    return options;
  }

  /**
   * Initialize tuieditor
   */
  init() {
    // If we are toggling between edit and view mode. Cleanup the editor
    if (this['tuiEditor']) {
      this['tuiEditor'].remove();
      this['tuiEditor'] = null;
    }

    if (this.scope['edit']) {
      if (toastui.Editor) {
        this['textAreaBackup'] = false;
        this['loading'] = false;
        this['tuiEditor'] = new toastui.Editor(this.getOptions());
        this.scope.$emit(TuiEditor.READY);

        if (Settings.getInstance().get(TuiEditor.MODE_KEY) == TuiEditor.Mode.MARKDOWN) {
          this.timeout_(this.fixCodemirrorInit_.bind(this));
        }
      } else {
        // If after we've loaded the editor script and it doesnt run correctly
        // (happened in chrome 36. Just default to text area)
        stopLoading = true;
        this.onScriptLoadError(true);
      }
    } else {
      this.getDisplayHtml_().then(function(displayHtml) {
        this.onDisplayHtmlUpdate(displayHtml);
        this.scope.$emit(TuiEditor.READY);
      }.bind(this));
    }
  }

  /**
   * @private
   * @return {Promise}
   */
  getDisplayHtml_() {
    return new Promise((resolve, reject) => {
      var text = TuiEditor.render(this['text']);
      if (this.scope['postProcessFn']) {
        this.scope['postProcessFn']({'html': text}).then((html) => {
          resolve(html);
        }, (e) => {
          if (e && e.toString) {
            AlertManager.getInstance().sendAlert(e.toString(), AlertEventSeverity.ERROR);
          }
          // fallback
          resolve(text);
        });
      } else {
        resolve(text);
      }
    });
  }

  /**
   * @param {string} displayHtml
   */
  onDisplayHtmlUpdate(displayHtml) {
    this['displayHtml'] = displayHtml;
    this.setTargetBlankPropertyInLinks();
    apply(this.scope);
  }

  /**
   * @private
   */
  onScopeChange_() {
    this['text'] = this.scope['text'];

    if (this.scope['edit'] && this['tuiEditor'] && this['text'] != this.getCurrentValue_()) {
      this.setCurrentValue_(this['text']);
      apply(this.scope);
    } else if (!this.scope['edit']) {
      this.getDisplayHtml_().then(this.onDisplayHtmlUpdate.bind(this));
    } else {
      apply(this.scope);
    }
  }

  /**
   * @private
   * @return {string}
   */
  getCurrentValue_() {
    let currentValue;

    if (this['tuiEditor']['currentMode'] == 'markdown') {
      currentValue = this['tuiEditor']['mdEditor'].getValue();
    } else if (this['tuiEditor']['currentMode'] == 'wysiwyg') {
      currentValue = this['tuiEditor']['wwEditor'].getValue();
    }

    return currentValue;
  }

  /**
   * @private
   * @param {string} value
   */
  setCurrentValue_(value) {
    if (this['tuiEditor']['currentMode'] == 'markdown') {
      this['tuiEditor']['mdEditor'].setValue(value);
    } else if (this['tuiEditor']['currentMode'] == 'wysiwyg') {
      this['tuiEditor']['wwEditor'].setValue(value);
    }
  }

  /**
   * @private
   */
  onEditorChange_() {
    if (
      this.scope && this.scope['tuiEditorForm'] &&
      this['tuiEditor'] && this.getCurrentValue_() &&
      this.getCurrentValue_() !== this.initialText_
    ) {
      this.scope['tuiEditorForm'].$setDirty();
    }

    this['text'] = this.scope['text'] = this.getCurrentValue_();
    apply(this.scope);
  }

  /**
   * @export
   */
  onTextEditChange() {
    this.scope['text'] = this['text'];
  }

  /**
   * @param {string} url
   * @param {string=} opt_altText
   */
  insertImage(url, opt_altText) {
    this['tuiEditor'].eventManager.emit('command', 'AddImage', {
      'imageUrl': url,
      'altText': opt_altText || 'image'
    });
  }

  /**
   * @param {string} url
   * @param {string} linkText
   */
  insertLink(url, linkText) {
    this['tuiEditor'].eventManager.emit('command', 'AddLink', {
      'linkText': linkText,
      'url': url
    });
  }

  /**
   * Get all the hooks we support
   * @return {Object}
   */
  getHooks() {
    return {
      'changeMode': function(mode) {
        Settings.getInstance().set(TuiEditor.MODE_KEY, mode);
      }
    };
  }

  /**
   * Get all the extensions we support
   * @return {Array<string>}
   */
  getExtensions() {
    return [
      // 'colorSyntax', This is a really cool extension, however it addes invalid markdown that we sanitize out
      // After we fix the sanitizer, we can re-enable it. Leaving this code comment in for people to know why
      // it was excluded
      'table'
    ];
  }

  /**
   * Get all the toolbar buttons we support (undefined is default library toolbar)
   * @return {Array|undefined}
   */
  getToolbar() {
    return undefined;
  }

  /**
   * Get any plugins to be added
   * @return {Array}
   */
  getPlugins() {
    return [];
  }

  /**
   * Temporary until option is added to tui-editor viewer mode (commented on issue #527)
   */
  setTargetBlankPropertyInLinks() {
    if (this.element && this.element.find('.js-tui-editor__viewer')) {
      var links = this.element.find('.js-tui-editor__viewer a');
      if (links.length) {
        links.prop('target', '_blank');
      }
    }
  }

  /**
   * Codemirror has the same issues that it did in simpleMDE with initalization.
   * Codemirror issue #798. when its put in a textarea with display none it needs a refresh
   * After Codemirror is added, call refresh on it
   *
   * Another issue: this broke at some point. The line that reads codeMirror['0'].innerText != 'xxxxxxxxxx'
   * had codeMirror.length instead. Turns out codeMirror.length is always defined no matter what.
   * But it will say 'xxxxxxxxxx' for innerText unless it is actually loaded.
   * Note that for some reason this issue is speed sensitive.
   * This is some borked thing deep in CodeMirror that is screwing things up.
   *
   * Commented on tuieditor issue #191
   * @private
   */
  fixCodemirrorInit_() {
    if (this.element) {
      this.cmFixAttempt_ = this.cmFixAttempt_ ? this.cmFixAttempt_ + 1 : 1;
      var codeMirror = this.element.find('.te-md-container .CodeMirror');
      if (codeMirror.length) {
        if (this['tuiEditor'] && codeMirror['0'].innerText != 'xxxxxxxxxx') {
          this.timeout_(function() {
            this['tuiEditor'].mdEditor.cm.refresh();
          }.bind(this));
        } else if (this.cmFixAttempt_ < 50) {
          Timer.callOnce(this.fixCodemirrorInit_, 250, this);
        }
      }
    }
  }

  /**
   * Add custom event types to eventManager and listen to them
   */
  addEventTypes() {}
}


/**
 * @param {string=} opt_markdown
 * @return {string} - markdown parsed to html
 */
TuiEditor.render = function(opt_markdown) {
  const markdownIt = getMarkdownIt();
  assert(markdownIt != null, 'markdownit is not available!');
  return opt_markdown ? markdownIt.render(opt_markdown) : '';
};


/**
 * Convert markdown text to html free string.
 * @param {string=} opt_markdown
 * @return {string}
 */
TuiEditor.getUnformatedText = function(opt_markdown) {
  var html = $(TuiEditor.render(opt_markdown));
  if (html && html.length) {
    return normalizeSpaces(normalizeWhitespace(/** @type {string} */ (html.text())));
  } else {
    return '';
  }
};


exports = {
  Controller,
  directive,
  directiveTag
};
