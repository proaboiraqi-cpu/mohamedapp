// الاتصال بـ Firebase (Realtime Database). إذا ما اشتغل (بدون إنترنت) الموقع يكمل عادي بالمحتوى المحلي.
(function () {
  const C = window.CLOUD = { ok: false, offset: 0 };
  C.now = () => Date.now() + C.offset;
  try {
    if (!window.firebase) throw new Error('no firebase');
    firebase.initializeApp({
      apiKey: 'AIzaSyBJvi9_uE03NxQ1IFPbsMgm-ytkb8CSQQI',
      authDomain: 'koomaapp.firebaseapp.com',
      databaseURL: 'https://koomaapp-default-rtdb.europe-west1.firebasedatabase.app',
      projectId: 'koomaapp',
      storageBucket: 'koomaapp.firebasestorage.app',
      messagingSenderId: '4024549477',
      appId: '1:4024549477:web:5ca2adf25b3b22cfc0868c'
    });
    C.db = firebase.database();
    C.ts = firebase.database.ServerValue.TIMESTAMP;
    C.db.ref('.info/serverTimeOffset').on('value', s => { C.offset = s.val() || 0; });
    C.ok = true;
  } catch (e) { C.ok = false; }
})();
