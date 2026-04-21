import React, { useEffect, useState } from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Spin,
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Divider,
  Space,
  Avatar,
  Typography,
  Grid,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  PercentageOutlined,
  BankOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  NumberOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { ownersApi } from "../../services/api";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

interface OwnerModalProps {
  visible: boolean;
  ownerId: string | null;
  onClose: () => void;
}

export const OwnerModal: React.FC<OwnerModalProps> = ({
  visible,
  ownerId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState<any>(null);
  const screens = useBreakpoint();

  useEffect(() => {
    if (visible && ownerId) {
      loadOwnerDetails(ownerId);
    }
  }, [visible, ownerId]);

  const loadOwnerDetails = async (id: string) => {
    setLoading(true);
    try {
      const details = await ownersApi.getDetails(id);
      setOwner(details);
    } catch (error) {
      console.error("Ошибка загрузки собственника:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value.map((v) => formatValue(v)).join(", ");
      }
      return (
        value.display_value ||
        value["Почтовый адрес"] ||
        value["Адрес"] ||
        JSON.stringify(value)
      );
    }
    return String(value);
  };

  const formatNumber = (value: any): string => {
    if (!value) return "—";
    const num = parseFloat(value);
    return isNaN(num) ? formatValue(value) : num.toFixed(2);
  };

  const renderField = (
    label: string,
    value: any,
    icon?: React.ReactNode,
    color?: string,
  ) => {
    if (value === null || value === undefined || value === "") return null;

    return (
      <div
        style={{
          padding: "8px 12px",
          background: "#fafafa",
          borderRadius: 8,
          height: "100%",
        }}
      >
        <Text
          type="secondary"
          style={{ fontSize: 12, display: "block", marginBottom: 4 }}
        >
          {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
          {label}
        </Text>
        <Text strong style={{ fontSize: 14, wordBreak: "break-word" }}>
          {formatValue(value)}
        </Text>
      </div>
    );
  };

  const renderTag = (
    label: string,
    value: any,
    color: string,
    icon?: React.ReactNode,
  ) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <Tag color={color} style={{ fontSize: 13, padding: "4px 12px" }}>
        {icon} {label}: {formatValue(value)}
      </Tag>
    );
  };

  // Все поля в плоском списке для отображения
  const allFields = [
    { key: "Наименование", label: "Организация", icon: <BankOutlined /> },
    {
      key: "Вид собственности",
      label: "Вид собственности",
      isTag: true,
      color: "purple",
    },
    { key: "Тип собственника", label: "Тип", isTag: true, color: "cyan" },
    { key: "Телефон", label: "Телефон", icon: <PhoneOutlined /> },
    { key: "Email", label: "Email", icon: <MailOutlined /> },
    { key: "ИНН", label: "ИНН", icon: <BankOutlined /> },
    {
      key: "Доля",
      label: "Доля",
      icon: <PercentageOutlined />,
      isTag: true,
      color: "blue",
    },
    {
      key: "Общая S (м2)",
      label: "Общая площадь",
      suffix: "м²",
      icon: <HomeOutlined />,
    },

    {
      key: "ж/ф в собственности, S квартир (м2)",
      label: "В собственности",
      suffix: "м²",
    },
  ];

  const hasField = (key: string) => {
    const val = owner?.[key];
    return val !== null && val !== undefined && val !== "";
  };

  const visibleFields = allFields.filter((f) => hasField(f.key));

  return (
    <Modal
      title={
        <Space size="middle">
          <Avatar
            size={48}
            icon={<UserOutlined />}
            style={{ background: "#1890ff" }}
          />
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
              {owner?.["ФИО"] || owner?.["Наименование"] || "Собственник"}
            </Title>
          </div>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={screens.xs ? "95%" : screens.sm ? 700 : 900}
      destroyOnClose
      style={{ top: 20 }}
      styles={{ body: { padding: screens.xs ? 12 : 20 } }}
    >
      <Spin spinning={loading}>
        {owner && (
          <>
            {/* Адрес - выделенная строка */}
            {(owner["Почтовый адрес объекта"] || owner["Адрес объекта"]) && (
              <Card
                size="small"
                style={{
                  marginBottom: 20,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
                bodyStyle={{ padding: "12px 16px" }}
              >
                <Space wrap>
                  <EnvironmentOutlined
                    style={{ color: "#fff", fontSize: 16 }}
                  />
                  <Text
                    style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}
                  >
                    {formatValue(
                      owner["Почтовый адрес объекта"] || owner["Адрес объекта"],
                    )}
                  </Text>
                  {owner["№ дома"] && (
                    <Tag
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      Дом {formatValue(owner["№ дома"])}
                    </Tag>
                  )}
                  {owner["№ квартиры"] && (
                    <Tag
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      Кв. {formatValue(owner["№ квартиры"])}
                    </Tag>
                  )}
                </Space>
              </Card>
            )}

            {/* Ключевые показатели */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              {owner["Общая S (м2)"] && (
                <Col xs={12} sm={8}>
                  <div
                    style={{
                      padding: "12px",
                      background: "#f0f5ff",
                      borderRadius: 12,
                      textAlign: "center",
                    }}
                  >
                    <HomeOutlined
                      style={{
                        fontSize: 20,
                        color: "#1890ff",
                        marginBottom: 6,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#1890ff",
                      }}
                    >
                      {formatNumber(owner["Общая S (м2)"])}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Общая площадь (м²)
                    </Text>
                  </div>
                </Col>
              )}
            </Row>

            {/* Контактная информация - чипсы */}
            {(owner["Телефон"] || owner["Email"]) && (
              <Space wrap style={{ marginBottom: 20 }}>
                {owner["Телефон"] && (
                  <Tag
                    icon={<PhoneOutlined />}
                    color="blue"
                    style={{
                      fontSize: 14,
                      padding: "6px 14px",
                      borderRadius: 20,
                    }}
                  >
                    {owner["Телефон"]}
                  </Tag>
                )}
                {owner["Email"] && (
                  <Tag
                    icon={<MailOutlined />}
                    color="green"
                    style={{
                      fontSize: 14,
                      padding: "6px 14px",
                      borderRadius: 20,
                    }}
                  >
                    {owner["Email"]}
                  </Tag>
                )}
              </Space>
            )}

            <Divider style={{ margin: "16px 0" }} />

            {/* Сетка всех полей */}
            <Row gutter={[12, 12]}>
              {visibleFields.map((field) => (
                <Col xs={24} sm={12} md={8} key={field.key}>
                  {field.isTag ? (
                    <div style={{ padding: "4px 0" }}>
                      {renderTag(
                        field.label,
                        owner[field.key],
                        field.color || "default",
                        field.icon,
                      )}
                    </div>
                  ) : (
                    renderField(
                      field.label,
                      field.suffix
                        ? `${formatValue(owner[field.key])} ${field.suffix}`
                        : owner[field.key],
                      field.icon,
                    )
                  )}
                </Col>
              ))}
            </Row>

            {/* Дополнительные поля, не вошедшие в список */}
            {owner &&
              Object.keys(owner).some(
                (key) =>
                  !allFields.find((f) => f.key === key) &&
                  !key.startsWith("_") &&
                  owner[key] &&
                  typeof owner[key] !== "object",
              ) && (
                <>
                  <Divider style={{ margin: "16px 0" }} orientation="left">
                    <Text type="secondary">Дополнительно</Text>
                  </Divider>
                  <Row gutter={[12, 12]}>
                    {Object.keys(owner)
                      .filter(
                        (key) =>
                          !allFields.find((f) => f.key === key) &&
                          !key.startsWith("_") &&
                          // Исключаем ненужные поля
                          ![
                            "id",
                            "row_id",
                            "display_value",
                            "ФИО",
                            "Почтовый адрес объекта",
                            "Адрес объекта",
                            "№ дома",
                            "№",
                            "№ квартиры",
                            "Кол-во кв",
                            "ж/ф в собственности, кол-во квартир",
                            "Доля в праве общей Д=Sпом/Sобщ",
                            "Кол-во голосов Кгол= Д х Кобщ",
                            "3-х комн кол-во приват",
                            "3-х комн площадь приват",
                            "Числ по Прив",
                            "Приват ж/ф, доля",
                            "Приват ж/ф, кол-во голосов",
                          ].includes(key) &&
                          owner[key] &&
                          typeof owner[key] !== "object",
                      )
                      .slice(0, 12)
                      .map((key) => (
                        <Col xs={24} sm={12} md={8} key={key}>
                          {renderField(key, owner[key])}
                        </Col>
                      ))}
                  </Row>
                </>
              )}
          </>
        )}
      </Spin>
    </Modal>
  );
};
