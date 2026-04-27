import React from "react";
import {
  Modal,
  Card,
  Descriptions,
  Space,
  Tag,
  Avatar,
  Collapse,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
  IdcardOutlined,
  BankOutlined,
  HeartOutlined,
  FileTextOutlined,
  TeamOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

interface ResidentModalProps {
  open: boolean;
  onClose: () => void;
  resident: any;
  getFullName: (record: any) => string;
  getAddress: (record: any) => string;
  getGender: (record: any) => string | null;
  formatDate: (dateStr: string) => string;
  isEmergency?: (record: any) => boolean;
  isNotEmergency?: (record: any) => boolean;
}

export const ResidentModal: React.FC<ResidentModalProps> = ({
  open,
  onClose,
  resident,
  getFullName,
  getAddress,
  getGender,
  formatDate,
  isEmergency,
  isNotEmergency,
}) => {
  if (!resident) return null;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        if (value.length === 0) return "—";
        return value.map((v) => formatValue(v)).join(", ");
      }
      return value.display_value || JSON.stringify(value);
    }
    return String(value);
  };

  const emergency = isEmergency ? isEmergency(resident) : false;
  const notEmergency = isNotEmergency ? isNotEmergency(resident) : false;

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>{getFullName(resident)}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Основная информация */}
        <Card title="Основная информация" size="small">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ФИО">
              <div style={{ display: "flex", alignItems: "center" }}>
                {(() => {
                  const genderValue = getGender(resident);
                  return (
                    <Avatar
                      icon={
                        genderValue === "Женский" ? (
                          <WomanOutlined />
                        ) : genderValue === "Мужской" ? (
                          <ManOutlined />
                        ) : (
                          <UserOutlined />
                        )
                      }
                      style={{
                        backgroundColor:
                          genderValue === "Женский"
                            ? "#eb2f96"
                            : genderValue === "Мужской"
                              ? "#1890ff"
                              : "#8c8c8c",
                        marginRight: 16,
                      }}
                    />
                  );
                })()}
                <strong style={{ fontSize: 16 }}>
                  {getFullName(resident)}
                </strong>
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="Личные данные">
              <Space size="large" wrap>
                {(() => {
                  const genderValue = getGender(resident);
                  return genderValue && <span>⚥ {genderValue}</span>;
                })()}
                {resident["Дата рождения"] && (
                  <span>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {formatDate(resident["Дата рождения"])}
                  </span>
                )}
                {(resident["Возраст"] || resident["Возраст (числом)"]) && (
                  <Tag color="blue">
                    {resident["Возраст"] || resident["Возраст (числом)"]}
                  </Tag>
                )}
                {resident["Ребенок"] === "Да" && (
                  <Tag color="orange">Ребенок</Tag>
                )}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Контакты">
              <Space size="large" wrap>
                {resident["Телефон"] && (
                  <span>
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    {resident["Телефон"]}
                  </span>
                )}
                {resident["Email"] && <span>📧 {resident["Email"]}</span>}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Адрес регистрации">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  backgroundColor: "#f5f5f5",
                  padding: "12px 16px",
                  borderRadius: 8,
                }}
              >
                <EnvironmentOutlined
                  style={{ marginRight: 12, color: "#1890ff", marginTop: 2 }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500, wordBreak: "break-word" }}>
                    {getAddress(resident)}
                  </span>
                  {(resident["№ дома"] ||
                    resident["№ квартиры"] ||
                    resident["Квартира"]) && (
                    <div style={{ marginTop: 8, display: "flex", gap: 16 }}>
                      {resident["№ дома"] && (
                        <Tag color="blue" style={{ fontSize: 13, margin: 0 }}>
                          🏠 Дом №{resident["№ дома"]}
                        </Tag>
                      )}
                      {(resident["№ квартиры"] || resident["Квартира"]) && (
                        <Tag color="green" style={{ fontSize: 13, margin: 0 }}>
                          🚪 Кв.{" "}
                          {resident["№ квартиры"] || resident["Квартира"]}
                        </Tag>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Вид фонда">
              <Tag
                color={
                  resident?.["Вид фонда"]?.toLowerCase().includes("спец")
                    ? "blue"
                    : resident?.["Вид фонда"]?.toLowerCase().includes("маневр")
                      ? "orange"
                      : resident?.["Вид фонда"]
                            ?.toLowerCase()
                            .includes("коммерч")
                        ? "green"
                        : "default"
                }
              >
                {resident?.["Вид фонда"] || "—"}
              </Tag>
            </Descriptions.Item>

            {resident["Дата регистрации"] && (
              <Descriptions.Item label="Дата регистрации">
                <CalendarOutlined style={{ marginRight: 8 }} />
                {formatDate(resident["Дата регистрации"])}
              </Descriptions.Item>
            )}

            {resident["Родство"] && (
              <Descriptions.Item label="Родство">
                <Tag color="purple">{resident["Родство"]}</Tag>
              </Descriptions.Item>
            )}

            {resident["Категория"] && (
              <Descriptions.Item label="Категория">
                <Tag color="cyan">{resident["Категория"]}</Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Дополнительная информация */}
        <Collapse
          defaultActiveKey={[]}
          style={{ backgroundColor: "#fff" }}
          items={[
            {
              key: "documents",
              label: (
                <Space>
                  <IdcardOutlined style={{ color: "#1890ff" }} />
                  <span style={{ fontWeight: 500 }}>Документы</span>
                  {resident["СНИЛС"] && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      ✓
                    </Tag>
                  )}
                </Space>
              ),
              children: (
                <Descriptions column={1} size="small" bordered>
                  {resident["СНИЛС"] && (
                    <Descriptions.Item label="СНИЛС">
                      <span style={{ fontFamily: "monospace", fontSize: 14 }}>
                        {resident["СНИЛС"]}
                      </span>
                    </Descriptions.Item>
                  )}
                  {resident["Паспорт"] && (
                    <Descriptions.Item label="Паспорт">
                      <span style={{ fontSize: 13 }}>
                        {resident["Паспорт"]}
                      </span>
                    </Descriptions.Item>
                  )}
                  {resident["ИНН"] && (
                    <Descriptions.Item label="ИНН">
                      <span style={{ fontFamily: "monospace" }}>
                        {resident["ИНН"]}
                      </span>
                    </Descriptions.Item>
                  )}
                  {resident["Полис ОМС"] && (
                    <Descriptions.Item label="Полис ОМС">
                      {resident["Полис ОМС"]}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              ),
            },
            {
              key: "work",
              label: (
                <Space>
                  <BankOutlined style={{ color: "#52c41a" }} />
                  <span style={{ fontWeight: 500 }}>
                    {resident["Ребенок"] === "Да" ||
                    resident["Ребенок"] === true
                      ? "Школа"
                      : "Работа"}
                  </span>
                  {(resident["Организация"] ||
                    resident["Вид организации"] ||
                    resident["Занятость"]) && (
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      ✓
                    </Tag>
                  )}
                </Space>
              ),
              children: (
                <Descriptions column={1} size="small" bordered>
                  {resident["Ребенок"] === "Да" ||
                  resident["Ребенок"] === true ? (
                    <>
                      {resident["Место учебы"] && (
                        <Descriptions.Item label="Место учебы">
                          {resident["Место учебы"]}
                        </Descriptions.Item>
                      )}
                      {resident["Школа"] && (
                        <Descriptions.Item label="Школа">
                          {resident["Школа"]}
                        </Descriptions.Item>
                      )}
                      {resident["Класс"] && (
                        <Descriptions.Item label="Класс">
                          {resident["Класс"]}
                        </Descriptions.Item>
                      )}
                      {resident["Занятость"] ? (
                        <Descriptions.Item label="Занятость">
                          {formatValue(resident["Занятость"])}
                        </Descriptions.Item>
                      ) : (
                        <Descriptions.Item label="Занятость">
                          <Tag color="blue">Школьник</Tag>
                        </Descriptions.Item>
                      )}
                    </>
                  ) : (
                    <>
                      {resident["Организация"] && (
                        <Descriptions.Item label="Организация">
                          {formatValue(resident["Организация"])}
                        </Descriptions.Item>
                      )}
                      {resident["Вид организации"] && (
                        <Descriptions.Item label="Вид деятельности">
                          {resident["Вид организации"]}
                        </Descriptions.Item>
                      )}
                      {resident["Занятость"] && (
                        <Descriptions.Item label="Занятость">
                          {formatValue(resident["Занятость"])}
                        </Descriptions.Item>
                      )}
                      {resident["Должность"] && (
                        <Descriptions.Item label="Должность">
                          {resident["Должность"]}
                        </Descriptions.Item>
                      )}
                      {resident["Стаж"] && (
                        <Descriptions.Item label="Стаж">
                          {resident["Стаж"]}
                        </Descriptions.Item>
                      )}
                    </>
                  )}
                </Descriptions>
              ),
            },
            {
              key: "family",
              label: (
                <Space>
                  <HeartOutlined style={{ color: "#eb2f96" }} />
                  <span style={{ fontWeight: 500 }}>Семья</span>
                  {resident["Семейное положение"] && (
                    <Tag color="pink" style={{ marginLeft: 8 }}>
                      ✓
                    </Tag>
                  )}
                </Space>
              ),
              children: (
                <Descriptions column={1} size="small" bordered>
                  {resident["Семейное положение"] && (
                    <Descriptions.Item label="Семейное положение">
                      <Tag color="purple">{resident["Семейное положение"]}</Tag>
                    </Descriptions.Item>
                  )}
                  {resident["Количество детей"] && (
                    <Descriptions.Item label="Количество детей">
                      {resident["Количество детей"]}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              ),
            },
            {
              key: "other",
              label: (
                <Space>
                  <FileTextOutlined style={{ color: "#8c8c8c" }} />
                  <span style={{ fontWeight: 500 }}>Прочее</span>
                </Space>
              ),
              children: (
                <div style={{ padding: "8px 0" }}>
                  {/* Примечание */}
                  {resident["Примечание"] && (
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)",
                        border: "1px solid #ffe58f",
                        borderRadius: 12,
                        padding: "16px",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "flex-start" }}
                      >
                        <FileTextOutlined
                          style={{
                            color: "#faad14",
                            fontSize: 18,
                            marginRight: 12,
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#8c8c8c",
                              marginBottom: 4,
                            }}
                          >
                            Примечание
                          </div>
                          <div>{resident["Примечание"]}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Аварийность */}
                  {(emergency || notEmergency) && (
                    <div
                      style={{
                        background: emergency
                          ? "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)"
                          : "linear-gradient(135deg, #f6ffed 0%, #d9f8be 100%)",
                        border: emergency
                          ? "1px solid #ff7875"
                          : "1px solid #95de64",
                        borderRadius: 12,
                        padding: "16px",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "flex-start" }}
                      >
                        <span style={{ fontSize: 24, marginRight: 12 }}>
                          {emergency ? "⚠️" : "✅"}
                        </span>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: emergency ? "#ff4d4f" : "#52c41a",
                            }}
                          >
                            {emergency ? "Аварийный дом" : "Дом не аварийный"}
                          </div>
                          <div style={{ fontSize: 13, color: "#8c8c8c" }}>
                            {emergency
                              ? "Требуется расселение"
                              : "В нормальном состоянии"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Льготные категории */}
                  {resident["Льготные категории"] && (
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #f6ffed 0%, #d9f8be 100%)",
                        border: "1px solid #95de64",
                        borderRadius: 12,
                        padding: "16px",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 20, marginRight: 8 }}>🎁</span>
                        <span style={{ fontWeight: 500 }}>
                          Льготные категории
                        </span>
                      </div>
                      <Tag color="green">
                        {formatValue(resident["Льготные категории"])}
                      </Tag>
                    </div>
                  )}

                  {/* Ветеран */}
                  {resident["Ветеран"] && (
                    <Descriptions.Item label="Ветеран">
                      <Tag color="gold">{resident["Ветеран"]}</Tag>
                    </Descriptions.Item>
                  )}
                </div>
              ),
            },
          ].filter((item) => {
            const children = item.children as React.ReactElement;
            if (!children || !children.props) return false;
            return true;
          })}
        />
      </Space>
    </Modal>
  );
};
