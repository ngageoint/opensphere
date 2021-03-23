goog.require('os.ui.text.TuiEditorLang');

describe('os.ui.text.TuiEditorLang', () => {
  it('should set up with optional keys', () => {
    const language = 'en-US';
    const languageOverrides = {
      'Markdown': 'Text',
      'WYSIWYG': 'Visual'
    };

    spyOn(toastui.Editor, 'setLanguage');

    os.ui.text.TuiEditorLang.setup();

    expect(toastui.Editor.setLanguage).toHaveBeenCalledWith(language, languageOverrides);
  });
});
