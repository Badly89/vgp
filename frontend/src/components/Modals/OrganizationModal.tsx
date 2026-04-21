import React from "react";
import { Modal, Card, Descriptions, Space, Tag, Avatar, Collapse } from "antd";
import {
  BankOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  MailOutlined,
  GlobalOutlined,
  IdcardOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

interface OrganizationModalProps {
  open: boolean;
  onClose: () => void;
  organization: any;
  getName: (record: any) => string;
  getAddress: (record: any) => string;
  formatValue: (value: any) => string;
}

export const OrganizationModal: React.FC<OrganizationModalProps> = ({
  open,
  onClose,
  organization,
  getName,
  getAddress,
  formatValue,
}) => {
  if (!organization) return null;

  // Количество сотрудников
  const employeesCount =
    organization["Количество работников"] ||
    (organization["Список граждан Вынгапур"]
      ? Array.isArray(organization["Список граждан Вынгапур"])
        ? organization["Список граждан Вынгапур"].length
        : 1
      : 0);

  return (
    <Modal
      title={
        <Space>
          <div style={{}}>
            <Avatar
              icon={<BankOutlined />}
              style={{ backgroundColor: "#1890ff", marginRight: 14 }}
              size={42}
            />
            <strong style={{ fontSize: 16 }}>{getName(organization)}</strong>
          </div>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Основная информация */}
        <Card title="Основная информация" size="small">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Основные данные">
              <Space size="large" wrap>
                {organization["Вид организации"] && (
                  <Tag
                    color="purple"
                    style={{ fontSize: 14, padding: "4px 12px" }}
                  >
                    {organization["Вид организации"]}
                  </Tag>
                )}
                {employeesCount > 0 && (
                  <Tag
                    color="blue"
                    style={{ fontSize: 14, padding: "4px 12px" }}
                  >
                    <TeamOutlined style={{ marginRight: 6 }} />
                    {employeesCount}{" "}
                    {employeesCount === 1
                      ? "сотрудник"
                      : employeesCount < 5
                        ? "сотрудника"
                        : "сотрудников"}
                  </Tag>
                )}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Реквизиты">
              <Space size="large" wrap>
                {organization["ИНН"] && (
                  <span>
                    <IdcardOutlined style={{ marginRight: 8 }} />
                    ИНН: <strong>{organization["ИНН"]}</strong>
                  </span>
                )}
                {organization["КПП"] && (
                  <span>
                    КПП: <strong>{organization["КПП"]}</strong>
                  </span>
                )}
                {organization["ОГРН"] && (
                  <span>
                    ОГРН: <strong>{organization["ОГРН"]}</strong>
                  </span>
                )}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Контакты">
              <Space direction="vertical" size={6}>
                {organization["Телефон"] && (
                  <span>
                    <PhoneOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    {organization["Телефон"]}
                  </span>
                )}
                {organization["Email"] && (
                  <span>
                    <MailOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    {organization["Email"]}
                  </span>
                )}
                {organization["Сайт"] && (
                  <span>
                    <GlobalOutlined
                      style={{ marginRight: 8, color: "#1890ff" }}
                    />
                    <a
                      href={organization["Сайт"]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {organization["Сайт"]}
                    </a>
                  </span>
                )}
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Адрес">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  backgroundColor: "#f5f5f5",
                  padding: "12px 16px",
                  borderRadius: 8,
                }}
              >
                <EnvironmentOutlined
                  style={{ marginRight: 12, color: "#1890ff", marginTop: 3 }}
                />
                <span style={{ wordBreak: "break-word" }}>
                  {getAddress(organization)}
                </span>
              </div>
            </Descriptions.Item>

            {organization["Юридический адрес"] &&
              organization["Юридический адрес"] !==
                getAddress(organization) && (
                <Descriptions.Item label="Юридический адрес">
                  <HomeOutlined style={{ marginRight: 8 }} />
                  {organization["Юридический адрес"]}
                </Descriptions.Item>
              )}

            {organization["Фактический адрес"] &&
              organization["Фактический адрес"] !==
                getAddress(organization) && (
                <Descriptions.Item label="Фактический адрес">
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  {organization["Фактический адрес"]}
                </Descriptions.Item>
              )}

            {organization["Руководитель"] && (
              <Descriptions.Item label="Руководитель">
                <TeamOutlined style={{ marginRight: 8 }} />
                {organization["Руководитель"]}
              </Descriptions.Item>
            )}

            {organization["Директор"] && !organization["Руководитель"] && (
              <Descriptions.Item label="Директор">
                {organization["Директор"]}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Дополнительная информация */}
        {Object.entries(organization).some(([key, value]) => {
          const usedKeys = [
            "_id",
            "Наименование учреждения",
            "Наименование",
            "Название",
            "Организация",
            "Вид организации",
            "Тип организации",
            "Количество работников",
            "Список граждан Вынгапур",
            "ИНН",
            "КПП",
            "ОГРН",
            "Телефон",
            "Email",
            "Сайт",
            "Адрес",
            "Юридический адрес",
            "Фактический адрес",
            "Руководитель",
            "Директор",
          ];
          return !usedKeys.includes(key) && !key.startsWith("_") && value;
        }) && (
          <Collapse
            defaultActiveKey={[]}
            style={{ backgroundColor: "#fff" }}
            items={[
              {
                key: "other",
                label: (
                  <Space>
                    <FileTextOutlined style={{ color: "#8c8c8c" }} />
                    <span style={{ fontWeight: 500 }}>
                      Дополнительная информация
                    </span>
                  </Space>
                ),
                children: (
                  <Descriptions column={1} size="small" bordered>
                    {Object.entries(organization).map(([key, value]) => {
                      const usedKeys = [
                        "_id",
                        "Наименование учреждения",
                        "Наименование",
                        "Название",
                        "Организация",
                        "Вид организации",
                        "Тип организации",
                        "Количество работников",
                        "Список граждан Вынгапур",
                        "ИНН",
                        "КПП",
                        "ОГРН",
                        "Телефон",
                        "Email",
                        "Сайт",
                        "Адрес",
                        "Юридический адрес",
                        "Фактический адрес",
                        "Руководитель",
                        "Директор",
                      ];
                      if (
                        usedKeys.includes(key) ||
                        key.startsWith("_") ||
                        !value
                      )
                        return null;

                      return (
                        <Descriptions.Item key={key} label={key}>
                          {formatValue(value)}
                        </Descriptions.Item>
                      );
                    })}
                  </Descriptions>
                ),
              },
            ]}
          />
        )}
      </Space>
    </Modal>
  );
};
