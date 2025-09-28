/**
 * Universal API helper to prevent [object Object] errors
 * Provides readable error messages and proper JSON handling
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://stockdiff-app.preview.emergentagent.com';

export async function api(path, init = {}) {
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 
      'Content-Type': 'application/json', 
      ...(init?.headers || {}) 
    },
    ...init,
  });

  const raw = await res.text();
  let data = null;
  
  try { 
    data = raw ? JSON.parse(raw) : null; 
  } catch { 
    data = raw; 
  }

  if (!res.ok) {
    const msg = extractMessage(data) || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  
  return data;
}

function extractMessage(d) {
  if (!d) return null;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map(extractMessage).filter(Boolean).join('\n');
  return d.message || d.error || d.details || d.detail || (typeof d === 'object' ? JSON.stringify(d) : null);
}

export default api;