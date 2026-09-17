/* ================================================================
   app.js — "הזמר במסכה", גרסה עצמאית לפריסה מחוץ ל-Claude.
   ------------------------------------------------------------------
   זהו פורט 1:1 של הלוגיקה שנבנתה ונבדקה ב-Claude Artifact (app.html),
   עם כמה שינויים מכוונים:

     1) getDb() קורא עכשיו ל-window.MSDB (המתאם ל-Firestore האמיתי,
        ראו db-adapter.js) במקום ל-window.claude.db.
     2) SONGS / CANDIDATES / ADMIN_PIN / EVENT_NAME נטענים מ-
        window.MS_CONFIG (config.js) במקום מוגדרים כאן inline —
        וכן נוספה avatarHTML() שמציגה תמונת photo אמיתית כשהיא קיימת
        במקום האווטאר המצויר (makeFaceSVG), כדי לאפשר להחליף בקלות
        שמות ותמונות של העובדים בלי לגעת בקוד הזה.
     3) candidatesForSong() — כל שיר יכול (ברשות) להציג לקהל רשימת
        מועמדים משלו במקום את כל ה-20 המשותפים, לפי שדה
        song.candidates ב-config.js (ראו ההסבר שם). ברירת המחדל,
        כשלא הוגדר, זהה בדיוק להתנהגות הקודמת — כל 20 לכל שיר.

   כל שאר ה-HTML, ה-state machine, חישוב סדר החשיפה לפי אחוז הזיהוי,
   וטיברייק המהירות בדירוגים — זהים לחלוטין למה שנבדק ואושר.
   ================================================================ */
(function(){
"use strict";

/* ===================== CONFIG (מ-config.js) ===================== */

var SONGS = window.MS_CONFIG.SONGS;
var CANDIDATES = window.MS_CONFIG.CANDIDATES;
var ADMIN_PIN = window.MS_CONFIG.ADMIN_PIN;
var EVENT_NAME = window.MS_CONFIG.EVENT_NAME;

/* ===================== HELPERS ===================== */

function h(str){
  return String(str).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
  });
}
function songById(id){ for(var i=0;i<SONGS.length;i++) if(SONGS[i].id===id) return SONGS[i]; return null; }
function candByN(n){ for(var i=0;i<CANDIDATES.length;i++) if(CANDIDATES[i].n===n) return CANDIDATES[i]; return null; }

/* מחזירה את רשימת המועמדים שיוצגו לקהל עבור שיר נתון: אם לשיר יש
   מערך song.candidates (רשימת מספרי n מתוך config.js) — מציגים רק
   אותם; אחרת (ברירת מחדל) מציגים את כל 20 המועמדים, בדיוק כמו קודם. */
function candidatesForSong(song){
  if(song && Array.isArray(song.candidates) && song.candidates.length){
    var list = song.candidates.map(candByN).filter(Boolean);
    if(list.length) return list;
  }
  return CANDIDATES;
}

function makeFaceSVG(c, size){
  var faceCy = 33, parts = [];
  if(c.hair_style === "full"){ parts.push('<circle cx="32" cy="26" r="31" fill="'+c.hair_color+'"/>'); faceCy = 37; }
  else if(c.hair_style === "buzz"){ parts.push('<circle cx="32" cy="30" r="31.5" fill="'+c.hair_color+'" opacity="0.9"/>'); faceCy = 34; }
  parts.push('<circle cx="32" cy="'+faceCy+'" r="29" fill="'+c.skin+'"/>');
  var ey = faceCy - 4;
  parts.push('<path d="M17 '+(ey-5)+' q5 -3 10 0" stroke="#00000055" stroke-width="2" fill="none" stroke-linecap="round"/>');
  parts.push('<path d="M37 '+(ey-5)+' q5 -3 10 0" stroke="#00000055" stroke-width="2" fill="none" stroke-linecap="round"/>');
  parts.push('<circle cx="22" cy="'+ey+'" r="2.6" fill="#2a1c3f"/>');
  parts.push('<circle cx="42" cy="'+ey+'" r="2.6" fill="#2a1c3f"/>');
  parts.push('<path d="M32 '+(ey+2)+' q-1.5 5 0 7" stroke="#00000040" stroke-width="1.6" fill="none" stroke-linecap="round"/>');
  var my = faceCy + 10;
  parts.push('<path d="M23 '+my+' q9 7 18 0" stroke="#2a1c3f" stroke-width="2.2" fill="none" stroke-linecap="round"/>');
  if(c.facial_hair === "mustache") parts.push('<path d="M22 '+(my-3)+' q10 4 20 0 q-2 3 -10 3 q-8 0 -10 -3 Z" fill="'+c.hair_color+'"/>');
  else if(c.facial_hair === "beard") parts.push('<path d="M14 '+(faceCy-2)+' Q14 '+(faceCy+22)+' 32 '+(faceCy+24)+' Q50 '+(faceCy+22)+' 50 '+(faceCy-2)+' Q50 '+(faceCy+12)+' 32 '+(faceCy+14)+' Q14 '+(faceCy+12)+' 14 '+(faceCy-2)+' Z" fill="'+c.hair_color+'" opacity="0.92"/>');
  else if(c.facial_hair === "stubble") parts.push('<path d="M16 '+(faceCy-2)+' Q16 '+(faceCy+20)+' 32 '+(faceCy+22)+' Q48 '+(faceCy+20)+' 48 '+(faceCy-2)+' Q48 '+(faceCy+10)+' 32 '+(faceCy+12)+' Q16 '+(faceCy+10)+' 16 '+(faceCy-2)+' Z" fill="'+c.hair_color+'" opacity="0.28"/>');
  if(c.glasses){
    parts.push('<circle cx="22" cy="'+ey+'" r="8" fill="none" stroke="#241748" stroke-width="2"/>');
    parts.push('<circle cx="42" cy="'+ey+'" r="8" fill="none" stroke="#241748" stroke-width="2"/>');
    parts.push('<path d="M30 '+ey+' h4" stroke="#241748" stroke-width="2"/>');
  }
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">'+parts.join("")+'</svg>';
}

/* מציג תמונת photo אמיתית (מתוך config.js) כשהיא הוגדרה עבור המועמד/ת,
   ואחרת נופל חזרה לאווטאר המצויר האוטומטי — כך שהחלפת שמות/תמונות
   לפני האירוע לא דורשת שום שינוי בקובץ הזה, רק ב-config.js. */
function avatarHTML(c, size){
  if(!c) return "";
  if(c.photo){
    return '<img src="'+h(c.photo)+'" alt="'+h(c.name)+'" style="width:'+size+'px;height:'+size+'px;object-fit:cover;display:block;border-radius:50%;">';
  }
  return makeFaceSVG(c, size);
}

function uid(){
  return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,10);
}

function getParticipantId(){
  var id = localStorage.getItem("ms_pid");
  if(!id){ id = uid(); localStorage.setItem("ms_pid", id); }
  return id;
}
function getParticipantName(){ return localStorage.getItem("ms_pname") || ""; }
function setParticipantName(name){ localStorage.setItem("ms_pname", name); }

function getDb(){
  return window.MSDB || null;
}

/* ===================== STATE ===================== */

var STATE = {
  connStatus: "connecting", // connecting | ok | error
  adminState: null,
  myVotes: {},        // song -> candidate n
  myBest: null,        // song n chosen as best
  selectedCandidate: null,
  selectedBest: null,
  stats: null,         // cached aggregation
  statsLoading: false,
  lbTab: "guessers",    // guessers | songacc | bestperf
  isAdmin: !!window.MS_DEFAULT_ADMIN, // index.html=false, admin.html=true (see בסוף הקובץ)
  adminAuthed: sessionStorage.getItem("ms_admin_authed") === "1",
  pinInput: "",
  pinError: false,
  adminVoteCount: null,
  adminParticipantCount: null,
  adminParticipants: null,
  adminView: "stage", // "stage" | "participants" — local admin-only UI toggle, never affects what the audience sees
  adminRevealPick: {},   // song -> candidate n chosen in the reveal selector
  confirmModal: null     // {text, onYes}
};

var pid = getParticipantId();

/* ===================== RENDER ROOT ===================== */

function render(){
  var app = document.getElementById("app");
  app.innerHTML = STATE.isAdmin ? renderAdmin() : renderAudience();
  bindActions();
  if(STATE.confirmModal){
    app.insertAdjacentHTML("beforeend", renderConfirmModal());
  }
}

/* ===================== AUDIENCE VIEWS ===================== */

function statusPill(){
  var cls = STATE.connStatus === "ok" ? "ok" : (STATE.connStatus === "error" ? "bad" : "warn");
  var txt = STATE.connStatus === "ok" ? "מחובר לאירוע" : (STATE.connStatus === "error" ? "אין חיבור" : "מתחבר…");
  return '<div class="status-pill"><span class="dot '+cls+'"></span>'+txt+'</div>';
}

function renderAudience(){
  var name = getParticipantName();
  var inner;
  if(!name){
    inner = viewEntry();
  } else if(!STATE.adminState){
    inner = viewLoading("טוען את מצב האירוע…");
  } else {
    var st = STATE.adminState;
    if(st.stage === "voting") inner = viewVoting(st);
    else if(st.stage === "recap") inner = viewRecap();
    else if(st.stage === "finalVote") inner = viewFinalVote();
    else if(st.stage === "reveal") inner = viewReveal(st);
    else if(st.stage === "summary") inner = viewSummary(st);
    else if(st.stage === "leaderboards") inner = viewLeaderboards(st);
    else inner = viewLoading("ממתינים לתחילת הערב…");
  }
  return '<div class="phone">'+
    '<div class="top-status">'+statusPill()+'<span>'+h(EVENT_NAME)+'</span></div>'+
    inner+
    '<button type="button" data-action="goto-admin" style="position:fixed; bottom:10px; left:10px; opacity:.3; background:transparent; border:none; color:var(--ink-dim); font-size:10px; padding:6px;">ניהול</button>'+
  '</div>';
}

function viewLoading(msg){
  return '<div class="loading"><div class="spin"></div><div>'+h(msg)+'</div></div>';
}

function viewEntry(){
  return ''+
  '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:14vh;">'+
    '<div style="width:78px;height:78px;border-radius:50%;border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;">'+
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4 0-7 2-7 6v3c0 4 3 7 7 7s7-3 7-7V9c0-4-3-6-7-6Z"/><path d="M9 12h.01M15 12h.01"/></svg>'+
    '</div>'+
    '<div class="eyebrow" style="margin-top:16px;">'+h(EVENT_NAME)+'</div>'+
    '<h1 class="page-title">הזמר<br>במסכה</h1>'+
    '<div class="sub">כדי להצטרף, הזינו את שמכם — נצטרך אותו כדי לשמור את הניחושים והתוצאה האישית שלכם בסוף הערב.</div>'+
  '</div>'+
  '<form id="entry-form" style="margin-top:26px; display:flex; flex-direction:column; gap:12px;">'+
    '<input class="field" name="pname" placeholder="השם המלא שלך" required autocomplete="name">'+
    '<button class="btn btn-gold" type="submit">כניסה לאירוע</button>'+
  '</form>'+
  '<div class="spacer"></div>'+
  '<div class="footer-note">בסריקת הקוד ובכניסה אני מאשר/ת השתתפות בתחרות הערב</div>';
}

function candGridHTML(list, selectedGetter, actionName){
  var out = '<div class="grid-candidates">';
  for(var i=0;i<list.length;i++){
    var c = list[i];
    var sel = selectedGetter() === c.n;
    out += '<button type="button" class="cand'+(sel?' sel':'')+'" data-action="'+actionName+'" data-n="'+c.n+'">'+
      '<div class="avatar-wrap">'+avatarHTML(c,56)+'<div class="num">'+c.n+'</div></div>'+
      '<div class="nm">'+h(c.name)+'</div>'+
      '<div class="check"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#241300" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>'+
    '</button>';
  }
  out += '</div>';
  return out;
}

function viewVoting(st){
  var song = songById(st.currentSong);
  var alreadyVoted = STATE.myVotes[st.currentSong] != null;

  if(alreadyVoted){
    var myN = STATE.myVotes[st.currentSong];
    var myC = candByN(myN);
    return ''+
    '<div style="margin-top:10vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      '<div style="width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 35%,#3a2e12,#140b28);border:2px solid var(--gold);">'+
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'+
      '</div>'+
      '<h1 class="page-title" style="margin-top:22px; font-size:21px;">הניחוש נקלט!</h1>'+
      '<div class="sub">התשובה תתגלה בסוף הערב, יחד עם כל החשיפות</div>'+
    '</div>'+
    '<div class="card" style="margin-top:24px; display:flex; align-items:center; gap:14px;">'+
      (myC ? '<div class="avatar-wrap" style="width:48px;height:48px;flex-shrink:0;">'+avatarHTML(myC,48)+'</div>' : '')+
      '<div style="text-align:right; flex:1;">'+
        '<div style="font-size:12px; color:var(--ink-dim);">הניחוש שלך — ביצוע '+song.id+' ('+h(song.name)+')</div>'+
        '<div style="font-size:16px; font-weight:800;">'+(myC ? '#'+myC.n+' · '+h(myC.name) : '—')+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="spacer"></div>'+
    '<div class="card2" style="display:flex; align-items:center; gap:10px; justify-content:center;"><span class="dot warn"></span><span style="font-size:13.5px; color:var(--ink-dim);">ממתינים לביצוע הבא…</span></div>';
  }

  if(!st.votingOpen){
    return ''+
    '<div style="margin-top:16vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      '<div class="song-icon-badge" style="width:70px;height:70px;background:'+song.bg+';"><svg width="30" height="30" viewBox="0 0 40 40" fill="none" stroke="'+song.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+song.path+'</svg></div>'+
      '<h1 class="page-title" style="margin-top:18px; font-size:21px;">ההצבעה עוד לא נפתחה</h1>'+
      '<div class="sub">ביצוע '+song.id+' מתוך 6 · '+h(song.name)+'<br>ההצבעה תיפתח מיד לאחר סיום השיר</div>'+
    '</div>';
  }

  return ''+
  '<div style="display:flex; align-items:center; justify-content:space-between;">'+
    '<div><span class="eyebrow">ביצוע '+song.id+' מתוך 6</span></div>'+
    '<div class="song-icon-badge" style="width:34px;height:34px;background:'+song.bg+';"><svg width="17" height="17" viewBox="0 0 40 40" fill="none" stroke="'+song.stroke+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">'+song.path+'</svg></div>'+
  '</div>'+
  '<h1 class="page-title" style="font-size:20px; margin-top:8px;">מי מסתתר מאחורי המסכה?</h1>'+
  '<div class="sub">מתחת למסכת '+h(song.name)+'</div>'+
  candGridHTML(candidatesForSong(song), function(){return STATE.selectedCandidate;}, "pick-candidate")+
  '<div style="margin-top:20px;">'+
    '<button class="btn btn-gold" data-action="submit-vote" '+(STATE.selectedCandidate?'':'disabled')+'>שליחת ניחוש</button>'+
  '</div>';
}

function viewRecap(){
  var rows = SONGS.map(function(s){
    return '<div class="row-card">'+
      '<div class="song-icon-badge" style="background:'+s.bg+';"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="'+s.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+s.path+'</svg></div>'+
      '<div style="flex:1; font-weight:700; font-size:14.5px;">'+h(s.name)+'</div>'+
      '<div style="width:26px;height:26px;border-radius:50%;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--gold2);">'+s.id+'</div>'+
    '</div>';
  }).join("");
  return ''+
  '<div class="eyebrow">לפני ההצבעה הבאה</div>'+
  '<h1 class="page-title" style="font-size:21px;">כך נראה הערב עד עכשיו</h1>'+
  '<div style="margin-top:18px;">'+rows+'</div>'+
  '<div class="spacer"></div>'+
  '<div class="footer-note">בקרוב: הצבעה על הביצוע הכי טוב של הערב</div>';
}

function viewFinalVote(){
  var already = STATE.myBest != null;
  if(already){
    var s = songById(STATE.myBest);
    return ''+
    '<div style="margin-top:12vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      '<div style="width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 35%,#3a2e12,#140b28);border:2px solid var(--gold);">'+
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'+
      '</div>'+
      '<h1 class="page-title" style="margin-top:22px; font-size:21px;">ההצבעה נקלטה!</h1>'+
      '<div class="sub">בחרת ב'+h(s.name)+' כביצוע הכי טוב של הערב</div>'+
    '</div>'+
    '<div class="spacer"></div>'+
    '<div class="footer-note">בקרוב: רצף החשיפות</div>';
  }
  var cards = SONGS.map(function(s){
    var sel = STATE.selectedBest === s.id;
    return '<button type="button" class="card2" data-action="pick-best" data-n="'+s.id+'" style="display:flex;flex-direction:column;align-items:center;gap:8px;'+(sel?'border-color:var(--gold);background:rgba(224,178,88,.12);':'')+'">'+
      '<div class="song-icon-badge" style="background:'+s.bg+';"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="'+s.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+s.path+'</svg></div>'+
      '<div style="font-size:12.5px; font-weight:800;">'+h(s.name)+' · '+s.id+'</div>'+
    '</button>';
  }).join("");
  return ''+
  '<div class="eyebrow">הצבעה סופית</div>'+
  '<h1 class="page-title" style="font-size:21px;">מי היה הביצוע הכי טוב?</h1>'+
  '<div class="sub">בחרו אחד מתוך 6</div>'+
  '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:18px;">'+cards+'</div>'+
  '<div style="margin-top:20px;"><button class="btn btn-gold" data-action="submit-best" '+(STATE.selectedBest?'':'disabled')+'>שליחת הצבעה</button></div>';
}

function viewReveal(st){
  var ca = st.correctAnswers || {};
  var curSong = st.currentRevealSong;
  if(!curSong || ca[curSong] == null){
    return ''+
    '<div style="margin-top:16vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      '<div class="eyebrow">שלב החשיפות</div>'+
      '<h1 class="page-title" style="font-size:21px; margin-top:6px;">מיד מתחילים לחשוף…</h1>'+
      '<div class="sub">עקבו אחרי המסך הראשי באולם</div>'+
    '</div>';
  }
  var song = songById(curSong);
  var correctN = ca[curSong];
  var correctC = candByN(correctN);
  var myN = STATE.myVotes[curSong];
  var isCorrect = myN != null && myN === correctN;
  var revealedList = Object.keys(ca).filter(function(k){return Number(k)!==Number(curSong);}).map(function(k){
    var sid = Number(k);
    var s = songById(sid);
    var ok = STATE.myVotes[sid] != null && STATE.myVotes[sid] === ca[k];
    return '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink-dim);">'+
      '<span style="width:8px;height:8px;border-radius:50%;background:'+(ok?"var(--ok)":"var(--bad)")+';"></span>'+h(s.name)+'</div>';
  }).join("");

  return ''+
  '<div style="text-align:center; margin-top:6vh;">'+
    '<div class="eyebrow">חשיפה! · ביצוע מספר '+song.id+'</div>'+
    '<div class="sub" style="margin-top:4px;">מתחת למסכת '+h(song.name)+' הסתתר/ה…</div>'+
    '<div class="hero-avatar" style="width:132px;height:132px;margin-top:22px;border:3px solid '+(isCorrect?"var(--ok)":"var(--bad)")+';">'+
      avatarHTML(correctC,132)+
    '</div>'+
    '<h1 class="page-title" style="margin-top:18px;">'+(correctC?h(correctC.name):"—")+'</h1>'+
    (correctC ? '<div class="sub">#'+correctC.n+'</div>' : '')+
    '<div class="result-banner '+(isCorrect?"ok":"bad")+'">'+
      (myN==null ? "לא הצבעת על השיר הזה" : (isCorrect ? "ניחשת נכון! 🎉" : "הפעם לא ניחשת נכון"))+
    '</div>'+
  '</div>'+
  '<div class="spacer"></div>'+
  (revealedList ? '<div style="display:flex; flex-direction:column; gap:6px; margin-top:14px;">'+revealedList+'</div>' : '')+
  '<div class="footer-note">'+(6-Object.keys(ca).length)+' ביצועים נוספים עדיין לא נחשפו…</div>';
}

function viewSummary(st){
  if(STATE.statsLoading || !STATE.stats){
    if(!STATE.statsLoading) loadStats(st);
    return viewLoading("סופרים ניחושים…");
  }
  var stats = STATE.stats;
  var me = stats.participants[pid] || {correct:0, rank: stats.totalParticipants};
  var ca = st.correctAnswers || {};
  var rows = SONGS.map(function(s){
    var myN = STATE.myVotes[s.id];
    var correctN = ca[s.id];
    var known = correctN != null;
    var ok = known && myN === correctN;
    return '<div class="row-card">'+
      '<div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:'+(known?(ok?"rgba(111,207,151,.16)":"rgba(226,131,111,.16)"):"var(--card2)")+';">'+
        (known ? (ok ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>') : '')+
      '</div>'+
      '<div style="flex:1; font-size:13.5px; font-weight:700;">'+s.id+' · '+h(s.name)+'</div>'+
    '</div>';
  }).join("");
  return ''+
  '<div class="eyebrow">כל החשיפות הסתיימו</div>'+
  '<h1 class="page-title" style="font-size:21px;">התוצאות שלך</h1>'+
  '<div class="stat-tiles" style="margin-top:18px;">'+
    '<div class="stat-tile"><div class="num">'+me.rank+'</div><div class="lbl">המיקום שלך מתוך '+stats.totalParticipants+'</div></div>'+
    '<div class="stat-tile"><div class="num">'+me.correct+'/6</div><div class="lbl">ניחושים נכונים</div></div>'+
  '</div>'+
  '<div class="sub" style="margin-top:18px; font-weight:700; color:var(--ink);">פירוט הניחושים שלך</div>'+
  '<div style="margin-top:10px;">'+rows+'</div>'+
  '<div class="spacer"></div>'+
  '<div class="footer-note">בקרוב: לוחות התוצאות של כל האירוע</div>';
}

function viewLeaderboards(st){
  if(STATE.statsLoading || !STATE.stats){
    if(!STATE.statsLoading) loadStats(st);
    return viewLoading("מרכיבים את הלוחות…");
  }
  var stats = STATE.stats;
  var tabs = ''+
    '<div class="tabs">'+
      '<button type="button" class="tab'+(STATE.lbTab==="guessers"?" active":"")+'" data-action="lb-tab" data-tab="guessers">מנחשים מובילים</button>'+
      '<button type="button" class="tab'+(STATE.lbTab==="songacc"?" active":"")+'" data-action="lb-tab" data-tab="songacc">מי זיהו הכי טוב</button>'+
      '<button type="button" class="tab'+(STATE.lbTab==="bestperf"?" active":"")+'" data-action="lb-tab" data-tab="bestperf">הביצוע הכי טוב</button>'+
    '</div>';

  var body;
  if(STATE.lbTab === "guessers"){
    var ranked = stats.rankedParticipants.slice(0,10);
    var rows = ranked.map(function(p,i){
      var me = p.pid === pid;
      return '<div class="lb-row'+(me?" me":"")+'">'+
        '<div class="lb-rank">'+(i+1)+'</div>'+
        '<div class="lb-avatar">'+h((p.name||"?").slice(0,2))+'</div>'+
        '<div style="flex:1; font-size:13.5px; font-weight:700;">'+h(p.name)+(me?' (את/ה)':'')+'</div>'+
        '<div style="font-size:12.5px; font-weight:800; color:var(--gold2);">'+p.correct+'/6</div>'+
      '</div>';
    }).join("");
    var myEntry = stats.participants[pid];
    var myRow = "";
    if(myEntry && myEntry.rank > 10){
      myRow = '<div style="text-align:center; color:var(--ink-dim); font-size:16px; margin:6px 0;">⋮</div>'+
        '<div class="lb-row me"><div class="lb-rank">'+myEntry.rank+'</div><div class="lb-avatar">את/ה</div><div style="flex:1; font-size:13.5px; font-weight:700;">המיקום שלך</div><div style="font-size:12.5px; font-weight:800; color:var(--gold2);">'+myEntry.correct+'/6</div></div>';
    }
    body = '<div style="margin-top:14px;">'+rows+myRow+'</div>';
  } else if(STATE.lbTab === "songacc"){
    var bySongAcc = SONGS.map(function(s){
      var d = stats.songs[s.id] || {total:0, correct:0};
      var pct = d.total ? Math.round(100*d.correct/d.total) : 0;
      return {s:s, pct:pct};
    }).sort(function(a,b){ return a.pct - b.pct; });
    body = '<div style="margin-top:16px; display:flex; flex-direction:column; gap:14px;">'+bySongAcc.map(function(x){
      return '<div>'+
        '<div style="display:flex; justify-content:space-between; font-size:13px;"><span style="font-weight:800;">'+h(x.s.name)+'</span><span style="color:var(--gold2); font-weight:800;">'+x.pct+'%</span></div>'+
        '<div class="bar-row"><div class="bar-track"><div class="bar-fill" style="width:'+x.pct+'%; background:'+x.s.stroke+';"></div></div></div>'+
      '</div>';
    }).join("")+'</div>';
  } else {
    var totalBest = 0;
    SONGS.forEach(function(s){ totalBest += (stats.bestVotes[s.id]||0); });
    var byBest = SONGS.map(function(s){
      var cnt = stats.bestVotes[s.id]||0;
      var pct = totalBest ? Math.round(100*cnt/totalBest) : 0;
      return {s:s, pct:pct};
    }).sort(function(a,b){ return b.pct - a.pct; });
    body = '<div style="margin-top:16px; display:flex; flex-direction:column; gap:14px;">'+byBest.map(function(x){
      return '<div>'+
        '<div style="display:flex; justify-content:space-between; font-size:13px;"><span style="font-weight:800;">'+h(x.s.name)+'</span><span style="color:var(--gold2); font-weight:800;">'+x.pct+'%</span></div>'+
        '<div class="bar-row"><div class="bar-track"><div class="bar-fill" style="width:'+x.pct+'%; background:'+x.s.stroke+';"></div></div></div>'+
      '</div>';
    }).join("")+'</div>';
  }

  return ''+
  '<div class="eyebrow">לוחות תוצאות</div>'+
  '<h1 class="page-title" style="font-size:21px;">כל התוצאות של הערב</h1>'+
  '<div style="margin-top:16px;">'+tabs+'</div>'+
  body+
  '<div style="margin-top:20px;"><button class="btn btn-outline" data-action="refresh-stats">רענון נתונים</button></div>';
}

/* ===================== STATS AGGREGATION ===================== */

function loadStats(st){
  var database = getDb();
  if(!database){ return; }
  STATE.statsLoading = true;
  var ca = st.correctAnswers || {};

  var songQueries = SONGS.map(function(s){
    return database.collection("votes").where("song","==",s.id).limit(1000).get();
  });
  var bestQ = database.collection("bestVotes").limit(1000).get();
  var partQ = database.collection("participants").limit(1000).get();

  Promise.all(songQueries.concat([bestQ, partQ])).then(function(results){
    var songSnaps = results.slice(0,6);
    var bestSnap = results[6];
    var partSnap = results[7];

    var names = {};
    partSnap.docs.forEach(function(d){
      var data = d.data() || {};
      names[d.id] = data.name || "משתתף/ת";
    });

    var perParticipant = {};     // pid -> correct count
    var perParticipantTime = {}; // pid -> summed elapsedMs of CORRECT guesses (tie-break: faster wins)
    var songs = {};
    songSnaps.forEach(function(snap, idx){
      var songId = SONGS[idx].id;
      var total = 0, correct = 0;
      snap.docs.forEach(function(d){
        var data = d.data() || {};
        total++;
        var isOk = ca[songId] != null && data.candidate === ca[songId];
        if(isOk) correct++;
        if(!perParticipant[data.pid]) perParticipant[data.pid] = 0;
        if(!perParticipantTime[data.pid]) perParticipantTime[data.pid] = 0;
        if(isOk){
          perParticipant[data.pid]++;
          perParticipantTime[data.pid] += (typeof data.elapsedMs === "number" ? data.elapsedMs : 0);
        }
      });
      songs[songId] = {total:total, correct:correct};
    });

    var bestVotes = {};
    bestSnap.docs.forEach(function(d){
      var data = d.data() || {};
      if(data.song != null) bestVotes[data.song] = (bestVotes[data.song]||0) + 1;
    });

    var allPids = Object.keys(names);
    Object.keys(perParticipant).forEach(function(p){ if(allPids.indexOf(p)===-1) allPids.push(p); });

    var ranked = allPids.map(function(p){
      return {pid:p, name:names[p] || "משתתף/ת", correct: perParticipant[p]||0, time: perParticipantTime[p]||0};
    }).sort(function(a,b){
      if(b.correct !== a.correct) return b.correct - a.correct;
      return a.time - b.time; // tie-break: whoever answered correctly faster (lower total time) ranks first
    });

    var participants = {};
    ranked.forEach(function(p, i){ participants[p.pid] = {correct:p.correct, rank:i+1, name:p.name}; });

    STATE.stats = {
      totalParticipants: allPids.length || 1,
      songs: songs,
      bestVotes: bestVotes,
      participants: participants,
      rankedParticipants: ranked
    };
    STATE.statsLoading = false;
    render();
  }).catch(function(err){
    STATE.statsLoading = false;
    STATE.stats = {totalParticipants:1, songs:{}, bestVotes:{}, participants:{}, rankedParticipants:[]};
    render();
  });
}

function adminComputeRevealOrder(){
  var database = getDb();
  if(!database) return;
  var answerKey = {};
  SONGS.forEach(function(s){
    var v = STATE.adminRevealPick[s.id];
    if(v) answerKey[s.id] = Number(v);
  });
  if(Object.keys(answerKey).length < SONGS.length){
    STATE.confirmModal = {
      text: "לא לכל השירים נבחר מי שהסתתר מתחתיהם. לחשב את סדר החשיפה בכל זאת עבור השירים שכבר נבחרו?",
      onYes: function(){ doComputeRevealOrder(database, answerKey); }
    };
    render();
    return;
  }
  doComputeRevealOrder(database, answerKey);
}

function doComputeRevealOrder(database, answerKey){
  var songIds = Object.keys(answerKey).map(Number);
  Promise.all(songIds.map(function(sid){
    return database.collection("votes").where("song","==",sid).limit(1000).get();
  })).then(function(snaps){
    var pct = {};
    snaps.forEach(function(snap, idx){
      var sid = songIds[idx];
      var total = snap.size, correct = 0;
      snap.docs.forEach(function(d){
        var data = d.data() || {};
        if(data.candidate === answerKey[sid]) correct++;
      });
      pct[sid] = total ? correct/total : 0;
    });
    var order = songIds.slice().sort(function(a,b){ return pct[b]-pct[a]; });
    database.doc("state/admin").update({answerKey:answerKey, revealOrder:order});
  });
}

/* ===================== ADMIN VIEWS ===================== */

function renderAdmin(){
  if(!STATE.adminAuthed){
    return renderPinLock();
  }
  if(!STATE.adminState){
    return '<div class="admin-wrap"><div class="lock-wrap">'+viewLoading("טוען מצב ניהול…")+'</div></div>';
  }
  var st = STATE.adminState;
  return '<div class="admin-wrap">'+
    adminSidebar(st)+
    adminMain(st)+
  '</div>';
}

function renderPinLock(){
  return '<div class="admin-wrap"><div class="lock-wrap">'+
    '<div class="eyebrow">מסך ניהול</div>'+
    '<h1 class="page-title">כניסת מפיק/ה</h1>'+
    '<div class="sub">הזינו קוד גישה כדי לנהל את האירוע</div>'+
    '<form id="pin-form" style="margin-top:22px; display:flex; flex-direction:column; gap:12px;">'+
      '<input class="field" style="text-align:center; letter-spacing:6px; font-size:20px;" name="pin" type="password" inputmode="numeric" placeholder="••••" autofocus>'+
      (STATE.pinError ? '<div style="color:var(--bad); font-size:13px;">קוד שגוי, נסו שוב</div>' : '')+
      '<button class="btn btn-gold" type="submit">כניסה</button>'+
    '</form>'+
  '</div></div>';
}

function adminSidebar(st){
  var stageBtn = function(label, active, action, extra){
    return '<button type="button" class="stage-btn'+(active?' active':'')+'" data-action="'+action+'" '+(extra||'')+'>'+h(label)+'</button>';
  };
  var songBtns = SONGS.map(function(s){
    var active = st.stage === "voting" && st.currentSong === s.id;
    return stageBtn((s.id)+' · '+s.name, active, "admin-set-song", 'data-n="'+s.id+'"');
  }).join("");

  return '<div class="admin-side">'+
    '<div>'+
      '<div class="admin-h">מסך ניהול</div>'+
      '<h1 class="page-title" style="font-size:19px;">הזמר במסכה — '+h(EVENT_NAME)+'</h1>'+
    '</div>'+
    '<button type="button" data-action="admin-view-participants" class="card2" style="display:flex; align-items:center; justify-content:space-between; font-size:12.5px; width:100%; text-align:right; border:1.5px solid '+(STATE.adminView==="participants"?"var(--gold)":"transparent")+';">'+
      '<span>'+(STATE.adminParticipantCount==null?'…':STATE.adminParticipantCount)+' משתתפים מחוברים · הצגת רשימה</span>'+
      '<span class="dot ok"></span>'+
    '</button>'+
    '<div>'+
      '<div class="admin-h" style="margin-bottom:8px;">שלב באירוע</div>'+
      '<div style="display:flex; flex-direction:column; gap:8px;">'+songBtns+'</div>'+
    '</div>'+
    '<div>'+
      '<div class="admin-h" style="margin-bottom:8px;">שלבים נוספים</div>'+
      '<div style="display:flex; flex-direction:column; gap:8px;">'+
        stageBtn("תזכורת (Recap)", st.stage==="recap", "admin-set-stage", 'data-stage="recap"')+
        stageBtn("הצבעה לביצוע הכי טוב", st.stage==="finalVote", "admin-set-stage", 'data-stage="finalVote"')+
        stageBtn("רצף חשיפות", st.stage==="reveal", "admin-set-stage", 'data-stage="reveal"')+
        stageBtn("סיכום אישי לקהל", st.stage==="summary", "admin-set-stage", 'data-stage="summary"')+
        stageBtn("לוחות תוצאות", st.stage==="leaderboards", "admin-set-stage", 'data-stage="leaderboards"')+
      '</div>'+
    '</div>'+
    '<div class="spacer"></div>'+
    '<button type="button" class="btn btn-outline" data-action="goto-audience">מעבר לתצוגת קהל (לבדיקה)</button>'+
    '<button type="button" class="btn btn-outline" data-action="admin-reset" style="color:var(--bad); border-color:rgba(226,131,111,.4);">איפוס האירוע (למצב בדיקה)</button>'+
  '</div>';
}

function adminMain(st){
  if(STATE.adminView === "participants"){
    var list = STATE.adminParticipants || [];
    var rows = list.length ? list.map(function(p, i){
      var when = p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) : '—';
      return '<div class="row-card">'+
        '<div style="width:26px; text-align:center; font-size:11.5px; color:var(--ink-dim); flex-shrink:0;">'+(i+1)+'</div>'+
        '<div style="flex:1; font-weight:700; font-size:14px;">'+h(p.name || 'ללא שם')+'</div>'+
        '<div style="font-size:11.5px; color:var(--ink-dim);">הצטרפ/ה בשעה '+when+'</div>'+
      '</div>';
    }).join("") : '<div class="sub">עדיין אין משתתפים שנכנסו לאפליקציה.</div>';
    return '<div class="admin-main">'+
      '<div class="admin-h">רשימת משתתפים</div>'+
      '<h1 class="page-title">'+list.length+' משתתפים הזינו את שמם</h1>'+
      '<div class="sub">הרשימה כוללת כל מי שפתח את האפליקציה והקליד שם — לא מדובר בסטטוס "מחובר/מנותק" חי, אלא ברשימה מצטברת של כל מי שנכנס עד כה.</div>'+
      '<div style="margin-top:20px; max-width:520px; max-height:70vh; overflow-y:auto;">'+rows+'</div>'+
    '</div>';
  }
  if(st.stage === "voting"){
    var song = songById(st.currentSong);
    var cnt = STATE.adminVoteCount;
    return '<div class="admin-main">'+
      '<div class="admin-h">שלב נוכחי</div>'+
      '<h1 class="page-title">ביצוע '+song.id+' · '+h(song.name)+'</h1>'+
      '<div style="display:flex; gap:12px; margin-top:20px;">'+
        '<button class="btn '+(st.votingOpen?'btn-outline':'btn-gold')+'" style="width:auto; padding:14px 22px;" data-action="admin-toggle-voting" data-open="1">פתיחת הצבעה</button>'+
        '<button class="btn '+(!st.votingOpen?'btn-outline':'btn-gold')+'" style="width:auto; padding:14px 22px;" data-action="admin-toggle-voting" data-open="0">סגירת הצבעה</button>'+
      '</div>'+
      '<div class="card" style="margin-top:24px; max-width:420px;">'+
        '<div style="font-size:12.5px; color:var(--ink-dim);">הצבעות שהתקבלו לביצוע זה</div>'+
        '<div style="font-size:34px; font-weight:900; margin-top:6px; font-variant-numeric:tabular-nums;">'+(cnt==null?'…':cnt)+'</div>'+
      '</div>'+
      '<div class="sub" style="margin-top:22px;">מצב הצבעה: <b style="color:'+(st.votingOpen?"var(--ok)":"var(--bad)")+';">'+(st.votingOpen?'פתוחה':'סגורה')+'</b></div>'+
    '</div>';
  }

  if(st.stage === "reveal"){
    var order = st.revealOrder;

    if(!order){
      /* ---- phase A: pick who's under each mask (private — not shown to audience) ---- */
      var rows = SONGS.map(function(s){
        var savedN = st.answerKey && st.answerKey[s.id];
        var pickN = STATE.adminRevealPick[s.id] || savedN || "";
        var options = '<option value="">בחר/י שם…</option>'+candidatesForSong(s).map(function(c){
          return '<option value="'+c.n+'" '+(Number(pickN)===c.n?'selected':'')+'>'+c.n+' · '+h(c.name)+'</option>';
        }).join("");
        return '<div class="card" style="display:flex; align-items:center; gap:14px; margin-bottom:12px;">'+
          '<div class="song-icon-badge" style="background:'+s.bg+';"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="'+s.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+s.path+'</svg></div>'+
          '<div style="width:120px; font-weight:800; font-size:13.5px;">'+s.id+' · '+h(s.name)+'</div>'+
          '<select class="field" style="max-width:260px;" data-action="admin-reveal-pick" data-n="'+s.id+'">'+options+'</select>'+
        '</div>';
      }).join("");
      return '<div class="admin-main">'+
        '<div class="admin-h">רצף חשיפות · שלב 1</div>'+
        '<h1 class="page-title">מי מסתתר בכל מסכה?</h1>'+
        '<div class="sub">הבחירות כאן אינן מוצגות לקהל. לאחר שמילאתם את כולן, המערכת תחשב אוטומטית את סדר החשיפה — קודם מי שזוהה נכון על ידי הכי הרבה מהקהל, ולבסוף מי שזוהה על ידי הכי מעטים.</div>'+
        '<div style="margin-top:20px; max-width:680px;">'+rows+'</div>'+
        '<button class="btn btn-gold" style="max-width:320px; margin-top:6px;" data-action="admin-compute-order">חשב/י סדר חשיפה</button>'+
      '</div>';
    }

    /* ---- phase B: sequential reveal in the computed order ---- */
    var ca = st.correctAnswers || {};
    var nextSong = order.filter(function(s){ return ca[s] == null; })[0];
    var rows2 = order.map(function(sid, i){
      var s = songById(sid);
      var c = candByN(st.answerKey[sid]);
      var revealed = ca[sid] != null;
      var isNext = sid === nextSong;
      var statusLabel = revealed ? "נחשף" : (isNext ? "הבא בתור" : "ממתין");
      return '<div class="card" style="display:flex; align-items:center; gap:14px; margin-bottom:10px;'+(isNext?'border-color:var(--gold);':'')+(revealed?'opacity:.6;':'')+'">'+
        '<div style="width:24px; text-align:center; font-weight:800; color:var(--gold2);">'+(i+1)+'</div>'+
        '<div class="song-icon-badge" style="background:'+s.bg+';"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="'+s.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+s.path+'</svg></div>'+
        '<div style="flex:1;"><div style="font-weight:800; font-size:13.5px;">'+s.id+' · '+h(s.name)+'</div><div style="font-size:11.5px; color:var(--ink-dim);">'+(c?h(c.name):'')+'</div></div>'+
        '<div style="font-size:11.5px; font-weight:700; padding:5px 10px; border-radius:8px; background:var(--card2); color:'+(revealed?'var(--ok)':'var(--gold2)')+';">'+statusLabel+'</div>'+
      '</div>';
    }).join("");
    return '<div class="admin-main">'+
      '<div class="admin-h">רצף חשיפות · שלב 2</div>'+
      '<h1 class="page-title">סדר החשיפה (מהזיהוי הגבוה ביותר לנמוך ביותר)</h1>'+
      '<div class="sub">הסדר חושב אוטומטית לפי אחוז הקהל שזיהה נכון כל ביצוע. בכל לחיצה על "חשוף את הבא", כל הקהל רואה מיידית אם ניחש נכון.</div>'+
      '<div style="margin-top:20px; max-width:640px;">'+rows2+'</div>'+
      '<div style="display:flex; gap:12px; max-width:640px;">'+
        '<button class="btn btn-gold" data-action="admin-reveal-next" '+(nextSong==null?'disabled':'')+'>'+(nextSong==null?'כל הביצועים נחשפו':'חשוף את הבא')+'</button>'+
        '<button class="btn btn-outline" style="width:auto; padding:14px 18px;" data-action="admin-reveal-order-reset">חשב מחדש</button>'+
      '</div>'+
    '</div>';
  }

  var stageLabels = {recap:"תזכורת לקהל", finalVote:"הצבעה לביצוע הכי טוב", summary:"סיכום אישי לקהל", leaderboards:"לוחות תוצאות לקהל"};
  return '<div class="admin-main">'+
    '<div class="admin-h">שלב נוכחי</div>'+
    '<h1 class="page-title">'+h(stageLabels[st.stage] || st.stage)+'</h1>'+
    '<div class="sub" style="margin-top:10px;">מסך זה מוצג כעת לכל הקהל. השתמשו בתפריט הצד כדי לעבור לשלב הבא.</div>'+
  '</div>';
}

function renderConfirmModal(){
  var m = STATE.confirmModal;
  return '<div class="modal-overlay"><div class="modal-box">'+
    '<div style="font-size:15px; font-weight:700; line-height:1.5;">'+h(m.text)+'</div>'+
    '<div style="display:flex; gap:10px; margin-top:20px;">'+
      '<button class="btn btn-outline" data-action="modal-cancel" style="width:auto; flex:1;">ביטול</button>'+
      '<button class="btn btn-gold" data-action="modal-confirm" style="width:auto; flex:1;">אישור</button>'+
    '</div>'+
  '</div></div>';
}

/* ===================== ACTIONS ===================== */

function bindActions(){
  var app = document.getElementById("app");

  var entryForm = document.getElementById("entry-form");
  if(entryForm){
    entryForm.addEventListener("submit", function(e){
      e.preventDefault();
      var v = entryForm.pname.value.trim();
      if(!v) return;
      setParticipantName(v);
      ensureParticipantDoc();
      render();
    });
  }

  var pinForm = document.getElementById("pin-form");
  if(pinForm){
    pinForm.addEventListener("submit", function(e){
      e.preventDefault();
      if(pinForm.pin.value === ADMIN_PIN){
        STATE.adminAuthed = true;
        sessionStorage.setItem("ms_admin_authed","1");
        STATE.pinError = false;
      } else {
        STATE.pinError = true;
      }
      render();
    });
  }

  app.addEventListener("click", onAppClick);
  app.addEventListener("change", onAppChange);
}

function onAppChange(e){
  var sel = e.target.closest('[data-action="admin-reveal-pick"]');
  if(sel){
    STATE.adminRevealPick[sel.dataset.n] = sel.value;
  }
}

function onAppClick(e){
  var el = e.target.closest("[data-action]");
  if(!el) return;
  var action = el.dataset.action;
  var database = getDb();

  if(action === "pick-candidate"){
    STATE.selectedCandidate = Number(el.dataset.n);
    render();
  } else if(action === "submit-vote"){
    if(!database || STATE.selectedCandidate == null) return;
    var song = STATE.adminState.currentSong;
    var n = STATE.selectedCandidate;
    var openedAt = STATE.adminState.votingOpenedAt;
    var elapsedMs = openedAt ? Math.max(0, Date.now() - openedAt) : null;
    el.disabled = true;
    database.doc("votes/"+song+"_"+pid).set({pid:pid, song:song, candidate:n, ts:Date.now(), elapsedMs:elapsedMs}).then(function(){
      STATE.myVotes[song] = n;
      STATE.selectedCandidate = null;
      render();
    });
  } else if(action === "pick-best"){
    STATE.selectedBest = Number(el.dataset.n);
    render();
  } else if(action === "submit-best"){
    if(!database || STATE.selectedBest == null) return;
    var bn = STATE.selectedBest;
    el.disabled = true;
    database.doc("bestVotes/"+pid).set({pid:pid, song:bn, ts:Date.now()}).then(function(){
      STATE.myBest = bn;
      STATE.selectedBest = null;
      render();
    });
  } else if(action === "lb-tab"){
    STATE.lbTab = el.dataset.tab;
    render();
  } else if(action === "refresh-stats"){
    STATE.stats = null;
    render();
  } else if(action === "goto-admin"){
    STATE.isAdmin = true;
    try{ history.replaceState(null, "", "#admin"); }catch(err){}
    subscribeAdminExtras();
    render();
  } else if(action === "goto-audience"){
    STATE.isAdmin = false;
    try{ history.replaceState(null, "", location.pathname + location.search); }catch(err){}
    render();
  }

  /* ---- admin actions ---- */
  else if(action === "admin-view-participants"){
    STATE.adminView = STATE.adminView === "participants" ? "stage" : "participants";
    render();
  } else if(action === "admin-set-song"){
    if(!database) return;
    STATE.adminView = "stage";
    render();
    database.doc("state/admin").update({stage:"voting", currentSong:Number(el.dataset.n), votingOpen:false});
  } else if(action === "admin-toggle-voting"){
    if(!database) return;
    var openNow = el.dataset.open === "1";
    var patchV = {votingOpen: openNow};
    if(openNow) patchV.votingOpenedAt = Date.now();
    database.doc("state/admin").update(patchV);
  } else if(action === "admin-set-stage"){
    if(!database) return;
    STATE.adminView = "stage";
    render();
    database.doc("state/admin").update({stage: el.dataset.stage});
  } else if(action === "admin-compute-order"){
    adminComputeRevealOrder();
  } else if(action === "admin-reveal-next"){
    if(!database) return;
    var stt = STATE.adminState;
    var ordr = stt.revealOrder || [];
    var caNow = stt.correctAnswers || {};
    var nextS = ordr.filter(function(s){ return caNow[s] == null; })[0];
    if(nextS == null) return;
    var patch2 = {currentRevealSong: nextS};
    patch2.correctAnswers = {};
    patch2.correctAnswers[nextS] = stt.answerKey[nextS];
    database.doc("state/admin").update(patch2);
  } else if(action === "admin-reveal-order-reset"){
    if(!database) return;
    database.doc("state/admin").update({revealOrder:null, correctAnswers:{}, currentRevealSong:null});
  } else if(action === "admin-reset"){
    STATE.confirmModal = {
      text: "לאפס את כל האירוע (שלבים, הצבעות ומשתתפים) למצב בדיקה? הפעולה בלתי הפיכה.",
      onYes: doAdminReset
    };
    render();
  } else if(action === "modal-cancel"){
    STATE.confirmModal = null;
    render();
  } else if(action === "modal-confirm"){
    var fn = STATE.confirmModal && STATE.confirmModal.onYes;
    STATE.confirmModal = null;
    render();
    if(fn) fn();
  }
}

function doAdminReset(){
  var database = getDb();
  if(!database) return;
  database.doc("state/admin").set({stage:"voting", currentSong:1, votingOpen:false, votingOpenedAt:null, currentRevealSong:null, correctAnswers:{}, answerKey:{}, revealOrder:null});
  ["participants","votes","bestVotes"].forEach(function(col){
    database.collection(col).limit(1000).get().then(function(snap){
      snap.docs.forEach(function(d){ database.doc(col+"/"+d.id).delete(); });
    });
  });
}

/* ===================== DB WIRING ===================== */

function ensureParticipantDoc(){
  var database = getDb();
  if(!database) return;
  database.doc("participants/"+pid).set({name:getParticipantName(), joinedAt:Date.now()});
}

var ensuredAdminDoc = false;
function subscribeAdminState(){
  var database = getDb();
  if(!database){
    setTimeout(subscribeAdminState, 400);
    return;
  }
  database.doc("state/admin").onSnapshot(function(snap){
    STATE.connStatus = "ok";
    if(snap.exists){
      STATE.adminState = snap.data();
    } else {
      STATE.adminState = {stage:"voting", currentSong:1, votingOpen:false, votingOpenedAt:null, currentRevealSong:null, correctAnswers:{}, answerKey:{}, revealOrder:null};
      if(STATE.isAdmin && !ensuredAdminDoc){
        ensuredAdminDoc = true;
        database.doc("state/admin").set(STATE.adminState);
      }
    }
    var st = STATE.adminState;
    if(st.stage === "voting" && STATE.myVotes[st.currentSong] === undefined && getParticipantName()){
      fetchMyVote(st.currentSong);
    }
    if((st.stage === "reveal" || st.stage === "summary") && getParticipantName()){
      fetchAllMyVotes();
    }
    if(st.stage === "finalVote" && STATE.myBest === null && getParticipantName()){
      fetchMyBest();
    }
    render();
  }, function(err){
    STATE.connStatus = "error";
    render();
  });
}

function fetchMyVote(song){
  var database = getDb();
  if(!database) return;
  database.doc("votes/"+song+"_"+pid).get().then(function(snap){
    STATE.myVotes[song] = snap.exists ? snap.data().candidate : null;
    render();
  });
}
function fetchAllMyVotes(){
  var database = getDb();
  if(!database) return;
  var missing = SONGS.filter(function(s){ return STATE.myVotes[s.id] === undefined; });
  if(!missing.length) return;
  Promise.all(missing.map(function(s){
    return database.doc("votes/"+s.id+"_"+pid).get().then(function(snap){
      STATE.myVotes[s.id] = snap.exists ? snap.data().candidate : null;
    });
  })).then(render);
}
function fetchMyBest(){
  var database = getDb();
  if(!database) return;
  database.doc("bestVotes/"+pid).get().then(function(snap){
    STATE.myBest = snap.exists ? snap.data().song : null;
    render();
  });
}

var adminExtrasStarted = false;
function subscribeAdminExtras(){
  if(adminExtrasStarted) return;
  var database = getDb();
  if(!database){
    setTimeout(subscribeAdminExtras, 400);
    return;
  }
  adminExtrasStarted = true;
  database.collection("participants").limit(1000).onSnapshot(function(snap){
    STATE.adminParticipantCount = snap.size;
    STATE.adminParticipants = snap.docs.map(function(d){
      var data = d.data() || {};
      return {id:d.id, name:data.name || "", joinedAt: data.joinedAt || 0};
    }).sort(function(a,b){ return a.joinedAt - b.joinedAt; });
    render();
  }, function(){});

  var lastSong = null;
  var unsubVotes = null;
  var interval = setInterval(function(){
    var st = STATE.adminState;
    if(!st || st.stage !== "voting"){ return; }
    if(st.currentSong === lastSong) return;
    lastSong = st.currentSong;
    if(unsubVotes) unsubVotes();
    unsubVotes = database.collection("votes").where("song","==",st.currentSong).limit(1000).onSnapshot(function(snap){
      STATE.adminVoteCount = snap.size;
      render();
    }, function(){});
  }, 500);
}

/* ===================== INIT ===================== */

function init(){
  render();
  if(getParticipantName()) ensureParticipantDoc();
  subscribeAdminState();
  if(STATE.isAdmin) subscribeAdminExtras();
}

init();

})();
