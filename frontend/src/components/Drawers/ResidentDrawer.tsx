import React, { useEffect, useState } from "react";
import {
  Drawer,
  Tag,
  Spin,
  Space,
  Descriptions,
  Card,
  Collapse,
  Empty,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  IdcardOutlined,
  ManOutlined,
  WomanOutlined,
  BankOutlined,
  HeartOutlined,
  FileTextOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { housingApi } from "../../services/api";
import { THEME } from "../../styles/theme";

const COLORS = THEME.colors;
const RADIUS = THEME.radius;

interface ResidentDrawerProps {
  visible: boolean;
  resident: any;
  onClose: () => void;
  getFullName: (r: any) => string;
  getAddress: (r: any) => string;
  getGender: (r: any) => string | null;
  formatDate: (d: string) => string;
}

export const ResidentDrawer: React.FC<ResidentDrawerProps> = ({
  visible,
  resident,
  onClose,
  getFullName,
  getAddress,
  getGender,
  formatDate,
}) => {
  const [housingInfo, setHousingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && resident) {
      loadHousingInfo();
    }
  }, [visible, resident]);

  const loadHousingInfo = async () => {
    if (!resident) return;
    setLoading(true);
    try {
      const address = getAddress(resident);
      if (address && address !== "Без адреса") {
        const response = await housingApi.getList({
          page: 1,
          page_size: 10,
          search: address,
        });
        if (response.data?.length > 0) setHousingInfo(response.data[0]);
      }
    } catch (error) {
      console.error("Ошибка загрузки дома:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Функция для получения корректного адреса из массива
  const getFullAddress = (record: any): string => {
    const addrField = record["Почтовый адрес"];
    if (Array.isArray(addrField) && addrField.length > 0) {
      return addrField[0]?.display_value || "Без адреса";
    }
    // Fallback на getAddress, если массива нет
    return getAddress(record);
  };

  if (!resident) return null;

  const fullName = getFullName(resident);
  const genderValue = getGender(resident);
  const age = resident?.["Возраст (числом)"] || resident?.["Возраст"];
  const address = getFullAddress(resident); // Используем новую функцию для полного адреса
  const apartment = resident?.["№ квартиры"] || resident?.["Квартира"];
  const phone = resident?.["Телефон"];
  const email = resident?.["Email"];
  const category = resident?.["Категория"];
  const isChild =
    resident?.["Ребенок"] === "Да" || resident?.["Ребенок"] === true;

  return (
    <Drawer
      placement="right"
      width={600}
      open={visible}
      onClose={onClose}
      styles={{ body: { padding: 0, background: COLORS.background } }}
      title={null}
      closable={false}
    >
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            background: COLORS.gradientHeader,
            padding: "24px",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  color: "#fff",
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {fullName}
              </h2>
              <Space style={{ marginTop: 12 }} size={6} wrap>
                {category && (
                  <Tag
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      border: "none",
                      borderRadius: RADIUS.xs,
                      fontSize: 11,
                    }}
                  >
                    {category}
                  </Tag>
                )}
                {age && (
                  <Tag
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      border: "none",
                      borderRadius: RADIUS.xs,
                      fontSize: 11,
                    }}
                  >
                    {age} лет
                  </Tag>
                )}
                {genderValue && (
                  <Tag
                    style={{
                      background:
                        genderValue === "Женский"
                          ? "rgba(232, 180, 162, 0.4)"
                          : "rgba(200, 217, 227, 0.4)",
                      color: "#fff",
                      border: "none",
                      borderRadius: RADIUS.xs,
                      fontSize: 11,
                    }}
                  >
                    {genderValue}
                  </Tag>
                )}
              </Space>
            </div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background:
                  genderValue === "Женский"
                    ? COLORS.terracotta
                    : COLORS.northernBlue,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(255,255,255,0.3)",
                marginLeft: 16,
                flexShrink: 0,
              }}
            >
              {genderValue === "Женский" ? (
                <WomanOutlined style={{ color: "#fff", fontSize: 24 }} />
              ) : genderValue === "Мужской" ? (
                <ManOutlined style={{ color: "#fff", fontSize: 24 }} />
              ) : (
                <UserOutlined style={{ color: "#fff", fontSize: 24 }} />
              )}
            </div>
          </div>

          {/* Быстрые контакты в хедере */}
          {(phone || email) && (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              {phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <PhoneOutlined style={{ fontSize: 14 }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{phone}</span>
                </div>
              )}
              {email && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MailOutlined style={{ fontSize: 14 }} />
                  <span style={{ fontSize: 14 }}>{email}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
          {/* Информация о доме */}
          <Card
            style={{
              marginBottom: 16,
              borderRadius: RADIUS.lg,
              border: `1px solid ${COLORS.borderLight}`,
              boxShadow: COLORS.shadowSmall,
            }}
            styles={{ body: { padding: "16px" } }}
          >
            <div
              style={{
                fontSize: 11,
                color: COLORS.textMuted,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: 600,
              }}
            >
              Место жительства
            </div>
            <Spin spinning={loading} size="small">
              {housingInfo ? (
                <>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: COLORS.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    <EnvironmentOutlined
                      style={{ marginRight: 8, color: COLORS.terracotta }}
                    />
                    {address}, {housingInfo["Номер дома"] || "—"}
                  </div>
                  {apartment && (
                    <div
                      style={{
                        fontSize: 13,
                        color: COLORS.terracottaDark,
                        marginLeft: 28,
                      }}
                    >
                      кв. {apartment}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: COLORS.textPrimary, fontSize: 15 }}>
                  <EnvironmentOutlined
                    style={{ marginRight: 8, color: COLORS.terracotta }}
                  />
                  {address}
                  {apartment && `, кв. ${apartment}`}
                </div>
              )}
            </Spin>
          </Card>

          {/* Основная информация */}
          <Card
            style={{
              marginBottom: 16,
              borderRadius: RADIUS.lg,
              border: `1px solid ${COLORS.borderLight}`,
              boxShadow: COLORS.shadowSmall,
            }}
            styles={{ body: { padding: "16px" } }}
          >
            <div
              style={{
                fontSize: 11,
                color: COLORS.textMuted,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: 600,
              }}
            >
              Личные данные
            </div>
            <Descriptions column={1} size="small" colon={false}>
              {resident["Дата рождения"] && (
                <Descriptions.Item
                  label={
                    <span style={{ color: COLORS.textSecondary }}>
                      Дата рождения
                    </span>
                  }
                >
                  <span style={{ color: COLORS.textPrimary }}>
                    {formatDate(resident["Дата рождения"])}
                  </span>
                </Descriptions.Item>
              )}
              {resident["Родство"] && (
                <Descriptions.Item
                  label={
                    <span style={{ color: COLORS.textSecondary }}>Родство</span>
                  }
                >
                  <Tag
                    style={{
                      background: "rgba(92, 61, 46, 0.1)",
                      color: COLORS.primary,
                      border: "none",
                      borderRadius: RADIUS.xs,
                    }}
                  >
                    {resident["Родство"]}
                  </Tag>
                </Descriptions.Item>
              )}
              {resident["Дата регистрации"] && (
                <Descriptions.Item
                  label={
                    <span style={{ color: COLORS.textSecondary }}>
                      Дата регистрации
                    </span>
                  }
                >
                  <span style={{ color: COLORS.textPrimary }}>
                    {formatDate(resident["Дата регистрации"])}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Вкладки с деталями */}
          <Collapse
            expandIconPosition="end"
            bordered={false}
            style={{ background: "transparent" }}
            items={[
              {
                key: "documents",
                label: (
                  <Space>
                    <IdcardOutlined style={{ color: COLORS.northernBlue }} />
                    <span
                      style={{ fontWeight: 500, color: COLORS.textPrimary }}
                    >
                      Документы
                    </span>
                    {resident["СНИЛС"] && (
                      <Tag
                        color={COLORS.terracotta}
                        style={{
                          borderRadius: RADIUS.full,
                          fontSize: 10,
                          marginLeft: 8,
                          padding: "0 6px",
                          height: "auto",
                          lineHeight: "18px",
                        }}
                      >
                        Есть
                      </Tag>
                    )}
                  </Space>
                ),
                style: {
                  marginBottom: 12,
                  background: COLORS.surface,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.borderLight}`,
                },
                children: (
                  <div style={{ padding: "4px 0" }}>
                    <Descriptions column={1} size="small" colon={false}>
                      {resident["СНИЛС"] && (
                        <Descriptions.Item label="СНИЛС">
                          <span
                            style={{
                              fontFamily: "monospace",
                              background: COLORS.background,
                              padding: "2px 6px",
                              borderRadius: 4,
                              color: COLORS.textPrimary,
                            }}
                          >
                            {resident["СНИЛС"]}
                          </span>
                        </Descriptions.Item>
                      )}
                      {resident["Паспорт"] && (
                        <Descriptions.Item label="Паспорт">
                          <span style={{ color: COLORS.textPrimary }}>
                            {resident["Паспорт"]}
                          </span>
                        </Descriptions.Item>
                      )}
                      {resident["ИНН"] && (
                        <Descriptions.Item label="ИНН">
                          <span style={{ color: COLORS.textPrimary }}>
                            {resident["ИНН"]}
                          </span>
                        </Descriptions.Item>
                      )}
                      {resident["Полис ОМС"] && (
                        <Descriptions.Item label="Полис ОМС">
                          <span style={{ color: COLORS.textPrimary }}>
                            {resident["Полис ОМС"]}
                          </span>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                ),
              },
              {
                key: "work",
                label: (
                  <Space>
                    <BankOutlined style={{ color: COLORS.northernAurora }} />
                    <span
                      style={{ fontWeight: 500, color: COLORS.textPrimary }}
                    >
                      {isChild ? "Учеба" : "Работа"}
                    </span>
                    {(resident["Организация"] ||
                      resident["Школа"] ||
                      resident["Место учебы"] ||
                      resident["Место учебы"]) && (
                      <Tag
                        color={COLORS.northernAurora}
                        style={{
                          borderRadius: RADIUS.full,
                          fontSize: 10,
                          marginLeft: 8,
                          padding: "0 6px",
                          height: "auto",
                          lineHeight: "18px",
                        }}
                      >
                        Есть
                      </Tag>
                    )}
                  </Space>
                ),
                style: {
                  marginBottom: 12,
                  background: COLORS.surface,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.borderLight}`,
                },
                children: (
                  <div style={{ padding: "4px 0" }}>
                    <Descriptions column={1} size="small" colon={false}>
                      {isChild ? (
                        <>
                          {resident["Место учебы"] && (
                            <Descriptions.Item label="Место учебы">
                              <span style={{ color: COLORS.textPrimary }}>
                                {formatValue(resident["Место учебы"])}
                              </span>
                            </Descriptions.Item>
                          )}
                          {resident["Школа"] && (
                            <Descriptions.Item label="Школа">
                              <span style={{ color: COLORS.textPrimary }}>
                                {resident["Школа"]}
                              </span>
                            </Descriptions.Item>
                          )}
                          {resident["Класс"] && (
                            <Descriptions.Item label="Класс">
                              <Tag
                                style={{
                                  background: COLORS.northernIce,
                                  color: COLORS.primaryDark,
                                  border: `1px solid ${COLORS.border}`,
                                  borderRadius: RADIUS.xs,
                                }}
                              >
                                {resident["Класс"]}
                              </Tag>
                            </Descriptions.Item>
                          )}
                        </>
                      ) : (
                        <>
                          {resident["Организация"] && (
                            <Descriptions.Item label="Организация">
                              <span style={{ color: COLORS.textPrimary }}>
                                {formatValue(resident["Организация"])}
                              </span>
                            </Descriptions.Item>
                          )}
                          {resident["Вид организации"] && (
                            <Descriptions.Item label="Вид деятельности">
                              <span style={{ color: COLORS.textPrimary }}>
                                {resident["Вид организации"]}
                              </span>
                            </Descriptions.Item>
                          )}
                          {resident["Занятость"] && (
                            <Descriptions.Item label="Занятость">
                              <span style={{ color: COLORS.textPrimary }}>
                                {formatValue(resident["Занятость"])}
                              </span>
                            </Descriptions.Item>
                          )}
                          {resident["Должность"] && (
                            <Descriptions.Item label="Должность">
                              <span style={{ color: COLORS.textPrimary }}>
                                {resident["Должность"]}
                              </span>
                            </Descriptions.Item>
                          )}
                          {resident["Стаж"] && (
                            <Descriptions.Item label="Стаж">
                              <span style={{ color: COLORS.textPrimary }}>
                                {resident["Стаж"]}
                              </span>
                            </Descriptions.Item>
                          )}
                        </>
                      )}
                    </Descriptions>
                  </div>
                ),
              },
              {
                key: "family",
                label: (
                  <Space>
                    <HeartOutlined style={{ color: COLORS.terracotta }} />
                    <span
                      style={{ fontWeight: 500, color: COLORS.textPrimary }}
                    >
                      Семья
                    </span>
                    {resident["Семейное положение"] && (
                      <Tag
                        color={COLORS.terracotta}
                        style={{
                          borderRadius: RADIUS.full,
                          fontSize: 10,
                          marginLeft: 8,
                          padding: "0 6px",
                          height: "auto",
                          lineHeight: "18px",
                        }}
                      >
                        Есть
                      </Tag>
                    )}
                  </Space>
                ),
                style: {
                  marginBottom: 12,
                  background: COLORS.surface,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.borderLight}`,
                },
                children: (
                  <div style={{ padding: "4px 0" }}>
                    <Descriptions column={1} size="small" colon={false}>
                      {resident["Семейное положение"] && (
                        <Descriptions.Item label="Семейное положение">
                          <Tag
                            style={{
                              background: "rgba(198, 123, 92, 0.1)",
                              color: COLORS.terracotta,
                              border: "none",
                              borderRadius: RADIUS.xs,
                            }}
                          >
                            {resident["Семейное положение"]}
                          </Tag>
                        </Descriptions.Item>
                      )}
                      {resident["Количество детей"] && (
                        <Descriptions.Item label="Количество детей">
                          <span style={{ color: COLORS.textPrimary }}>
                            {resident["Количество детей"]}
                          </span>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                ),
              },
              {
                key: "privileges",
                label: (
                  <Space>
                    <FileTextOutlined style={{ color: COLORS.warning }} />
                    <span
                      style={{ fontWeight: 500, color: COLORS.textPrimary }}
                    >
                      Льготы и Прочее
                    </span>
                    {(resident["Льготные категории"] ||
                      resident["Вид фонда"] ||
                      resident["Примечание"]) && (
                      <Tag
                        color={COLORS.warning}
                        style={{
                          borderRadius: RADIUS.full,
                          fontSize: 10,
                          marginLeft: 8,
                          padding: "0 6px",
                          height: "auto",
                          lineHeight: "18px",
                        }}
                      >
                        Есть
                      </Tag>
                    )}
                  </Space>
                ),
                style: {
                  marginBottom: 12,
                  background: COLORS.surface,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.borderLight}`,
                },
                children: (
                  <div style={{ padding: "4px 0" }}>
                    {/* Вид фонда */}
                    {resident["Вид фонда"] && (
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            fontSize: 12,
                            color: COLORS.textSecondary,
                            marginBottom: 4,
                          }}
                        >
                          Вид фонда
                        </div>
                        <Tag
                          style={{
                            background: String(resident["Вид фонда"])
                              .toLowerCase()
                              .includes("спец")
                              ? "rgba(123, 158, 175, 0.1)"
                              : String(resident["Вид фонда"])
                                    .toLowerCase()
                                    .includes("маневр")
                                ? "rgba(212, 149, 106, 0.1)"
                                : String(resident["Вид фонда"])
                                      .toLowerCase()
                                      .includes("коммерч")
                                  ? "rgba(91, 140, 90, 0.1)"
                                  : "rgba(148, 163, 184, 0.1)",
                            color: String(resident["Вид фонда"])
                              .toLowerCase()
                              .includes("спец")
                              ? COLORS.northernBlue
                              : String(resident["Вид фонда"])
                                    .toLowerCase()
                                    .includes("маневр")
                                ? COLORS.warning
                                : String(resident["Вид фонда"])
                                      .toLowerCase()
                                      .includes("коммерч")
                                  ? COLORS.northernAurora
                                  : COLORS.textSecondary,
                            border: "none",
                            borderRadius: RADIUS.xs,
                            padding: "4px 12px",
                          }}
                        >
                          {resident["Вид фонда"]}
                        </Tag>
                      </div>
                    )}

                    {/* Льготные категории */}
                    {resident["Льготные категории"] && (
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            fontSize: 12,
                            color: COLORS.textSecondary,
                            marginBottom: 4,
                          }}
                        >
                          Льготные категории
                        </div>
                        <Space wrap>
                          {Array.isArray(resident["Льготные категории"]) ? (
                            resident["Льготные категории"].map(
                              (l: string, i: number) => (
                                <Tag
                                  key={i}
                                  style={{
                                    background: COLORS.background,
                                    color: COLORS.textPrimary,
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: RADIUS.xs,
                                  }}
                                >
                                  {l}
                                </Tag>
                              ),
                            )
                          ) : (
                            <Tag
                              style={{
                                background: COLORS.background,
                                color: COLORS.textPrimary,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: RADIUS.xs,
                              }}
                            >
                              {resident["Льготные категории"]}
                            </Tag>
                          )}
                        </Space>
                      </div>
                    )}

                    {/* Примечание */}
                    {resident["Примечание"] && (
                      <div
                        style={{
                          background: "rgba(212, 149, 106, 0.05)",
                          border: `1px solid ${COLORS.warning}`,
                          borderRadius: RADIUS.md,
                          padding: 12,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <FileTextOutlined
                          style={{
                            color: COLORS.warning,
                            fontSize: 16,
                            marginTop: 2,
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              color: COLORS.textMuted,
                              marginBottom: 4,
                            }}
                          >
                            ПРИМЕЧАНИЕ
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: COLORS.textPrimary,
                              lineHeight: 1.4,
                            }}
                          >
                            {resident["Примечание"]}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </Drawer>
  );
};
