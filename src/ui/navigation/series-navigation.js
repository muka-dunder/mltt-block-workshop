import { versionedStorageKey } from '../version.js';

const SERIES = {
  journey: ['主线旅程', 'Journey'],
  functions: ['函数工坊', 'Function workshop'],
  dependent: ['依赖类型', 'Dependent types'],
};

/** Selection uses stable global indices; each series remembers its own last level. */
export function createSeriesNavigation({ getLevels, getIndex, loadLevel }) {
  const seriesSelect = document.querySelector('#seriesSelect');
  const levelSelect = document.querySelector('#levelSelect');
  const nav = document.querySelector('.nav');
  const storageKey = versionedStorageKey('series.progress');
  const words = (zh, en) => window.I18N.locale === 'zh-CN' ? zh : en;
  let custom = false, remembered = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) remembered = saved;
  } catch (_) { /* Storage may be unavailable. */ }
  const seriesOf = level => SERIES[level?.series] ? level.series : 'legacy';
  const members = series => getLevels().map((level, index) => ({ level, index }))
    .filter(item => seriesOf(item.level) === series)
    .sort((a, b) => (a.level.seriesOrder ?? a.index) - (b.level.seriesOrder ?? b.index));
  function currentMembers() { return members(seriesOf(getLevels()[getIndex()])); }
  function remember() {
    const level = getLevels()[getIndex()];
    if (!level) return;
    remembered[seriesOf(level)] = level.id;
    try { localStorage.setItem(storageKey, JSON.stringify(remembered)); } catch (_) { /* Navigation works without persistence. */ }
  }
  function option(value, label, disabled = false) {
    const item = document.createElement('option');
    item.value = value; item.textContent = label; item.disabled = disabled;
    return item;
  }
  function nextIndex() {
    const list = currentMembers(), position = list.findIndex(item => item.index === getIndex());
    return list[position + 1]?.index ?? null;
  }
  function move(delta) {
    if (custom) return false;
    const list = currentMembers(), position = list.findIndex(item => item.index === getIndex());
    const target = list[position + delta];
    if (!target) return false;
    loadLevel(target.index); return true;
  }
  function refresh() {
    const levels = getLevels(), current = levels[getIndex()], series = seriesOf(current);
    seriesSelect.replaceChildren(...Object.entries(SERIES).map(([key, names]) => option(key, words(...names))));
    if (series === 'legacy') seriesSelect.append(option('legacy', words('原有关卡', 'Earlier levels'), true));
    seriesSelect.append(option('coming-soon', words('更多内容制作中', 'More coming soon'), true));
    seriesSelect.value = series;
    seriesSelect.setAttribute('aria-label', words('选择系列', 'Select series'));
    seriesSelect.title = seriesSelect.selectedOptions[0]?.textContent || '';
    const list = members(series);
    levelSelect.replaceChildren(...list.map(({ level, index }, position) =>
      option(String(index), `${position + 1} / ${list.length} · ${level.title}`)));
    levelSelect.value = String(getIndex());
    levelSelect.setAttribute('aria-label', words('选择关卡', 'Select level'));
    levelSelect.title = levelSelect.selectedOptions[0]?.textContent || '';
    const position = list.findIndex(item => item.index === getIndex());
    document.querySelector('#prevBtn').disabled = custom || position <= 0;
    document.querySelector('#nextBtn2').disabled = custom || position < 0 || position === list.length - 1;
    seriesSelect.disabled = custom; levelSelect.disabled = custom;
    nav.classList.toggle('is-custom', custom);
    const free = document.querySelector('#freeCanvasLabel');
    free.hidden = !custom; free.textContent = words('自由画布', 'Free canvas');
    document.querySelector('#settingsSummary').textContent = words('设置', 'Settings');
    if (!custom) remember();
  }
  function setCustom(active) { custom = !!active; refresh(); }
  function init() {
    seriesSelect.addEventListener('change', () => {
      if (!SERIES[seriesSelect.value] || custom) return;
      const list = members(seriesSelect.value);
      const target = list.find(item => item.level.id === remembered[seriesSelect.value]) || list[0];
      if (target) loadLevel(target.index);
      else refresh();
    });
    levelSelect.addEventListener('change', () => {
      const index = Number(levelSelect.value);
      if (!custom && Number.isInteger(index) && getLevels()[index]) loadLevel(index);
    });
    const smallScreen = matchMedia('(max-width: 900px)');
    const updatePanels = () => {
      document.querySelector('.header-settings').open = false;
      document.querySelector('.workshop-details').open = !smallScreen.matches;
    };
    smallScreen.addEventListener('change', updatePanels); updatePanels(); refresh();
  }
  return { init, refresh, move, nextIndex, setCustom };
}
