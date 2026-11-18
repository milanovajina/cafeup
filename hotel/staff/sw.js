// Hotel Up staff: shows a notification for each push. The push carries no text,
// so the service worker reads the newest open requests from the server with the staff code.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
async function config() { try { const r = await (await caches.open('hu-config')).match('/hu-config'); return r ? r.json() : null } catch (e) { return null } }
self.addEventListener('push', e => e.waitUntil((async () => {
  const cfg = await config();
  if (!cfg || !cfg.code) { try { const s = await self.registration.pushManager.getSubscription(); if (s) await s.unsubscribe() } catch (err) {} return }
  let title = 'Hotel Up · Yêu cầu mới', body = 'Mở màn hình nhân viên', tag = 'hu';
  try {
    const r = await fetch(`${cfg.api}/staff/latest?hotel=${cfg.hotel}`, { headers: { 'X-Staff-Key': cfg.code }, cache: 'no-store' });
    const d = await r.json(), first = d.items && d.items[0];
    if (first) { const ls = first.split('\n'); title = '🛎 ' + ls[0]; body = ls.slice(1).join('\n') || body; tag = 'hu-' + Date.now() }
  } catch (err) {}
  await self.registration.showNotification(title, { body, tag, renotify: true, requireInteraction: true, icon: 'icon-192.png', badge: 'icon-192.png', vibrate: [300, 100, 300, 100, 300] });
})()));
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil((async () => { const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); const w = all.find(c => c.url.includes('/hotel/staff/')); return w ? w.focus() : self.clients.openWindow('./') })()) });
