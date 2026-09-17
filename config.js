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
         {id:1, name:"אלף", bg:"#3a2410", stroke:"#f0c896",
      path:'<circle cx="20" cy="20" r="10"/><path d="M14 11 L11 5 M26 11 L29 5"/><ellipse cx="20" cy="24" rx="5" ry="4"/>',
      candidates: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]},
    {id:2, name:"החיפושית", bg:"#173a1c", stroke:"#a8e6ae",
      path:'<circle cx="20" cy="24" r="10"/><path d="M20 14 L20 34"/><circle cx="20" cy="11" r="4"/>',
      candidates: [21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40]},
    {id:3, name:"האריה", bg:"#5a3c14", stroke:"#f0c675",
      path:'<circle cx="20" cy="22" r="7"/><path d="M20 8 L23 14 M20 8 L17 14"/>',
      candidates: [41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60]},
    {id:4, name:"הפיל", bg:"#2c2c3a", stroke:"#dcdcf0",
      path:'<circle cx="19" cy="18" r="9"/><circle cx="8" cy="15" r="7"/>',
      candidates: [61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80]},
    {id:5, name:"הפנדה", bg:"#1c1c1c", stroke:"#ffffff",
      path:'<circle cx="20" cy="20" r="9"/><circle cx="9" cy="10" r="5"/><circle cx="31" cy="10" r="5"/>',
      candidates: [81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100]},
    {id:6, name:"התרנגולת", bg:"#4a1414", stroke:"#f5b0a0",
      path:'<ellipse cx="17" cy="25" rx="9" ry="7"/><circle cx="26" cy="15" r="6"/>',
      candidates: [101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120]},
],

  CANDIDATES: [
   {n:1,  name:"מיכאל פליישמן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:2,  name:"ישראל עוזרי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:3,  name:"אחמד זידאן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:4,  name:"תאאר טאהא",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:5,  name:"זכריה כעביה",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:6,  name:"חיים ברוך",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:7,  name:"פרדי סולצמן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:8,  name:"גל טייב",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:9,  name:"אלברטו בן בונאן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:10,  name:"מתן טל",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:11,  name:"עומר ריאן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:12,  name:"לירן שגיא",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:13,  name:"חאתם טהא",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:14,  name:"איתי ליכט",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:15,  name:"אורן טהר לב",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:16,  name:"ענר בראב",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:17,  name:"אדם בוחבוט",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:18,  name:"איתמר סלוק",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:19,  name:"עמית זית",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:20,  name:"נחשון שטייף",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    // ---- 21-40 : קבוצת ה-20 המועמדים של שיר "החיפושית" (ביצוע 2) ----
    {n:21,  name:"רותם צורף",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:22,  name:"עדי שני",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:23,  name:"זיוה טובול",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:24,  name:"מיה רבינוביץ",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:25,  name:"ליה חביב",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:26,  name:"רונית שמאי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:27,  name:"קרן רייש",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:28,  name:"שרונה אומרדקר",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:29,  name:"חגית ענבר",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:30,  name:"יפעת קפלן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:31,  name:"ריקי לשם",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:32,  name:"אורה סוקולצקי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:33,  name:"סיגל חן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:34,  name:"מרב פדידה",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:35,  name:"גלית ארצי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:36,  name:"יעל אנקורי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:37,  name:"הלן מוסא",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:38,  name:"סיגל לנצט",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:39,  name:"גלית שושן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:40,  name:"אדוה פלג",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    // ---- 41-60 : קבוצת ה-20 המועמדים של שיר "האריה" (ביצוע 3) ----
    {n:41,  name:"רפי כהן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:42,  name:"יובל רובינסון",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:43,  name:"ברק קמתי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:44,  name:"ענר בראב",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:45,  name:"אלכס אומנסקי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:46,  name:"קובי זגורי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:47,  name:"אמיר גלטשטיין",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:48,  name:"ליאור גולן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:49,  name:"חן שרון",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:50,  name:"זאב גולדנברג",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:51,  name:"טל פורמן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:52,  name:"עופר לביא",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:53,  name:"ערן גולדמן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:54,  name:"איתמר סלוק",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:55,  name:"אמיר סלייפר",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:56,  name:"אורי אפרת",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:57,  name:"יונתן המסי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:58,  name:"אבישי זמיר",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:59,  name:"חנן פרחי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:60,  name:"ניצן ברדר",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    // ---- 61-80 : קבוצת ה-20 המועמדים של שיר "הפיל" (ביצוע 4) ----
    {n:61,  name:"חאלד חיג'אזי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:62,  name:"מוחמד חוג'יראת",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:63,  name:"סובחי חאלדי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:64,  name:"ברק רמתי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:65,  name:"אלי אסולין",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:66,  name:"עומר סובח",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:67,  name:"חסן רחייל",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:68,  name:"חאתם טהא",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:69,  name:"מוחמד סעדי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:70,  name:"עבד נמראנה",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:71,  name:"הילאל אבו ניל",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:72,  name:"נפאע נפאע",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:73,  name:"מוחמד טהא",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:74,  name:"מוהיב נעמה",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:75,  name:"נחשון שטייף",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:76,  name:"רמי דיאב",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:77,  name:"באסל חאלדי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:78,  name:"שמעון סאינה",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:79,  name:"מוחמד חיג'אזי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:80,  name:"פאיז זובידאת",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    // ---- 81-100 : קבוצת ה-20 המועמדים של שיר "הפנדה" (ביצוע 5) ----
    {n:81,  name:"ביאטה סטפובוי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:82,  name:"יפעת קפלן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:83,  name:"שיר עמר",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:84,  name:"טליה אפרת",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:85,  name:"אורלי רום",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:86,  name:"רוני דרור",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:87,  name:"ליליה אייזנברג",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:88,  name:"צביה חמאוואי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:89,  name:"ליהי דותן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:90,  name:"לימור ענתבי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:91,  name:"מירי פנחס",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:92,  name:"מירב כרמון",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:93,  name:"סיגל חן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:94,  name:"ליאור טולדנו",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:95,  name:"שרון גולן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:96,  name:"טובה כדורי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:97,  name:"אופיר שביט",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:98,  name:"עדי עוזרי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:99,  name:"יפעת ליכט",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:100,  name:"סנדרה גלנט",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    // ---- 101-120 : קבוצת ה-20 המועמדים של שיר "התרנגולת" (ביצוע 6) ----
    {n:101,  name:"אחמד המאם",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:102,  name:"אלי אסולין",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:103,  name:"פואד חטיב",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:104,  name:"ישראל עוזרי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:105,  name:"גיא סנדלר",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:106,  name:"נועם קמרי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:107,  name:"ערן גולדמן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:108,  name:"חסן עאמר",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:109,  name:"יבגני זכרוב",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:110,  name:"אדם בוחבוט",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:111,  name:"לירן שגיא",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:112,  name:"רפי כהן",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:113,  name:"ניצן ברדר",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:114,  name:"ברק רמתי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:115,  name:"עידן גולדשטיין",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:116,  name:"מרעי חאלדי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:117,  name:"מתן טל",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:118,  name:"ולאד אוסטרובסקי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:119,  name:"איתי ליכט",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
    {n:120,  name:"קובי זגורי",  photo:"", skin:"#e0ac69", hair_color:"#2c2c2c", hair_style:"buzz", facial_hair:"none", glasses:false},
  
  ],

  /* פרטי פרויקט ה-Firebase שלכם. מדביקים כאן את האובייקט המדויק
     שמתקבל מקונסולת Firebase → הגדרות הפרויקט → האפליקציות שלך →
     Web app → "SDK setup and configuration" → Config.
     ראו README.md לצעד-אחר-צעד. */
  FIREBASE_CONFIG: {
     apiKey: "AIzaSyBZfZwGB6-SJUbN8ajaQAbdMUUfmfvmV2M",
  authDomain: "masked-singer-palram.firebaseapp.com",
  projectId: "masked-singer-palram",
  storageBucket: "masked-singer-palram.firebasestorage.app",
  messagingSenderId: "897746027701",
  appId: "1:897746027701:web:ef9dfb5a9833478a7faafc"
  }
};
