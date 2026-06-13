import React, { useState, useEffect } from 'react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [formula, setFormula] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // 👇 렌더(Render) 대시보드에서 복사했던 본인의 백엔드 주소로 변경하세요! (끝에 /api/stocks 필수)
  const BACKEND_URL = 'https://stock-backend-2dck.onrender.com/api/stocks';

  // 페이지가 열리면 백엔드 서버에서 데이터를 가져옵니다.
  useEffect(() => {
    fetch(BACKEND_URL)
      .then(res => res.json())
      .then(data => {
        setStocks(data);
        setFilteredStocks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("데이터 로드 실패:", err);
        setError("백엔드 서버에서 데이터를 가져오지 못했습니다.");
        setLoading(false);
      });
  }, []);

  // 검색 버튼을 누르면 실행되는 수식 필터링 로직
  const handleSearch = () => {
    setError('');
    if (!formula.trim()) {
      setFilteredStocks(stocks);
      return;
    }

    try {
      const filtered = stocks.filter(stock => {
        let expr = formula;
        // 새로 세팅한 5가지 핵심 변수 목록
        const variables = ['매출액', '영업이익', '유동비율', '부채비율', '유보율'];
        
        // 사용자가 입력한 수식 문자열에서 변수 이름을 실제 숫자 값으로 치환합니다.
        variables.forEach(v => {
          const val = stock[v] !== undefined ? stock[v] : 0;
          expr = expr.split(v).join(val);
        });

        // 치환된 수식을 계산하여 참(true)인 기업만 남깁니다.
        const result = new Function(`return (${expr})`)();
        return Boolean(result);
      });

      setFilteredStocks(filtered);
    } catch (e) {
      setError("수식에 오류가 있습니다. 변수명과 기호(<, >, ==, &&, ||)를 다시 확인해주세요.");
    }
  };

  // 대형 숫자를 보기 편하게 만 만원 또는 억 단위로 변환해 주는 함수
  const formatNumber = (val, key) => {
    if (key === '유동비율' || key === '부채비율' || key === '유보율') {
      return `${val.toLocaleString()}%`;
    }
    const eok = Math.floor(val / 100000000);
    if (eok > 0) {
      return `${eok.toLocaleString()} 억 원`;
    }
    return `${val.toLocaleString()} 원`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>📊 주식 재무 조건 검색기</h1>
      
      <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0070f3' }}>💡 사용 가능한 재무 변수</h4>
        <p style={{ fontWeight: 'bold', fontSize: '16px', margin: '0 0 10px 0' }}>매출액, 영업이익, 유동비율, 부채비율, 유보율</p>
        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
          * 예시 1 (단일 조건): <code>영업이익 &gt; 100000000000</code> (영업이익 1,000억 초과인 기업)<br />
          * 예시 2 (복합 조건): <code>부채비율 &lt; 100 && 유동비율 &gt; 150</code> (부채 100% 미만이고 유동비율 150% 초과인 기업)
        </div>
      </div>

      <div style={{ marginBottom: '25px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="수식을 입력하세요 (예: 매출액 > 500000000000)"
          style={{ flex: 1, padding: '12px', fontSize: '15px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button
          onClick={handleSearch}
          style={{ padding: '12px 24px', fontSize: '15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          검색
        </button>
      </div>

      {error && <p style={{ color: '#ff0000', fontWeight: 'bold', marginBottom: '15px' }}>⚠️ {error}</p>}
      {loading && <p style={{ textAlign: 'center', padding: '20px' }}>데이터를 불러오는 중입니다... ⏳</p>}

      {!loading && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0070f3', color: 'white', borderBottom: '2px solid #0051b3' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>종목명</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>매출액</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>영업이익</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>유동비율</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>부채비율</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>유보율</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#777' }}>조건에 일치하는 기업이 없습니다.</td>
                </tr>
              ) : (
                filteredStocks.map((stock, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                    <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f5f9ff' }}>{stock.name}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock.매출액, '매출액')}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock.영업이익, '영업이익')}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock.유동비율, '유동비율')}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock.부채비율, '부채비율')}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(stock.유보율, '유보율')}</td>
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