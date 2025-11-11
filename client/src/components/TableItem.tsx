import React, { useState } from 'react';
import { socket } from '../socket';
import { Table } from '../App';

interface Props {
  table: Table;
  onEdit: (table: Table) => void;
}

const TableItem = ({ table, onEdit }: Props) => {
  const [newTime, setNewTime] = useState('');
  // remainingTime은 이제 상위 컴포넌트에서 table 객체의 일부로 전달받습니다.
  const remainingTime = table.remainingTime ?? (table.endTime - Date.now());

  const formatTime = (ms: number) => {
    const isNegative = ms < 0;
    if (isNegative) ms = -ms;

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600); // 24시간 이상 표시 가능하도록 수정
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return isNegative ? `-${timeString}` : timeString;
  };

  const handleDelete = () => {
    if (window.confirm(`[${table.tableNumber}번 테이블] ${table.name}님 정보를 정말 삭제하시겠습니까?`)) {
      socket.emit('deleteTable', table.id);
    }
  };

  const handleTimeChange = () => {
    const minutes = parseInt(newTime, 10);
    if (!isNaN(minutes) && window.confirm(`[${table.tableNumber}번 테이블] 시간을 ${minutes}분으로 변경하시겠습니까?`)) {
      socket.emit('test_updateTime', { tableId: table.id, minutes });
      setNewTime('');
    }
  };

  let rowBackgroundColor = 'transparent';
  if (remainingTime < 0) {
    rowBackgroundColor = '#ff000015'; // 빨간색 (0분 미만)
  } else if (remainingTime < 5 * 60 * 1000) {
    rowBackgroundColor = '#ffc10715'; // 주황색 (5분 미만)
  }

  return (
    <tr style={{ backgroundColor: rowBackgroundColor }}>
      <td><strong>{table.tableNumber}</strong></td>
      <td>{table.name}</td>
      <td>{table.phone}</td>
      <td>{table.partySize}명</td>
      <td style={{ color: remainingTime < 0 ? 'var(--danger-color)' : 'inherit', fontWeight: 500 }}>
        {formatTime(remainingTime)}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="number" 
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            placeholder="분"
            style={{ width: '60px', padding: '6px', fontSize: '0.8rem' }}
          />
          <button onClick={handleTimeChange} style={{width: 'auto', fontSize: '0.8rem', padding: '6px 10px'}}>시간 변경</button>
        </div>
      </td>
      <td>
        <button onClick={() => onEdit(table)} style={{width: 'auto', marginRight: '8px', fontSize: '0.8rem', padding: '6px 10px'}}>수정</button>
        <button onClick={handleDelete} className="danger" style={{width: 'auto', fontSize: '0.8rem', padding: '6px 10px'}}>삭제</button>
      </td>
    </tr>
  );
};

export default TableItem;
