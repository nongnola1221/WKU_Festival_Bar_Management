const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path'); // path 모듈 추가

const app = express();
app.use(cors());

// React 앱의 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client/build')));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // React 클라이언트 주소 (개발 모드용)
    methods: ["GET", "POST"]
  }
});

// 서버 메모리에 테이블 데이터 저장
let tables = [];
const TOTAL_DURATION = 2 * 60 * 60 * 1000; // 2시간 (밀리초)

io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);

  // 새로 연결된 클라이언트에게 현재 테이블 데이터 전송
  socket.emit('initialData', tables);

  // 손님 테이블 등록 처리
  socket.on('registerTable', (data) => {
    const now = Date.now();
    const newTable = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2), // 호환성 높은 고유 ID 생성
      tableNumber: data.tableNumber,
      name: data.name,
      phone: data.phone,
      partySize: data.partySize,
      startTime: now,
      endTime: now + TOTAL_DURATION,
      notifications: { min10: false, min5: false, min0: false }, // 알림 플래그 업데이트
    };
    tables.push(newTable);
    // 모든 클라이언트에게 최신 테이블 목록 브로드캐스트
    io.emit('updateTables', tables);
    // 등록을 요청한 클라이언트에게만 성공 이벤트와 테이블 정보 전송
    socket.emit('registrationSuccess', newTable);
  });

  // 테이블 삭제 처리
  socket.on('deleteTable', (tableId) => {
    tables = tables.filter(table => table.id !== tableId);
    io.emit('updateTables', tables);
  });

  // 시간 추가 처리
  socket.on('addTime', ({ tableId, minutes }) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.endTime += minutes * 60 * 1000;
      // 시간 추가 시 알림 플래그 초기화 (다시 알림이 가도록)
      table.notifications = { min10: false, min5: false, min0: false };
      io.emit('updateTables', tables);
    }
  });

  // 시간 빼기 처리
  socket.on('subtractTime', ({ tableId, minutes }) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.endTime -= minutes * 60 * 1000;
      // 시간 변경 시 알림 플래그 초기화 (다시 알림이 가도록)
      table.notifications = { min10: false, min5: false, min0: false };
      io.emit('updateTables', tables);
    }
  });

  socket.on('disconnect', () => {
    console.log('사용자 연결 끊김:', socket.id);
  });
});

// 1초마다 실행되는 메인 타이머 루프
setInterval(() => {
  const now = Date.now();
  // 남은 시간을 클라이언트로 보내주기 위해 업데이트된 테이블 정보를 emit
  const updatedTables = tables.map(table => ({
    ...table,
    remainingTime: table.endTime - now
  }));
  io.emit('updateTables', updatedTables);

  tables.forEach(table => {
    const remainingTime = table.endTime - now;
    const remainingMinutes = Math.round(remainingTime / (60 * 1000));

    // 관리자 페이지 알림 로직
    if (remainingMinutes <= 10 && !table.notifications.min10) {
      console.log(`[알림] ${table.tableNumber}번 테이블 이용시간 10분 남음`);
      io.emit('adminAlarm', { tableId: table.id, tableNumber: table.tableNumber, message: `${table.tableNumber}번 테이블 이용시간 10분 남음` });
      table.notifications.min10 = true;
    }
    if (remainingMinutes <= 5 && !table.notifications.min5) {
      console.log(`[알림] ${table.tableNumber}번 테이블 이용시간 5분 남음`);
      io.emit('adminAlarm', { tableId: table.id, tableNumber: table.tableNumber, message: `${table.tableNumber}번 테이블 이용시간 5분 남음` });
      table.notifications.min5 = true;
    }
    if (remainingTime <= 0 && !table.notifications.min0) {
      console.log(`[알림] ${table.tableNumber}번 테이블 이용시간 끝남`);
      io.emit('adminAlarm', { tableId: table.id, tableNumber: table.tableNumber, message: `${table.tableNumber}번 테이블 이용시간 끝남` });
      table.notifications.min0 = true;
    }
  });
}, 1000);


const PORT = 4000;

// 모든 다른 요청에 대해 React 앱의 index.html 서빙 (클라이언트 라우팅 처리)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`);
});
