import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  Tag,
  Spin,
  Space,
  Descriptions,
  Card,
  Button,
  Divider,
  Empty,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CloseOutlined,
  RightOutlined,
  TeamOutlined,
  PercentageOutlined,
  BankOutlined,
  MailOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import { ownersApi, housingApi } from "../../services/api";
import { GerbSpinner } from "../GerbSpinner";
import { THEME } from "../../styles/theme";

// Доступ к константам темы
const COLORS = THEME.colors;
const RADIUS = THEME.radius;

interface OwnerDrawerProps {
  visible: boolean;
  ownerId: string | null;
  onClose: () => void;
  getAddress: (record: any) => string;
}

export const OwnerDrawer: React.FC<OwnerDrawerProps> = ({
  visible,
  ownerId,
  onClose,
  getAddress,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState<any>(null);
  const [housingInfo, setHousingInfo] = useState<any>(null);
  const [housingLoading, setHousingLoading] = useState(false);

  useEffect(() => {
    if (visible && ownerId) loadOwnerDetails(ownerId);
  }, [visible, ownerId]);

  const loadOwnerDetails = async (id: string) => {
    setLoading(true);
    try {
      const details = await ownersApi.getDetails(id);
      setOwner(details);

      const ownerAddress = details.address_display || getAddress(details);
      const ownerHouse =
        details.house_number ||
        (Array.isArray(details["№ дома"])
          ? String(details["№ дома"][0])
          : String(details["№ дома"] || ""));

      if (ownerAddress && ownerAddress !== "Без адреса") {
        loadHousingInfo(ownerAddress, ownerHouse);
      }
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHousingInfo = async (address: string, houseNumber: string) => {
    setHousingLoading(true);
    try {
      const response = await housingApi.getList({
        page: 1,
        page_size: 200,
        search: address,
      });
      if (response.data?.length > 0) {
        const match = response.data.find(
          (item: any) =>
            String(item["Номер дома"] || "").trim() === houseNumber.trim(),
        );
        setHousingInfo(match || response.data[0]);
      }
    } catch (error) {
      console.error("Ошибка загрузки дома:", error);
    } finally {
      setHousingLoading(false);
    }
  };

  // Адаптация цветов для типа собственности
  const getOwnershipColor = (type: string) => {
    if (!type) return COLORS.textMuted;
    const t = type.toLowerCase();
    if (t.includes("муниц")) return COLORS.northernBlue; // Северное небо (синий)
    if (t.includes("частн") || t.includes("приват"))
      return COLORS.northernAurora; // Северное сияние (зеленый)
    return COLORS.terracotta; // Терракота по умолчанию
  };

  const getOwnershipLabel = (type: string) => {
    if (!type) return "—";
    const t = type.toLowerCase();
    if (t.includes("муниц")) return "Муниципальная";
    if (t.includes("частн") || t.includes("приват")) return "Частная";
    return type.length > 40 ? type.substring(0, 40) + "..." : type;
  };

  const getStatusColor = (house: any) => {
    if (!house) return COLORS.success;
    if (
      house["Аварийный / не аварийный"] === true ||
      house["Аварийный / не аварийный"] === "Да"
    )
      return COLORS.danger; // Кирпичный красный
    const year = parseInt(house["Год ввода"] || house["Год постройки"] || "0");
    if (year >= 2010) return COLORS.success; // Мховый зеленый
    if (year >= 1980) return COLORS.info; // Северное небо
    if (year >= 1960) return COLORS.warning; // Янтарный
    return "#ff7a45"; // Fallback оранжевый
  };

  const getStatusText = (house: any) => {
    if (!house) return "—";
    if (
      house["Аварийный / не аварийный"] === true ||
      house["Аварийный / не аварийный"] === "Да"
    )
      return "аварийное";
    const year = parseInt(house["Год ввода"] || house["Год постройки"] || "0");
    if (year >= 2010) return "хорошее";
    if (year >= 1980) return "удовлетворительное";
    if (year >= 1960) return "требует ремонта";
    return "ветхое";
  };

  const ownerType = owner?.["Вид собственности"] || "";
  const ownerShare = owner?.["Доля"] || "";
  const ownerPhone = owner?.["Телефон"] || "";
  const ownerEmail = owner?.["Email"] || owner?.["Почта"] || "";
  const ownerInn = owner?.["ИНН"] || "";

  // Секция "Право собственности"
  const renderOwnership = () => (
    <Card
      style={{
        margin: "16px 16px 0",
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: COLORS.shadowSmall,
      }}
      styles={{ body: { padding: "20px" } }}
    >
      <div
        style={{
          fontSize: 11,
          color: COLORS.textMuted,
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          fontWeight: 600,
        }}
      >
        Право собственности
      </div>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Тип собственности */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS.md,
              background: COLORS.background,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BankOutlined
              style={{ color: getOwnershipColor(ownerType), fontSize: 18 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
              Тип собственности
            </div>
            <Tag
              style={{
                background: getOwnershipColor(ownerType),
                color: "#fff",
                border: "none",
                borderRadius: RADIUS.xs,
                marginTop: 2,
              }}
            >
              {getOwnershipLabel(ownerType)}
            </Tag>
          </div>
        </div>

        {/* Доля */}
        {ownerShare && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS.md,
                background: COLORS.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PercentageOutlined
                style={{ color: COLORS.terracotta, fontSize: 18 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Доля в праве
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                {ownerShare.toString().includes("%")
                  ? ownerShare
                  : `${ownerShare}%`}
              </span>
            </div>
          </div>
        )}

        {/* Общая площадь */}
        {owner["Общая S (м2)"] > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS.md,
                background: COLORS.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HomeOutlined
                style={{ color: COLORS.northernIce, fontSize: 18 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Общая площадь
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                }}
              >
                {owner["Общая S (м2)"]} м²
              </span>
            </div>
          </div>
        )}

        {/* Голоса */}
        {owner["Кол-во голосов Кгол= Д х Кобщ"] > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS.md,
                background: COLORS.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleOutlined
                style={{ color: COLORS.northernAurora, fontSize: 18 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Количество голосов
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                }}
              >
                {owner["Кол-во голосов Кгол= Д х Кобщ"]}
              </span>
            </div>
          </div>
        )}
      </Space>
    </Card>
  );

  // Секция "Объект собственности"
  const renderProperty = () => (
    <Card
      style={{
        margin: "12px 16px",
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: COLORS.shadowSmall,
      }}
      styles={{ body: { padding: "20px" } }}
    >
      <div
        style={{
          fontSize: 11,
          color: COLORS.textMuted,
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          fontWeight: 600,
        }}
      >
        Объект собственности
      </div>

      <Spin spinning={housingLoading}>
        {housingInfo ? (
          <>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.textPrimary,
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <EnvironmentOutlined
                style={{ marginRight: 8, color: COLORS.terracotta }}
              />
              {getAddress(owner)}, {housingInfo["Номер дома"] || "—"}
            </div>
            {owner["№ квартиры"] && (
              <div
                style={{
                  fontSize: 14,
                  color: COLORS.terracottaDark,
                  marginBottom: 16,
                  marginLeft: 24,
                }}
              >
                квартира{" "}
                {Array.isArray(owner["№ квартиры"])
                  ? owner["№ квартиры"][0]
                  : owner["№ квартиры"]}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                background: COLORS.background,
                borderRadius: RADIUS.md,
                padding: 12,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.textMuted,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Категория
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                  }}
                >
                  {housingInfo["Вид жилья"] || housingInfo["Категория"] || "—"}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.textMuted,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Год
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                  }}
                >
                  {housingInfo["Год ввода"] || "—"}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.textMuted,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Материал
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                  }}
                >
                  {housingInfo["Тип здания"] || "—"}
                </div>
              </div>
            </div>
          </>
        ) : (
          <Empty
            description="Информация о доме не найдена"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ color: COLORS.textMuted }}
          />
        )}
      </Spin>
    </Card>
  );

  // Секция "Контакты"
  const renderContacts = () => (
    <Card
      style={{
        margin: "12px 16px",
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: COLORS.shadowSmall,
      }}
      styles={{ body: { padding: "20px" } }}
    >
      <div
        style={{
          fontSize: 11,
          color: COLORS.textMuted,
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          fontWeight: 600,
        }}
      >
        Контакты
      </div>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {ownerPhone && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS.md,
                background: COLORS.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PhoneOutlined
                style={{ color: COLORS.northernBlue, fontSize: 18 }}
              />
            </div>
            <span
              style={{
                fontSize: 15,
                color: COLORS.textPrimary,
                fontWeight: 500,
              }}
            >
              {ownerPhone}
            </span>
          </div>
        )}
        {ownerEmail && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS.md,
                background: COLORS.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MailOutlined
                style={{ color: COLORS.northernIce, fontSize: 18 }}
              />
            </div>
            <span style={{ fontSize: 15, color: COLORS.textPrimary }}>
              {ownerEmail}
            </span>
          </div>
        )}
        {ownerInn && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS.md,
                background: COLORS.background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BankOutlined
                style={{ color: COLORS.primaryLight, fontSize: 18 }}
              />
            </div>
            <span style={{ fontSize: 15, color: COLORS.textPrimary }}>
              ИНН {ownerInn}
            </span>
          </div>
        )}
      </Space>
    </Card>
  );

  // Секция "Дополнительно" (сокращенная)
  const renderDetails = () => (
    <Card
      style={{
        margin: "12px 16px",
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.borderLight}`,
        boxShadow: COLORS.shadowSmall,
      }}
      styles={{ body: { padding: "20px" } }}
    >
      <div
        style={{
          fontSize: 11,
          color: COLORS.textMuted,
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          fontWeight: 600,
        }}
      >
        Детальные сведения
      </div>

      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        {owner["Общая S по ЕРИЦ (м2)"] ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: `1px solid ${COLORS.borderLight}`,
            }}
          >
            <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Площадь по ЕРИЦ
            </span>
            <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>
              {owner["Общая S по ЕРИЦ (м2)"]} м²
            </span>
          </div>
        ) : null}

        {owner["Доля в праве общей Д=Sпом/Sобщ"] ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: `1px solid ${COLORS.borderLight}`,
            }}
          >
            <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Доля расчетная
            </span>
            <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>
              {typeof owner["Доля в праве общей Д=Sпом/Sобщ"] === "number"
                ? (owner["Доля в праве общей Д=Sпом/Sобщ"] * 100).toFixed(1) +
                  "%"
                : owner["Доля в праве общей Д=Sпом/Sобщ"]}
            </span>
          </div>
        ) : null}

        {owner["Муниципальный ж/ф, кол-во квартир"] ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: `1px solid ${COLORS.borderLight}`,
            }}
          >
            <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Муниципальных квартир
            </span>
            <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>
              {owner["Муниципальный ж/ф, кол-во квартир"] === 1 ? (
                <CheckCircleOutlined style={{ color: COLORS.northernAurora }} />
              ) : (
                owner["Муниципальный ж/ф, кол-во квартир"]
              )}
            </span>
          </div>
        ) : null}

        {[1, 2, 3, 4].map((roomNum) => {
          const privatCount = owner[`${roomNum}-но комн кол-во приват`];
          const privatArea = owner[`${roomNum}-но комн площадь приват`];
          const municCount = owner[`${roomNum}-но комн кол-во муниц`];
          const municArea = owner[`${roomNum}-но комн площадь муниц`];

          if (!privatCount && !municCount && !privatArea && !municArea)
            return null;

          const label = roomNum === 4 ? "4+" : roomNum;
          return (
            <div
              key={roomNum}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: `1px solid ${COLORS.borderLight}`,
              }}
            >
              <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                {label}-комнатные
              </span>
              <Space size={8}>
                {privatCount > 0 && (
                  <Tag
                    style={{
                      background: COLORS.northernAurora, // Частная = зеленое сияние
                      color: "#fff",
                      border: "none",
                      borderRadius: RADIUS.xs,
                      fontSize: 11,
                    }}
                  >
                    {privatCount} прив.
                  </Tag>
                )}
                {municCount > 0 && (
                  <Tag
                    style={{
                      background: COLORS.northernBlue, // Муниципальная = синее небо
                      color: "#fff",
                      border: "none",
                      borderRadius: RADIUS.xs,
                      fontSize: 11,
                    }}
                  >
                    {municCount} мун.
                  </Tag>
                )}
              </Space>
            </div>
          );
        })}
      </Space>
    </Card>
  );

  return (
    <Drawer
      placement="right"
      width={520}
      open={visible}
      onClose={onClose}
      closeIcon={<CloseOutlined style={{ color: COLORS.textSecondary }} />}
      styles={{ body: { padding: 0, background: COLORS.background } }}
      title={null}
    >
      <Spin spinning={loading} indicator={<GerbSpinner />}>
        {owner && (
          <div style={{ minHeight: "100vh" }}>
            {/* Header с градиентом */}
            <div
              style={{
                background: COLORS.gradientHeader,
                padding: "32px 24px 24px",
                color: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      color: "#fff",
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 600,
                      wordBreak: "break-word",
                      lineHeight: 1.3,
                    }}
                  >
                    {owner["ФИО"] || owner["Наименование"] || "—"}
                  </h2>
                  <Space style={{ marginTop: 12 }} size={8} wrap>
                    <Tag
                      style={{
                        background: getOwnershipColor(ownerType),
                        color: "#fff",
                        border: "none",
                        borderRadius: RADIUS.sm,
                        fontSize: 13,
                        padding: "4px 12px",
                      }}
                    >
                      {getOwnershipLabel(ownerType)}
                    </Tag>
                    {ownerShare && (
                      <Tag
                        style={{
                          background: "rgba(255,255,255,0.15)",
                          color: "#fff",
                          border: "none",
                          borderRadius: RADIUS.sm,
                          fontSize: 13,
                          padding: "4px 12px",
                        }}
                      >
                        Доля{" "}
                        {ownerShare.toString().includes("%")
                          ? ownerShare
                          : `${ownerShare}%`}
                      </Tag>
                    )}
                  </Space>
                </div>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: COLORS.gradientCard,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "3px solid rgba(255,255,255,0.3)",
                    flexShrink: 0,
                  }}
                >
                  <UserOutlined style={{ color: "#fff", fontSize: 28 }} />
                </div>
              </div>
            </div>

            {/* Секции */}
            {renderOwnership()}
            {renderProperty()}
            {renderContacts()}
            {renderDetails()}

            {/* Кнопки действий */}
            <div
              style={{
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <Button
                block
                size="large"
                type="primary"
                icon={<TeamOutlined />}
                onClick={() => {
                  const addr = getAddress(owner);
                  const house =
                    owner.house_number ||
                    (Array.isArray(owner["№ дома"])
                      ? String(owner["№ дома"][0])
                      : String(owner["№ дома"] || ""));
                  onClose();
                  navigate(
                    `/owners?address=${encodeURIComponent(addr)}&house=${encodeURIComponent(house)}`,
                  );
                }}
                style={{
                  height: 48,
                  borderRadius: RADIUS.md,
                  backgroundColor: COLORS.terracotta,
                  borderColor: COLORS.terracotta,
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Все собственники этого дома
                <RightOutlined style={{ marginLeft: 8 }} />
              </Button>

              {housingInfo && (
                <Button
                  block
                  size="large"
                  icon={<HomeOutlined />}
                  onClick={() => {
                    const addr = housingInfo["Почтовый адрес"] || "";
                    const house = housingInfo["Номер дома"] || "0";
                    onClose();
                    navigate(
                      `/residents/house/${encodeURIComponent(addr)}/${encodeURIComponent(house)}`,
                    );
                  }}
                  style={{
                    height: 48,
                    borderRadius: RADIUS.md,
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    fontWeight: 500,
                    fontSize: 15,
                  }}
                >
                  Жители этого дома
                  <RightOutlined style={{ marginLeft: 8 }} />
                </Button>
              )}
            </div>
          </div>
        )}
      </Spin>
    </Drawer>
  );
};
