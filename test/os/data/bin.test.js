goog.require('os.histo.Bin');
goog.require('os.histo.bin');


describe('os.histo.Bin', function() {
  const Bin = goog.module.get('os.histo.Bin');
  const osHistoBin = goog.module.get('os.histo.bin');

  var item = {
    id: '1',
    data: 'hello'
  };

  it('should add items', function() {
    var bin = new Bin();
    bin.addItem(item);

    expect(bin.getCount()).toBe(1);
    expect(bin.getItems()).toContain(item);
  });

  it('should remove items', function() {
    var bin = new Bin();
    bin.addItem(item);

    expect(bin.getCount()).toBe(1);
    expect(bin.getItems()).toContain(item);

    bin.removeItem(item);
    expect(bin.getCount()).toBe(0);
    expect(bin.getItems()).not.toContain(item);
  });

  describe('sort', function() {
    it('should sort by bin size', function() {
      var bin1 = new Bin();
      var bin2 = new Bin();
      var bin3 = new Bin();

      bin1.addItem('1');

      bin2.addItem('1');
      bin2.addItem('2');

      bin3.addItem('1');
      bin3.addItem('2');
      bin3.addItem('3');

      var bins = [bin2, bin3, bin1];

      // ascending
      bins.sort(osHistoBin.sortByCount);
      expect(bins).toEqual([bin1, bin2, bin3]);

      // descending
      bins.sort(osHistoBin.sortByCountDesc);
      expect(bins).toEqual([bin3, bin2, bin1]);
    });

    it('should sort by key', function() {
      var bin1 = new Bin();
      var bin2 = new Bin();
      var bin3 = new Bin();

      bin1.setKey('a');
      bin2.setKey('b');
      bin3.setKey('c');

      var bins = [bin2, bin3, bin1];

      // ascending
      bins.sort(osHistoBin.sortByKey);
      expect(bins).toEqual([bin1, bin2, bin3]);

      // descending
      bins.sort(osHistoBin.sortByKeyDesc);
      expect(bins).toEqual([bin3, bin2, bin1]);
    });

    it('should sort by label', function() {
      var bin1 = new Bin();
      var bin2 = new Bin();
      var bin3 = new Bin();

      // these should be sorted as if they were numbers, not strings
      bin1.setLabel('9');
      bin2.setLabel('10');
      bin3.setLabel('11');

      var bins = [bin2, bin3, bin1];

      // ascending
      bins.sort(osHistoBin.sortByLabel);
      expect(bins).toEqual([bin1, bin2, bin3]);

      // descending
      bins.sort(osHistoBin.sortByLabelDesc);
      expect(bins).toEqual([bin3, bin2, bin1]);
    });
  });
});
