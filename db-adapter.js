/* ================================================================
   db-adapter.js
   ------------------------------------------------------------------
   מתאם דק בין Firestore (גרסת compat) לבין ה-API שעליו נבנתה האפליקציה
   המקורית (window.claude.db בפלטפורמת Claude): doc()/collection(),
   get/set/update/delete/onSnapshot, ו-where/limit/orderBy על שאילתות.

   ה-API של Firebase compat כמעט זהה ב-1:1, עם הבדל אמיתי אחד שחייב
   טיפול: update() בפלטפורמה המקורית מבצע מיזוג רקורסיבי (merge) של
   שדות שהם אובייקט מקונן — כלומר עדכון {correctAnswers:{2:12}} מוסיף
   /מחליף רק את המפתח "2" בתוך correctAnswers, ומשאיר כל מפתח אחר
   שכבר קיים שם ללא שינוי. Firestore האמיתי, לעומת זאת, מחליף שדה
   אובייקט מקונן כזה *כולו* ב-update() רגיל — מה שהיה מוחק את כל
   השירים שכבר נחשפו בכל פעם שנחשף שיר נוסף.

   הלוגיקה של רצף החשיפות (revealOrder/correctAnswers) בנויה בדיוק
   על ההתנהגות הראשונה, ולכן ה-shim הזה "משטח" שדה מקונן אחד רמה
   לתוך מפתחות dot-path של Firestore (למשל "correctAnswers.2": 12)
   לפני קריאה ל-update האמיתי — כך ששתי הפלטפורמות מתנהגות זהה.
   ================================================================ */
(function(){
  "use strict";

  function isPlainObject(v){
    return v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);
  }

  function flattenForUpdate(patch){
    var out = {};
    Object.keys(patch).forEach(function(key){
      var val = patch[key];
      if(isPlainObject(val) && Object.keys(val).length > 0){
        // רמה אחת של השטחה — זה כל מה שהאפליקציה הזו צריכה בפועל
        // (השדה היחיד שמתעדכן כך הוא correctAnswers).
        Object.keys(val).forEach(function(subKey){
          out[key + "." + subKey] = val[subKey];
        });
      } else {
        out[key] = val;
      }
    });
    return out;
  }

  function wrapDocRef(ref){
    var originalUpdate = ref.update.bind(ref);
    ref.update = function(patch){
      return originalUpdate(flattenForUpdate(patch));
    };
    return ref;
  }

  function makeDb(firestoreInstance){
    return {
      doc: function(path){ return wrapDocRef(firestoreInstance.doc(path)); },
      collection: function(path){ return firestoreInstance.collection(path); }
    };
  }

  function init(){
    if(typeof firebase === "undefined"){
      console.error("[הזמר במסכה] Firebase SDK לא נטען — ודאו ש-index.html/admin.html טוענים את סקריפטי firebase-app-compat.js ו-firebase-firestore-compat.js לפני db-adapter.js.");
      return;
    }
    var cfg = window.MS_CONFIG && window.MS_CONFIG.FIREBASE_CONFIG;
    if(!cfg || cfg.apiKey === "REPLACE_ME"){
      console.error("[הזמר במסכה] יש להשלים את פרטי FIREBASE_CONFIG בקובץ config.js לפני שהאפליקציה יכולה להתחבר למסד הנתונים. ראו README.md.");
      return;
    }
    firebase.initializeApp(cfg);
    var fs = firebase.firestore();
    window.MSDB = makeDb(fs);
  }

  init();
})();
