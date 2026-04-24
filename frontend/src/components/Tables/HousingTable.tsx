// src/components/HousingTable.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Pagination,
  Spin,
  Empty,
  Collapse,
  Radio,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  HomeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { housingApi, HousingItem } from "../../services/api";
import { sortByHouseNumber } from "../../utils/naturalSort";
import { HousingCard } from "./HousingCard";
import { HousingModal } from "../Modals/HousingModal";
import { GerbSpinner } from "../GerbSpinner";
import { ExportButton } from "../ExportButton";

const { Option } = Select;

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

const formatRelativeDate = (dateStr: string): string => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const formatted = formatDate(dateStr);
    if (diffDays < 0) return `${formatted} (прошло ${Math.abs(diffDays)} дн.)`;
    if (diffDays === 0) return `${formatted} (сегодня)`;
    if (diffDays === 1) return `${formatted} (завтра)`;
    if (diffDays < 30) return `${formatted} (через ${diffDays} дн.)`;
    if (diffDays < 365)
      return `${formatted} (через ${Math.floor(diffDays / 30)} мес.)`;
    return formatted;
  } catch {
    return dateStr;
  }
};

export const HousingTable: React.FC = () => {
  const [allData, setAllData] = useState<HousingItem[]>([]);
  const [filteredData, setFilteredData] = useState<HousingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const [searchAddress, setSearchAddress] = useState("");
  const [housingType, setHousingType] = useState<string>();
  const [buildingType, setBuildingType] = useState<string>();
  const [emergencyFilter, setEmergencyFilter] = useState<boolean>(); // true = аварийный, false = не аварийный

  const [housingTypes, setHousingTypes] = useState<string[]>([]);
  const [buildingTypes, setBuildingTypes] = useState<string[]>([]);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [groupBy, setGroupBy] = useState<
    "none" | "housingType" | "buildingType"
  >("none");

  const [selectedHousing, setSelectedHousing] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [exportData, setExportData] = useState<any[]>([]);

  // Вспомогательные функции
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") {
      if (Array.isArray(value))
        return value.map((v) => formatValue(v)).join(", ");
      return (
        value.display_value ||
        value["Почтовый адрес"] ||
        value["Адрес"] ||
        JSON.stringify(value)
      );
    }
    return String(value);
  };

  const getAddress = (record: any): string => {
    let addr = record["Почтовый адрес"] || record["Адрес"];
    if (addr && typeof addr === "object")
      addr = addr.display_value || addr["Почтовый адрес"] || addr["Адрес"];
    return addr ? String(addr) : "Без адреса";
  };

  const getHouseNumber = (record: any): string => {
    if (record["Номер дома"]) return String(record["Номер дома"]);
    const address = getAddress(record);
    if (!address || address === "Без адреса") return "—";
    const match = address.match(/\d+[а-яА-Яa-zA-Z]?/);
    return match ? match[0] : "—";
  };

  const getResidentsCount = (record: any): number => {
    if (record.residents_count !== undefined) return record.residents_count;
    if (record["Количество жильцов в доме"])
      return record["Количество жильцов в доме"];
    if (record["Количество жителей"]) return record["Количество жителей"];
    if (record["Список граждан Вынгапур"]) {
      return Array.isArray(record["Список граждан Вынгапур"])
        ? record["Список граждан Вынгапур"].length
        : 1;
    }
    return 0;
  };

  const getOwnersCount = (record: any): number => {
    if (record.owners_count !== undefined) return record.owners_count;
    if (record["Количество собственников жилья"])
      return record["Количество собственников жилья"];
    if (record["Список собственников жилья"]) {
      return Array.isArray(record["Список собственников жилья"])
        ? record["Список собственников жилья"].length
        : 1;
    }
    return 0;
  };

  const isEmergency = (record: any): boolean => {
    const value = record["Аварийный / не аварийный"];
    return (
      value === true || value === "Да" || value === "да" || value === "true"
    );
  };

  // Загрузка данных
  const loadAllData = async () => {
    setLoading(true);
    try {
      let allRows: HousingItem[] = [];
      let pageNum = 1;
      const limit = 500;
      let hasMore = true;

      while (hasMore) {
        const response = await housingApi.getList({
          page: pageNum,
          page_size: limit,
        });
        const rows = response.data;
        if (rows.length === 0) break;

        const processedData = rows.map((item) => {
          const processed: any = { ...item };
          Object.keys(processed).forEach((key) => {
            const value = processed[key];
            if (value && (typeof value === "object" || Array.isArray(value))) {
              processed[key] = formatValue(value);
            }
          });
          return processed;
        });

        allRows = [...allRows, ...processedData];
        if (rows.length < limit) hasMore = false;
        else pageNum++;
      }

      setAllData(allRows);
      applyFilters(allRows);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (sourceData: HousingItem[]) => {
    let filtered = [...sourceData];

    if (searchAddress) {
      const searchLower = searchAddress.toLowerCase();
      filtered = filtered.filter((item) =>
        getAddress(item).toLowerCase().includes(searchLower),
      );
    }
    if (housingType) {
      filtered = filtered.filter((item) => {
        const type =
          item["Категория"] || item["Вид жилья"] || item["Тип жилья"];
        return type === housingType;
      });
    }
    if (buildingType) {
      filtered = filtered.filter((item) => {
        const bType = item["Тип здания"] || item["Тип объекта"];
        return bType === buildingType;
      });
    }
    if (emergencyFilter !== undefined) {
      filtered = filtered.filter(
        (item) => isEmergency(item) === emergencyFilter,
      );
    }

    setFilteredData(filtered);
    setPage(1);
  };

  const loadAllFilteredForExport = async () => {
    try {
      // Если фильтры не заданы — используем все данные
      if (
        !searchAddress &&
        !housingType &&
        !buildingType &&
        emergencyFilter === undefined
      ) {
        setExportData(allData);
        return;
      }

      // Загружаем все данные с фильтрами постранично
      let allItems: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await housingApi.getList({
          page,
          page_size: 100,
          search: searchAddress || undefined,
          category: housingType || undefined,
          building_type: buildingType || undefined,
          is_emergency: emergencyFilter,
        });

        const rows = response.data || [];

        // Обрабатываем данные так же, как в loadAllData
        const processedData = rows.map((item: any) => {
          const processed: any = { ...item };
          Object.keys(processed).forEach((key) => {
            const value = processed[key];
            if (value && (typeof value === "object" || Array.isArray(value))) {
              processed[key] = formatValue(value);
            }
          });
          return processed;
        });

        allItems = [...allItems, ...processedData];

        if (rows.length < 100 || allItems.length >= response.total) {
          hasMore = false;
        } else {
          page++;
        }
      }

      setExportData(allItems);
      console.log(
        `Загружено ${allItems.length} отфильтрованных записей для экспорта`,
      );
    } catch (error) {
      console.error("Ошибка загрузки отфильтрованных данных:", error);
      setExportData(filteredData); // Fallback
    }
  };

  const displayData = useMemo(() => {
    const sorted = sortByHouseNumber(filteredData, sortOrder);
    const start = (page - 1) * pageSize;
    const paginated = sorted.slice(start, start + pageSize);

    if (groupBy === "none") return paginated;

    const groups: Record<string, HousingItem[]> = {};
    paginated.forEach((item) => {
      const key =
        groupBy === "housingType"
          ? item["Категория"] ||
            item["Вид жилья"] ||
            item["Тип жилья"] ||
            "Не указано"
          : item["Тип здания"] || item["Тип объекта"] || "Не указано";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const result: any[] = [];
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, "ru"))
      .forEach((key) => {
        result.push({
          _id: `group-${key}`,
          isGroupHeader: true,
          groupName: key,
          groupCount: groups[key].length,
        });
        result.push(...groups[key]);
      });
    return result;
  }, [filteredData, sortOrder, page, pageSize, groupBy]);

  const emergencyStats = useMemo(() => {
    let emergency = 0,
      notEmergency = 0;
    filteredData.forEach((item) => {
      if (isEmergency(item)) emergency++;
      else notEmergency++;
    });
    return { total: filteredData.length, emergency, notEmergency };
  }, [filteredData]);

  const loadFilterOptions = async () => {
    try {
      const housingTypeSet = new Set<string>();
      const buildingTypeSet = new Set<string>();
      let pageNum = 1,
        hasMore = true;

      while (hasMore) {
        const response = await housingApi.getList({
          page: pageNum,
          page_size: 500,
        });
        const rows = response.data;
        if (rows.length === 0) break;
        rows.forEach((item: any) => {
          const type =
            item["Категория"] || item["Вид жилья"] || item["Тип жилья"];
          if (type) housingTypeSet.add(String(type));
          const bType = item["Тип здания"] || item["Тип объекта"];
          if (bType) buildingTypeSet.add(String(bType));
        });
        if (rows.length < 500) hasMore = false;
        else pageNum++;
      }

      setHousingTypes(
        Array.from(housingTypeSet).sort((a, b) => a.localeCompare(b, "ru")),
      );
      setBuildingTypes(
        Array.from(buildingTypeSet).sort((a, b) => a.localeCompare(b, "ru")),
      );
    } catch (error) {
      setHousingTypes(["МКД", "ИЖС", "Блокированный"]);
      setBuildingTypes(["Кирпичный", "Панельный", "Деревянный"]);
    }
  };

  useEffect(() => {
    if (allData.length > 0) {
      loadAllFilteredForExport();
    }
    loadAllData();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (allData.length > 0) {
      applyFilters(allData);
      loadAllFilteredForExport();
    }
  }, [searchAddress, housingType, buildingType, emergencyFilter]);

  const handleReset = () => {
    setSearchAddress("");
    setHousingType(undefined);
    setBuildingType(undefined);
    setEmergencyFilter(undefined);
    setSortOrder("asc");
    setGroupBy("none");
  };

  const showDetails = async (id: string) => {
    try {
      const details = await housingApi.getDetails(id);
      setSelectedHousing(details);
      setModalVisible(true);
    } catch (error) {
      console.error("Ошибка загрузки деталей:", error);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Space
            wrap
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space wrap>
              <Input
                placeholder="Поиск по адресу"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 280 }}
                allowClear
              />
              <Select
                placeholder="Вид жилья"
                value={housingType}
                onChange={setHousingType}
                style={{ width: 180 }}
                allowClear
              >
                {housingTypes.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Тип здания"
                value={buildingType}
                onChange={setBuildingType}
                style={{ width: 180 }}
                allowClear
              >
                {buildingTypes.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Аварийность"
                value={emergencyFilter}
                onChange={setEmergencyFilter}
                style={{ width: 160 }}
                allowClear
              >
                <Option value={true}>
                  <Space>
                    <WarningOutlined style={{ color: "#ff4d4f" }} />
                    Аварийный
                  </Space>
                </Option>
                <Option value={false}>
                  <Space>
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    Не аварийный
                  </Space>
                </Option>
              </Select>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => applyFilters(allData)}
              >
                Поиск
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Сбросить
              </Button>
              <ExportButton
                data={filteredData.length > 0 ? filteredData : allData}
                title={
                  searchAddress ||
                  housingType ||
                  buildingType ||
                  emergencyFilter !== undefined
                    ? "Жилой фонд (отфильтровано)"
                    : "Жилой фонд"
                }
                filename={
                  searchAddress
                    ? `housing_${searchAddress.substring(0, 20)}`
                    : housingType
                      ? `housing_${housingType}`
                      : buildingType
                        ? `housing_${buildingType}`
                        : "housing_all"
                }
                columns={[
                  { key: "Почтовый адрес", label: "Адрес" },
                  { key: "Номер дома", label: "№ дома" },
                  { key: "Вид жилья", label: "Вид жилья" },
                  { key: "Тип здания", label: "Тип здания" },
                  { key: "Количество этажей", label: "Этажность" },
                  { key: "Площадь общая", label: "Площадь общая" },
                ]}
                disabled={loading}
                size="small"
              />
              <Row gutter={16}>
                <Col>
                  <Tag icon={<HomeOutlined />} color="blue">
                    Всего: {emergencyStats.total}
                  </Tag>
                </Col>
                <Col>
                  <Tag icon={<WarningOutlined />} color="red">
                    Аварийных: {emergencyStats.emergency}
                  </Tag>
                </Col>
                <Col>
                  <Tag icon={<CheckCircleOutlined />} color="green">
                    Не аварийных: {emergencyStats.notEmergency}
                  </Tag>
                </Col>
              </Row>
            </Space>
          </Space>

          <Radio.Group
            value={groupBy}
            onChange={(e) => {
              setGroupBy(e.target.value);
              setPage(1);
            }}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="none">Без группировки</Radio.Button>
            <Radio.Button value="housingType">По виду жилья</Radio.Button>
            <Radio.Button value="buildingType">По типу здания</Radio.Button>
          </Radio.Group>

          {(housingType || buildingType || emergencyFilter !== undefined) && (
            <Space wrap>
              <span style={{ color: "#8c8c8c", fontSize: 13 }}>
                Активные фильтры:
              </span>
              {housingType && (
                <Tag
                  closable
                  onClose={() => setHousingType(undefined)}
                  color="blue"
                >
                  🏠 {housingType}
                </Tag>
              )}
              {buildingType && (
                <Tag
                  closable
                  onClose={() => setBuildingType(undefined)}
                  color="purple"
                >
                  🏢 {buildingType}
                </Tag>
              )}
              {emergencyFilter !== undefined && (
                <Tag
                  closable
                  onClose={() => setEmergencyFilter(undefined)}
                  color={emergencyFilter ? "red" : "green"}
                >
                  {emergencyFilter ? "⚠️ Аварийный" : "✅ Не аварийный"}
                </Tag>
              )}
            </Space>
          )}
        </Space>
      </Card>

      <Spin
        indicator={<GerbSpinner size={200} animation="spin3d" />}
        spinning={loading}
      >
        {displayData.length > 0 ? (
          <>
            {groupBy !== "none" ? (
              <Collapse
                defaultActiveKey={Object.keys(
                  displayData.reduce(
                    (acc, item) => {
                      if (!item.isGroupHeader) {
                        const key =
                          groupBy === "housingType"
                            ? item["Категория"] ||
                              item["Вид жилья"] ||
                              "Не указано"
                            : item["Тип здания"] ||
                              item["Тип объекта"] ||
                              "Не указано";
                        acc[key] = true;
                      }
                      return acc;
                    },
                    {} as Record<string, boolean>,
                  ),
                )}
                style={{ backgroundColor: "#fff" }}
              >
                {(() => {
                  const groups: Record<string, HousingItem[]> = {};
                  displayData.forEach((item) => {
                    if (!item.isGroupHeader) {
                      const key =
                        groupBy === "housingType"
                          ? item["Категория"] ||
                            item["Вид жилья"] ||
                            "Не указано"
                          : item["Тип здания"] ||
                            item["Тип объекта"] ||
                            "Не указано";
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(item);
                    }
                  });
                  return Object.keys(groups)
                    .sort((a, b) => a.localeCompare(b, "ru"))
                    .map((groupName) => (
                      <Collapse.Panel
                        key={groupName}
                        header={
                          <Space size="large">
                            <span style={{ fontWeight: 600, fontSize: 16 }}>
                              {groupBy === "housingType" ? "🏠" : "🏢"}{" "}
                              {groupName}
                            </span>
                            <Tag color="blue">
                              {groups[groupName].length} объектов
                            </Tag>
                          </Space>
                        }
                      >
                        <Row gutter={[16, 16]}>
                          {groups[groupName].map((item) => (
                            <HousingCard
                              key={item._id}
                              item={item}
                              onShowDetails={showDetails}
                              getAddress={getAddress}
                              getHouseNumber={getHouseNumber}
                              getResidentsCount={getResidentsCount}
                              getOwnersCount={getOwnersCount}
                              formatDate={formatDate}
                            />
                          ))}
                        </Row>
                      </Collapse.Panel>
                    ));
                })()}
              </Collapse>
            ) : (
              <Row gutter={[16, 16]}>
                {displayData.map((item) => (
                  <HousingCard
                    key={item._id}
                    item={item}
                    onShowDetails={showDetails}
                    getAddress={getAddress}
                    getHouseNumber={getHouseNumber}
                    getResidentsCount={getResidentsCount}
                    getOwnersCount={getOwnersCount}
                    formatDate={formatDate}
                  />
                ))}
              </Row>
            )}
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredData.length}
                showSizeChanger
                showQuickJumper
                showTotal={(t) => `Всего ${t} объектов`}
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

      <HousingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        housing={selectedHousing}
        getAddress={getAddress}
        formatDate={formatDate}
        formatRelativeDate={formatRelativeDate}
      />
    </>
  );
};
