import React from 'react';
import { socket } from '../socket';
import { Table } from '../App';

interface Props {
  table: Table;
}

const TableItem = ({ table }: Props) => {
  // remainingTime은 이제 상위 컴포넌트에서 table 객체의 일부로 전달받습니다.
  const remainingTime = table.remainingTime ?? (table.endTime - Date.now());

  const formatTime = (ms: number) => {
    const isNegative = ms < 0;
    if (isNegative) ms = -ms;

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return isNegative ? `-${timeString}` : timeString;
  };

  const handleManageTime = () => {
    const minutesInput = prompt('추가하거나 뺄 시간을 분 단위로 입력하세요 (예: 10 또는 -5):', '0');
    if (minutesInput !== null) { // 사용자가 취소를 누르지 않았을 때만 처리
        const minutes = parseInt(minutesInput);
        if (!isNaN(minutes) && minutes !== 0) {
            if (minutes > 0) {
                socket.emit('addTime', { tableId: table.id, minutes });
            } else {
                socket.emit('subtractTime', { tableId: table.id, minutes: Math.abs(minutes) });
            }
        } else if (minutesInput !== '0') { // 입력이 숫자가 아니거나 0인데 0이 아닌 문자열인 경우
            alert('유효한 분 단위 숫자를 입력해주세요.');
        }
    }
  };

  const handleDelete = () => {
    if (window.confirm(`[${table.tableNumber}번 테이블] ${table.name}님 정보를 정말 삭제하시겠습니까?`)) {
      socket.emit('deleteTable', table.id);
    }
  };

  const isExpired = remainingTime < 0;

  return (
    <tr style={{ backgroundColor: isExpired ? '#ff000015' : 'transparent' }}>
      <td><strong>{table.tableNumber}</strong></td>
      <td>{table.name}</td>
      <td>{table.phone}</td>
      <td>{table.partySize}명</td>
      <td style={{ color: isExpired ? 'var(--danger-color)' : 'inherit', fontWeight: 500 }}>
        {formatTime(remainingTime)}
      </td>
      <td>
        <button onClick={handleManageTime} style={{width: 'auto', marginRight: '8px', fontSize: '0.8rem', padding: '6px 10px'}}>시간 관리</button>
        <button onClick={handleDelete} className="danger" style={{width: 'auto', fontSize: '0.8rem', padding: '6px 10px'}}>삭제</button>
      </td>
    </tr>
  );
};

export default TableItem;
