import React from 'react';
import { useParams } from 'react-router-dom';
import { Table } from '../App';

interface Props {
  tables: Table[];
}

const TimerPage = ({ tables }: Props) => {
  const { tableId } = useParams<{ tableId: string }>();
  const table = tables.find(t => t.id === tableId);

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (!table) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <h2>테이블 정보를 찾을 수 없습니다.</h2>
        <p>주소가 올바른지 확인해주세요.</p>
      </div>
    );
  }

  const remainingTime = table.remainingTime ?? (table.endTime - Date.now());
  const isExpired = remainingTime < 0;

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{fontWeight: 600}}>{table.name}님, 이용해주셔서 감사합니다.</h2>
      <p>테이블 번호: <strong>{table.tableNumber}</strong></p>
      <p style={{marginTop: '2rem'}}>남은 이용 시간</p>
      <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: isExpired ? 'var(--danger-color)' : 'var(--primary-color)', margin: '1rem 0 2rem 0' }}>
        {formatTime(remainingTime)}
      </div>
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.05)',
        padding: '1.5rem',
        borderRadius: 'var(--border-radius)',
        margin: '2rem 0'
      }}>
        <p style={{margin: '0 0 0.5rem 0', fontWeight: 500, color: '#333'}}>시간을 계속 확인 하고 싶으시면 창을 닫지 말아주세요!</p>
        <p style={{margin: 0, fontSize: '0.9rem', color: '#555'}}>다른 창을 사용하고 싶으시면 새로운 탭에서 열어주세요!<br/>(아니면 링크를 복사해서 다른 브라우저에 붙여넣어도 좋아요)</p>
      </div>
      <p style={{fontSize: '0.9rem', color: '#555'}}>이용 시간이 종료되면 다음 손님을 위해 자리를 비워주세요.</p>
    </div>
  );
};

export default TimerPage;
