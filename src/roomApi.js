const unavailable = 'The multiplayer server is unavailable. Rooms cannot be created or joined until the room API is connected to this website.';

export async function readRoomResponse(response) {
 // Static hosting can return an HTML page, even with status 200.
 if (!response.headers.get('content-type')?.includes('application/json')) {
  throw new Error(unavailable);
 }
 let value;
 try { value = await response.json(); }
 catch { throw new Error('The multiplayer server returned an invalid response. Please try again.'); }
 if (!response.ok) {
  throw new Error(typeof value?.error === 'string' ? value.error : unavailable);
 }
 if (!value || typeof value !== 'object' || Array.isArray(value)) {
  throw new Error('The multiplayer server returned an invalid response. Please try again.');
 }
 return value;
}

export async function request(path, method = 'GET', data, token) {
 let response;
 try {
  response = await fetch('/api/' + path, {
   method,
   headers: {'Content-Type':'application/json', ...(token ? {Authorization:'Bearer ' + token} : {})},
   body: data ? JSON.stringify(data) : undefined,
   signal: AbortSignal.timeout(8000),
  });
 } catch {
  throw new Error('Cannot connect to the multiplayer server. Check your connection and try again.');
 }
 return readRoomResponse(response);
}
