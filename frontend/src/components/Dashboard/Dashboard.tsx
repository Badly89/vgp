import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Button,
  Space,
  Spin,
} from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { dashboardApi } from '../../services/api';

const { Option } = Select;

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState('Категория');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [loading, setLoading] = useState(false);

  const groupByOptions = [
    { value: 'Категория', label: 'По категориям' },
    { value: 'Этажность', label: 'По этажности' },
    { value: 'Год постройки', label: 'По году постройки' },
    { value: 'Материал', label: 'По материалу стен' },
  ];

  useEffect(() => {
    loadSummary();
    loadChartData();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [groupBy]);

  const loadSummary = async () => {
    try {
      const data = await dashboardApi.getSummary();
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadChartData = async () => {
    setLoading(true);
    try {
      const result = await dashboardApi.getStats(groupBy);
      setChartData(result.data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartOption = () => {
    if (chartType === 'bar') {
      return {
        title: {
          text: `Распределение жилого фонда ${groupByOptions.find(o => o.value === groupBy)?.label.toLowerCase()}`,
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
        },
        xAxis: {
          type: 'category',
          data: chartData.map(item => item.category),
          axisLabel: { rotate: 45, interval: 0 },
        },
        yAxis: {
          type: 'value',
          name: 'Количество объектов',
        },
        series: [
          {
            name: 'Объектов',
            type: 'bar',
            data: chartData.map(item => item.value),
            itemStyle: {
              color: '#1890ff',
              borderRadius: [4, 4, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
            },
          },
        ],
        grid: {
          bottom: 100,
          top: 80,
        },
      };
    } else {
      return {
        title: {
          text: `Распределение жилого фонда ${groupByOptions.find(o => o.value === groupBy)?.label.toLowerCase()}`,
          left: 'center',
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          type: 'scroll',
        },
        series: [
          {
            name: 'Распределение',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: '{b}: {d}%',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold',
              },
            },
            data: chartData.map(item => ({
              name: item.category,
              value: item.value,
            })),
          },
        ],
      };
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Карточки с общей статистикой */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Всего объектов"
              value={summary?.total_housing || 0}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Собственников"
              value={summary?.total_owners || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Жителей"
              value={summary?.total_residents || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Организаций"
              value={summary?.total_organizations || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Конструктор графиков */}
      <Card title="Аналитика жилого фонда">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap>
            <Select
              value={groupBy}
              onChange={setGroupBy}
              style={{ width: 200 }}
            >
              {groupByOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
            
            <Button.Group>
              <Button
                type={chartType === 'bar' ? 'primary' : 'default'}
                icon={<BarChartOutlined />}
                onClick={() => setChartType('bar')}
              >
                Гистограмма
              </Button>
              <Button
                type={chartType === 'pie' ? 'primary' : 'default'}
                icon={<PieChartOutlined />}
                onClick={() => setChartType('pie')}
              >
                Круговая диаграмма
              </Button>
            </Button.Group>
          </Space>

          <Spin spinning={loading}>
            <div style={{ height: 500 }}>
              {chartData.length > 0 && (
                <ReactECharts
                  option={getChartOption()}
                  style={{ height: '100%' }}
                  notMerge={true}
                />
              )}
            </div>
          </Spin>
        </Space>
      </Card>
    </Space>
  );
};