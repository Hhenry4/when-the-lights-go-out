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

const powerUps = [
    { id: 'truth', name: 'Truth Serum', effect: "The suspect is compelled to drop a heavy hint about their hidden truth." },
    { id: 'intimidation', name: 'Intimidate', effect: "The suspect is terrified and panicked, making them highly defensive but prone to slipping up." },
    { id: 'charm', name: 'Charm', effect: "The suspect is swept off their feet and tries to be extremely cooperative." }
];

const MYSTERY_COUNT = 8; // total number of mysteries on the server


const App = document.getElementById('app');

function render() {
    App.innerHTML = '';

    if (state.user) {
        const header = document.createElement('div');
        header.className = 'user-header';
        header.innerHTML = `
            <div class="user-info">
                <img src="${state.user.photoURL || 'https://via.placeholder.com/32'}" alt="Avatar">
                <div class="detective-label">
                    <span>Detective ${state.user.displayName ? state.user.displayName.split(' ')[0] : 'Incognito'}</span>
                    <small>Active Investigation</small>
                </div>
            </div>
            <button class="sign-out-btn" onclick="signOutUser()">Sign Out</button>
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
        div.innerHTML = `
            <h1>When the Lights Go Out</h1>
            <p>
                <b>Current Case: ${currentMystery ? currentMystery.title : 'Loading...'}</b><br><br>
                ${currentMystery ? currentMystery.setting : ''}<br><br>
                ${currentMystery ? `You have ${currentMystery.suspects.length} suspects.` : ''} 
                You may only interrogate a suspect <b>3 times</b> before they refuse to speak.<br><br>
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
        
        let subText = s.role;
        const asked = state.questionsAsked[s.id] || 0;
        if (asked >= 3) {
            subText = `<span style="color: #ff6b6b;">exhausted (3/3)</span>`;
        } else if (asked > 0) {
            subText = `${s.role} <span style="color: var(--accent-gold); font-size: 0.75rem;">(${asked}/3 asked)</span>`;
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

    // Stats Box (v4)
    const statsBox = document.createElement('div');
    statsBox.className = 'stats-box-v4';
    statsBox.innerHTML = `
        <div class="stat-item">
            <label>CAREER SCORE</label>
            <span>${state.score.toLocaleString()}</span>
        </div>
        <div class="stat-item">
            <label>STREAK</label>
            <span>${state.streak} ${state.streak > 0 ? '🔥' : ''}</span>
        </div>
        <div class="stat-item">
            <label>ACCUSATIONS</label>
            <span class="${state.guessesRemaining < 2 ? 'critical' : ''}">${state.guessesRemaining}/3</span>
        </div>
    `;
    interrogationArea.appendChild(statsBox);
    
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
        
        if (askedCount >= 3) {
            qContainer.innerHTML = `<div class="log-entry system" style="text-align:center;">You have exhausted all 3 questions for ${target.name}. They refuse to speak further.</div>`;
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
        div.innerHTML = `
            <h1 style="color: #4ade80;">Case Solved</h1>
            <div class="bonus-summary">
                <div class="bonus-row"><span>Timed Bonus (${stats.secondsTaken}s):</span> <span class="pts">+${stats.timedBonus}</span></div>
                <div class="bonus-row"><span>Accuracy Bonus:</span> <span class="pts">+${stats.accuracyBonus}</span></div>
                <div class="bonus-row"><span>Streak Bonus:</span> <span class="pts">+${stats.streakBonus}</span></div>
                <div class="total-mystery-score">Total Points: ${stats.totalMysteryScore}</div>
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
            <button class="primary-btn" onclick="startGame()">Restart Entire Career</button>
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
        } catch(e) { console.error("Error loading progress from firestore", e); }
    } else {
        // guest — nothing to load
    }
    await loadMystery(state.currentMysteryIndex);
    state.screen = 'start';
    render();
}

async function saveProgress() {
    if (state.user) {
        try {
            const { setDoc, doc } = window.firebaseAPI;
            await setDoc(doc(window.db, "players", state.user.uid), {
                currentMysteryIndex: state.currentMysteryIndex,
                inventory: state.inventory,
                questionsAsked: state.questionsAsked,
                guessesRemaining: state.guessesRemaining,
                score: state.score,
                streak: state.streak
            }, { merge: true });
        } catch(e) { console.error("Error saving progress", e); }
    }
}

// Attach listener triggered by index.html when dependencies loaded
window.addEventListener('firebase-ready', () => {
    window.firebaseAPI.onAuthStateChanged(window.auth, async (user) => {
        handleAuthState(user);
    });
});

window.signIn = async function() {
    if (window.location.protocol === 'file:') {
        alert("Notice: Google Sign-In strictly requires a live web server for security purposes. Since you opened this file directly from your computer, we're generating a temporary Sandbox Session so you can play immediately!");
        handleAuthState({ uid: 'local_sandbox_hero', displayName: 'Sandbox Detective', photoURL: 'https://via.placeholder.com/32' });
        return;
    }
    try {
        await window.firebaseAPI.signInWithPopup(window.auth, window.provider);
    } catch(e) { console.error("Sign in blocked", e); alert(e.message); }
}

window.signOutUser = async function() {
    if (window.location.protocol === 'file:') {
        handleAuthState(null);
        return;
    }
    await window.firebaseAPI.signOut(window.auth);
}

// ----- GAMEPLAY LOGIC -----

window.startGame = async function() {
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

window.usePowerUp = function(pId) {
    if (state.inventory[pId] > 0 && state.activePowerUp === null) {
        state.inventory[pId]--;
        state.activePowerUp = pId;
        const pObj = powerUps.find(p => p.id === pId);
        state.log.push({ type: 'system', text: `Equipped ${pObj.name}. It will be automatically applied to your next question.` });
        saveProgress(); // save immediately in case they refresh
        render();
    }
}

window.selectSuspect = function(id) {
    state.selectedSuspectId = id;
    render();
}

window.askQuestion = async function(suspectId, qIndex) {
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

// Accusation is verified server-side — the browser never knows killerId.
window.accuse = async function(suspectId) {
    if (confirm(`Are you sure you want to accuse this suspect? You have ${state.guessesRemaining} guesses. If you hit 0, you lose the case!`)) {
        try {
            const res = await fetch(`${API_BASE}/api/accuse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mysteryIndex: state.currentMysteryIndex, suspectId })
            });
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
                } else {
                    state.result = 'lose';
                }
                await saveProgress();
            }
        } catch (e) {
            alert('Could not reach the server to verify the accusation. Please check your connection.');
            return;
        }
        state.screen = 'result';
        render();
    }
}

window.nextMystery = async function() {
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

window.continueGame = function() {
    state.screen = 'game';
    state.result = null;
    render();
}

window.goBackMystery = async function() {
    if (state.currentMysteryIndex > 0) {
        state.currentMysteryIndex--;
    }
    state.guessesRemaining = 3;
    state.mysteryStartTime = Date.now();
    await saveProgress();
    resetGame();
}

window.resetGame = async function() {
    state.selectedSuspectId = null;
    state.log = [];
    state.result = null;
    state.activePowerUp = null;
    await loadMystery(state.currentMysteryIndex);
    state.screen = 'start';
    render();
}

// Initial boot
render();
