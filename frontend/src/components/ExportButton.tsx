import React, { useState } from "react";
import { Button, Dropdown, message } from "antd";
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";
import { ExportModal } from "./ExportModal";

interface ExportButtonProps {
  data: any[];
  title: string;
  filename: string;
  columns?: { key: string; label: string }[];
  disabled?: boolean;
  size?: "small" | "middle" | "large";
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  title,
  filename,
  columns,
  disabled,
  size,
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState("");

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      message.warning("Нет данных для экспорта");
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setExportMessage("Подготовка CSV...");

    try {
      // Имитируем прогресс
      setExportProgress(30);
      setTimeout(() => {
        setExportProgress(70);
        setExportMessage("Сохранение файла...");

        exportToCSV(
          data,
          filename,
          columns?.map((c) => c.key),
        );

        setExportProgress(100);
        setExportMessage("Готово!");

        setTimeout(() => {
          setExporting(false);
          setExportProgress(0);
          message.success(`CSV экспортирован: ${data.length} записей`);
        }, 500);
      }, 200);
    } catch (error) {
      setExporting(false);
      message.error("Ошибка экспорта CSV");
    }
  };

  const handleExportPDF = async () => {
    if (!data || data.length === 0) {
      message.warning("Нет данных для экспорта");
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setExportMessage("Подготовка данных...");

    try {
      // Прогресс: подготовка
      setExportProgress(10);
      await new Promise((resolve) => setTimeout(resolve, 100));

      setExportProgress(25);
      setExportMessage("Создание таблицы...");
      await new Promise((resolve) => setTimeout(resolve, 100));

      setExportProgress(50);
      setExportMessage("Рендеринг страниц...");

      // Запускаем экспорт
      await exportToPDF(
        data,
        title,
        filename,
        columns,
        // Колбэк для обновления прогресса
        (progress: number, msg: string) => {
          setExportProgress(50 + Math.round(progress * 0.45));
          setExportMessage(msg);
        },
      );

      setExportProgress(95);
      setExportMessage("Сохранение файла...");
      await new Promise((resolve) => setTimeout(resolve, 300));

      setExportProgress(100);
      setExportMessage("Готово!");

      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        setExportMessage("");
        message.success(`PDF экспортирован: ${data.length} записей`);
      }, 500);
    } catch (error) {
      setExporting(false);
      setExportProgress(0);
      message.error("Ошибка экспорта PDF");
    }
  };

  const menuItems = [
    {
      key: "csv",
      icon: <FileExcelOutlined />,
      label: "Экспорт в CSV",
      onClick: handleExportCSV,
    },
    {
      key: "pdf",
      icon: <FilePdfOutlined />,
      label: "Экспорт в PDF",
      onClick: handleExportPDF,
    },
  ];

  return (
    <>
      <Dropdown menu={{ items: menuItems }} disabled={disabled}>
        <Button icon={<DownloadOutlined />} size={size || "small"}>
          Экспорт
        </Button>
      </Dropdown>

      <ExportModal
        visible={exporting}
        progress={exportProgress}
        message={exportMessage}
      />
    </>
  );
};
