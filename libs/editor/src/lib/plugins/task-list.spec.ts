import { TaskItemState, TaskListPlugin } from '../../index';
import {
  dispatchKey,
  mountEditor,
  selectText,
} from '../../../testing/editor-test-utils';

describe('TaskListPlugin', () => {
  it('exposes stable task list commands, command state, and query state', () => {
    const mounted = mountEditor({
      content: '<p>Plan the release</p>',
      plugins: [TaskListPlugin],
    });

    try {
      const { editor } = mounted;

      expect(TaskListPlugin.key).toBe('taskList');
      expect(editor.hasCommandState('toggleTaskList')).toBe(true);
      expect(editor.hasCommandState('toggleTaskItemChecked')).toBe(true);
      expect(editor.hasQuery('taskItem')).toBe(true);
      expect(editor.execute('toggleTaskList')).toBe(true);
      expect(editor.isCommandActive('toggleTaskList')).toBe(true);
      expect(editor.query<TaskItemState>('taskItem')).toEqual({
        checked: false,
      });
      expect(editor.html()).toContain('<ul data-type="task-list">');
      expect(editor.html()).toContain(
        '<li data-type="task-item" data-checked="false">',
      );

      expect(editor.execute('toggleTaskItemChecked')).toBe(true);
      expect(editor.isCommandActive('toggleTaskItemChecked')).toBe(true);
      expect(editor.query<TaskItemState>('taskItem')).toEqual({
        checked: true,
      });
      expect(editor.html()).toContain(
        '<li data-type="task-item" data-checked="true">',
      );

      expect(editor.execute('setTaskItemChecked', false)).toBe(true);
      expect(editor.query<TaskItemState>('taskItem')).toEqual({
        checked: false,
      });
      expect(editor.canExecute('setTaskItemChecked')).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('parses serialized checked task items and updates from checkbox DOM events', () => {
    const mounted = mountEditor({
      content:
        '<ul data-type="task-list"><li data-type="task-item" data-checked="true"><div data-task-item-content><p>Ship tests</p></div></li></ul>',
      plugins: [TaskListPlugin],
    });

    try {
      const { editor, host } = mounted;

      expect(editor.query<TaskItemState>('taskItem')).toEqual({
        checked: true,
      });
      expect(editor.html()).toContain(
        '<li data-type="task-item" data-checked="true">',
      );

      const checkbox = host.querySelector<HTMLInputElement>(
        'li[data-type="task-item"] input[type="checkbox"]',
      );

      if (!checkbox) {
        throw new Error('Expected task item checkbox to render.');
      }

      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      expect(editor.query<TaskItemState>('taskItem')).toEqual({
        checked: false,
      });
      expect(editor.html()).toContain(
        '<li data-type="task-item" data-checked="false">',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('supports split, sink, and lift behavior through commands and keyboard handling', () => {
    const mounted = mountEditor({
      content:
        '<ul data-type="task-list"><li data-type="task-item"><div data-task-item-content><p>One</p></div></li><li data-type="task-item"><div data-task-item-content><p>Two</p></div></li></ul>',
      plugins: [TaskListPlugin],
    });

    try {
      const { editor, host } = mounted;

      selectText(editor, 'Two');

      const tabEvent = dispatchKey(editor, 'Tab');

      expect(tabEvent.defaultPrevented).toBe(true);
      expect(
        host.querySelectorAll(
          'ul[data-type="task-list"] ul[data-type="task-list"]',
        ),
      ).toHaveLength(1);

      const shiftTabEvent = dispatchKey(editor, 'Tab', { shiftKey: true });

      expect(shiftTabEvent.defaultPrevented).toBe(true);
      expect(
        host.querySelectorAll(
          'ul[data-type="task-list"] ul[data-type="task-list"]',
        ),
      ).toHaveLength(0);

      selectText(editor, 'One');

      expect(editor.execute('splitTaskItem')).toBe(true);
      expect(host.querySelectorAll('li[data-type="task-item"]')).toHaveLength(
        3,
      );
    } finally {
      mounted.unmount();
    }
  });
});
