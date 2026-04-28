import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Форматирование значения для экспорта
const formatExportValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Да" : "Нет";
  if (Array.isArray(value)) {
    // Для льготных категорий и других массивов
    return value
      .map((v) => {
        if (typeof v === "string") return v.replace(/^\[?"?|"?\]?$/g, "");
        if (typeof v === "object") return v.display_value || JSON.stringify(v);
        return String(v);
      })
      .join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

// Экспорт в CSV
export const exportToCSV = (
  data: any[],
  filename: string,
  columns?: string[],
) => {
  if (!data || data.length === 0) {
    console.warn("Нет данных для экспорта");
    return;
  }

  const keys =
    columns || Object.keys(data[0]).filter((k) => !k.startsWith("_"));
  const BOM = "\uFEFF";
  let csv = BOM + keys.join(";") + "\n";

  data.forEach((row) => {
    const values = keys.map((key) => {
      const value = formatExportValue(row[key]);
      const escaped = value.replace(/"/g, '""');
      if (
        escaped.includes(";") ||
        escaped.includes('"') ||
        escaped.includes("\n")
      ) {
        return `"${escaped}"`;
      }
      return escaped;
    });
    csv += values.join(";") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
};

// Экспорт в PDF через html2canvas
export const exportToPDF = async (
  data: any[],
  title: string,
  filename: string,
  columns?: { key: string; label: string }[],
  onProgress?: (progress: number, message: string) => void,
) => {
  if (!data || data.length === 0) {
    console.warn("Нет данных для экспорта");
    return;
  }

  const cols =
    columns ||
    Object.keys(data[0])
      .filter((k) => !k.startsWith("_"))
      .slice(0, 10)
      .map((k) => ({ key: k, label: k }));

  // Прогресс: создание HTML
  if (onProgress) onProgress(0.1, "Формирование таблицы...");

  // Создаем HTML таблицу (с ограничением строк для производительности)
  const maxRows = Math.min(data.length, 5000);
  const displayData = data.slice(0, maxRows);

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
      <h2 style="color: #333; margin-bottom: 5px;">${title}</h2>
      <p style="color: #666; margin: 5px 0;">Дата экспорта: ${new Date().toLocaleString("ru-RU")}</p>
      <p style="color: #666; margin: 5px 0;">Количество записей: ${displayData.length}</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px;">
        <thead>
          <tr style="background: #1890ff; color: white;">
            ${cols.map((col) => `<th style="padding: 6px 10px; border: 1px solid #ddd; text-align: left;">${col.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${displayData
            .map(
              (row, index) => `
            <tr style="background: ${index % 2 === 0 ? "#fff" : "#f5f5f5"};">
              ${cols.map((col) => `<td style="padding: 4px 10px; border: 1px solid #ddd;">${formatExportValue(row[col.key])}</td>`).join("")}
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  if (onProgress) onProgress(0.3, "Рендеринг HTML...");

  const tempDiv = document.createElement("div");
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "0";
  tempDiv.style.width = "1200px";
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  try {
    if (onProgress) onProgress(0.5, "Создание изображения...");

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    if (onProgress) onProgress(0.7, "Сохранение PDF...");

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF("landscape", "mm", "a4");
    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    const pageHeight = 190;

    doc.addImage(imgData, "PNG", 10, position + 10, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = position - pageHeight;
      doc.addPage();
      doc.addImage(imgData, "PNG", 10, position + 10, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    if (onProgress) onProgress(0.9, "Завершение...");

    doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);

    if (onProgress) onProgress(1, "Готово!");
  } catch (error) {
    console.error("Ошибка создания PDF:", error);
    throw error;
  } finally {
    document.body.removeChild(tempDiv);
  }
};
