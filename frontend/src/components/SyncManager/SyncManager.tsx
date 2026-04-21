import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  Table,
  Modal,
  Progress,
  message,
  Tooltip,
  Row,
  Col,
  Tabs,
  Switch,
  TimePicker,
  Select,
  Divider,
} from "antd";
import {
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  ShopOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { syncApi } from "../../services/api";

export const SyncManager: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncingTable, setSyncingTable] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("sync");

  const [schedule, setSchedule] = useState<any>({
    enabled: false,
    time: "02:00",
    tables: ["residents", "owners", "housing", "organizations"],
    last_run: null,
    next_run: null,
  });

  const loadSyncStatus = async () => {
    setLoading(true);
    try {
      const result = await syncApi.getStatus();
      setSyncStatus(result.sync_status || []);
    } catch (error) {
      console.error("Ошибка загрузки статуса:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async () => {
    try {
      const result = await syncApi.getSchedule();
      if (result) {
        setSchedule(result);
      }
    } catch (error) {
      console.error("Ошибка загрузки расписания:", error);
    }
  };

  useEffect(() => {
    loadSyncStatus();
    loadSchedule();
  }, []);

  const handleSyncAll = async () => {
    Modal.confirm({
      title: "Запустить полную синхронизацию?",
      content:
        "Это может занять несколько минут. Все данные будут обновлены из DTable.",
      onOk: async () => {
        setSyncing(true);
        setProgress(10);

        try {
          const interval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 90) return 90;
              return prev + 10;
            });
          }, 500);

          await syncApi.syncAll();

          clearInterval(interval);
          setProgress(100);
          message.success("Полная синхронизация запущена");

          setTimeout(() => {
            loadSyncStatus();
            setProgress(0);
          }, 2000);
        } catch (error) {
          message.error("Ошибка синхронизации");
        } finally {
          setSyncing(false);
        }
      },
    });
  };

  const handleSyncTable = async (table: string, label: string) => {
    setSyncingTable(table);
    try {
      const result = await syncApi.syncTable(table);
      message.success(`${label}: синхронизировано ${result.synced} записей`);
      loadSyncStatus();
    } catch (error) {
      message.error(`Ошибка синхронизации ${label}`);
    } finally {
      setSyncingTable(null);
    }
  };

  const handleScheduleChange = async (key: string, value: any) => {
    const newSchedule = { ...schedule, [key]: value };
    setSchedule(newSchedule);
    try {
      await syncApi.setSchedule({ [key]: value });
      message.success("Настройки сохранены");
    } catch (error) {
      message.error("Ошибка сохранения настроек");
    }
  };

  const handleTablesChange = async (tables: string[]) => {
    const newSchedule = { ...schedule, tables };
    setSchedule(newSchedule);
    try {
      await syncApi.setSchedule({ tables });
      message.success("Таблицы обновлены");
    } catch (error) {
      message.error("Ошибка обновления таблиц");
    }
  };

  const handleRunNow = async () => {
    try {
      await syncApi.runSyncNow();
      message.success("Синхронизация по расписанию запущена");
      setTimeout(() => loadSchedule(), 2000);
    } catch (error) {
      message.error("Ошибка запуска синхронизации");
    }
  };

  const handleSyncResidents = () => handleSyncTable("residents", "Жители");
  const handleSyncOwners = () => handleSyncTable("owners", "Собственники");
  const handleSyncHousing = () => handleSyncTable("housing", "Жилой фонд");
  const handleSyncOrganizations = () =>
    handleSyncTable("organizations", "Организации");

  const columns = [
    {
      title: "Таблица",
      dataIndex: "table_name",
      key: "table_name",
      width: 200,
      render: (text: string) => {
        const names: Record<
          string,
          { label: string; icon: React.ReactNode; color: string }
        > = {
          residents: {
            label: "👥 Жители",
            icon: <UserOutlined />,
            color: "#722ed1",
          },
          owners: {
            label: "🏠 Собственники",
            icon: <TeamOutlined />,
            color: "#1890ff",
          },
          housing: {
            label: "🏢 Жилой фонд",
            icon: <HomeOutlined />,
            color: "#3f8600",
          },
          organizations: {
            label: "🏪 Организации",
            icon: <ShopOutlined />,
            color: "#fa8c16",
          },
        };
        const config = names[text] || {
          label: text,
          icon: null,
          color: "#666",
        };
        return (
          <Space>
            {config.icon}
            <span style={{ color: config.color }}>{config.label}</span>
          </Space>
        );
      },
    },
    {
      title: "Записей",
      dataIndex: "total_records",
      key: "total_records",
      width: 120,
      render: (count: number) => count?.toLocaleString() || "—",
    },
    {
      title: "Последняя синхронизация",
      dataIndex: "last_sync",
      key: "last_sync",
      width: 220,
      render: (date: string) => {
        if (!date) return "—";
        return new Date(date).toLocaleString("ru-RU");
      },
    },
    {
      title: "Статус",
      dataIndex: "sync_status",
      key: "sync_status",
      width: 120,
      render: (status: string) => {
        if (status === "success") {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Успешно
            </Tag>
          );
        }
        if (status === "error") {
          return (
            <Tag color="error" icon={<ExclamationCircleOutlined />}>
              Ошибка
            </Tag>
          );
        }
        if (status === "syncing") {
          return (
            <Tag color="processing" icon={<SyncOutlined spin />}>
              Синхронизация
            </Tag>
          );
        }
        return <Tag icon={<ClockCircleOutlined />}>{status || "ожидание"}</Tag>;
      },
    },
    {
      title: "Действия",
      key: "actions",
      width: 150,
      render: (_: any, record: any) => {
        const labels: Record<string, string> = {
          residents: "жителей",
          owners: "собственников",
          housing: "фонд",
          organizations: "организации",
        };
        return (
          <Button
            size="small"
            icon={<SyncOutlined />}
            loading={syncingTable === record.table_name}
            onClick={() =>
              handleSyncTable(
                record.table_name,
                labels[record.table_name] || record.table_name,
              )
            }
          >
            Синхронизировать
          </Button>
        );
      },
    },
  ];

  const quickSyncButtons = [
    {
      table: "housing",
      label: "Жилой фонд",
      icon: <HomeOutlined />,
      handler: handleSyncHousing,
    },
    {
      table: "owners",
      label: "Собственники",
      icon: <TeamOutlined />,
      handler: handleSyncOwners,
    },
    {
      table: "residents",
      label: "Жители",
      icon: <UserOutlined />,
      handler: handleSyncResidents,
    },
    {
      table: "organizations",
      label: "Организации",
      icon: <ShopOutlined />,
      handler: handleSyncOrganizations,
    },
  ];

  const tabItems = [
    {
      key: "sync",
      label: (
        <span>
          <SyncOutlined /> Ручная синхронизация
        </span>
      ),
      children: (
        <>
          {syncing && (
            <Progress
              percent={progress}
              status="active"
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
            {quickSyncButtons.map((btn) => (
              <Col key={btn.table}>
                <Button
                  icon={btn.icon}
                  loading={syncingTable === btn.table}
                  onClick={btn.handler}
                  disabled={syncing}
                >
                  {btn.label}
                </Button>
              </Col>
            ))}
          </Row>

          <Table
            columns={columns}
            dataSource={syncStatus}
            rowKey="table_name"
            loading={loading}
            pagination={false}
            size="middle"
            locale={{
              emptyText: "Нет данных о синхронизации. Запустите синхронизацию.",
            }}
          />

          <div style={{ marginTop: 16, fontSize: 12, color: "#8c8c8c" }}>
            💡 Данные хранятся в локальной базе MariaDB. Синхронизация обновляет
            их из DTable.
            <br />
            📊 Доступные таблицы: жилой фонд, собственники, жители, организации.
          </div>
        </>
      ),
    },
    {
      key: "schedule",
      label: (
        <span>
          <ScheduleOutlined /> Расписание
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card
            title="⏰ Автоматическая синхронизация по расписанию"
            size="small"
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Row align="middle">
                <Col span={8}>
                  <span>Включить автосинхронизацию:</span>
                </Col>
                <Col span={16}>
                  <Switch
                    checked={schedule.enabled}
                    onChange={(checked) =>
                      handleScheduleChange("enabled", checked)
                    }
                  />
                </Col>
              </Row>

              <Row align="middle">
                <Col span={8}>
                  <span>Время запуска:</span>
                </Col>
                <Col span={16}>
                  <TimePicker
                    format="HH:mm"
                    value={schedule.time ? dayjs(schedule.time, "HH:mm") : null}
                    onChange={(time) =>
                      handleScheduleChange("time", time?.format("HH:mm"))
                    }
                    disabled={!schedule.enabled}
                    style={{ width: 120 }}
                  />
                </Col>
              </Row>

              <Row align="top">
                <Col span={8}>
                  <span>Таблицы:</span>
                </Col>
                <Col span={16}>
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    value={schedule.tables}
                    onChange={handleTablesChange}
                    disabled={!schedule.enabled}
                    options={[
                      { label: "🏢 Жилой фонд", value: "housing" },
                      { label: "🏠 Собственники", value: "owners" },
                      { label: "👥 Жители", value: "residents" },
                      { label: "🏪 Организации", value: "organizations" },
                    ]}
                  />
                </Col>
              </Row>

              <Divider />

              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ color: "#8c8c8c" }}>Последний запуск:</div>
                  <strong>
                    {schedule.last_run
                      ? new Date(schedule.last_run).toLocaleString("ru-RU")
                      : "—"}
                  </strong>
                </Col>
                <Col span={12}>
                  <div style={{ color: "#8c8c8c" }}>Следующий запуск:</div>
                  <strong>
                    {schedule.next_run
                      ? new Date(schedule.next_run).toLocaleString("ru-RU")
                      : schedule.enabled
                        ? `Сегодня/завтра в ${schedule.time}`
                        : "—"}
                  </strong>
                </Col>
              </Row>

              <Divider />

              <Button type="primary" onClick={handleRunNow}>
                🚀 Запустить синхронизацию сейчас
              </Button>
            </Space>
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <SyncOutlined />
          <span>Синхронизация данных с DTable</span>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<SyncOutlined />}
            onClick={() => {
              loadSyncStatus();
              loadSchedule();
            }}
            loading={loading}
          >
            Обновить
          </Button>
          <Button
            type="primary"
            onClick={handleSyncAll}
            loading={syncing}
            disabled={syncing}
          >
            Полная синхронизация
          </Button>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Card>
  );
};
