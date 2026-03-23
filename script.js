const state = {
    screen: 'check_auth', // 'start', 'game', 'result', 'check_auth'
    currentMysteryIndex: 0,
    selectedSuspectId: null,
    log: [],
    result: null, // 'win' or 'lose'
    inventory: { truth: 1, intimidation: 1, charm: 1 },
    questionsAsked: {}, // stores count per suspectId
    activePowerUp: null, // 'truth', 'intimidation', 'charm'
    isGenerating: false,
    user: null
};

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

const mysteries = [
    {
        id: 'm1',
        title: 'The 7:00 PM Service',
        setting: 'It’s 7:00 PM at an upscale bistro. The lights go out for 30 seconds. When they come back on, a man is dead at his table. You know the victim is a recently released gang member, having a celebratory meal.',
        killerId: 'eleanor',
        suspects: [
            { id: 'eleanor', name: 'Eleanor', avatar: 'https://randomuser.me/api/portraits/women/24.jpg', role: 'The Retired Teacher', desc: 'An elderly woman sitting quietly, her hands neatly folded.', hiddenTruth: '15 years ago, her brightest student was killed in a drive-by shooting in front of her classroom. The victim tonight was the gang member who shot him. She vividly remembered his face, walked to his table in the dark, and shot him with a silenced pistol. You are the sole killer.' },
            { id: 'marcus', name: 'Marcus', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'Former Police Officer', desc: 'A sharply-dressed, observant man radiating authority and tension. Suspicious of everyone.', hiddenTruth: 'Lost his partner to gang violence a decade ago. It makes his blood boil to see thugs celebrating. He instinctively drew his gun when the lights went out, but he is NOT the killer.' },
            { id: 'chloe', name: 'Chloe', avatar: 'https://randomuser.me/api/portraits/women/33.jpg', role: 'The Jilted Lover', desc: 'A woman in a stunning red dress, looking furious and holding a half-empty martini.', hiddenTruth: 'Her ex-boyfriend was a pathological liar living a double life. She was stood up tonight. When the lights went out, someone bumped her table and spilled her drink, which is why she was moving.' },
            { id: 'vance', name: 'Sergeant Vance', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', role: 'Active Duty Marine', desc: 'A burly, intense man with perfect military posture.', hiddenTruth: 'He suffers from severe combat paranoia. He automatically clocks every seating position when he walks into a room. He strictly noticed that the victim was sitting adjacent to Eleanor.' },
            { id: 'julian', name: 'Julian', avatar: 'https://randomuser.me/api/portraits/men/55.jpg', role: 'Vain Movie Star', desc: 'A man wearing sunglasses indoors, checking his reflection in a spoon. Thinks everyone is a fan.', hiddenTruth: 'He was passed over for a lead role for lacking a "killer instinct". He is extremely cowardly, jumped, and hid under the table during the blackout.' },
            { id: 'arthur', name: 'Arthur', avatar: 'https://randomuser.me/api/portraits/men/62.jpg', role: 'Paranoid Businessman', desc: 'A middle-aged man in a wrinkled suit, continually wiping sweat from his forehead.', hiddenTruth: 'He owed $50,000 to the victim tonight. He came to beg for time, but someone else killed the victim before he could. He was relieved but terrified.' },
            { id: 'silvio', name: 'Silvio', avatar: 'https://randomuser.me/api/portraits/men/77.jpg', role: 'The Gossip Waiter', desc: 'A slick, fast-talking waiter who seems more interested in drama than serving food.', hiddenTruth: 'He sells celebrity gossip to tabloids. He saw Eleanor glaring at the victim with pure hatred minutes before the blackout, but kept quiet hoping to sell the story.' },
            { id: 'beatrice', name: 'Beatrice', avatar: 'https://randomuser.me/api/portraits/women/88.jpg', role: 'Journalist', desc: 'A sharp, no-nonsense investigative reporter with a notepad always at the ready.', hiddenTruth: 'She is doing an exposé on gang violence. She had her audio recorder running when the shot was fired, so she knows the shot came from the direction of Eleanor\'s table.' }
        ]
    },
    {
        id: 'm2',
        title: 'The Train Blackout',
        setting: 'A briefcase is stolen from a Business Executive during a sudden blackout on a moving train. The truth goes deeper than simple theft.',
        killerId: 'journalist',
        suspects: [
            { id: 'exec', name: 'Business Executive', avatar: 'https://randomuser.me/api/portraits/men/25.jpg', role: 'The Victim', desc: 'Wealthy, stressed, continually checking his luxury watch.', hiddenTruth: 'He was about to expose his own company for covering up a deadly industrial accident.' },
            { id: 'journalist', name: 'Investigative Journalist', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', role: 'Curious Reporter', desc: 'Sharp, inquisitive, taking mental notes of everyone.', hiddenTruth: 'Her brother died in the industrial accident the Executive was exposing. She stole the briefcase not for money, but to expose the company herself to get justice. She is the culprit.' },
            { id: 'bodyguard', name: 'Bodyguard', avatar: 'https://randomuser.me/api/portraits/men/85.jpg', role: 'Loyal Protector', desc: 'Stoic, muscular, very quiet. Scanning the car heavily.', hiddenTruth: 'He was bribed heavily to stand down during the blackout and let the theft happen.' },
            { id: 'conductor', name: 'Conductor', avatar: 'https://randomuser.me/api/portraits/men/12.jpg', role: 'Train Official', desc: 'In control, wearing a crisp uniform, seems slightly nervous.', hiddenTruth: 'He knew exactly when the blackout would happen. He was paid to look away.' },
            { id: 'pickpocket', name: 'Pickpocket', avatar: 'https://randomuser.me/api/portraits/men/18.jpg', role: 'Petty Thief', desc: 'Shifty, avoids eye contact, hands always deep in his pockets.', hiddenTruth: 'He was trying to steal a wallet when the lights went out, but he saw the Journalist take the briefcase. He is terrified to speak.' },
            { id: 'tourist', name: 'Bumbling Tourist', avatar: 'https://randomuser.me/api/portraits/men/73.jpg', role: 'Innocent Bystander', desc: 'Wearing a bright shirt, large camera around his neck. Looks very anxious.', hiddenTruth: 'He accidentally filmed the blackout and someone moving in the dark, but he is too scared to admit it.' }
        ]
    },
    {
        id: 'm3',
        title: 'Museum Theft',
        setting: 'A priceless diamond is stolen from an exhibit display during a sudden, targeted power failure.',
        killerId: 'janitor',
        suspects: [
            { id: 'curator', name: 'The Curator', avatar: 'https://randomuser.me/api/portraits/men/91.jpg', role: 'Proud Expert', desc: 'Arrogant, scholarly, extremely protective of the museum pieces.', hiddenTruth: 'The diamond that was stolen is actually a fake replica. They are trying to hide the embarrassment.' },
            { id: 'guard', name: 'Security Guard', avatar: 'https://randomuser.me/api/portraits/men/38.jpg', role: 'Nervous Watchman', desc: 'Constantly sweating, checking his radio with shaking hands.', hiddenTruth: 'He is deep in gambling debt and was planning to steal the diamond himself, but someone else beat him to it.' },
            { id: 'collector', name: 'Art Collector', avatar: 'https://randomuser.me/api/portraits/men/54.jpg', role: 'Obsessed Buyer', desc: 'Eccentric, wealthy, staring blankly at the empty case.', hiddenTruth: 'Lost everything trying to acquire this diamond previously. Desperate enough to do anything.' },
            { id: 'electrician', name: 'Electrician', avatar: 'https://randomuser.me/api/portraits/men/66.jpg', role: 'Maintenance Worker', desc: 'Holding tools, grumbling about the old building wiring.', hiddenTruth: 'Former engineer fired unfairly by this museum. Holds a massive grudge and wanted to embarrass them.' },
            { id: 'influencer', name: 'Social Influencer', avatar: 'https://randomuser.me/api/portraits/women/14.jpg', role: 'Vlogger', desc: 'Holding a ring light, filming everything, completely ignoring social boundaries.', hiddenTruth: 'Staged chaos for content, hoping a major blackout would skyrocket their viral views.' },
            { id: 'janitor', name: 'The Janitor', avatar: 'https://randomuser.me/api/portraits/men/89.jpg', role: 'Invisible Worker', desc: 'Quiet, mopping the floor seemingly uninterested in the commotion.', hiddenTruth: 'He is the former head of security design for the museum who was replaced. He stole the diamond to prove the new system is dangerously flawed. He is the culprit.' }
        ]
    },
    {
        id: 'm4',
        title: 'Hotel Incident',
        setting: 'A wealthy hotel guest is brutally attacked and robbed in their suite during a building-wide power grid failure.',
        killerId: 'magician',
        suspects: [
            { id: 'victim', name: 'Wealthy Guest', avatar: 'https://randomuser.me/api/portraits/men/27.jpg', role: 'The Victim', desc: 'Loud, obnoxious, extremely demanding of all staff.', hiddenTruth: 'Has secretly scammed multiple people out of their life savings through a massive Ponzi scheme.' },
            { id: 'doctor', name: 'The Doctor', avatar: 'https://randomuser.me/api/portraits/women/41.jpg', role: 'Helpful Guest', desc: 'Calm, collected, offering medical aid to the victim.', hiddenTruth: 'One of the victim’s former scam victims. Holds intense anger and a deep sense of betrayal.' },
            { id: 'bellhop', name: 'The Bellhop', avatar: 'https://randomuser.me/api/portraits/men/36.jpg', role: 'Friendly Staff', desc: 'Smiles far too much, knows exactly where everyone is staying.', hiddenTruth: 'Knows all guest routines perfectly and frequently steals small items from rooms.' },
            { id: 'manager', name: 'Hotel Manager', avatar: 'https://randomuser.me/api/portraits/men/59.jpg', role: 'Nervous Boss', desc: 'Trying desperately to keep everyone calm to protect the PR.', hiddenTruth: 'Has been covering up petty crimes in the hotel for months to protect its five-star reputation.' },
            { id: 'tourist', name: 'Quiet Tourist', avatar: 'https://randomuser.me/api/portraits/women/75.jpg', role: 'Bystander', desc: 'Observing everything quietly from the corner of the lobby.', hiddenTruth: 'Lost their entire life savings to the victim’s scam. Desperately wants severe revenge.' },
            { id: 'magician', name: 'The Magician', avatar: 'https://randomuser.me/api/portraits/men/9.jpg', role: 'Lounge Entertainer', desc: 'Flashy, charismatic, constantly shuffling a deck of playing cards.', hiddenTruth: 'The victim destroyed his life financially years ago. He used his blackout illusion skills to execute the perfect revenge attack and framing. He is the culprit.' }
        ]
    },
    {
        id: 'm5',
        title: 'Submarine Sabotage',
        setting: 'A deep-sea research submarine suddenly loses power. When emergency lights kick on, the lead scientist is dead. The crew is trapped 10,000 feet underwater.',
        killerId: 'pilot',
        suspects: [
            { id: 'pilot', name: 'The Pilot', avatar: 'https://randomuser.me/api/portraits/men/15.jpg', role: 'Submarine Captain', desc: 'Sweating profusely, obsessively checking gauges.', hiddenTruth: 'He was bribed by a rival corporation to sabotage the mission. He killed the scientist to cover his tracks. You are the killer.' },
            { id: 'biologist', name: 'Marine Biologist', avatar: 'https://randomuser.me/api/portraits/women/22.jpg', role: 'Colleague', desc: 'In shock, staring blankly at the dark window.', hiddenTruth: 'She was secretly stealing data from the victim to publish as her own, but she didn’t kill him.' },
            { id: 'engineer', name: 'Chief Engineer', avatar: 'https://randomuser.me/api/portraits/men/82.jpg', role: 'Mechanic', desc: 'Covered in grease, angrily trying to reboot systems.', hiddenTruth: 'He knew the submarine was faulty but signed off on it anyway to get his bonus. He thinks the death is his fault due to negligence.' },
            { id: 'investor', name: 'Billionaire Investor', avatar: 'https://randomuser.me/api/portraits/men/33.jpg', role: 'Mission Funder', desc: 'Furious, demanding to be rescued immediately.', hiddenTruth: 'He’s secretly bankrupt and needed this mission to succeed to save his empire. He is desperate but innocent of the murder.' },
            { id: 'medic', name: 'Submarine Medic', avatar: 'https://randomuser.me/api/portraits/women/8.jpg', role: 'Doctor', desc: 'Calmly organizing medical supplies, avoiding eye contact.', hiddenTruth: 'She was having an affair with the victim and they had a terrible fight right before the blackout.' }
        ]
    },
    {
        id: 'm6',
        title: 'Silicon Valley Gala',
        setting: 'The massive tech CEO is found poisoned at an exclusive launch gala during a sudden 30-second blackout block.',
        killerId: 'founder',
        suspects: [
            { id: 'founder', name: 'Co-Founder', avatar: 'https://randomuser.me/api/portraits/men/44.jpg', role: 'Ousted Partner', desc: 'Drinking heavily, smiling a bit too much.', hiddenTruth: 'The CEO stole his code and pushed him out of his own company 5 years ago. He finally got revenge tonight. You are the killer.' },
            { id: 'cfo', name: 'The CFO', avatar: 'https://randomuser.me/api/portraits/women/65.jpg', role: 'Financial Officer', desc: 'Frantically deleting files on her phone.', hiddenTruth: 'She has been actively embezzling millions from the company. She was terrified the CEO found out.' },
            { id: 'rival', name: 'Rival CEO', avatar: 'https://randomuser.me/api/portraits/men/51.jpg', role: 'Competitor', desc: 'Smug, well-dressed, observing the chaos calmly.', hiddenTruth: 'He planted a spy in the company, but he didn’t order a murder.' },
            { id: 'intern', name: 'The Intern', avatar: 'https://randomuser.me/api/portraits/men/21.jpg', role: 'Assistant', desc: 'Terrified, holding a tray of empty glasses.', hiddenTruth: 'He actually served the poisoned drink, completely unaware it was laced. He thinks he accidentally killed the CEO.' },
            { id: 'wife', name: 'The Ex-Wife', avatar: 'https://randomuser.me/api/portraits/women/40.jpg', role: 'Socialite', desc: 'Wearing dark sunglasses indoors, looking bored.', hiddenTruth: 'She stands to inherit half the estate, but she genuinely didn’t kill him.' }
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
                <span>Sign in With google</span>
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
                You may only interrogate a suspect <b>3 times</b> before they refuse to speak.
                Apply Power-Ups from your inventory to unearth their deeply hidden truths.
            </p>
            <button class="primary-btn" style="margin-top: 20px;" onclick="startGame()">Start Investigation</button>
        `;
    }
    return div;
}

function createGameScreen() {
    const layout = document.createElement('div');
    layout.className = 'fade-in game-layout';
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
    const currentMystery = mysteries[state.currentMysteryIndex];
    
    if (state.result === 'win') {
        const hasNext = state.currentMysteryIndex < mysteries.length - 1;
        div.innerHTML = `
            <h1 style="color: #4ade80;">Case Solved</h1>
            <p style="color: #fff; font-size: 1.2rem; max-width: 800px; text-align: left;">
                Excellent deductive work, Detective. You correctly deduced the killer's identity!<br><br>
                <b>Reward:</b> +1 Truth Serum, +1 Intimidation, +1 Charm added to your inventory.
            </p>
            ${hasNext 
                ? '<button class="primary-btn" onclick="nextMystery()">Next Mystery</button>' 
                : '<p style="color: var(--accent-gold);">You have solved all available cases. You are a legendary detective.</p><button class="primary-btn" onclick="nextMystery()">Play Again</button>'}
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
                if (data.inventory !== undefined) state.inventory = data.inventory;
            } else {
                // Initialize new player records
                const { setDoc } = window.firebaseAPI;
                await setDoc(doc(window.db, "players", user.uid), {
                    currentMysteryIndex: 0,
                    inventory: { truth: 1, intimidation: 1, charm: 1 }
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
                inventory: state.inventory
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
    state.questionsAsked = {}; // reset interrogations for this run
    state.log.push({ type: 'system', text: 'Investigation started. The perimeter is secured.' });
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
    const currentMystery = mysteries[state.currentMysteryIndex];
    const target = currentMystery.suspects.find(s => s.id === suspectId);
    if (!target) return;

    // Increment question count
    if (!state.questionsAsked[target.id]) state.questionsAsked[target.id] = 0;
    state.questionsAsked[target.id]++;

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

    try {
        const response = await fetch('http://localhost:3000/api/interrogate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        if (data.error) return `[API Error] ${data.error}`;
        return data.answer.trim().replace(/^"|"$/g, '');
    } catch (e) {
        return `[Network Error] Could not connect to local proxy server. Make sure node server.js is running in your terminal.`;
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
        // Award power ups!
        state.inventory.truth++;
        state.inventory.intimidation++;
        state.inventory.charm++;
        await saveProgress();
        resetGame();
    } else {
        // They beat the game, reset entirely
        state.currentMysteryIndex = 0;
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
