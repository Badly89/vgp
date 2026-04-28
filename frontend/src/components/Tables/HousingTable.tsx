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
  Radio,
  Table,
  Drawer,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  HomeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { housingApi, HousingItem } from "../../services/api";
import { sortByHouseNumber } from "../../utils/naturalSort";
import { HousingCard } from "./HousingCard";
import { HousingDrawer } from "../Drawers/HousingDrawer";
import { GerbSpinner } from "../GerbSpinner";
import { ExportButton } from "../ExportButton";
import { THEME } from "../../styles/theme";

const COLORS = THEME.colors;
const RADIUS = THEME.radius;

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
  const [emergencyFilter, setEmergencyFilter] = useState<boolean>();

  const [housingTypes, setHousingTypes] = useState<string[]>([]);
  const [buildingTypes, setBuildingTypes] = useState<string[]>([]);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Убрано состояние groupBy

  // Drawer вместо Modal
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedHousingId, setSelectedHousingId] = useState<string | null>(
    null,
  );
  const [filterVisible, setFilterVisible] = useState(false);

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
      if (
        !searchAddress &&
        !housingType &&
        !buildingType &&
        emergencyFilter === undefined
      ) {
        setExportData(allData);
        return;
      }

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
    } catch (error) {
      setExportData(filteredData);
    }
  };

  const displayData = useMemo(() => {
    const sorted = sortByHouseNumber(filteredData, sortOrder);
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [filteredData, sortOrder, page, pageSize]);

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
  };

  // Новая функция для открытия Drawer
  const showDetails = (id: string) => {
    setSelectedHousingId(id);
    setDrawerVisible(true);
  };

  // Колонки таблицы
  const columns = [
    {
      title: "Адрес",
      key: "address",
      width: 280,
      sorter: (a: any, b: any) => {
        const numA = parseInt(getHouseNumber(a)) || 0;
        const numB = parseInt(getHouseNumber(b)) || 0;
        return numA - numB;
      },
      render: (_: any, record: any) => (
        <a
          onClick={(e) => {
            e.stopPropagation();
            showDetails(record._id);
          }}
          style={{ fontWeight: 500, color: COLORS.textPrimary }}
        >
          <EnvironmentOutlined
            style={{ marginRight: 8, color: COLORS.terracotta }}
          />
          {getAddress(record)}, д. {getHouseNumber(record)}
        </a>
      ),
    },
    {
      title: "Тип дома",
      key: "building_type",
      width: 120,
      render: (_: any, record: any) => (
        <span style={{ color: COLORS.textSecondary }}>
          {record["Тип здания"] || record["Тип объекта"] || "—"}
        </span>
      ),
    },
    {
      title: "Год постройки",
      key: "year",
      width: 100,
      render: (_: any, record: any) => (
        <span style={{ color: COLORS.textPrimary }}>
          {record["Год ввода"] || record["Год постройки"] || "—"}
        </span>
      ),
    },
    {
      title: "Этажность",
      key: "floors",
      width: 80,
      render: (_: any, record: any) => {
        const floors = record["Количество этажей"] || record["Этажность"];
        return (
          <span style={{ color: COLORS.textPrimary }}>
            {floors ? `${floors} эт.` : "—"}
          </span>
        );
      },
    },
    {
      title: "Квартиры",
      key: "apartments",
      width: 80,
      render: (_: any, record: any) => (
        <span style={{ color: COLORS.textPrimary }}>
          {record["квартир всего"] || "—"}
        </span>
      ),
    },
    {
      title: "Общая площадь",
      key: "area",
      width: 120,
      render: (_: any, record: any) => {
        const area = record["Площадь общая"] || record["Площадь"];
        return (
          <span style={{ color: COLORS.textPrimary }}>
            {area ? `${Number(area).toLocaleString()} м²` : "—"}
          </span>
        );
      },
    },
    {
      title: "Категория",
      key: "category",
      width: 100,
      render: (_: any, record: any) => {
        const cat = record["Вид жилья"] || record["Категория"];
        return cat ? (
          <Tag
            style={{
              background: COLORS.northernIce,
              color: COLORS.primaryDark,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.xs,
            }}
          >
            {cat}
          </Tag>
        ) : (
          "—"
        );
      },
    },
    {
      title: "Жителей",
      key: "residents",
      width: 80,
      render: (_: any, record: any) => (
        <span style={{ color: COLORS.textPrimary }}>
          {getResidentsCount(record) || "—"}
        </span>
      ),
    },
    {
      title: "Собственников",
      key: "owners",
      width: 100,
      render: (_: any, record: any) => (
        <span style={{ color: COLORS.textPrimary }}>
          {getOwnersCount(record) || "—"}
        </span>
      ),
    },
    {
      title: "Тех. состояние",
      key: "status",
      width: 180,
      render: (_: any, record: any) => {
        const emergency = isEmergency(record);
        const year = parseInt(
          record["Год ввода"] || record["Год постройки"] || "0",
        );
        let color = COLORS.success;
        let text = "хорошее";

        if (emergency) {
          color = COLORS.danger;
          text = "аварийное";
        } else if (year >= 2010) {
          color = COLORS.success;
          text = "хорошее";
        } else if (year >= 1980) {
          color = COLORS.info;
          text = "удовлетворительное";
        } else if (year >= 1960) {
          color = COLORS.warning;
          text = "требует ремонта";
        } else if (year > 0) {
          color = "#ff7a45";
          text = "ветхое";
        }

        return (
          <Space>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
            <span style={{ color: COLORS.textPrimary }}>{text}</span>
          </Space>
        );
      },
    },
  ];

  return (
    <div
      style={{
        padding: "0 24px",
        background: COLORS.background,
        minHeight: "100vh",
      }}
    >
      {/* Верхняя панель с кнопками */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: COLORS.surface,
          boxShadow: COLORS.shadowSmall,
          borderRadius: RADIUS.sm,
          border: `1px solid ${COLORS.borderLight}`,
        }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <Tag
              icon={<HomeOutlined />}
              style={{
                background: COLORS.terracotta,
                color: "#fff",
                border: "none",
                borderRadius: RADIUS.full,
              }}
            >
              Всего: {emergencyStats.total}
            </Tag>
            <Tag
              icon={<WarningOutlined />}
              style={{
                background: COLORS.danger,
                color: "#fff",
                border: "none",
                borderRadius: RADIUS.full,
              }}
            >
              Аварийных: {emergencyStats.emergency}
            </Tag>
            <Tag
              icon={<CheckCircleOutlined />}
              style={{
                background: COLORS.success,
                color: "#fff",
                border: "none",
                borderRadius: RADIUS.full,
              }}
            >
              Не аварийных: {emergencyStats.notEmergency}
            </Tag>
            {filteredData.length !== allData.length && (
              <Tag
                style={{
                  background: COLORS.warning,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.full,
                }}
              >
                Отфильтровано: {filteredData.length}
              </Tag>
            )}
          </Space>

          <Space>
            <Tooltip title="Фильтры">
              <Button
                icon={<FilterOutlined />}
                type={
                  searchAddress ||
                  housingType ||
                  buildingType ||
                  emergencyFilter !== undefined
                    ? "primary"
                    : "default"
                }
                onClick={() => setFilterVisible(true)}
              />
            </Tooltip>
            <ExportButton
              data={exportData.length > 0 ? exportData : filteredData}
              title="Жилой фонд"
              filename="housing_export"
              columns={[
                { key: "Почтовый адрес", label: "Адрес" },
                { key: "Номер дома", label: "№ дома" },
                { key: "Вид жилья", label: "Вид жилья" },
                { key: "Тип здания", label: "Тип здания" },
                { key: "Количество этажей", label: "Этажность" },
                { key: "Площадь общая", label: "Площадь общая" },
              ]}
              disabled={loading}
            />
          </Space>
        </Space>

        {/* Активные фильтры */}
        {(housingType ||
          buildingType ||
          emergencyFilter !== undefined ||
          searchAddress) && (
          <Space wrap style={{ marginTop: 12 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 13 }}>
              Активные фильтры:
            </span>
            {searchAddress && (
              <Tag
                closable
                onClose={() => {
                  setSearchAddress("");
                  applyFilters(allData);
                }}
                style={{
                  background: COLORS.northernBlue,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                🔍 {searchAddress}
              </Tag>
            )}
            {housingType && (
              <Tag
                closable
                onClose={() => setHousingType(undefined)}
                style={{
                  background: COLORS.terracotta,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                🏠 {housingType}
              </Tag>
            )}
            {buildingType && (
              <Tag
                closable
                onClose={() => setBuildingType(undefined)}
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                🏢 {buildingType}
              </Tag>
            )}
            {emergencyFilter !== undefined && (
              <Tag
                closable
                onClose={() => setEmergencyFilter(undefined)}
                style={{
                  background: emergencyFilter ? COLORS.danger : COLORS.success,
                  color: "#fff",
                  border: "none",
                  borderRadius: RADIUS.sm,
                }}
              >
                {emergencyFilter ? "⚠️ Аварийный" : "✅ Не аварийный"}
              </Tag>
            )}
          </Space>
        )}
      </Card>

      {/* Выдвижная панель фильтров */}
      <Drawer
        title="🔍 Фильтры жилого фонда"
        placement="right"
        width={400}
        open={filterVisible}
        onClose={() => setFilterVisible(false)}
        styles={{ body: { padding: 0 } }} // Убираем паддинг у тела дровера, чтобы управлять отступами сами
      >
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%", padding: "0 24px 24px 24px" }} // Добавили отступы: Слева/Справа 24px, Снизу 24px
        >
          <Input
            placeholder="Поиск по адресу"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            prefix={<SearchOutlined style={{ color: COLORS.textSecondary }} />}
            size="large"
            allowClear
            style={{
              borderRadius: RADIUS.sm,
              width: THEME.sizes.filterDrawerInputWidth,
            }}
          />

          <Select
            placeholder="Вид жилья"
            value={housingType}
            onChange={setHousingType}
            style={{ width: THEME.sizes.filterDrawerInputWidth }}
            size="large"
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
            style={{ width: THEME.sizes.filterDrawerInputWidth }}
            size="large"
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
            style={{ width: THEME.sizes.filterDrawerInputWidth }}
            size="large"
            allowClear
          >
            <Option value={true}>⚠️ Аварийный</Option>
            <Option value={false}>✅ Не аварийный</Option>
          </Select>

          <Space style={{ width: THEME.sizes.filterDrawerInputWidth }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => {
                applyFilters(allData);
                setFilterVisible(false);
              }}
              block
              style={{
                background: COLORS.terracotta,
                borderColor: COLORS.terracotta,
                borderRadius: RADIUS.md,
                height: 44,
                fontWeight: 600,
              }}
            >
              Применить фильтры
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                handleReset();
                setFilterVisible(false);
              }}
              block
              style={{ borderRadius: RADIUS.md, height: 44 }}
            >
              Сбросить
            </Button>
          </Space>
        </Space>
      </Drawer>

      <Spin
        indicator={<GerbSpinner size={200} animation="spin3d" />}
        spinning={loading}
      >
        {displayData.length > 0 ? (
          <>
            <Card
              styles={{ body: { padding: 0 } }}
              style={{
                borderRadius: RADIUS.lg,
                overflow: "hidden",
                border: `1px solid ${COLORS.borderLight}`,
                boxShadow: COLORS.shadowSmall,
              }}
            >
              <Table
                columns={columns}
                dataSource={displayData}
                rowKey="_id"
                pagination={{
                  current: page,
                  pageSize,
                  total: filteredData.length,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (t) => `Всего ${t} объектов`,
                  pageSizeOptions: ["12", "24", "48", "96"],
                  onChange: (p, ps) => {
                    setPage(p);
                    setPageSize(ps || 24);
                  },
                }}
                size="middle"
                rowClassName={(_, index) =>
                  index % 2 === 0 ? "row-light" : "row-dark"
                }
                onRow={(record) => ({
                  style: { cursor: "pointer" },
                  onClick: () => showDetails(record._id),
                })}
              />
            </Card>
            <div
              style={{
                textAlign: "center",
                marginTop: 16,
                color: COLORS.textMuted,
                fontSize: 12,
              }}
            >
              Данные обновлены • {new Date().toLocaleDateString("ru-RU")} в{" "}
              {new Date().toLocaleTimeString("ru-RU")}
            </div>
          </>
        ) : (
          <Empty description="Нет данных" style={{ marginTop: 48 }} />
        )}
      </Spin>

      <HousingDrawer
        visible={drawerVisible}
        housingId={selectedHousingId}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedHousingId(null);
        }}
        getAddress={getAddress}
        formatDate={formatDate}
        formatRelativeDate={formatRelativeDate}
      />
    </div>
  );
};
