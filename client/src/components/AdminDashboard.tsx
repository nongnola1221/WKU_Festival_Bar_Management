import React, { useState, useEffect, useMemo } from 'react';
import { socket } from '../socket';
import { Table } from '../App';
import TableItem from './TableItem';
import './AdminDashboard.css';

// 수정 모달을 위한 Props 정의
interface EditModalProps {
  table: Table | null;
  onClose: () => void;
  onSave: (updatedTable: Table) => void;
}

const EditModal = ({ table, onClose, onSave }: EditModalProps) => {
  const [formData, setFormData] = useState<Table | null>(null);

  useEffect(() => {
    setFormData(table);
  }, [table]);

  if (!table || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>테이블 정보 수정</h3>
        <div className="form-group">
          <label>테이블 번호</label>
          <input name="tableNumber" value={formData.tableNumber} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>대표자 이름</label>
          <input name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>전화번호</label>
          <input name="phone" value={formData.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>총 인원</label>
          <input name="partySize" type="number" value={formData.partySize} onChange={handleChange} />
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="danger">취소</button>
          <button onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
};


interface Props {
  tables: Table[];
}

type SortKey = 'tableNumber' | 'remainingTime';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const AdminDashboard = ({ tables }: Props) => {
  const [alarmMessage, setAlarmMessage] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'remainingTime', direction: 'ascending' });

  useEffect(() => {
    if (!("Notification" in window)) {
      console.warn("이 브라우저는 알림을 지원하지 않습니다.");
    } else if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAADwA');

    const handleAdminAlarm = (data: { message: string }) => {
      audio.play();
      setAlarmMessage(data.message);
      if (Notification.permission === "granted") {
        new Notification("원광대학교 사회대 주점 알리미", { body: data.message, icon: '/favicon.ico' });
      }
      const timer = setTimeout(() => setAlarmMessage(null), 5000);
      return () => clearTimeout(timer);
    };

    socket.on('adminAlarm', handleAdminAlarm);
    return () => {
      socket.off('adminAlarm', handleAdminAlarm);
    };
  }, []);

  const sortedTables = useMemo(() => {
    let sortableItems = [...tables];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: number;
        let bValue: number;

        if (sortConfig.key === 'tableNumber') {
          aValue = parseInt(a.tableNumber);
          bValue = parseInt(b.tableNumber);
        } else { // remainingTime
          aValue = a.remainingTime ?? (a.endTime - Date.now());
          bValue = b.remainingTime ?? (b.endTime - Date.now());
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tables, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
  };

  const handleCloseModal = () => {
    setEditingTable(null);
  };

  const handleSaveChanges = (updatedTable: Table) => {
    socket.emit('updateTable', updatedTable);
    setEditingTable(null);
  };

  return (
    <div>
      <h2 style={{textAlign: 'center'}}>관리자 대시보드</h2>
      <p style={{textAlign: 'center', marginTop: '-1rem', marginBottom: '2rem'}}>현재 <strong>{tables.length}개</strong>의 테이블이 사용 중입니다.</p>
      {alarmMessage && (
        <div className="alarm-banner">
          {alarmMessage}
        </div>
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('tableNumber')} className="sortable">
                테이블{getSortIndicator('tableNumber')}
              </th>
              <th>대표자</th>
              <th>전화번호</th>
              <th>인원</th>
              <th onClick={() => requestSort('remainingTime')} className="sortable">
                남은 시간{getSortIndicator('remainingTime')}
              </th>
              <th>시간 테스트</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {sortedTables.length > 0 ? (
              sortedTables.map(table => <TableItem key={table.id} table={table} onEdit={handleEdit} />)
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 0' }}>
                  아직 등록된 테이블이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editingTable && (
        <EditModal
          table={editingTable}
          onClose={handleCloseModal}
          onSave={handleSaveChanges}
        />
      )}
    </div>
  );
};

export default AdminDashboard;