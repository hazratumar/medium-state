import React, { useState, useEffect } from 'react';
import ReportGenerator from './ReportGenerator';

const App = () => {
  const [apiData, setApiData] = useState([]);

  // Simulate API data updates
  useEffect(() => {
    // Example API response structure
    const mockData = [
      {
        id: 1,
        title: "Getting Started with React",
        totalStats: { views: 1250, reads: 890 },
        earnings: { total: { units: 15, nanos: 500000000 } },
        category: "Technology",
        status: "published"
      },
      {
        id: 2,
        title: "Advanced JavaScript Patterns",
        totalStats: { views: 2100, reads: 1450 },
        earnings: { total: { units: 28, nanos: 750000000 } },
        category: "Programming",
        status: "published"
      }
    ];

    setApiData(mockData);

    // Simulate dynamic updates every 30 seconds
    const interval = setInterval(() => {
      setApiData(prev => prev.map(item => ({
        ...item,
        totalStats: {
          views: item.totalStats.views + Math.floor(Math.random() * 50),
          reads: item.totalStats.reads + Math.floor(Math.random() * 20)
        }
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleDataUpdate = (processedData) => {
    console.log('Report data updated:', processedData);
  };

  return (
    <div>
      <h1>Medium Stats Report</h1>
      <ReportGenerator 
        apiData={apiData} 
        onDataUpdate={handleDataUpdate}
      />
    </div>
  );
};

export default App;