import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Avatar,
  Spin,
  Empty,
  Collapse,
  Breadcrumb,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  UserOutlined,
  ManOutlined,
  WomanOutlined,
  TeamOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { ResidentDrawer } from "../Drawers/ResidentDrawer";
import { residentsApi, ResidentItem } from "../../services/api";
import { THEME } from "../../styles/theme";

// Константы темы для удобства
const COLORS = THEME.colors;
const RADIUS = THEME.radius;

const { Panel } = Collapse;

export const HouseResidents: React.FC = () => {
  const { address, houseNumber } = useParams<{
    address: string;
    houseNumber: string;
  }>();
  const navigate = useNavigate();

  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [ownersLoaded, setOwnersLoaded] = useState(false);

  const decodedAddress = address ? decodeURIComponent(address) : "";
  const decodedHouseNumber = houseNumber ? decodeURIComponent(houseNumber) : "";

  const [selectedResident, setSelectedResident] = useState<ResidentItem | null>(
    null,
  );
  const [drawerVisible, setDrawerVisible] = useState(false);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const getFullName = (record: any): string => {
    return (
      record["ФИО"] ||
      record["ФИО жителя"] ||
      record["Фамилия Имя Отчество"] ||
      "Не указано"
    );
  };

  const getAddress = (record: any): string => {
    if (!record) return "Без адреса";
    let addr =
      record["Почтовый адрес"] ||
      record["Адрес"] ||
      record["Адрес регистрации"];
    if (addr && typeof addr === "object") {
      addr = addr.display_value || addr["Почтовый адрес"] || addr["Адрес"];
    }
    return addr ? String(addr) : "Без адреса";
  };

  const getGender = (record: any): string | null => {
    if (record["Пол"]) return record["Пол"];
    const name = getFullName(record).toLowerCase();
    if (name.includes("кызы") || name.includes("вна") || name.includes("чна"))
      return "Женский";
    if (name.includes("оглы") || name.includes("вич")) return "Мужской";
    return null;
  };

  const isEmergency = (record: any): boolean => {
    let value = record["Аварийный дом"];
    if (Array.isArray(value)) value = value[0];
    return value === true || value === "Да" || value === "да";
  };

  const isNotEmergency = (record: any): boolean => {
    let value = record["Аварийный дом"];
    if (Array.isArray(value)) value = value[0];
    return value === false || value === "Нет" || value === "нет";
  };

  // Получение информации о муниципальном жилье для квартиры
  const getMunicipalInfo = (apartment: string): any => {
    const owner = findOwner(apartment);
    if (!owner) return null;

    const hasMunicipal =
      owner["Муниципальный ж/ф, кол-во квартир"] > 0 ||
      owner["Муниципальный ж/ф, S квартир(м2)"] > 0;

    if (!hasMunicipal) return null;

    return {
      municipalCount: owner["Муниципальный ж/ф, кол-во квартир"] || 0,
      municipalArea: owner["Муниципальный ж/ф, S квартир(м2)"] || 0,
      isMunicipal: owner["Муниципальный ж/ф, кол-во квартир"] === 1,
    };
  };

  // Поиск собственника по адресу и квартире
  const findOwner = (apartment: string): any => {
    const result = owners.find((owner: any) => {
      const ownerApt = String(owner["№ квартиры"] || "");

      return ownerApt === apartment;
    });

    return result || null;
  };

  // Загрузка жителей
  useEffect(() => {
    const loadHouseResidents = async () => {
      if (!decodedAddress) return;
      setLoading(true);

      try {
        const allItems: ResidentItem[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;

        const normalizeAddress = (addr: string): string => {
          return addr
            .toLowerCase()
            .replace(/\s+/g, " ")
            .replace(/\./g, "")
            .replace(/^ул\s*/, "улица ")
            .replace(/^ул\.\s*/, "улица ")
            .trim();
        };

        const normalizedTargetAddress = normalizeAddress(decodedAddress);
        const normalizedTargetHouse = String(decodedHouseNumber).trim();

        while (hasMore) {
          const response = await residentsApi.getList({
            page,
            page_size: limit,
            search: decodedAddress,
          });
          const rows = response.data;

          if (rows.length === 0) {
            hasMore = false;
            break;
          }

          const filtered = rows.filter((item: any) => {
            const itemAddress = getAddress(item);
            const itemHouse = String(item["№ дома"] || "");
            const isNoAddress = itemAddress === "Без адреса" || !itemAddress;
            const normalizedItemAddress = normalizeAddress(itemAddress);
            const normalizedItemHouse = itemHouse.trim();

            let addressMatch = false;
            if (isNoAddress) {
              addressMatch = true;
            } else {
              addressMatch =
                normalizedItemAddress === normalizedTargetAddress ||
                normalizedItemAddress.includes(normalizedTargetAddress) ||
                normalizedTargetAddress.includes(normalizedItemAddress);
            }
            const houseMatch = normalizedItemHouse === normalizedTargetHouse;
            return addressMatch && houseMatch;
          });

          allItems.push(...filtered);
          if (rows.length < limit) {
            hasMore = false;
          } else {
            page++;
          }
        }

        setResidents(allItems);
      } catch (error) {
        console.error("❌ Ошибка загрузки жителей:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHouseResidents();
  }, [decodedAddress, decodedHouseNumber]);

  // Загрузка собственников этого дома
  useEffect(() => {
    const loadOwners = async () => {
      if (!decodedAddress || ownersLoaded) return;
      try {
        const response = await fetch(
          `/api/owners/list?page=1&page_size=1000&search=${encodeURIComponent(decodedAddress)}`,
        );

        const data = await response.json();

        const filtered = (data.data || []).filter((owner: any) => {
          const ownerHouse = owner.house_number || "";

          return ownerHouse === decodedHouseNumber;
        });

        setOwners(filtered);
        setOwnersLoaded(true);
      } catch (error) {
        console.error("Ошибка загрузки собственников:", error);
      }
    };

    loadOwners();
  }, [decodedAddress, decodedHouseNumber, ownersLoaded]);

  // Группировка по квартирам
  const groupedByApartment = () => {
    const groups: Record<string, ResidentItem[]> = {};
    residents.forEach((item) => {
      const apartment =
        item["№ квартиры"] || item["Квартира"] || "Без квартиры";
      if (!groups[apartment]) groups[apartment] = [];
      groups[apartment].push(item);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, "ru");
    });
    return { groups, sortedKeys };
  };

  const { groups, sortedKeys } = groupedByApartment();
  const totalResidents = residents.length;
  const childrenCount = residents.filter(
    (r) => r["Ребенок"] === "Да" || r["Ребенок"] === true,
  ).length;
  const adultsCount = totalResidents - childrenCount;
  const emergencyStatus = residents[0]
    ? isEmergency(residents[0])
      ? "Аварийный"
      : isNotEmergency(residents[0])
        ? "Не аварийный"
        : null
    : null;

  if (!decodedAddress) {
    return (
      <div style={{ padding: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/residents")}
        >
          Назад
        </Button>
        <Empty description="Не указан адрес дома" style={{ marginTop: 48 }} />
      </div>
    );
  }

  const showDetails = (resident: ResidentItem) => {
    setSelectedResident(resident);
    setDrawerVisible(true);
  };

  return (
    <div style={{ padding: "0 0 24px 0" }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a
            onClick={() => navigate("/residents?group=house")}
            style={{ color: COLORS.textSecondary }}
          >
            <HomeOutlined /> Жители
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item style={{ color: COLORS.textPrimary }}>
          {decodedAddress}, дом №{decodedHouseNumber}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card
        style={{
          marginBottom: 24,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: COLORS.surface,
          boxShadow: COLORS.shadowSmall,
          borderRadius: RADIUS.sm,
          border: `1px solid ${COLORS.borderLight}`,
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/residents?group=house")}
              style={{ borderRadius: RADIUS.sm }}
            >
              Назад к списку домов
            </Button>
          </Space>
          <Space size="large">
            <HomeOutlined style={{ fontSize: 24, color: COLORS.terracotta }} />
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: COLORS.textPrimary,
              }}
            >
              {decodedAddress}, дом №{decodedHouseNumber}
            </span>
          </Space>
          <Row gutter={16}>
            <Col>
              <Tag
                style={{
                  fontSize: 14,
                  padding: "4px 16px",
                  borderRadius: RADIUS.full,
                  background: COLORS.northernBlue,
                  color: "#fff",
                  border: "none",
                }}
              >
                👥 Всего жителей: {totalResidents}
              </Tag>
            </Col>
            <Col>
              <Tag
                style={{
                  fontSize: 14,
                  padding: "4px 16px",
                  borderRadius: RADIUS.full,
                  background: COLORS.success,
                  color: "#fff",
                  border: "none",
                }}
              >
                👤 Взрослых: {adultsCount}
              </Tag>
            </Col>
            <Col>
              <Tag
                style={{
                  fontSize: 14,
                  padding: "4px 16px",
                  borderRadius: RADIUS.full,
                  background: COLORS.warning,
                  color: "#fff",
                  border: "none",
                }}
              >
                🧒 Детей: {childrenCount}
              </Tag>
            </Col>
            <Col>
              <Tag
                style={{
                  fontSize: 14,
                  padding: "4px 16px",
                  borderRadius: RADIUS.full,
                  background: COLORS.primaryLight,
                  color: "#fff",
                  border: "none",
                }}
              >
                🚪 Квартир: {sortedKeys.length}
              </Tag>
            </Col>
            {emergencyStatus && (
              <Col>
                <Tag
                  style={{
                    fontSize: 14,
                    padding: "4px 16px",
                    borderRadius: RADIUS.full,
                    background:
                      emergencyStatus === "Аварийный"
                        ? COLORS.danger
                        : COLORS.success,
                    color: "#fff",
                    border: "none",
                  }}
                >
                  {emergencyStatus === "Аварийный" ? "⚠️" : "✅"}{" "}
                  {emergencyStatus}
                </Tag>
              </Col>
            )}
          </Row>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {residents.length > 0 ? (
          <Collapse
            defaultActiveKey={sortedKeys}
            style={{ backgroundColor: "transparent", width: "100%" }}
            bordered={false}
          >
            {sortedKeys.map((apartmentKey) => {
              const apartmentItems = groups[apartmentKey];
              const apartmentChildren = apartmentItems.filter(
                (r) => r["Ребенок"] === "Да" || r["Ребенок"] === true,
              ).length;
              const apartmentAdults = apartmentItems.length - apartmentChildren;
              const owner = findOwner(apartmentKey);

              return (
                <Panel
                  key={apartmentKey}
                  header={
                    <Space size="large">
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 16,
                          color: COLORS.textPrimary,
                        }}
                      >
                        🚪{" "}
                        {apartmentKey === "Без квартиры"
                          ? "Без квартиры"
                          : `Квартира ${apartmentKey}`}
                      </span>
                      <Space size="small">
                        <Tag
                          style={{
                            background: COLORS.northernIce,
                            color: COLORS.primaryDark,
                            border: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {apartmentItems.length} чел.
                        </Tag>
                        <Tag
                          style={{
                            background: COLORS.northernIce,
                            color: COLORS.primaryDark,
                            border: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {apartmentAdults} взр.
                        </Tag>
                        <Tag
                          style={{
                            background: COLORS.northernIce,
                            color: COLORS.primaryDark,
                            border: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {apartmentChildren} дет.
                        </Tag>
                      </Space>
                      {(() => {
                        const municipalInfo = getMunicipalInfo(apartmentKey);
                        return municipalInfo?.isMunicipal ? (
                          <Tag
                            style={{
                              background: COLORS.municipal,
                              color: "#000",
                              border: "none",
                              borderRadius: RADIUS.xs,
                            }}
                          >
                            🏛️ Муниципальное
                          </Tag>
                        ) : null;
                      })()}
                    </Space>
                  }
                  style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: RADIUS.md,
                    marginBottom: 12,
                    border: `1px solid ${COLORS.borderLight}`,
                  }}
                >
                  <Row gutter={16}>
                    <Col
                      flex="1"
                      style={{
                        borderRight: `1px solid ${COLORS.borderLight}`,
                        paddingRight: 16,
                      }}
                    >
                      {/* Список жителей */}
                      <List
                        dataSource={apartmentItems}
                        grid={{
                          gutter: 16,
                          xs: 1,
                          sm: 2,
                          md: 2,
                          lg: 2,
                          xl: 3,
                          xxl: 3,
                        }}
                        renderItem={(item: any) => {
                          const fullName = getFullName(item);
                          const genderValue = getGender(item);
                          const phone = item["Телефон"];
                          const isChildValue =
                            item["Ребенок"] === "Да" ||
                            item["Ребенок"] === true;
                          const categoryValue = item["Категория"];
                          const relation = item["Родство"];

                          return (
                            <List.Item key={item._id}>
                              <Card
                                hoverable
                                onClick={() => showDetails(item)}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  cursor: "pointer",
                                  borderRadius: RADIUS.md,
                                  border: `1px solid ${COLORS.borderLight}`,
                                  boxShadow: COLORS.shadowSmall,
                                  transition: `all ${THEME.animation.fast}`,
                                }}
                                bodyStyle={{ padding: "16px" }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor =
                                    COLORS.terracotta;
                                  e.currentTarget.style.transform =
                                    "translateY(-2px)";
                                  e.currentTarget.style.boxShadow =
                                    COLORS.shadowMedium;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor =
                                    COLORS.borderLight;
                                  e.currentTarget.style.transform =
                                    "translateY(0)";
                                  e.currentTarget.style.boxShadow =
                                    COLORS.shadowSmall;
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    marginBottom: 12,
                                  }}
                                >
                                  <Avatar
                                    size={48}
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
                                          ? COLORS.terracotta // Терракота для женщин
                                          : genderValue === "Мужской"
                                            ? COLORS.northernBlue // Северное небо для мужчин
                                            : COLORS.textMuted,
                                      marginRight: 12,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontWeight: 600,
                                        fontSize: 15,
                                        marginBottom: 4,
                                        wordBreak: "break-word",
                                        color: COLORS.textPrimary,
                                      }}
                                    >
                                      {fullName}
                                    </div>
                                    <Space size={4} wrap>
                                      {genderValue && (
                                        <Tag
                                          style={{
                                            margin: 0,
                                            background:
                                              genderValue === "Женский"
                                                ? "rgba(198, 123, 92, 0.1)"
                                                : "rgba(123, 158, 175, 0.1)",
                                            color:
                                              genderValue === "Женский"
                                                ? COLORS.terracotta
                                                : COLORS.northernBlue,
                                            border: "none",
                                            borderRadius: RADIUS.xs,
                                            fontSize: 11,
                                          }}
                                        >
                                          {genderValue}
                                        </Tag>
                                      )}
                                      {isChildValue && (
                                        <Tag
                                          style={{
                                            margin: 0,
                                            background:
                                              "rgba(212, 149, 106, 0.1)",
                                            color: COLORS.warning,
                                            border: "none",
                                            borderRadius: RADIUS.xs,
                                            fontSize: 11,
                                          }}
                                        >
                                          Ребенок
                                        </Tag>
                                      )}
                                      {categoryValue && (
                                        <Tag
                                          style={{
                                            margin: 0,
                                            background:
                                              "rgba(91, 140, 90, 0.1)",
                                            color: COLORS.northernAurora,
                                            border: "none",
                                            borderRadius: RADIUS.xs,
                                            fontSize: 11,
                                          }}
                                        >
                                          {categoryValue}
                                        </Tag>
                                      )}
                                      {relation && (
                                        <Tag
                                          style={{
                                            margin: 0,
                                            background: "rgba(92, 61, 46, 0.1)",
                                            color: COLORS.primary,
                                            border: "none",
                                            borderRadius: RADIUS.xs,
                                            fontSize: 11,
                                          }}
                                        >
                                          {relation}
                                        </Tag>
                                      )}

                                      {/* ✅ Бейдж собственника */}
                                    </Space>
                                  </div>
                                </div>
                              </Card>
                            </List.Item>
                          );
                        }}
                      />
                    </Col>
                    <Col
                      style={{
                        width: 240,
                        flexShrink: 0,
                        paddingLeft: 16,
                        alignSelf: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: COLORS.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 10,
                          fontWeight: 600,
                        }}
                      >
                        Собственник
                      </div>
                      {owner ? (
                        <div
                          style={{
                            padding: "16px",
                            background: COLORS.background,
                            borderRadius: RADIUS.sm,
                            border: `1px solid ${COLORS.borderLight}`,
                            borderTop: `3px solid ${
                              String(owner["Вид собственности"] || "")
                                .toLowerCase()
                                .includes("муниц")
                                ? COLORS.northernBlue
                                : COLORS.warning
                            }`,
                            position: "sticky",
                            top: 80,
                          }}
                        >
                          <div
                            style={{ textAlign: "center", marginBottom: 10 }}
                          ></div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              textAlign: "center",
                              marginBottom: 6,
                              wordBreak: "break-word",
                            }}
                          >
                            {owner["ФИО"] ||
                              owner["Наименование"] ||
                              "Собственник"}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: COLORS.textSecondary,
                              textAlign: "center",
                              marginBottom: 8,
                            }}
                          >
                            {owner["Телефон"] && (
                              <div>📞 {owner["Телефон"]}</div>
                            )}
                            {owner["Доля"] && <div>Доля: {owner["Доля"]}</div>}
                          </div>
                          <Tag
                            style={{
                              display: "block",
                              textAlign: "center",
                              background: String(
                                owner["Вид собственности"] || "",
                              )
                                .toLowerCase()
                                .includes("муниц")
                                ? "rgba(123, 158, 175, 0.12)"
                                : "rgba(91, 140, 90, 0.12)",
                              color: String(owner["Вид собственности"] || "")
                                .toLowerCase()
                                .includes("муниц")
                                ? COLORS.northernBlue
                                : COLORS.warning,
                              border: "none",
                              borderRadius: RADIUS.xs,
                              fontSize: 11,
                              whiteSpace: "normal",
                              padding: "4px 8px",
                            }}
                          >
                            {owner["Вид собственности"] || "—"}
                          </Tag>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "16px",
                            background: COLORS.background,
                            borderRadius: RADIUS.sm,
                            textAlign: "center",
                            fontSize: 12,
                            color: COLORS.textMuted,
                          }}
                        >
                          Собственник не указан
                        </div>
                      )}
                    </Col>
                  </Row>
                </Panel>
              );
            })}
          </Collapse>
        ) : (
          !loading && (
            <Empty
              description={`Нет жителей в доме ${decodedAddress}, ${decodedHouseNumber}`}
              style={{ marginTop: 48 }}
            />
          )
        )}
      </Spin>

      <ResidentDrawer
        visible={drawerVisible}
        resident={selectedResident}
        onClose={() => setDrawerVisible(false)}
        getFullName={getFullName}
        getAddress={getAddress}
        getGender={getGender}
        formatDate={formatDate}
      />
    </div>
  );
};
