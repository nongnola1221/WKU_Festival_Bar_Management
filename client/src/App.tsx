import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { socket } from './socket';
import AdminDashboard from './components/AdminDashboard';
import UserForm from './components/UserForm';
import TimerPage from './components/TimerPage';
import './App.css';

// 테이블 데이터 타입을 정의합니다.
export interface Table {
  id: string;
  tableNumber: string;
  name: string;
  phone: string;
  partySize: number;
  endTime: number;
  startTime: number;
  remainingTime?: number;
}

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [tables, setTables] = useState<Table[]>([]);
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin');

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdmin(window.location.hash === '#admin');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    socket.connect();

    function onConnect() {
      setIsConnected(true);
      console.log('서버에 연결되었습니다.');
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log('서버와 연결이 끊겼습니다.');
    }

    function onUpdateTables(value: Table[]) {
      const sortedTables = value.sort((a, b) => a.endTime - b.endTime);
      setTables(sortedTables);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('initialData', onUpdateTables);
    socket.on('updateTables', onUpdateTables);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('initialData', onUpdateTables);
      socket.off('updateTables', onUpdateTables);
      socket.disconnect();
    };
  }, []);

  const renderContent = () => {
    if (isAdmin) {
      return <AdminDashboard tables={tables} />;
    }
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UserForm />} />
          <Route path="/timer/:tableId" element={<TimerPage tables={tables} />} />
        </Routes>
      </BrowserRouter>
    );
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>사회대 주점 테이블 관리</h1>
        <p style={{ color: isConnected ? '#28a745' : 'var(--danger-color)', fontWeight: 500 }}>
          {isConnected ? '● 실시간 연결 중' : '○ 연결 끊김'}
        </p>
      </header>
      <main className="card">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
