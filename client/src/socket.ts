import { io } from 'socket.io-client';

// 백엔드 서버 주소 (환경 변수 사용, 로컬 개발 시 폴백)
const URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

export const socket = io(URL, {
  autoConnect: false // 수동으로 연결을 제어합니다.
});
