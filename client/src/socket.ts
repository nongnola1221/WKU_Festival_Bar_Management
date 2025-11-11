import { io } from 'socket.io-client';

export const socket = io({
  autoConnect: false // 수동으로 연결을 제어합니다.
});
