import { io } from 'socket.io-client';

// 백엔드 서버 주소
const URL = 'http://localhost:4000';

export const socket = io(URL, {
  autoConnect: false // 수동으로 연결을 제어합니다.
});
