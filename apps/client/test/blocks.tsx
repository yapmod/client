import { onCleanup } from 'solid-js';
import client from '../src/index';
import { removePlugin, stopPlugin } from '../src/features/plugins/runtime';
import { applyDevUpdate } from '../src/features/dev/apply';

const output = document.querySelector('output')!;
const first = document.querySelector('textarea')!;
const second = document.querySelector<HTMLTextAreaElement>('.msg-input')!;
const id = 'client:reactive-block-test';
let mounts = 0;
let cleanups = 0;
let removeCaption: () => void;
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

function check(condition: boolean, message: string) {
  if (!condition) throw Error(message);
}

function checkText(...expected: string[]) {
  const actual = [...document.querySelectorAll('.yp-composer-status')].map((el) => el.textContent);
  check(JSON.stringify(actual) === JSON.stringify(expected), `Expected ${expected}, got ${actual}`);
}

try {
  removePlugin('dev:blocks-fixture');
  client.registerClientPlugin({
    id,
    manifest: { name: 'Block fixtures', author: 'Test', description: 'Synthetic draft data' },
    setup(api) {
      api.composer.registerStatus((s) => String(s.length));
      api.composer.registerBlock((s) => {
        mounts++;
        onCleanup(() => cleanups++);
        return <strong>{s.maxLength === null ? ' unlimited' : ` / ${s.maxLength}`}</strong>;
      });
      removeCaption = api.composer.registerBlock((s) => <em>{s.length ? ' draft' : ' empty'}</em>);
      api.composer.registerBlock((s) => {
        return (
          <span>
            {(() => {
              if (s.length === 2) throw Error('intentional reactive failure');
              return '·';
            })()}
          </span>
        );
      });
      return {};
    },
  });
  checkText('1 / 4 draft·', '0 unlimited empty·');
  check(mounts === 2 && cleanups === 0, 'Expected one mount per composer');
  first.value = '😀';
  first.dispatchEvent(new Event('input', { bubbles: true }));
  second.maxLength = 0;
  await settle();
  checkText('2 / 4 draft', '0 / 0 empty·');
  check(mounts === 2 && cleanups === 0, 'An input change remounted a sibling');
  const replacement = first.cloneNode(true) as HTMLTextAreaElement;
  replacement.value = 'A';
  first.replaceWith(replacement);
  await settle();
  checkText('1 / 4 draft·', '0 / 0 empty·');
  check(mounts === 3 && cleanups === 1, 'Replacing a composer did not dispose just its own mount');
  removeCaption!();
  removeCaption!();
  checkText('1 / 4·', '0 / 0·');

  const payload = {
    id: 'dev:blocks-fixture',
    name: 'Reloaded block',
    author: 'Test',
    description: '',
  };
  const push = (code: string) => applyDevUpdate({ ...payload, code });
  const ok = await push('(api) => ({ onLoad() { api.composer.registerBlock(() => " dev"); } })');
  check(ok.ok, 'Could not start dev plugin');
  const failed = await push(
    '(api) => { api.composer.registerBlock(() => " leak"); throw Error("test"); }',
  );
  check(!failed.ok, 'Bad dev build was accepted');
  checkText('1 / 4· dev', '0 / 0· dev');
  stopPlugin(id);
  check(cleanups === mounts, 'Unloading did not dispose all remaining owners');
  checkText(' dev', ' dev');
  client.dispose();
  checkText();
  output.textContent = 'Passed';
} catch (error) {
  output.textContent = 'Failed: ' + error;
  throw error;
} finally {
  removePlugin('dev:blocks-fixture');
  client.dispose();
}
