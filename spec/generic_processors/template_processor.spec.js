'use strict';

const init = require('../../lib/generic_processors/template_processor');

describe('generic template processor', () => {
  let genericTemplateProcessor;

  const pugTemplateProcessor = {
    process: jasmine.createSpy('process spy'),
    extensions: ['.pug'],
  };

  const templateProcessors = new Map();
  templateProcessors.set('pug', pugTemplateProcessor);
  const helpers = {
    helperFn() {},
  };
  const defaultOpts = {
    path: 'foobar',
    global: { foo: 'bar' },
    pug: { bar: 'baz' },
  };
  const templates = new Map();
  templates.set('dummyJadeTemplate', {
    ext: '.jade',
  });
  templates.set('dummyPugTemplate', {
    ext: '.pug',
    template: 'template contents',
  });

  beforeAll(() => {
    genericTemplateProcessor = init(templateProcessors, templates, defaultOpts, helpers);
  });

  afterEach(() => {
    pugTemplateProcessor.process.calls.reset();
  });

  it('should offer direct access to the pug template processor', () => {
    expect(typeof genericTemplateProcessor.pug).toBe('function');
  });

  it('should throw an error if no processor is found for the given file', () => {
    const fn = function () {
      genericTemplateProcessor('dummyJadeTemplate', {}, {});
    };

    expect(fn).toThrowError(`No template processor found for extension: .jade.`);
  });

  it('should throw an error if the template is not found', () => {
    const fn = function () {
      genericTemplateProcessor('doesNotExist', {}, {});
    };

    expect(fn).toThrowError(`Template: "doesNotExist" does not exist`);
  });

  it('should call the process function with the contents of the template', () => {
    genericTemplateProcessor('dummyPugTemplate', {}, {});

    expect(pugTemplateProcessor.process.calls.argsFor(0)[0]).toBe('template contents');
  });

  it('should return the output of the process function', () => {
    const templateProcessors = new Map().set('pug', {
      process(contents) { return contents; },
      extensions: ['.pug'],
    });
    const genericTemplateProcessor = init(templateProcessors, templates, defaultOpts, helpers);

    const res = genericTemplateProcessor('dummyPugTemplate', {}, {});
    expect(res).toBe('template contents');
  });

  it('should add a filenameWithPath property to the options', () => {
    genericTemplateProcessor('dummyPugTemplate', {}, {});

    expect(pugTemplateProcessor.process.calls.argsFor(0)[1]).toEqual({
      filenameWithPath: `${process.cwd()}/foobar/dummyPugTemplate.pug`,
      bar: 'baz',
      foo: 'bar',
    });
  });

  it('should merge defaultOpts and given options and pass those to process. Given options override defaultOpts', () => {
    genericTemplateProcessor('dummyPugTemplate', {}, { bar: 'foobar' });

    expect(pugTemplateProcessor.process.calls.argsFor(0)[1]).toEqual({
      filenameWithPath: `${process.cwd()}/foobar/dummyPugTemplate.pug`,
      bar: 'foobar',
      foo: 'bar',
    });
  });

  it('should overwrite the global options with the processor options', () => {
    const defaultOpts = {
      path: 'foobar',
      global: { foo: 'bar' },
      pug: { foo: 'baz' },
    };

    const genericTemplateProcessor = init(templateProcessors, templates, defaultOpts, helpers);

    genericTemplateProcessor('dummyPugTemplate', {}, {});
    expect(pugTemplateProcessor.process.calls.argsFor(0)[1]).toEqual({
      filenameWithPath: `${process.cwd()}/foobar/dummyPugTemplate.pug`,
      foo: 'baz',
    });
  });

  it('should pass the given template variables as 3rd argument to process', () => {
    genericTemplateProcessor('dummyPugTemplate', { foo: 'bar', bar: 'baz' }, {});

    expect(pugTemplateProcessor.process.calls.argsFor(0)[2]).toEqual({
      foo: 'bar',
      bar: 'baz',
    });
  });

  it('should pass the helper functions as last argument to process', () => {
    genericTemplateProcessor('dummyPugTemplate', {}, {});

    expect(pugTemplateProcessor.process.calls.argsFor(0)[3].helperFn).not.toBeUndefined();
  });
});
