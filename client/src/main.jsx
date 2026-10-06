import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, Check, CheckCircle2, ChevronRight, Clock3, Edit3, Gamepad2, KeyRound, Lock, Menu, Play, Save, Settings, Shield, Skull, Sparkles, User, Volume2, VolumeX, X, Zap } from 'lucide-react';
import './styles.css';

const API=import.meta.env.VITE_API_URL || `${location.protocol}//${location.hostname}:4000/api`;
const GROUPS=[1,2,3,4,5,6];
const STAGE_COUNTS=[1,2,3,5,9];
const STAGE_OFFSETS=[0,1,3,6,11];
const RESTRAINTS=['HANDS','LEGS','WAIST','CHEST','VEST'];

const ASSETS={
  prison:'/assets/prisoner-royal.png',
  fog:'/assets/fort-fog.png',
  courtyard:'/assets/dark-courtyard.png',
  monsterAttack:'/assets/monster-attack.png',
  creatures:'/assets/creatures.png',
  castleArmy:'/assets/castle-army.png',
  darkCorridor:'/assets/dark-corridor.png',
  gateBattle:'/assets/gate-battle.png',
  castleArmy2:'/assets/castle-army-2.png',
  siege:'/assets/siege.png',
  mistCastle:'/assets/mist-castle.png',
  moonGate:'/assets/moon-gate.png',
  prisonHall:'/assets/prison-hall.png',
  fantasyBattle:'/assets/fantasy-battle.png',
  dragon:'/assets/dragon.png'
};

const STAGE_SCENES=[
  {primary:ASSETS.prison,secondary:ASSETS.prisonHall,title:'THE FOG WATCHES',sub:'The royal cell is sealed. Every restraint is still active.'},
  {primary:ASSETS.courtyard,secondary:ASSETS.monsterAttack,title:'INTRUDERS HAVE ENTERED',sub:'Movement outside the cell. The fortress is no longer quiet.'},
  {primary:ASSETS.creatures,secondary:ASSETS.darkCorridor,title:'BEASTS ARE CLOSING IN',sub:'The old halls are waking. Solve faster and keep the gate alive.'},
  {primary:ASSETS.castleArmy,secondary:ASSETS.siege,title:'THE FORT IS UNDER ATTACK',sub:'Enemy forces are at the walls. Five more locks remain in the vault.'},
  {primary:ASSETS.dragon,secondary:ASSETS.fantasyBattle,title:'FINAL BATTLE — SAVE YOUR PRINCE',sub:'The last restraints stand between the team and the escape gate.'}
];

function App(){
  const [path,setPath]=useState(location.pathname);
  useEffect(()=>{const fn=()=>setPath(location.pathname);addEventListener('popstate',fn);return()=>removeEventListener('popstate',fn)},[]);
  return path==='/admin'?<Admin/>:<PlayerApp/>;
}

function PlayerApp(){
  const [intro,setIntro]=useState(false);
  const [team,setTeam]=useState(()=>JSON.parse(localStorage.getItem('sypTeam')||'null'));
  const [screen,setScreen]=useState(team?'home':'login');
  const [sound,setSound]=useState(true);
  const [game,setGame]=useState(null);
  const registerDone=t=>{setTeam(t);localStorage.setItem('sypTeam',JSON.stringify(t));setScreen('pending')};
  const start=async()=>{
    const r=await fetch(`${API}/game/start/${team.id}`,{method:'POST'}); const d=await r.json();
    if(!r.ok)return alert(d.message||'Unable to start mission.');
    const started=Number(d.team?.startedAt||Date.now());
    setTeam(d.team); localStorage.setItem('sypTeam',JSON.stringify(d.team));
    setGame({group:d.group,questions:d.questions,stage:0,qIndex:0,released:0,startedAt:started,prisonerName:d.prisonerName});
    setScreen('game');
  };
  const logout=()=>{localStorage.removeItem('sypTeam');setTeam(null);setGame(null);setScreen('login')};
  if(intro)return <DeveloperIntro onEnter={()=>{sessionStorage.setItem('sypIntroSeen','1');setIntro(false)}}/>;
  if(screen==='login')return <Login onDone={registerDone}/>;
  if(screen==='pending')return <Pending team={team} onBack={logout} onApproved={t=>{setTeam(t);localStorage.setItem('sypTeam',JSON.stringify(t));setScreen('home')}}/>;
  if(screen==='home')return <Home team={team} onStart={start} onLogout={logout} sound={sound} setSound={setSound}/>;
  if(screen==='game')return <Game team={team} game={game} setGame={setGame} sound={sound} setSound={setSound} onFinish={()=>setScreen('result')}/>;
  return <Result team={team} onHome={()=>setScreen('home')}/>;
}

function Footer(){return <div className="creator"><b>ADITYA PRATAP SINGH</b><span>•</span><b>MADE BY ADITYA PRATAP SINGH</b></div>}
function AdminCorner(){return <a className="adminCorner" href="/admin"><Shield size={15}/><span>ADMIN CONTROL</span></a>}

function SceneBackdrop({stage=0,mode='game',cinematic=false}){
  const scene=mode==='game'?STAGE_SCENES[Math.max(0,Math.min(4,stage))]:mode==='home'?{primary:ASSETS.fog,secondary:ASSETS.castleArmy,title:'',sub:''}:mode==='login'?{primary:ASSETS.moonGate,secondary:ASSETS.mistCastle,title:'',sub:''}:mode==='result'?{primary:ASSETS.gateBattle,secondary:ASSETS.fantasyBattle,title:'',sub:''}:{primary:ASSETS.mistCastle,secondary:ASSETS.moonGate,title:'',sub:''};
  return <div className={`sceneBackdrop stage-${stage} ${cinematic?'cinematic':''}`} style={{'--sceneA':`url("${scene.primary}")`,'--sceneB':`url("${scene.secondary}")`}}><div className="sceneA"/><div className="sceneB"/><div className="sceneSkyGlow"/><div className="sceneFog f1"/><div className="sceneFog f2"/><div className="sceneVignette"/><div className="sceneGrain"/><div className="sceneFire"/></div>;
}
function Ambient({stage=0,mode='game',cinematic=false}){return <SceneBackdrop stage={stage} mode={mode} cinematic={cinematic}/>}

function GameButton({children,...props}){return <button className="gameButton" {...props}>{children}</button>}
function GhostButton({children,...props}){return <button className="ghostButton" {...props}>{children}</button>}
function Feature({icon,title,text}){return <div className="feature"><span>{icon}</span><div><b>{title}</b><small>{text}</small></div></div>}

function DeveloperIntro({onEnter}){
 useAdaptiveIndianMusic(true,0,[]);
 return <div className="screen developerIntro"><Ambient mode="login" cinematic/><div className="introVeil"/><div className="introContent"><div className="introSeal">SYP</div><span className="missionTag">AN INDIAN FORTRESS CODING ESCAPE</span><h1>SAVE YOUR<br/><strong>PARTNER</strong></h1><p className="introHindi">एक किला • एक साथी • बीस कोडिंग चुनौतियाँ</p><div className="developerCard"><small>THIS EXPERIENCE IS CREATED BY</small><b>ADITYA PRATAP SINGH</b><span>Biomedical Engineering</span></div><GameButton onClick={onEnter}>ENTER THE FORTRESS <ChevronRight/></GameButton><div className="introNote"><Sparkles size={14}/> CINEMATIC VISUALS • INDIAN INSTRUMENTAL AMBIENCE • LIVE RESCUE</div></div><Footer/></div>
}

function Login({onDone}){
 useAdaptiveIndianMusic(true,0,[]);
 const [form,setForm]=useState({teamName:'',members:[{name:'',phone:'',email:''},{name:'',phone:'',email:''}]});
 const [busy,setBusy]=useState(false);
 const setM=(i,k,v)=>setForm(f=>({...f,members:f.members.map((m,j)=>j===i?{...m,[k]:v}:m)}));
 const submit=async e=>{e.preventDefault();setBusy(true);try{const r=await fetch(`${API}/teams/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw Error(d.message);onDone(d.team)}catch(e){alert(e.message)}finally{setBusy(false)}};
 return <div className="screen loginScreen"><Ambient mode="login"/><AdminCorner/><header className="topBrand"><div className="brandSeal"><Skull/></div><div><b>SAVE YOUR PARTNER</b><small>RAJPUTANA FORTRESS // RESCUE PROTOCOL</small></div></header><main className="loginLayout"><section className="loginHero"><div className="missionTag"><i/> NIGHT WATCH // GATE OPENING</div><h1>ENTER THE<br/><strong>FORTRESS.</strong></h1><p>A cinematic coding escape-room where your teammate is imprisoned inside a royal fort. Admin approves the team, chooses the active coder and assigns a question group.</p><div className="featureGrid"><Feature icon={<Gamepad2/>} title="CINEMATIC ESCAPE" text="Realistic fortress scenes"/><Feature icon={<Zap/>} title="LIVE RESCUE" text="20 coding challenges"/><Feature icon={<Shield/>} title="CONTROLLED ENTRY" text="Admin-approved teams"/></div><div className="heroQuote">“THE GATE OPENS FOR THE TEAM THAT THINKS.”</div><div className="loginCredit"><span>THIS EXPERIENCE IS CREATED BY</span><b>ADITYA PRATAP SINGH</b><small>Biomedical Engineering</small></div><div className="musicBadge"><Volume2 size={15}/> ADAPTIVE INDIAN INSTRUMENTAL <span>•</span> SCENE + SPEED</div></section><form className="registrationCard" onSubmit={submit}><div className="cardRibbon">FORTRESS ENTRY // TEAM REGISTRATION</div><div className="cardTitle"><span>REGISTER TWO MEMBERS</span><KeyRound/></div><label>TEAM NAME<input required value={form.teamName} onChange={e=>setForm({...form,teamName:e.target.value})} placeholder="ENTER TEAM NAME"/></label><div className="membersTitle"><span>TEAM OF TWO</span><small>Admin selects exactly one active coder.</small></div>{form.members.map((m,i)=><div className="memberBox" key={i}><div className="memberHead"><span>MEMBER 0{i+1}</span><User size={15}/></div><input required placeholder="FULL NAME" value={m.name} onChange={e=>setM(i,'name',e.target.value)}/><input required placeholder="PHONE NUMBER" value={m.phone} onChange={e=>setM(i,'phone',e.target.value)}/><input required type="email" placeholder="EMAIL ADDRESS" value={m.email} onChange={e=>setM(i,'email',e.target.value)}/></div>)}<GameButton disabled={busy}>{busy?'OPENING GATE...':'REQUEST ENTRY'} <ChevronRight/></GameButton><div className="securityLine"><Shield size={13}/> YOUR TEAM IS STORED SEPARATELY FROM OTHER TEAMS</div></form></main><Footer/></div>
}

function Pending({team,onBack,onApproved}){
 useAdaptiveIndianMusic(true,0,[]);
 const [status,setStatus]=useState(team.status); const [group,setGroup]=useState(team.questionGroup);
 useEffect(()=>{const t=setInterval(async()=>{const r=await fetch(`${API}/teams/${team.id}`);if(r.ok){const d=await r.json();setStatus(d.status);setGroup(d.questionGroup);if(d.status==='approved')onApproved(d)}},1800);return()=>clearInterval(t)},[team.id]);
 return <div className="screen pendingScreen"><Ambient mode="login"/><AdminCorner/><div className="securityDoor"><div className="doorHeader"><span><i/> CONTROL ROOM SIGNAL</span><b>{team.code}</b></div><div className="doorCenter"><div className="doorSymbol">{status==='approved'?<CheckCircle2/>:<Lock/>}</div><span className="missionTag">{status==='approved'?'ACCESS GRANTED':'AUTHORIZATION PENDING'}</span><h1>{status==='approved'?'THE CELL IS OPEN':'WAIT FOR THE SIGNAL'}</h1><p>{status==='approved'?`Active player: ${team.members[team.playableMemberIndex??0]?.name}. Group ${Number(group||1)} assigned.`:'Your team is waiting for the control room. The admin must approve the team, choose the active coder and assign a question group.'}</p><div className="signalBars"><i/><i/><i/><i/><i/><i/><i/></div>{status==='approved'&&<div className="approvedSeal"><CheckCircle2/> PLAYER CLEARED</div>}</div><GhostButton onClick={onBack}>ABORT SESSION</GhostButton></div><Footer/></div>
}

function Home({team,onStart,onLogout,sound,setSound}){
 useAdaptiveIndianMusic(sound,0,[]);
 const [demo,setDemo]=useState(false); const [menu,setMenu]=useState(false); const player=team.members[team.playableMemberIndex??0]?.name; const prisoner=team.members[team.playableMemberIndex===0?1:0]?.name||'THE PRINCE';
 return <div className="screen fortressHome"><Ambient mode="home"/><header className="gameTopbar"><div className="brandMini"><Skull/><span>SYP</span></div><div className="topMission"><span>ROYAL FORTRESS</span><b>RESCUE PROTOCOL</b></div><div className="topPlayer"><User size={15}/><b>{player}</b><span>{team.code}</span><button onClick={()=>setMenu(true)}><Menu/></button></div></header><main className="homeCommand"><section className="homeTitle"><div className="missionTag"><i/> GATE OPEN // TEAM CLEARED</div><h1>SAVE<br/><strong>YOUR PARTNER</strong></h1><p>Your teammate <b>{prisoner}</b> is imprisoned in the royal cell. Solve the coding challenges, release every restraint and reach the final fortress gate.</p><div className="homeButtons"><GameButton onClick={onStart}><Play fill="currentColor"/> ENTER THE LOCKROOM</GameButton><GhostButton onClick={()=>setDemo(true)}>WATCH 30 SEC DEMO</GhostButton></div><div className="homeStats"><div><b>05</b><span>STAGES</span></div><div><b>20</b><span>QUESTIONS</span></div><div><b>01</b><span>ACTIVE CODER</span></div></div><div className="homeMusic"><Volume2 size={16}/><span>ADAPTIVE INDIAN INSTRUMENTAL</span><small>Tanpura • Sitar • Tabla-inspired pulse</small></div></section><section className="cellPreview"><div className="cellFrame"><div className="cellLabel"><span><i/> ROYAL CELL // LIVE SCENE</span><b>CAM-01</b></div><div className="prisonImage"><img src={ASSETS.prison} alt="Royal prisoner in fortress cell"/><div className="prisonImageGlow"/><div className="ropeReleasePreview"><i/><i/><i/><i/><i/></div><div className="prisonNameOverlay">{prisoner}<small>ROYAL PRISONER // RESTRAINTS 05/05</small></div></div><div className="cellCaption"><span>THE OTHER TEAM MEMBER IS THE PRISONER</span><b>ALL RESTRAINTS ACTIVE</b></div></div><div className="warningTape">⚔ WARNING // THE FORTRESS IS UNDER LOCKDOWN ⚔</div></section></main>{demo&&<Demo onClose={()=>setDemo(false)}/>} {menu&&<HomeMenu team={team} onClose={()=>setMenu(false)} onLogout={onLogout} sound={sound} setSound={setSound}/>}<Footer/></div>
}

function Demo({onClose}){const [s,setS]=useState(30);useEffect(()=>{const t=setInterval(()=>setS(v=>v<=1?30:v-1),1000);return()=>clearInterval(t)},[]);return <div className="modalShade"><div className="cinematicModal"><button className="closeButton" onClick={onClose}><X/></button><div className="demoCell"><img src={ASSETS.prison} alt="Royal prison scene"/><div className="demoShade"/><div className="demoTimer">00:{String(s).padStart(2,'0')}</div><div className="demoOverlay">ROYAL CELL // RESCUE SIMULATION</div></div><span className="missionTag">30 SECOND BRIEFING</span><h2>LEARN THE RESCUE.</h2><p>Correct answer → <b>YUP!</b> → restraint releases. Wrong answer → police siren → retry. The soundtrack intensifies with your solving pace.</p><div className="demoSteps"><span>01 SOLVE</span><span>02 YUP!</span><span>03 UNLOCK</span><span>04 ESCAPE</span></div><GameButton onClick={onClose}>ENTER WHEN READY <Play/></GameButton></div></div>}
function HomeMenu({team,onClose,onLogout,sound,setSound}){return <div className="modalShade"><div className="controlModal"><button className="closeButton" onClick={onClose}><X/></button><span className="missionTag">FORTRESS CONTROL</span><h2>GAME SETTINGS</h2><div className="settingLine"><span><Volume2/> ADAPTIVE MUSIC</span><button onClick={()=>setSound(!sound)}>{sound?'ON':'OFF'}</button></div><div className="settingLine"><span><Sparkles/> CINEMATIC EFFECTS</span><b>HIGH</b></div><div className="settingLine"><span><Clock3/> LIVE TIMER</span><b>ON</b></div><p className="tiny">TEAM {team.code} // PLAYER {team.members[team.playableMemberIndex??0]?.name}</p><GhostButton onClick={onLogout}>EXIT FORTRESS</GhostButton></div></div>}

function Game({team,game,setGame,sound,setSound,onFinish}){
 const [answer,setAnswer]=useState(''); const [feedback,setFeedback]=useState(''); const [locked,setLocked]=useState(false); const [time,setTime]=useState(0); const [shake,setShake]=useState(false); const [settings,setSettings]=useState(false); const [recentSolves,setRecentSolves]=useState([]);
 const stage=game.stage, qi=game.qIndex, stageCount=STAGE_COUNTS[stage], absoluteIndex=STAGE_OFFSETS[stage]+qi, current=game.questions[absoluteIndex];
 useAdaptiveIndianMusic(sound,stage,recentSolves);
 useEffect(()=>{const t=setInterval(()=>setTime(Math.floor((Date.now()-game.startedAt)/1000)),1000);return()=>clearInterval(t)},[game.startedAt]);
 const submit=()=>{
   if(locked)return;
   if(!answer.trim()){setFeedback('ENTER YOUR CODE');playSiren(sound);setShake(true);setTimeout(()=>setShake(false),500);return;}
   const correct=normalize(answer)===normalize(current.answer);
   if(!correct){setFeedback('ACCESS DENIED // POLICE SIREN');playSiren(sound);setShake(true);setTimeout(()=>setShake(false),650);return;}
   const now=Date.now();setRecentSolves(v=>[...v,now].slice(-5));
   setLocked(true); setFeedback(stage===4&&qi===stageCount-1?'VEST UNLOCKED // FINAL GATE':'RESTRAINT UNLOCKED'); playUnlock(sound,stage); playYup(sound);
   setTimeout(()=>{
     const next=qi+1;
     if(next<stageCount){setGame(g=>({...g,qIndex:next}));setAnswer('');setFeedback('');setLocked(false);return;}
     if(stage<4){speak(sound,'ATTACK!',.82,.7);setGame(g=>({...g,stage:stage+1,qIndex:0,released:stage+1}));setAnswer('');setFeedback('');setLocked(false);return;}
     fetch(`${API}/game/complete/${team.id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({time:Math.floor((Date.now()-game.startedAt)/1000)})}); speak(sound,'WE WIN THE FORT!',.78,1.0); onFinish();
   },1000);
 };
 return <div className={`screen lockroomScreen ${shake?'shake':''}`}><Ambient stage={stage}/><header className="gameTopbar lockbar"><div className="brandMini"><Skull/><span>SYP</span></div><div className="lockMission"><span>ROYAL LOCKROOM</span><b>GROUP {game.group} // STAGE {stage+1}/5</b></div><div className="timerBox"><Clock3/><b>{formatTime(time)}</b><button onClick={()=>setSound(!sound)}>{sound?<Volume2/>:<VolumeX/>}</button><button onClick={()=>setSettings(true)}><Settings/></button></div></header><main className="lockroom"><div className="stageStory"><span>FORTRESS THREAT LEVEL {stage+1}</span><b>{STAGE_SCENES[stage].title}</b><small>{STAGE_SCENES[stage].sub}</small></div><section className="prisonPanel"><div className="panelTop"><span><i/> ROYAL CELL // SUBJECT CAMERA</span><b>{game.prisonerName||'PRINCE'} // LIVE</b></div><div className="prisonSceneReal"><img src={ASSETS.prison} alt="Royal prisoner tied to chair"/><div className="sceneImageDark"/><div className="prisonerSpot"><PrisonerAvatar released={game.released} princeName={game.prisonerName||'PRINCE'}/></div><div className="releaseFlash" key={`${game.stage}-${game.released}`}/><div className="cameraStamp">CAM-01 / REC</div></div><div className="restraintStatus"><div className="statusHead"><span>RESTRAINT STATUS</span><b>{game.released}/5 RELEASED</b></div><div className="restraintList">{RESTRAINTS.map((r,i)=><div className={i<game.released?'released':''} key={r}><span>{String(i+1).padStart(2,'0')}</span><b>{r}</b><i>{i<game.released?'OPEN':'LOCKED'}</i></div>)}</div></div></section><section className="challengePanel"><div className="challengeHeader"><div><span className="missionTag">CODING CHALLENGE</span><h2>{current.type==='debug'?'REPAIR THE CODE':'WRITE THE CODE'}</h2></div><div className="stageCounter">{qi+1}<small>/ {stageCount}</small></div></div><div className="questionCard"><div className="questionNo">CHALLENGE {String(absoluteIndex+1).padStart(2,'0')} // STAGE {stage+1}</div><h3>{current.question}</h3>{current.code&&<pre>{current.code}</pre>}<textarea value={answer} disabled={locked} onChange={e=>setAnswer(e.target.value)} placeholder={current.type==='debug'?'ENTER THE FIX / MISSING CODE':'WRITE YOUR SIMPLE CODE HERE'}/><div className="answerHint">{current.hint||'Beginner coding only. Keep the answer simple.'}</div></div><div className={`feedback ${feedback.startsWith('ACCESS')?'bad':'good'}`}>{feedback||'THE LOCKROOM IS LISTENING...'}</div><GameButton disabled={locked} onClick={submit}>{locked?'UNLOCKING...':'SUBMIT CODE'} <Zap fill="currentColor"/></GameButton><div className="stageProgress">{STAGE_COUNTS.map((_,i)=><div key={i} className={i<stage?'done':i===stage?'now':''}><span>STAGE {i+1}</span><i/></div>)}</div></section></main>{settings&&<HomeMenu team={team} onClose={()=>setSettings(false)} onLogout={()=>{}} sound={sound} setSound={setSound}/>}<Footer/></div>
}

function PrisonerAvatar({released=0,large=false,princeName='PRINCE'}){return <div className={`prisoner prince ${large?'large':''}`}><div className="spotlight"/><div className="head"><div className="crown">♛</div><div className="hair"/><div className="face"><i/><i/><b/></div><div className="earring e1"/><div className="earring e2"/></div><div className="neck"><span className="necklace">◆</span></div><div className="body"><div className="royalCoat"><span>ROYAL PRISONER</span><i/><i/></div><div className={`rope hands ${released>=1?'gone':''}`}><i/><i/></div><div className={`rope waist ${released>=3?'gone':''}`}/><div className={`rope chest ${released>=4?'gone':''}`}/><div className={`arm leftArm ${released>=1?'free':''}`}/><div className={`arm rightArm ${released>=1?'free':''}`}/></div><div className={`leg leftLeg ${released>=2?'free':''}`}/><div className={`leg rightLeg ${released>=2?'free':''}`}/><div className="royalBoot bootL"/><div className="royalBoot bootR"/><div className={`rope vest ${released>=5?'gone':''}`}/><div className="chair"><div className="chairBack"/><div className="chairSeat"/></div><div className="avatarGlow"/><div className="princeName">{princeName}</div></div>}

function Result({team,onHome}){const [result,setResult]=useState(null);useEffect(()=>{speak(true,'WE WIN THE FORT!',.78,1.0);fetch(`${API}/teams/${team.id}/result`).then(r=>r.json()).then(setResult)},[team.id]);return <div className="screen resultScreen"><Ambient mode="result" stage={4}/><div className="resultCard glassBreak"><div className="glassShards">{Array.from({length:8}).map((_,i)=><i key={i}/>)}</div><div className="partyBurst">{Array.from({length:14}).map((_,i)=><i key={i}/>)}</div><div className="escapeMark"><CheckCircle2/></div><span className="missionTag">FINAL GATE // SHATTERED</span><h1><span>RUN &amp; SAVE</span><strong>YOUR PRINCE</strong></h1><p>Team <b>{team.teamName}</b> released every restraint. <strong>THE FORT IS YOURS.</strong></p><div className="finalTime"><Clock3/> {result?.time!=null?formatTime(result.time):'--:--'}</div><div className="resultStats"><span>PLAYER <b>{result?.player||team.members[team.playableMemberIndex??0]?.name}</b></span><span>GROUP <b>{team.questionGroup||1}</b></span><span>LOCKS <b>5/5</b></span></div><GameButton onClick={onHome}>RETURN TO BASE <ChevronRight/></GameButton></div><Footer/></div>}

function Admin(){
 const [authed,setAuthed]=useState(false); const [key,setKey]=useState(''); const [teams,setTeams]=useState([]); const [groups,setGroups]=useState([]); const [tab,setTab]=useState('teams'); const [selected,setSelected]=useState(null); const [group,setGroup]=useState(0); const [selectedQuestion,setSelectedQuestion]=useState(0); const [draft,setDraft]=useState(null); const [isEditing,setIsEditing]=useState(false); const [loading,setLoading]=useState(false); const [savingQuestion,setSavingQuestion]=useState(false); const [saveMessage,setSaveMessage]=useState(''); const [dirty,setDirty]=useState(false);
 const authHeaders={'x-admin-key':key,'Content-Type':'application/json'};
 const load=async()=>{setLoading(true);try{const [tr,qr]=await Promise.all([fetch(`${API}/admin/teams`,{headers:authHeaders}),fetch(`${API}/admin/questions`,{headers:authHeaders})]);if(!tr.ok||!qr.ok){setAuthed(false);throw Error('Invalid admin password.')}const t=await tr.json(),q=await qr.json();setTeams(t);setGroups(q);if(selected){const fresh=t.find(x=>x.id===selected.id);if(fresh)setSelected(fresh)}}catch(e){if(authed)alert(e.message)}finally{setLoading(false)}};
 useEffect(()=>{if(authed)load()},[authed]);
 const login=async()=>{if(!key.trim())return;try{const r=await fetch(`${API}/admin/teams`,{headers:{'x-admin-key':key}});if(!r.ok)throw Error('Invalid admin password.');setAuthed(true)}catch(e){alert(e.message)}};
 const chooseGroup=(gi)=>{if(dirty&&!window.confirm('You have unsaved changes. Switch group and discard them?'))return;setGroup(gi);setSelectedQuestion(0);setDraft(groups[gi]?.[0]?{...groups[gi][0]}:null);setIsEditing(false);setDirty(false);setSaveMessage('')};
 const chooseQuestion=(qi)=>{if(dirty&&!window.confirm('You have unsaved changes. Switch question and discard them?'))return;const q=groups[group]?.[qi];if(!q)return;setSelectedQuestion(qi);setDraft({...q});setIsEditing(false);setDirty(false);setSaveMessage('')};
 const beginEdit=()=>{if(draft)setIsEditing(true);setSaveMessage('')};
 const cancelEdit=()=>{const q=groups[group]?.[selectedQuestion];setDraft(q?{...q}:null);setIsEditing(false);setDirty(false);setSaveMessage('Edit cancelled')};
 const updateDraft=(patch)=>{setDraft(d=>({...d,...patch}));setDirty(true);setSaveMessage('Unsaved changes')};
 const saveQuestion=async()=>{if(!draft||savingQuestion||!dirty)return;setSavingQuestion(true);setSaveMessage('Saving...');try{const r=await fetch(`${API}/admin/questions/${group}/${selectedQuestion}`,{method:'PUT',headers:authHeaders,body:JSON.stringify(draft)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.message||'Could not save question.');setGroups(gs=>gs.map((g,i)=>i===group?g.map((x,j)=>j===selectedQuestion?data:x):g));setDraft({...data});setDirty(false);setIsEditing(false);setSaveMessage('✓ QUESTION SAVED — SERVER UPDATED');}catch(e){setSaveMessage(`✕ ${e.message}`)}finally{setSavingQuestion(false)}};
 if(!authed)return <div className="screen adminGateScreen"><Ambient mode="login"/><div className="adminGateCard"><div className="gateLogo"><Shield/></div><span className="missionTag">ROYAL FORTRESS // CONTROL ROOM</span><h1>ADMIN<br/><strong>COMMAND.</strong></h1><p>Approve teams, select the active coder, assign a question group and edit every coding question and answer.</p><input autoFocus type="password" value={key} onChange={e=>setKey(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="ENTER ADMIN PASSWORD"/><GameButton onClick={login}>ENTER COMMAND <KeyRound/></GameButton><small>Authorized control room</small><a href="/">← Return to player entrance</a></div><Footer/></div>;
 return <div className="adminScreen"><div className="adminCreator"><b>ADITYA PRATAP SINGH</b><span>•</span><b>MADE BY ADITYA PRATAP SINGH</b></div><header className="adminTop"><div className="brandMini"><Shield/><span>CONTROL ROOM</span></div><div className="adminTitle"><span>ROYAL FORTRESS</span><b>ADITYA PRATAP SINGH // GAME COMMAND</b></div><div className="liveAdmin"><i/> LIVE</div></header><nav className="adminNav"><button className={tab==='teams'?'active':''} onClick={()=>setTab('teams')}>TEAMS</button><button className={tab==='questions'?'active':''} onClick={()=>setTab('questions')}>QUESTION VAULT</button><button onClick={load}>{loading?'SYNCING...':'REFRESH'}</button><a href="/">PLAYER SITE</a></nav>{tab==='teams'?<AdminTeams teams={teams} selected={selected} setSelected={setSelected} keyValue={key} reload={load}/>:<QuestionVault groups={groups} group={group} selectedQuestion={selectedQuestion} draft={draft} isEditing={isEditing} chooseGroup={chooseGroup} chooseQuestion={chooseQuestion} beginEdit={beginEdit} cancelEdit={cancelEdit} saveQuestion={saveQuestion} updateDraft={updateDraft} savingQuestion={savingQuestion} saveMessage={saveMessage} dirty={dirty}/>}<Footer/></div>
}
function AdminTeams({teams,selected,setSelected,keyValue,reload}){
 const [player,setPlayer]=useState(0);const [group,setGroup]=useState(1);
 useEffect(()=>{if(selected){setPlayer(selected.playableMemberIndex??0);setGroup(Number(selected.questionGroup||1))}},[selected]);
 const approve=async()=>{if(!selected)return;const r=await fetch(`${API}/admin/teams/${selected.id}/approve`,{method:'POST',headers:{'x-admin-key':keyValue,'Content-Type':'application/json'},body:JSON.stringify({playableMemberIndex:player,questionGroup:group})});if(!r.ok)alert('Could not approve team.');else reload()};
 const sorted=teams.slice().sort((a,b)=>{const ta=a.result?.time;const tb=b.result?.time;if(ta==null&&tb==null)return new Date(a.createdAt)-new Date(b.createdAt);if(ta==null)return 1;if(tb==null)return -1;return ta-tb});
 return <main className="adminBody"><div className="commandHeading"><div><span className="missionTag">LIVE FORTRESS MONITOR</span><h1>TEAM COMMAND</h1><p>Unlimited team registrations. Each team has its own player, group, session timer and result.</p></div><div className="kpis"><span><b>{teams.length}</b> TEAMS</span><span><b>{teams.filter(t=>t.status==='pending').length}</b> WAITING</span><span><b>{teams.filter(t=>t.status==='approved').length}</b> ACTIVE</span><span><b>{teams.filter(t=>t.status==='finished').length}</b> FINISHED</span></div></div><div className="teamCommand"><section className="darkPanel teamQueue"><div className="panelHeader"><span>INCOMING TEAMS</span><small>FASTEST FINISH FIRST</small></div>{sorted.length===0?<div className="empty"><Skull/> NO TEAMS YET</div>:sorted.map((t,rank)=><button key={t.id} className={`teamRow ${selected?.id===t.id?'selected':''}`} onClick={()=>setSelected(t)}><div><b>{t.status==='finished'?`#${rank+1} `:''}{t.teamName}</b><small>{t.code} // 2 MEMBERS {t.result?.time!=null?` // ${formatTime(t.result.time)}`:''}</small></div><em className={t.status}>{t.status}</em></button>)}</section><section className="darkPanel commandPanel">{selected?<><div className="selectedHeader"><div><span className="missionTag">SELECTED TEAM</span><h2>{selected.teamName}</h2><small>{selected.code} // created {new Date(selected.createdAt).toLocaleTimeString()}</small></div><em className={selected.status}>{selected.status}</em></div><div className="choiceBlock"><span className="sectionLabel">01 // ACTIVE PLAYER — THE OTHER MEMBER BECOMES THE PRISONER</span>{selected.members.map((m,i)=><button key={m.email} className={`playerRow ${player===i?'chosen':''}`} onClick={()=>setPlayer(i)}><span>0{i+1}</span><div><b>{m.name}</b><small>{m.phone} · {m.email}</small></div>{player===i&&<CheckCircle2/>}</button>)}</div><div className="choiceBlock"><span className="sectionLabel">02 // QUESTION GROUP</span><div className="groupSelector">{GROUPS.map(n=><button key={n} className={group===n?'chosen':''} onClick={()=>setGroup(n)}><b>GROUP {n}</b><small>20 QUESTIONS</small></button>)}</div><p className="choiceExplain">Groups are <b>not difficulty levels</b>. Stages use Q1, Q2–Q3, Q4–Q6, Q7–Q11 and Q12–Q20.</p></div><GameButton onClick={approve}>{selected.status==='approved'?'SAVE MISSION SETTINGS':'APPROVE & LAUNCH TEAM'} <Shield/></GameButton>{selected.result&&<div className="finishBanner"><Check/> FINISHED IN <b>{formatTime(selected.result.time)}</b> // PLAYER {selected.result.player}</div>}</>:<div className="emptyState"><Skull/><h2>SELECT A TEAM</h2><p>Approve one player and one question group. Other teams can continue running on their own systems at the same time.</p></div>}</section></div></main>
}

function QuestionVault({groups,group,selectedQuestion,draft,isEditing,chooseGroup,chooseQuestion,beginEdit,cancelEdit,saveQuestion,updateDraft,savingQuestion,saveMessage,dirty}){
 const q=draft; const total=groups[group]?.length||0;
 return <main className="adminBody"><div className="commandHeading"><div><span className="missionTag">EDITABLE CONTENT SYSTEM</span><h1>QUESTION VAULT</h1><p>Select a question to view it. Press EDIT QUESTION only when you want to change it.</p></div><span className="vaultBadge"><Edit3/> DEBUG + WRITE CODE ONLY</span></div>
 <div className="vaultLayout"><aside className="darkPanel groupRail"><div className="panelHeader"><span>MISSION GROUPS</span><small>NOT DIFFICULTY</small></div>{GROUPS.map(n=><button key={n} className={group===n-1?'active':''} onClick={()=>chooseGroup(n-1)}><b>GROUP {n}</b><span>20 QUESTIONS</span></button>)}</aside>
 <section className="darkPanel editorPanel"><div className="editorTop"><div><span className="missionTag">GROUP {group+1}</span><h2>MISSION QUESTION BANK</h2><small>Stage order: Q1 → Q2–Q3 → Q4–Q6 → Q7–Q11 → Q12–Q20</small></div><b>{total}/20</b></div>
 <div className="qTabs">{Array.from({length:Math.max(20,total)},(_,i)=>{const exists=!!groups[group]?.[i];return <button disabled={!exists} className={i===selectedQuestion?'active':''} key={groups[group]?.[i]?.id||i} onClick={()=>chooseQuestion(i)}>Q{i+1}</button>})}</div>
 {!q?<div className="empty"><Skull/> NO QUESTIONS IN THIS GROUP</div>:<div className="editorForm"><div className="editorIdentity"><div><span>{isEditing?'EDITING':'VIEWING'}</span><b>GROUP {group+1} // QUESTION {selectedQuestion+1}</b></div><div className={dirty?'unsavedState':'savedState'}>{saveMessage||'Question is synchronized with the server.'}</div></div>
 {!isEditing?<div className="questionPreview"><div className="previewBlock"><span>TYPE</span><b>{q.type==='debug'?'DEBUGGING':'WRITE CODE'}</b></div><label>QUESTION<div className="previewText">{q.question||'—'}</div></label><label>CODE SHOWN TO PLAYER<pre className="previewCode">{q.code||'—'}</pre></label><label>EXPECTED ANSWER / FIX<div className="previewText">{q.answer||'—'}</div></label><label>HINT<div className="previewText">{q.hint||'—'}</div></label><div className="saveRow"><GameButton onClick={beginEdit}><Edit3/> EDIT QUESTION</GameButton><span>Viewing only. No changes are made until you press Edit.</span></div></div>
 :<><div className="formGrid"><label>TYPE<select value={q.type||'debug'} onChange={e=>updateDraft({type:e.target.value})}><option value="debug">DEBUGGING</option><option value="code">WRITE CODE</option></select></label><label>EXPECTED ANSWER / FIX<input value={q.answer||''} onChange={e=>updateDraft({answer:e.target.value})}/></label></div><label>QUESTION<textarea value={q.question||''} onChange={e=>updateDraft({question:e.target.value})}/></label><label>CODE SHOWN TO PLAYER<textarea className="codeEditor" value={q.code||''} onChange={e=>updateDraft({code:e.target.value})}/></label><label>HINT<textarea value={q.hint||''} onChange={e=>updateDraft({hint:e.target.value})}/></label><div className="saveRow"><GameButton disabled={savingQuestion||!dirty} onClick={saveQuestion}><Save/> {savingQuestion?'SAVING...':'SAVE QUESTION'}</GameButton><GameButton onClick={cancelEdit}>CANCEL</GameButton><span>{dirty?'Changes are not saved yet.':'Make a change before saving.'}</span></div></>}
 </div>}</section></div></main>
}
function useAdaptiveIndianMusic(enabled,stage,solveTimes){
 const stateRef=useRef({stage:0,solves:[]});
 useEffect(()=>{stateRef.current={stage,solves:solveTimes};},[stage,solveTimes]);
 useEffect(()=>{
   if(!enabled)return;
   let ctx=null,master=null,droneGain=null,droneA=null,droneB=null,loop=null,started=false,stopped=false;
   const start=async()=>{
     if(started||stopped)return; started=true;
     try{
       const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
       ctx=new AC(); if(ctx.state==='suspended')await ctx.resume();
       master=ctx.createGain(); master.gain.value=.085; master.connect(ctx.destination);
       const compressor=ctx.createDynamicsCompressor(); compressor.threshold.value=-28; compressor.knee.value=18; compressor.ratio.value=5; compressor.attack.value=.01; compressor.release.value=.25; master.disconnect(); master.connect(compressor); compressor.connect(ctx.destination);
       droneGain=ctx.createGain();droneGain.gain.value=.22;droneGain.connect(master);
       droneA=ctx.createOscillator();droneB=ctx.createOscillator();
       droneA.type='sine';droneB.type='triangle';droneA.frequency.value=146.83;droneB.frequency.value=220;
       droneA.connect(droneGain);droneB.connect(droneGain);droneA.start();droneB.start();
       const pulse=()=>{
         if(stopped||!ctx)return;
         const st=stateRef.current.stage; const solves=stateRef.current.solves||[];
         const recent=solves.length?Math.max(0,Math.min(1,1-((Date.now()-solves[solves.length-1])/9000))):0;
         const intensity=Math.min(1,.35+st*.12+recent*.38);
         playIndianInstrumentPhrase(ctx,master,st,intensity);
       };
       pulse(); loop=setInterval(pulse,Math.max(700,1500-stateRef.current.stage*130));
     }catch(e){/* audio is optional */}
   };
   const begin=()=>start();
   window.addEventListener('pointerdown',begin,{once:true});
   window.addEventListener('keydown',begin,{once:true});
   return()=>{stopped=true;window.removeEventListener('pointerdown',begin);window.removeEventListener('keydown',begin);if(loop)clearInterval(loop);try{droneA?.stop();droneB?.stop();ctx?.close()}catch{} };
 },[enabled]);
}
function playIndianInstrumentPhrase(ctx,master,stage,intensity){
 if(!ctx||ctx.state==='closed')return;
 const now=ctx.currentTime;
 const scales=[261.63,293.66,329.63,392.00,440.00,523.25];
 const root=scales[(stage*2)%scales.length];
 const note=(freq,when,dur,gain,type='triangle')=>{
   const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=type;o.frequency.setValueAtTime(freq,when);f.type='lowpass';f.frequency.setValueAtTime(stage>=3?1700:2400,when);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.002,gain*intensity),when+.018);g.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(f);f.connect(g);g.connect(master);o.start(when);o.stop(when+dur+.03);
 };
 // Sitar-like plucked phrase
 [1,1.125,1.25,1.5,1.333].forEach((m,i)=>note(root*m,now+i*.16,.42,.095,'triangle'));
 // Soft tabla-like pulse
 const drum=ctx.createOscillator(),dg=ctx.createGain();drum.type='sine';drum.frequency.setValueAtTime(120,now);drum.frequency.exponentialRampToValueAtTime(58,now+.12);dg.gain.setValueAtTime(.0001,now);dg.gain.exponentialRampToValueAtTime(.12*intensity,now+.008);dg.gain.exponentialRampToValueAtTime(.0001,now+.18);drum.connect(dg);dg.connect(master);drum.start(now);drum.stop(now+.2);
 // Bell/temple shimmer at higher stages
 if(stage>=2)note(root*2,now+.48,.7,.045,'sine');
 // Faster heartbeat-like percussion as the player gets closer to the end
 if(stage>=3){const d=ctx.createOscillator(),g=ctx.createGain();d.type='sine';d.frequency.value=72;g.gain.setValueAtTime(.0001,now+.62);g.gain.exponentialRampToValueAtTime(.08*intensity,now+.63);g.gain.exponentialRampToValueAtTime(.0001,now+.82);d.connect(g);g.connect(master);d.start(now+.62);d.stop(now+.84);}
}
function playUnlock(enabled,stage){if(!enabled)return;try{const c=new AudioContext();const seq=stage===4?[420,620,920,1180]:[520,760,960];seq.forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.14,c.currentTime+i*.1);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+i*.1+.25);o.connect(g);g.connect(c.destination);o.start(c.currentTime+i*.1);o.stop(c.currentTime+i*.1+.27)});setTimeout(()=>c.close(),850)}catch{}}
function speak(enabled,text,rate=.9,pitch=.85){if(!enabled||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=rate;u.pitch=pitch;u.volume=1;speechSynthesis.speak(u)}catch{}}
function playYup(enabled){if(!enabled)return;try{const c=new AudioContext();const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.value=880;g.gain.setValueAtTime(.22,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.24);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.25);setTimeout(()=>c.close(),350)}catch{} speak(enabled,'YUP!',1.15,1.1)}
function playSiren(enabled){if(!enabled)return;try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.type='sawtooth';g.gain.value=.11;o.connect(g);g.connect(c.destination);o.frequency.setValueAtTime(620,c.currentTime);o.frequency.linearRampToValueAtTime(280,c.currentTime+.28);o.frequency.linearRampToValueAtTime(620,c.currentTime+.56);o.frequency.linearRampToValueAtTime(280,c.currentTime+.84);o.start();o.stop(c.currentTime+.9);setTimeout(()=>c.close(),1000)}catch{}}
function normalize(v){return String(v||'').replace(/\r/g,'').trim().replace(/\s+/g,' ').toLowerCase()}
function formatTime(s){return `${String(Math.floor(Number(s)/60)).padStart(2,'0')}:${String(Number(s)%60).padStart(2,'0')}`}

createRoot(document.getElementById('root')).render(<App/>);
