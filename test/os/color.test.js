goog.require('goog.array');
goog.require('goog.object');
goog.require('os.color');


describe('os.color', function() {
  const googArray = goog.module.get('goog.array');
  const osColor = goog.module.get('os.color');

  it('should detect color strings properly', function() {
    //
    // passing cases
    //

    // hex string with or without leading 0x or #, including when padding is needed
    expect(osColor.isColorString('0xaabbcc')).toBe(true);
    expect(osColor.isColorString('0xaabb')).toBe(true);
    expect(osColor.isColorString('0xaa')).toBe(true);

    expect(osColor.isColorString('#aabbcc')).toBe(true);
    expect(osColor.isColorString('#aabb')).toBe(true);
    expect(osColor.isColorString('#aa')).toBe(true);

    expect(osColor.isColorString('aabbcc')).toBe(true);
    expect(osColor.isColorString('aabb')).toBe(true);
    expect(osColor.isColorString('aa')).toBe(true);

    // inconsequential spaces
    expect(osColor.isColorString('   0xaabbcc   ')).toBe(true);

    // case insensitive
    expect(osColor.isColorString('aAbBcC')).toBe(true);

    // no alpha
    expect(osColor.isColorString('rgba(255,255,255)')).toBe(true);

    // with alpha
    expect(osColor.isColorString('rgba(255,255,255,1)')).toBe(true);
    expect(osColor.isColorString('rgba(255,255,255,0.5)')).toBe(true);
    expect(osColor.isColorString('rgba(255,255,255,.12345)')).toBe(true);

    // arbitrary spaces
    expect(osColor.isColorString('   rgba  (   0 , 25    ,   255    ,   0.5    )   ')).toBe(true);

    //
    // failing cases
    //

    // invalid hex character
    expect(osColor.isColorString('0xaabbcg')).toBe(false);

    // space separating hex string
    expect(osColor.isColorString('0xaabb cc')).toBe(false);

    // rogue character
    expect(osColor.isColorString('rgba(255,255,25a)')).toBe(false);

    // missing blue
    expect(osColor.isColorString('rgba(255,255)')).toBe(false);

    // missing green/blue
    expect(osColor.isColorString('rgba(255)')).toBe(false);

    // missing red/green/blue
    expect(osColor.isColorString('rgba()')).toBe(false);

    // completely useless
    expect(osColor.isColorString('rgba')).toBe(false);
  });

  it('should convert colors properly', function() {
    expect(osColor.toHexString('rgba(255,136,68,1)')).toBe('#ff8844');
    expect(osColor.toHexString('  AB C Def')).toBe('#abcdef');
    expect(osColor.toHexString(' rgb(50, 150, 200)')).toBe('#3296c8');
    expect(osColor.toHexString([255, 0, 255, 1])).toBe('#ff00ff');
    expect(osColor.toHexString('0x00ff00')).toBe('#00ff00');

    expect(googArray.equals(osColor.toRgbArray('rgba(255,136,68,0.1)'), [255, 136, 68, 0.1])).toBeTruthy();
    expect(googArray.equals(osColor.toRgbArray('  AB C Def'), [171, 205, 239, 1])).toBeTruthy();
    expect(googArray.equals(osColor.toRgbArray(' rgb(50, 150, 200)'), [50, 150, 200, 1])).toBeTruthy();
    expect(googArray.equals(osColor.toRgbArray(' rgb(50, 150, 200, 0.5)'), [50, 150, 200, 0.5])).toBeTruthy();
    expect(googArray.equals(osColor.toRgbArray([255, 0, 255, 1]), [255, 0, 255, 1])).toBeTruthy();

    // 0x hex strings can have lower or upper case "x"
    expect(googArray.equals(osColor.toRgbArray('0x00ff00'), [0, 255, 0, 1])).toBeTruthy();
    expect(googArray.equals(osColor.toRgbArray('0X00ff00'), [0, 255, 0, 1])).toBeTruthy();
  });

  it('should pad hex colors', function() {
    // already padded
    expect(osColor.padHexColor('001122')).toBe('001122');
    expect(osColor.padHexColor('#001122')).toBe('001122');
    expect(osColor.padHexColor('0x001122')).toBe('001122');

    expect(osColor.padHexColor('001122', '0x')).toBe('0x001122');
    expect(osColor.padHexColor('#001122', '0x')).toBe('0x001122');
    expect(osColor.padHexColor('0x001122', '0x')).toBe('0x001122');

    expect(osColor.padHexColor('001122', '#')).toBe('#001122');
    expect(osColor.padHexColor('#001122', '#')).toBe('#001122');
    expect(osColor.padHexColor('0x001122', '#')).toBe('#001122');

    // not padded
    expect(osColor.padHexColor('1122')).toBe('001122');
    expect(osColor.padHexColor('#1122')).toBe('001122');
    expect(osColor.padHexColor('0x1122')).toBe('001122');

    expect(osColor.padHexColor('1122', '0x')).toBe('0x001122');
    expect(osColor.padHexColor('#1122', '0x')).toBe('0x001122');
    expect(osColor.padHexColor('0x1122', '0x')).toBe('0x001122');

    expect(osColor.padHexColor('1122', '#')).toBe('#001122');
    expect(osColor.padHexColor('#1122', '#')).toBe('#001122');
    expect(osColor.padHexColor('0x1122', '#')).toBe('#001122');

    // double not padded
    expect(osColor.padHexColor('22')).toBe('000022');
    expect(osColor.padHexColor('#22')).toBe('000022');
    expect(osColor.padHexColor('0x22')).toBe('000022');

    expect(osColor.padHexColor('22', '0x')).toBe('0x000022');
    expect(osColor.padHexColor('#22', '0x')).toBe('0x000022');
    expect(osColor.padHexColor('0x22', '0x')).toBe('0x000022');

    expect(osColor.padHexColor('22', '#')).toBe('#000022');
    expect(osColor.padHexColor('#22', '#')).toBe('#000022');
    expect(osColor.padHexColor('0x22', '#')).toBe('#000022');

    // invalid without default
    expect(osColor.padHexColor('')).toBe('ffffff');
    expect(osColor.padHexColor('', '#')).toBe('#ffffff');
    expect(osColor.padHexColor('', '0x')).toBe('0xffffff');

    expect(osColor.padHexColor('NaN')).toBe('ffffff');
    expect(osColor.padHexColor('NaN', '#')).toBe('#ffffff');
    expect(osColor.padHexColor('NaN', '0x')).toBe('0xffffff');

    expect(osColor.padHexColor('notacolor')).toBe('ffffff');
    expect(osColor.padHexColor('notacolor', '#')).toBe('#ffffff');
    expect(osColor.padHexColor('notacolor', '0x')).toBe('0xffffff');

    // invalid with default
    expect(osColor.padHexColor('', '0x', '#123456')).toBe('#123456');
    expect(osColor.padHexColor('', '#', '0x123456')).toBe('0x123456');

    expect(osColor.padHexColor('NaN', '0x', '#123456')).toBe('#123456');
    expect(osColor.padHexColor('NaN', '#', '0x123456')).toBe('0x123456');

    expect(osColor.padHexColor('notacolor', '0x', '#123456')).toBe('#123456');
    expect(osColor.padHexColor('notacolor', '#', '0x123456')).toBe('0x123456');
  });

  it('should normalize opacity values', function() {
    // basic values
    expect(osColor.normalizeOpacity(0)).toBe(0);
    expect(osColor.normalizeOpacity(1)).toBe(1);
    expect(osColor.normalizeOpacity(0.5)).toBe(0.5);

    // rounds to 2 decimal places
    expect(osColor.normalizeOpacity(0.503)).toBe(0.5);
    expect(osColor.normalizeOpacity(0.506)).toBe(0.51);

    // clamps between 0 and 1
    expect(osColor.normalizeOpacity(-1)).toBe(0);
    expect(osColor.normalizeOpacity(2)).toBe(1);
  });

  it('should adjust values for brightness, contrast, and saturation', function() {
    // Tests brightness and clamps
    var data = new Uint8ClampedArray([225, 0, 0, 0]);
    osColor.adjustColor(data, -1, 1, 1);
    expect(data).toEqual([0, 0, 0, 0]);

    // Tests contrast
    data = [100, 50, 50, 0];
    osColor.adjustColor(data, 0, 2, 1);
    expect(data).toEqual([199.5, 99.5, 99.5, 0]);

    // Tests saturation
    data = [20, 20, 200, 0];
    osColor.adjustColor(data, 0, 1, 0);
    expect(data).toEqual([34.760000000000005, 34.760000000000005, 34.760000000000005, 0]);

    // Tests all 3
    data = [0, 225, 225, 0];
    osColor.adjustColor(data, 0.5, 0.5, 0.5);
    expect(data).toEqual([151.64125, 207.89125, 207.89125, 0]);
  });

  it('should convert integer color representations to hex color strings', function() {
    expect(osColor.intToHex(0)).toBe('#000000');
    expect(osColor.intToHex(16777215)).toBe('#ffffff');
    expect(osColor.intToHex(65535)).toBe('#00ffff');
    expect(osColor.intToHex(123456)).toBe('#01e240');

    // negative numbers and numbers larger than 0xffffff should be clamped
    expect(osColor.intToHex(-5000)).toBe('#000000');
    expect(osColor.intToHex(99999999999)).toBe('#ffffff');
  });
});
