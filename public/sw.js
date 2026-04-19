self.addEventListener("push", function (event) {
  if (!event.data) return

  try {
    const data = event.data.json()
    const title = data.title || "Notification"
    const options = {
      body: data.body || "You have a new update.",
      icon: "/Lockey-icon.png", // Ensure this icon exists in public/
      badge: "/Lockey-icon.png",
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "/",
      },
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error("Push event data parsing failed:", err)
  }
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        // Find if this URL (or a close variant) is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            // Optional: You can post a message to the client here instead of forced navigation
            // client.postMessage({ type: "NAVIGATE", url: urlToOpen });
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        // If not open, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})
