import React, { useState, useEffect } from 'react';

function App() {
  const [stocks, setStocks] = useState([]);
  const [displayStocks, setDisplayStocks] = useState([]); 
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 💡 고정되어 있던 변수 목록을 지우고, 빈 배열로 둡니다. (서버에서 가져올 예정)
  const [availableFields, setAvailableFields] = useState([]);
  const alphabet = ['A', 'B', 'C', 'D', 'E'];

  const [variables, setVariables] = useState([]);
  const [formula, setFormula] = useState('');

  const [sortConfig, setSortConfig] = useState({ key: '_score', direction: 'desc' });

  // 👇 본인의 렌더 백엔드 주소로 반드시 변경하세요!
  const BACKEND_URL = 'https://stock-backend-2dck.onrender.com/api/stocks';

  useEffect(() => {
    fetch(BACKEND_URL)
      .then(res => res.json())
      .then(data => {
        setStocks(data);
        if (data.length > 0) {
          // 💡 핵심 마법: 몽고DB 시스템 코드(_id, __v)와 이름(name)을 제외한 '모든 진짜 재무 변수명'을 자동 추출합니다!
          const fields = Object.keys(data[0]).filter(k => k !== '_id' && k !== 'name' && k !== '__v');
          setAvailableFields(fields);

          // 데이터가 있으면 자동으로 A, B 변수 기본 세팅
          if (fields.length > 0) {
            setVariables([
              { id: 'A', field: fields[0] },
              { id: 'B', field: fields[1] || fields[0] }
            ]);
            setFormula('A - B');
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("데이터 로드 에러:", err);
        setError("서버에서 데이터를 가져오지 못했습니다.");
        setLoading(false);
      });
  }, []);

  const addVariable = () => {
    if (variables.length < 5 && availableFields.length > 0) {
      setVariables([...variables, { id: alphabet[variables.length], field: availableFields[0] }]);
    }
  };

  const removeVariable = () => {
    if (variables.length > 2) {
      setVariables(variables.slice(0, -1));
    }
  };

  const updateVariable = (index, newField) => {
    const newVars = [...variables];
    newVars[index].field = newField;
    setVariables(newVars);
  };

  const handleSearch = () => {
    setError('');
    setHasSearched(true);
    if (!formula.trim()) return;

    try {
      let processed = stocks.map(stock => {
        let expr = formula.toUpperCase();
        
        variables.forEach(v => {
          const val = stock[v.field] !== undefined ? stock[v.field] : 0;
          expr = expr.replace(new RegExp(`\\b${v.id}\\b`, 'g'), val);
        });

        let resultVal = new Function(`return (${expr})`)();
        return { ...stock, _score: resultVal };
      });

      processed = processed.filter(stock => 
        typeof stock._score === 'number' && !isNaN(stock._score) && isFinite(stock._score)
      );

      processed.sort((a, b) => b._score - a._score);
      const top20 = processed.slice(0, 20);

      setDisplayStocks(top20);
      setSortConfig({ key: '_score', direction: 'desc' });
    } catch (e) {
      setError("수식에 오류가 있습니다. 괄호, 기호, A~E 변수를 다시 확인해주세요.");
    }
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });

    const sorted = [...displayStocks].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (typeof valA === 'string') return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return direction === 'asc' ? valA - valB : valB - valA;
    });

    setDisplayStocks(sorted);
  };

  const formatNumber = (val, fieldName) => {
    if (val === undefined || val === null) return '-';

    // 이름에 '비율'이나 '율'이 들어가면 자동으로 % 처리
    if (fieldName && (fieldName.includes('비율') || fieldName.includes('율'))) {
      return `${Number(val).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    }

    if (fieldName === '_score') {
      const absVal = Math.abs(val);
      if (absVal >= 10000000) {
        return `${(val / 100000000).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 억`;
      }
      return Number(val).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }

    if (Math.abs(val) >= 10000000) {
      return `${Math.trunc(val / 100000000).toLocaleString('ko-KR')} 억`;
    }
    return Number(val).toLocaleString('ko-KR');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>📊 주식 종목 검색기</h1>
      
      {/* 데이터가 불러와지기 전에는 빈 화면이 찌그러지지 않도록 보호 */}
      {variables.length > 0 && (
        <>
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#333' }}>1️⃣ 변수 할당 (최소 2개 ~ 최대 5개)</h4>
              <div>
                <button onClick={removeVariable} disabled={variables.length <= 2} style={{ padding: '5px 10px', marginRight: '5px' }}>- 변수 삭제</button>
                <button onClick={addVariable} disabled={variables.length >= 5} style={{ padding: '5px 10px' }}>+ 변수 추가</button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {variables.map((v, idx) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                  <strong style={{ color: '#0070f3', fontSize: '16px', marginRight: '8px' }}>{v.id} = </strong>
                  <select value={v.field} onChange={(e) => updateVariable(idx, e.target.value)} style={{ padding: '5px', border: 'none', outline: 'none' }}>
                    {availableFields.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>2️⃣ 수식 입력 (점수 산출)</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="예: (A / B) * 100"
                style={{ flex: 1, padding: '12px', fontSize: '18px', borderRadius: '6px', border: '1px solid #ccc', fontWeight: 'bold' }}
              />
              <button
                onClick={handleSearch}
                style={{ padding: '12px 24px', fontSize: '15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                점수 계산 및 랭킹 조회
              </button>
            </div>
          </div>
        </>
      )}

      {error && <p style={{ color: '#ff0000', fontWeight: 'bold' }}>⚠️ {error}</p>}
      {loading && <p style={{ textAlign: 'center', padding: '20px' }}>몽고DB에서 데이터를 불러오는 중입니다... ⏳</p>}
      {!loading && availableFields.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: '#777' }}>데이터가 비어있습니다. 수집기(updateData.js)를 실행해주세요!</p>}

      {!loading && hasSearched && (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0070f3' }}>🏆 상위 랭킹 (Top 20)</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#0070f3', color: 'white', borderBottom: '2px solid #0051b3' }}>
                <th onClick={() => handleSort('name')} style={{ padding: '12px', border: '1px solid #ddd', cursor: 'pointer' }}>
                  종목명 {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : '↕'}
                </th>
                
                {variables.map(v => (
                  <th key={v.id} onClick={() => handleSort(v.field)} style={{ padding: '12px', border: '1px solid #ddd', cursor: 'pointer' }}>
                    {v.id} ({v.field}) {sortConfig.key === v.field ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : '↕'}
                  </th>
                ))}
                
                <th onClick={() => handleSort('_score')} style={{ padding: '12px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#0051b3' }}>
                  결과값 {sortConfig.key === '_score' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : '↕'}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayStocks.length === 0 ? (
                <tr><td colSpan={variables.length + 2} style={{ padding: '30px', color: '#777' }}>계산 결과가 없습니다.</td></tr>
              ) : (
                displayStocks.map((stock, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfc' }}>
                    <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{stock.name}</td>
                    
                    {variables.map(v => (
                      <td key={v.id} style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {formatNumber(stock[v.field], v.field)}
                      </td>
                    ))}
                    
                    <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold', color: '#0070f3' }}>
                      {formatNumber(stock._score, '_score')}
                    </td>
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