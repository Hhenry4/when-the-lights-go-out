const apiKeys = [
    'AIzaSyBL9auMQ5BL-JYHTeDHzHc55ipC89o4PVw',
    'AIzaSyBODqRKmYIWDwDqfhOY9G_eH7b6paSvZDA',
    'AIzaSyD86kFAcEJ_HTcVN3fTNVG3D4WEpEVLe2Q'
];

const state = {
    screen: 'check_auth', // 'start', 'game', 'result', 'check_auth'
    currentMysteryIndex: 0,
    selectedSuspectId: null,
    log: [],
    result: null, // 'win' or 'lose'
    budget: 300,
    activePowerUp: null, // 'truth', 'intimidation', 'charm'
    isGenerating: false,
    user: null
};

const questions = [
    "Why were you at the restaurant tonight?",
    "What do you do (or what did you used to do)?",
    "Did you recognize anyone here tonight?",
    "What did you hear when the lights went out?",
    "Tell me about something important in your past."
];

const powerUps = [
    { id: 'truth', name: 'Truth Serum', cost: 50, effect: "The suspect is compelled to drop a heavy hint about their hidden truth." },
    { id: 'intimidation', name: 'Intimidate', cost: 30, effect: "The suspect is terrified and panicked, making them highly defensive but prone to slipping up." },
    { id: 'charm', name: 'Charm', cost: 20, effect: "The suspect is swept off their feet and tries to be extremely cooperative." }
];

const mysteries = [
    {
        id: 'm1',
        title: 'The 7:00 PM Service',
        setting: 'It’s 7:00 PM at an upscale bistro. The lights go out for 30 seconds. When they come back on, a man is dead at his table. You know the victim is a recently released gang member, having a celebratory meal.',
        killerId: 'eleanor',
        suspects: [
            { id: 'eleanor', name: 'Eleanor', avatar: '👵🏼', role: 'The Retired Teacher', desc: 'An elderly woman sitting quietly, her hands neatly folded.', hiddenTruth: '15 years ago, her brightest student was killed in a drive-by shooting in front of her classroom. The victim tonight was the gang member who shot him. She vividly remembered his face, walked to his table in the dark, and shot him with a silenced pistol. You are the sole killer.' },
            { id: 'marcus', name: 'Marcus', avatar: '👮🏽‍♂️', role: 'Former Police Officer', desc: 'A sharply-dressed, observant man radiating authority and tension. Suspicious of everyone.', hiddenTruth: 'Lost his partner to gang violence a decade ago. It makes his blood boil to see thugs celebrating. He instinctively drew his gun when the lights went out, but he is NOT the killer.' },
            { id: 'chloe', name: 'Chloe', avatar: '💃🏻', role: 'The Jilted Lover', desc: 'A woman in a stunning red dress, looking furious and holding a half-empty martini.', hiddenTruth: 'Her ex-boyfriend was a pathological liar living a double life. She was stood up tonight. When the lights went out, someone bumped her table and spilled her drink, which is why she was moving.' },
            { id: 'vance', name: 'Sergeant Vance', avatar: '🪖', role: 'Active Duty Marine', desc: 'A burly, intense man with perfect military posture.', hiddenTruth: 'He suffers from severe combat paranoia. He automatically clocks every seating position when he walks into a room. He strictly noticed that the victim was sitting adjacent to Eleanor.' },
            { id: 'julian', name: 'Julian', avatar: '🕶️', role: 'Vain Movie Star', desc: 'A man wearing sunglasses indoors, checking his reflection in a spoon. Thinks everyone is a fan.', hiddenTruth: 'He was passed over for a lead role for lacking a "killer instinct". He is extremely cowardly, jumped, and hid under the table during the blackout.' },
            { id: 'arthur', name: 'Arthur', avatar: '💼', role: 'Paranoid Businessman', desc: 'A middle-aged man in a wrinkled suit, continually wiping sweat from his forehead.', hiddenTruth: 'He owed $50,000 to the victim tonight. He came to beg for time, but someone else killed the victim before he could. He was relieved but terrified.' },
            { id: 'silvio', name: 'Silvio', avatar: '🍷', role: 'The Gossip Waiter', desc: 'A slick, fast-talking waiter who seems more interested in drama than serving food.', hiddenTruth: 'He sells celebrity gossip to tabloids. He saw Eleanor glaring at the victim with pure hatred minutes before the blackout, but kept quiet hoping to sell the story.' },
            { id: 'beatrice', name: 'Beatrice', avatar: '📝', role: 'Journalist', desc: 'A sharp, no-nonsense investigative reporter with a notepad always at the ready.', hiddenTruth: 'She is doing an exposé on gang violence. She had her audio recorder running when the shot was fired, so she knows the shot came from the direction of Eleanor\'s table.' }
        ]
    },
    {
        id: 'm2',
        title: 'The Train Blackout',
        setting: 'A briefcase is stolen from a Business Executive during a sudden blackout on a moving train. The truth goes deeper than simple theft.',
        killerId: 'journalist',
        suspects: [
            { id: 'exec', name: 'Business Executive', avatar: '⌚', role: 'The Victim', desc: 'Wealthy, stressed, continually checking his luxury watch.', hiddenTruth: 'He was about to expose his own company for covering up a deadly industrial accident.' },
            { id: 'journalist', name: 'Investigative Journalist', avatar: '📸', role: 'Curious Reporter', desc: 'Sharp, inquisitive, taking mental notes of everyone.', hiddenTruth: 'Her brother died in the industrial accident the Executive was exposing. She stole the briefcase not for money, but to expose the company herself to get justice. She is the culprit.' },
            { id: 'bodyguard', name: 'Bodyguard', avatar: '🛡️', role: 'Loyal Protector', desc: 'Stoic, muscular, very quiet. Scanning the car heavily.', hiddenTruth: 'He was bribed heavily to stand down during the blackout and let the theft happen.' },
            { id: 'conductor', name: 'Conductor', avatar: '🚆', role: 'Train Official', desc: 'In control, wearing a crisp uniform, seems slightly nervous.', hiddenTruth: 'He knew exactly when the blackout would happen. He was paid to look away.' },
            { id: 'pickpocket', name: 'Pickpocket', avatar: '🧤', role: 'Petty Thief', desc: 'Shifty, avoids eye contact, hands always deep in his pockets.', hiddenTruth: 'He was trying to steal a wallet when the lights went out, but he saw the Journalist take the briefcase. He is terrified to speak.' },
            { id: 'tourist', name: 'Bumbling Tourist', avatar: '🧳', role: 'Innocent Bystander', desc: 'Wearing a bright shirt, large camera around his neck. Looks very anxious.', hiddenTruth: 'He accidentally filmed the blackout and someone moving in the dark, but he is too scared to admit it.' }
        ]
    },
    {
        id: 'm3',
        title: 'Museum Theft',
        setting: 'A priceless diamond is stolen from an exhibit display during a sudden, targeted power failure.',
        killerId: 'janitor',
        suspects: [
            { id: 'curator', name: 'The Curator', avatar: '🖼️', role: 'Proud Expert', desc: 'Arrogant, scholarly, extremely protective of the museum pieces.', hiddenTruth: 'The diamond that was stolen is actually a fake replica. They are trying to hide the embarrassment.' },
            { id: 'guard', name: 'Security Guard', avatar: '🔦', role: 'Nervous Watchman', desc: 'Constantly sweating, checking his radio with shaking hands.', hiddenTruth: 'He is deep in gambling debt and was planning to steal the diamond himself, but someone else beat him to it.' },
            { id: 'collector', name: 'Art Collector', avatar: '🧐', role: 'Obsessed Buyer', desc: 'Eccentric, wealthy, staring blankly at the empty case.', hiddenTruth: 'Lost everything trying to acquire this diamond previously. Desperate enough to do anything.' },
            { id: 'electrician', name: 'Electrician', avatar: '🔧', role: 'Maintenance Worker', desc: 'Holding tools, grumbling about the old building wiring.', hiddenTruth: 'Former engineer fired unfairly by this museum. Holds a massive grudge and wanted to embarrass them.' },
            { id: 'influencer', name: 'Social Influencer', avatar: '📱', role: 'Vlogger', desc: 'Holding a ring light, filming everything, completely ignoring social boundaries.', hiddenTruth: 'Staged chaos for content, hoping a major blackout would skyrocket their viral views.' },
            { id: 'janitor', name: 'The Janitor', avatar: '🧹', role: 'Invisible Worker', desc: 'Quiet, mopping the floor seemingly uninterested in the commotion.', hiddenTruth: 'He is the former head of security design for the museum who was replaced. He stole the diamond to prove the new system is dangerously flawed. He is the culprit.' }
        ]
    },
    {
        id: 'm4',
        title: 'Hotel Incident',
        setting: 'A wealthy hotel guest is brutally attacked and robbed in their suite during a building-wide power grid failure.',
        killerId: 'magician',
        suspects: [
            { id: 'victim', name: 'Wealthy Guest', avatar: '🍾', role: 'The Victim', desc: 'Loud, obnoxious, extremely demanding of all staff.', hiddenTruth: 'Has secretly scammed multiple people out of their life savings through a massive Ponzi scheme.' },
            { id: 'doctor', name: 'The Doctor', avatar: '🩺', role: 'Helpful Guest', desc: 'Calm, collected, offering medical aid to the victim.', hiddenTruth: 'One of the victim’s former scam victims. Holds intense anger and a deep sense of betrayal.' },
            { id: 'bellhop', name: 'The Bellhop', avatar: '🛎️', role: 'Friendly Staff', desc: 'Smiles far too much, knows exactly where everyone is staying.', hiddenTruth: 'Knows all guest routines perfectly and frequently steals small items from rooms.' },
            { id: 'manager', name: 'Hotel Manager', avatar: '👔', role: 'Nervous Boss', desc: 'Trying desperately to keep everyone calm to protect the PR.', hiddenTruth: 'Has been covering up petty crimes in the hotel for months to protect its five-star reputation.' },
            { id: 'tourist', name: 'Quiet Tourist', avatar: '🗺️', role: 'Bystander', desc: 'Observing everything quietly from the corner of the lobby.', hiddenTruth: 'Lost their entire life savings to the victim’s scam. Desperately wants severe revenge.' },
            { id: 'magician', name: 'The Magician', avatar: '🎩', role: 'Lounge Entertainer', desc: 'Flashy, charismatic, constantly shuffling a deck of playing cards.', hiddenTruth: 'The victim destroyed his life financially years ago. He used his blackout illusion skills to execute the perfect revenge attack and framing. He is the culprit.' }
        ]
    }
];

const App = document.getElementById('app');

function render() {
    App.innerHTML = '';

    if (state.user) {
        const header = document.createElement('div');
        header.className = 'user-header';
        header.innerHTML = `
            <img src="${state.user.photoURL || 'https://via.placeholder.com/32'}" alt="Avatar">
            <span>Detective ${state.user.displayName ? state.user.displayName.split(' ')[0] : 'Incognito'}</span>
            <button onclick="signOutUser()">Sign Out</button>
        `;
        App.appendChild(header);
    }

    if (state.screen === 'check_auth') {
        const div = document.createElement('div');
        div.className = 'start-screen';
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
    div.className = 'start-screen';
    
    if (!state.user) {
        div.innerHTML = `
            <h1>When the Lights Go Out</h1>
            <p>
                Step into the shoes of a lead detective in an interactive, AI-driven series of psychological mysteries. 
                <br><br>
                Sign in to sync your case files and preserve your investigation budget across incidents.
            </p>
            <button class="primary-btn" onclick="signIn()">
                <span>Sign in to access secure terminals</span>
            </button>
        `;
    } else {
        const currentMystery = mysteries[state.currentMysteryIndex] || mysteries[0];
        div.innerHTML = `
            <h1>When the Lights Go Out</h1>
            <p>
                <b>Current Case: ${currentMystery.title}</b><br><br>
                ${currentMystery.setting}<br><br>
                You have ${currentMystery.suspects.length} suspects. 
                Apply tactical pressure using your Budget to unearth their deeply hidden truths.
            </p>
            <button class="primary-btn" style="margin-top: 20px;" onclick="startGame()">Start Investigation</button>
        `;
    }
    return div;
}

function createGameScreen() {
    const layout = document.createElement('div');
    layout.className = 'game-layout';
    const currentMystery = mysteries[state.currentMysteryIndex];

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
        card.innerHTML = `
            <div class="card-avatar">${s.avatar}</div>
            <div class="card-info">
                <h3>${s.name}</h3>
                <p>${s.role}</p>
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
                <div class="profile-avatar">${target.avatar}</div>
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
        
        questions.forEach((q, index) => {
            const btn = document.createElement('button');
            btn.className = 'question-btn';
            btn.innerText = q;
            
            if (state.isGenerating) {
                btn.disabled = true;
            } else {
                btn.onclick = () => askQuestion(target.id, index);
            }
            qContainer.appendChild(btn);
        });

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
        <div class="budget-display">💰 Budget: $${state.budget}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px; width: 100%; text-align: left;">
            Select a Power-Up to apply to your next question:
        </div>
        <div class="shop-row">
            ${powerUps.map(p => `
                <button class="powerup-btn ${state.activePowerUp === p.id ? 'active' : ''}" 
                    ${state.budget < p.cost || state.isGenerating || state.activePowerUp !== null ? 'disabled' : ''}
                    onclick="buyPowerUp('${p.id}')"
                    title="${p.effect}">
                    ${p.name} <br> <span style="font-size: 0.75rem;">$${p.cost}</span>
                </button>
            `).join('')}
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
    div.className = 'start-screen';
    const currentMystery = mysteries[state.currentMysteryIndex];
    
    if (state.result === 'win') {
        const hasNext = state.currentMysteryIndex < mysteries.length - 1;
        div.innerHTML = `
            <h1 style="color: #4ade80;">Case Solved</h1>
            <p style="color: #fff; font-size: 1.2rem; max-width: 800px; text-align: left;">
                Excellent deductive work, Detective. You correctly deduced the killer's identity!
            </p>
            ${hasNext 
                ? '<button class="primary-btn" onclick="nextMystery()">Next Mystery (+$200 Budget)</button>' 
                : '<p style="color: var(--accent-gold);">You have solved all available cases. You are a legendary detective.</p><button class="primary-btn" onclick="resetGame()">Play Again</button>'}
        `;
    } else {
        div.innerHTML = `
            <h1 style="color: #ff6b6b;">Wrong Suspect</h1>
            <p style="color: #fff; font-size: 1.2rem; max-width: 800px; text-align: left;">
                You accused the wrong person.<br><br>
                While they might have had circumstantial motives, your logic missed the true connection linking the incident to a deeply personal motive from the past.<br><br>
                The real killer slipped away quietly, their crime complete. The case goes cold.
            </p>
            <button class="primary-btn" onclick="resetGame()">Try Again</button>
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
                if (data.budget !== undefined) state.budget = data.budget;
            } else {
                // Initialize new player records
                const { setDoc } = window.firebaseAPI;
                await setDoc(doc(window.db, "players", user.uid), {
                    currentMysteryIndex: 0,
                    budget: 300
                });
            }
        } catch(e) { console.error("Error loading progress from firestore", e); }
        state.screen = 'start';
    } else {
        state.screen = 'start';
    }
    render();
}

async function saveProgress() {
    if (state.user) {
        try {
            const { setDoc, doc } = window.firebaseAPI;
            await setDoc(doc(window.db, "players", state.user.uid), {
                currentMysteryIndex: state.currentMysteryIndex,
                budget: state.budget
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

window.startGame = function() {
    state.screen = 'game';
    state.log.push({ type: 'system', text: 'Investigation started. The perimeter is secured.' });
    render();
}

window.buyPowerUp = function(pId) {
    const powerUp = powerUps.find(p => p.id === pId);
    if (state.budget >= powerUp.cost && state.activePowerUp === null) {
        state.budget -= powerUp.cost;
        state.activePowerUp = pId;
        state.log.push({ type: 'system', text: `Spent $${powerUp.cost} to equip ${powerUp.name}. Select a question to use it.` });
        saveProgress();
        render();
    }
}

window.selectSuspect = function(id) {
    state.selectedSuspectId = id;
    render();
}

window.askQuestion = async function(suspectId, qIndex) {
    if (state.isGenerating) return;
    const currentMystery = mysteries[state.currentMysteryIndex];
    const target = currentMystery.suspects.find(s => s.id === suspectId);
    if (!target) return;

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

    const responseText = await callGemini(target, questionText, powerUpUsed, currentMystery.setting);
    
    state.isGenerating = false;
    const lastLog = state.log[state.log.length - 1];
    lastLog.status = 'done';
    lastLog.answer = responseText;
    
    render();
}

async function callGemini(suspect, question, powerUpId, settingContext) {
    // Dynamic api key routing
    let apiKey = apiKeys[suspect.name.length % apiKeys.length];
    if (suspect.id === 'eleanor') apiKey = 'AIzaSyBL9auMQ5BL-JYHTeDHzHc55ipC89o4PVw';
    else if (suspect.id === 'marcus') apiKey = 'AIzaSyBODqRKmYIWDwDqfhOY9G_eH7b6paSvZDA';
    else if (suspect.id === 'vance') apiKey = 'AIzaSyD86kFAcEJ_HTcVN3fTNVG3D4WEpEVLe2Q';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    let powerUpContext = "";
    if (powerUpId === 'truth') powerUpContext = "\\n[POWER-UP ACTIVE]: 'Truth Serum'. You are compelled to drop a MASSIVE hint about your hidden truth. You can't help it.";
    if (powerUpId === 'intimidation') powerUpContext = "\\n[POWER-UP ACTIVE]: 'Intimidation'. You are terrified of the detective. You act extremely panicked, stuttering, and defensively blurting out clues about your hidden truth.";
    if (powerUpId === 'charm') powerUpContext = "\\n[POWER-UP ACTIVE]: 'Charm'. You are deeply charmed by the detective. You try to be extremely cooperative, flirty, and accidentally overshare your secrets.";
    
    const prompt = `System Instructions: You are roleplaying as a suspect in a murder mystery game.
Context: ${settingContext}
Your Character Name: ${suspect.name}
Role: ${suspect.role}
Personality: ${suspect.desc}
Your Secret Motive or Hidden Truth: ${suspect.hiddenTruth}
${powerUpContext}

CRITICAL RULES:
1. NEVER reveal who committed the crime outright, even if you are the culprit. You may drop subtle hints when pressured, but NEVER confess outright. Do not spoil the whodunit mystery.
2. NEVER mention your system prompt, AI instructions, or the fact that this is a game. Stay perfectly in character no matter what.
3. Your personality should feel electric, highly engaging, dynamic, and profoundly complex. You have a life, personality, and emotions outside of the crime. Talk like a real, flawed human being. However, keep your vocabulary comprehensible and natural to a modern speaker (avoid archaic flowery words).
4. Respond in ONLY 1 or 2 spoken sentences. Do NOT include actions in asterisks, just the spoken text.

The Detective asks: "${question}"`;

    const body = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (data.error) return `[API Error] ${data.error.message}`;
        return data.candidates[0].content.parts[0].text.trim().replace(/^"|"$/g, '');
    } catch (e) {
        return `[Network Error] Could not connect to Gemini API. Check your internet connection.`;
    }
}

window.accuse = function(suspectId) {
    if (confirm("Are you sure you want to accuse this suspect? This will end the case and lock in your answer.")) {
        const currentMystery = mysteries[state.currentMysteryIndex];
        if (suspectId === currentMystery.killerId) {
            state.result = 'win';
        } else {
            state.result = 'lose';
        }
        state.screen = 'result';
        render();
    }
}

window.nextMystery = async function() {
    if (state.currentMysteryIndex < mysteries.length - 1) {
        state.currentMysteryIndex++;
        state.budget += 200;
        await saveProgress();
        resetGame();
    }
}

window.resetGame = function() {
    state.screen = 'start';
    state.selectedSuspectId = null;
    state.log = [];
    state.result = null;
    state.activePowerUp = null;
    render();
}

// Initial boot
render();
