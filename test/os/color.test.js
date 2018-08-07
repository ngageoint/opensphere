goog.require('os.color');
goog.require('goog.array');
goog.require('goog.object');


describe('os.color', function() {
  it('should detect color strings properly', function() {
    //
    // passing cases
    //

    // hex string with or without leading 0x or #, including when padding is needed
    expect(os.color.isColorString('0xaabbcc')).toBe(true);
    expect(os.color.isColorString('0xaabb')).toBe(true);
    expect(os.color.isColorString('0xaa')).toBe(true);

    expect(os.color.isColorString('#aabbcc')).toBe(true);
    expect(os.color.isColorString('#aabb')).toBe(true);
    expect(os.color.isColorString('#aa')).toBe(true);

    expect(os.color.isColorString('aabbcc')).toBe(true);
    expect(os.color.isColorString('aabb')).toBe(true);
    expect(os.color.isColorString('aa')).toBe(true);

    // inconsequential spaces
    expect(os.color.isColorString('   0xaabbcc   ')).toBe(true);

    // case insensitive
    expect(os.color.isColorString('aAbBcC')).toBe(true);

    // no alpha
    expect(os.color.isColorString('rgba(255,255,255)')).toBe(true);

    // with alpha
    expect(os.color.isColorString('rgba(255,255,255,1)')).toBe(true);
    expect(os.color.isColorString('rgba(255,255,255,0.5)')).toBe(true);
    expect(os.color.isColorString('rgba(255,255,255,.12345)')).toBe(true);

    // arbitrary spaces
    expect(os.color.isColorString('   rgba  (   0 , 25    ,   255    ,   0.5    )   ')).toBe(true);

    //
    // failing cases
    //

    // invalid hex character
    expect(os.color.isColorString('0xaabbcg')).toBe(false);

    // space separating hex string
    expect(os.color.isColorString('0xaabb cc')).toBe(false);

    // rogue character
    expect(os.color.isColorString('rgba(255,255,25a)')).toBe(false);

    // missing blue
    expect(os.color.isColorString('rgba(255,255)')).toBe(false);

    // missing green/blue
    expect(os.color.isColorString('rgba(255)')).toBe(false);

    // missing red/green/blue
    expect(os.color.isColorString('rgba()')).toBe(false);

    // completely useless
    expect(os.color.isColorString('rgba')).toBe(false);
  });

  it('should convert colors properly', function() {
    expect(os.color.toHexString('rgba(255,136,68,1)')).toBe('#ff8844');
    expect(os.color.toHexString('  AB C Def')).toBe('#abcdef');
    expect(os.color.toHexString(' rgb(50, 150, 200)')).toBe('#3296c8');
    expect(os.color.toHexString([255, 0, 255, 1])).toBe('#ff00ff');
    expect(os.color.toHexString('0x00ff00')).toBe('#00ff00');

    expect(goog.array.equals(os.color.toRgbArray('rgba(255,136,68,0.1)'), [255, 136, 68, 0.1])).toBeTruthy();
    expect(goog.array.equals(os.color.toRgbArray('  AB C Def'), [171, 205, 239, 1])).toBeTruthy();
    expect(goog.array.equals(os.color.toRgbArray(' rgb(50, 150, 200)'), [50, 150, 200, 1])).toBeTruthy();
    expect(goog.array.equals(os.color.toRgbArray(' rgb(50, 150, 200, 0.5)'), [50, 150, 200, 0.5])).toBeTruthy();
    expect(goog.array.equals(os.color.toRgbArray([255, 0, 255, 1]), [255, 0, 255, 1])).toBeTruthy();

    // 0x hex strings can have lower or upper case "x"
    expect(goog.array.equals(os.color.toRgbArray('0x00ff00'), [0, 255, 0, 1])).toBeTruthy();
    expect(goog.array.equals(os.color.toRgbArray('0X00ff00'), [0, 255, 0, 1])).toBeTruthy();
  });

  it('should pad hex colors', function() {
    // already padded
    expect(os.color.padHexColor('001122')).toBe('001122');
    expect(os.color.padHexColor('#001122')).toBe('001122');
    expect(os.color.padHexColor('0x001122')).toBe('001122');

    expect(os.color.padHexColor('001122', '0x')).toBe('0x001122');
    expect(os.color.padHexColor('#001122', '0x')).toBe('0x001122');
    expect(os.color.padHexColor('0x001122', '0x')).toBe('0x001122');

    expect(os.color.padHexColor('001122', '#')).toBe('#001122');
    expect(os.color.padHexColor('#001122', '#')).toBe('#001122');
    expect(os.color.padHexColor('0x001122', '#')).toBe('#001122');

    // not padded
    expect(os.color.padHexColor('1122')).toBe('001122');
    expect(os.color.padHexColor('#1122')).toBe('001122');
    expect(os.color.padHexColor('0x1122')).toBe('001122');

    expect(os.color.padHexColor('1122', '0x')).toBe('0x001122');
    expect(os.color.padHexColor('#1122', '0x')).toBe('0x001122');
    expect(os.color.padHexColor('0x1122', '0x')).toBe('0x001122');

    expect(os.color.padHexColor('1122', '#')).toBe('#001122');
    expect(os.color.padHexColor('#1122', '#')).toBe('#001122');
    expect(os.color.padHexColor('0x1122', '#')).toBe('#001122');

    // double not padded
    expect(os.color.padHexColor('22')).toBe('000022');
    expect(os.color.padHexColor('#22')).toBe('000022');
    expect(os.color.padHexColor('0x22')).toBe('000022');

    expect(os.color.padHexColor('22', '0x')).toBe('0x000022');
    expect(os.color.padHexColor('#22', '0x')).toBe('0x000022');
    expect(os.color.padHexColor('0x22', '0x')).toBe('0x000022');

    expect(os.color.padHexColor('22', '#')).toBe('#000022');
    expect(os.color.padHexColor('#22', '#')).toBe('#000022');
    expect(os.color.padHexColor('0x22', '#')).toBe('#000022');

    // invalid without default
    expect(os.color.padHexColor('')).toBe('ffffff');
    expect(os.color.padHexColor('', '#')).toBe('#ffffff');
    expect(os.color.padHexColor('', '0x')).toBe('0xffffff');

    expect(os.color.padHexColor('NaN')).toBe('ffffff');
    expect(os.color.padHexColor('NaN', '#')).toBe('#ffffff');
    expect(os.color.padHexColor('NaN', '0x')).toBe('0xffffff');

    expect(os.color.padHexColor('notacolor')).toBe('ffffff');
    expect(os.color.padHexColor('notacolor', '#')).toBe('#ffffff');
    expect(os.color.padHexColor('notacolor', '0x')).toBe('0xffffff');

    // invalid with default
    expect(os.color.padHexColor('', '0x', '#123456')).toBe('#123456');
    expect(os.color.padHexColor('', '#', '0x123456')).toBe('0x123456');

    expect(os.color.padHexColor('NaN', '0x', '#123456')).toBe('#123456');
    expect(os.color.padHexColor('NaN', '#', '0x123456')).toBe('0x123456');

    expect(os.color.padHexColor('notacolor', '0x', '#123456')).toBe('#123456');
    expect(os.color.padHexColor('notacolor', '#', '0x123456')).toBe('0x123456');
  });

  it('should normalize opacity values', function() {
    // basic values
    expect(os.color.normalizeOpacity(0)).toBe(0);
    expect(os.color.normalizeOpacity(1)).toBe(1);
    expect(os.color.normalizeOpacity(0.5)).toBe(0.5);

    // rounds to 2 decimal places
    expect(os.color.normalizeOpacity(0.503)).toBe(0.5);
    expect(os.color.normalizeOpacity(0.506)).toBe(0.51);

    // clamps between 0 and 1
    expect(os.color.normalizeOpacity(-1)).toBe(0);
    expect(os.color.normalizeOpacity(2)).toBe(1);
  });

  it('should adjust values for brightness, contrast, and saturation', function() {
    // Tests brightness and clamps
    var data = [225, 0, 0, 0];
    os.color.adjustColor(data, -1, 1, 1);
    expect(data).toBe([0, 0, 0, 0]);

    // Tests contrast
    data = [100, 50, 50, 0];
    os.color.adjustColor(data, 0, 2, 1);
    expect(data).toBe([200, 100, 100, 0]);

    // Tests saturation
    data = [20, 20, 200, 0];
    os.color.adjustColor(data, 0, 1, 0);
    expect(data).toBe([35, 35, 35, 0]);

    // Tests all 3
    data = [0, 225, 225, 0];
    os.color.adjustColor(data, 0.5, 0.5, 0.5);
    expect(data).toBe([152, 208, 208, 0]);
  });
});
