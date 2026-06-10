import { supabase } from '@/lib/supabase'

export async function requestNotificationPermission(userId: string): Promise<void> {
  if (typeof Notification === 'undefined') {
    return
  }

  if (Notification.permission === 'denied') {
    return
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return
    }
  }

  const pushRegistration = await navigator.serviceWorker.register('/sw-push.js')
  const subscription = await pushRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  })

  await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token: JSON.stringify(subscription), platform: 'web' }, { onConflict: 'user_id' })
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}