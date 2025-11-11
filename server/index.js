const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // 파일 시스템 모듈 추가

const app = express();
app.use(cors());

// --- 데이터 영속성 관련 설정 ---
const DB_FILE = path.join(__dirname, 'db.json');

// 서버 메모리에 테이블 데이터 저장
let tables = [];

// 서버 시작 시 파일에서 데이터 로드
try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    tables = JSON.parse(data);
    console.log('데이터를 db.json 파일에서 성공적으로 불러왔습니다.');
  } else {
    console.log('db.json 파일이 존재하지 않아 빈 배열로 시작합니다.');
  }
} catch (err) {
  console.error('db.json 파일 읽기 중 오류 발생:', err);
  tables = []; // 오류 발생 시 안전하게 빈 배열로 시작
}

// 데이터를 파일에 저장하는 함수
const saveData = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(tables, null, 2), 'utf8');
  } catch (err) {
    console.error('데이터를 파일에 저장하는 중 오류 발생:', err);
  }
};
// --- 데이터 영속성 관련 설정 끝 ---


// React 앱의 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client/build')));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const TOTAL_DURATION = 2 * 60 * 60 * 1000; // 2시간 (밀리초)

io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id);

  socket.emit('initialData', tables);

  socket.on('registerTable', (data) => {
    const tableExists = tables.some(table => table.tableNumber === data.tableNumber);
    if (tableExists) {
      return socket.emit('registrationError', '이미 사람이 있는 테이블입니다! (사람이 없다면 학생회에게 문의해주세요!)');
    }

    const userExists = tables.some(table => table.name === data.name && table.phone === data.phone);
    if (userExists) {
      return socket.emit('registrationError', '이미 사용 중인 손님입니다! (아니라면 학생회에게 문의해주세요!)');
    }

    const now = Date.now();
    const newTable = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      tableNumber: data.tableNumber,
      name: data.name,
      phone: data.phone,
      partySize: data.partySize,
      startTime: now,
      endTime: now + TOTAL_DURATION,
      notifications: { min10: false, min5: false, min0: false },
    };
    tables.push(newTable);
    saveData(); // 데이터 저장
    io.emit('updateTables', tables);
    socket.emit('registrationSuccess', newTable);
  });

  socket.on('deleteTable', (tableId) => {
    tables = tables.filter(table => table.id !== tableId);
    saveData(); // 데이터 저장
    io.emit('updateTables', tables);
  });

  socket.on('addTime', ({ tableId, minutes }) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.endTime += minutes * 60 * 1000;
      table.notifications = { min10: false, min5: false, min0: false };
      saveData(); // 데이터 저장
      io.emit('updateTables', tables);
    }
  });

  socket.on('subtractTime', ({ tableId, minutes }) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.endTime -= minutes * 60 * 1000;
      table.notifications = { min10: false, min5: false, min0: false };
      saveData(); // 데이터 저장
      io.emit('updateTables', tables);
    }
  });

  socket.on('updateTable', (updatedTable) => {
    const tableIndex = tables.findIndex(t => t.id === updatedTable.id);
    if (tableIndex !== -1) {
      tables[tableIndex] = {
        ...tables[tableIndex],
        tableNumber: updatedTable.tableNumber,
        name: updatedTable.name,
        phone: updatedTable.phone,
        partySize: updatedTable.partySize,
      };
      saveData(); // 데이터 저장
      io.emit('updateTables', tables);
    }
  });

  socket.on('disconnect', () => {
    console.log('사용자 연결 끊김:', socket.id);
  });
});

setInterval(() => {
  const now = Date.now();
  const updatedTables = tables.map(table => ({
    ...table,
    remainingTime: table.endTime - now
  }));
  io.emit('updateTables', updatedTables);

  let changed = false;
  tables.forEach(table => {
    const remainingTime = table.endTime - now;
    const remainingMinutes = Math.round(remainingTime / (60 * 1000));

    if (remainingMinutes <= 10 && !table.notifications.min10) {
      io.emit('adminAlarm', { message: `${table.tableNumber}번 테이블 이용시간 10분 남음` });
      table.notifications.min10 = true;
      changed = true;
    }
    if (remainingMinutes <= 5 && !table.notifications.min5) {
      io.emit('adminAlarm', { message: `${table.tableNumber}번 테이블 이용시간 5분 남음` });
      table.notifications.min5 = true;
      changed = true;
    }
    if (remainingTime <= 0 && !table.notifications.min0) {
      io.emit('adminAlarm', { message: `${table.tableNumber}번 테이블 이용시간 끝남` });
      table.notifications.min0 = true;
      changed = true;
    }
  });

  if (changed) {
    saveData(); // 알림 상태 변경 시 데이터 저장
  }
}, 1000);

const PORT = 4000;

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`);
});