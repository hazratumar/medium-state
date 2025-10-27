import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Statistic, Select, Input, Row, Col, Space } from 'antd';
import { BarChartOutlined, TableOutlined, DollarOutlined, EyeOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;

const ReportGenerator = ({ apiData = [], onDataUpdate }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('descend');
  const [groupBy, setGroupBy] = useState('');
  const [searchText, setSearchText] = useState('');

  // Parse and structure API response data
  const parsedData = useMemo(() => {
    if (!apiData?.length) return [];
    
    return apiData.map((item, index) => ({
      key: index,
      id: item.id || index,
      title: item.title || item.name || 'Untitled',
      views: item.totalStats?.views || item.views || 0,
      reads: item.totalStats?.reads || item.reads || 0,
      earnings: parseFloat(((item.earnings?.total?.units || 0) + 
                          (item.earnings?.total?.nanos || 0) / 1000000000).toFixed(2)),
      category: item.category || 'General',
      date: item.createdAt || item.publishedAt || new Date().toISOString(),
      status: item.status || 'published'
    }));
  }, [apiData]);

  // Apply filters, search, and sorting
  useEffect(() => {
    let processed = [...parsedData];

    // Search filter
    if (searchText) {
      processed = processed.filter(item =>
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Sort data
    if (sortField) {
      processed.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const result = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === 'ascend' ? result : -result;
      });
    }

    setFilteredData(processed);
  }, [parsedData, searchText, sortField, sortOrder]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalViews = filteredData.reduce((sum, item) => sum + item.views, 0);
    const totalReads = filteredData.reduce((sum, item) => sum + item.reads, 0);
    const totalEarnings = filteredData.reduce((sum, item) => sum + item.earnings, 0);
    const avgReadRate = totalViews > 0 ? ((totalReads / totalViews) * 100).toFixed(1) : 0;

    return { totalViews, totalReads, totalEarnings, avgReadRate };
  }, [filteredData]);

  // Group data when groupBy is selected
  const groupedData = useMemo(() => {
    if (!groupBy) return filteredData;

    const groups = filteredData.reduce((acc, item) => {
      const key = item[groupBy];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(groups).map(([key, items]) => ({
      groupKey: key,
      items,
      totalViews: items.reduce((sum, item) => sum + item.views, 0),
      totalReads: items.reduce((sum, item) => sum + item.reads, 0),
      totalEarnings: items.reduce((sum, item) => sum + item.earnings, 0),
      count: items.length
    }));
  }, [filteredData, groupBy]);

  // Table columns configuration
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      sorter: true
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      sorter: true,
      render: (value) => value.toLocaleString()
    },
    {
      title: 'Reads',
      dataIndex: 'reads',
      key: 'reads',
      sorter: true,
      render: (value) => value.toLocaleString()
    },
    {
      title: 'Earnings',
      dataIndex: 'earnings',
      key: 'earnings',
      sorter: true,
      render: (value) => `$${value.toFixed(2)}`
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      filters: [...new Set(parsedData.map(item => item.category))].map(cat => ({
        text: cat,
        value: cat
      })),
      onFilter: (value, record) => record.category === value
    }
  ];

  // Grouped table columns
  const groupedColumns = [
    {
      title: groupBy.charAt(0).toUpperCase() + groupBy.slice(1),
      dataIndex: 'groupKey',
      key: 'groupKey'
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count'
    },
    {
      title: 'Total Views',
      dataIndex: 'totalViews',
      key: 'totalViews',
      render: (value) => value.toLocaleString()
    },
    {
      title: 'Total Reads',
      dataIndex: 'totalReads',
      key: 'totalReads',
      render: (value) => value.toLocaleString()
    },
    {
      title: 'Total Earnings',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      render: (value) => `$${value.toFixed(2)}`
    }
  ];

  // Handle table changes (sorting, filtering)
  const handleTableChange = (pagination, filters, sorter) => {
    setSortField(sorter.field || '');
    setSortOrder(sorter.order || 'descend');
  };

  // Update data when new API response is received
  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate(filteredData);
    }
  }, [filteredData, onDataUpdate]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Views"
              value={summaryStats.totalViews}
              prefix={<EyeOutlined />}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Reads"
              value={summaryStats.totalReads}
              prefix={<BarChartOutlined />}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Earnings"
              value={summaryStats.totalEarnings}
              prefix={<DollarOutlined />}
              formatter={(value) => `$${value.toFixed(2)}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg Read Rate"
              value={summaryStats.avgReadRate}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Space size="middle" wrap>
          <Search
            placeholder="Search by title or category"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Group by"
            value={groupBy}
            onChange={setGroupBy}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="category">Category</Option>
            <Option value="status">Status</Option>
          </Select>
          <Select
            placeholder="Sort by"
            value={sortField}
            onChange={setSortField}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="views">Views</Option>
            <Option value="reads">Reads</Option>
            <Option value="earnings">Earnings</Option>
            <Option value="title">Title</Option>
          </Select>
          <Select
            placeholder="Order"
            value={sortOrder}
            onChange={setSortOrder}
            style={{ width: 120 }}
          >
            <Option value="descend">Desc</Option>
            <Option value="ascend">Asc</Option>
          </Select>
        </Space>
      </Card>

      {/* Data Table */}
      <Card title={<><TableOutlined /> Report Data</>}>
        <Table
          columns={groupBy ? groupedColumns : columns}
          dataSource={groupBy ? groupedData : filteredData}
          onChange={handleTableChange}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} items`
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default ReportGenerator;