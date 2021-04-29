goog.require('os.ui.text');

describe('os.ui.text', () => {
  it('should copy blank text', () => {
    spyOn(document, 'createElement').andCallThrough();

    os.ui.text.copy('');

    expect(document.createElement).not.toHaveBeenCalled();

    document.createElement.reset();
    expect(document.createElement).not.toHaveBeenCalled();

    os.ui.text.copy('   ');

    expect(document.createElement).not.toHaveBeenCalled();
  });

  it('should copy valid text', () => {
    spyOn(os.ui.window, 'create');
    spyOn(document, 'execCommand').andReturn(true);
    spyOn(os.alert.AlertManager.getInstance(), 'sendAlert');

    os.ui.text.copy('test');

    expect(os.alert.AlertManager.getInstance().sendAlert).toHaveBeenCalled();
    expect(os.ui.window.create).not.toHaveBeenCalled();

    document.execCommand.andReturn(false);

    os.ui.text.copy('test');

    expect(os.ui.window.create).toHaveBeenCalled();
  });
});
