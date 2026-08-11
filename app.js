// app.js

const SOURCES = [
  { id: 'wikipedia', label: 'Global DB (Wiki)', kind: 'reference', active: true, fetcher: fetchWikipedia },
  { id: 'wikidata', label: 'Entity Graph (Data)', kind: 'entity', active: true, fetcher: fetchWikidata },
  { id: 'fbi', label: 'Federal Warrants (FBI)', kind: 'federal', active: true, fetcher: fetchFBI },
  { id: 'openalex', label: 'Scholar Index', kind: 'scholarship', active: true, fetcher: fetchOpenAlex },
  { id: 'crossref', label: 'Citation Trail', kind: 'scholarship', active: true, fetcher: fetchCrossref },
  { id: 'europepmc', label: 'Toxicology & Med (PMC)', kind: 'medical', active: true, fetcher: fetchEuropePMC },
  { id: 'books', label: 'Published Manifestos', kind: 'literature', active: true, fetcher: fetchBooks },
  { id: 'hackernews', label: 'Deep Chatter (HN)', kind: 'forum', active: true, fetcher: fetchHackerNews },
  { id: 'github', label: 'Code Trail (GitHub)', kind: 'repository', active: true, fetcher: fetchGitHub },
  { id: 'archive', label: 'Cold Storage (Archive)', kind: 'archive', active: true, fetcher: fetchArchive },
];

const state = {
  query: '', subject: 'auto', depth: 'standard', sort: 'relevance',
  activeSourceIds: SOURCES.filter((s) => s.active).map((s) => s.id),
  activeFocuses: ['reference', 'entity', 'scholarship', 'medical', 'federal', 'literature', 'forum', 'repository', 'archive'],
  exactPhrase: '', location: '', fromYear: '', toYear: '',
  results: [], summary: null, loading: false, page: 1, dossiers: [], activeDossierId: null, notes: '',
};

const els = {
  form: document.getElementById('searchForm'), queryInput: document.getElementById('queryInput'),
  subjectSelect: document.getElementById('subjectSelect'), depthSelect: document.getElementById('depthSelect'),
  sortSelect: document.getElementById('sortSelect'), exactPhraseInput: document.getElementById('exactPhraseInput'),
  locationInput: document.getElementById('locationInput'), fromYearInput: document.getElementById('fromYearInput'),
  toYearInput: document.getElementById('toYearInput'), sourceRow: document.getElementById('sourceRow'),
  resultsTitle: document.getElementById('resultsTitle'), statusBar: document.getElementById('statusBar'),
  summaryGrid: document.getElementById('summaryGrid'), resultGroups: document.getElementById('resultGroups'),
  heroStats: document.getElementById('heroStats'), dossierList: document.getElementById('dossierList'),
  notesInput: document.getElementById('notesInput'), saveNotesButton: document.getElementById('saveNotesButton'),
  saveCaseButton: document.getElementById('saveCaseButton'), exportButton: document.getElementById('exportButton'),
  newDossierButton: document.getElementById('newDossierButton'), cardTemplate: document.getElementById('resultCardTemplate'),
};

const DEFAULT_PROMPTS = ['Trinity Killer', 'Bay Harbor Butcher', 'Cybernetics'];

// --- INDEXED DB (Trophy Box Storage) ---
const DB_NAME = 'MiamiMetroDB';
const STORE_NAME = 'trophyBox';

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFromDB(key, defaultValue) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result !== undefined ? request.result : defaultValue);
      request.onerror = () => reject(request.error);
    });
  } catch { return defaultValue; }
}

async function saveToDB(key, value) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const request = tx.objectStore(STORE_NAME).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) { console.warn('Storage failed.', e); }
}

// --- INITIALIZATION ---
initialize();

async function initialize() {
  renderLoadingFallback();
  state.notes = await getFromDB('dexter-notes', '');
  const defaultDossier = [seedDossier('Unidentified Subject', 'Blood never lies. Begin tracking the pattern.')];
  state.dossiers = await getFromDB('dexter-dossiers', defaultDossier);
  if (!Array.isArray(state.dossiers) || !state.dossiers.length) state.dossiers = defaultDossier;

  renderSourceChips(); renderHeroStats(); renderDossiers();
  
  els.notesInput.value = state.notes;
  els.queryInput.value = DEFAULT_PROMPTS[0];
  applySavedQuery(DEFAULT_PROMPTS[0]);
  
  els.form.addEventListener('submit', handleSearchSubmit);
  ['subjectSelect', 'depthSelect'].forEach(id => els[id].addEventListener('change', (e) => { state[id.replace('Select', '')] = e.target.value; renderHeroStats(); }));
  els.sortSelect.addEventListener('change', (e) => { state.sort = e.target.value; renderResults(); });
  ['exactPhrase', 'location', 'fromYear', 'toYear'].forEach(f => els[`${f}Input`].addEventListener('input', (e) => state[f] = e.target.value.trim()));
  
  document.querySelectorAll('.focus-chip').forEach(b => b.addEventListener('click', () => toggleFocus(b.dataset.focus)));
  els.saveNotesButton.addEventListener('click', saveNotes); els.saveCaseButton.addEventListener('click', saveCase);
  els.exportButton.addEventListener('click', exportCurrentState); els.newDossierButton.addEventListener('click', createNewDossier);
}

function applySavedQuery(query) { if (query) { state.query = query; els.queryInput.value = query; } }

function renderSourceChips() {
  els.sourceRow.innerHTML = '';
  SOURCES.forEach((source) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `source-chip${state.activeSourceIds.includes(source.id) ? ' active' : ''}`;
    btn.textContent = source.label;
    btn.addEventListener('click', () => toggleSource(source.id));
    els.sourceRow.appendChild(btn);
  });
}

function toggleSource(sourceId) {
  const index = state.activeSourceIds.indexOf(sourceId);
  if (index >= 0) state.activeSourceIds.splice(index, 1);
  else state.activeSourceIds.push(sourceId);
  renderSourceChips(); renderHeroStats();
}

function toggleFocus(focus) {
  const index = state.activeFocuses.indexOf(focus);
  if (index >= 0 && state.activeFocuses.length > 1) state.activeFocuses.splice(index, 1);
  else if (index < 0) state.activeFocuses.push(focus);
  document.querySelectorAll('.focus-chip').forEach(b => b.classList.toggle('active', state.activeFocuses.includes(b.dataset.focus)));
  renderHeroStats();
}

function renderHeroStats() {
  const activeSources = SOURCES.filter(s => state.activeSourceIds.includes(s.id));
  const stats = [
    { value: activeSources.length, label: 'Active Informants' },
    { value: [...new Set(activeSources.map(s => s.kind))].length, label: 'Investigation Vectors' },
    { value: state.depth === 'deep' ? 'Deep' : 'Surface', label: 'Tissue Scan Depth' },
    { value: 'System', label: 'Ready for Analysis' },
  ];
  els.heroStats.innerHTML = stats.map(s => `<div class="stat"><span class="value">${escapeHtml(s.value)}</span><span class="label">${escapeHtml(s.label)}</span></div>`).join('');
}

// --- CORE SEARCH LOGIC ---
async function handleSearchSubmit(e) { if (e) e.preventDefault(); state.page = 1; state.results = []; await executeSearch(); }
async function loadMoreResults() { state.page += 1; await executeSearch(true); }

async function executeSearch(isAppending = false) {
  const query = els.queryInput.value.trim();
  state.query = query;
  if (!query) { setStatus('Enter a subject to begin the hunt.'); return; }
  const activeSources = SOURCES.filter(s => state.activeSourceIds.includes(s.id));
  if (!activeSources.length) { setStatus('Enable at least one database.'); return; }
  
  state.loading = true;
  setStatus(`Hunting across ${activeSources.length} databases for ${query}...`);
  if (!isAppending) renderLoadingState(query);

  const queryPlan = {
    normalized: query.trim().replace(/\s+/g, ' '),
    depth: state.depth,
    page: state.page
  };

  const jobs = activeSources.map(async (source) => {
    try { 
      const payload = await source.fetcher(queryPlan);
      return { source, payload: payload || { items: [] } }; 
    } 
    catch (err) { 
      console.error(`[Forensic Error] Failed to extract from ${source.label}:`, err);
      return { source, payload: { items: [], note: 'Failed' } }; 
    }
  });
  
  const settled = await Promise.all(jobs);
  const collected = settled.flatMap(({ source, payload }) => normalizePayload(source, payload));
  
  state.results = isAppending ? sortResults([...state.results, ...collected], state.sort) : sortResults(collected, state.sort);
  state.summary = summarizeResults(query, state.results, state.activeSourceIds);
  state.loading = false;
  
  renderResults(); 
  persistLastSearch();
}

function normalizePayload(source, payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.map(item => ({
    id: `${source.id}:${item.id || item.url || item.title || Math.random()}`, 
    sourceId: source.id, 
    sourceLabel: source.label,
    group: item.group || mapGroup(source.kind), 
    resultKind: item.resultKind || 'record',
    title: item.title || 'Unknown Subject', 
    snippet: item.snippet || 'Record classified / unreadable.', 
    url: item.url || '#',
    published: item.published || 'Date Unknown', 
    domain: extractDomain(item.url || ''), 
    score: typeof item.score === 'number' ? item.score : 0,
  }));
}

// --- FETCHERS (The "Pits of Hell" Expansion) ---

// 1. Wikipedia (Global DB)
async function fetchWikipedia(plan) {
  const limit = plan.depth === 'deep' ? 12 : 5; const offset = (plan.page - 1) * limit;
  const res = await fetchJson(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(plan.normalized)}&srlimit=${limit}&sroffset=${offset}&format=json&origin=*`);
  const items = (res?.query?.search || []).map((entry, i) => ({
    title: entry.title, snippet: stripHtml(entry.snippet), url: `https://en.wikipedia.org/wiki/${encodeURIComponent(entry.title.replace(/ /g, '_'))}`,
    published: new Date(entry.timestamp).getFullYear().toString() || '', resultKind: 'wiki', score: 99 - i
  }));
  return { items };
}

// 2. Wikidata (Entity Graph)
async function fetchWikidata(plan) {
  if (plan.page > 1) return { items: [] };
  const res = await fetchJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(plan.normalized)}&language=en&limit=8&format=json&origin=*`);
  const items = (res?.search || []).map((entry, i) => ({
    title: entry.label || entry.id, snippet: entry.description || 'No description on file.', url: `https://www.wikidata.org/wiki/${entry.id}`, resultKind: 'alias', score: 95 - i
  }));
  return { items };
}

// 3. FBI Wanted API (Federal Warrants)
async function fetchFBI(plan) {
  if (plan.page > 1) return { items: [] }; // FBI API pagination is tricky, stick to top hits.
  const res = await fetchJson(`https://api.fbi.gov/api/v1/wanted/list?title=${encodeURIComponent(plan.normalized)}`);
  const items = (res?.items || []).map((entry, i) => ({
    title: entry.title, snippet: stripHtml(entry.description || entry.warning_message || 'Warrant issued.'), 
    url: entry.url, published: entry.publication ? new Date(entry.publication).getFullYear().toString() : '', 
    group: 'federal', resultKind: 'warrant', score: 100 - i
  }));
  return { items };
}

// 4. Hacker News (Deep Chatter)
async function fetchHackerNews(plan) {
  const limit = plan.depth === 'deep' ? 10 : 5;
  const res = await fetchJson(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(plan.normalized)}&page=${plan.page - 1}&hitsPerPage=${limit}`);
  const items = (res?.hits || []).map((entry, i) => ({
    title: entry.title || entry.story_title || 'Untitled Thread',
    snippet: `Author: ${entry.author} | Points: ${entry.points}. ${stripHtml(entry.comment_text || '').substring(0, 150)}...`,
    url: entry.url || `https://news.ycombinator.com/item?id=${entry.objectID}`,
    published: entry.created_at ? new Date(entry.created_at).getFullYear().toString() : '', 
    group: 'forum', resultKind: 'thread', score: 90 - i
  }));
  return { items };
}

// 5. GitHub (Code Trails)
async function fetchGitHub(plan) {
  const limit = plan.depth === 'deep' ? 8 : 4;
  const res = await fetchJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(plan.normalized)}&per_page=${limit}&page=${plan.page}`);
  const items = (res?.items || []).map((entry, i) => ({
    title: entry.full_name, snippet: entry.description || 'No documentation found in repository.', 
    url: entry.html_url, published: entry.updated_at ? new Date(entry.updated_at).getFullYear().toString() : '', 
    group: 'repository', resultKind: 'repo', score: 85 - i
  }));
  return { items };
}

// 6. Europe PMC (Toxicology & Medical Reports)
async function fetchEuropePMC(plan) {
  const limit = plan.depth === 'deep' ? 8 : 4;
  const res = await fetchJson(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(plan.normalized)}&format=json&resultType=core&pageSize=${limit}&cursorMark=*`);
  const items = (res?.resultList?.result || []).map((entry, i) => ({
    title: entry.title, snippet: stripHtml(entry.abstractText || 'Abstract withheld by publisher.').substring(0, 150) + '...',
    url: `https://europepmc.org/article/${entry.source}/${entry.pmid}`, 
    published: entry.pubYear || '', group: 'medical', resultKind: 'clinical', score: 88 - i
  }));
  return { items };
}

// 7. Google Books (Published Manifestos)
async function fetchBooks(plan) {
  const limit = plan.depth === 'deep' ? 8 : 4; const offset = (plan.page - 1) * limit;
  const res = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(plan.normalized)}&maxResults=${limit}&startIndex=${offset}`);
  const items = (res?.items || []).map((entry, i) => {
    const info = entry.volumeInfo || {};
    return {
      title: info.title || 'Unknown Text', snippet: stripHtml(info.description || `Authors: ${info.authors?.join(', ')}`), 
      url: info.previewLink || info.infoLink || '#', published: info.publishedDate ? info.publishedDate.substring(0,4) : '', 
      group: 'literature', resultKind: 'book', score: 82 - i
    };
  });
  return { items };
}

// 8. OpenAlex (Scholar Index)
async function fetchOpenAlex(plan) {
  const limit = plan.depth === 'deep' ? 8 : 4;
  const res = await fetchJson(`https://api.openalex.org/works?search=${encodeURIComponent(plan.normalized)}&per-page=${limit}&page=${plan.page}`);
  const items = (res?.results || []).map((e, i) => ({
    title: e.display_name || 'Classified Work', snippet: e.primary_location?.source?.display_name || 'Scholarly abstract withheld.',
    url: e.id, published: String(e.publication_year || ''), group: 'scholarship', resultKind: 'journal', score: 86 - i
  }));
  return { items };
}

// 9. Crossref (Citation Trails)
async function fetchCrossref(plan) {
  const limit = plan.depth === 'deep' ? 6 : 4; const offset = (plan.page - 1) * limit;
  const res = await fetchJson(`https://api.crossref.org/works?query=${encodeURIComponent(plan.normalized)}&rows=${limit}&offset=${offset}`);
  const items = (res?.message?.items || []).map((e, i) => ({
    title: e.title?.[0] || 'Unknown Citation', snippet: `Author: ${e.author?.[0]?.family || 'Redacted'}`,
    url: e.URL || '#', published: e.created?.['date-parts']?.[0]?.[0]?.toString() || '', 
    group: 'scholarship', resultKind: 'citation', score: 84 - i
  }));
  return { items };
}

// 10. Internet Archive (Cold Storage)
async function fetchArchive(plan) {
  const limit = plan.depth === 'deep' ? 8 : 4;
  const res = await fetchJson(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(plan.normalized)}&fl[]=identifier,title,creator,date,description&rows=${limit}&page=${plan.page}&output=json`);
  const items = (res?.response?.docs || []).map((e, i) => ({
    title: e.title || e.identifier, snippet: stripHtml(e.description || 'Cold storage file.'), url: `https://archive.org/details/${e.identifier}`,
    published: e.date ? e.date.substring(0,4) : '', group: 'archive', resultKind: 'archive', score: 80 - i
  }));
  return { items };
}

// --- BULLETPROOF FETCH WRAPPER ---
// Modified to prevent silent failures. If CORS blocks it, it gracefully returns null so the rest of the app survives.
async function fetchJson(url, options = {}, retries = 2, backoff = 500) {
  const controller = new AbortController();
  // Extended timeout to 15 seconds to allow deep sweeps to complete.
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal, headers: { Accept: 'application/json' }});
    if (!res.ok) {
      if (res.status === 429 && retries > 0) {
        console.warn(`[Forensics] Rate limited on ${url}. Backing off...`);
        await new Promise(r => setTimeout(r, backoff));
        return fetchJson(url, options, retries - 1, backoff * 2);
      }
      throw new Error(`HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch(e) { 
    console.warn(`[Forensics] Extraction failed for ${url}. Target may have scrubbed the data or blocked access (CORS).`, e);
    return null; 
  } finally { 
    window.clearTimeout(timeout); 
  }
}

// --- FORENSIC DATA PARSING & UI ---
function stripHtml(v) { return String(v || '').replace(/<[^>]*>/g, ' ').trim(); }
function extractDomain(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }
function groupBy(arr, keyFn) { return arr.reduce((acc, v) => { (acc[keyFn(v)] = acc[keyFn(v)] || []).push(v); return acc; }, {}); }
function setStatus(msg) { els.statusBar.textContent = msg; }

function mapGroup(k) { 
  const validGroups = ['entity', 'scholarship', 'medical', 'federal', 'literature', 'forum', 'repository', 'archive'];
  return validGroups.includes(k) ? k : 'reference'; 
}

function groupLabel(group) {
  return { 
    reference: 'Global Records', entity: 'Entity & Alias Graphs', federal: 'Federal Warrants & Flags',
    medical: 'Toxicology & Medical Reports', literature: 'Published Manifestos',
    scholarship: 'Academic Journals', forum: 'Deep Web Chatter', repository: 'Code & Tech Trails', archive: 'Cold Files (Archived)' 
  }[group] || 'Unclassified Evidence';
}

function sortResults(items, sortMode) {
  const cloned = [...items];
  if (sortMode === 'source') return cloned.sort((l, r) => l.sourceLabel.localeCompare(r.sourceLabel) || r.score - l.score);
  if (sortMode === 'recent') return cloned.sort((l, r) => (parseInt(r.published) || 0) - (parseInt(l.published) || 0) || r.score - l.score);
  return cloned.sort((l, r) => r.score - l.score || l.title.localeCompare(r.title));
}

function summarizeResults(query, results, activeSourceIds) {
  return {
    total: results.length, sourceCount: activeSourceIds.length,
    mediaCount: results.filter(i => ['literature', 'archive'].includes(i.group)).length,
    scholarCount: results.filter(i => ['scholarship', 'medical'].includes(i.group)).length,
    entityCount: results.filter(i => ['entity', 'reference', 'federal'].includes(i.group)).length,
    primaryLine: `Isolated ${results.length} records.`, filterLine: buildFilterSummary()
  };
}

function buildFilterSummary() {
  const parts = [state.exactPhrase && `Target: "${state.exactPhrase}"`, state.location && `Loc: ${state.location}`].filter(Boolean);
  return parts.length ? `Parameters active: ${parts.join(', ')}.` : 'Broad spectrum analysis.';
}

function renderLoadingState(query) {
  els.resultsTitle.textContent = `Analyzing spatter for ${query}...`;
  els.summaryGrid.innerHTML = '';
  els.resultGroups.innerHTML = `<div class="empty-state"><h3>Running Forensics</h3><p>Extracting data from the digital veins. Give it a moment.</p></div>`;
}

function renderEmptyState(title, message) {
  els.resultsTitle.textContent = title;
  els.summaryGrid.innerHTML = '';
  els.resultGroups.innerHTML = `<div class="empty-state"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div>`;
}

function renderResults() {
  if (!state.results.length) {
    if (state.loading) return renderLoadingState(state.query || '');
    return renderEmptyState('Cold Trail', 'No evidence found. The scene was wiped clean. Try widening the search parameters.');
  }
  const summary = state.summary;
  els.resultsTitle.textContent = `${summary.total} Pieces of Evidence Found`;
  els.statusBar.textContent = `Analysis complete. ${summary.primaryLine} ${summary.filterLine}`;
  
  renderSummaryGrid(summary); renderGroupedResults(); renderDossiers(); renderHeroStats();
}

function renderSummaryGrid(summary) {
  const cards = [
    { number: summary.total, label: 'Total Evidence', body: `Across ${summary.sourceCount} tapped systems.` },
    { number: summary.mediaCount, label: 'Manifestos & Cold Files', body: 'Literature and archived history.' },
    { number: summary.scholarCount, label: 'Journals & Med Reports', body: 'Academic and scientific trail.' },
    { number: summary.entityCount, label: 'Entity & Warrant Matches', body: 'Structured aliases and DB hits.' },
  ];
  els.summaryGrid.innerHTML = cards.map(c => `
    <article class="summary-card">
      <span class="number">${c.number}</span>
      <span class="heading">${c.label}</span>
      <p>${c.body}</p>
    </article>
  `).join('');
}

function renderGroupedResults() {
  const grouped = groupBy(state.results, item => item.group);
  const order = ['federal', 'reference', 'entity', 'medical', 'forum', 'repository', 'literature', 'scholarship', 'archive', 'other'];
  els.resultGroups.innerHTML = '';

  order.filter(g => grouped[g] && grouped[g].length).forEach(group => {
    const items = grouped[group];
    const section = document.createElement('section');
    section.className = 'group';
    section.innerHTML = `
      <div class="group-head"><h3>${escapeHtml(groupLabel(group))}</h3></div>
      <div class="group-grid"></div>
    `;
    const grid = section.querySelector('.group-grid');
    items.forEach((item, idx) => {
      const node = buildCardNode(item);
      node.style.animationDelay = `${idx * 0.05}s`;
      grid.appendChild(node);
    });
    els.resultGroups.appendChild(section);
  });

  const loadBtn = document.createElement('button');
  loadBtn.className = 'ghost-button full-width blood-border';
  loadBtn.textContent = state.loading ? 'Extracting...' : `Dig Deeper (Page ${state.page + 1})`;
  loadBtn.disabled = state.loading;
  loadBtn.addEventListener('click', loadMoreResults);
  els.resultGroups.appendChild(loadBtn);
}

function buildCardNode(item) {
  const fragment = els.cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector('.result-card');
  const metaContainer = fragment.querySelector('.result-meta');
  metaContainer.innerHTML = `<span class="badge">${escapeHtml(item.sourceLabel)}</span><span class="pill">${escapeHtml(item.resultKind)}</span>`;
  
  const titleLink = document.createElement('a');
  titleLink.href = item.url; titleLink.target = '_blank'; titleLink.textContent = item.title;
  fragment.querySelector('h3').appendChild(titleLink);
  fragment.querySelector('.result-snippet').textContent = item.snippet || 'Record classified / unreadable.';
  
  const footer = [item.domain, item.published, item.score ? `Match: ${item.score}%` : null].filter(Boolean);
  fragment.querySelector('.result-footer').innerHTML = `<span>[${escapeHtml(footer.join('] ['))}]</span>`;
  return card;
}

// --- DOSSIERS / TROPHY BOX HANDLING ---
function renderDossiers() {
  els.dossierList.innerHTML = state.dossiers.length ? state.dossiers.map(d => `
    <article class="dossier-item ${d.id === state.activeDossierId ? 'active' : ''}" data-dossier-id="${d.id}">
      <h3>${escapeHtml(d.title)}</h3>
      <p>${escapeHtml(d.summary)}</p>
    </article>
  `).join('') : '<p class="empty-state">Trophy box is empty.</p>';
  els.dossierList.querySelectorAll('.dossier-item').forEach(i => i.addEventListener('click', () => activateDossier(i.dataset.dossierId)));
}

function seedDossier(title, summary) {
  return { id: `case-${Date.now()}`, title, summary, query: '', note: '', updatedAt: new Date().toISOString(), savedResults: [] };
}

async function saveDossiers() { await saveToDB('dexter-dossiers', state.dossiers); }
function activateDossier(id) {
  state.activeDossierId = id; renderDossiers();
  const d = state.dossiers.find(x => x.id === id);
  if (d) { applySavedQuery(d.query); els.notesInput.value = d.note || ''; setStatus(`Loaded Slide: ${d.title}`); }
}

async function createNewDossier() {
  const d = seedDossier(`Slide ${state.dossiers.length + 1}`, 'Blank slide prepared.');
  state.dossiers.unshift(d); state.activeDossierId = d.id;
  await saveDossiers(); renderDossiers(); setStatus('New glass slide ready.');
}

async function saveNotes() {
  state.notes = els.notesInput.value; await saveToDB('dexter-notes', state.notes);
  const d = state.dossiers.find(x => x.id === state.activeDossierId);
  if (d) { d.note = state.notes; d.updatedAt = new Date().toISOString(); await saveDossiers(); }
  setStatus('Monologue logged.');
}

async function saveCase() {
  if (!state.results.length) return setStatus('No evidence to store.');
  let d = state.dossiers.find(x => x.id === state.activeDossierId);
  if (!d) { d = state.dossiers[0]; state.activeDossierId = d.id; }
  d.title = state.query || d.title; d.query = state.query;
  d.summary = `Stored ${state.results.length} spatters.`; d.updatedAt = new Date().toISOString();
  await saveDossiers(); renderDossiers(); setStatus('Evidence secured in the Trophy Box.');
}

function exportCurrentState() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `case-file-${state.query.replace(/\s+/g, '-')}.json`; a.click(); setStatus('Case file extracted.');
}

async function persistLastSearch() {
  const d = state.dossiers.find(x => x.id === state.activeDossierId) || state.dossiers[0];
  if(d) { d.query = state.query; await saveDossiers(); }
}

function escapeHtml(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function renderLoadingFallback() { renderEmptyState('Miami Metro Lab', 'System online. Awaiting target.'); }