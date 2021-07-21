goog.require('os.file.storage.mock');

// run the tests with and without IndexedDB support
describe('os.file.FileStorage', function() {
  const mockStorage = goog.module.get('os.file.storage.mock');
  mockStorage.runFileStorageTests(true);
  mockStorage.runFileStorageTests(false);
});
