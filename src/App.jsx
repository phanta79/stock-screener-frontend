import React, { useState, useEffect } from 'react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [hasSearched, setHasSearched] = useState(false); // 검색 여부 확인용
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // A, B, C 변수 설정 상태
  const [varA, setVarA] = useState('매출액');
  const [varB, setVarB] = useState('영업이익');
  const [varC, setVarC] = useState('선택안함');
  const [formula, setFormula] = useState('');

  // 정렬 상태 관리 (어떤 열을, 어떤 방향으로 정렬할지)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

  // 👇 렌더(Render) 진짜 주소 꼭 다시 넣어주세요!
  const BACKEND_URL = 'https://stock-backend-2dck.onrender.com/api/stocks';

  useEffect(() => {
    fetch(BACKEND_URL)
      .then(res => res.json())
      .then(data => {
        setStocks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("데이터 로드 실패:", err);
        setError("서버에서 데이터를 가져오지 못했습니다.");
        setLoading(false);
      });
  }, []);

  // 검색 버튼 클릭 시 로직
  const handleSearch = () => {
    setError('');
    setHasSearched(true);
    
    if (!formula.trim()) {
      setFilteredStocks(stocks);
      return;
    }

    try {
      const filtered = stocks.filter(stock => {
        let expr = formula;
        
        // 사용자가 지정한 A, B, C를 실제 기업의 숫자로 치환
        if (varA !== '선택안함') expr = expr.split('A').join(stock[varA] || 0);
        if (varB !== '선택안함') expr = expr.split('B').join(stock[varB] || 0);
        if (varC !== '선택안함') expr = expr.split('C').join(stock[varC] || 0);

        const result = new Function(`return (${expr})`)();
        return Boolean(result);
      });

      setFilteredStocks(filtered);
      // 검색 직후에는 기본적으로 종목명 기준 오름차순(또는 변수 A 기준 등) 세팅 가능 (현재는 정렬 유지)
    } catch (e) {
      setError("수식에 오류가 있습니다. A, B, C 기호와 연산자를 다시 확인해주세요.");
    }
  };

  // 목차(헤더) 클릭 시 정렬하는 함수
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬이 적용된 최종 데이터
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];

    // 숫자인 경우와 문자(종목명)인 경우 다르게 비교
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
  });

  // 금액, 비율 예쁘게 포맷팅
  const formatNumber = (val, key) => {
    if (key === '종목명') return val;
    if (val === undefined || val === null) return '-';
    if (key === '유동비율' || key === '부채비율' || key === '유보율') {
      return `${val.toLocaleString()}%`;
    }
    const eok = Math.floor(val / 100000000);
    if (eok > 0) return `${eok.toLocaleString()} 억`;
    return `${val.toLocaleString()} 원`;
  };

  // 정렬 아이콘 표시 헬퍼 함수
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕';
    return sortConfig.direction === 'asc' ? ' 🔼' : ' 🔽';
  };

  const variablesList = ['선택안함', '매출액', '영업이익', '유동비율', '부채비율', '유보율'];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>📊 맞춤형 주식 재무 검색기</h1>
      
      {/* 1. 변수 지정 패널 */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>1️⃣ 검색할 재무 변수 지정</h4>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '5px' }}>A = </label>
            <select value={varA} onChange={(e) => setVarA(e.target.value)} style={{ padding: '5px' }}>
              {variablesList.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '5px' }}>B = </label>
            <select value={varB} onChange={(e) => setVarB(e.target.value)} style={{ padding: '5px' }}>
              {variablesList.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', marginRight: '5px' }}>C = </label>
            <select value={varC} onChange={(e) => setVarC(e.target.value)} style={{ padding: '5px' }}>
              {variablesList.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 2. 수식 입력 및 검색 패널 */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>2️⃣ 수식 입력</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="예시: A > 500000000000 && B > 100000000"
            style={{ flex: 1, padding: '12px', fontSize: '15px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleSearch}
            style={{ padding: '12px 24px', fontSize: '15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            검색
          </button>
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
          * 단일 조건 예시: <code>A &gt; 100</code> (A가 100 초과) <br/>
          * 복합 조건 예시: <code>A &lt; 50 && B &gt; 200</code> (A가 50 미만이면서 B가 200 초과)
        </div>
      </div>

      {error && <p style={{ color: '#ff0000', fontWeight: 'bold', marginBottom: '15px' }}>⚠️ {error}</p>}
      {loading && <p style={{ textAlign: 'center', padding: '20px' }}>서버 연동 중입니다... ⏳</p>}

      {/* 3. 결과 테이블 (검색 버튼을 눌러야만 표시됨) */}
      {!loading && hasSearched && (
        <div style={{ overflowX: 'auto' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0070f3' }}>💡 조회 결과 (목차를 클릭하면 정렬됩니다)</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0070f3', color: 'white', borderBottom: '2px solid #0051b3' }}>
                {['종목명', '매출액', '영업이익', '유동비율', '부채비율', '유보율'].map((key) => (
                  <th 
                    key={key} 
                    onClick={() => handleSort(key)}
                    style={{ padding: '12px', border: '1px solid #ddd', cursor: 'pointer', userSelect: 'none' }}
                  >
                    {key}{getSortIcon(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedStocks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#777' }}>조건에 일치하는 기업이 없습니다.</td>
                </tr>
              ) : (
                sortedStocks.map((stock, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                    <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f5f9ff' }}>{stock.name}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock['매출액'], '매출액')}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock['영업이익'], '영업이익')}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock['유동비율'], '유동비율')}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock['부채비율'], '부채비율')}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock['유보율'], '유보율')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;