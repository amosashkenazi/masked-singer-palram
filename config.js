/* ================================================================
   config.js — כל מה שכדאי לערוך לפני האירוע נמצא כאן, במקום אחד.
   שאר קבצי הקוד (app.js, db-adapter.js) לא צריכים להשתנות.
   ================================================================

   1) להחלפת השמות והתמונות של המועמדים/ות שמוצגים לקהל אחרי כל שיר:
      ערכו את מערך CANDIDATES למטה. לכל מועמד/ת אפשר להגדיר:

        n            מספר סידורי (1..20) — הוא גם המספר שמוצג על התג
                      בכרטיס הבחירה. חייב להישאר ייחודי ורציף.
        name          (חובה) השם שיוצג לקהל.
        photo         (רשות) אם ממלאים כאן נתיב/כתובת לתמונה — התמונה
                      תוצג לקהל במקום האווטאר המצויר. אפשר:
                        - להניח קובץ תמונה בתיקיית photos/ שלצד הקבצים
                          האלה, ולכתוב למשל: "photos/12.jpg"
                        - או להדביק כתובת אינטרנט מלאה לתמונה קיימת.
                      משאירים "" (מחרוזת ריקה) כדי להשתמש באווטאר
                      המצויר האוטומטי במקום תמונה אמיתית.
        skin / hair_color / hair_style / facial_hair / glasses
                      משפיעים רק על האווטאר המצויר האוטומטי (כאשר אין
                      photo). hair_style: "full" | "buzz" | "bald".
                      facial_hair: "none" | "mustache" | "beard" | "stubble".

      אפשר להשאיר בדיוק 20 מועמדים/ות, או לשנות את הכמות — רק חשוב
      שהמספרים (n) יהיו רצופים החל מ-1, ושהשם/התמונה שכתובים כאן
      יתאימו בדיוק למי שבאמת יופיע/תופיע על הבמה תחת אותו מספר.

   2) להחלפת שמות/צבעים/סמלים של 6 "השירים" (הביצועים) — מערך SONGS.

   3) קוד הכניסה למסך הניהול (admin.html) — ADMIN_PIN.
      זהו שכבת ההגנה היחידה על מסך הניהול, ולכן מומלץ:
        - לשנות אותו לקוד שאינו נחוש (לא "2026"/"0000" וכו').
        - לא לשתף את קישור admin.html באותו ערוץ שבו משתפים את
          הקישור לקהל (index.html).

   4) פרטי החיבור לפרויקט ה-Firebase שלכם — FIREBASE_CONFIG.
      את הערכים האלה מקבלים מקונסולת Firebase לאחר יצירת פרויקט
      ואפליקציית Web בתוכו — ההוראות המלאות נמצאות ב-README.md.
   ================================================================ */

window.MS_CONFIG = {

  EVENT_NAME: "נופש החברה 2026",

  ADMIN_PIN: "2026",

  SONGS: [
    {id:1, name:"החיפושית", bg:"#173a1c", stroke:"#a8e6ae",
      path:'<circle cx="20" cy="24" r="10"/><path d="M20 14 L20 34"/><circle cx="20" cy="11" r="4"/>'},
    {id:2, name:"האריה", bg:"#5a3c14", stroke:"#f0c675",
      path:'<circle cx="20" cy="22" r="7"/><path d="M20 8 L23 14 M20 8 L17 14"/>'},
    {id:3, name:"התרנגולת", bg:"#4a1414", stroke:"#f5b0a0",
      path:'<ellipse cx="17" cy="25" rx="9" ry="7"/><circle cx="26" cy="15" r="6"/>'},
    {id:4, name:"הפיל", bg:"#2c2c3a", stroke:"#dcdcf0",
      path:'<circle cx="19" cy="18" r="9"/><circle cx="8" cy="15" r="7"/>'},
    {id:5, name:"אלף", bg:"#3a2410", stroke:"#f0c896",
      path:'<circle cx="20" cy="20" r="10"/><path d="M14 11 L11 5 M26 11 L29 5"/><ellipse cx="20" cy="24" rx="5" ry="4"/>'},
    {id:6, name:"הפנדה", bg:"#1c1c1c", stroke:"#ffffff",
      path:'<circle cx="20" cy="20" r="9"/><circle cx="9" cy="10" r="5"/><circle cx="31" cy="10" r="5"/>'}
  ],

  CANDIDATES: [
    {n:1,  name:"רפי כהן",         photo:"", skin:"#8d5524", hair_color:"#5c4033", hair_style:"buzz", facial_hair:"stubble",  glasses:false},
    {n:2,  name:"יובל רובינסון",    photo:"", skin:"#8d5524", hair_color:"#d4d4d4", hair_style:"buzz", facial_hair:"none",     glasses:false},
    {n:3,  name:"אדם בוחבוט",       photo:"", skin:"#8d5524", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"beard",    glasses:true},
    {n:4,  name:"אמיר סלייפר",      photo:"", skin:"#c68642", hair_color:"#3b2314", hair_style:"full", facial_hair:"mustache", glasses:false},
    {n:5,  name:"עמוס אשכנזי",      photo:"", skin:"#d9a066", hair_color:"#1a1a1a", hair_style:"buzz", facial_hair:"stubble",  glasses:false},
    {n:6,  name:"קובי זגורי",       photo:"", skin:"#d9a066", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"beard",    glasses:false},
    {n:7,  name:"ענר בראב",         photo:"", skin:"#f0d5b8", hair_color:"#d4d4d4", hair_style:"full", facial_hair:"none",     glasses:true},
    {n:8,  name:"אלכס אומנסקי",     photo:"", skin:"#e0ac69", hair_color:"#d4d4d4", hair_style:"full", facial_hair:"beard",    glasses:false},
    {n:9,  name:"אלברטו בן בונאן",  photo:"", skin:"#ffdbac", hair_color:"#5c4033", hair_style:"buzz", facial_hair:"mustache", glasses:false},
    {n:10, name:"סלאח עמריה",       photo:"", skin:"#8d5524", hair_color:"#1a1a1a", hair_style:"full", facial_hair:"mustache", glasses:true},
    {n:11, name:"אמיר גלטשטיין",    photo:"", skin:"#ffdbac", hair_color:"#5c4033", hair_style:"full", facial_hair:"beard",    glasses:false},
    {n:12, name:"ניצן ברדר",        photo:"", skin:"#e0ac69", hair_color:"#d4d4d4", hair_style:"bald", facial_hair:"none",     glasses:false},
    {n:13, name:"אבישי זמיר",       photo:"", skin:"#f2c9a1", hair_color:"#a67c52", hair_style:"full", facial_hair:"stubble",  glasses:false},
    {n:14, name:"ערן גולדמן",       photo:"", skin:"#f2c9a1", hair_color:"#5c4033", hair_style:"full", facial_hair:"none",     glasses:false},
    {n:15, name:"חן שרון",          photo:"", skin:"#f2c9a1", hair_color:"#a67c52", hair_style:"full", facial_hair:"stubble",  glasses:false},
    {n:16, name:"ליאור גולן",       photo:"", skin:"#f2c9a1", hair_color:"#d4d4d4", hair_style:"buzz", facial_hair:"beard",    glasses:true},
    {n:17, name:"נחשון שטייף",      photo:"", skin:"#f2c9a1", hair_color:"#6b4423", hair_style:"bald", facial_hair:"none",     glasses:false},
    {n:18, name:"טל פורמן",         photo:"", skin:"#f2c9a1", hair_color:"#3b2314", hair_style:"buzz", facial_hair:"beard",    glasses:true},
    {n:19, name:"יונתן המסי",       photo:"", skin:"#8d5524", hair_color:"#5c4033", hair_style:"full", facial_hair:"none",     glasses:false},
    {n:20, name:"איתמר סלוק",       photo:"", skin:"#8d5524", hair_color:"#d4d4d4", hair_style:"buzz", facial_hair:"stubble",  glasses:false}
  ],

  /* פרטי פרויקט ה-Firebase שלכם. מדביקים כאן את האובייקט המדויק
     שמתקבל מקונסולת Firebase → הגדרות הפרויקט → האפליקציות שלך →
     Web app → "SDK setup and configuration" → Config.
     ראו README.md לצעד-אחר-צעד. */
  FIREBASE_CONFIG: {
    apiKey: "AIza...",
     authDomain: "masked-singer-palram.firebaseapp.com",
     projectId: "masked-singer-palram",
     storageBucket: "masked-singer-palram.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
  }
};
