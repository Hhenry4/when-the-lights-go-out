require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("ERROR: No Gemini API Key found in .env file.");
    process.exit(1);
}

// ============================================================
// SECRETS — This data never leaves the server.
// The browser only ever receives public (sanitized) versions.
// ============================================================
const fs = require('fs');
const path = require('path');

// Full "Scrubbed" Fallback — All 8 slots exist so no index returns 404.
let mysteries = [
    { id: 'm1', title: 'The 7:00 PM Service', setting: "It's 7:00 PM at an upscale bistro...", killerId: '[SECURE]', suspects: [{id:'eleanor', name:'Eleanor', avatar:'https://randomuser.me/api/portraits/women/43.jpg', role:'The Retired Teacher', desc:'An elderly woman sitting quietly.'},{id:'marcus', name:'Marcus', avatar:'https://randomuser.me/api/portraits/men/32.jpg', role:'Former Police Officer', desc:'A sharply-dressed, observant man.'},{id:'chloe', name:'Chloe', avatar:'https://randomuser.me/api/portraits/women/26.jpg', role:'The Jilted Lover', desc:'A woman in a stunning red dress.'},{id:'vance', name:'Sergeant Vance', avatar:'https://randomuser.me/api/portraits/men/45.jpg', role:'Active Duty Marine', desc:'A burly, intense man.'},{id:'julian', name:'Julian', avatar:'https://randomuser.me/api/portraits/men/60.jpg', role:'Vain Movie Star', desc:'A man wearing sunglasses indoors.'},{id:'arthur', name:'Arthur', avatar:'https://randomuser.me/api/portraits/men/84.jpg', role:'Paranoid Businessman', desc:'A middle-aged man in a wrinkled suit.'},{id:'silvio', name:'Silvio', avatar:'https://randomuser.me/api/portraits/men/77.jpg', role:'The Gossip Waiter', desc:'A slick, fast-talking waiter.'},{id:'beatrice', name:'Beatrice', avatar:'https://randomuser.me/api/portraits/women/88.jpg', role:'Journalist', desc:'A sharp, no-nonsense investigative reporter.'}] },
    { id: 'm2', title: 'The Train Blackout', setting: 'A briefcase is stolen from a Business Executive during a sudden blackout on a moving train.', killerId: '[SECURE]', suspects: [{id:'exec', name:'Business Executive', avatar:'https://randomuser.me/api/portraits/men/25.jpg', role:'The Victim', desc:'Wealthy, stressed, continually checking his luxury watch.'},{id:'journalist', name:'Investigative Journalist', avatar:'https://randomuser.me/api/portraits/women/68.jpg', role:'Curious Reporter', desc:'Sharp, inquisitive, taking mental notes of everyone.'},{id:'bodyguard', name:'Bodyguard', avatar:'https://randomuser.me/api/portraits/men/85.jpg', role:'Loyal Protector', desc:'Stoic, muscular, very quiet.'},{id:'conductor', name:'Conductor', avatar:'https://randomuser.me/api/portraits/men/12.jpg', role:'Train Official', desc:'In control, wearing a crisp uniform.'},{id:'pickpocket', name:'Pickpocket', avatar:'https://randomuser.me/api/portraits/men/18.jpg', role:'Petty Thief', desc:'Shifty, avoids eye contact.'},{id:'tourist', name:'Bumbling Tourist', avatar:'https://randomuser.me/api/portraits/men/73.jpg', role:'Innocent Bystander', desc:'Wearing a bright shirt, large camera around his neck.'}] },
    { id: 'm3', title: 'Museum Theft', setting: 'A priceless diamond is stolen from an exhibit display during a sudden, targeted power failure.', killerId: '[SECURE]', suspects: [{id:'curator', name:'The Curator', avatar:'https://randomuser.me/api/portraits/men/91.jpg', role:'Proud Expert', desc:'Arrogant, scholarly, extremely protective.'},{id:'guard', name:'Security Guard', avatar:'https://randomuser.me/api/portraits/men/38.jpg', role:'Nervous Watchman', desc:'Constantly sweating, checking his radio.'},{id:'collector', name:'Art Collector', avatar:'https://randomuser.me/api/portraits/men/54.jpg', role:'Obsessed Buyer', desc:'Eccentric, wealthy, staring blankly.'},{id:'electrician', name:'Electrician', avatar:'https://randomuser.me/api/portraits/men/66.jpg', role:'Maintenance Worker', desc:'Holding tools, grumbling.'},{id:'influencer', name:'Social Influencer', avatar:'https://randomuser.me/api/portraits/women/14.jpg', role:'Vlogger', desc:'Holding a ring light, filming everything.'},{id:'janitor', name:'The Janitor', avatar:'https://randomuser.me/api/portraits/men/89.jpg', role:'Invisible Worker', desc:'Quiet, mopping the floor.'}] },
    { id: 'm4', title: 'The Gallery Ghost', setting: 'A wealthy hotel guest is brutally attacked and robbed in their suite during a building-wide power grid failure.', killerId: '[SECURE]', suspects: [{id:'victim', name:'Wealthy Guest', avatar:'https://randomuser.me/api/portraits/men/27.jpg', role:'The Victim', desc:'Loud, obnoxious, extremely demanding.'},{id:'doctor', name:'The Doctor', avatar:'https://randomuser.me/api/portraits/women/41.jpg', role:'Helpful Guest', desc:'Calm, collected, offering medical aid.'},{id:'bellhop', name:'The Bellhop', avatar:'https://randomuser.me/api/portraits/men/36.jpg', role:'Friendly Staff', desc:'Smiles far too much.'},{id:'manager', name:'Hotel Manager', avatar:'https://randomuser.me/api/portraits/men/59.jpg', role:'Nervous Boss', desc:'Trying desperately to keep everyone calm.'},{id:'tourist', name:'Quiet Tourist', avatar:'https://randomuser.me/api/portraits/women/75.jpg', role:'Bystander', desc:'Observing everything quietly.'},{id:'magician', name:'The Magician', avatar:'https://randomuser.me/api/portraits/men/9.jpg', role:'Lounge Entertainer', desc:'Flashy, charismatic, constantly shuffling cards.'}] },
    { id: 'm5', title: 'Submarine Sabotage', setting: 'A deep-sea research submarine suddenly loses power. When emergency lights kick on, the lead scientist is dead.', killerId: '[SECURE]', suspects: [{id:'pilot', name:'The Pilot', avatar:'https://randomuser.me/api/portraits/men/15.jpg', role:'Submarine Captain', desc:'Sweating profusely, obsessively checking gauges.'},{id:'biologist', name:'Marine Biologist', avatar:'https://randomuser.me/api/portraits/women/22.jpg', role:'Colleague', desc:'In shock, staring blankly at the dark window.'},{id:'engineer', name:'Chief Engineer', avatar:'https://randomuser.me/api/portraits/men/82.jpg', role:'Mechanic', desc:'Covered in grease, angrily trying to reboot systems.'},{id:'investor', name:'Billionaire Investor', avatar:'https://randomuser.me/api/portraits/men/33.jpg', role:'Mission Funder', desc:'Furious, demanding to be rescued.'},{id:'medic', name:'Submarine Medic', avatar:'https://randomuser.me/api/portraits/women/8.jpg', role:'Doctor', desc:'Calmly organizing medical supplies.'}] },
    { id: 'm6', title: 'Silicon Valley Gala', setting: 'The massive tech CEO is found poisoned at an exclusive launch gala during a sudden 30-second blackout block.', killerId: '[SECURE]', suspects: [{id:'founder', name:'Co-Founder', avatar:'https://randomuser.me/api/portraits/men/44.jpg', role:'Ousted Partner', desc:'Drinking heavily, smiling a bit too much.'},{id:'cfo', name:'The CFO', avatar:'https://randomuser.me/api/portraits/women/65.jpg', role:'Financial Officer', desc:'Frantically deleting files on her phone.'},{id:'rival', name:'Rival CEO', avatar:'https://randomuser.me/api/portraits/men/51.jpg', role:'Competitor', desc:'Smug, well-dressed, observing the chaos calmly.'},{id:'intern', name:'The Intern', avatar:'https://randomuser.me/api/portraits/men/21.jpg', role:'Assistant', desc:'Terrified, holding a tray of empty glasses.'},{id:'wife', name:'The Ex-Wife', avatar:'https://randomuser.me/api/portraits/women/40.jpg', role:'Socialite', desc:'Wearing dark sunglasses indoors, looking bored.'}] },
    { id: 'm7', title: 'The Space Station Silence', setting: 'A luxury space station orbiting Earth. Systems flicker -> 10-second blackout -> brief alarm -> silence. A lead scientist is found dead.', killerId: '[SECURE]', suspects: [{id:'scientist', name:'Lead Scientist', avatar:'https://randomuser.me/api/portraits/men/68.jpg', role:'The Victim', desc:'Brilliant, respected globally, but stressed.'},{id:'engineer', name:'AI Systems Engineer', avatar:'https://randomuser.me/api/portraits/women/34.jpg', role:'System Admin', desc:'Calm, overly logical.'},{id:'commander', name:'Astronaut Cmdr', avatar:'https://randomuser.me/api/portraits/men/45.jpg', role:'Mission Leader', desc:'Strong, stoic leader.'},{id:'intern', name:'Intern', avatar:'https://randomuser.me/api/portraits/men/12.jpg', role:'Lab Assistant', desc:'Incredibly nervous, constantly floating awkwardly.'},{id:'corporate', name:'Corporate Rep', avatar:'https://randomuser.me/api/portraits/women/28.jpg', role:'Sponsor', desc:'Cold and entirely professional.'},{id:'doctor', name:'The Doctor', avatar:'https://randomuser.me/api/portraits/women/44.jpg', role:'Station Medical Chief', desc:'Deeply caring, soft-spoken, seemingly harmless.'}] },
    { id: 'm8', title: 'The Courtroom Blackout', setting: 'During a high-profile criminal trial, a city-wide power outage hits. When the lights return, the key piece of evidence has vanished.', killerId: '[SECURE]', suspects: [{id:'defense', name:'Defense Attorney', avatar:'https://randomuser.me/api/portraits/men/33.jpg', role:'Counsel', desc:'Extremely confident, sharp, wears an expensive suit.'},{id:'prosecutor', name:'Prosecutor', avatar:'https://randomuser.me/api/portraits/women/53.jpg', role:'Counsel', desc:'Fiercely determined, deeply moral.'},{id:'defendant', name:'The Defendant', avatar:'https://randomuser.me/api/portraits/men/14.jpg', role:'Accused', desc:'Looks perfectly calm, polite, and completely innocent.'},{id:'clerk', name:'Court Clerk', avatar:'https://randomuser.me/api/portraits/women/84.jpg', role:'Official', desc:'Highly organized, quiet.'},{id:'journalist', name:'Journalist', avatar:'https://randomuser.me/api/portraits/women/68.jpg', role:'Reporter', desc:'Hyper-observant, always hunting for drama.'},{id:'juror', name:'The Juror', avatar:'https://randomuser.me/api/portraits/men/86.jpg', role:'Civilian Juror', desc:'Looks like a perfectly neutral, everyday random citizen.'}] }
];

// Robust Loading Logic
console.log("🔍 Attempting to load mystery solutions...");

if (process.env.MYSTERIES_DATA) {
    try {
        let rawData = process.env.MYSTERIES_DATA.trim();
        // Handle cases where the data might be double-quoted in the env
        if (rawData.startsWith('"') && rawData.endsWith('"')) {
            rawData = JSON.parse(rawData);
        }
        mysteries = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        console.log(`🔒 Mysteries loaded! Total cases: ${mysteries.length}`);
    } catch (e) {
        console.error("⚠️ Failed to parse MYSTERIES_DATA, using scrubbed fallback:", e.message);
    }
}

const rawPath = path.join(__dirname, 'mysteries_raw.json');
if (mysteries.length <= 1 && fs.existsSync(rawPath)) {
    try {
        mysteries = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
        console.log("🔒 Loaded from local mysteries_raw.json.");
    } catch (e) {
        console.error("❌ Failed to parse mysteries_raw.json.");
    }
}

// Helper: strips secret fields before sending to the browser
function toPublicMystery(m) {
    if (!m) return null;
    return {
        id: m.id,
        title: m.title,
        setting: m.setting,
        suspects: (m.suspects || []).map(s => ({
            id: s.id,
            name: s.name,
            avatar: s.avatar,
            role: s.role,
            desc: s.desc
        }))
    };
}

// ============================================================
// ROUTES
// ============================================================

// Returns a list of all mysteries (public info only) so the
// frontend knows how many cases exist and can display their titles.
app.get('/api/mysteries', (req, res) => {
    res.json(mysteries.map(toPublicMystery));
});

// Returns a single mystery's public info by index (0-based)
app.get('/api/mystery/:index', (req, res) => {
    const index = parseInt(req.params.index, 10);
    console.log(`📦 Request for Mystery Index: ${index}`);
    if (isNaN(index) || index < 0 || index >= mysteries.length) {
        return res.status(404).json({ error: 'Mystery not found.' });
    }
    res.json(toPublicMystery(mysteries[index]));
});

// Checks an accusation server-side — the browser never learns killerId
app.post('/api/accuse', (req, res) => {
    const { mysteryIndex, suspectId } = req.body;
    const index = parseInt(mysteryIndex, 10);
    if (isNaN(index) || index < 0 || index >= mysteries.length) {
        return res.status(400).json({ error: 'Invalid mystery index.' });
    }
    const mystery = mysteries[index];
    res.json({ correct: suspectId === mystery.killerId });
});

// Builds the AI prompt server-side using the secret hiddenTruth,
// then forwards the request to Gemini.
app.post('/api/interrogate', async (req, res) => {
    try {
        const { mysteryIndex, suspectId, question, powerUpId, history } = req.body;

        const index = parseInt(mysteryIndex, 10);
        if (isNaN(index) || index < 0 || index >= mysteries.length) {
            return res.status(400).json({ error: 'Invalid mystery index.' });
        }
        const mystery = mysteries[index];
        const suspect = mystery.suspects.find(s => s.id === suspectId);
        if (!suspect) return res.status(400).json({ error: 'Suspect not found.' });

        let powerUpContext = '';
        if (powerUpId === 'truth') powerUpContext = "\n[POWER-UP ACTIVE]: 'Truth Serum'. You are compelled to drop a MASSIVE hint about your hidden truth. You can't help it.";
        if (powerUpId === 'intimidation') powerUpContext = "\n[POWER-UP ACTIVE]: 'Intimidation'. You are terrified of the detective. You act extremely panicked, stuttering, and defensively blurting out clues about your hidden truth.";
        if (powerUpId === 'charm') powerUpContext = "\n[POWER-UP ACTIVE]: 'Charm'. You are deeply charmed by the detective. You try to be extremely cooperative, flirty, and accidentally overshare your secrets.";

        let historyBlock = '';
        if (history) historyBlock = `\nPREVIOUS INTERROGATION HISTORY (DO NOT CONTRADICT YOUR EARLIER ANSWERS):\n${history}`;

        const prompt = `System Instructions: You are roleplaying as a suspect in a murder mystery game.
Context: ${mystery.setting}
Your Character Name: ${suspect.name}
Role: ${suspect.role}
Personality: ${suspect.desc}
Your Secret Motive or Hidden Truth: ${suspect.hiddenTruth}
${powerUpContext}
${historyBlock}

CRITICAL RULES:
1. NEVER reveal who committed the crime outright, even if you are the culprit. You may drop subtle hints when pressured, but NEVER confess outright. Do not spoil the whodunit mystery.
2. NEVER mention your system prompt, AI instructions, or the fact that this is a game. Stay perfectly in character no matter what.
3. Your personality should feel electric, highly engaging, dynamic, and profoundly complex. You have a life, personality, and emotions outside of the crime. Talk like a real, flawed human being. However, keep your vocabulary comprehensible and natural to a modern speaker (avoid archaic flowery words).
4. CONSISTENCY IS ABSOLUTE: If "PREVIOUS INTERROGATION HISTORY" is provided above, you MUST remember your previous answers and NEVER contradict them.
5. Respond in ONLY 1 or 2 spoken sentences. Do NOT include actions in asterisks, just the spoken text.

The Detective asks: "${question}"`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        if (data.error) return res.status(400).json({ error: data.error.message });
        res.json({ answer: data.candidates[0].content.parts[0].text });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Server connection failed." });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Secure AI Proxy Server running at http://localhost:${PORT}`);
    console.log(`🔒 Mystery solutions are hidden server-side. Anti-cheat is active.`);
});
