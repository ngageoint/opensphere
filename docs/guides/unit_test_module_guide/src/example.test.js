// this test file is not a module, so
// const SomeModule = goog.require('package.SomeModule');
// will not work
goog.require('package.SomeModule');

describe('package.SomeModule', () => {
  const {default: SomeModule} = goog.module.get('package.SomeModule');

  it('should do stuff...', () => {
  });
});
