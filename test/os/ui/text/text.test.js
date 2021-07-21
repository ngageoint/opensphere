goog.require('os.alert.AlertManager');
goog.require('os.ui.text');
goog.require('os.ui.window');

describe('os.ui.text', () => {
  const AlertManager = goog.module.get('os.alert.AlertManager');
  const text = goog.module.get('os.ui.text');
  const osWindow = goog.module.get('os.ui.window');

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
    spyOn(osWindow, 'create');
    spyOn(document, 'execCommand').andReturn(true);
    spyOn(AlertManager.getInstance(), 'sendAlert');

    text.copy('test');

    expect(AlertManager.getInstance().sendAlert).toHaveBeenCalled();
    expect(osWindow.create).not.toHaveBeenCalled();

    document.execCommand.andReturn(false);

    text.copy('test');

    expect(osWindow.create).toHaveBeenCalled();
  });
});
