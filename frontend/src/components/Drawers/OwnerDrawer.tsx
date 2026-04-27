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
  Tabs,
  Empty,
  Table,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  TeamOutlined,
  PhoneOutlined,
  MailOutlined,
  PercentageOutlined,
  BankOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  NumberOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { ownersApi, housingApi } from "../../services/api";
import { GerbSpinner } from "../GerbSpinner";

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
    if (visible && ownerId) {
      loadOwnerDetails(ownerId);
    }
  }, [visible, ownerId]);

  const loadOwnerDetails = async (id: string) => {
    setLoading(true);
    try {
      const details = await ownersApi.getDetails(id);
      console.log("Owner details:", details); // ← ДОБАВИТЬ ЛОГ
      console.log("address_display:", details.address_display);
      console.log("house_number:", details.house_number);
      console.log("Почтовый адрес объекта:", details["Почтовый адрес объекта"]);
      console.log("№ дома:", details["№ дома"]);

      setOwner(details);

      const ownerAddress = details.address_display || getAddress(details);
      const ownerHouse =
        details.house_number ||
        (Array.isArray(details["№ дома"])
          ? String(details["№ дома"][0])
          : String(details["№ дома"] || ""));

      console.log("Final address:", ownerAddress, "Final house:", ownerHouse); // ← ЛОГ

      if (ownerAddress && ownerAddress !== "Без адреса") {
        loadHousingInfo(ownerAddress, ownerHouse);
      }
    } catch (error) {
      console.error("Ошибка загрузки собственника:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHousingInfo = async (address: string, houseNumber: string) => {
    setHousingLoading(true);
    try {
      // Шаг 1: Ищем по адресу
      const response = await housingApi.getList({
        page: 1,
        page_size: 200,
        search: address, // Ищем только по улице
      });

      if (response.data && response.data.length > 0) {
        // Шаг 2: Фильтруем по точному номеру дома
        const exactMatch = response.data.find((item: any) => {
          const itemHouse = item["Номер дома"];
          // Приводим к строке и сравниваем
          return String(itemHouse).trim() === String(houseNumber).trim();
        });

        if (exactMatch) {
          setHousingInfo(exactMatch);
        } else {
          // Если точное совпадение не найдено — показываем предупреждение
          console.warn(`Дом №${houseNumber} не найден на улице ${address}`);
          setHousingInfo(null);
        }
      } else {
        setHousingInfo(null);
      }
    } catch (error) {
      console.error("Ошибка загрузки информации о доме:", error);
    } finally {
      setHousingLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") {
      if (Array.isArray(value))
        return value.map((v) => formatValue(v)).join(", ");
      return value.display_value || JSON.stringify(value);
    }
    return String(value);
  };

  const getStatusColor = (house: any) => {
    if (!house) return "#52c41a";
    if (
      house["Аварийный / не аварийный"] === true ||
      house["Аварийный / не аварийный"] === "Да"
    )
      return "#ff4d4f";
    const year = parseInt(house["Год ввода"] || house["Год постройки"] || "0");
    if (year >= 2010) return "#52c41a";
    if (year >= 1980) return "#1890ff";
    if (year >= 1960) return "#faad14";
    return "#ff7a45";
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

  const tabItems = [
    {
      key: "owner",
      label: (
        <span>
          <UserOutlined /> Собственник
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          {owner && (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* Основная информация */}
              <Card title="📋 Основная информация" size="small">
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="ФИО / Наименование">
                    <strong>
                      {owner["ФИО"] || owner["Наименование"] || "—"}
                    </strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Вид собственности">
                    <Tag color="purple">
                      {owner["Вид собственности"] || "—"}
                    </Tag>
                  </Descriptions.Item>
                  {owner["Тип собственника"] && (
                    <Descriptions.Item label="Тип собственника">
                      {owner["Тип собственника"]}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Доля">
                    <PercentageOutlined style={{ marginRight: 8 }} />
                    {owner["Доля"] || "—"}
                  </Descriptions.Item>
                  {owner["Общая S (м2)"] && (
                    <Descriptions.Item label="Общая площадь">
                      {owner["Общая S (м2)"]} м²
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              {/* Контакты */}
              <Card title="📞 Контакты" size="small">
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Телефон">
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    {owner["Телефон"] || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <MailOutlined style={{ marginRight: 8 }} />
                    {owner["Email"] || "—"}
                  </Descriptions.Item>
                  {owner["ИНН"] && (
                    <Descriptions.Item label="ИНН">
                      <BankOutlined style={{ marginRight: 8 }} />
                      {owner["ИНН"]}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              {/* Адрес объекта */}
              <Card title="🏠 Объект недвижимости" size="small">
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Адрес">
                    <EnvironmentOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    {getAddress(owner)}
                  </Descriptions.Item>
                  {owner["№ дома"] && (
                    <Descriptions.Item label="Дом">
                      {formatValue(owner["№ дома"])}
                    </Descriptions.Item>
                  )}
                  {owner["№ квартиры"] && (
                    <Descriptions.Item label="Квартира">
                      <NumberOutlined style={{ marginRight: 8 }} />
                      {formatValue(owner["№ квартиры"])}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              {/* Кнопка перехода к дому */}
              <Button
                block
                type="primary"
                icon={<HomeOutlined />}
                onClick={() => {
                  const addr = owner.address_display || getAddress(owner);
                  const house = owner.house_number || "";
                  onClose();
                  // Передаем точный адрес и номер дома
                  navigate(
                    `/owners?address=${encodeURIComponent(addr)}&house=${encodeURIComponent(house)}`,
                  );
                }}
              >
                Все собственники этого дома
                <ArrowRightOutlined style={{ marginLeft: 8 }} />
              </Button>
            </Space>
          )}
        </Spin>
      ),
    },
    {
      key: "house",
      label: (
        <span>
          <HomeOutlined /> Дом
        </span>
      ),
      children: (
        <Spin
          indicator={<GerbSpinner size={60} animation="pulse" />}
          spinning={housingLoading}
        >
          {housingInfo ? (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* Статус */}
              <div
                style={{
                  padding: "16px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 12,
                  color: "#fff",
                }}
              >
                <Space direction="vertical" size="small">
                  <Space>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                      {housingInfo["Тип здания"] || "—"},{" "}
                      {housingInfo["Количество этажей"] || "—"} эт.
                    </span>
                    <Tag
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      {housingInfo["Вид жилья"] || "—"}
                    </Tag>
                  </Space>
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
                    <span>{getStatusText(housingInfo)}</span>
                  </Space>
                </Space>
              </div>

              {/* Характеристики */}
              <Card title="🏠 Характеристики дома" size="small">
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Адрес">
                    <EnvironmentOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    {housingInfo["Почтовый адрес"] || "—"}, д.{" "}
                    {housingInfo["Номер дома"] || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Тип дома">
                    {housingInfo["Тип здания"] || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Год постройки">
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {housingInfo["Год ввода"] ||
                      housingInfo["Год постройки"] ||
                      "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Этажность">
                    {housingInfo["Количество этажей"]
                      ? `${housingInfo["Количество этажей"]} эт.`
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Квартир">
                    {housingInfo["квартир всего"] || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Общая площадь">
                    {housingInfo["Площадь общая"]
                      ? `${Number(housingInfo["Площадь общая"]).toLocaleString()} м²`
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Тех. состояние">
                    <Space>
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: getStatusColor(housingInfo),
                        }}
                      />
                      {getStatusText(housingInfo)}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Кнопка перехода к жителям */}
              <Button
                block
                icon={<TeamOutlined />}
                onClick={() => {
                  const addr = housingInfo["Почтовый адрес"] || "";
                  const house = housingInfo["Номер дома"] || "0";
                  onClose();
                  navigate(
                    `/residents/house/${encodeURIComponent(addr)}/${encodeURIComponent(house)}`,
                  );
                }}
              >
                Жители этого дома
                <ArrowRightOutlined style={{ marginLeft: 8 }} />
              </Button>
            </Space>
          ) : (
            <Empty description="Информация о доме не найдена" />
          )}
        </Spin>
      ),
    },
    // В массив tabItems добавить новую вкладку:
    {
      key: "details",
      label: (
        <span>
          <InfoCircleOutlined /> Дополнительно
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          {owner && (
            <Card title="📊 Детальные сведения" size="small">
              <Descriptions column={1} size="small" bordered>
                {/* Площади */}
                {owner["Общая S (м2)"] ? (
                  <Descriptions.Item label="Общая площадь">
                    {owner["Общая S (м2)"]} м²
                  </Descriptions.Item>
                ) : null}
                {owner["Общая S по ЕРИЦ (м2)"] ? (
                  <Descriptions.Item label="Площадь по ЕРИЦ">
                    {owner["Общая S по ЕРИЦ (м2)"]} м²
                  </Descriptions.Item>
                ) : null}

                {/* Доли */}
                {owner["Доля в праве общей Д=Sпом/Sобщ"] ? (
                  <Descriptions.Item label="Доля в праве общей">
                    {typeof owner["Доля в праве общей Д=Sпом/Sобщ"] === "number"
                      ? (owner["Доля в праве общей Д=Sпом/Sобщ"] * 100).toFixed(
                          1,
                        ) + "%"
                      : owner["Доля в праве общей Д=Sпом/Sобщ"]}
                  </Descriptions.Item>
                ) : null}
                {owner["Кол-во голосов Кгол= Д х Кобщ"] ? (
                  <Descriptions.Item label="Количество голосов">
                    {owner["Кол-во голосов Кгол= Д х Кобщ"]}
                  </Descriptions.Item>
                ) : null}

                {/* Муниципальный фонд */}
                {owner["Муниципальный ж/ф, кол-во квартир"] ? (
                  <Descriptions.Item label="Муниципальных квартир">
                    {owner["Муниципальный ж/ф, кол-во квартир"] === 1 ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}></Tag>
                    ) : (
                      owner["Муниципальный ж/ф, кол-во квартир"]
                    )}
                  </Descriptions.Item>
                ) : null}
                {owner["Муниципальный ж/ф, S квартир(м2)"] ? (
                  <Descriptions.Item label="Муниципальная площадь">
                    {owner["Муниципальный ж/ф, S квартир(м2)"]} м²
                  </Descriptions.Item>
                ) : null}
                {owner["Муниц ж/ф, доля"] ? (
                  <Descriptions.Item label="Муниципальная доля">
                    {owner["Муниц ж/ф, доля"]}
                  </Descriptions.Item>
                ) : null}

                {/* Приватный фонд */}
                {owner["ж/ф в собственности, кол-во квартир"] ? (
                  <Descriptions.Item label="В собственности квартир">
                    {owner["ж/ф в собственности, кол-во квартир"]}
                  </Descriptions.Item>
                ) : null}
                {owner["ж/ф в собственности, S квартир (м2)"] ? (
                  <Descriptions.Item label="В собственности площадь">
                    {owner["ж/ф в собственности, S квартир (м2)"]} м²
                  </Descriptions.Item>
                ) : null}
                {owner["Приват ж/ф, доля"] ? (
                  <Descriptions.Item label="Приват доля">
                    {owner["Приват ж/ф, доля"]}
                  </Descriptions.Item>
                ) : null}

                {/* Количество комнат - только заполненные */}
                {[1, 2, 3, 4].map((roomNum) => {
                  const roomLabel =
                    roomNum === 4 ? "4-х и более" : `${roomNum}-х`;
                  const privatCount = owner[`${roomNum}-но комн кол-во приват`];
                  const privatArea = owner[`${roomNum}-но комн площадь приват`];
                  const municCount = owner[`${roomNum}-но комн кол-во муниц`];
                  const municArea = owner[`${roomNum}-но комн площадь муниц`];

                  if (!privatCount && !municCount && !privatArea && !municArea)
                    return null;

                  return (
                    <Descriptions.Item
                      label={`${roomLabel} комнатные`}
                      key={roomNum}
                    >
                      {privatCount ? (
                        <Tag color="blue">
                          Приват: {privatCount} шт, {privatArea} м²
                        </Tag>
                      ) : null}
                      {municCount ? (
                        <Tag color="orange">
                          Муниц: {municCount} шт, {municArea} м²
                        </Tag>
                      ) : null}
                    </Descriptions.Item>
                  );
                })}

                {/* Численность */}
                {owner["Числ по Прив"] ? (
                  <Descriptions.Item label="Численность (приват)">
                    {owner["Числ по Прив"]}
                  </Descriptions.Item>
                ) : null}
                {owner["Числ по Муниц"] ? (
                  <Descriptions.Item label="Численность (муниц)">
                    {owner["Числ по Муниц"]}
                  </Descriptions.Item>
                ) : null}
              </Descriptions>
            </Card>
          )}
        </Spin>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <Space>
          <UserOutlined style={{ color: "#1890ff" }} />
          <span style={{ fontWeight: 600 }}>
            {owner
              ? owner["ФИО"] || owner["Наименование"] || "Собственник"
              : "Загрузка..."}
          </span>
        </Space>
      }
      placement="right"
      width={500}
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      <Tabs items={tabItems} />
    </Drawer>
  );
};
