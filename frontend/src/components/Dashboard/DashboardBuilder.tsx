import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Button,
  Space,
  Spin,
  Modal,
  Form,
  Input,
  Slider,
  Switch,
  ColorPicker,
  Empty,
  Popconfirm,
  message,
  Tag,
  Tooltip,
  Divider,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  FullscreenOutlined,
  SaveOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import { dashboardApi } from "../../services/api";

const { Option } = Select;

interface ChartConfig {
  id: string;
  title: string;
  type: "bar" | "line" | "pie" | "area";
  table: string;
  groupBy: string;
  aggregation: string;
  limit: number;
  colors?: string[];
  showLabels?: boolean;
  showLegend?: boolean;
}

interface StatisticsData {
  summary: {
    total_housing: number;
    total_owners: number;
    total_residents: number;
    total_organizations: number;
    total_area: number;
    avg_area: number;
  };
  categories: Record<string, number>;
  build_years: Record<string, number>;
  housing_by_floors: Record<string, number>;
}

const defaultCharts: ChartConfig[] = [
  {
    id: "1",
    title: "Распределение жилого фонда по категориям",
    type: "pie",
    table: "housing",
    groupBy: "Категория",
    aggregation: "COUNT",
    limit: 10,
    showLabels: true,
    showLegend: true,
  },
  {
    id: "2",
    title: "Количество объектов по этажности",
    type: "bar",
    table: "housing",
    groupBy: "Этажность",
    aggregation: "COUNT",
    limit: 15,
    showLabels: true,
    showLegend: true,
  },
  {
    id: "3",
    title: "Распределение по годам постройки",
    type: "line",
    table: "housing",
    groupBy: "Год постройки",
    aggregation: "COUNT",
    limit: 20,
    showLabels: false,
    showLegend: true,
  },
  {
    id: "4",
    title: "Собственники по типам",
    type: "pie",
    table: "owners",
    groupBy: "Тип собственности",
    aggregation: "COUNT",
    limit: 10,
    showLabels: true,
    showLegend: true,
  },
];

const tableOptions = [
  { value: "housing", label: "Жилой фонд", icon: <HomeOutlined /> },
  { value: "owners", label: "Собственники", icon: <TeamOutlined /> },
  { value: "residents", label: "Жители", icon: <UserOutlined /> },
  { value: "organizations", label: "Организации", icon: <ShopOutlined /> },
];

const aggregationOptions = [
  { value: "COUNT", label: "Количество" },
  { value: "SUM", label: "Сумма" },
  { value: "AVG", label: "Среднее" },
  { value: "MAX", label: "Максимум" },
  { value: "MIN", label: "Минимум" },
];

const chartTypeOptions = [
  { value: "bar", label: "Гистограмма", icon: <BarChartOutlined /> },
  { value: "line", label: "Линейная", icon: <LineChartOutlined /> },
  { value: "pie", label: "Круговая", icon: <PieChartOutlined /> },
  { value: "area", label: "Область", icon: <AreaChartOutlined /> },
];

export const DashboardBuilder: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [chartData, setChartData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadStatistics();

    // Загружаем сохраненные чарты из localStorage
    const savedCharts = localStorage.getItem("dashboard_charts_v2");
    if (savedCharts) {
      try {
        const parsed = JSON.parse(savedCharts);
        setCharts(parsed);
        // Загружаем данные для сохраненных чартов
        setTimeout(() => loadChartsData(parsed), 100);
      } catch (e) {
        console.error("Failed to load saved charts:", e);
        setCharts(defaultCharts);
        setTimeout(() => loadChartsData(defaultCharts), 100);
      }
    } else {
      setCharts(defaultCharts);
      setTimeout(() => loadChartsData(defaultCharts), 100);
    }
  }, []);

  useEffect(() => {
    // Сохраняем чарты в localStorage при изменении
    if (charts.length > 0) {
      localStorage.setItem("dashboard_charts_v2", JSON.stringify(charts));
    }
  }, [charts]);

  const loadStatistics = async () => {
    setStatsLoading(true);
    try {
      // Сначала пробуем получить summary (который уже работает правильно)
      const summaryData = await dashboardApi.getSummary();
      console.log("Summary data:", summaryData);

      // Устанавливаем статистику из summary
      setStatistics({
        summary: {
          total_housing: summaryData?.summary?.total_housing || 0,
          total_owners: summaryData?.summary?.total_owners || 0,
          total_residents: summaryData?.summary?.total_residents || 0,
          total_organizations: summaryData?.summary?.total_organizations || 0,
          total_area: 0,
          avg_area: 0,
        },
        categories: {},
        build_years: {},
        housing_by_floors: {},
      });

      // Затем пробуем получить расширенную статистику для дополнительных данных
      try {
        const advancedData = await dashboardApi.getAdvancedStats();
        console.log("Advanced data:", advancedData);

        setStatistics((prev) => ({
          ...prev,
          summary: {
            ...prev.summary,
            total_area: advancedData?.summary?.total_area || 0,
            avg_area: advancedData?.summary?.avg_area || 0,
          },
          categories: advancedData?.categories || {},
          build_years: advancedData?.build_years || {},
          housing_by_floors: advancedData?.housing_by_floors || {},
        }));
      } catch (e) {
        console.warn("Advanced stats not available:", e);
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
      // Устанавливаем нулевые значения при ошибке
      setStatistics({
        summary: {
          total_housing: 0,
          total_owners: 0,
          total_residents: 0,
          total_organizations: 0,
          total_area: 0,
          avg_area: 0,
        },
        categories: {},
        build_years: {},
        housing_by_floors: {},
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadChartsData = async (chartsToLoad: ChartConfig[]) => {
    setLoading(true);
    try {
      const dataPromises = chartsToLoad.map(async (chart) => {
        try {
          const data = await dashboardApi.getChartData(chart);
          return { id: chart.id, data: data.data || [] };
        } catch (error) {
          // Если метод не реализован, используем getStats
          try {
            const data = await dashboardApi.getStats(chart.groupBy);
            return { id: chart.id, data: data.data || [] };
          } catch (e) {
            console.error(`Failed to load chart ${chart.id}:`, e);
            return { id: chart.id, data: [] };
          }
        }
      });

      const results = await Promise.all(dataPromises);
      const dataMap: Record<string, any> = {};
      results.forEach(({ id, data }) => {
        dataMap[id] = data;
      });

      setChartData(dataMap);
    } catch (error) {
      console.error("Failed to load charts data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllChartsData = () => {
    loadChartsData(charts);
  };

  const loadAvailableFields = async (table: string) => {
    try {
      const result = await dashboardApi.getTableFields(table);
      setAvailableFields(result.fields || []);
    } catch (error) {
      console.error("Failed to load fields:", error);
      // Если метод не реализован, используем предопределенные поля
      const defaultFields: Record<string, string[]> = {
        housing: [
          "Категория",
          "Этажность",
          "Год постройки",
          "Материал",
          "Площадь",
        ],
        owners: ["Тип собственности", "ФИО", "Доля"],
        residents: ["Пол", "Возраст", "Дата регистрации"],
        organizations: ["Тип организации", "Название"],
      };
      setAvailableFields(defaultFields[table] || []);
    }
  };

  const handleAddChart = () => {
    setEditingChart(null);
    form.resetFields();
    form.setFieldsValue({
      type: "bar",
      table: "housing",
      aggregation: "COUNT",
      limit: 20,
      showLabels: true,
      showLegend: true,
    });
    loadAvailableFields("housing");
    setModalVisible(true);
  };

  const handleEditChart = (chart: ChartConfig) => {
    setEditingChart(chart);
    form.setFieldsValue(chart);
    loadAvailableFields(chart.table);
    setModalVisible(true);
  };

  const handleDuplicateChart = (chart: ChartConfig) => {
    const newChart = {
      ...chart,
      id: Date.now().toString(),
      title: `${chart.title} (копия)`,
    };
    setCharts([...charts, newChart]);
    loadChartsData([newChart]);
    message.success("График скопирован");
  };

  const handleDeleteChart = (chartId: string) => {
    setCharts(charts.filter((c) => c.id !== chartId));
    setChartData((prev) => {
      const newData = { ...prev };
      delete newData[chartId];
      return newData;
    });
    message.success("График удален");
  };

  const handleSaveChart = async () => {
    try {
      const values = await form.validateFields();

      const newChart: ChartConfig = {
        id: editingChart?.id || Date.now().toString(),
        ...values,
      };

      if (editingChart) {
        setCharts(charts.map((c) => (c.id === editingChart.id ? newChart : c)));
        message.success("График обновлен");
      } else {
        setCharts([...charts, newChart]);
        message.success("График добавлен");
      }

      setModalVisible(false);

      // Загружаем данные для нового/обновленного графика
      loadChartsData([newChart]);
    } catch (error) {
      console.error("Failed to save chart:", error);
    }
  };

  const handleTableChange = (table: string) => {
    loadAvailableFields(table);
    form.setFieldsValue({ groupBy: undefined });
  };

  const handleExportChart = (chartId: string) => {
    const chart = charts.find((c) => c.id === chartId);
    if (!chart) return;

    const chartElement = document.querySelector(`#chart-${chartId} canvas`);
    if (chartElement) {
      // Конвертируем canvas в изображение
      const canvas = chartElement as HTMLCanvasElement;
      const link = document.createElement("a");
      link.download = `${chart.title}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      message.success("График сохранен как PNG");
    } else {
      message.warning("Не удалось экспортировать график");
    }
  };

  const handleResetToDefault = () => {
    setCharts(defaultCharts);
    loadChartsData(defaultCharts);
    message.success("Сброшено к настройкам по умолчанию");
  };

  const getChartOption = (chart: ChartConfig, data: any[]) => {
    if (!data || data.length === 0) {
      return {
        title: {
          text: "Нет данных для отображения",
          left: "center",
          top: "center",
        },
      };
    }

    const baseOption: any = {
      title: {
        text: chart.title,
        left: "center",
        textStyle: { fontSize: 16, fontWeight: "bold" },
      },
      tooltip: {
        trigger: chart.type === "pie" ? "item" : "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      legend: {
        show: chart.showLegend,
        orient: "horizontal",
        left: "center",
        bottom: 0,
      },
      grid: {
        left: "10%",
        right: "5%",
        top: "20%",
        bottom: "15%",
        containLabel: true,
      },
    };

    const categories = data.map((item) => item.category || "Не указано");
    const values = data.map((item) => item.value || 0);

    if (chart.type === "pie") {
      baseOption.series = [
        {
          name: chart.title,
          type: "pie",
          radius: ["40%", "65%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: "#fff",
            borderWidth: 1,
          },
          label: {
            show: chart.showLabels,
            formatter: "{b}: {d}%",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
            },
            scale: true,
          },
          data: data.map((item) => ({
            name: item.category || "Не указано",
            value: item.value || 0,
          })),
        },
      ];
      baseOption.tooltip.formatter = "{b}: {c} ({d}%)";
    } else {
      baseOption.xAxis = {
        type: "category",
        data: categories,
        axisLabel: {
          rotate: categories.length > 8 ? 45 : 0,
          interval: 0,
        },
      };

      baseOption.yAxis = {
        type: "value",
        name:
          aggregationOptions.find((o) => o.value === chart.aggregation)
            ?.label || "",
      };

      const seriesType = chart.type === "area" ? "line" : chart.type;
      baseOption.series = [
        {
          name: chart.title,
          type: seriesType,
          data: values,
          areaStyle: chart.type === "area" ? {} : undefined,
          smooth: chart.type === "line" || chart.type === "area",
          label: {
            show: chart.showLabels,
            position: "top",
            fontSize: 11,
          },
          itemStyle: {
            color: chart.colors?.[0] || "#1890ff",
          },
          lineStyle: {
            width: 3,
          },
        },
      ];
    }

    return baseOption;
  };

  const renderStatisticsCards = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card loading={statsLoading}>
          <Statistic
            title="Объектов жилого фонда"
            value={statistics?.summary?.total_housing || 0}
            prefix={<HomeOutlined />}
            valueStyle={{ color: "#3f8600" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={statsLoading}>
          <Statistic
            title="Собственников"
            value={statistics?.summary?.total_owners || 0}
            prefix={<TeamOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={statsLoading}>
          <Statistic
            title="Зарегистрированных жителей"
            value={statistics?.summary?.total_residents || 0}
            prefix={<UserOutlined />}
            valueStyle={{ color: "#722ed1" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card loading={statsLoading}>
          <Statistic
            title="Организаций"
            value={statistics?.summary?.total_organizations || 0}
            prefix={<ShopOutlined />}
            valueStyle={{ color: "#fa8c16" }}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderChartCard = (chart: ChartConfig) => {
    const data = chartData[chart.id] || [];
    const tableInfo = tableOptions.find((t) => t.value === chart.table);
    const isLoading = loading && !data.length;

    return (
      <Card
        key={chart.id}
        id={`chart-${chart.id}`}
        style={{ height: "100%" }}
        hoverable
        extra={
          <Space>
            <Tooltip title="На весь экран">
              <Button
                type="text"
                size="small"
                icon={<FullscreenOutlined />}
                onClick={() => setFullscreenChart(chart.id)}
              />
            </Tooltip>
            <Tooltip title="Экспорт в PNG">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleExportChart(chart.id)}
              />
            </Tooltip>
            <Tooltip title="Дублировать">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleDuplicateChart(chart)}
              />
            </Tooltip>
            <Tooltip title="Редактировать">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditChart(chart)}
              />
            </Tooltip>
            <Tooltip title="Удалить">
              <Popconfirm
                title="Удалить график?"
                description="Это действие нельзя отменить"
                onConfirm={() => handleDeleteChart(chart.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        }
        actions={[
          <Tag icon={tableInfo?.icon} color="blue">
            {tableInfo?.label}
          </Tag>,
          <Tag color="green">
            {
              aggregationOptions.find((o) => o.value === chart.aggregation)
                ?.label
            }
          </Tag>,
          chart.groupBy && <Tag>{chart.groupBy}</Tag>,
        ].filter(Boolean)}
      >
        <Spin spinning={isLoading}>
          <div style={{ height: 300 }}>
            {data.length > 0 ? (
              <ReactECharts
                option={getChartOption(chart, data)}
                style={{ height: "100%" }}
                notMerge={true}
              />
            ) : (
              <Empty
                description="Нет данных для отображения"
                style={{ marginTop: 80 }}
              />
            )}
          </div>
        </Spin>
      </Card>
    );
  };

  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Заголовок и действия */}
        <Card>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ margin: 0 }}>📊 Аналитическая панель</h2>
              <p style={{ margin: "8px 0 0", color: "#666" }}>
                Создавайте и настраивайте графики на основе данных из реестра
              </p>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadStatistics();
                  loadAllChartsData();
                }}
              >
                Обновить
              </Button>
              <Button onClick={handleResetToDefault}>Сбросить</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddChart}
              >
                Добавить график
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Карточки статистики */}
        {renderStatisticsCards()}

        {/* Сетка графиков */}
        {charts.length > 0 ? (
          <Row gutter={[16, 16]}>
            {charts.map((chart) => (
              <Col key={chart.id} xs={24} lg={12} xl={8}>
                {renderChartCard(chart)}
              </Col>
            ))}
          </Row>
        ) : (
          <Card>
            <Empty description="Нет графиков">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddChart}
              >
                Создать первый график
              </Button>
            </Empty>
          </Card>
        )}

        {/* Модальное окно для добавления/редактирования графика */}
        <Modal
          title={editingChart ? "Редактировать график" : "Новый график"}
          open={modalVisible}
          onOk={handleSaveChart}
          onCancel={() => setModalVisible(false)}
          width={600}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              type: "bar",
              table: "housing",
              aggregation: "COUNT",
              limit: 20,
              showLabels: true,
              showLegend: true,
            }}
          >
            <Form.Item
              name="title"
              label="Название графика"
              rules={[{ required: true, message: "Введите название" }]}
            >
              <Input placeholder="Например: Распределение по категориям" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Тип графика"
                  rules={[{ required: true }]}
                >
                  <Select>
                    {chartTypeOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        <Space>
                          {opt.icon}
                          {opt.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="table"
                  label="Источник данных"
                  rules={[{ required: true }]}
                >
                  <Select onChange={handleTableChange}>
                    {tableOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        <Space>
                          {opt.icon}
                          {opt.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="groupBy"
                  label="Группировать по"
                  rules={[{ required: true, message: "Выберите поле" }]}
                >
                  <Select placeholder="Выберите поле для группировки">
                    {availableFields.map((field) => (
                      <Option key={field} value={field}>
                        {field}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="aggregation"
                  label="Агрегация"
                  rules={[{ required: true }]}
                >
                  <Select>
                    {aggregationOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="limit" label="Количество записей">
                  <Slider
                    min={5}
                    max={50}
                    marks={{ 5: "5", 20: "20", 50: "50" }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="colors" label="Основной цвет">
                  <ColorPicker />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="showLabels"
                  valuePropName="checked"
                  label="Показывать подписи"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="showLegend"
                  valuePropName="checked"
                  label="Показывать легенду"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* Модальное окно для полноэкранного просмотра */}
        <Modal
          title={charts.find((c) => c.id === fullscreenChart)?.title}
          open={!!fullscreenChart}
          onCancel={() => setFullscreenChart(null)}
          footer={[
            <Button
              key="export"
              icon={<DownloadOutlined />}
              onClick={() => {
                if (fullscreenChart) handleExportChart(fullscreenChart);
              }}
            >
              Экспорт
            </Button>,
            <Button
              key="close"
              type="primary"
              onClick={() => setFullscreenChart(null)}
            >
              Закрыть
            </Button>,
          ]}
          width="90%"
          style={{ top: 20 }}
        >
          {fullscreenChart && (
            <div style={{ height: "75vh" }}>
              {(() => {
                const chart = charts.find((c) => c.id === fullscreenChart);
                const data = chartData[fullscreenChart] || [];
                return chart && data.length > 0 ? (
                  <ReactECharts
                    option={getChartOption(chart, data)}
                    style={{ height: "100%" }}
                  />
                ) : (
                  <Empty
                    description="Нет данных"
                    style={{ marginTop: "30vh" }}
                  />
                );
              })()}
            </div>
          )}
        </Modal>
      </Space>
    </div>
  );
};
