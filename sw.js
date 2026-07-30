/* Service worker della Dashboard Personal_G.
   Strategia: "rete prima, cache come riserva" per i file dell'app stessa
   (index.html, manifest, icone), così l'app resta sempre aggiornata quando
   c'è connessione ma continua a funzionare (mostrando l'ultima versione
   salvata) anche offline. Le chiamate verso GitHub e verso i CDN esterni
   (Chart.js, Font Awesome) NON vengono intercettate: passano dritte alla
   rete come sempre, per non interferire con la sincronizzazione dei dati. */
const CACHE_NAME='personal-g-dash-v1';
const APP_SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin) return;
  if(e.request.method!=='GET') return;

  e.respondWith(
    fetch(e.request).then(res=>{
      const resClone=res.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(e.request,resClone)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(e.request).then(cached=>cached||caches.match('./index.html')))
  );
});
