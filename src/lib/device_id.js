const DEVICE_ID_STORAGE_KEY = 'saraspatika_device_id';

function fallbackId() {
  const random = Math.random().toString(36).slice(2);
  return `web-${Date.now().toString(36)}-${random}`;
}

export function getOrCreateWebDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      deviceId: fallbackId(),
      deviceName: 'Web Browser',
      devicePlatform: 'web',
    };
  }

  let deviceId = '';

  try {
    deviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY) || '';
    if (!deviceId) {
      deviceId = typeof window.crypto?.randomUUID === 'function' ? window.crypto.randomUUID() : fallbackId();
      window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    }
  } catch {
    deviceId = fallbackId();
  }

  const platform = window.navigator?.platform || 'web';

  return {
    deviceId,
    deviceName: platform ? `Web ${platform}` : 'Web Browser',
    devicePlatform: 'web',
  };
}
