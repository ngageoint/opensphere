goog.require('os.mock');
goog.require('os.user.settings.FavoriteManager');

describe('os.user.settings.FavoriteManager', function() {
  var settings;

  beforeEach(function() {
    settings = os.settings;
    settings.setPersistenceEnabled(false);
  });

  afterEach(function() {
    settings.setPersistenceEnabled(true);
  });

  it('should start from scratch', function() {
    expect(os.favoriteManager.getFavorites().length).toBe(0);
  });

  it('should save favorites', function() {
    os.favoriteManager.save(os.user.settings.FavoriteType.DESCRIPTOR, '1', 'one');
    os.favoriteManager.save(os.user.settings.FavoriteType.DESCRIPTOR, '2', 'two');
    os.favoriteManager.save(os.user.settings.FavoriteType.DESCRIPTOR, '3', 'three');
    expect(os.favoriteManager.getFavorites().length).toBe(3);
  });

  it('should not add favorites that already exist', function() {
    os.favoriteManager.save(os.user.settings.FavoriteType.DESCRIPTOR, '3', 'three');
    expect(os.favoriteManager.getFavorites().length).toBe(3);
  });

  it('should retrieve favorites', function() {
    expect(goog.isDefAndNotNull(os.favoriteManager.getFavorite('1'))).toBe(true);
    expect(goog.isDefAndNotNull(os.favoriteManager.getFavorite('2'))).toBe(true);
    expect(goog.isDefAndNotNull(os.favoriteManager.getFavorite('3'))).toBe(true);
  });

  it('should remove favorites', function() {
    os.favoriteManager.removeFavorite('3');
    expect(os.favoriteManager.getFavorites().length).toBe(2);
  });

  // it('should add folder favorites', function() {
  //   var key = os.favoriteManager.createFolder();
  //   expect(goog.isDefAndNotNull(os.favoriteManager.getFavorite(key))).toBe(true);
  //   expect(os.favoriteManager.getFavorites().length).toBe(3);

  //   var nestedFolder = os.favoriteManager.createFolder(key);
  //   waitsFor(function() {
  //     return goog.isDefAndNotNull(os.favoriteManager.getFavorite(nestedFolder));
  //   });
  //   expect(goog.isDefAndNotNull(os.favoriteManager.getFavorite(nestedFolder))).toBe(true);
  //   expect(os.favoriteManager.getFavorites().length).toBe(3);
  // });

  // it('should retrieve folder favorites', function() {
  //   var folders = os.favoriteManager.getFolders();
  //   expect(folders.length).toBe(2);
  // });

  // it('should move favorites to a folder', function() {
  //   var folder = os.favoriteManager.getFolders()[1];
  //   os.favoriteManager.save(os.user.settings.FavoriteType.DESCRIPTOR, '1',
  //      'one', undefined, [folder['key']]);

  //   var favFolders = os.favoriteManager.getFavoriteFolders('1');
  //   expect(favFolders.length).toBe(1);
  // });


  // it('should get types of favorites', function() {
  //   var searchFavorites = os.favoriteManager.getFavTypes(os.favoriteManager.getFavorites(),
  //       [os.user.settings.FavoriteType.DESCRIPTOR]);
  //   expect(searchFavorites.length).toBe(2);
  // });
});
