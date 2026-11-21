/** One permission policy and action list for every card surface. */
export function cardPermissions(card) {
  return { view: !!card, edit: !!card && !card.preset, remove: !!card && !card.preset };
}

export function cardActions(card, { view, edit, remove, locale }) {
  const allowed = cardPermissions(card), zh = locale === 'zh-CN';
  const actions = [];
  if (allowed.view) actions.push({ text: zh ? '查看类型与构造…' : 'View type and construction…', enabled: true, callback: () => view(card) });
  if (allowed.edit) actions.push({ text: zh ? '编辑卡片…' : 'Edit card…', enabled: true, callback: () => edit(card) });
  if (allowed.remove) actions.push({ text: zh ? '删除卡片及所有引用' : 'Delete card and all references', enabled: true, callback: () => remove(card) });
  return actions;
}
