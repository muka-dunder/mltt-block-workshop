import * as Blockly from 'blockly/core';
import * as en from 'blockly/msg/en';
import * as zhCN from 'blockly/msg/zh-hans';
import { LexicalVariablesPlugin } from '@mit-app-inventor/blockly-block-lexical-variables/core';
import './ui/style.css';

// Existing app modules also serve the Node checker/demo. Initialize their
// browser globals in dependency order while keeping those Node entry points.
window.Blockly = Blockly;
window.LexicalVariablesPlugin = LexicalVariablesPlugin;
window.BLOCKLY_MESSAGES = { en, 'zh-CN': zhCN };
window.BLOCKLY_MEDIA = `${import.meta.env.BASE_URL}media/`;

async function start() {
  await import('./i18n/locales/blocks.js');
  await import('./i18n/locales/levels.zh-CN.js');
  await import('./i18n/locales/errors.js');
  await import('./i18n/index.js');
  await import('./core/runtime.js');
  await import('./core/printing.js');
  await import('./core/checking.js');
  await import('./core/eliminators.js');
  await import('./core/eliminator-terms.js');
  await import('./core/entry-checking.js');
  await import('./core/block-checking.js');
  await import('./core/mltt.js');
  await import('./levels/foundations.js');
  await import('./levels/advanced.js');
  await import('./levels/proofs.js');
  await import('./levels/index.js');
  await import('./blockly/scope.js');
  await import('./blockly/blocks.js');
  await import('./blockly/sequences.js');
  await import('./blockly/rules.js');
  await import('./blockly/judgments.js');
  await import('./blockly/sequence-menus.js');
  await import('./blockly/problems.js');
  await import('./blockly/locking.js');
  await import('./ui/app.js');
}

start().catch((error) => {
  console.error(error);
  document.querySelector('#status').textContent = '应用加载失败 / Failed to load the application.';
});
