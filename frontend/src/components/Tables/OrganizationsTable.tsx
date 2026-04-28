import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Avatar,
  Pagination,
  Spin,
  Empty,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  BankOutlined,
  EnvironmentOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import { organizationsApi, OrganizationItem } from "../../services/api";
import { GerbSpinner } from "../GerbSpinner";
import { THEME } from "../../styles/theme";
import { OrganizationDrawer } from "../Drawers/OrganizationDrawer";

const COLORS = THEME.colors;
const RADIUS = THEME.radius;

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
  const [drawerVisible, setDrawerVisible] = useState(false);

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
    setDrawerVisible(true);
  };

  return (
    <div
      style={{
        padding: "0 24px",
        background: COLORS.background,
        minHeight: "100vh",
      }}
    >
      {/* Панель поиска и фильтров */}
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
                prefix={
                  <SearchOutlined style={{ color: COLORS.textSecondary }} />
                }
                style={{ width: 320, borderRadius: RADIUS.sm }}
                allowClear
              />
              <Button
                type="primary"
                onClick={handleSearch}
                icon={<SearchOutlined />}
                style={{
                  background: COLORS.terracotta,
                  borderColor: COLORS.terracotta,
                  borderRadius: RADIUS.sm,
                }}
              >
                Поиск
              </Button>
              <Button
                onClick={handleReset}
                icon={<ReloadOutlined />}
                style={{ borderRadius: RADIUS.sm }}
              >
                Сбросить
              </Button>
            </Space>

            <Tag
              style={{
                background: COLORS.terracotta,
                color: "#fff",
                border: "none",
                borderRadius: RADIUS.full,
                fontSize: 14,
                padding: "4px 16px",
              }}
            >
              {orgType
                ? `Найдено: ${data.length}`
                : `Всего организаций: ${total}`}
            </Tag>
          </Space>

          {/* Типы организаций */}
          {orgTypes.length > 0 && (
            <Space wrap style={{ marginTop: 8 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 13 }}>
                Фильтр по типу:
              </span>
              <Tag
                style={{
                  background: !orgType ? COLORS.terracotta : "transparent",
                  color: !orgType ? "#fff" : COLORS.textPrimary,
                  border: !orgType ? "none" : `1px solid ${COLORS.border}`,
                  borderRadius: RADIUS.sm,
                  cursor: "pointer",
                }}
                onClick={() => setOrgType(undefined)}
              >
                Все
              </Tag>
              {orgTypes.map((type) => {
                return (
                  <Tag
                    key={type}
                    style={{
                      background:
                        orgType === type ? COLORS.terracotta : "transparent",
                      color: orgType === type ? "#fff" : COLORS.textPrimary,
                      border:
                        orgType === type
                          ? "none"
                          : `1px solid ${COLORS.border}`,
                      borderRadius: RADIUS.sm,
                      cursor: "pointer",
                    }}
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
                  <Col xs={24} sm={12} md={10} lg={8} xl={8} key={item._id}>
                    <Card
                      hoverable
                      onClick={() => showDetails(item)}
                      style={{
                        height: "100%",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: RADIUS.lg,
                        border: `1px solid ${COLORS.borderLight}`,
                        boxShadow: COLORS.shadowSmall,
                        transition: `all ${THEME.animation.fast}`,
                      }}
                      bodyStyle={{
                        padding: "16px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = COLORS.terracotta;
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = COLORS.shadowMedium;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = COLORS.borderLight;
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = COLORS.shadowSmall;
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
                            backgroundColor: COLORS.primaryLight,
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
                              color: COLORS.textPrimary,
                            }}
                          >
                            {name}
                          </div>
                          <Space size={4} wrap>
                            {orgTypeValue && (
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
                                {orgTypeValue}
                              </Tag>
                            )}
                            {employeesCount && (
                              <Tag
                                icon={<TeamOutlined />}
                                style={{
                                  margin: 0,
                                  background: "rgba(123, 158, 175, 0.1)",
                                  color: COLORS.northernBlue,
                                  border: "none",
                                  borderRadius: RADIUS.xs,
                                  fontSize: 11,
                                }}
                              >
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
                            backgroundColor: COLORS.background,
                            padding: "12px",
                            borderRadius: RADIUS.sm,
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              marginBottom: 0,
                            }}
                          >
                            <EnvironmentOutlined
                              style={{
                                color: COLORS.terracotta,
                                marginRight: 8,
                                marginTop: 3,
                              }}
                            />
                            <span
                              style={{
                                fontWeight: 500,
                                fontSize: 13,
                                wordBreak: "break-word",
                                color: COLORS.textPrimary,
                              }}
                            >
                              {address}
                            </span>
                          </div>
                        </div>
                      )}

                      <div style={{ flex: 1 }} />
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

      <OrganizationDrawer
        visible={drawerVisible}
        organization={selectedOrg}
        onClose={() => setDrawerVisible(false)}
        getName={getName}
        getAddress={getAddress}
        formatValue={formatValue}
      />
    </div>
  );
};
