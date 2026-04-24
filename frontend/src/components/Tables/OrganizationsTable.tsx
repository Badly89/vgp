import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Row,
  Col,
  Avatar,
  Pagination,
  Spin,
  Empty,
  Tooltip,
  Collapse,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  BankOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  MailOutlined,
  GlobalOutlined,
  IdcardOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { OrganizationModal } from "../Modals/OrganizationModal";
import { organizationsApi, OrganizationItem } from "../../services/api";
import { GerbSpinner } from "../GerbSpinner";

export const OrganizationsTable: React.FC = () => {
  const [allData, setAllData] = useState<OrganizationItem[]>([]);
  const [data, setData] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Фильтры
  const [searchText, setSearchText] = useState("");
  const [orgType, setOrgType] = useState<string>();

  // Списки для фильтров
  const [orgTypes, setOrgTypes] = useState<string[]>([]);
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Модальное окно
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Форматирование значения
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

  // Получение наименования
  const getName = (record: any): string => {
    return (
      record["Наименование учреждения"] ||
      record["Наименование"] ||
      record["Название"] ||
      record["Организация"] ||
      "Не указано"
    );
  };

  const getEmployeesCount = (record: any): string => {
    const count = record["Количество работников"];
    if (count === null || count === undefined) return null;
    return String(count);
  };

  // Получение адреса
  const getAddress = (record: any): string => {
    let addr =
      record["Адрес"] ||
      record["Юридический адрес"] ||
      record["Фактический адрес"] ||
      record["Адрес организации"] ||
      record["address"];

    if (addr && typeof addr === "object") {
      if (Array.isArray(addr) && addr.length > 0) {
        const first = addr[0];
        addr =
          first?.display_value ||
          first?.row_id ||
          first?.["Адрес"] ||
          JSON.stringify(first);
      } else {
        addr =
          addr.display_value ||
          addr.row_id ||
          addr["Адрес"] ||
          JSON.stringify(addr);
      }
    }

    // Если адрес всё ещё не найден, ищем любое поле с "адрес"
    if (!addr || addr === "Без адреса") {
      for (const key in record) {
        if (key.toLowerCase().includes("адрес") && record[key]) {
          let value = record[key];
          if (typeof value === "object") {
            value =
              value.display_value || value.row_id || JSON.stringify(value);
          }
          if (value) {
            addr = String(value);
            break;
          }
        }
      }
    }

    return addr ? String(addr) : "Без адреса";
  };

  // Загрузка данных для фильтров
  const loadFilterOptions = async () => {
    try {
      const typeSet = new Set<string>();
      let pageNum = 1;
      const limit = 500;
      let hasMore = true;

      while (hasMore) {
        const response = await organizationsApi.getList({
          page: pageNum,
          page_size: limit,
        });
        const rows = response.data;
        if (rows.length === 0) {
          hasMore = false;
          break;
        }

        rows.forEach((item: any) => {
          const t = item["Вид организации"] || item["Тип организации"];
          if (t) typeSet.add(String(t));
        });

        if (rows.length < limit) hasMore = false;
        else pageNum++;
      }

      setOrgTypes(Array.from(typeSet).sort());
    } catch (error) {
      console.error("❌ Ошибка загрузки фильтров:", error);
    }
  };

  // Загрузка данных
  // Загрузка данных
  const loadData = async () => {
    setLoading(true);
    try {
      if (orgType) {
        // При фильтрации загружаем все данные
        let allFiltered: OrganizationItem[] = [];
        let pageNum = 1;
        const limit = 500;
        let hasMore = true;

        while (hasMore) {
          const response = await organizationsApi.getList({
            page: pageNum,
            page_size: limit,
            search: searchText || undefined,
          });

          const rows = response.data;
          if (rows.length === 0) {
            hasMore = false;
            break;
          }

          const filtered = rows.filter(
            (item) =>
              String(item["Вид организации"] || item["Тип организации"]) ===
              orgType,
          );
          allFiltered.push(...filtered);

          if (rows.length < limit) {
            hasMore = false;
          } else {
            pageNum++;
          }
        }

        setAllData(allFiltered);
        setTotal(allFiltered.length);

        // Пагинация на клиенте
        const start = (page - 1) * pageSize;
        setData(allFiltered.slice(start, start + pageSize));
      } else {
        // Без фильтра - обычная пагинация
        const response = await organizationsApi.getList({
          page,
          page_size: pageSize,
          search: searchText || undefined,
        });

        setData(response.data);
        setTotal(response.total || response.data.length);
      }

      if (!filtersLoaded) {
        await loadFilterOptions();
        setFiltersLoaded(true);
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  useEffect(() => {
    setPage(1);
    loadData();
  }, [orgType, searchText]);

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setSearchText("");
    setOrgType(undefined);
    setPage(1);
    setAllData([]); // очищаем кэш
  };

  const showDetails = (org: OrganizationItem) => {
    setSelectedOrg(org);
    setModalVisible(true);
  };

  return (
    <>
      {/* Панель поиска и фильтров */}
      <Card
        style={{
          marginBottom: 24,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Space
            wrap
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space wrap>
              <Input
                placeholder="Поиск по названию, ИНН, адресу..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                style={{ width: 320 }}
                allowClear
              />
              <Button
                type="primary"
                onClick={handleSearch}
                icon={<SearchOutlined />}
              >
                Поиск
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                Сбросить
              </Button>
            </Space>

            <Tag color="blue" style={{ fontSize: 14, padding: "4px 16px" }}>
              {orgType
                ? `Найдено: ${data.length}`
                : `Всего организаций: ${total}`}
            </Tag>
          </Space>

          {/* Типы организаций */}
          {orgTypes.length > 0 && (
            <Space wrap style={{ marginTop: 8 }}>
              <span style={{ color: "#8c8c8c" }}>Фильтр по типу:</span>
              <Tag
                color={!orgType ? "blue" : "default"}
                style={{ cursor: "pointer" }}
                onClick={() => setOrgType(undefined)}
              >
                Все
              </Tag>
              {orgTypes.map((type) => {
                // Считаем количество организаций этого типа (если есть allData)
                return (
                  <Tag
                    key={type}
                    color={orgType === type ? "blue" : "default"}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setOrgType(orgType === type ? undefined : type)
                    }
                  >
                    {type}
                  </Tag>
                );
              })}
            </Space>
          )}
        </Space>
      </Card>

      {/* Карточки организаций */}
      <Spin
        indicator={<GerbSpinner size={100} animation="spin3d" />}
        spinning={loading}
      >
        {data.length > 0 ? (
          <>
            <Row gutter={[16, 16]}>
              {data.map((item) => {
                const name = getName(item);
                const address = getAddress(item);
                const inn = item["ИНН"];
                const phone = item["Телефон"];
                const email = item["Email"];
                const website = item["Сайт"];
                const orgTypeValue =
                  item["Вид организации"] || item["Тип организации"];
                const director = item["Руководитель"] || item["Директор"];
                const employeesCount = getEmployeesCount(item);

                return (
                  <Col xs={24} sm={12} md={8} lg={6} xl={6} key={item._id}>
                    <Card
                      hoverable
                      onClick={() => showDetails(item)}
                      style={{
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
                        }}
                      >
                        <Avatar
                          size={56}
                          icon={<BankOutlined />}
                          style={{
                            backgroundColor: "#1890ff",
                            marginRight: 12,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 16,
                              marginBottom: 4,
                              wordBreak: "break-word",
                            }}
                          >
                            {name}
                          </div>
                          <Space size={4} wrap>
                            {orgTypeValue && (
                              <Tag color="purple">{orgTypeValue}</Tag>
                            )}
                            {employeesCount && (
                              <Tag color="blue" icon={<TeamOutlined />}>
                                {employeesCount} сотр.
                              </Tag>
                            )}
                          </Space>
                        </div>
                      </div>

                      {/* Адрес - если есть */}
                      {address !== "Без адреса" && (
                        <div
                          style={{
                            backgroundColor: "#f5f5f5",
                            padding: "12px",
                            borderRadius: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              marginBottom: 4,
                            }}
                          >
                            <EnvironmentOutlined
                              style={{
                                color: "#1890ff",
                                marginRight: 8,
                                marginTop: 3,
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 500,
                                fontSize: 13,
                                wordBreak: "break-word",
                              }}
                            >
                              {address}
                            </span>
                          </div>
                        </div>
                      )}

                      <div style={{ flex: 1 }} />

                      {/* Связанные жители (если есть) */}
                      {item["Список граждан Вынгапур"] && (
                        <div
                          style={{
                            fontSize: 13,
                            color: "#595959",
                            marginTop: 8,
                          }}
                        >
                          <TeamOutlined style={{ marginRight: 8 }} />
                          {Array.isArray(item["Список граждан Вынгапур"])
                            ? `${item["Список граждан Вынгапур"].length} сотрудников`
                            : "Есть сотрудники"}
                        </div>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showQuickJumper
                showTotal={(t) => `Всего ${t} организаций`}
                pageSizeOptions={["12", "24", "48", "96"]}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps || 24);
                }}
              />
            </div>
          </>
        ) : (
          <Empty description="Нет данных" style={{ marginTop: 48 }} />
        )}
      </Spin>

      {/* Модальное окно с детальной информацией */}
      <OrganizationModal
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        organization={selectedOrg}
        getName={getName}
        getAddress={getAddress}
        formatValue={formatValue}
      />
    </>
  );
};
