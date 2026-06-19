import { NodeSpec } from 'prosemirror-model';

import {
  createConfigurableQalmaPlugin,
  createQalmaEditor,
  createQalmaPlugin,
} from '../../index';

describe('Qalma plugin contract', () => {
  it('rejects duplicate plugin extension points before mounting', () => {
    const blockNode: NodeSpec = {
      group: 'block',
    };

    expect(() =>
      createQalmaEditor({
        plugins: [
          createQalmaPlugin({ key: 'duplicate' }),
          createQalmaPlugin({ key: 'duplicate' }),
        ],
      }),
    ).toThrowError('Duplicate QALMA plugin key "duplicate".');

    expect(() =>
      createQalmaEditor({
        plugins: [
          createQalmaPlugin({
            key: 'first',
            nodes: { customBlock: blockNode },
          }),
          createQalmaPlugin({
            key: 'second',
            nodes: { customBlock: blockNode },
          }),
        ],
      }),
    ).toThrowError(
      'QALMA plugin "second" defines duplicate node "customBlock".',
    );

    expect(() =>
      createQalmaEditor({
        plugins: [
          createQalmaPlugin({
            key: 'first',
            marks: { customMark: {} },
          }),
          createQalmaPlugin({
            key: 'second',
            marks: { customMark: {} },
          }),
        ],
      }),
    ).toThrowError(
      'QALMA plugin "second" defines duplicate mark "customMark".',
    );

    expect(() =>
      createQalmaEditor({
        plugins: [
          createQalmaPlugin({
            key: 'unknownNode',
            extendNodes: () => ({ missingNode: blockNode }),
          }),
        ],
      }),
    ).toThrowError(
      'QALMA plugin "unknownNode" extends unknown node "missingNode".',
    );
  });

  it('rejects duplicate runtime registries before mounting', () => {
    const command = () => true;
    const query = () => true;

    expect(() =>
      createQalmaEditor({
        plugins: [
          createQalmaPlugin({
            key: 'first',
            commands: () => ({ runSharedCommand: command }),
          }),
          createQalmaPlugin({
            key: 'second',
            commands: () => ({ runSharedCommand: command }),
          }),
        ],
      }),
    ).toThrowError(
      'QALMA plugin "second" defines duplicate command "runSharedCommand".',
    );

    expect(() =>
      createQalmaEditor({
        plugins: [
          createQalmaPlugin({
            key: 'first',
            commandStates: () => ({ runSharedCommand: query }),
          }),
          createQalmaPlugin({
            key: 'second',
            commandStates: () => ({ runSharedCommand: query }),
          }),
        ],
      }),
    ).toThrowError(
      'QALMA plugin "second" defines duplicate command state "runSharedCommand".',
    );

    expect(() =>
      createQalmaEditor({
        plugins: [
          createQalmaPlugin({
            key: 'first',
            queries: () => ({ sharedState: query }),
          }),
          createQalmaPlugin({
            key: 'second',
            queries: () => ({ sharedState: query }),
          }),
        ],
      }),
    ).toThrowError(
      'QALMA plugin "second" defines duplicate query "sharedState".',
    );

    expect(() => {
      const editor = createQalmaEditor({
        plugins: [
          createQalmaPlugin({
            key: 'first',
            shortcuts: () => ({ 'Mod-k': command }),
          }),
          createQalmaPlugin({
            key: 'second',
            shortcuts: () => ({ 'Mod-k': command }),
          }),
        ],
      });

      editor.mount(document.createElement('div'));
    }).toThrowError(
      'QALMA plugin "second" defines duplicate shortcut "Mod-k".',
    );
  });

  it('keeps configurable plugin defaults immutable and validates resolved options early', () => {
    interface ExamplePluginOptions {
      enabled: boolean;
      label: string;
    }

    const defaultOptions: Readonly<ExamplePluginOptions> = Object.freeze({
      enabled: true,
      label: 'default',
    });
    const ConfigurablePlugin = createConfigurableQalmaPlugin(
      defaultOptions,
      (options) => {
        if (typeof options.enabled !== 'boolean') {
          throw new TypeError('ExamplePlugin enabled must be a boolean.');
        }

        if (options.label.trim() === '') {
          throw new TypeError('ExamplePlugin label must be non-empty.');
        }

        return createQalmaPlugin({
          key: 'configurableExample',
          commands: () => ({
            runExample: () => options.enabled,
          }),
        });
      },
    );
    const configured = ConfigurablePlugin.configure({
      enabled: false,
    });
    const reconfigured = configured.configure({
      label: 'next',
    });

    expect(Object.isFrozen(ConfigurablePlugin.options)).toBe(true);
    expect(Object.isFrozen(configured.options)).toBe(true);
    expect(ConfigurablePlugin.options).toEqual(defaultOptions);
    expect(configured.options).toEqual({
      enabled: false,
      label: 'default',
    });
    expect(reconfigured.options).toEqual({
      enabled: false,
      label: 'next',
    });
    expect(configured.options).toEqual({
      enabled: false,
      label: 'default',
    });
    expect(() =>
      ConfigurablePlugin.configure({
        enabled: 'yes' as never,
      }),
    ).toThrowError('ExamplePlugin enabled must be a boolean.');
    expect(() =>
      ConfigurablePlugin.configure({
        label: '',
      }),
    ).toThrowError('ExamplePlugin label must be non-empty.');
  });
});
