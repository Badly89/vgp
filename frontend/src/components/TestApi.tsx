import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const TestApi: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Тестируем API...');
      const response = await axios.get('/api/housing/list', {
        params: { page: 1, page_size: 10 }
      });
      
      console.log('Ответ API:', response.data);
      setResult(response.data);
    } catch (err: any) {
      console.error('Ошибка API:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Тест API</h2>
      <button onClick={testApi} disabled={loading}>
        {loading ? 'Загрузка...' : 'Тестировать API'}
      </button>
      
      {error && (
        <div style={{ color: 'red', marginTop: 10 }}>
          Ошибка: {error}
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Результат:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};