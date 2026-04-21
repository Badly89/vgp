import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Input,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Pagination,
  Spin,
  Empty,
  Collapse,
  Descriptions,
  Tooltip,
  Badge,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  PercentageOutlined,
  EnvironmentOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { ownersApi, OwnerItem } from "../../services/api";
import { OwnerModal } from "../Modals/OwnerModal";

export const OwnersTable: React.FC = () => {
  const [allData, setAllData] = useState<OwnerItem[]>([]);
  const [filteredData, setFilteredData] = useState<OwnerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [searchText, setSearchText] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const showOwnerDetails = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setModalVisible(true);
  };

  // Загрузка данных
  const loadAllData = async () => {
    setLoading(true);
    try {
      const response = await ownersApi.getGroupedByAddress({
        page: 1,
        page_size: 5000,
      });

      if (response.data) {
        setAllData(response.data);
        applySearch(response.data, searchText);
      }
    } catch (error) {
      console.error("Ошибка загрузки собственников:", error);
    } finally {
      setLoading(false);
    }
  };

  const applySearch = (data: any[], search: string) => {
    if (!search) {
      setFilteredData(data);
      return;
    }

    const searchLower = search.toLowerCase();
    const filtered = data.filter((group) => {
      // Ищем по адресу
      if (group.address.toLowerCase().includes(searchLower)) return true;

      // Ищем по собственникам в группе
      return group.owners.some((owner: any) => {
        const fio = owner["ФИО"] || owner["Наименование"] || "";
        const phone = owner["Телефон"] || "";
        return (
          fio.toLowerCase().includes(searchLower) || phone.includes(search)
        );
      });
    });

    setFilteredData(filtered);
    setPage(1);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    applySearch(allData, searchText);
  }, [searchText, allData]);

  const handleReset = () => {
    setSearchText("");
    setPage(1);
  };

  const handleExpandAll = () => {
    if (expandedKeys.length === filteredData.length) {
      setExpandedKeys([]);
    } else {
      setExpandedKeys(filteredData.map((_, idx) => `group-${idx}`));
    }
  };

  // Пагинация групп
  const paginatedGroups = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Статистика
  const stats = useMemo(() => {
    let totalOwners = 0;
    let totalObjects = filteredData.length;
    filteredData.forEach((g) => (totalOwners += g.owners_count));
    return { totalOwners, totalObjects };
  }, [filteredData]);

  // Функция для извлечения данных собственника
  const getOwnerField = (owner: any, field: string): string => {
    return owner[field] || "—";
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
                placeholder="Поиск по адресу, ФИО или телефону"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: 350 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => applySearch(allData, searchText)}
              >
                Поиск
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Сбросить
              </Button>
              <Button onClick={handleExpandAll}>
                {expandedKeys.length === filteredData.length
                  ? "Свернуть все"
                  : "Развернуть все"}
                <DownOutlined style={{ marginLeft: 8 }} />
              </Button>
            </Space>
            <Space>
              <Tag icon={<HomeOutlined />} color="blue">
                Объектов: {stats.totalObjects}
              </Tag>
              <Tag icon={<TeamOutlined />} color="green">
                Собственников: {stats.totalOwners}
              </Tag>
            </Space>
          </Space>

          {searchText && (
            <Space wrap>
              <span style={{ color: "#8c8c8c", fontSize: 13 }}>Поиск:</span>
              <Tag closable onClose={() => setSearchText("")} color="blue">
                "{searchText}"
              </Tag>
            </Space>
          )}
        </Space>
      </Card>

      <Spin spinning={loading}>
        {paginatedGroups.length > 0 ? (
          <>
            <Collapse
              activeKey={expandedKeys}
              onChange={(keys) => setExpandedKeys(keys as string[])}
              style={{ backgroundColor: "#fff" }}
              accordion={false}
            >
              {paginatedGroups.map((group, groupIdx) => (
                <Collapse.Panel
                  key={`group-${groupIdx}`}
                  header={
                    <Space size="large">
                      <EnvironmentOutlined
                        style={{ color: "#1890ff", fontSize: 18 }}
                      />
                      <span style={{ fontWeight: 600, fontSize: 16 }}>
                        {group.address}
                      </span>
                      <Badge
                        count={group.owners_count}
                        style={{ backgroundColor: "#52c41a" }}
                        title="Количество собственников"
                      />
                      {group.house_number && group.house_number !== "—" && (
                        <Tag color="blue">Дом №{group.house_number}</Tag>
                      )}
                    </Space>
                  }
                  extra={
                    <Button
                      type="link"
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {group.owners_count}{" "}
                      {group.owners_count === 1
                        ? "собственник"
                        : group.owners_count < 5
                          ? "собственника"
                          : "собственников"}
                    </Button>
                  }
                >
                  <Row gutter={[16, 16]}>
                    {group.owners.map((owner: any, ownerIdx: number) => (
                      <Col
                        xs={24}
                        sm={24}
                        md={12}
                        lg={8}
                        xl={6}
                        key={owner._id || ownerIdx}
                      >
                        <Card
                          size="small"
                          hoverable
                          style={{ height: "100%", cursor: "pointer" }}
                          bodyStyle={{ padding: 16 }}
                          onClick={() =>
                            showOwnerDetails(owner._id || owner.id)
                          }
                        >
                          <Space
                            direction="vertical"
                            size="small"
                            style={{ width: "100%" }}
                          >
                            {/* ФИО / Наименование */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                              }}
                            >
                              <UserOutlined
                                style={{
                                  marginRight: 8,
                                  marginTop: 4,
                                  color: "#1890ff",
                                }}
                              />
                              <strong style={{ fontSize: 15, flex: 1 }}>
                                {getOwnerField(owner, "ФИО") !== "—"
                                  ? getOwnerField(owner, "ФИО")
                                  : getOwnerField(owner, "Наименование")}
                              </strong>
                            </div>

                            {/* Тип собственника */}
                            {owner["Вид собственности"] && (
                              <Tag color="purple" style={{ marginLeft: 24 }}>
                                {owner["Вид собственности"]}
                              </Tag>
                            )}

                            {/* Доля */}
                            {owner["Доля"] && (
                              <div style={{ marginLeft: 24 }}>
                                <PercentageOutlined
                                  style={{ marginRight: 6 }}
                                />
                                <span>Доля: {owner["Доля"]}</span>
                              </div>
                            )}

                            {/* Телефон */}
                            {owner["Телефон"] && (
                              <div style={{ marginLeft: 24 }}>
                                <PhoneOutlined style={{ marginRight: 6 }} />
                                <span>{owner["Телефон"]}</span>
                              </div>
                            )}

                            {/* Email */}
                            {owner["Email"] && (
                              <div style={{ marginLeft: 24 }}>
                                <MailOutlined style={{ marginRight: 6 }} />
                                <span style={{ fontSize: 12 }}>
                                  {owner["Email"]}
                                </span>
                              </div>
                            )}

                            {/* ИНН (для юрлиц) */}
                            {owner["ИНН"] && (
                              <div
                                style={{
                                  marginLeft: 24,
                                  fontSize: 12,
                                  color: "#8c8c8c",
                                }}
                              >
                                ИНН: {owner["ИНН"]}
                              </div>
                            )}

                            {/* Площадь */}
                            {owner["Общая S (м2)"] && (
                              <div style={{ marginLeft: 24, fontSize: 12 }}>
                                Площадь: {owner["Общая S (м2)"]} м²
                              </div>
                            )}

                            {/* № квартиры */}
                            {owner["№ квартиры"] && (
                              <div style={{ marginLeft: 24, fontSize: 12 }}>
                                Квартира: {owner["№ квартиры"]}
                              </div>
                            )}
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Collapse.Panel>
              ))}
            </Collapse>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredData.length}
                showSizeChanger
                showQuickJumper
                showTotal={(t) =>
                  `Всего ${t} адресов, ${stats.totalOwners} собственников`
                }
                pageSizeOptions={["12", "24", "48", "96"]}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps || 24);
                  setExpandedKeys([]); // Сворачиваем при смене страницы
                }}
              />
            </div>
          </>
        ) : (
          <Empty description="Нет данных" style={{ marginTop: 48 }} />
        )}
      </Spin>
      <OwnerModal
        visible={modalVisible}
        ownerId={selectedOwnerId}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};
