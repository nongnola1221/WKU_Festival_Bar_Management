import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Table } from '../App';

const UserForm = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onRegisterSuccess = (newTable: Table) => {
      // 등록 성공 시, 고유 ID가 포함된 타이머 페이지로 이동
      navigate(`/timer/${newTable.id}`);
    };

    const onRegistrationError = (message: string) => {
      alert(message);
      setIsSubmitting(false);
    };

    socket.on('registrationSuccess', onRegisterSuccess);
    socket.on('registrationError', onRegistrationError);

    return () => {
      socket.off('registrationSuccess', onRegisterSuccess);
      socket.off('registrationError', onRegistrationError);
    };
  }, [navigate]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    let formattedValue = '';

    if (rawValue.length > 0) {
      formattedValue = rawValue.substring(0, 3);
    }
    if (rawValue.length > 3) {
      formattedValue += '-' + rawValue.substring(3, 7);
    }
    if (rawValue.length > 7) {
      formattedValue += '-' + rawValue.substring(7, 11);
    }
    
    setPhone(formattedValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!tableNumber || !name || !phone || !partySize) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    const partyNum = parseInt(partySize);
    if (isNaN(partyNum) || partyNum <= 0) {
      setError('인원수는 1 이상의 숫자여야 합니다.');
      return;
    }
    const tableNum = parseInt(tableNumber);
    if (isNaN(tableNum) || tableNum <= 0 || tableNum > 65) {
      setError('테이블 번호는 1에서 65 사이의 숫자여야 합니다.');
      return;
    }
    if (phone.length !== 13) {
        setError('전화번호 형식이 올바르지 않습니다.');
        return;
    }
    setError('');
    setIsSubmitting(true);

    const registrationData = {
      tableNumber,
      name,
      phone,
      partySize: partyNum,
    };

    socket.emit('registerTable', registrationData);
  };

  return (
    <div>
      <h2 style={{textAlign: 'center', marginBottom: '1.5rem'}}>테이블 정보 등록</h2>
      <p style={{textAlign: 'center', marginTop: '-1rem', marginBottom: '2rem'}}>이용 시간은 2시간입니다.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="tableNumber">테이블 번호 (1-65)</label>
          <input
            id="tableNumber"
            type="number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="예: 14"
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">대표자 이름</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 김철수"
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">전화번호</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={13}
            placeholder="010-1234-5678"
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="partySize">총 인원 (본인 포함)</label>
          <input
            id="partySize"
            type="number"
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            placeholder="예: 4"
            disabled={isSubmitting}
          />
        </div>
        {error && <p style={{ color: 'var(--danger-color)', textAlign: 'center' }}>{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '등록 중...' : '등록하기'}
        </button>
      </form>
    </div>
  );
};

export default UserForm;
