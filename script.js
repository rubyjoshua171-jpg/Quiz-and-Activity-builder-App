// Neuronest is a client-side learning activity demo.
// Activities are stored locally so the static app works without a backend.
const app = document.getElementById('app');

const types = [
  ['mc', 'Multiple Choice', 'Pick one correct answer from four options.', '▣', 'Plant cells and photosynthesis'],
  ['tf', 'True / False', 'Decide whether each statement is true or false.', '✓', 'Photosynthesis'],
  ['fc', 'Flashcards', 'Study terms and definitions with interactive cards.', '▤', 'The human body'],
  ['match', 'Matching Pairs', 'Connect related items to complete the activity.', '⌘', 'Countries and capitals'],
  ['order', 'Put in Order', 'Arrange steps into the correct sequence.', '↕', 'Life cycle of a butterfly'],
  ['blank', 'Fill in the Blanks', 'Complete sentences with the missing words.', '□', 'The water cycle'],
  ['groups', 'Sort into Groups', 'Sort ideas into the right categories.', '▦', 'Renewable energy'],
  ['crossword', 'Crossword', 'Review key vocabulary with a crossword.', '＋', 'Introduction to biology']
];

const samples = {
  mc: [{ q: 'What is the powerhouse of the cell?', a: ['Nucleus', 'Mitochondria', 'Ribosome', 'Cell wall'], correct: 1 }],
  tf: [{ q: 'Plants produce oxygen.', a: ['True', 'False'], correct: 0 }],
  fc: [{ q: 'What is the powerhouse of the cell?', a: ['Mitochondria'], correct: 0 }],
  match: [{ q: 'Match each country to its capital.', a: ['France - Paris', 'Japan - Tokyo', 'Italy - Rome'], correct: 0 }],
  order: [{ q: 'Arrange the butterfly life cycle.', a: ['Egg', 'Caterpillar', 'Chrysalis', 'Butterfly'], correct: 0 }],
  blank: [{ q: 'Plants use sunlight to make ____.', a: ['food'], correct: 0 }],
  groups: [{ q: 'Sort these into renewable energy.', a: ['Solar', 'Wind', 'Coal', 'Oil'], correct: 0 }],
  crossword: [{ q: 'A green pigment in plants.', a: ['Chlorophyll'], correct: 0 }]
};

let state = {
  route: location.hash.slice(1) || 'landing',
  type: 'mc',
  topic: '',
  count: 10,
  difficulty: 'Easy',
  items: [],
  q: 0,
  score: 0
};

const appRoutes = new Set(['landing', 'login', 'signup', 'dashboard', 'activities', 'create', 'editor', 'preview', 'play', 'results', 'share', 'shared', 'profile', 'settings', 'how']);

const sections = new Set(['features', 'how', 'faq']);

function readActivities() {
  try {
    const saved = JSON.parse(localStorage.getItem('neuroActs') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function safeOpen(url) {
  try {
    const parsed = new URL(url, location.href);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return;
    }
    window.open(parsed.href, '_blank', 'noopener,noreferrer');
  } catch {
    toast('Unable to open sharing link');
  }
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function go(route) {
  if (sections.has(route)) {
    state.route = 'landing';
    location.hash = route;
    render();
    document.getElementById(route)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (!appRoutes.has(route)) {
    route = 'landing';
  }
  state.route = route;
  location.hash = route;
  render();
  window.scrollTo(0, 0);
}

function toast(message) {
  const node = document.getElementById('toast');
  node.textContent = message;
  node.classList.add('show');
  window.setTimeout(() => node.classList.remove('show'), 2200);
}

function logo() {
  return '<div class="brand"><b>N</b><span>NEURONEST</span></div>';
}

function icon(name) {
  return { home: '⌂', list: '▤', add: '＋', share: '↗', user: '♙', settings: '⚙' }[name] || '✦';
}

function side() {
  return '<aside class="sidebar">' + logo() +
    '<nav class="side-nav">' +
    '<button data-go="dashboard">' + icon('home') + ' Home</button>' +
    '<button data-go="activities">' + icon('list') + ' My Activities</button>' +
    '<button data-go="create">' + icon('add') + ' Create New</button>' +
    '<button data-go="shared">' + icon('share') + ' Shared Links</button>' +
    '<button data-go="profile">' + icon('user') + ' Profile</button>' +
    '<button data-go="settings">' + icon('settings') + ' Settings</button>' +
    '</nav><button class="btn ghost logout" data-go="landing">⇥ Log out</button></aside>';
}

function shell(content) {
  return '<div class="layout">' + side() + '<main class="main">' + content + '</main></div>';
}

function head(title, subtitle, action = '') {
  return '<div class="head"><div><h1>' + title + '</h1><p>' + subtitle + '</p></div>' + action + '</div>';
}

function landing() {
  return '<header class="topbar">' + logo() +
    '<nav class="links"><a href="#features">Features</a><a href="#how">How it works</a><a href="#faq">FAQ</a></nav>' +
    '<div><button class="btn ghost" data-go="login">Log in</button><button class="btn primary" data-go="signup">Sign up</button></div></header>' +
    '<section class="hero"><div><span class="eyebrow">✦ Ideas - AI - Activities</span>' +
    '<h1>Continue Learning With <span class="gradient">Neuronest</span> In Seconds</h1>' +
    '<p>Turn your ideas into quizzes, flashcards, matching games and more. Save time, engage your students, and make learning fun.</p>' +
    '<button class="btn primary" data-go="signup">Get started free</button> <button class="btn outline" data-go="how">▶ How it works</button></div>' +
    '<div class="hero-visual"><div class="mock"><b>Plant Cells Quiz</b><p class="mock-question">Which organelle makes energy?</p>' +
    '<div class="option">A. Nucleus</div><div class="option active">B. Mitochondria ✓</div><div class="option">C. Cell wall</div><div class="option">D. Chloroplast</div></div></div></section>' +
    '<section class="features" id="features"><div class="feature"><div class="icon">✈</div><h3>AI-Powered Content</h3><p>Generate high-quality activities in seconds.</p></div>' +
    '<div class="feature"><div class="icon">▣</div><h3>8 Activity Types</h3><p>Quizzes, flashcards, matching and more.</p></div>' +
    '<div class="feature"><div class="icon">⌁</div><h3>Share with Ease</h3><p>Public links your students can open.</p></div>' +
    '<div class="feature"><div class="icon">✦</div><h3>Designed for Teachers</h3><p>Simple, fast and made for classrooms.</p></div></section>' +
    '<section class="info-section" id="how"><h2>How it works</h2><p>Create an activity, review the generated questions, then share it with your students.</p></section>' +
    '<section class="info-section" id="faq"><h2>Frequently asked questions</h2><p>This static demo keeps your activities in this browser. Production authentication and server-side security must be provided by a backend.</p></section>';
}

function auth(signup) {
  return '<div class="auth"><section class="auth-side">' + logo() + '<h1>' +
    (signup ? 'Make learning feel effortless.' : 'Your classroom, made creative.') +
    '</h1><p class="muted">Create. Share. Inspire.</p></section><section class="auth-main"><form class="form" id="authForm">' +
    '<h2>' + (signup ? 'Create your account' : 'Welcome back') + '</h2><p class="muted">' +
    (signup ? 'Start building activities your students will love.' : 'Log in to your account to continue') + '</p>' +
    (signup ? '<div class="field"><label>Full name</label><input required placeholder="Your name"></div>' : '') +
    '<div class="field"><label>Email address</label><input type="email" required placeholder="teacher@example.com"></div>' +
    '<div class="field"><label>Password</label><input type="password" required minlength="6" placeholder="••••••••"></div>' +
    '<button class="btn primary wide">' + (signup ? 'Create account' : 'Log in') + '</button>' +
    '<p class="muted center">' + (signup ? 'Already have an account? <a data-go="login">Log in</a>' : 'Don’t have an account? <a data-go="signup">Sign up</a>') + '</p></form></section></div>';
}

function dashboard() {
  const activities = readActivities();
  return shell(head('Welcome back, Teacher!', 'Create, manage and share engaging learning activities.', '<button class="btn primary" data-go="create">＋ Create New Activity</button>') +
    '<div class="stats">' + [['Activities created', 12 + activities.length], ['Students reached', 248], ['This week', 5], ['Completion rate', '100%']].map(item =>
      '<div class="stat"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>').join('') + '</div>' +
    '<h2 class="section">Recent Activities</h2>' + rows(activities.slice(-4).reverse()));
}

function rows(items) {
  if (!items.length) return '<div class="card muted">Your recent activities will appear here. Create your first activity to get started.</div>';
  return items.map(item => '<div class="activity"><div class="icon">' + (types.find(type => type[0] === item.type)?.[3] || '▣') + '</div>' +
    '<div class="grow"><h3>' + esc(item.title) + '</h3><p>' + (types.find(type => type[0] === item.type)?.[1] || '') + ' - ' + item.items.length + ' items</p></div>' +
    '<button class="btn soft small" data-go="editor">Edit</button><button class="btn outline small" data-go="share">Share</button></div>').join('');
}

function create() {
  return shell(head('Create a New Activity', 'Choose an activity type, then tell AI what you want to teach.') +
    '<h2 class="section">1. Choose an activity type</h2><div class="types">' + types.map(type =>
      '<button class="type ' + (state.type === type[0] ? 'selected' : '') + '" data-type="' + type[0] + '"><div class="icon">' + type[3] + '</div><h3>' + type[1] + '</h3><p>' + type[2] + '</p></button>').join('') +
    '</div><div class="card setup-card"><h2>2. Tell us what to create</h2><div class="field"><label>Topic or subject</label><input id="topic" value="' + esc(state.topic) + '" placeholder="e.g. Photosynthesis"></div>' +
    '<div class="grid2"><div class="field"><label>Number of items</label><select id="count"><option>5</option><option selected>10</option><option>15</option></select></div><div class="field"><label>Difficulty</label><select id="difficulty"><option>Easy</option><option>Medium</option><option>Hard</option></select></div></div>' +
    '<button class="btn primary" id="generate">✦ Generate Activity</button></div>');
}

function generate() {
  state.topic = document.getElementById('topic').value.trim() || types.find(type => type[0] === state.type)[4];
  state.count = Number(document.getElementById('count').value);
  const sample = samples[state.type][0];
  state.items = samples[state.type].map(item => ({ ...item })).concat(Array.from({ length: Math.max(0, state.count - 1) }, (_, index) => ({
    ...sample, q: state.topic + ' practice question ' + (index + 2)
  })));
  state.q = 0;
  state.score = 0;
  const activities = readActivities();
  activities.push({ title: state.topic, type: state.type, items: state.items });
  localStorage.setItem('neuroActs', JSON.stringify(activities));
  go('preview');
}

function preview() {
  const item = state.items[state.q] || samples[state.type][0];
  const total = state.items.length || 1;
  return shell(head('Preview activity', 'Review the activity before sharing it.', '<button class="btn outline" data-go="editor">Edit activity</button>') +
    '<div class="preview"><span class="eyebrow">Question ' + (state.q + 1) + ' of ' + total + '</span><div class="progress"><span style="width:' + (((state.q + 1) / total) * 100) + '%"></span></div>' +
    '<h2>' + esc(item.q) + '</h2>' + item.a.map((answer, index) => '<button class="answer" data-answer="' + index + '">' + esc(answer) + '</button>').join('') + '</div>');
}

function results() {
  const total = state.items.length || 1;
  const percentage = Math.round((state.score / total) * 100);
  const performance = percentage >= 80 ? ['Excellent Work!', 'You have a strong understanding of this topic.', 'good'] : percentage >= 50 ? ['Great Job!', 'You are making good progress. Keep going!', 'medium'] : ['Keep Practicing!', 'Review the material and try again.', 'low'];
  return shell('<div class="result-page"><div class="result-hero"><span class="result-badge">Activity complete</span><h1>' + performance[0] + '</h1><p>' + performance[1] + '</p><div class="score">' + percentage + '%</div><span class="performance-' + performance[2] + '">Your score</span></div>' +
    '<div class="result-grid"><div class="result-summary"><h2>Results summary</h2><div><span>Correct answers</span><strong>' + state.score + ' / ' + total + '</strong></div><div><span>Questions completed</span><strong>' + total + '</strong></div><div><span>Activity</span><strong>' + esc(state.topic || 'Learning activity') + '</strong></div></div>' +
    '<div class="achievement-card"><div class="achievement-icon">✦</div><h3>Great progress!</h3><p>Every question is a step toward mastery.</p></div></div>' +
    '<div class="result-actions"><button class="btn primary" data-go="preview">Review answers</button><button class="btn soft" id="retry">Try again</button><button class="btn outline" id="download">Download PDF</button><button class="btn outline" data-go="share">Share results</button></div></div>');
}

function makePdf() {
  const total = state.items.length || 1;
  const percentage = Math.round((state.score / total) * 100);
  const lines = ['Neuronest Activity Results', 'Activity: ' + (state.topic || 'Learning activity'), 'Score: ' + state.score + ' / ' + total, 'Percentage: ' + percentage + '%', 'Questions: ' + total];
  const escapePdf = text => text.replace(/([\\()])/g, '\\$1');
  const stream = 'BT /F1 18 Tf 72 740 Td (' + escapePdf(lines[0]) + ') Tj /F1 12 Tf 0 -32 Td (' + escapePdf(lines[1]) + ') Tj 0 -22 Td (' + escapePdf(lines[2]) + ') Tj 0 -22 Td (' + escapePdf(lines[3]) + ') Tj 0 -22 Td (' + escapePdf(lines[4]) + ') Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += (index + 1) + ' 0 obj\n' + object + '\nendobj\n'; });
  const start = pdf.length;
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n' + offsets.slice(1).map(offset => String(offset).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + start + '\n%%EOF';
  return new Blob([pdf], { type: 'application/pdf' });
}

function share() {
  const url = location.origin + location.pathname + '#play';
  const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=' + encodeURIComponent(url);
  return shell('<div class="share-page"><div class="share-card"><span class="result-badge">Share activity</span><h1>Your activity is ready to share</h1><p class="muted">Anyone with this link can play your activity.</p>' +
    '<div class="shareurl"><span id="url">' + esc(url) + '</span><button class="btn primary small" id="copy">Copy</button></div>' +
    '<div class="qr-card"><img id="qr-code" src="' + qr + '" alt="QR code for this activity"><div><h3>Scan to play</h3><p class="muted">Students can scan this code with any phone camera.</p><button class="btn outline small" id="download-qr">Download QR</button><button class="btn soft small" id="copy-qr">Copy QR</button></div></div>' +
    '<div class="share-options"><button class="share-option" data-share="email">✉ Email</button><button class="share-option" data-share="whatsapp">◉ WhatsApp</button><button class="share-option" data-share="facebook">f Facebook</button><button class="share-option" data-share="native">↗ More options</button></div><button class="btn primary wide" data-go="preview">Preview activity</button></div></div>');
}

function editor() { return shell(head('Edit activity', 'Make changes before your students begin.') + '<div class="card"><h2>' + esc(state.topic || 'Learning activity') + '</h2><p class="muted">' + state.items.length + ' questions generated. Choose Preview to play it.</p><button class="btn primary" data-go="preview">Preview activity</button></div>'); }
function routes() { return { landing, login: () => auth(false), signup: () => auth(true), dashboard, activities: dashboard, create, editor, preview, play: preview, results, share, shared: share, profile: dashboard, settings: dashboard, how: landing }; }

function bind() {
  document.querySelectorAll('[data-go]').forEach(button => button.onclick = event => { event.preventDefault(); go(button.dataset.go); });
  document.querySelectorAll('[data-type]').forEach(button => button.onclick = () => { state.type = button.dataset.type; render(); });
  document.getElementById('authForm')?.addEventListener('submit', event => { event.preventDefault(); go('dashboard'); });
  document.getElementById('generate')?.addEventListener('click', generate);
  document.getElementById('retry')?.addEventListener('click', () => { state.q = 0; state.score = 0; go('preview'); });
  document.querySelectorAll('[data-answer]').forEach(button => button.onclick = () => { const item = state.items[state.q]; if (Number(button.dataset.answer) === item.correct) state.score++; if (state.q < state.items.length - 1) { state.q++; render(); } else go('results'); });
  document.getElementById('download')?.addEventListener('click', () => { const link = document.createElement('a'); link.href = URL.createObjectURL(makePdf()); link.download = 'activity-results.pdf'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 500); toast('PDF downloaded'); });
  document.getElementById('copy')?.addEventListener('click', async () => { try { if (!navigator.clipboard) throw new Error('Clipboard unavailable'); await navigator.clipboard.writeText(document.getElementById('url').textContent); toast('Link copied successfully'); } catch { toast('Copy is unavailable in this browser'); } });
  document.getElementById('download-qr')?.addEventListener('click', async () => {
    const image = document.getElementById('qr-code');
    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'neuronest-qr.png';
      link.click();
      URL.revokeObjectURL(link.href);
      toast('QR code downloaded');
    } catch {
      safeOpen(image.src);
      toast('Opening QR code');
    }
  });
  document.getElementById('copy-qr')?.addEventListener('click', async () => {
    const image = document.getElementById('qr-code');
    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast('QR code copied');
    } catch {
      toast('QR copying is unavailable in this browser');
    }
  });
  document.querySelectorAll('[data-share]').forEach(button => button.onclick = () => { const url = encodeURIComponent(document.getElementById('url').textContent); const targets = { email: 'mailto:?subject=Try this activity&body=' + url, whatsapp: 'https://wa.me/?text=' + url, facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url }; if (button.dataset.share === 'native' && navigator.share) { navigator.share({ title: 'Neuronest activity', url: decodeURIComponent(url) }).catch(() => {}); } else if (targets[button.dataset.share]) { safeOpen(targets[button.dataset.share]); } });
}

function render() { const view = routeViews()[state.route] || landing; app.innerHTML = view(); bind(); }

function routeViews() { return { landing, login: () => auth(false), signup: () => auth(true), dashboard, activities: dashboard, create, editor, preview, play: preview, results, share, shared: share, profile: dashboard, settings: dashboard, how: landing }; }

function handleLocationChange() {
  const hash = location.hash.slice(1);
  if (sections.has(hash)) {
    state.route = 'landing';
    render();
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  state.route = appRoutes.has(hash) ? hash : 'landing';
  render();
}

window.addEventListener('hashchange', handleLocationChange);
render();