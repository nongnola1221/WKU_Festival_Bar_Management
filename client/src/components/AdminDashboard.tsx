import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { Table } from '../App';
import TableItem from './TableItem';
import './AdminDashboard.css';

interface Props {
  tables: Table[];
}

const AdminDashboard = ({ tables }: Props) => {
  const [alarmMessage, setAlarmMessage] = useState<string | null>(null);

  useEffect(() => {
    // 알림 권한 요청
    if (!("Notification" in window)) {
      console.warn("이 브라우저는 알림을 지원하지 않습니다.");
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("알림 권한이 허용되었습니다.");
        } else {
          console.log("알림 권한이 거부되었습니다.");
        }
      });
    }

    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAADwA'); // Base64 인코딩된 짧은 알림음

    const handleAdminAlarm = (data: { tableId: string; tableNumber: string; message: string }) => {
      audio.play(); // 알림음 재생
      setAlarmMessage(data.message); // 알림 메시지 설정

      // 브라우저 알림 표시
      if (Notification.permission === "granted") {
        const notificationTitle = "원광대학교 사회대 주점 알리미";
        const notificationOptions = {
          body: data.message,
          icon: '/favicon.ico' // 앱 아이콘 등 적절한 아이콘 경로
        };
        new Notification(notificationTitle, notificationOptions);
      }

      // 5초 후 알림 메시지 제거
      const timer = setTimeout(() => {
        setAlarmMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    };

    socket.on('adminAlarm', handleAdminAlarm);

    return () => {
      socket.off('adminAlarm', handleAdminAlarm);
    };
  }, []);

  return (
    <div>
      <h2 style={{textAlign: 'center'}}>관리자 대시보드</h2>
      <p style={{textAlign: 'center', marginTop: '-1rem', marginBottom: '2rem'}}>현재 <strong>{tables.length}개</strong>의 테이블이 사용 중입니다.</p>
      {alarmMessage && (
        <div style={{
          backgroundColor: 'var(--danger-color)',
          color: 'white',
          padding: '1rem',
          borderRadius: 'var(--border-radius)',
          textAlign: 'center',
          marginBottom: '1.5rem',
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}>
          {alarmMessage}
        </div>
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>테이블</th>
              <th>대표자</th>
              <th>전화번호</th>
              <th>인원</th>
              <th>남은 시간</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {tables.length > 0 ? (
              tables.map(table => <TableItem key={table.id} table={table} />)
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 0' }}>
                  아직 등록된 테이블이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
