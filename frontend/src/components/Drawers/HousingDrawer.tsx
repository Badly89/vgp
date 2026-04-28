import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  Descriptions,
  Tag,
  Spin,
  Space,
  Divider,
  Statistic,
  Row,
  Col,
  Card,
  Button,
  Table,
  Empty,
  Typography,
  Breadcrumb,
} from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import { housingApi, ownersApi } from "../../services/api";
import { GerbSpinner } from "../GerbSpinner";

const { Text } = Typography;

interface HousingDrawerProps {
  visible: boolean;
  housingId: string | null;
  onClose: () => void;
  getAddress: (record: any) => string;
  formatDate: (date: string) => string;
  formatRelativeDate: (date: string) => string;
}

export const HousingDrawer: React.FC<HousingDrawerProps> = ({
  visible,
  housingId,
  onClose,
  getAddress,
  formatDate,
  formatRelativeDate,
}) => {
  const navigate = useNavigate(); // ← ДОБАВИТЬ ЭТУ СТРОКУ
  const [loading, setLoading] = useState(false);
  const [housing, setHousing] = useState<any>(null);
  const [view, setView] = useState<"info" | "owners" | "residents">("info");
  const [owners, setOwners] = useState<any[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);

  useEffect(() => {
    if (visible && housingId) {
      setView("info");
      loadHousingDetails(housingId);
    }
  }, [visible, housingId]);

  const loadHousingDetails = async (id: string) => {
    setLoading(true);
    try {
      const details = await housingApi.getDetails(id);
      setHousing(details);
    } catch (error) {
      console.error("Ошибка загрузки деталей:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOwners = async () => {
    if (!housing) return;
    setOwnersLoading(true);
    setView("owners");
    try {
      const address = getAddress(housing);
      const response = await ownersApi.getGroupedByAddress({
        page: 1,
        page_size: 500,
        search: `${address} ${housing["Номер дома"] || ""}`,
      });

      // Извлекаем собственников из групп
      const allOwners: any[] = [];
      (response.data || []).forEach((group: any) => {
        if (group.owners) {
          group.owners.forEach((owner: any) => {
            allOwners.push({
              ...owner,
              address: group.address,
              house_number: group.house_number,
            });
          });
        }
      });
      setOwners(allOwners);
    } catch (error) {
      console.error("Ошибка загрузки собственников:", error);
    } finally {
      setOwnersLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!housing) return "#52c41a";
    if (
      housing["Аварийный / не аварийный"] === true ||
      housing["Аварийный / не аварийный"] === "Да"
    )
      return "#ff4d4f";
    const year = parseInt(
      housing["Год ввода"] || housing["Год постройки"] || "0",
    );
    if (year >= 2010) return "#52c41a";
    if (year >= 1980) return "#1890ff";
    if (year >= 1960) return "#faad14";
    return "#ff7a45";
  };

  const getStatusText = () => {
    if (!housing) return "—";
    if (
      housing["Аварийный / не аварийный"] === true ||
      housing["Аварийный / не аварийный"] === "Да"
    )
      return "аварийное";
    const year = parseInt(
      housing["Год ввода"] || housing["Год постройки"] || "0",
    );
    if (year >= 2010) return "хорошее";
    if (year >= 1980) return "удовлетворительное";
    if (year >= 1960) return "требует ремонта";
    return "ветхое";
  };

  const getResidentsCount = (): number => {
    if (!housing) return 0;
    if (housing["Количество жильцов в доме"])
      return housing["Количество жильцов в доме"];
    if (housing["Список граждан Вынгапур"]) {
      return Array.isArray(housing["Список граждан Вынгапур"])
        ? housing["Список граждан Вынгапур"].length
        : 1;
    }
    return 0;
  };

  const getOwnersCount = (): number => {
    if (!housing) return 0;
    if (housing["Количество собственников жилья"])
      return housing["Количество собственников жилья"];
    if (housing["Список собственников жилья"]) {
      return Array.isArray(housing["Список собственников жилья"])
        ? housing["Список собственников жилья"].length
        : 1;
    }
    return 0;
  };

  // Колонки для таблицы собственников
  const ownerColumns = [
    {
      title: "ФИО / Наименование",
      dataIndex: "ФИО",
      key: "name",
      render: (text: string, record: any) => (
        <Text strong>{text || record["Наименование"] || "Не указано"}</Text>
      ),
    },
    {
      title: "Вид собственности",
      dataIndex: "Вид собственности",
      key: "type",
      width: 120,
      render: (text: string) => (text ? <Tag color="purple">{text}</Tag> : "—"),
    },
    {
      title: "Доля",
      dataIndex: "Доля",
      key: "share",
      width: 80,
      render: (text: string) => (text ? <Tag color="blue">{text}</Tag> : "—"),
    },
    {
      title: "Контакты",
      key: "contacts",
      width: 150,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          {record["Телефон"] && (
            <Text style={{ fontSize: 12 }}>
              <PhoneOutlined /> {record["Телефон"]}
            </Text>
          )}
          {record["Email"] && (
            <Text style={{ fontSize: 12 }}>
              <MailOutlined /> {record["Email"]}
            </Text>
          )}
        </Space>
      ),
    },
  ];

  // Контент в зависимости от выбранного вида
  const renderContent = () => {
    if (!housing) return null;

    switch (view) {
      case "owners":
        return (
          <Spin
            indicator={<GerbSpinner size={60} animation="pulse" />}
            spinning={ownersLoading}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Breadcrumb
                items={[
                  {
                    title: (
                      <a onClick={() => setView("info")}>
                        <HomeOutlined /> Объект
                      </a>
                    ),
                  },
                  {
                    title: (
                      <span>
                        <TeamOutlined /> Собственники ({owners.length})
                      </span>
                    ),
                  },
                ]}
              />

              <Table
                columns={ownerColumns}
                dataSource={owners}
                rowKey="_id"
                size="small"
                pagination={{
                  pageSize: 10,
                  showTotal: (t) => `Всего ${t} собственников`,
                }}
                scroll={{ x: 400 }}
              />
            </Space>
          </Spin>
        );

      case "residents":
        return (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Breadcrumb
              items={[
                {
                  title: (
                    <a onClick={() => setView("info")}>
                      <HomeOutlined /> Объект
                    </a>
                  ),
                },
                {
                  title: (
                    <span>
                      <UserOutlined /> Жители ({getResidentsCount()})
                    </span>
                  ),
                },
              ]}
            />
            <Empty description="Список жителей будет доступен в следующем обновлении" />
          </Space>
        );

      default:
        return (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Статус и категория */}
            <div
              style={{
                padding: "16px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: 12,
                color: "#fff",
              }}
            >
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600 }}>
                    {housing["Тип здания"] || "—"},{" "}
                    {housing["Количество этажей"] || "—"} эт.
                  </span>
                  <Tag
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      border: "none",
                    }}
                  >
                    {housing["Вид жилья"] || "—"}
                  </Tag>
                </div>
                <Space>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      opacity: 0.8,
                    }}
                  />
                  <span>{getStatusText()}</span>
                </Space>
              </Space>
            </div>

            {/* Ключевые показатели */}
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card
                  size="small"
                  styles={{ body: { padding: "12px", textAlign: "center" } }}
                >
                  <Statistic
                    title="Жителей"
                    value={getResidentsCount()}
                    prefix={<UserOutlined />}
                    valueStyle={{ fontSize: 24, color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  styles={{ body: { padding: "12px", textAlign: "center" } }}
                >
                  <Statistic
                    title="Собственников"
                    value={getOwnersCount()}
                    prefix={<TeamOutlined />}
                    valueStyle={{ fontSize: 24, color: "#722ed1" }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  styles={{ body: { padding: "12px", textAlign: "center" } }}
                >
                  <Statistic
                    title="Квартир"
                    value={housing["квартир всего"] || 0}
                    prefix={<HomeOutlined />}
                    valueStyle={{ fontSize: 24, color: "#52c41a" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Основная информация */}
            <Card title="🏠 Основная информация" size="small">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Адрес">
                  <EnvironmentOutlined
                    style={{ marginRight: 8, color: "#1890ff" }}
                  />
                  {getAddress(housing)}, д. {housing["Номер дома"] || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Тип дома">
                  {housing["Тип здания"] || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Год постройки">
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {housing["Год ввода"] || housing["Год постройки"] || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Этажность">
                  {housing["Количество этажей"]
                    ? `${housing["Количество этажей"]} эт.`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Подъездов">
                  {housing["Количество подъездов"] || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Квартир">
                  {housing["квартир всего"] || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Общая площадь">
                  {housing["Площадь общая"]
                    ? `${Number(housing["Площадь общая"]).toLocaleString()} м²`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Жилая площадь">
                  {housing["в том числе жилая"]
                    ? `${Number(housing["в том числе жилая"]).toLocaleString()} м²`
                    : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Категория">
                  <Tag color="blue">{housing["Вид жилья"] || "—"}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Тех. состояние">
                  <Space>
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: getStatusColor(),
                      }}
                    />
                    {getStatusText()}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Ссылки на связанные данные */}
            <Card title="🔗 Связанные данные" size="small">
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Button
                  block
                  icon={<TeamOutlined />}
                  onClick={() => {
                    const addr =
                      housing?.["Почтовый адрес"] || getAddress(housing);
                    const house = housing?.["Номер дома"] || "0";
                    console.log("Переход к собственникам:", addr, house); // ← ЛОГ
                    onClose();
                    navigate(
                      `/owners?address=${encodeURIComponent(addr)}&house=${encodeURIComponent(house)}`,
                    );
                  }}
                >
                  Собственники дома ({getOwnersCount()})
                  <ArrowRightOutlined style={{ marginLeft: 8 }} />
                </Button>

                <Button
                  block
                  icon={<TeamOutlined />}
                  onClick={() => {
                    const addr =
                      housing?.["Почтовый адрес"] || getAddress(housing);
                    const house = housing?.["Номер дома"] || "0";
                    console.log("Переход к собственникам:", { addr, house }); // ← ЛОГ
                    onClose();
                    navigate(
                      `/owners?address=${encodeURIComponent(addr)}&house=${encodeURIComponent(house)}`,
                    );
                  }}
                >
                  Жители дома ({housing["Количество жильцов в доме"] || "?"}
                  )
                  <ArrowRightOutlined style={{ marginLeft: 8 }} />
                </Button>
              </Space>
            </Card>

            {/* Даты */}
            <Card title="📅 Сроки" size="small">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Ожидаемый снос">
                  {housing["Ожидаемый снос"] || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Срок отселения">
                  {formatRelativeDate(housing["Срок отселения"])}
                </Descriptions.Item>
                <Descriptions.Item label="Срок сноса">
                  {formatRelativeDate(housing["Срок сноса"])}
                </Descriptions.Item>
                <Descriptions.Item label="НПА">
                  {housing["НПА"] || "—"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        );
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <HomeOutlined style={{ color: "#1890ff" }} />
          <span style={{ fontWeight: 600 }}>
            {housing
              ? `${getAddress(housing)}, д. ${housing["Номер дома"] || "—"}`
              : "Загрузка..."}
          </span>
        </Space>
      }
      placement="right"
      width={520}
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      <Spin
        indicator={<GerbSpinner size={80} animation="pulse" />}
        spinning={loading}
      >
        {renderContent()}
      </Spin>
    </Drawer>
  );
};
