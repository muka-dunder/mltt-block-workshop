import * as Blockly from 'blockly/core';
import * as en from 'blockly/msg/en';
import { LexicalVariablesPlugin } from '@mit-app-inventor/blockly-block-lexical-variables/core';
import './ui/style.css';

// Existing app modules also serve the Node checker/demo. Initialize their
// browser globals in dependency order while keeping those Node entry points.
window.Blockly = Blockly;
window.LexicalVariablesPlugin = LexicalVariablesPlugin;
Object.assign(Blockly.Msg, en);
window.BLOCKLY_MEDIA = `${import.meta.env.BASE_URL}media/`;

async function start() {
  await import('./core/mltt.js');
  await import('./levels/index.js');
  await import('./blockly/blocks.js');
  await import('./ui/app.js');
}

start().catch((error) => {
  console.error(error);
  document.querySelector('#status').textContent = 'Failed to load the application.';
});
