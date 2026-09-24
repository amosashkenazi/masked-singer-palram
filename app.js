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
/* מסך "ברוכים הבאים" שמוצג פעם אחת מיד אחרי הקלדת השם, לפני שאלת
   החימום. אפשר לשנות את הנוסח דרך WELCOME_TITLE ב-config.js; אם לא
   הוגדר שם, זו ברירת המחדל. */
var WELCOME_TITLE = window.MS_CONFIG.WELCOME_TITLE || "ברוכים הבאים לזמר במסכה פלרם 2026";
/* לוגו פלרם (אופציונלי) — מציגים אותו במסך הכניסה ובמסך "ברוכים
   הבאים" במקום את אייקון המסכה המצויר. מוגדר ב-config.js תחת
   LOGO_URL, למשל: LOGO_URL: "logo.png" (קובץ שמעלים ל-GitHub, אותו
   דבר בדיוק כמו תמונות המועמדים ב-photos/). אם לא הוגדר, או שהקובץ
   נכשל בטעינה, נופלים אוטומטית בחזרה לאייקון המצויר. */
var LOGO_URL = window.MS_CONFIG.LOGO_URL || "";
/* משך ההצבעה (בשניות) על כל אחד מששת הביצועים — לאחר שהמנהל/ת פותח/ת
   הצבעה, שעון עצר רץ לקהל ולמנהל/ת, ובתום הזמן ההצבעה ננעלת אוטומטית
   (ראו votingTicker בהמשך הקובץ). אפשר לשנות ב-config.js תחת
   VOTING_DURATION_SEC בלי לגעת בקוד. */
var VOTING_DURATION_SEC = window.MS_CONFIG.VOTING_DURATION_SEC || 60;
/* שאלת חימום אופציונלית לפני תחילת ההצבעות — אם לא הוגדרה ב-config.js,
   WARMUP_OPTIONS יהיה ריק והשלב פשוט לא יציג שום שאלה. */
var WARMUP_QUESTION = window.MS_CONFIG.WARMUP_QUESTION || "";
var WARMUP_OPTIONS = window.MS_CONFIG.WARMUP_OPTIONS || [];

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
    /* אם התמונה נכשלת בטעינה (קובץ חסר, שם/נתיב לא מדויק וכו') —
       נופלים אוטומטית בחזרה לאווטאר המצויר, במקום להציג אייקון
       תמונה שבור לקהל. */
    return '<span style="display:inline-block;width:'+size+'px;height:'+size+'px;">'+
      '<img src="'+h(c.photo)+'" alt="'+h(c.name)+'" style="width:'+size+'px;height:'+size+'px;object-fit:cover;display:block;border-radius:50%;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\';">'+
      '<span style="display:none;">'+makeFaceSVG(c,size)+'</span>'+
    '</span>';
  }
  return makeFaceSVG(c, size);
}

/* מציגה את לוגו פלרם (LOGO_URL ב-config.js) בתוך עיגול במסך הכניסה
   ובמסך "ברוכים הבאים" — ואם לא הוגדר לוגו, או שהקובץ נכשל בטעינה,
   נופלת אוטומטית בחזרה לאייקון המסכה המצויר, בדיוק כמו avatarHTML. */
function brandMarkHTML(boxSize, iconSize){
  var maskIcon = '<svg width="'+iconSize+'" height="'+iconSize+'" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4 0-7 2-7 6v3c0 4 3 7 7 7s7-3 7-7V9c0-4-3-6-7-6Z"/><path d="M9 12h.01M15 12h.01"/></svg>';
  if(LOGO_URL){
    return '<div style="width:'+boxSize+'px;height:'+boxSize+'px;border-radius:50%;border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">'+
      '<img src="'+h(LOGO_URL)+'" alt="פלרם" style="width:76%;height:76%;object-fit:contain;display:block;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">'+
      '<span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;">'+maskIcon+'</span>'+
    '</div>';
  }
  return '<div style="width:'+boxSize+'px;height:'+boxSize+'px;border-radius:50%;border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;">'+maskIcon+'</div>';
}

/* התג העגול של שיר/חיה — מציג את תמונת התחפושת האמיתית (song.costumePhoto
   ב-config.js) כשהיא הוגדרה, ואם לא, או שהיא נכשלת בטעינה, נופל חזרה
   לאייקון המצויר האוטומטי (song.path/bg/stroke), בדיוק כמו avatarHTML.
   תמונת התחפושת היא תמונה של הבגד/החיה עצמה, לא של מי שמסתתר מתחתיה —
   לכן אין שום בעיה להציג אותה גם במסכי הניחוש (השאלה שם היא מי לובש
   את התחפושת, לא איך היא נראית). size קובע גם רוחב/גובה וגם גודל
   האייקון המצויר הפנימי, יחסית אליו. */
function songBadgeHTML(song, size){
  var iconSize = Math.round(size*0.46);
  var icon = '<svg width="'+iconSize+'" height="'+iconSize+'" viewBox="0 0 40 40" fill="none" stroke="'+song.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+song.path+'</svg>';
  if(song.costumePhoto){
    return '<div class="song-icon-badge" style="width:'+size+'px;height:'+size+'px;background:'+song.bg+';overflow:hidden;">'+
      '<img src="'+h(song.costumePhoto)+'" alt="'+h(song.name)+'" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">'+
      '<span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;">'+icon+'</span>'+
    '</div>';
  }
  return '<div class="song-icon-badge" style="width:'+size+'px;height:'+size+'px;background:'+song.bg+';">'+icon+'</div>';
}

/* ===================== שעון עצר להצבעה ===================== */

/* כמה שניות נותרו להצבעה הנוכחית, לפי votingOpenedAt שנשמר ב-state/admin
   כשההצבעה נפתחה. מחזירה null אם ההצבעה לא פתוחה או שאין זמן פתיחה
   שמור (למשל הצבעה שנפתחה בגרסה ישנה של הקוד, לפני התוספת הזו). */
function votingSecondsLeft(st){
  if(!st || !st.votingOpen || !st.votingOpenedAt) return null;
  var elapsedSec = (Date.now() - st.votingOpenedAt) / 1000;
  return Math.max(0, VOTING_DURATION_SEC - elapsedSec);
}

/* שעון עצר עגול בלי ספרות — טבעת שמתרוקנת בהדרגה מירוק לאדום, בדיוק
   כמו טיימר "פאי". חשוב: זו אנימציית CSS טהורה (ראו vote-timer-arc
   ב-styles.css) שרצה בעצמה על המכשיר ברגע שהיא מצוירת — היא לא
   דורשת שום רינדור חוזר מה-JS כדי "לזוז". animation-delay שלילי,
   שווה לזמן שכבר חלף, קופץ אותה מיד לנקודה הנכונה גם אם המכשיר
   הצטרף באמצע ההצבעה. ה"קפיצה" הזאת קורית פעם אחת ברגע שהמסך מצויר
   (למשל כשההצבעה נפתחת), ומשם והלאה שום דבר אחר במסך (כולל תמונות
   המועמדים) לא מתעדכן/מהבהב בשביל השעון. */
function votingCountdownHTML(st){
  var left = votingSecondsLeft(st);
  if(left == null) return "";
  var elapsed = Math.max(0, VOTING_DURATION_SEC - left);
  var r = 26, circumference = 2 * Math.PI * r; // r=26 קבוע — תואם את ה-stroke-dashoffset הסופי שקבוע ב-CSS
  return '<div class="vote-timer">'+
    '<svg width="64" height="64" viewBox="0 0 64 64">'+
      '<circle cx="32" cy="32" r="'+r+'" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="10"/>'+
      '<circle class="vote-timer-arc" cx="32" cy="32" r="'+r+'" fill="none" stroke-width="10" stroke-linecap="round" '+
        'style="stroke-dasharray:'+circumference.toFixed(2)+'; animation-duration:'+VOTING_DURATION_SEC+'s; animation-delay:-'+elapsed.toFixed(2)+'s;"></circle>'+
    '</svg>'+
  '</div>';
}

/* טיקר גלובלי: פועם כל שנייה כל עוד שלב ההצבעה פעיל, אך ורק כדי
   לבדוק אם עברה דקה (VOTING_DURATION_SEC) מאז שההצבעה נפתחה, ואם כן
   לנעול אותה אוטומטית ב-state/admin. חשוב: הוא בכוונה *לא* קורא ל-
   render() — התצוגה (כולל שעון העצר עצמו) מתעדכנת דרך CSS או דרך
   ה-onSnapshot הרגיל על state/admin, כך שאין כאן שום רינדור-יתר
   שעלול להבהב תמונות או למחוק טקסט שמישהו/י באמצע להקליד. כתיבה
   כפולה על ידי כמה מכשירים בו-זמנית היא בלתי מזיקה, כי התוצאה זהה. */
var votingTickerStarted = false;
function startVotingTicker(){
  if(votingTickerStarted) return;
  votingTickerStarted = true;
  setInterval(function(){
    var st = STATE.adminState;
    if(!st || st.stage !== "voting" || !st.votingOpen || !st.votingOpenedAt) return;
    var left = votingSecondsLeft(st);
    if(left != null && left <= 0){
      var database = getDb();
      if(database){
        database.doc("state/admin").update({votingOpen:false});
      }
    }
  }, 1000);
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

/* "איפוס האירוע" מוחק את כל המשתתפים/הצבעות ב-Firestore, אבל אינו יכול
   למחוק את מה שנשמר מקומית (localStorage) במכשירים של המשתתפים —
   לכן בלי המנגנון הזה, כל מי שכבר נכנס פעם אחת ורק טוען/מרענן את
   הדף אחרי איפוס נרשם מחדש אוטומטית (ensureParticipantDoc בהמשך
   הקובץ), ו"מופיע" ברשימת המשתתפים/בדירוגים גם בלי שבאמת השתתף
   אחרי האיפוס. הפתרון: state/admin נושא resetEpoch שמתעדכן בכל
   איפוס; כל מכשיר משווה אותו למה ששמור אצלו מקומית, ואם הם שונים —
   מוחקים את הזהות המקומית (שם + מזהה) וכל מטמון ההצבעות, כך שהמכשיר
   חוזר למסך "הקלדת שם" בדיוק כאילו זו הפעם הראשונה שלו באירוע. */
function getLocalEpoch(){ return localStorage.getItem("ms_epoch") || ""; }
function setLocalEpoch(v){ localStorage.setItem("ms_epoch", String(v)); }
function forgetParticipantIdentity(){
  localStorage.removeItem("ms_pid");
  localStorage.removeItem("ms_pname");
  pid = getParticipantId();
  STATE.myVotes = {};
  STATE.myBest = null;
  STATE.myWarmup = undefined;
  STATE.selectedCandidate = null;
  STATE.selectedBest = null;
  STATE.selectedWarmup = null;
  STATE.stats = null;
}

function getDb(){
  return window.MSDB || null;
}

/* ===================== STATE ===================== */

var STATE = {
  connStatus: "connecting", // connecting | ok | error
  adminState: null,
  showWelcome: false,  // true למשך כמה שניות מיד אחרי הקלדת השם, בזמן שמסך הפתיחה מוצג
  entryNameError: false, // true כשניסו לשלוח את מסך הכניסה עם שם חלקי (לא פרטי+משפחה)
  myVotes: {},        // song -> candidate n
  myBest: null,        // song n chosen as best
  myWarmup: undefined,  // undefined=טרם נבדק מול השרת, null=נבדק ואין תשובה, מספר=התשובה שנשלחה
  selectedCandidate: null,
  selectedBest: null,
  selectedWarmup: null,
  stats: null,         // cached aggregation
  statsLoading: false,
  isAdmin: !!window.MS_DEFAULT_ADMIN, // index.html=false, admin.html=true (see בסוף הקובץ)
  adminAuthed: sessionStorage.getItem("ms_admin_authed") === "1",
  pinInput: "",
  pinError: false,
  adminVoteCount: null,
  adminParticipantCount: null,
  adminParticipants: null,
  adminWarmup: null,   // {total, counts:{n->count}} — תוצאות שאלת החימום, מתעדכן חי
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
  } else if(STATE.showWelcome){
    inner = viewWelcome();
  } else if(!STATE.adminState){
    inner = viewLoading("טוען את מצב האירוע…");
  } else {
    var st = STATE.adminState;
    if(st.stage === "warmup") inner = viewWarmup(st);
    else if(st.stage === "voting") inner = viewVoting(st);
    else if(st.stage === "recap") inner = viewRecap();
    else if(st.stage === "finalVote") inner = viewFinalVote();
    else if(st.stage === "reveal") inner = viewReveal(st);
    else if(st.stage === "podium") inner = viewPodium(st);
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
    brandMarkHTML(78,34)+
    '<div class="eyebrow" style="margin-top:16px;">'+h(EVENT_NAME)+'</div>'+
    '<h1 class="page-title">הזמר<br>במסכה</h1>'+
    '<div class="sub">כדי להצטרף, הזינו <b style="color:var(--gold2);">שם פרטי ושם משפחה מלאים</b> — נצטרך אותם כדי לשמור את הניחושים והתוצאה האישית שלכם בסוף הערב.</div>'+
  '</div>'+
  '<form id="entry-form" style="margin-top:26px; display:flex; flex-direction:column; gap:10px;">'+
    '<input class="field" name="pname" placeholder="לדוגמה: ישראל ישראלי" required autocomplete="name">'+
    (STATE.entryNameError ? '<div style="color:var(--bad); font-size:13.5px; font-weight:700; text-align:center;">נא להזין שם פרטי ושם משפחה (שתי מילים לפחות)</div>' : '')+
    '<button class="btn btn-gold" type="submit" style="margin-top:4px;">כניסה לאירוע</button>'+
  '</form>'+
  '<div class="spacer"></div>'+
  '<div class="footer-note">בסריקת הקוד ובכניסה אני מאשר/ת השתתפות בתחרות הערב</div>';
}

/* מסך נחיתה שמוצג פעם אחת מיד לאחר הקלדת השם, לפני כל שלב אחר (כולל
   שאלת החימום) — כדי לפתוח את הערב בברכת פתיחה לפני שקופצים ישר
   לשאלה. אין כאן כפתור להמשך — המסך נעלם לבד אחרי כמה שניות (ראו
   ה-setTimeout ב-bindActions, submit של entry-form) וממשיכים לשלב
   הנוכחי כרגיל. */
function viewWelcome(){
  return ''+
  '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:18vh;">'+
    brandMarkHTML(88,38)+
    '<h1 class="page-title" style="margin-top:20px; font-size:27px;">'+h(WELCOME_TITLE)+'</h1>'+
    '<div class="sub" style="margin-top:10px;">מיד נתחיל בשאלת חימום קצרה לקהל</div>'+
  '</div>';
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

/* ===================== שאלת חימום (לפני תחילת ההצבעות) ===================== */

/* מציגה לקהל (בטלפון של כל אחד/ת) את התפלגות התשובות לשאלת החימום —
   מוצגת רק אחרי שהמנהל/ת בוחר/ת "הצגת התפלגות התשובות לקהל", בלי
   קשר לשאלה אם ההצבעה עדיין פתוחה או כבר נסגרה. הנתונים מגיעים דרך
   state/admin.warmupCounts, שהמנהל כותב אליו חי, כך שלכל מכשיר קהל
   מספיק להאזין למסמך שהוא כבר מאזין לו ממילא — בלי שאילתה נוספת. */
function viewWarmupResults(st){
  var wu = st.warmupCounts || {total:0, counts:{}};
  var rows = WARMUP_OPTIONS.map(function(o){
    var c = wu.counts[o.n] || 0;
    var pct = wu.total ? Math.round((c/wu.total)*100) : 0;
    return '<div class="card" style="margin-bottom:10px;">'+
      '<div style="display:flex; align-items:center; justify-content:space-between;">'+
        '<div style="font-weight:800; font-size:14.5px;">'+h(o.label)+'</div>'+
        '<div style="font-size:13px; font-weight:800; color:var(--gold2);">'+c+' ('+pct+'%)</div>'+
      '</div>'+
      '<div style="height:8px; border-radius:5px; background:var(--card2); margin-top:8px; overflow:hidden;">'+
        '<div style="height:100%; width:'+pct+'%; background:var(--gold); border-radius:5px;"></div>'+
      '</div>'+
    '</div>';
  }).join("");
  return ''+
  '<div class="eyebrow">שאלת חימום — התוצאות</div>'+
  '<h1 class="page-title" style="font-size:26px;">'+h(WARMUP_QUESTION)+'</h1>'+
  '<div class="sub">'+wu.total+' משתתפים ענו</div>'+
  '<div style="margin-top:20px;">'+rows+'</div>';
}

function viewWarmup(st){
  if(!WARMUP_OPTIONS.length){
    /* לא הוגדרה שאלת חימום ב-config.js (WARMUP_QUESTION/WARMUP_OPTIONS) —
       אין מה להציג, ממתינים בפשטות. */
    return viewLoading("ממתינים לתחילת הערב…");
  }

  if(st.warmupResultsVisible){
    return viewWarmupResults(st);
  }

  var already = STATE.myWarmup != null;

  if(already){
    var chosen = WARMUP_OPTIONS.filter(function(o){ return o.n === STATE.myWarmup; })[0];
    return ''+
    '<div style="margin-top:12vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      '<div style="width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 35%,#3a2e12,#140b28);border:2px solid var(--gold);">'+
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'+
      '</div>'+
      '<h1 class="page-title" style="margin-top:22px; font-size:26px;">התשובה נקלטה!</h1>'+
      '<div class="sub">בחרת: '+(chosen ? h(chosen.label) : '—')+'</div>'+
    '</div>'+
    (st.warmupOpen ?
      '<div style="margin-top:14px;"><button type="button" class="btn btn-outline" data-action="change-warmup" style="width:100%;">שינוי תשובה</button></div>'
    : '')+
    '<div class="spacer"></div>'+
    '<div class="footer-note">בקרוב מתחילים!</div>';
  }

  if(!st.warmupOpen){
    return ''+
    '<div style="margin-top:16vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      '<div class="eyebrow">שאלת חימום</div>'+
      '<h1 class="page-title" style="font-size:26px; margin-top:6px;">כמעט מתחילים…</h1>'+
      '<div class="sub">השאלה תיפתח מיד</div>'+
    '</div>';
  }

  var rows = WARMUP_OPTIONS.map(function(o){
    var sel = STATE.selectedWarmup === o.n;
    return '<button type="button" class="card2" data-action="pick-warmup" data-n="'+o.n+'" style="width:100%; text-align:right; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between;'+(sel?'border-color:var(--gold);background:rgba(224,178,88,.12);':'')+'">'+
      '<span style="font-size:14.5px; font-weight:700;">'+h(o.label)+'</span>'+
      (sel ? '<span class="dot" style="background:var(--gold); width:10px; height:10px; border-radius:50%; flex-shrink:0;"></span>' : '')+
    '</button>';
  }).join("");

  return ''+
  '<div class="eyebrow">שאלת חימום</div>'+
  '<h1 class="page-title" style="font-size:26px;">'+h(WARMUP_QUESTION)+'</h1>'+
  '<div style="margin-top:20px;">'+rows+'</div>'+
  '<div style="margin-top:6px;"><button class="btn btn-gold" data-action="submit-warmup" '+(STATE.selectedWarmup?'':'disabled')+'>שליחת תשובה</button></div>';
}

function viewVoting(st){
  var song = songById(st.currentSong);
  var alreadyVoted = STATE.myVotes[st.currentSong] != null;
  /* השיר האחרון בסדר ההופעות (המספר הגבוה ביותר ב-config.js) — אחריו
     אין "ביצוע הבא", אז לא מציגים לקהל הודעת המתנה שמרמזת שיש עוד. */
  var maxSongId = SONGS.reduce(function(m,s){ return Math.max(m, s.id); }, 0);
  var isLastSong = song && song.id === maxSongId;

  if(alreadyVoted){
    var myN = STATE.myVotes[st.currentSong];
    var myC = candByN(myN);
    return ''+
    '<div style="margin-top:10vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      '<div style="width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 35%,#3a2e12,#140b28);border:2px solid var(--gold);">'+
        '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'+
      '</div>'+
      '<h1 class="page-title" style="margin-top:22px; font-size:26px;">הניחוש נקלט!</h1>'+
      '<div class="sub">התשובה תתגלה בסוף הערב, יחד עם כל החשיפות</div>'+
    '</div>'+
    '<div class="card" style="margin-top:24px; display:flex; align-items:center; gap:14px;">'+
      (myC ? '<div class="avatar-wrap" style="width:48px;height:48px;flex-shrink:0;">'+avatarHTML(myC,48)+'</div>' : '')+
      '<div style="text-align:right; flex:1;">'+
        '<div style="font-size:12px; color:var(--ink-dim);">הניחוש שלך — ביצוע '+song.id+' ('+h(song.name)+')</div>'+
        '<div style="font-size:16px; font-weight:800;">'+(myC ? '#'+myC.n+' · '+h(myC.name) : '—')+'</div>'+
      '</div>'+
    '</div>'+
    /* כל עוד ההצבעה על הביצוע הזה עדיין פתוחה (המנחה לא סגר אותה),
       מאפשרים להתחרט ולבחור מחדש — לחיצה פשוט פותחת שוב את רשת
       הבחירה, עם הבחירה הקודמת מסומנת; שליחה חוזרת דורסת (set) את
       אותה רשומת הצבעה, כולל עדכון זמן ההצבעה. */
    (st.votingOpen ? '<div style="margin-top:16px; display:flex; justify-content:center;">'+votingCountdownHTML(st)+'</div>' : '')+
    (st.votingOpen ?
      '<div style="margin-top:14px;"><button type="button" class="btn btn-outline" data-action="change-vote" style="width:100%;">שינוי הניחוש</button></div>'
    : '')+
    '<div class="spacer"></div>'+
    (isLastSong ? '' : '<div class="card2" style="display:flex; align-items:center; gap:10px; justify-content:center;"><span class="dot warn"></span><span style="font-size:13.5px; color:var(--ink-dim);">ממתינים לביצוע הבא…</span></div>');
  }

  if(!st.votingOpen){
    return ''+
    '<div style="margin-top:16vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      songBadgeHTML(song,70)+
      '<h1 class="page-title" style="margin-top:18px; font-size:26px;">ההצבעה עוד לא נפתחה</h1>'+
      '<div class="sub">ביצוע '+song.id+' מתוך 6 · '+h(song.name)+'<br>ההצבעה תיפתח מיד לאחר סיום השיר</div>'+
    '</div>';
  }

  /* כותרת גדולה ומודגשת שממקדת מי בעל החיים שמנחשים עליו כרגע —
     שם השיר עצמו הוא הכותרת הראשית (H1), לא רק שורת תת-כותרת קטנה. */
  return ''+
  '<div style="display:flex; align-items:center; gap:14px;">'+
    songBadgeHTML(song,58)+
    '<div>'+
      '<span class="eyebrow">ביצוע '+song.id+' מתוך 6</span>'+
      '<h1 class="page-title" style="font-size:32px; margin-top:2px;">'+h(song.name)+'</h1>'+
    '</div>'+
  '</div>'+
  '<div style="margin-top:14px; display:flex; justify-content:center;">'+votingCountdownHTML(st)+'</div>'+
  '<div class="sub" style="margin-top:8px;">מי מסתתר מתחת למסכה?</div>'+
  candGridHTML(candidatesForSong(song), function(){return STATE.selectedCandidate;}, "pick-candidate")+
  /* מרווח בתחתית כדי שהשורה האחרונה של המועמדים לא תיחבא מאחורי
     סרגל השליחה הקבוע (ראו למטה). */
  '<div style="height:84px;"></div>'+
  /* סרגל שליחה קבוע בתחתית המסך: כשיש 20 מועמדים, כפתור השליחה
     נשאר תמיד גלוי בלי צורך לגלול עד סוף הרשת. */
  '<div style="position:fixed; bottom:0; left:0; right:0; display:flex; justify-content:center; background:var(--bg); border-top:1px solid var(--line); padding:14px 22px calc(14px + env(safe-area-inset-bottom, 0px)); z-index:5;">'+
    '<div style="width:100%; max-width:416px;">'+
      '<button class="btn btn-gold" data-action="submit-vote" '+(STATE.selectedCandidate?'':'disabled')+'>שליחת ניחוש</button>'+
    '</div>'+
  '</div>';
}

function viewRecap(){
  var rows = SONGS.map(function(s){
    return '<div class="row-card">'+
      songBadgeHTML(s,40)+
      '<div style="flex:1; font-weight:700; font-size:14.5px;">'+h(s.name)+'</div>'+
      '<div style="width:26px;height:26px;border-radius:50%;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--gold2);">'+s.id+'</div>'+
    '</div>';
  }).join("");
  return ''+
  '<div class="eyebrow">לפני ההצבעה הבאה</div>'+
  '<h1 class="page-title" style="font-size:26px;">כך נראה הערב עד עכשיו</h1>'+
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
      '<h1 class="page-title" style="margin-top:22px; font-size:26px;">ההצבעה נקלטה!</h1>'+
      '<div class="sub">בחרת ב'+h(s.name)+' כביצוע הכי טוב של הערב</div>'+
    '</div>'+
    '<div class="spacer"></div>'+
    '<div class="footer-note">בקרוב: רצף החשיפות</div>';
  }
  var cards = SONGS.map(function(s){
    var sel = STATE.selectedBest === s.id;
    return '<button type="button" class="card2" data-action="pick-best" data-n="'+s.id+'" style="display:flex;flex-direction:column;align-items:center;gap:8px;'+(sel?'border-color:var(--gold);background:rgba(224,178,88,.12);':'')+'">'+
      songBadgeHTML(s,64)+
      '<div style="font-size:12.5px; font-weight:800;">'+h(s.name)+' · '+s.id+'</div>'+
    '</button>';
  }).join("");
  return ''+
  '<div class="eyebrow">הצבעה סופית</div>'+
  '<h1 class="page-title" style="font-size:26px;">מי היה הביצוע הכי טוב?</h1>'+
  '<div class="sub">בחרו אחד מתוך 6</div>'+
  '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:18px;">'+cards+'</div>'+
  '<div style="margin-top:20px;"><button class="btn btn-gold" data-action="submit-best" '+(STATE.selectedBest?'':'disabled')+'>שליחת הצבעה</button></div>';
}

function viewReveal(st){
  var ca = st.correctAnswers || {};
  var curSong = st.currentRevealSong;
  if(!curSong){
    return ''+
    '<div style="margin-top:16vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      '<div class="eyebrow">שלב החשיפות</div>'+
      '<h1 class="page-title" style="font-size:26px; margin-top:6px;">מיד מתחילים לחשוף…</h1>'+
      '<div class="sub">עקבו אחרי המסך הראשי באולם</div>'+
    '</div>';
  }
  var songTeaser = songById(curSong);
  if(ca[curSong] == null){
    /* "הוכרז" — הבקר/ית סימנ/ה מי הביצוע הבא, אבל התשובה עצמה עדיין
       לא נחשפת לקהל. זה הרגע של המנחה/ה על הבמה: אומר/ת בקול מי
       עומדים לחשוף עכשיו, אולי אפילו שואל/ת את הקהל לנחש בקול רם —
       ורק אחרי זה, בלחיצה נפרדת של הבקר/ית, המסך הזה יתחלף בתשובה
       בפועל. */
    return ''+
    '<div style="text-align:center; margin-top:10vh;">'+
      '<div class="eyebrow">חשיפה הבאה</div>'+
      '<div class="song-icon-badge" style="width:96px;height:96px;margin:22px auto 0;background:'+songTeaser.bg+';"><svg width="42" height="42" viewBox="0 0 40 40" fill="none" stroke="'+songTeaser.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+songTeaser.path+'</svg></div>'+
      '<h1 class="page-title" style="margin-top:20px;">ביצוע '+songTeaser.id+' · '+h(songTeaser.name)+'</h1>'+
      '<div class="sub" style="margin-top:8px;">מי מסתתר מתחת למסכה הזו?<br>עקבו אחרי המנחה/ה על הבמה…</div>'+
    '</div>';
  }
  var song = songTeaser;
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
    (st.revealPct && st.revealPct[curSong] != null ?
      '<div class="sub" style="margin-top:12px; font-weight:800; color:var(--gold2); font-size:17px;">'+st.revealPct[curSong]+'% מהקהל זיהו נכון את מי שמסתתר מתחת למסכה</div>'
    : '')+
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
  '<h1 class="page-title" style="font-size:26px;">התוצאות שלך</h1>'+
  '<div class="stat-tiles" style="margin-top:18px;">'+
    '<div class="stat-tile"><div class="num">'+me.rank+'</div><div class="lbl">המיקום שלך מתוך '+stats.totalParticipants+'</div></div>'+
    '<div class="stat-tile"><div class="num">'+me.correct+'/6</div><div class="lbl">ניחושים נכונים</div></div>'+
  '</div>'+
  '<div class="sub" style="margin-top:18px; font-weight:700; color:var(--ink);">פירוט הניחושים שלך</div>'+
  '<div style="margin-top:10px;">'+rows+'</div>'+
  '<div class="spacer"></div>'+
  '<div class="footer-note">בקרוב: לוחות התוצאות של כל האירוע</div>';
}

/* לוח התוצאות שמוצג לקהל מציג רק את המנחשים המובילים (מי זיהו הכי
   הרבה זמרים נכון, עד 15 מקומות) — "מי זיהו הכי טוב" לפי שיר כבר
   מוצג תוך כדי מסכי החשיפה עצמם (viewReveal), ו"הביצוע הכי טוב" מוצג
   בנפרד, מקום אחרי מקום, במסך הפודיום הייעודי (viewPodium) — ולכן
   שניהם לא חוזרים כאן כרשימה. */
function viewLeaderboards(st){
  if(STATE.statsLoading || !STATE.stats){
    if(!STATE.statsLoading) loadStats(st);
    return viewLoading("מרכיבים את הלוח…");
  }
  var stats = STATE.stats;
  var TOP_N = 15;
  var ranked = stats.rankedParticipants.slice(0, TOP_N);
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
  if(myEntry && myEntry.rank > TOP_N){
    myRow = '<div style="text-align:center; color:var(--ink-dim); font-size:16px; margin:6px 0;">⋮</div>'+
      '<div class="lb-row me"><div class="lb-rank">'+myEntry.rank+'</div><div class="lb-avatar">את/ה</div><div style="flex:1; font-size:13.5px; font-weight:700;">המיקום שלך</div><div style="font-size:12.5px; font-weight:800; color:var(--gold2);">'+myEntry.correct+'/6</div></div>';
  }

  return ''+
  '<div class="eyebrow">לוח תוצאות</div>'+
  '<h1 class="page-title" style="font-size:26px;">'+TOP_N+' המנחשים המובילים של הערב</h1>'+
  '<div style="margin-top:16px;">'+rows+myRow+'</div>'+
  '<div style="margin-top:20px;"><button class="btn btn-outline" data-action="refresh-stats">רענון נתונים</button></div>';
}

/* ===================== פודיום — הביצוע הכי טוב (מקום 3, 2, 1) ===================== */

/* מציגה לקהל מקום אחד בכל פעם (שלישי → שני → ראשון), לפי podiumStep
   ב-state/admin שהמנהל/ת שולט/ת בו — בדיוק כמו רצף החשיפות, כדי
   ליצור רגע דרמטי במקום להציג את כל הדירוג כרשימה אחת. הדירוג עצמו
   מחושב מתוך אותה הצבעת "best" (bestVotes) שכבר נאספת ב-loadStats. */
function viewPodium(st){
  if(STATE.statsLoading || !STATE.stats){
    if(!STATE.statsLoading) loadStats(st);
    return viewLoading("סופרים הצבעות…");
  }
  var stats = STATE.stats;
  var ranked = SONGS.map(function(s){ return {s:s, cnt: stats.bestVotes[s.id]||0}; })
    .sort(function(a,b){ return b.cnt - a.cnt; });
  var totalBest = ranked.reduce(function(sum,x){ return sum + x.cnt; }, 0);

  var step = st.podiumStep || 0;
  if(!step){
    return ''+
    '<div style="margin-top:18vh; display:flex; flex-direction:column; align-items:center; text-align:center;">'+
      '<div class="eyebrow">הביצוע הכי טוב של הערב</div>'+
      '<h1 class="page-title" style="font-size:26px; margin-top:6px;">מיד חושפים את הזוכים…</h1>'+
      '<div class="sub">עקבו אחרי המסך הראשי באולם</div>'+
    '</div>';
  }

  var placeMap = {1:{idx:2,label:"מקום שלישי 🥉"}, 2:{idx:1,label:"מקום שני 🥈"}, 3:{idx:0,label:"מקום ראשון 🏆"}};
  var cur = placeMap[step] || placeMap[3];
  var entry = ranked[cur.idx];
  if(!entry){
    return viewLoading("אין מספיק נתונים כדי להציג את הפודיום…");
  }
  var s = entry.s;
  var pct = totalBest ? Math.round(100*entry.cnt/totalBest) : 0;
  var badgeInner = s.costumePhoto ?
    '<img src="'+h(s.costumePhoto)+'" alt="'+h(s.name)+'" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">'+
    '<span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;"><svg width="46" height="46" viewBox="0 0 40 40" fill="none" stroke="'+s.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+s.path+'</svg></span>'
  : '<svg width="46" height="46" viewBox="0 0 40 40" fill="none" stroke="'+s.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+s.path+'</svg>';

  return ''+
  '<div style="text-align:center; margin-top:6vh;">'+
    '<div class="eyebrow">הביצוע הכי טוב של הערב</div>'+
    '<h1 class="page-title" style="margin-top:6px;">'+cur.label+'</h1>'+
    '<div class="hero-avatar" style="width:150px;height:150px;margin-top:22px;border:3px solid var(--gold); background:'+s.bg+'; overflow:hidden;">'+badgeInner+'</div>'+
    '<h1 class="page-title" style="margin-top:20px;">'+h(s.name)+'</h1>'+
    '<div class="sub">'+entry.cnt+' קולות · '+pct+'% מההצבעות</div>'+
  '</div>';
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
  var st = STATE.adminState || {};
  var savedAnswerKey = st.answerKey || {};
  var answerKey = {};
  SONGS.forEach(function(s){
    /* סדר עדיפות: מה שהמנהל/ת בחר/ה עכשיו בפועל > מה ששמור כבר
       ב-Firestore מפעם קודמת > הערך הקבוע מראש מ-config.js
       (song.revealAnswer) — כך שאם כבר ידוע מראש מי מסתתר מתחת לכל
       מסכה, אין צורך לבחור את זה שוב בכל בדיקה/איפוס. */
    var v = STATE.adminRevealPick[s.id] || savedAnswerKey[s.id] || s.revealAnswer;
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
    var pctPercent = {}; // אותו נתון, מעוגל לאחוזים שלמים — נשמר ב-state/admin כדי שהקהל יוכל להציג אותו בכל מסך חשיפה בלי שאילתה נוספת
    snaps.forEach(function(snap, idx){
      var sid = songIds[idx];
      var total = snap.size, correct = 0;
      snap.docs.forEach(function(d){
        var data = d.data() || {};
        if(data.candidate === answerKey[sid]) correct++;
      });
      pct[sid] = total ? correct/total : 0;
      pctPercent[sid] = Math.round(pct[sid]*100);
    });
    var order = songIds.slice().sort(function(a,b){ return pct[b]-pct[a]; });
    database.doc("state/admin").update({answerKey:answerKey, revealOrder:order, revealPct:pctPercent});
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
      '<div class="admin-h" style="margin-bottom:8px;">לפני שמתחילים</div>'+
      '<div style="display:flex; flex-direction:column; gap:8px;">'+
        stageBtn("שאלת חימום לקהל", st.stage==="warmup", "admin-set-stage", 'data-stage="warmup"')+
      '</div>'+
    '</div>'+
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
        stageBtn("פודיום — הביצוע הכי טוב", st.stage==="podium", "admin-set-stage", 'data-stage="podium"')+
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
  if(st.stage === "warmup"){
    if(!WARMUP_OPTIONS.length){
      return '<div class="admin-main">'+
        '<div class="admin-h">שאלת חימום</div>'+
        '<h1 class="page-title">לא הוגדרה שאלת חימום</h1>'+
        '<div class="sub">כדי להפעיל שלב זה, מוסיפים ב-config.js את השדות WARMUP_QUESTION ו-WARMUP_OPTIONS (ראו את ההסבר שנשלח בנפרד).</div>'+
      '</div>';
    }
    var wu = STATE.adminWarmup || {total:0, counts:{}};
    var wRows = WARMUP_OPTIONS.map(function(o){
      var c = wu.counts[o.n] || 0;
      var pct = wu.total ? Math.round((c/wu.total)*100) : 0;
      return '<div class="card" style="margin-bottom:10px;">'+
        '<div style="display:flex; align-items:center; justify-content:space-between;">'+
          '<div style="font-weight:800; font-size:14px;">'+h(o.label)+'</div>'+
          '<div style="font-size:13px; font-weight:800; color:var(--gold2);">'+c+' ('+pct+'%)</div>'+
        '</div>'+
        '<div style="height:8px; border-radius:5px; background:var(--card2); margin-top:8px; overflow:hidden;">'+
          '<div style="height:100%; width:'+pct+'%; background:var(--gold); border-radius:5px;"></div>'+
        '</div>'+
      '</div>';
    }).join("");
    return '<div class="admin-main">'+
      '<div class="admin-h">שלב נוכחי</div>'+
      '<h1 class="page-title">שאלת חימום לקהל</h1>'+
      '<div class="sub" style="margin-top:6px;">'+h(WARMUP_QUESTION)+'</div>'+
      '<div style="display:flex; gap:12px; margin-top:20px;">'+
        '<button class="btn '+(st.warmupOpen?'btn-outline':'btn-gold')+'" style="width:auto; padding:14px 22px;" data-action="admin-toggle-warmup" data-open="1">פתיחת שאלה</button>'+
        '<button class="btn '+(!st.warmupOpen?'btn-outline':'btn-gold')+'" style="width:auto; padding:14px 22px;" data-action="admin-toggle-warmup" data-open="0">סגירת שאלה</button>'+
      '</div>'+
      '<div class="card" style="margin-top:24px; max-width:420px;">'+
        '<div style="font-size:12.5px; color:var(--ink-dim);">סה"כ ענו</div>'+
        '<div style="font-size:34px; font-weight:900; margin-top:6px; font-variant-numeric:tabular-nums;">'+wu.total+'</div>'+
      '</div>'+
      '<div style="margin-top:20px; max-width:420px;">'+wRows+'</div>'+
      '<div class="sub" style="margin-top:10px;">מצב שאלה: <b style="color:'+(st.warmupOpen?"var(--ok)":"var(--bad)")+';">'+(st.warmupOpen?'פתוחה':'סגורה')+'</b> — התוצאות כאן מתעדכנות חי בכל מקרה, ואפשר להקרין את המסך הזה לקהל.</div>'+
      '<div style="margin-top:18px; max-width:420px;">'+
        '<div class="admin-h" style="margin-bottom:8px;">הצגת התוצאות במסך הקהל (בטלפונים שלהם)</div>'+
        '<button type="button" class="btn '+(st.warmupResultsVisible?'btn-outline':'btn-gold')+'" data-action="admin-toggle-warmup-results" data-open="1">הצגת התפלגות התשובות לקהל</button>'+
        (st.warmupResultsVisible ?
          '<div style="margin-top:10px;"><button type="button" class="btn btn-outline" data-action="admin-toggle-warmup-results" data-open="0">הסתרת התוצאות מהקהל</button></div>'
        : '')+
      '</div>'+
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
      '<div style="display:flex; gap:16px; margin-top:24px; flex-wrap:wrap; align-items:flex-start;">'+
        '<div class="card" style="max-width:420px;">'+
          '<div style="font-size:12.5px; color:var(--ink-dim);">הצבעות שהתקבלו לביצוע זה</div>'+
          '<div style="font-size:34px; font-weight:900; margin-top:6px; font-variant-numeric:tabular-nums;">'+(cnt==null?'…':cnt)+'</div>'+
        '</div>'+
        (st.votingOpen ? '<div class="card" style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 22px;"><div style="font-size:12.5px; color:var(--ink-dim);">זמן שנותר</div>'+votingCountdownHTML(st)+'</div>' : '')+
      '</div>'+
      '<div class="sub" style="margin-top:22px;">מצב הצבעה: <b style="color:'+(st.votingOpen?"var(--ok)":"var(--bad)")+';">'+(st.votingOpen?'פתוחה':'סגורה')+'</b>'+(st.votingOpen?' — ננעלת אוטומטית בתום '+VOTING_DURATION_SEC+' שניות, ואפשר גם לסגור ידנית לפני כן.':'')+'</div>'+
    '</div>';
  }

  if(st.stage === "reveal"){
    var order = st.revealOrder;

    if(!order){
      /* ---- phase A: pick who's under each mask (private — not shown to audience) ---- */
      var rows = SONGS.map(function(s){
        var savedN = st.answerKey && st.answerKey[s.id];
        /* אם ידוע מראש מי מסתתר מתחת למסכה הזו (song.revealAnswer
           ב-config.js), משתמשים בזה כברירת מחדל — כדי שלא יהיה
           צורך לבחור את זה שוב בכל בדיקה/איפוס. עדיין אפשר לשנות
           ידנית מהתפריט אם צריך. */
        var pickN = STATE.adminRevealPick[s.id] || savedN || s.revealAnswer || "";
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

    /* ---- phase B: sequential reveal in the computed order ----
       שני צעדים נפרדים לכל ביצוע, כדי להתאים לקצב של המנחה/ה על
       הבמה ולא של הבקר/ית מאחורי המסך:
         1) "הכרזה" — מסמנים איזה ביצוע עולה עכשיו; מסך הקהל מציג רק
            את שם/אייקון הביצוע ("מי מסתתר מתחת למסכה הזו?"), בלי
            התשובה, כדי שהמנחה/ה יוכל/תוכל להגיד את זה בקול ולתת
            לקהל לנחש בקול רם.
         2) "חשיפת התשובה" — לחיצה נפרדת שרק אחריה מסך הקהל מתחלף
            ומראה בפועל מי הסתתר מתחת למסכה. */
    var ca = st.correctAnswers || {};
    var pendingSong = (st.currentRevealSong != null && ca[st.currentRevealSong] == null) ? st.currentRevealSong : null;
    var nextToAnnounce = pendingSong == null ? order.filter(function(s){ return ca[s] == null; })[0] : null;
    var rows2 = order.map(function(sid, i){
      var s = songById(sid);
      var c = candByN(st.answerKey[sid]);
      var revealed = ca[sid] != null;
      var isPending = sid === pendingSong;
      var isNext = sid === nextToAnnounce;
      var statusLabel = revealed ? "נחשף לקהל" : (isPending ? "הוכרז — ממתין לחשיפה" : (isNext ? "הבא בתור" : "ממתין"));
      return '<div class="card" style="display:flex; align-items:center; gap:14px; margin-bottom:10px;'+((isPending||isNext)?'border-color:var(--gold);':'')+(revealed?'opacity:.6;':'')+'">'+
        '<div style="width:24px; text-align:center; font-weight:800; color:var(--gold2);">'+(i+1)+'</div>'+
        '<div class="song-icon-badge" style="background:'+s.bg+';"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="'+s.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+s.path+'</svg></div>'+
        '<div style="flex:1;"><div style="font-weight:800; font-size:13.5px;">'+s.id+' · '+h(s.name)+'</div><div style="font-size:11.5px; color:var(--ink-dim);">'+(c?h(c.name):'')+'</div></div>'+
        '<div style="font-size:11.5px; font-weight:700; padding:5px 10px; border-radius:8px; background:var(--card2); color:'+(revealed?'var(--ok)':'var(--gold2)')+';">'+statusLabel+'</div>'+
      '</div>';
    }).join("");
    return '<div class="admin-main">'+
      '<div class="admin-h">רצף חשיפות · שלב 2</div>'+
      '<h1 class="page-title">סדר החשיפה (מהזיהוי הגבוה ביותר לנמוך ביותר)</h1>'+
      '<div class="sub">הסדר חושב אוטומטית לפי אחוז הקהל שזיהה נכון כל ביצוע. לכל ביצוע שני כפתורים: "הכרזה" מציגה לקהל רק איזה ביצוע עולה עכשיו (בלי התשובה) כדי שהמנחה/ה יגיד/תגיד את זה בקול; "חשיפת התשובה" היא לחיצה נפרדת שרק אחריה הקהל רואה בפועל מי הסתתר מתחת למסכה.</div>'+
      '<div style="margin-top:20px; max-width:640px;">'+rows2+'</div>'+
      (pendingSong != null ?
        '<div class="card2" style="display:flex; align-items:center; gap:10px; padding:12px 16px; max-width:640px; margin-bottom:12px;"><span class="dot warn"></span><span style="font-size:13px;">הוכרז לקהל: '+h(songById(pendingSong).name)+' — ממתין ללחיצה על "חשיפת התשובה"</span></div>'
      : '')+
      '<div style="display:flex; gap:12px; max-width:640px; flex-wrap:wrap;">'+
        '<button class="btn btn-outline" data-action="admin-reveal-announce" '+(nextToAnnounce==null?'disabled':'')+'>'+(nextToAnnounce==null?(pendingSong!=null?'ביצוע הבא כבר הוכרז':'כל הביצועים הוכרזו'):'הכרזה על הביצוע הבא — '+h(songById(nextToAnnounce).name))+'</button>'+
        '<button class="btn btn-gold" data-action="admin-reveal-confirm" '+(pendingSong==null?'disabled':'')+'>חשיפת התשובה לקהל</button>'+
      '</div>'+
      '<div style="margin-top:14px;"><button class="btn btn-outline" style="width:auto; padding:12px 16px;" data-action="admin-reveal-order-reset">חשב מחדש</button></div>'+
    '</div>';
  }

  if(st.stage === "podium"){
    if(STATE.statsLoading || !STATE.stats){
      if(!STATE.statsLoading) loadStats(st);
      return '<div class="admin-main">'+viewLoading("סופרים הצבעות…")+'</div>';
    }
    var pStats = STATE.stats;
    var pRanked = SONGS.map(function(s){ return {s:s, cnt: pStats.bestVotes[s.id]||0}; }).sort(function(a,b){ return b.cnt - a.cnt; });
    var pTotal = pRanked.reduce(function(sum,x){ return sum + x.cnt; }, 0);
    var pRows = pRanked.map(function(x,i){
      var pct = pTotal ? Math.round(100*x.cnt/pTotal) : 0;
      return '<div class="row-card">'+
        '<div style="width:26px; text-align:center; font-weight:800; color:var(--gold2);">'+(i+1)+'</div>'+
        '<div class="song-icon-badge" style="background:'+x.s.bg+';"><svg width="18" height="18" viewBox="0 0 40 40" fill="none" stroke="'+x.s.stroke+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+x.s.path+'</svg></div>'+
        '<div style="flex:1; font-weight:700; font-size:13.5px;">'+h(x.s.name)+'</div>'+
        '<div style="font-size:12px; font-weight:800; color:var(--gold2);">'+x.cnt+' ('+pct+'%)</div>'+
      '</div>';
    }).join("");
    var pStep = st.podiumStep || 0;
    var pStatusLabel = pStep===0 ? "טרם נחשף דבר" : (pStep===1 ? "מקום שלישי גלוי לקהל" : (pStep===2 ? "מקום שני גלוי לקהל" : "מקום ראשון גלוי לקהל"));
    return '<div class="admin-main">'+
      '<div class="admin-h">פודיום — הביצוע הכי טוב</div>'+
      '<h1 class="page-title">חשיפת הזוכים לקהל</h1>'+
      '<div class="sub">הדירוג המלא כאן גלוי רק לך. לוחצים בסדר — שלישי, שני, ראשון — כדי לחשוף לקהל מקום אחרי מקום, כל אחד במסך נפרד.</div>'+
      '<div style="margin-top:16px; max-width:420px;">'+pRows+'</div>'+
      '<div style="display:flex; gap:10px; margin-top:22px; flex-wrap:wrap;">'+
        '<button class="btn '+(pStep===1?'btn-outline':'btn-gold')+'" style="width:auto; padding:14px 18px;" data-action="admin-podium-step" data-step="1">חשיפת מקום שלישי</button>'+
        '<button class="btn '+(pStep===2?'btn-outline':'btn-gold')+'" style="width:auto; padding:14px 18px;" data-action="admin-podium-step" data-step="2">חשיפת מקום שני</button>'+
        '<button class="btn '+(pStep===3?'btn-outline':'btn-gold')+'" style="width:auto; padding:14px 18px;" data-action="admin-podium-step" data-step="3">חשיפת מקום ראשון</button>'+
        '<button class="btn btn-outline" style="width:auto; padding:14px 18px; color:var(--bad); border-color:rgba(226,131,111,.4);" data-action="admin-podium-step" data-step="0">איפוס פודיום</button>'+
      '</div>'+
      '<div class="sub" style="margin-top:14px;">מצב נוכחי בקהל: <b style="color:var(--gold2);">'+pStatusLabel+'</b></div>'+
    '</div>';
  }

  var stageLabels = {warmup:"שאלת חימום לקהל", recap:"תזכורת לקהל", finalVote:"הצבעה לביצוע הכי טוב", summary:"סיכום אישי לקהל", leaderboards:"לוחות תוצאות לקהל"};
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
      var v = entryForm.pname.value.trim().replace(/\s+/g," ");
      if(!v) return;
      /* דורשים שם מלא (לפחות שתי מילים — שם פרטי ושם משפחה), כדי
         שאפשר יהיה לזהות בבירור מי זה מי בדירוגים ובתוצאות. */
      if(v.indexOf(" ") === -1){
        STATE.entryNameError = true;
        render();
        return;
      }
      STATE.entryNameError = false;
      setParticipantName(v);
      ensureParticipantDoc();
      STATE.showWelcome = true;
      render();
      /* בלי כפתור "בואו נתחיל" — מסך הפתיחה נעלם לבד אחרי כמה שניות
         וממשיכים אוטומטית לשלב הנוכחי (למשל שאלת החימום). */
      setTimeout(function(){
        STATE.showWelcome = false;
        render();
      }, 2600);
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
  } else if(action === "change-vote"){
    if(!STATE.adminState || !STATE.adminState.votingOpen) return; // ליתר ביטחון — לא לאפשר שינוי אחרי שההצבעה נסגרה
    var curSong = STATE.adminState.currentSong;
    STATE.selectedCandidate = STATE.myVotes[curSong]; // הבחירה הקודמת מסומנת מראש ברשת
    STATE.myVotes[curSong] = null; // מקומית בלבד — עדיין לא נמחק כלום ב-Firestore עד לשליחה מחדש
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
  } else if(action === "pick-warmup"){
    STATE.selectedWarmup = Number(el.dataset.n);
    render();
  } else if(action === "change-warmup"){
    if(!STATE.adminState || !STATE.adminState.warmupOpen) return; // לא לאפשר שינוי אחרי שהשאלה נסגרה
    STATE.selectedWarmup = STATE.myWarmup;
    STATE.myWarmup = null;
    render();
  } else if(action === "submit-warmup"){
    if(!database || STATE.selectedWarmup == null) return;
    var wn = STATE.selectedWarmup;
    el.disabled = true;
    database.doc("warmupVotes/"+pid).set({pid:pid, choice:wn, ts:Date.now()}).then(function(){
      STATE.myWarmup = wn;
      STATE.selectedWarmup = null;
      render();
    });
  } else if(action === "admin-toggle-warmup"){
    if(!database) return;
    database.doc("state/admin").update({warmupOpen: el.dataset.open === "1"});
  } else if(action === "admin-toggle-warmup-results"){
    if(!database) return;
    database.doc("state/admin").update({warmupResultsVisible: el.dataset.open === "1"});
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
  } else if(action === "admin-reveal-announce"){
    /* צעד 1: מסמנים לקהל איזה ביצוע עולה עכשיו, בלי לגלות את
       התשובה — כדי לתת למנחה/ה של הערב את הרגע להגיד את זה בקול. */
    if(!database) return;
    var sttA = STATE.adminState;
    var ordrA = sttA.revealOrder || [];
    var caA = sttA.correctAnswers || {};
    var pendingA = (sttA.currentRevealSong != null && caA[sttA.currentRevealSong] == null) ? sttA.currentRevealSong : null;
    if(pendingA != null) return; // כבר יש הכרזה שממתינה לחשיפה — לא מכריזים על הבא לפני שמסיימים איתה
    var nextA = ordrA.filter(function(s){ return caA[s] == null; })[0];
    if(nextA == null) return;
    database.doc("state/admin").update({currentRevealSong: nextA});
  } else if(action === "admin-reveal-confirm"){
    /* צעד 2: לחיצה נפרדת שרק אחריה מסך הקהל מתחלף ומראה בפועל מי
       הסתתר מתחת למסכה שהוכרזה. */
    if(!database) return;
    var sttC = STATE.adminState;
    var pendingC = sttC.currentRevealSong;
    var caC = sttC.correctAnswers || {};
    if(pendingC == null || caC[pendingC] != null) return;
    var patchC = {correctAnswers:{}};
    patchC.correctAnswers[pendingC] = sttC.answerKey[pendingC];
    database.doc("state/admin").update(patchC);
  } else if(action === "admin-reveal-order-reset"){
    if(!database) return;
    database.doc("state/admin").update({revealOrder:null, correctAnswers:{}, currentRevealSong:null, revealPct:null});
  } else if(action === "admin-podium-step"){
    if(!database) return;
    database.doc("state/admin").update({podiumStep: Number(el.dataset.step)});
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
  database.doc("state/admin").set({stage:"voting", currentSong:1, votingOpen:false, votingOpenedAt:null, currentRevealSong:null, correctAnswers:{}, answerKey:{}, revealOrder:null, revealPct:{}, podiumStep:0, resetEpoch: Date.now(), warmupOpen:false, warmupResultsVisible:false, warmupCounts:null});
  ["participants","votes","bestVotes","warmupVotes"].forEach(function(col){
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
      STATE.adminState = {stage:"voting", currentSong:1, votingOpen:false, votingOpenedAt:null, currentRevealSong:null, correctAnswers:{}, answerKey:{}, revealOrder:null, revealPct:{}, podiumStep:0, warmupOpen:false, warmupResultsVisible:false, warmupCounts:null};
      if(STATE.isAdmin && !ensuredAdminDoc){
        ensuredAdminDoc = true;
        database.doc("state/admin").set(STATE.adminState);
      }
    }
    var st = STATE.adminState;

    /* אם המנהל ביצע "איפוס האירוע" מאז שהמכשיר הזה נכנס בפעם האחרונה —
       resetEpoch ישתנה, ואנחנו שוכחים את הזהות המקומית (שם/הצבעות)
       כדי שהמשתתף/ת יחזרו למסך הקלדת השם ולא "יופיעו" ברשימות בלי
       שבאמת השתתפו אחרי האיפוס. */
    if(st.resetEpoch){
      var localEpoch = getLocalEpoch();
      if(localEpoch && localEpoch !== String(st.resetEpoch)){
        forgetParticipantIdentity();
      }
      setLocalEpoch(st.resetEpoch);
    }

    if(st.stage === "voting" && STATE.myVotes[st.currentSong] === undefined && getParticipantName()){
      fetchMyVote(st.currentSong);
    }
    if((st.stage === "reveal" || st.stage === "summary") && getParticipantName()){
      fetchAllMyVotes();
    }
    if(st.stage === "finalVote" && STATE.myBest === null && getParticipantName()){
      fetchMyBest();
    }
    if(st.stage === "warmup" && STATE.myWarmup === undefined && getParticipantName()){
      fetchMyWarmup();
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
function fetchMyWarmup(){
  var database = getDb();
  if(!database) return;
  database.doc("warmupVotes/"+pid).get().then(function(snap){
    STATE.myWarmup = snap.exists ? snap.data().choice : null;
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

  /* תוצאות שאלת החימום מתעדכנות חי, בלי קשר לשלב הנוכחי — כך שגם
     אחרי שעוברים הלאה, אפשר לחזור ולהציג את התוצאות המצטברות. */
  database.collection("warmupVotes").limit(1000).onSnapshot(function(snap){
    var counts = {};
    snap.docs.forEach(function(d){
      var data = d.data() || {};
      if(data.choice != null) counts[data.choice] = (counts[data.choice]||0) + 1;
    });
    STATE.adminWarmup = {total: snap.size, counts: counts};
    /* כותבים את הסיכום גם ל-state/admin, כדי שכל מכשירי הקהל (שכבר
       מאזינים למסמך הזה ממילא) יוכלו להציג את התוצאות בלי שכל טלפון
       יצטרך לשלוח שאילתה נפרדת ל-warmupVotes בעצמו. */
    database.doc("state/admin").update({warmupCounts: {total: snap.size, counts: counts}});
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
  startVotingTicker();
}

init();

})();
