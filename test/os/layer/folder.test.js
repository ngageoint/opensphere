goog.require('os.MapContainer');
goog.require('os.data.ZOrder');
goog.require('os.layer.FolderManager');
goog.require('os.layer.folder');
goog.require('os.mock');

describe('os.layer.FolderManager', () => {
  const {default: FolderManager} = goog.module.get('os.layer.FolderManager');
  const {createOrEditFolder} = goog.module.get('os.layer.folder');

  const formSelector = 'div[ng-form="textForm"]';
  const windowSelector = 'div[label="Add Folder"]';

  let folder;

  beforeEach(() => {
    // clean up the global instance before each
    FolderManager.getInstance().clear();

    folder = {
      id: 'folder0',
      type: 'folder',
      name: 'My Folder',
      parentId: 'Feature Layers',
      children: [],
      collapsed: true
    };
  });

  it('should launch the create window UI', () => {
    let called = false;

    const callback = () => {
      called = true;
    };

    createOrEditFolder(folder, callback);

    waitsFor(() => !!document.querySelector(formSelector), 'confirm form to render');

    runs(() => {
      const windowEl = document.querySelector(windowSelector);
      expect(windowEl).toBeDefined();

      const inputEl = windowEl.querySelector('.js-confirm-input');
      expect(inputEl).toBeDefined();
      expect(inputEl.value).toBe('My Folder');

      windowEl.querySelector('button[type="submit"]').click();
    });

    waitsFor(() => !document.querySelector(formSelector), 'confirm form to close');

    runs(() => {
      expect(called).toBe(true);
    });
  });
});
