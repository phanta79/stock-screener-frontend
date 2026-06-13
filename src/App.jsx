import { useState, useEffect } from 'react';
import * as math from 'mathjs';
import './App.css';

// 선택 가능한 재무 항목 리스트
const variableOptions = [
  { value: 'opProfit_25', label: '25년 영업이익' },
  { value: 'netIncome_25', label: '25년 당기순이익' },
  { value: 'totalAssets', label: '자산총계' },
  { value: 'currentLiabilities', label: '유동부채' },
];

function App() {
  const [stockData, setStockData] = useState([]); // 백엔드에서 받아올 데이터를 저장할 공간
  const [variables, setVariables] = useState([
    { id: 'A', key: 'opProfit_25' },
    { id: 'B', key: 'totalAssets' }
  ]);
  const [formula, setFormula] = useState("(A / B) * 100");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 화면이 켜질 때 백엔드 서버(5000번 포트)에 데이터 요청하기
  useEffect(() => {
    fetch('https://stock-backend-2dck.onrender.com/api/stocks')
      .then(response => response.json())
      .then(data => {
        // 백엔드가 배열로 주므로 그대로 저장
        setStockData(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("데이터 가져오기 실패:", error);
        setIsLoading(false);
      });
  }, []);

  const handleAddVariable = () => { /* 이전과 동일 */
    if (variables.length >= 5) return;
    const nextId = String.fromCharCode(65 + variables.length); 
    setVariables([...variables, { id: nextId, key: variableOptions[0].value }]);
  };

  const handleRemoveVariable = (idToRemove) => { /* 이전과 동일 */
    if (variables.length <= 2) return;
    setVariables(variables.filter(v => v.id !== idToRemove));
  };

  const handleVariableChange = (id, newKey) => { /* 이전과 동일 */
    setVariables(variables.map(v => v.id === id ? { ...v, key: newKey } : v));
  };

  const handleSearch = () => {
    try {
      const calculatedData = stockData.map(company => {
        const scope = {};
        const displayValues = {};

        variables.forEach(v => {
          scope[v.id] = company[v.key];
          displayValues[`val_${v.id}`] = company[v.key];
        });

        const resultValue = math.evaluate(formula, scope);

        return {
          ...company,
          ...displayValues,
          resultValue: parseFloat(resultValue.toFixed(1))
        };
      });

      const sortedData = calculatedData.sort((a, b) => b.resultValue - a.resultValue);
      setResults(sortedData);
    } catch (error) {
      alert("수식에 오류가 있습니다.");
    }
  };

  const getLabel = (key) => {
    const option = variableOptions.find(opt => opt.value === key);
    return option ? option.label : key;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2>주식 재무 조건 검색기</h2>
      
      {isLoading ? (
        <p>백엔드에서 실제 데이터를 불러오는 중입니다... ⏳</p>
      ) : (
        <>
          <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>변수 설정</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {variables.map((v) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#fff', padding: '5px 10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <strong>{v.id} : </strong>
                    <select value={v.key} onChange={(e) => handleVariableChange(v.id, e.target.value)} style={{ padding: '5px' }}>
                      {variableOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {variables.length > 2 && v.id !== 'A' && v.id !== 'B' && (
                      <button onClick={() => handleRemoveVariable(v.id)} style={{ cursor: 'pointer', color: 'red', border: 'none', background: 'none', fontWeight: 'bold' }}>X</button>
                    )}
                  </div>
                ))}
              </div>
              {variables.length < 5 && (
                <button onClick={handleAddVariable} style={{ marginTop: '10px', padding: '6px 12px', cursor: 'pointer' }}>+ 변수 추가</button>
              )}
            </div>

            <hr style={{ border: '0', borderTop: '1px solid #ddd', margin: '15px 0' }} />

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <strong style={{ whiteSpace: 'nowrap' }}>수식 :</strong>
              <input 
                type="text" 
                value={formula} 
                onChange={(e) => setFormula(e.target.value)} 
                style={{ width: '100%', padding: '8px', fontSize: '16px' }}
              />
              <button onClick={handleSearch} style={{ padding: '8px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>검색</button>
            </div>
          </div>

          {results.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px' }}>종목</th>
                  {variables.map(v => (
                    <th key={v.id} style={{ padding: '10px' }}>
                      {v.id}<br/>
                      <span style={{fontSize: '11px', fontWeight: 'normal'}}>{getLabel(v.key)}</span>
                    </th>
                  ))}
                  <th style={{ padding: '10px', backgroundColor: '#ffebee' }}>결과값</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.name}</td>
                    {variables.map(v => (
                      <td key={v.id} style={{ padding: '10px' }}>{item[`val_${v.id}`]}</td>
                    ))}
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#d32f2f' }}>{item.resultValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default App;