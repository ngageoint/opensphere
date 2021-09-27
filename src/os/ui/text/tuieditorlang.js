goog.declareModuleId('os.ui.text.TuiEditorLang');

/**
 * Since tui editor is lazy loaded, run after loading
 * No easy way to change button text. Opened issue #524 on github
 * @param {boolean=} opt_supportHotkeys
 */
export const setup = function(opt_supportHotkeys) {
  // This is the language block for tui editor so we can modify words in their UI
  const languageOverrides = {
    'Markdown': 'Text',
    'WYSIWYG': 'Visual'
  };

  if (opt_supportHotkeys) {
    languageOverrides['Bold'] = 'Bold (ctrl + b)';
    languageOverrides['Blockquote'] = 'Blockquote (alt + q)';
    languageOverrides['Code'] = 'Inline code (shift + ctrl + c)';
    languageOverrides['Italic'] = 'Italic (ctrl + i)';
    languageOverrides['Line'] = 'Line (ctrl + l)';
    languageOverrides['Ordered list'] = 'Ordered list (ctrl + o)';
    languageOverrides['Strike'] = 'Strike (ctrl + s)';
    languageOverrides['Task'] = 'Task (alt + t)';
    languageOverrides['Unordered list'] = 'Unordered list (ctrl + u)';
  }

  toastui.Editor.setLanguage('en-US', languageOverrides);
};
