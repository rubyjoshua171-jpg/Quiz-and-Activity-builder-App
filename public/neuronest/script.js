// Neuronest is a client-side learning activity demo.
// Activities are stored locally so the static app works without a backend.
// Finds the HTML element where every application screen is rendered.
const app = document.getElementById('app');
// Connects to our Supabase project.
const sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// Our back end and the screens use different names for the activity types.
const typeMap = { mc: 'multiple_choice', tf: 'true_false', fc: 'flashcards', match: 'matching', order: 'ordering' };
const reverseTypeMap = Object.fromEntries(Object.entries(typeMap).map(([screen, ours]) => [ours, screen]));

// The logged-in teacher (null when logged out) and their saved activities.
let user = null;
let savedActivities = [];

// Screens that need a login.
const protectedRoutes = new Set(['dashboard', 'activities', 'create', 'setup', 'editor', 'preview', 'results', 'share', 'shared', 'profile', 'settings']);

// Turns an activity from our back end into the question list the screens play.
function toItems(activity) {
  if (activity.type === 'multiple_choice') {
    return activity.questions.map(q => ({ q: q.question, a: q.options, correct: q.correctIndex }));
  }
  if (activity.type === 'true_false') {
    return activity.statements.map(s => ({ q: s.statement, a: ['True', 'False'], correct: s.answer ? 0 : 1 }));
  }
  if (activity.type === 'flashcards') {
    return activity.cards.map(c => ({ q: c.front, a: [c.back], correct: 0 }));
  }
  if (activity.type === 'matching') {
    return [{ q: activity.instructions, a: activity.pairs.map(p => p.left + ' - ' + p.right), correct: 0 }];
  }
  return [{ q: activity.instructions, a: activity.items, correct: 0 }];
}

// Loads the logged-in teacher's activities from the database.
async function loadActivities() {
  const { data, error } = await sb.from('activities').select('id, type, content, created_at').order('created_at', { ascending: true });
  if (error) {
    toast('Could not load your activities');
    return;
  }
  savedActivities = data;
}

// Defines the activity types available in the activity builder.
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

// Provides sample questions for the client-side demo generator.
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

// Stores the current route, activity selection, question progress, and score.
let state = {
  route: location.hash.slice(1) || 'landing',
  type: 'mc',
  topic: '',
  count: 10,
  difficulty: 'Easy',
  items: [],
    items: [],
  activity: null,
  savedId: null,
  q: 0,
  score: 0
};

// Allows only known application routes to be rendered.
const appRoutes = new Set(['landing', 'login', 'signup', 'dashboard', 'activities', 'create', 'setup', 'editor', 'preview', 'play', 'results', 'share', 'shared', 'profile', 'settings', 'how']);

// Identifies landing-page anchors that should scroll instead of changing screens.
const sections = new Set(['features', 'how', 'faq']);

// Returns the logged-in teacher's saved activities in the shape the screens use.
function readActivities() {
  return savedActivities.map(row => ({
    id: row.id,
    title: row.content.title,
    type: reverseTypeMap[row.type],
    items: toItems(row.content)
  }));
}

// Opens only approved external protocols in a protected new window.
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

// Escapes user-provided text before inserting it into generated HTML.
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

// Changes the current application route and renders the new screen.
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
  if (user && (route === 'dashboard' || route === 'activities')) {
    loadActivities().then(render);
  }
}

// Displays a short status message in the accessible toast region.
function toast(message) {
  const node = document.getElementById('toast');
  node.textContent = message;
  node.classList.add('show');
  window.setTimeout(() => node.classList.remove('show'), 2200);
}

// Returns the reusable Neuronest brand markup.
function logo() {
  return '<div class="brand"><b>N</b><span>NEURONEST</span></div>';
}

// Returns a small text icon for sidebar navigation.
function icon(name) {
  return { home: '⌂', list: '▤', add: '＋', share: '↗', user: '♙', settings: '⚙' }[name] || '✦';
}

// Builds the dashboard sidebar and its navigation buttons.
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

// Wraps dashboard content with the sidebar and main content area.
function shell(content) {
  return '<div class="layout">' + side() + '<main class="main">' + content + '</main></div>';
}

// Builds a consistent page heading with an optional action button.
function head(title, subtitle, action = '') {
  return '<div class="head"><div><h1>' + title + '</h1><p>' + subtitle + '</p></div>' + action + '</div>';
}

// Builds the public landing page and its informational sections.
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

// Builds the demo login or signup form.
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

// Builds the dashboard and displays saved activities and summary statistics.
function dashboard() {
  const activities = readActivities();
  return shell(head('Welcome back, Teacher!', 'Create, manage and share engaging learning activities.', '<button class="btn primary" data-go="create">＋ Create New Activity</button>') +
    '<div class="stats">' + [['Activities created', 12 + activities.length], ['Students reached', 248], ['This week', 5], ['Completion rate', '100%']].map(item =>
      '<div class="stat"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>').join('') + '</div>' +
    '<h2 class="section">Recent Activities</h2>' + rows(activities.slice(-4).reverse()));
}

// Converts saved activities into dashboard activity rows.
function rows(items) {
  if (!items.length) return '<div class="card muted">Your recent activities will appear here. Create your first activity to get started.</div>';
  return items.map(item => '<div class="activity"><div class="icon">' + (types.find(type => type[0] === item.type)?.[3] || '▣') + '</div>' +
    '<div class="grow"><h3>' + esc(item.title) + '</h3><p>' + (types.find(type => type[0] === item.type)?.[1] || '') + ' - ' + item.items.length + ' items</p></div>' +
    '<button class="btn soft small" data-open="' + esc(item.id) + '" data-then="editor">Edit</button><button class="btn outline small" data-open="' + esc(item.id) + '" data-then="share">Share</button></div>').join('');
}

// Builds the activity-type and activity-settings form.
function create() {
  return shell(head('Create a New Activity', 'Choose an activity type, then tell AI what you want to teach.') +
    '<h2 class="section">1. Choose an activity type</h2><div class="types">' + types.map(type =>
      '<button class="type ' + (state.type === type[0] ? 'selected' : '') + '" data-type="' + type[0] + '"><div class="icon">' + type[3] + '</div><h3>' + type[1] + '</h3><p>' + type[2] + '</p></button>').join('') +
    '</div>');
}

// Builds the Figma-style setup screen for the selected activity type.
function setup() {
  const selected = types.find(type => type[0] === state.type) || types[0];
  return shell(head('Create ' + selected[1], 'Tell us what you want to teach and we will prepare the activity.', '<button class="btn outline" data-go="create">← Change type</button>') +
    '<div class="setup-layout"><div class="setup-card card"><div class="setup-title"><div class="icon">' + selected[3] + '</div><div><h2>' + selected[1] + '</h2><p>' + selected[2] + '</p></div></div>' +
    '<div class="field"><label for="topic">What should this activity be about?</label><input id="topic" maxlength="120" value="' + esc(state.topic) + '" placeholder="e.g. Photosynthesis"></div>' +
    '<div class="grid2"><div class="field"><label for="count">Number of questions</label><select id="count"><option value="5">5 questions</option><option value="10" selected>10 questions</option><option value="15">15 questions</option></select></div>' +
    '<div class="field"><label for="difficulty">Difficulty</label><select id="difficulty"><option>Easy</option><option>Medium</option><option>Hard</option></select></div></div>' +
    '<div class="field"><label for="instructions">Additional instructions <span class="muted">(optional)</span></label><textarea id="instructions" rows="4" maxlength="500" placeholder="Add details or learning goals..."></textarea></div>' +
    '<div class="tip">✦ You can review and edit every question after generation.</div><button class="btn primary wide" id="generate">✦ Generate Activity</button></div>' +
    '<aside class="setup-help card"><h3>Activity preview</h3><div class="icon">' + selected[3] + '</div><h2>' + selected[1] + '</h2><p class="muted">' + selected[2] + '</p><div class="help-row"><span>Questions</span><strong>10</strong></div><div class="help-row"><span>Difficulty</span><strong>Easy</strong></div></aside></div>');
}

// Creates sample activity items and saves the activity locally.
async function generate() {
  const ourType = typeMap[state.type];
  if (!ourType) {
    toast('This activity type is coming soon');
    return;
  }
  const topic = document.getElementById('topic').value.trim();
  if (topic.length > 120) {
    toast('Topic must be 120 characters or fewer');
    return;
  }
  const count = document.getElementById('count').value;
  const difficulty = document.getElementById('difficulty').value;
  const extra = document.getElementById('instructions').value.trim();
  const subject = topic || types.find(type => type[0] === state.type)[4];
  const prompt = subject + '. ' + count + ' items. Difficulty: ' + difficulty + '. ' + extra;

  const button = document.getElementById('generate');
  button.disabled = true;
  button.textContent = 'Generating...';
  try {
        const { data: sessionData } = await sb.auth.getSession();
    const token = sessionData.session?.access_token;
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token || '') },
      body: JSON.stringify({ type: ourType, prompt })
    });
    const result = await response.json();
    if (!result.ok) {
      toast(result.error || 'Something went wrong. Please try again.');
      return;
    }

    // Save the activity under the logged-in teacher.
    const { data: saved, error } = await sb.from('activities').insert({ type: ourType, content: result.activity }).select('id').single();
    if (error) {
      toast('Could not save: ' + error.message);
      return;
    }

    state.activity = result.activity;
    state.items = toItems(result.activity);
    state.topic = result.activity.title;
    state.savedId = saved.id;
    state.q = 0;
    state.score = 0;
    go('preview');
  } catch {
    toast('Could not reach the server. Please try again.');
  } finally {
    button.disabled = false;
    button.textContent = '✦ Generate Activity';
  }
}
// Builds the screen used to answer one activity question at a time.
function preview() {
  const item = state.items[state.q] || samples[state.type][0];
  const total = state.items.length || 1;
  return shell(head('Preview activity', 'Review the activity before sharing it.', '<button class="btn outline" data-go="editor">Edit activity</button>') +
    '<div class="preview"><span class="eyebrow">Question ' + (state.q + 1) + ' of ' + total + '</span><div class="progress"><span style="width:' + (((state.q + 1) / total) * 100) + '%"></span></div>' +
    '<h2>' + esc(item.q) + '</h2>' + item.a.map((answer, index) => '<button class="answer" data-answer="' + index + '">' + esc(answer) + '</button>').join('') + '</div>');
}

// Builds the score summary and result actions after the final answer.
function results() {
  const total = state.items.length || 1;
  const percentage = Math.round((state.score / total) * 100);
  const performance = percentage >= 80 ? ['Excellent Work!', 'You have a strong understanding of this topic.', 'good'] : percentage >= 50 ? ['Great Job!', 'You are making good progress. Keep going!', 'medium'] : ['Keep Practicing!', 'Review the material and try again.', 'low'];
  return shell('<div class="result-page"><div class="result-hero"><span class="result-badge">Activity complete</span><h1>' + performance[0] + '</h1><p>' + performance[1] + '</p><div class="score">' + percentage + '%</div><span class="performance-' + performance[2] + '">Your score</span></div>' +
    '<div class="result-grid"><div class="result-summary"><h2>Results summary</h2><div><span>Correct answers</span><strong>' + state.score + ' / ' + total + '</strong></div><div><span>Questions completed</span><strong>' + total + '</strong></div><div><span>Activity</span><strong>' + esc(state.topic || 'Learning activity') + '</strong></div></div>' +
    '<div class="achievement-card"><div class="achievement-icon">✦</div><h3>Great progress!</h3><p>Every question is a step toward mastery.</p></div></div>' +
    '<div class="result-actions"><button class="btn primary" data-go="preview">Review answers</button><button class="btn soft" id="retry">Try again</button><button class="btn outline" id="download">Download PDF</button><button class="btn outline" data-go="share">Share results</button></div></div>');
}

// Creates a minimal PDF Blob containing the activity result summary.
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

// Builds the share page, public URL, QR code, and sharing controls.
function share() {
    if (!state.savedId) {
    return shell(head('Share activity', 'Open one of your activities first.') + '<div class="card muted">Go to My Activities and press Share on an activity.</div>');
  }
  const url = location.origin + '/a/' + state.savedId;
  const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=' + encodeURIComponent(url);
  return shell('<div class="share-page"><div class="share-card"><span class="result-badge">Share activity</span><h1>Your activity is ready to share</h1><p class="muted">Anyone with this link can play your activity.</p>' +
    '<div class="shareurl"><span id="url">' + esc(url) + '</span><button class="btn primary small" id="copy">Copy</button></div>' +
    '<div class="qr-card"><img id="qr-code" src="' + qr + '" alt="QR code for this activity"><div><h3>Scan to play</h3><p class="muted">Students can scan this code with any phone camera.</p><button class="btn outline small" id="download-qr">Download QR</button><button class="btn soft small" id="copy-qr">Copy QR</button></div></div>' +
    '<div class="share-options"><button class="share-option" data-share="email">✉ Email</button><button class="share-option" data-share="whatsapp">◉ WhatsApp</button><button class="share-option" data-share="facebook">f Facebook</button><button class="share-option" data-share="native">↗ More options</button></div><button class="btn primary wide" data-go="preview">Preview activity</button></div></div>');
}

// Builds the activity editor summary screen.
function editor() {
  if (!state.activity) {
    return shell(head('Edit activity', 'Open one of your activities first.') + '<div class="card muted">Go to My Activities and press Edit on an activity.</div>');
  }
  return shell(head('Edit activity', 'Ask the AI to change this activity, then preview it.') +
    '<div class="card"><h2>' + esc(state.topic || 'Learning activity') + '</h2><p class="muted">' + state.items.length + ' items.</p>' +
    '<div class="field"><label for="refineText">What should change?</label><input id="refineText" maxlength="300" placeholder="e.g. Make question 3 harder, or add two more questions"></div>' +
    '<button class="btn primary" id="refine">✦ Refine with AI</button> <button class="btn outline" data-go="preview">Preview activity</button></div>');
}

// Sends a change request to the AI, then saves the new version over the old one.
async function refine() {
  const text = document.getElementById('refineText').value.trim();
  if (!text) {
    toast('Tell the AI what to change');
    return;
  }
  const button = document.getElementById('refine');
  
  button.disabled = true;
  button.textContent = 'Refining...';
  try {
    const { data: sessionData } = await sb.auth.getSession();
    const token = sessionData.session?.access_token;
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token || '') },
      body: JSON.stringify({ type: state.activity.type, prompt: text, currentActivity: state.activity })
    });
    const result = await response.json();
    if (!result.ok) {
      toast(result.error || 'Something went wrong. Your activity is unchanged.');
      return;
    }
    const { error } = await sb.from('activities').update({ content: result.activity, updated_at: new Date().toISOString() }).eq('id', state.savedId);
    if (error) {
      toast('Could not save: ' + error.message);
      return;
    }
    state.activity = result.activity;
    state.items = toItems(result.activity);
    state.topic = result.activity.title;
    state.q = 0;
    state.score = 0;
    toast('Activity updated');
    render();
  } catch {
    toast('Could not reach the server. Your activity is unchanged.');
  } finally {
    button.disabled = false;
    button.textContent = '✦ Refine with AI';
  }
}
// Reads the demo profile from localStorage or returns the default teacher profile.
function readProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem('neuroProfile') || '{}');
    return {
      name: typeof saved.name === 'string' ? saved.name : 'Teacher',
      email: typeof saved.email === 'string' ? saved.email : 'teacher@example.com',
      role: typeof saved.role === 'string' ? saved.role : 'Teacher',
      bio: typeof saved.bio === 'string' ? saved.bio : 'Creating better learning experiences, one activity at a time.'
    };
  } catch {
    return { name: 'Teacher', email: 'teacher@example.com', role: 'Teacher', bio: 'Creating better learning experiences, one activity at a time.' };
  }
}

// Builds the profile page with personal information and account statistics.
function profile() {
  const user = readProfile();
  const activities = readActivities();
  return shell(head('Profile', 'Manage your personal information and teacher profile.') +
    '<div class="profile-layout"><section class="profile-main card"><div class="profile-cover"><div class="profile-avatar">' + esc(user.name.charAt(0).toUpperCase()) + '</div><div><h2>' + esc(user.name) + '</h2><p>' + esc(user.role) + '</p></div><span class="profile-status">Active</span></div>' +
    '<form id="profileForm"><div class="profile-section"><div><h3>Personal information</h3><p class="muted">This information is saved only in this browser demo.</p></div><div class="grid2"><div class="field"><label for="profileName">Full name</label><input id="profileName" maxlength="80" value="' + esc(user.name) + '"></div><div class="field"><label for="profileEmail">Email address</label><input id="profileEmail" type="email" maxlength="120" value="' + esc(user.email) + '"></div></div><div class="field"><label for="profileRole">Role</label><select id="profileRole"><option ' + (user.role === 'Teacher' ? 'selected' : '') + '>Teacher</option><option ' + (user.role === 'Tutor' ? 'selected' : '') + '>Tutor</option><option ' + (user.role === 'Student' ? 'selected' : '') + '>Student</option></select></div><div class="field"><label for="profileBio">About you</label><textarea id="profileBio" maxlength="240" rows="4">' + esc(user.bio) + '</textarea></div></div><div class="profile-actions"><button class="btn primary" type="submit">Save changes</button><button class="btn outline" type="button" data-go="dashboard">Cancel</button></div></form></section>' +
    '<aside class="profile-side"><div class="card profile-stat-card"><span class="eyebrow">Your activity</span><div class="profile-stat"><strong>' + activities.length + '</strong><span>Activities created</span></div><div class="profile-stat"><strong>248</strong><span>Students reached</span></div><div class="profile-stat"><strong>100%</strong><span>Completion rate</span></div></div><div class="card profile-note"><div class="icon">✦</div><h3>Keep building</h3><p class="muted">Create activities that make learning more interactive and memorable.</p><button class="btn soft small" data-go="create">Create activity</button></div></aside></div>');
}

// Builds the settings page with preference, notification, and account sections.
function settings() {
  return shell(head('Settings', 'Customize your Neuronest experience.') +
    '<div class="settings-layout"><section class="settings-main card"><div class="settings-heading"><div class="icon">⚙</div><div><h2>Preferences</h2><p class="muted">Choose how the app should work for you.</p></div></div>' +
    '<div class="setting-row"><div><strong>Show activity tips</strong><p class="muted">Display helpful suggestions while creating activities.</p></div><label class="switch"><input id="tipsSetting" type="checkbox" checked><span></span></label></div>' +
    '<div class="setting-row"><div><strong>Save activity history</strong><p class="muted">Keep generated activities available on your dashboard.</p></div><label class="switch"><input id="historySetting" type="checkbox" checked><span></span></label></div>' +
    '<div class="setting-row"><div><strong>Email updates</strong><p class="muted">Receive occasional product and learning updates.</p></div><label class="switch"><input id="emailSetting" type="checkbox"><span></span></label></div>' +
    '<div class="settings-heading settings-heading-spaced"><div class="icon">◉</div><div><h2>Default activity settings</h2><p class="muted">These defaults are used when you create a new activity.</p></div></div>' +
    '<div class="grid2"><div class="field"><label for="defaultDifficulty">Default difficulty</label><select id="defaultDifficulty"><option>Easy</option><option>Medium</option><option>Hard</option></select></div><div class="field"><label for="defaultCount">Default questions</label><select id="defaultCount"><option>5</option><option selected>10</option><option>15</option></select></div></div><button class="btn primary" id="saveSettings">Save settings</button></section>' +
    '<aside class="settings-side"><div class="card settings-account"><h3>Account</h3><button class="settings-link" data-go="profile">♙ Edit profile <span>›</span></button><button class="settings-link" id="resetDemo">↻ Reset demo data <span>›</span></button><button class="settings-link danger" data-go="landing">⇥ Log out <span>›</span></button></div><div class="card privacy-card"><div class="icon">🔒</div><h3>Your privacy matters</h3><p class="muted">This demo stores preferences and activities locally in your browser. Never enter real passwords or sensitive information.</p></div></aside></div>');
}

// Maps route names to the functions that render each screen.
function routes() { return { landing, login: () => auth(false), signup: () => auth(true), dashboard, activities: dashboard, create, setup, editor, preview, play: preview, results, share, shared: share, profile, settings, how: landing }; }

// Connects buttons, forms, answer choices, downloads, clipboard actions, and sharing controls.
function bind() {
  document.querySelectorAll('[data-go]').forEach(button => button.onclick = event => { event.preventDefault(); go(button.dataset.go); });
  document.querySelectorAll('[data-type]').forEach(button => button.onclick = () => { state.type = button.dataset.type; state.topic = ''; go('setup'); });
    document.getElementById('authForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value.trim();
    const password = event.target.querySelector('input[type="password"]').value;
    const signingUp = state.route === 'signup';
    const { data, error } = signingUp
      ? await sb.auth.signUp({ email, password })
      : await sb.auth.signInWithPassword({ email, password });
    if (error) {
      toast(error.message);
      return;
    }
    if (signingUp && !data.session) {
      toast('Check your email to confirm your account, then log in');
      go('login');
      return;
    }
    user = data.session?.user ?? null;
    go('dashboard');
  });
  document.querySelectorAll('[data-open]').forEach(button => button.onclick = () => {
    const row = savedActivities.find(item => item.id === button.dataset.open);
    if (!row) return;
    state.activity = row.content;
    state.items = toItems(row.content);
    state.topic = row.content.title;
    state.type = reverseTypeMap[row.type];
    state.savedId = row.id;
    state.q = 0;
    state.score = 0;
    go(button.dataset.then);
  });
  document.querySelector('.logout')?.addEventListener('click', () => { sb.auth.signOut(); });
  document.getElementById('generate')?.addEventListener('click', generate);
    document.getElementById('refine')?.addEventListener('click', refine);
  document.getElementById('profileForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const profileData = {
      name: document.getElementById('profileName').value.trim(),
      email: document.getElementById('profileEmail').value.trim(),
      role: document.getElementById('profileRole').value,
      bio: document.getElementById('profileBio').value.trim()
    };
    if (!profileData.name || !profileData.email) {
      toast('Name and email are required');
      return;
    }
    localStorage.setItem('neuroProfile', JSON.stringify(profileData));
    toast('Profile saved');
    render();
  });
  document.getElementById('saveSettings')?.addEventListener('click', () => {
    localStorage.setItem('neuroSettings', JSON.stringify({
      tips: document.getElementById('tipsSetting').checked,
      history: document.getElementById('historySetting').checked,
      email: document.getElementById('emailSetting').checked,
      difficulty: document.getElementById('defaultDifficulty').value,
      count: document.getElementById('defaultCount').value
    }));
    toast('Settings saved');
  });
  document.getElementById('resetDemo')?.addEventListener('click', () => {
    if (!window.confirm('Reset saved activities and profile data for this browser?')) {
      return;
    }
    localStorage.removeItem('neuroActs');
    localStorage.removeItem('neuroProfile');
    localStorage.removeItem('neuroSettings');
    toast('Demo data reset');
    render();
  });
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

// Renders the current route and reconnects handlers after the HTML is replaced.
function render() {
  if (!user && protectedRoutes.has(state.route)) {
    state.route = 'login';
    location.hash = 'login';
  }
  const view = routeViews()[state.route] || landing;
  app.innerHTML = view();
  bind();
}

// Returns the route-to-render-function map used by render.
function routeViews() { return { landing, login: () => auth(false), signup: () => auth(true), dashboard, activities: dashboard, create, setup, editor, preview, play: preview, results, share, shared: share, profile, settings, how: landing }; }

// Handles browser back and forward navigation through URL hash changes.
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

// Keeps the interface synchronized with browser hash navigation.
window.addEventListener('hashchange', handleLocationChange);

// Renders the initial screen when the script loads.
// Checks for an existing login, then renders the first screen.
async function init() {
  const { data } = await sb.auth.getSession();
  user = data.session?.user ?? null;
  sb.auth.onAuthStateChange((_event, session) => {
    user = session?.user ?? null;
    if (!user) savedActivities = [];
  });
  if (user) await loadActivities();
  render();
}
init();