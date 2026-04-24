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
  Modal,
  Descriptions,
} from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
  BankOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { ResidentModal } from "../Modals/ResidentModal";
import { residentsApi, ResidentItem } from "../../services/api";

const { Panel } = Collapse;

export const HouseResidents: React.FC = () => {
  const { address, houseNumber } = useParams<{
    address: string;
    houseNumber: string;
  }>();
  const navigate = useNavigate();

  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Декодируем параметры
  const decodedAddress = address ? decodeURIComponent(address) : "";
  const decodedHouseNumber = houseNumber ? decodeURIComponent(houseNumber) : "";

  const [selectedResident, setSelectedResident] = useState<ResidentItem | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Форматирование даты
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateStr;
    }
  };

  // Получение ФИО
  const getFullName = (record: any): string => {
    return (
      record["ФИО"] ||
      record["ФИО жителя"] ||
      record["Фамилия Имя Отчество"] ||
      "Не указано"
    );
  };

  // Получение адреса
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

  // Определение пола
  const getGender = (record: any): string | null => {
    if (record["Пол"]) return record["Пол"];
    const name = getFullName(record).toLowerCase();
    if (name.includes("кызы") || name.includes("вна") || name.includes("чна"))
      return "Женский";
    if (name.includes("оглы") || name.includes("вич")) return "Мужской";
    return null;
  };

  // Проверка аварийности
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

  // Загрузка жителей дома
  useEffect(() => {
    const loadHouseResidents = async () => {
      if (!decodedAddress) return;

      setLoading(true);

      try {
        const allItems: ResidentItem[] = [];
        let page = 1;
        const limit = 100; // ← уменьшаем до 100 (или 200, 300, но не больше 500)
        let hasMore = true;

        // Нормализуем адрес для сравнения
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

          // Фильтруем
          const filtered = rows.filter((item) => {
            const itemAddress = getAddress(item);
            const itemHouse = String(item["№ дома"] || "");

            // Если адрес "Без адреса", но номер дома совпадает — считаем, что подходит
            const isNoAddress = itemAddress === "Без адреса" || !itemAddress;

            const normalizedItemAddress = normalizeAddress(itemAddress);
            const normalizedItemHouse = itemHouse.trim();

            let addressMatch = false;

            if (isNoAddress) {
              // Если адреса нет, но номер дома совпадает — ПРИНИМАЕМ
              addressMatch = true;
            } else {
              // Нормальное сравнение адресов
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

  // Если нет адреса - показываем сообщение
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
    setModalVisible(true);
  };

  return (
    <div style={{ padding: "0 0 24px 0" }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a onClick={() => navigate("/residents?group=house")}>
            <HomeOutlined /> Жители
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          {decodedAddress}, дом №{decodedHouseNumber}
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/residents?group=house")}
            >
              Назад к списку домов
            </Button>
          </Space>

          <Space size="large">
            <HomeOutlined style={{ fontSize: 24, color: "#1890ff" }} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              {decodedAddress}, дом №{decodedHouseNumber}
            </span>
          </Space>

          <Row gutter={16}>
            <Col>
              <Tag color="blue" style={{ fontSize: 14, padding: "4px 16px" }}>
                👥 Всего жителей: {totalResidents}
              </Tag>
            </Col>
            <Col>
              <Tag color="green" style={{ fontSize: 14, padding: "4px 16px" }}>
                👤 Взрослых: {adultsCount}
              </Tag>
            </Col>
            <Col>
              <Tag color="orange" style={{ fontSize: 14, padding: "4px 16px" }}>
                🧒 Детей: {childrenCount}
              </Tag>
            </Col>
            <Col>
              <Tag color="purple" style={{ fontSize: 14, padding: "4px 16px" }}>
                🚪 Квартир: {sortedKeys.length}
              </Tag>
            </Col>
            {emergencyStatus && (
              <Col>
                <Tag
                  color={emergencyStatus === "Аварийный" ? "red" : "green"}
                  style={{ fontSize: 14, padding: "4px 16px" }}
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
            style={{ backgroundColor: "#fff", width: "100%" }}
          >
            {sortedKeys.map((apartmentKey) => {
              const apartmentItems = groups[apartmentKey];
              const apartmentChildren = apartmentItems.filter(
                (r) => r["Ребенок"] === "Да" || r["Ребенок"] === true,
              ).length;
              const apartmentAdults = apartmentItems.length - apartmentChildren;

              return (
                <Panel
                  key={apartmentKey}
                  header={
                    <Space size="large">
                      <span style={{ fontWeight: 600, fontSize: 16 }}>
                        🚪{" "}
                        {apartmentKey === "Без квартиры"
                          ? "Без квартиры"
                          : `Квартира ${apartmentKey}`}
                      </span>
                      <Space size="small">
                        <Tag color="blue">{apartmentItems.length} чел.</Tag>
                        <Tag color="green">{apartmentAdults} взр.</Tag>
                        <Tag color="orange">{apartmentChildren} дет.</Tag>
                      </Space>
                    </Space>
                  }
                >
                  <List
                    dataSource={apartmentItems}
                    grid={{
                      gutter: 16,
                      xs: 1,
                      sm: 2,
                      md: 3,
                      lg: 3,
                      xl: 4,
                      xxl: 4,
                    }}
                    renderItem={(item) => {
                      const fullName = getFullName(item);
                      const age = item["Возраст"] || item["Возраст (числом)"];
                      const genderValue = getGender(item);
                      const phone = item["Телефон"];
                      const birthDate = item["Дата рождения"];
                      const isChildValue =
                        item["Ребенок"] === "Да" || item["Ребенок"] === true;
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
                              display: "flex",
                              flexDirection: "column",
                            }}
                            bodyStyle={{
                              padding: "16px",
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                marginBottom: 12,

                                flexDirection: "column",
                                height: "100%",
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
                                      ? "#eb2f96"
                                      : genderValue === "Мужской"
                                        ? "#1890ff"
                                        : "#8c8c8c",
                                  marginRight: 12,
                                  flexShrink: 0,
                                  display: "flex",

                                  marginBottom: 12,
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 15,
                                    marginBottom: 4,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {fullName}
                                </div>
                                <Space size={4} wrap>
                                  {/* {age && <Tag color="blue">{age} лет</Tag>} */}
                                  {genderValue && (
                                    <Tag
                                      color={
                                        genderValue === "Женский"
                                          ? "pink"
                                          : "blue"
                                      }
                                    >
                                      {genderValue}
                                    </Tag>
                                  )}
                                  {isChildValue && (
                                    <Tag color="orange">Ребенок</Tag>
                                  )}
                                  {categoryValue && (
                                    <Tag color="cyan">{categoryValue}</Tag>
                                  )}
                                  {relation && (
                                    <Tag color="purple">{relation}</Tag>
                                  )}
                                </Space>
                              </div>
                            </div>

                            <Space
                              direction="vertical"
                              size={4}
                              style={{ width: "100%" }}
                            >
                              {/* {birthDate && (
                                <div style={{ fontSize: 13, color: "#595959" }}>
                                  <CalendarOutlined
                                    style={{ marginRight: 8 }}
                                  />
                                  {formatDate(birthDate)}
                                </div>
                              )} */}
                              {phone && (
                                <div style={{ fontSize: 13, color: "#595959" }}>
                                  <PhoneOutlined style={{ marginRight: 8 }} />
                                  {phone}
                                </div>
                              )}
                            </Space>
                          </Card>
                        </List.Item>
                      );
                    }}
                  />
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

      {/* Модальное окно с детальной информацией о жителе */}
      <ResidentModal
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        resident={selectedResident}
        getFullName={getFullName}
        getAddress={getAddress}
        getGender={getGender}
        formatDate={formatDate}
        isEmergency={isEmergency}
        isNotEmergency={isNotEmergency}
      />
    </div>
  );
};
