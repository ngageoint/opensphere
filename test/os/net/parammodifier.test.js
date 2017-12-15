goog.require('os.net.ParamModifier');
goog.require('goog.Uri');

describe('os.net.ParamModifier', function() {
  var replaceParam = 'testParam';
  var replaceTerm = 'dumb';
  var replacement = 'great';
  
  it('should replace a specified parameter in a uri', function() {
    var uri = new goog.Uri();
    var oldValue = 'this is a ' + replaceTerm + ' test';
    uri.getQueryData().set(replaceParam, oldValue);
    
    expect(uri.getQueryData().get(replaceParam)).toBe(oldValue);
    
    var modifier = new os.net.ParamModifier('testId', replaceParam, replaceTerm, replacement);
    modifier.modify(uri);
    
    var newValue = 'this is a ' + replacement + ' test';
    expect(uri.getQueryData().get(replaceParam)).toBe(newValue);
  });
  
  it('should change the replacement value', function() {
    var uri = new goog.Uri();
    var oldValue = 'this is a ' + replaceTerm + ' test';
    uri.getQueryData().set(replaceParam, oldValue);
    expect(uri.getQueryData().get(replaceParam)).toBe(oldValue);
    
    var modifier = new os.net.ParamModifier('testId', replaceParam, replaceTerm, '');
    modifier.modify(uri);
    
    var newValue = 'this is a  test';
    expect(uri.getQueryData().get(replaceParam)).toBe(newValue);
    
    uri.getQueryData().set(replaceParam, oldValue);
    modifier.setReplacement(replacement);
    modifier.modify(uri);
    
    var newValue = 'this is a ' + replacement + ' test';
    expect(uri.getQueryData().get(replaceParam)).toBe(newValue);
  });
  
  it('should throw errors when missing fields', function() {
    var uri = new goog.Uri();
    var oldValue = 'this is a ' + replaceTerm + ' test';
    uri.getQueryData().set(replaceParam, oldValue);
    
    var executeModifier = function() {
      modifier.modify(uri.clone());
    };
    
    var modifier = new os.net.ParamModifier('testId', replaceParam, replaceTerm, replacement);
    expect(executeModifier).not.toThrow();
    
    modifier.replacement_ = undefined;
    expect(executeModifier).toThrow();
    modifier.replacement_ = null;
    expect(executeModifier).toThrow();
    modifier.replacement_ = '';
    expect(executeModifier).not.toThrow();
    
    modifier.replaceTerm_ = null;
    expect(executeModifier).toThrow();
    modifier.replaceTerm_ = undefined;
    expect(executeModifier).toThrow();
    modifier.replaceTerm_ = '';
    expect(executeModifier).toThrow();
    modifier.replaceTerm_ = replaceTerm;
    expect(executeModifier).not.toThrow();
    
    modifier.param_ = null;
    expect(executeModifier).toThrow();
    modifier.param_ = undefined;
    expect(executeModifier).toThrow();
    modifier.param_ = '';
    expect(executeModifier).toThrow();
    modifier.param_ = 'notAParam';
    expect(executeModifier).not.toThrow();
  });
});