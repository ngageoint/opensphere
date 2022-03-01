goog.require('os.alert.AlertManager');
goog.require('os.ui.text');

describe('os.ui.text', () => {
  const {default: AlertManager} = goog.module.get('os.alert.AlertManager');
  const text = goog.module.get('os.ui.text');

  const windowSelector = 'div[label="Copy"]';

  it('should copy blank text', () => {
    spyOn(document, 'createElement').andCallThrough();

    text.copy('');

    expect(document.createElement).not.toHaveBeenCalled();

    document.createElement.reset();
    expect(document.createElement).not.toHaveBeenCalled();

    text.copy('   ');

    expect(document.createElement).not.toHaveBeenCalled();
  });

  it('should copy valid text', () => {
    spyOn(document, 'execCommand').andReturn(true);
    spyOn(AlertManager.getInstance(), 'sendAlert');

    text.copy('test');

    expect(AlertManager.getInstance().sendAlert).toHaveBeenCalled();
    expect(document.querySelector(windowSelector)).toBeNull();

    document.execCommand.andReturn(false);

    text.copy('test');

    waitsFor(() => !!document.querySelector(windowSelector), 'window to open');

    runs(() => {
      const bodyEl = document.querySelector(`${windowSelector} .modal-body`);
      const scope = $(bodyEl).scope();
      expect(scope).toBeDefined();
      expect(scope.textPrompt).toBeDefined();

      scope.textPrompt.close();
    });

    waitsFor(() => !document.querySelector(windowSelector), 'window to close');
  });
});
