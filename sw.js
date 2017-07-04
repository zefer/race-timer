let version = '0.00';

self.addEventListener('install', e => {
  let timeStamp = Date.now();

  var audioTicks = [60,50,40,30,25,20,15,10,9,8,7,6,5,4,3,2,1,0];
  var audio = audioTicks.map(x => {return `audio/${x}.mp3`})
  var misc = ['/index.html', '/app.css', '/app.js'];
  var allFiles = misc.concat(audio).map(x => {
    return `${x}?timestamp=${timeStamp}`;
  })

  e.waitUntil(
    caches.open('zefochron').then(cache => {
      return cache.addAll([`/`].concat(allFiles)).then(() => self.skipWaiting());
    })
  )
});

self.addEventListener('activate',  event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, {ignoreSearch:true}).then(response => {
      return response || fetch(event.request);
    })
  );
});
