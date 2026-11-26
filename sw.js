// オフライン用: 初回に全ファイルを保存し、以後は保存分を表示する。
// 版(VERSION)は build.py が中身のハッシュで埋める。新しい版を公開すると、次に開いたとき裏で入れ替わる。
const VERSION = "2c0d9bbd604f";
const CACHE = "mhaurt-" + VERSION;
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("mhaurt-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  // GitHub の API（同期）は素通し。自分のファイルだけ保存分を出す
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  // 服の絵（art/、暗号文）は一度読んだら端末に置いておく。版が替わっても消さない別の保存場所
  // （名前を "mhaurt-" で始めない＝activate の掃除対象外。鍵を替えると URL の ?k= が変わるので古い絵は使われない）
  if (new URL(e.request.url).pathname.includes("/art/")) {
    e.respondWith(caches.open("art-mhaurt").then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) c.put(e.request, r.clone());
      return r;
    }))));
    return;
  }
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request)));
});
