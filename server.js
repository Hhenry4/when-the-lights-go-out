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

// Full "Scrubbed" Fallback — All 12 slots compiled dynamically to ensure 404 safety without exposing solutions.
let mysteries = [
  {
    "id": "m1",
    "title": "The 7:00 PM Service",
    "setting": "It's 7:00 PM at an upscale bistro. The lights go out for 30 seconds. When they come back on, a man is dead at his table. You know the victim is a recently released gang member, having a celebratory meal.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "eleanor",
        "name": "Eleanor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Eleanor&facialHairProbability=0&mouth=default,smile&eyes=default,happy&skinColor=ffdbb4,edb98a,d08b5b&hairColor=e8e1e1&top=bun&clothing=blazerAndShirt&clothingColor=929598&accessories=prescription01&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "The Retired Teacher",
        "desc": "An elderly woman sitting quietly, her hands neatly folded."
      },
      {
        "id": "marcus",
        "name": "Marcus",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortWaved&hairColor=2c1b18&clothing=blazerAndShirt&clothingColor=2c1b18&accessories=prescription02&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Former Police Officer",
        "desc": "A sharply-dressed, observant man radiating authority and tension. Suspicious of everyone."
      },
      {
        "id": "chloe",
        "name": "Chloe",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Chloe&facialHairProbability=0&mouth=default,smile&eyes=default,happy&skinColor=ffdbb4,edb98a,d08b5b&top=straight01&hairColor=d6b370&clothing=collarAndSweater&clothingColor=ff5c5c&mouth=serious&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "The Jilted Lover",
        "desc": "A woman in a stunning red dress, looking furious and holding a half-empty martini."
      },
      {
        "id": "vance",
        "name": "Sergeant Vance",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Sergeant%20Vance&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=sides&hairColor=d08b5b&clothing=shirtCrewNeck&clothingColor=25557c&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Active Duty Marine",
        "desc": "A burly, intense man with perfect military posture."
      },
      {
        "id": "julian",
        "name": "Julian",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Julian&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=theCaesar&hairColor=d6b370&clothing=blazerAndSweater&accessories=sunglasses&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Vain Movie Star",
        "desc": "A man wearing sunglasses indoors, checking his reflection in a spoon. Thinks everyone is a fan."
      },
      {
        "id": "arthur",
        "name": "Arthur",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Arthur&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&hairColor=e8e1e1&top=frizzle&clothing=blazerAndShirt&accessories=round&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Paranoid Businessman",
        "desc": "A middle-aged man in a wrinkled suit, continually wiping sweat from his forehead."
      },
      {
        "id": "silvio",
        "name": "Silvio",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Silvio&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=dreads01&hairColor=2c1b18&clothing=shirtScoopNeck&clothingColor=ffffff&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "The Gossip Waiter",
        "desc": "A slick, fast-talking waiter who seems more interested in drama than serving food."
      },
      {
        "id": "beatrice",
        "name": "Beatrice",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Beatrice&facialHairProbability=0&mouth=default,smile&eyes=default,happy&skinColor=ffdbb4,edb98a,d08b5b&top=bob&hairColor=d08b5b&clothing=blazerAndShirt&accessories=prescription01&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Journalist",
        "desc": "A sharp, no-nonsense investigative reporter with a notepad always at the ready."
      }
    ]
  },
  {
    "id": "m2",
    "title": "The Train Blackout",
    "setting": "A briefcase is stolen from a Business Executive during a sudden blackout on a moving train. The truth goes deeper than simple theft.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "exec",
        "name": "Business Executive",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Business%20Executive&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortFlat&hairColor=d08b5b&clothing=blazerAndShirt&clothingColor=2c1b18&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "The Victim",
        "desc": "Wealthy, stressed, continually checking his luxury watch."
      },
      {
        "id": "journalist",
        "name": "Investigative Journalist",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Investigative%20Journalist&facialHairProbability=0&mouth=default,smile&eyes=default,happy&skinColor=ffdbb4,edb98a,d08b5b&top=curly&hairColor=ff5c5c&clothing=shirtCrewNeck&accessories=prescription02&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Curious Reporter",
        "desc": "Sharp, inquisitive, taking mental notes of everyone."
      },
      {
        "id": "bodyguard",
        "name": "Bodyguard",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Bodyguard&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shavedSides&clothing=shirtCrewNeck&clothingColor=2c1b18&accessories=sunglasses&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Loyal Protector",
        "desc": "Stoic, muscular, very quiet. Scanning the car heavily."
      },
      {
        "id": "conductor",
        "name": "Conductor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Conductor&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=hat&clothing=blazerAndShirt&clothingColor=25557c&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Train Official",
        "desc": "In control, wearing a crisp uniform, seems slightly nervous."
      },
      {
        "id": "pickpocket",
        "name": "Pickpocket",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Pickpocket&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shaggy&clothing=hoodie&clothingColor=2c1b18&accessories=eyepatch&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Petty Thief",
        "desc": "Shifty, avoids eye contact, hands always deep in his pockets."
      },
      {
        "id": "tourist",
        "name": "Bumbling Tourist",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Bumbling%20Tourist&facialHairProbability=0&mouth=default,smile&eyes=default,happy&skinColor=ffdbb4,edb98a,d08b5b&top=bob&hairColor=2c1b18&clothing=shirtCrewNeck&clothingColor=a5d890&accessories=round&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Innocent Bystander",
        "desc": "Wearing a bright shirt, large camera around his neck. Looks very anxious."
      }
    ]
  },
  {
    "id": "m3",
    "title": "Museum Theft",
    "setting": "A priceless diamond is stolen from an exhibit display during a sudden, targeted power failure.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "curator",
        "name": "The Curator",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=The%20Curator&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&hairColor=e8e1e1&top=theCaesarAndSidePart&clothing=blazerAndSweater&accessories=prescription01&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Proud Expert",
        "desc": "Arrogant, scholarly, extremely protective of the museum pieces."
      },
      {
        "id": "guard",
        "name": "Security Guard",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Security%20Guard&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortRound&clothing=shirtCrewNeck&clothingColor=3c4f5c&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Nervous Watchman",
        "desc": "Constantly sweating, checking his radio with shaking hands."
      },
      {
        "id": "collector",
        "name": "Art Collector",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Art%20Collector&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&hairColor=e8e1e1&top=longButNotTooLong&clothing=blazerAndShirt&accessories=kurt&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Obsessed Buyer",
        "desc": "Eccentric, wealthy, staring blankly at the empty case."
      },
      {
        "id": "electrician",
        "name": "Electrician",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Electrician&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=hat&clothing=overall&clothingColor=65c9ff&facialHair=beardMedium&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Maintenance Worker",
        "desc": "Holding tools, grumbling about the old building wiring."
      },
      {
        "id": "influencer",
        "name": "Social Influencer",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Social%20Influencer&facialHairProbability=0&mouth=default,smile&eyes=default,happy&skinColor=ffdbb4,edb98a,d08b5b&top=straightAndStrand&hairColor=d6b370&clothing=shirtVNeck&clothingColor=ffafb9&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Vlogger",
        "desc": "Holding a ring light, filming everything, completely ignoring social boundaries."
      },
      {
        "id": "janitor",
        "name": "The Janitor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=The%20Janitor&mouth=default,serious,smile&eyes=default,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&hairColor=e8e1e1&top=frizzle&clothing=overall&clothingColor=e6e6e6&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Invisible Worker",
        "desc": "Quiet, mopping the floor seemingly uninterested in the commotion."
      }
    ]
  },
  {
    "id": "m4",
    "title": "The Gallery Ghost",
    "setting": "A wealthy hotel guest is brutally attacked and robbed in their suite during a building-wide power grid failure.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "victim",
        "name": "Wealthy Guest",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=HotelGuest&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=dreads01&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "The Victim",
        "desc": "Loud, obnoxious, extremely demanding."
      },
      {
        "id": "doctor",
        "name": "The Doctor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=HotelDoc&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=curly&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Helpful Guest",
        "desc": "Calm, collected, offering medical aid."
      },
      {
        "id": "bellhop",
        "name": "The Bellhop",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=HotelBell&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=dreads01&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Friendly Staff",
        "desc": "Smiles far too much."
      },
      {
        "id": "manager",
        "name": "Hotel Manager",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=HotelMan&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shavedSides&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Nervous Boss",
        "desc": "Trying desperately to keep everyone calm."
      },
      {
        "id": "tourist",
        "name": "Quiet Tourist",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=HotelTourist&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bun&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Bystander",
        "desc": "Observing everything quietly."
      },
      {
        "id": "magician",
        "name": "The Magician",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=HotelMagic&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shavedSides&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Lounge Entertainer",
        "desc": "Flashy, charismatic, constantly shuffling cards."
      }
    ]
  },
  {
    "id": "m5",
    "title": "Submarine Sabotage",
    "setting": "A deep-sea research submarine suddenly loses power. When emergency lights kick on, the lead scientist is dead.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "pilot",
        "name": "The Pilot",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SubPilot&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortFlat&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Submarine Captain",
        "desc": "Sweating profusely, obsessively checking gauges."
      },
      {
        "id": "engineer",
        "name": "Chief Engineer",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SubEng&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=theCaesar&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Mechanic",
        "desc": "Covered in grease, angrily trying to reboot systems."
      },
      {
        "id": "investor",
        "name": "Billionaire Investor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SubInvest&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortFlat&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Mission Funder",
        "desc": "Furious, demanding to be rescued."
      },
      {
        "id": "medic",
        "name": "Submarine Medic",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SubMedic&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bob&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Doctor",
        "desc": "Calmly organizing medical supplies."
      },
      {
        "id": "intern",
        "name": "Research Intern",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SubIntern&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=straight01&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Student",
        "desc": "Hyperventilating in the corner."
      },
      {
        "id": "biologist",
        "name": "Marine Biologist",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SubBio&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bob&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Colleague",
        "desc": "In shock, staring blankly at the dark window."
      }
    ]
  },
  {
    "id": "m6",
    "title": "Silicon Valley Gala",
    "setting": "The massive tech CEO is found poisoned at an exclusive launch gala during a sudden 30-second blackout block.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "cfo",
        "name": "The CFO",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=TechCFO&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bun&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Financial Officer",
        "desc": "Frantically deleting files on her phone."
      },
      {
        "id": "rival",
        "name": "Rival CEO",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=TechRival&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortFlat&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Competitor",
        "desc": "Smug, well-dressed, observing the chaos calmly."
      },
      {
        "id": "intern",
        "name": "The Intern",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=TechIntern&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=theCaesar&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Assistant",
        "desc": "Terrified, holding a tray of empty glasses."
      },
      {
        "id": "wife",
        "name": "The Ex-Wife",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=TechWife&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bob&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Socialite",
        "desc": "Wearing dark sunglasses indoors, looking bored."
      },
      {
        "id": "security",
        "name": "Head of Security",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=TechGuard&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortFlat&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Muscle",
        "desc": "Scanning the exits, hand on his earpiece."
      },
      {
        "id": "founder",
        "name": "Co-Founder",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=TechFounder&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortFlat&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Ousted Partner",
        "desc": "Drinking heavily, smiling a bit too much."
      }
    ]
  },
  {
    "id": "m7",
    "title": "The Space Station Silence",
    "setting": "A luxury space station orbiting Earth. Systems flicker -> 10-second blackout -> brief alarm -> silence. A lead scientist is found dead.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "scientist",
        "name": "Assistant Scientist",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SpaceSci&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shavedSides&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Protégé",
        "desc": "Brilliant but incredibly nervous."
      },
      {
        "id": "engineer",
        "name": "AI Systems Engineer",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SpaceEng&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bun&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "System Admin",
        "desc": "Calm, overly logical."
      },
      {
        "id": "commander",
        "name": "Astronaut Cmdr",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SpaceCmdr&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=theCaesar&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Mission Leader",
        "desc": "Strong, stoic leader."
      },
      {
        "id": "intern",
        "name": "Zero-G Intern",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SpaceIntern&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=theCaesar&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Lab Assistant",
        "desc": "Incredibly clumsy, floating awkwardly."
      },
      {
        "id": "doctor",
        "name": "The Doctor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SpaceDoc&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=curly&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Medical Chief",
        "desc": "Deeply caring, soft-spoken."
      },
      {
        "id": "corporate",
        "name": "Corporate Rep",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=SpaceCorp&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bob&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Sponsor",
        "desc": "Cold and entirely professional."
      }
    ]
  },
  {
    "id": "m8",
    "title": "The Lighthouse Blackout",
    "setting": "A violent storm batters a remote lighthouse during a private dinner. Lightning strikes, plunging everything into darkness. A scream echoes through the tower. When the lights return, the lighthouse keeper is dead at the bottom of the stairs.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "officer",
        "name": "Coast Guard Officer",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Coast%20Guard&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=dreads01&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Authority",
        "desc": "Keeps order during emergencies."
      },
      {
        "id": "investor",
        "name": "Wealthy Investor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Investor&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortWaved&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Funder",
        "desc": "Funding coastal projects."
      },
      {
        "id": "writer",
        "name": "Writer",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Writer&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bun&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Observer",
        "desc": "Observing for a novel."
      },
      {
        "id": "daughter",
        "name": "Caretaker’s Daughter",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Daughter&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=straight01&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Family",
        "desc": "Quiet, distant."
      },
      {
        "id": "sailor",
        "name": "Retired Sailor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Sailor&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortWaved&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Nostalgic Friend",
        "desc": "Friendly, nostalgic."
      }
    ]
  },
  {
    "id": "m9",
    "title": "The Data Center Breach",
    "setting": "In a high-security data center, the lights suddenly fail. For a few seconds, the entire facility is blind. When power returns, a sensitive data drive has vanished.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "engineer",
        "name": "Lead Engineer",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Engineer&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortWaved&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Builder",
        "desc": "Built most of the system."
      },
      {
        "id": "analyst",
        "name": "Cybersecurity Analyst",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Analyst&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=curly&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Suspicious",
        "desc": "Always suspicious."
      },
      {
        "id": "ceo",
        "name": "CEO",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=CEO2&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shavedSides&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Leader",
        "desc": "Confident leader."
      },
      {
        "id": "intern",
        "name": "Intern",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Intern2&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=curly&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Newcomer",
        "desc": "New and eager."
      },
      {
        "id": "guard",
        "name": "Security Guard",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Guard&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=theCaesar&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Watcher",
        "desc": "Monitors cameras."
      },
      {
        "id": "architect",
        "name": "System Architect",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Architect&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortWaved&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Creator",
        "desc": "Designed the entire system."
      }
    ]
  },
  {
    "id": "m10",
    "title": "The Ski Lodge Avalanche Night",
    "setting": "A violent avalanche traps a ski lodge in darkness. Guests panic as snow blocks the exits. When the storm clears, a body is found outside in the snow. What looks like an accident doesn't add up.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "owner",
        "name": "Lodge Owner",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Owner&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortFlat&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Manager",
        "desc": "Runs the lodge."
      },
      {
        "id": "instructor",
        "name": "Ski Instructor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Instructor&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bun&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Athlete",
        "desc": "Confident and skilled."
      },
      {
        "id": "influencer",
        "name": "Influencer",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Influencer&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=straight02&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Creator",
        "desc": "Filming everything."
      },
      {
        "id": "doctor",
        "name": "Doctor",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Doctor2&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortFlat&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Helper",
        "desc": "Calm, helpful."
      },
      {
        "id": "child",
        "name": "Child Guest",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Child&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=curly&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Observer",
        "desc": "Quiet observer."
      },
      {
        "id": "partner",
        "name": "Business Partner",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Partner&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shavedSides&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "The Culprit",
        "desc": "Calm, composed."
      }
    ]
  },
  {
    "id": "m11",
    "title": "The Theater Final Act",
    "setting": "During the final act of a live performance, the stage lights suddenly cut out. When they return, the lead actor collapses in front of a stunned audience.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "director",
        "name": "Director",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Director&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=theCaesar&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=beardLight&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Perfectionist",
        "desc": "Perfectionist leader."
      },
      {
        "id": "understudy",
        "name": "Understudy",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Understudy&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=straight02&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Backup",
        "desc": "Waiting for a chance."
      },
      {
        "id": "stage_manager",
        "name": "Stage Manager",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Stage%20Manager&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortFlat&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Controller",
        "desc": "Controls everything backstage."
      },
      {
        "id": "costar",
        "name": "Co-Star",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Costar&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=straight01&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Rival",
        "desc": "Friendly on surface."
      },
      {
        "id": "critic",
        "name": "Critic",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Critic&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=theCaesar&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Reviewer",
        "desc": "Watching performance."
      },
      {
        "id": "makeup",
        "name": "Makeup Artist",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Makeup&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=straight02&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Behind Scenes",
        "desc": "Works behind the scenes."
      }
    ]
  },
  {
    "id": "m12",
    "title": "The Arctic Research Station",
    "setting": "A blizzard traps a team inside an Arctic research station. Communications fail. A critical research sample goes missing—one that could change global policy.",
    "killerId": "[SECURE]",
    "suspects": [
      {
        "id": "lead",
        "name": "Lead Scientist",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Scientist&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=dreads01&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "In Charge",
        "desc": "In charge of operations."
      },
      {
        "id": "activist",
        "name": "Activist",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Activist&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=bob&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Passionate",
        "desc": "Passionate outsider."
      },
      {
        "id": "agent",
        "name": "Government Agent",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Agent&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shavedSides&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Observer",
        "desc": "Observing the team."
      },
      {
        "id": "eng",
        "name": "Engineer",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Engineer%20Arctic&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shortWaved&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Mechanic",
        "desc": "Keeps systems running."
      },
      {
        "id": "cook",
        "name": "Cook",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Cook&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=shavedSides&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHair=moustacheMagnum&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Friendly",
        "desc": "Friendly cook."
      },
      {
        "id": "junior",
        "name": "Junior Researcher",
        "avatar": "https://api.dicebear.com/9.x/avataaars/svg?seed=Junior&mouth=default,serious,smile&eyes=default,happy,squint&skinColor=ffdbb4,edb98a,d08b5b,ae5d29&top=curly&clothing=blazerAndShirt,shirtCrewNeck,hoodie&facialHairProbability=0&backgroundColor=1c1c24,2c3e50,34495e",
        "role": "Overlooked",
        "desc": "Quiet, overlooked."
      }
    ]
  }
];

// Robust Loading Logic
console.log("🔍 Attempting to load mystery solutions...");

if (process.env.MYSTERIES_DATA) {
    try {
        let rawData = process.env.MYSTERIES_DATA.trim();
        
        // Fix for common Render/Copy-Paste Issues:
        // 1. Remove leading/trailing quotes if the user accidentally wrapped the whole JSON in quotes
        if ((rawData.startsWith('"') && rawData.endsWith('"')) || (rawData.startsWith("'") && rawData.endsWith("'"))) {
            try {
                rawData = JSON.parse(rawData); // Un-escape the string
            } catch (e) {
                rawData = rawData.slice(1, -1); // Brute force strip
            }
        }
        
        // 2. Remove markdown backticks if accidentally included
        rawData = rawData.replace(/```json|```/g, '').trim();

        mysteries = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        console.log(`🔒 Mysteries loaded! Total cases: ${mysteries.length}`);
    } catch (e) {
        console.error("⚠️ Failed to parse MYSTERIES_DATA, using scrubbed fallback:", e.message);
    }
}

const rawPath = path.join(__dirname, 'mysteries_raw.json');
if (mysteries[0].killerId === '[SECURE]' && fs.existsSync(rawPath)) {
    try {
        mysteries = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
        console.log("🔒 Loaded full secrets from local mysteries_raw.json.");
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

// Diagnostic endpoint to check if secrets are loaded correctly (safe to expose, masks keys)
app.get('/api/health-check-secrets', (req, res) => {
    res.json({
        status: mysteries[0] && mysteries[0].killerId !== '[SECURE]' ? 'SECURE_DATA_LOADED' : 'USING_SCRUBBED_FALLBACK',
        caseCount: mysteries.length,
        envVarExists: !!process.env.MYSTERIES_DATA,
        envStart: process.env.MYSTERIES_DATA ? process.env.MYSTERIES_DATA.substring(0, 20) + '...' : 'NONE'
    });
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
6. BE DIRECT AND CLEAR: Do not be overly evasive, vague, or overly philosophical. If asked a direct question about your whereabouts or actions, give a clear, direct answer while staying in character.
7. Respond in ONLY 1 or 2 spoken sentences. Do NOT include actions in asterisks, just the spoken text.
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
