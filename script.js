const API_BASE = (() => {
    // Use localhost when running locally or from a file, otherwise use the Render deployment
    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:') {
        return 'http://localhost:3000';
    }
    return 'https://when-the-lights-go-out.onrender.com';
})();

const state = {
    version: '2.1-SECURE',
    screen: 'check_auth',
    currentMysteryIndex: 0,
    currentMystery: null, // loaded from server — contains NO secrets
    selectedSuspectId: null,
    log: [],
    result: null, // 'win', 'lose', 'game_over', 'check_auth'
    inventory: { truth: 1, intimidation: 1, charm: 1 },
    questionsAsked: {},
    guessesRemaining: 3,
    score: 0,
    highestScore: 0,
    streak: 0,
    mysteryStartTime: null,
    activePowerUp: null,
    isGenerating: false,
    user: null
};

// Fetches the public (secret-free) mystery data for a given index from the server
async function loadMystery(index) {
    try {
        const res = await fetch(`${API_BASE}/api/mystery/${index}`);
        if (!res.ok) throw new Error('Mystery not found');
        state.currentMystery = await res.json();
    } catch (e) {
        console.error('Failed to load mystery:', e);
        state.currentMystery = null;
    }
}

const questions = [
    "Why were you at the scene tonight?",
    "What is your profession?",
    "Did you recognize anyone before the blackout?",
    "Exactly what did you hear when the lights went out?",
    "Tell me about a deeply important secret from your past."
];

async function initGame() {
    // Attempt to play music on first interaction if it hasn't started
    const startMusic = () => {
        ensureMusicPlays();
        // Remove listeners once music starts
        window.removeEventListener('mousedown', startMusic);
        window.removeEventListener('touchstart', startMusic);
        window.removeEventListener('keydown', startMusic);
    };
    window.addEventListener('mousedown', startMusic);
    window.addEventListener('touchstart', startMusic);
    window.addEventListener('keydown', startMusic);

    try {
        const res = await fetch(`${API_BASE}/api/mysteries`);
        const data = await res.json();
        
        // Dynamically unlock cases up to the new expanded length 
        if (data && data.length > 0) {
            MYSTERY_COUNT = data.length;
            window.allMysteriesList = data;
        }

        // We no longer rely on the client knowing everything.
        // We just fetch the current mystery dynamically.
    } catch (e) {
        console.error('Failed to init game:', e);
    }
}

const powerUps = [
    { id: 'truth', name: 'Truth Serum', effect: "The suspect is compelled to drop a heavy hint about their hidden truth." },
    { id: 'intimidation', name: 'Intimidate', effect: "The suspect is terrified and panicked, making them highly defensive but prone to slipping up." },
    { id: 'charm', name: 'Charm', effect: "The suspect is swept off their feet and tries to be extremely cooperative." }
];

// --- GAME STATE ---
let MYSTERY_COUNT = 8; // Automatically overridden in initGame based on the server response
const MAX_STREAK = 5;

const App = document.getElementById('app');

function render() {
    App.innerHTML = '';

    if (state.user) {
        const topBtn = document.createElement('button');
        topBtn.className = 'primary-btn';
        topBtn.style = 'position: fixed; top: 20px; left: 20px; z-index: 1000; padding: 10px 20px; font-weight: bold; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); font-size: 0.95rem;';
        topBtn.innerHTML = '🌍 Global Leaderboard';
        topBtn.onclick = showLeaderboard;
        App.appendChild(topBtn);

        const header = document.createElement('div');
        header.className = 'user-header';
        header.innerHTML = `
            <div class="user-info">
                <img src="${state.user.photoURL || 'https://via.placeholder.com/32'}" alt="Avatar">
                <div class="detective-stats">
                    <span>Detective ${state.user.displayName ? state.user.displayName.split(' ')[0] : 'Incognito'}</span>
                    <div class="stat-pills">
                        <span class="stat-pill score-pill">SCORE: ${state.score}</span>
                    </div>
                </div>
            </div>
            <div class="header-items">
            <span class="version-tag">${state.version}</span>
            <span class="difficulty-pill">${getDifficultyLabel()}</span>
            <span class="streak-pill">STREAK: ${state.streak}🔥</span>
            <span class="guesses-pill">ACCUSATIONS: ${state.guessesRemaining}</span>
            <button class="sign-out-btn" onclick="signOutUser()">Sign Out</button>
        </div>
        `;
        App.appendChild(header);
    }

    if (state.screen === 'check_auth') {
        const div = document.createElement('div');
        div.className = 'fade-in start-screen';
        div.innerHTML = `<h1 style="color: var(--text-muted); font-size: 2rem;">Loading Archives...</h1>`;
        App.appendChild(div);
    } else if (state.screen === 'start') {
        App.appendChild(createStartScreen());
    } else if (state.screen === 'game') {
        App.appendChild(createGameScreen());
    } else if (state.screen === 'result') {
        App.appendChild(createResultScreen());
    }
}

function createStartScreen() {
    const div = document.createElement('div');
    div.className = 'fade-in start-screen';

    if (!state.user) {
        div.innerHTML = `
            <h1>When the Lights Go Out</h1>
            <p>
                Step into the shoes of a lead detective in an interactive, AI-driven series of psychological mysteries. 
                <br><br>
                Sign in to sync your case files and preserve your psychological inventory across incidents.
            </p>
            <button class="primary-btn" onclick="signIn()">
                <span>Sign in to access secure terminals</span>
            </button>
        `;
    } else {
        const currentMystery = state.currentMystery;
        const index = state.currentMysteryIndex;
        const maxQ = index < 4 ? 6 : (index < 8 ? 4 : 3);
        const diffLabel = index < 4 ? 'EASY' : (index < 8 ? 'MEDIUM' : 'HARD');
        
        div.innerHTML = `
            <h1>When the Lights Go Out</h1>
            <p>
                <span class="stat-pill difficulty-pill" style="font-size: 1rem !important; padding: 5px 20px;">${diffLabel} MODE</span><br><br>
                <b>Current Case: ${currentMystery ? currentMystery.title : 'Loading...'}</b><br><br>
                ${currentMystery ? currentMystery.setting : ''}<br><br>
                ${currentMystery ? `You have ${currentMystery.suspects.length} suspects.` : ''} 
                You may only interrogate a suspect <b>${maxQ} times</b> before they refuse to speak.<br><br>
                <b>WARNING:</b> You only get <b>3 Accusations</b> total per case. If you frame innocent people 3 times, you will be stripped of your rank and demoted to work a previous unsolved case!
            </p>
            <button class="primary-btn" style="margin-top: 20px;" onclick="startGame()">Start Investigation</button>
        `;
    }
    return div;
}

function createGameScreen() {
    const layout = document.createElement('div');
    layout.className = 'fade-in game-layout';
    const currentMystery = state.currentMystery;

    // Left Column: Suspects List
    const suspectsCol = document.createElement('div');
    suspectsCol.className = 'column glass-panel';
    suspectsCol.innerHTML = `<div class="column-header">The Suspects</div>`;

    const suspectList = document.createElement('div');
    suspectList.className = 'suspect-list';

    currentMystery.suspects.forEach(s => {
        const card = document.createElement('div');
        card.className = `suspect-card ${state.selectedSuspectId === s.id ? 'active' : ''}`;
        card.onclick = () => selectSuspect(s.id);

        const maxQuestions = state.currentMysteryIndex < 4 ? 6 : (state.currentMysteryIndex < 8 ? 4 : 3);
        let subText = s.role;
        const asked = state.questionsAsked[s.id] || 0;
        if (asked >= maxQuestions) {
            subText = `<span style="color: #ff6b6b;">exhausted (${maxQuestions}/${maxQuestions})</span>`;
        } else if (asked > 0) {
            subText = `${s.role} <span style="color: var(--accent-gold); font-size: 0.75rem;">(${asked}/${maxQuestions} asked)</span>`;
        }

        card.innerHTML = `
            <div class="card-avatar" style="background-image: url('${s.avatar}')"></div>
            <div class="card-info">
                <h3>${s.name}</h3>
                <p>${subText}</p>
            </div>
        `;
        suspectList.appendChild(card);
    });
    suspectsCol.appendChild(suspectList);

    // Middle Column: Interrogation Area
    const middleCol = document.createElement('div');
    middleCol.className = 'column glass-panel';
    middleCol.innerHTML = `<div class="column-header">Interrogation</div>`;

    const interrogationArea = document.createElement('div');
    interrogationArea.className = 'interrogation-area';

    if (state.selectedSuspectId) {
        const target = currentMystery.suspects.find(s => s.id === state.selectedSuspectId);

        const profile = document.createElement('div');
        profile.className = 'suspect-profile';
        profile.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar" style="background-image: url('${target.avatar}')"></div>
                <div class="info">
                    <h2>${target.name}</h2>
                    <p>${target.desc}</p>
                </div>
            </div>
            <div>
                <button class="accuse-btn" onclick="accuse('${target.id}')">Accuse ${target.name}</button>
            </div>
        `;
        interrogationArea.appendChild(profile);

        const qContainer = document.createElement('div');
        qContainer.className = 'questions-container';

        const askedCount = state.questionsAsked[target.id] || 0;
        
        // Difficulty-based question limits: 1-4 (Easy:6), 5-8 (Medium:4), 9-12 (Hard:3)
        let maxQuestions = 4; // Default Medium
        let difficultyLabel = 'MEDIUM';
        if (state.currentMysteryIndex < 4) {
            maxQuestions = 6;
            difficultyLabel = 'EASY';
        } else if (state.currentMysteryIndex >= 8) {
            maxQuestions = 3;
            difficultyLabel = 'HARD';
        }

        if (askedCount >= maxQuestions) {
            qContainer.innerHTML = `<div class="log-entry system" style="text-align:center;">
                <span style="color: var(--accent); font-weight: bold;">[${difficultyLabel} MODE]</span><br>
                You have exhausted all ${maxQuestions} questions for ${target.name}. They refuse to speak further.
            </div>`;
        } else {
            questions.forEach((q, index) => {
                const btn = document.createElement('button');
                btn.className = 'question-btn';
                btn.innerText = q;

                if (state.isGenerating) btn.disabled = true;

                btn.onclick = () => askQuestion(target.id, index);
                qContainer.appendChild(btn);
            });
        }
        interrogationArea.appendChild(qContainer);
    } else {
        interrogationArea.innerHTML = `
            <div style="display:flex; height:100%; align-items:center; justify-content:center; color: var(--text-muted);">
                Select a suspect from the list to begin questioning.
            </div>
        `;
    }
    middleCol.appendChild(interrogationArea);

    // Right Column: Detective Notebook and Shop
    const notebookCol = document.createElement('div');
    notebookCol.className = 'column glass-panel';

    const shopPanel = document.createElement('div');
    shopPanel.className = 'shop-panel';
    shopPanel.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px; width: 100%; text-align: left; font-weight: bold; font-family: var(--font-title);">
            INVENTORY (Select to queue for your next question):
        </div>
        <div class="shop-row">
            ${powerUps.map(p => {
        const qty = state.inventory[p.id] || 0;
        return `
                <button class="powerup-btn ${state.activePowerUp === p.id ? 'active' : ''}" 
                    ${qty <= 0 || state.isGenerating || state.activePowerUp !== null ? 'disabled' : ''}
                    onclick="usePowerUp('${p.id}')"
                    title="${p.effect}">
                    ${p.name} <br> <span style="font-size: 0.75rem;">Qty: ${qty}</span>
                </button>
            `}).join('')}
        </div>
    `;

    const notebookTitle = document.createElement('div');
    notebookTitle.className = 'column-header';
    notebookTitle.innerHTML = `Detective's Notebook`;

    const notebook = document.createElement('div');
    notebook.className = 'notebook';

    if (state.log.length === 0) {
        notebook.innerHTML = `<div class="log-entry system">Notebook is currently empty. Ask a question.</div>`;
    } else {
        [...state.log].reverse().forEach(entry => {
            if (entry.type === 'qna') {
                const logItem = document.createElement('div');
                logItem.className = 'log-entry';

                let powerIcon = '';
                if (entry.powerUp === 'truth') powerIcon = ' 🧪 (Truth Serum)';
                if (entry.powerUp === 'intimidation') powerIcon = ' 💢 (Intimidated)';
                if (entry.powerUp === 'charm') powerIcon = ' ✨ (Charmed)';

                if (entry.status === 'thinking') {
                    logItem.innerHTML = `
                        <span class="log-character">${entry.name}${powerIcon}</span>
                        <div class="log-q">Q: ${entry.question}</div>
                        <div class="log-a thinking-text">Thinking... Response is generating...</div>
                    `;
                } else {
                    logItem.innerHTML = `
                        <span class="log-character">${entry.name}${powerIcon}</span>
                        <div class="log-q">Q: ${entry.question}</div>
                        <div class="log-a">"${entry.answer}"</div>
                    `;
                }
                notebook.appendChild(logItem);
            } else {
                const logItem = document.createElement('div');
                logItem.className = 'log-entry system';
                logItem.innerText = entry.text;
                notebook.appendChild(logItem);
            }
        });
    }

    notebookCol.appendChild(shopPanel);
    notebookCol.appendChild(notebookTitle);
    notebookCol.appendChild(notebook);

    layout.appendChild(suspectsCol);
    layout.appendChild(middleCol);
    layout.appendChild(notebookCol);

    return layout;
}

function createResultScreen() {
    const div = document.createElement('div');
    div.className = 'fade-in start-screen';
    const currentMystery = state.currentMystery;

    if (state.result === 'win') {
        const stats = state.lastMysteryStats || {};
        const hasNext = state.currentMysteryIndex < MYSTERY_COUNT - 1;
        const killer = currentMystery.suspects.find(s => s.id === currentMystery.killerId);
        div.innerHTML = `
            <h1 style="color: #4ade80;">Case Solved</h1>
            <div class="bonus-summary">
                <div class="bonus-row"><span>Timed Bonus (${stats.secondsTaken}s):</span> <span class="pts">+${stats.timedBonus}</span></div>
                <div class="bonus-row"><span>Accuracy Bonus:</span> <span class="pts">+${stats.accuracyBonus}</span></div>
                <div class="bonus-row"><span>Streak Bonus:</span> <span class="pts">+${stats.streakBonus}</span></div>
                <div class="total-mystery-score">Total Points: ${stats.totalMysteryScore}</div>
            </div>
            <div class="motive-reveal glass-panel" style="margin: 20px 0; padding: 20px; text-align: left; border-left: 4px solid var(--accent-gold);">
                <h3 style="color: var(--accent-gold); margin-top: 0;">🕵️ The Killer's Motive</h3>
                <p style="color: #eee; font-style: italic; line-height: 1.5;">"${killer.hiddenTruth}"</p>
            </div>
            <p style="color: #fff; font-size: 1rem; max-width: 800px; text-align: left;">
                Excellent deductive work, Detective. You correctly deduced the killer's identity!<br><br>
                <b>Reward:</b> +1 Truth Serum, +1 Intimidation, +1 Charm added to your inventory.
            </p>
            ${hasNext
                ? '<button class="primary-btn" onclick="nextMystery()">Next Case</button>'
                : '<p style="color: var(--accent-gold);">You have solved all available cases. You are a legendary detective.</p><button class="primary-btn" onclick="nextMystery()">Play Again</button>'}
        `;
    } else if (state.result === 'game_over') {
        div.innerHTML = `
            <h1 style="color: #ff3333;">Game Over - Hard Reset</h1>
            <p style="color: #fff; font-size: 1.2rem; max-width: 800px; text-align: left;">
                You framed innocent people 3 times. Your disastrous mishandling of these cases has resulted in your permanent dismissal from the force.<br><br>
                <b>Your Career is Finished.</b> All progress, scores, and inventory have been wiped. You must start over from Case 1.
            </p>
            <button class="primary-btn" onclick="resetGame()">Restart Entire Career</button>
        `;
    } else {
        div.innerHTML = `
            <h1 style="color: #ff6b6b;">Wrong Suspect</h1>
            <p style="color: #fff; font-size: 1.2rem; max-width: 800px; text-align: left;">
                You accused the wrong person. This innocent civilian is terrifyingly confused.<br><br>
                You have <b>${state.guessesRemaining}</b> accusations remaining before you are removed from the case.
            </p>
            <button class="primary-btn" onclick="continueGame()">Keep Investigating</button>
        `;
    }
    return div;
}

// ----- AUTHENTICATION & FIRESTORE LOGIC -----

async function handleAuthState(user) {
    state.user = user;
    if (user) {
        try {
            const { getDoc, doc } = window.firebaseAPI;
            const pDoc = await getDoc(doc(window.db, "players", user.uid));
            if (pDoc.exists()) {
                const data = pDoc.data();
                state.currentMysteryIndex = data.currentMysteryIndex || 0;
                if (data.inventory !== undefined) state.inventory = data.inventory;
                if (data.questionsAsked !== undefined) state.questionsAsked = data.questionsAsked;
                if (data.guessesRemaining !== undefined) state.guessesRemaining = data.guessesRemaining;
                if (data.score !== undefined) state.score = data.score;
                if (data.highestScore !== undefined) state.highestScore = data.highestScore;
                if (data.streak !== undefined) state.streak = data.streak;
            } else {
                // Initialize new player records
                const { setDoc } = window.firebaseAPI;
                await setDoc(doc(window.db, "players", user.uid), {
                    currentMysteryIndex: 0,
                    inventory: { truth: 1, intimidation: 1, charm: 1 },
                    questionsAsked: {},
                    guessesRemaining: 3,
                    score: 0,
                    streak: 0
                });
            }
        } catch (e) { console.error("Error loading progress from firestore", e); }
    } else {
        // guest — try loading from local storage
        loadLocalState();
    }
    await loadMystery(state.currentMysteryIndex);
    state.screen = 'start';
    render();
}

function loadLocalState() {
    try {
        const saved = localStorage.getItem('mystery_game_state');
        if (saved) {
            const data = JSON.parse(saved);
            state.currentMysteryIndex = data.currentMysteryIndex || 0;
            state.inventory = data.inventory || { truth: 1, intimidation: 1, charm: 1 };
            state.questionsAsked = data.questionsAsked || {};
            state.guessesRemaining = data.guessesRemaining !== undefined ? data.guessesRemaining : 3;
            state.score = data.score || 0;
            state.highestScore = data.highestScore || 0;
            state.streak = data.streak || 0;
            state.highestStreak = data.highestStreak || 0;
        }
    } catch (e) { console.error("Error loading local state", e); }
}

async function saveProgress() {
    state.highestStreak = Math.max(state.highestStreak || 0, state.streak);
    state.highestScore = Math.max(state.highestScore || 0, state.score);

    const localData = {
        currentMysteryIndex: state.currentMysteryIndex,
        inventory: state.inventory,
        questionsAsked: state.questionsAsked,
        guessesRemaining: state.guessesRemaining,
        score: state.score,
        highestScore: state.highestScore,
        streak: state.streak,
        highestStreak: state.highestStreak
    };
    localStorage.setItem('mystery_game_state', JSON.stringify(localData));

    if (state.user) {
        try {
            const { setDoc, doc } = window.firebaseAPI;

            // 1. Save private gameplay progression
            await setDoc(doc(window.db, "players", state.user.uid), localData, { merge: true });

            // 2. Save public leaderboard profile
            const profileData = {
                displayName: state.user.displayName || "Unknown Detective",
                photoURL: state.user.photoURL || "",
                highestScore: state.highestScore || 0,
                ...localData
            };
            await setDoc(doc(window.db, "users", state.user.uid), profileData, { merge: true });
        } catch (e) { console.error("Error saving progress to firestore", e); }
    }
}

function showLeaderboard() {
    if (document.querySelector('.leaderboard-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'leaderboard-modal fade-in';
    modal.innerHTML = `
        <div class="leaderboard-content glass-panel">
            <h2 style="font-family: 'Playfair Display', serif; color: var(--accent-gold); text-align: center; font-size: 2.5rem; margin-bottom: 20px;">🌍 Global Top Detectives</h2>
            <div class="lb-header-row">
                <div class="lb-rank-header">Rank</div>
                <div class="lb-detective-header">Detective</div>
                <div class="lb-stats-header">Performance</div>
            </div>
            <div id="leaderboard-list">Loading real-time rankings...</div>
            <button class="primary-btn" style="margin-top: 20px; width: 100%; border-radius: 12px; font-family: 'Inter', sans-serif;" onclick="this.parentElement.parentElement.remove()">Close Archives</button>
        </div>
    `;
    document.body.appendChild(modal);

    const { collection, query, orderBy, limit, onSnapshot } = window.firebaseAPI;
    const q = query(collection(window.db, "users"), orderBy("highestScore", "desc"), limit(10));

    // Listen for realtime updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const listEl = document.getElementById('leaderboard-list');
        if (!listEl) {
            unsubscribe(); // Clean up if modal closed
            return;
        }

        listEl.innerHTML = '';
        let rank = 1;
        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement('div');
            // Give special classes to Top 3
            let rankClass = rank === 1 ? 'gold-tier' : (rank === 2 ? 'silver-tier' : (rank === 3 ? 'bronze-tier' : ''));
            row.className = `leaderboard-row ${rankClass}`;

            row.innerHTML = `
                <div class="lb-rank">#${rank}</div>
                <div class="lb-identity">
                    <div class="lb-avatar-wrapper">
                        <img src="${data.photoURL || 'https://via.placeholder.com/48'}" class="lb-avatar" onerror="this.src='https://via.placeholder.com/48'">
                    </div>
                    <div class="lb-name">${data.displayName || 'Unknown'}</div>
                </div>
                <div class="lb-stats">
                    <span class="lb-streak">Best Streak: ${data.highestStreak || 0}🔥</span>
                    <span class="lb-score">${data.highestScore || 0} pts</span>
                </div>
            `;
            listEl.appendChild(row);
            rank++;
        });
    }, (error) => {
        const listEl = document.getElementById('leaderboard-list');
        if (listEl) listEl.innerHTML = '<div style="color:#ff6b6b">Error loading leaderboard. Have you logged in online?</div>';
        console.error("Leaderboard error:", error);
    });
}

// Attach listener triggered by index.html when dependencies loaded
window.addEventListener('firebase-ready', () => {
    window.firebaseAPI.onAuthStateChanged(window.auth, async (user) => {
        handleAuthState(user);
    });
});

window.signIn = async function () {
    ensureMusicPlays();
    if (window.location.protocol === 'file:') {
        showCustomModal("Sandbox Session", "<b>Notice:</b> Google Sign-In strictly requires a live web server for security purposes. Since you opened this file directly, we've generated a temporary <b>Sandbox Session</b> so you can play immediately!");
        handleAuthState({ uid: 'local_sandbox_hero', displayName: 'Sandbox Detective', photoURL: 'https://via.placeholder.com/32' });
        return;
    }
    try {
        await window.firebaseAPI.signInWithPopup(window.auth, window.provider);
    } catch (e) { console.error("Sign in blocked", e); showCustomModal("Sign In Error", e.message); }
}

function showCustomModal(title, message) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay fade-in';
    modal.innerHTML = `
        <div class="custom-modal glass-panel">
            <h2>${title}</h2>
            <p>${message}</p>
            <button class="primary-btn" onclick="this.parentElement.parentElement.remove()">Proceed</button>
        </div>
    `;
    document.body.appendChild(modal);
}

window.signOutUser = async function () {
    if (window.location.protocol === 'file:') {
        handleAuthState(null);
        return;
    }
    await window.firebaseAPI.signOut(window.auth);
}

// Global music helper to bypass autoplay blocks on interaction
window.ensureMusicPlays = function() {
    const music = document.getElementById('bg-music');
    if (music && music.paused) {
        music.play().catch(e => console.log("Music play blocked:", e));
    }
}


// ----- GAMEPLAY LOGIC -----

window.startGame = async function () {
    ensureMusicPlays();
    state.questionsAsked = {}; // reset interrogations for this run
    state.guessesRemaining = 3;
    state.mysteryStartTime = Date.now();
    state.log = [];
    state.log.push({ type: 'system', text: 'Investigation started. The perimeter is secured.' });
    await saveProgress();
    await loadMystery(state.currentMysteryIndex);
    state.screen = 'game';
    render();
}

window.usePowerUp = function (pId) {
    if (state.inventory[pId] > 0 && state.activePowerUp === null) {
        state.inventory[pId]--;
        state.activePowerUp = pId;
        const pObj = powerUps.find(p => p.id === pId);
        state.log.push({ type: 'system', text: `Equipped ${pObj.name}. It will be automatically applied to your next question.` });
        saveProgress(); // save immediately in case they refresh
        render();
    }
}

window.selectSuspect = function (id) {
    state.selectedSuspectId = id;
    render();
}

window.askQuestion = async function (suspectId, qIndex) {
    if (state.isGenerating) return;
    const currentMystery = state.currentMystery;
    if (!currentMystery) return;
    const target = currentMystery.suspects.find(s => s.id === suspectId);
    if (!target) return;

    // Grab conversation history BEFORE pushing the new thinking log!
    const pastLog = state.log.filter(l => l.name === target.name && l.status === 'done').map(l => `Detective: ${l.question}\nSuspect: "${l.answer}"`).join("\n");

    // Increment question count and dynamically save to Firestore!
    if (!state.questionsAsked[target.id]) state.questionsAsked[target.id] = 0;
    state.questionsAsked[target.id]++;
    saveProgress();

    const questionText = questions[qIndex];
    const powerUpUsed = state.activePowerUp;

    state.log.push({
        type: 'qna',
        name: target.name,
        question: questionText,
        answer: '...',
        status: 'thinking',
        powerUp: powerUpUsed
    });

    state.isGenerating = true;
    state.activePowerUp = null; // consume it immediately
    render();

    const responseText = await callGemini(target, questionText, powerUpUsed, pastLog);

    state.isGenerating = false;
    const lastLog = state.log[state.log.length - 1];
    lastLog.status = 'done';
    lastLog.answer = responseText;

    render();
}

// callGemini sends structured data to the server so it can look up hiddenTruth itself.
// The browser never sees hiddenTruth — the server builds the full AI prompt.
async function callGemini(suspect, question, powerUpId, history) {
    try {
        const response = await fetch(`${API_BASE}/api/interrogate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mysteryIndex: state.currentMysteryIndex,
                suspectId: suspect.id,
                question,
                powerUpId,
                history: history || ''
            })
        });
        const data = await response.json();
        if (data.error) return `[API Error] ${data.error}`;
        return data.answer.trim().replace(/^"|"$/g, '');
    } catch (e) {
        return `[Network Error] Could not connect to the server. Make sure node server.js is running.`;
    }
}

function customConfirm(title, message, proceedText = "PROCEED") {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay fade-in';
        overlay.style.zIndex = '2000';

        overlay.innerHTML = `
            <div class="custom-modal glass-panel" style="max-width: 450px; padding: 40px; text-align: center;">
                <h2 style="color: var(--accent-gold); margin-bottom: 20px; font-family: 'Playfair Display', serif; font-size: 2rem;">${title}</h2>
                <p style="color: var(--text-main); font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px;">${message}</p>
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button class="primary-btn" id="confirm-cancel" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text-muted);">Cancel</button>
                    <button class="primary-btn" id="confirm-proceed">${proceedText}</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('confirm-cancel').onclick = () => {
            overlay.remove();
            resolve(false);
        };
        document.getElementById('confirm-proceed').onclick = () => {
            overlay.remove();
            resolve(true);
        };
    });
}

// Accusation is verified server-side — the browser never knows killerId.
window.accuse = async function (suspectId) {
    const isConfirmed = await customConfirm(
        "Final Accusation",
        `Are you absolutely sure you want to accuse this suspect?<br><br>You only have <b style="color:var(--accent-gold)">${state.guessesRemaining}</b> guesses remaining.<br>If you hit 0, you lose the case!`,
        "ACCUSE SUSPECT"
    );

    if (isConfirmed) {
        try {
            console.log(`🔍 Accusing suspect ${suspectId} for mystery ${state.currentMysteryIndex}...`);
            const res = await fetch(`${API_BASE}/api/accuse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    mysteryIndex: state.currentMysteryIndex, 
                    mysteryId: state.currentMystery ? state.currentMystery.id : null,
                    suspectId 
                })
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
                throw new Error(errorData.error || 'Server connection failed');
            }
            
            const data = await res.json();
            if (data.correct) {
                state.result = 'win';
                state.streak++;

                // Calculate rewards
                const secondsTaken = Math.floor((Date.now() - state.mysteryStartTime) / 1000);
                const timedBonus = Math.max(40, 100 - Math.floor(secondsTaken / 15) * 5);
                const accuracyBonus = state.guessesRemaining * 50;
                const streakBonus = (state.streak - 1) * 25; // first win is 0 streak bonus
                const totalMysteryScore = timedBonus + accuracyBonus + streakBonus;

                state.score += totalMysteryScore;
                state.lastMysteryStats = { timedBonus, accuracyBonus, streakBonus, totalMysteryScore, secondsTaken };

                await saveProgress();
                state.screen = 'result';
                render();
            } else {
                state.guessesRemaining--;
                state.streak = 0; // reset streak on ANY mistake
                if (state.guessesRemaining <= 0) {
                    state.result = 'game_over';
                    // HARD RESET
                    state.currentMysteryIndex = 0;
                    state.score = 0;
                    state.inventory = { truth: 1, intimidation: 1, charm: 1 };
                    state.questionsAsked = {};
                    state.screen = 'result';
                } else {
                    state.result = 'lose';
                    state.screen = 'result';
                }
                await saveProgress();
                render();
            }
        } catch (e) {
            alert(`Accusation Failed: ${e.message}\n\nPlease refresh and try again. If this persists, the server might be restarting.`);
            return;
        }
        state.screen = 'result';
        render();
    }
}

window.nextMystery = async function () {
    ensureMusicPlays();
    if (state.currentMysteryIndex < MYSTERY_COUNT - 1) {
        state.currentMysteryIndex++;
        // Award power ups!
        state.inventory.truth++;
        state.inventory.intimidation++;
        state.inventory.charm++;
        state.guessesRemaining = 3;
        state.mysteryStartTime = Date.now();
        await saveProgress();
        resetGame();
    } else {
        // They beat the game, reset entirely
        state.currentMysteryIndex = 0;
        state.guessesRemaining = 3;
        state.mysteryStartTime = Date.now();
        await saveProgress();
        resetGame();
    }
}

window.continueGame = function () {
    state.screen = 'game';
    state.result = null;
    render();
}

window.goBackMystery = async function () {
    if (state.currentMysteryIndex > 0) {
        state.currentMysteryIndex--;
    }
    state.guessesRemaining = 3;
    state.mysteryStartTime = Date.now();
    await saveProgress();
    resetGame();
}

window.resetGame = async function () {
    state.selectedSuspectId = null;
    state.log = [];
    state.result = null;
    state.activePowerUp = null;
    await loadMystery(state.currentMysteryIndex);
    state.screen = 'start';
    render();
}

// Initial boot
initGame();
render();
