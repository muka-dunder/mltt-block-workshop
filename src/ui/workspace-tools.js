/* Workspace presentation, block serialization, and lexical-reference feedback. */
// ---------- Theme ----------
export function makeTheme() {
  const base = (Blockly.Themes && Blockly.Themes.Classic) || undefined;
  return Blockly.Theme.defineTheme('mlttDark', {
    base,
    componentStyles: {
      workspaceBackgroundColour: '#0f1218',
      toolboxBackgroundColour: '#151a23',
      toolboxForegroundColour: '#dfe6f0',
      flyoutBackgroundColour: '#1a202b',
      flyoutForegroundColour: '#dfe6f0',
      flyoutOpacity: 1,
      scrollbarColour: '#39445a',
      scrollbarOpacity: 0.7,
      insertionMarkerColour: '#8fd0a8',
      insertionMarkerOpacity: 0.4,
      cursorColour: '#8fd0a8',
    },
    fontStyle: { family: 'ui-sans-serif, system-ui, -apple-system, "PingFang SC", "Noto Sans SC", sans-serif', size: 14 },
  });
}

// ---------- Blocks -> JSON ----------
export function toJson(b) {
  const j = { type: b.type, id: b.id, fields: {}, inputs: {} };
  if (b.ttBinds) { j.binds = b.ttBinds; j.names = {}; }
  for (const inp of b.inputList) {
    for (const f of inp.fieldRow) if (f.name) j.fields[f.name] = f.getValue();
    if (inp.connection) {
      const t = inp.connection.targetBlock();
      if (t) j.inputs[inp.name] = toJson(t);
    }
  }
  if (b.ttBinds && b.ttNameFields) {
    for (const uids of Object.values(b.ttBinds)) {
      for (const uid of uids) {
        const fname = b.ttNameFields[uid];
        j.names[uid] = fname ? (b.getFieldValue(fname) || 'x') : 'x';
      }
    }
  }
  return j;
}
export function createVariableTools({ getWorkspace, getBusy, setBusy }) {
  const t = window.I18N.t;
  // ---------- Local variable validation ----------
  /** Binders avoid outer names by default; rename automatically on conflict. */
  function refreshBinderNames() {
    for (const b of getWorkspace().getAllBlocks(false)) {
      if (!b.ttBinds || !b.ttNameFields) continue;
      const outer = window.LBM.bindersInScope(b);
      if (!outer.length) continue;
      const used = new Set(outer.map((o) => o.name));
      for (const uids of Object.values(b.ttBinds)) {
        for (const uid of uids) {
          const fname = b.ttNameFields[uid];
          if (!fname || !b.getField(fname)) continue;
          const cur = b.getFieldValue(fname);
          if (!used.has(cur)) { used.add(cur); continue; }
          const fresh = window.LBM.nextBinderName(cur, used);
          used.add(fresh);
          b.setFieldValue(fresh, fname);
        }
      }
    }
  }

  function refreshVars() {
    if (!getWorkspace() || getBusy()) return;
    setBusy(true);
    try {
      refreshBinderNames();
      for (const b of getWorkspace().getBlocksByType('tt_var', false)) {
        const f = b.getField('REF');
        if (!f) continue;
        let ref = window.LBM.decodeRef(f.getValue());
        const list = window.LBM.bindersInScope(b);
        // Empty reference: bind by saved name when possible, otherwise to the nearest binder.
        if (!ref.uid && list.length) {
          const target = (ref.name && list.find((x) => x.name === ref.name)) || list[0];
          f.setValue(window.LBM.encodeRef(target.uid, target.name));
          ref = { uid: target.uid, name: target.name };
        }
        const found = list.find((x) => x.uid === ref.uid) ||
          (ref.name ? list.find((x) => x.name === ref.name) : null);
        if (found) {
          b.setWarningText(null);
          b.setColour('#d7ccc8');
          b.setTooltip(t('variable', { name: found.name, binder: found.block.type || 'binder' }));
        } else if (ref.uid || ref.name) {
          b.setWarningText(t('scope', { name: ref.name || '?' }));
          b.setColour('#8b93a1');
        }
        try { f.forceRerender(); } catch (e) { /* older API */ }
      }
    } finally {
      setBusy(false);
    }
  }

  function highlightBinderFor(id) {
    if (!id || !getWorkspace()) return;
    const b = getWorkspace().getBlockById(id);
    if (!b || b.type !== 'tt_var') return;
    const ref = window.LBM.decodeRef(b.getFieldValue('REF'));
    const found = window.LBM.findBinder(b, ref.uid);
    if (found && found.block) {
      try { getWorkspace().highlightBlock(found.block.id); } catch (e) {}
      setTimeout(() => { try { getWorkspace().highlightBlock(null); } catch (e) {} }, 1200);
    }
  }
  return { refreshVars, highlightBinderFor };
}
