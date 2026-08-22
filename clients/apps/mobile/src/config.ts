// Physical devices and emulators can't reach "localhost" — that resolves to
// the device itself, not your computer running the backend. Point this at
// your computer's LAN IP instead, e.g. "http://192.168.1.23:3000/api/v1".
// Android emulator specifically can also use the special alias 10.0.2.2:
//   http://10.0.2.2:3000/api/v1
export const API_BASE_URL = 'http://10.0.2.2:3000/api/v1';
