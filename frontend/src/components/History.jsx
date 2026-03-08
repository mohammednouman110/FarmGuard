// History Component for AgriGuard AI

import React from "react";
import styles from "../styles";

function History({ t, history }) {
  const downloadReport = (item) => {
    if (!item) return;
    const doc = new jspdf.jsPDF();
    doc.setFillColor(45, 106, 79);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("AgriGuard AI Health Report", 20, 25);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text(`Diagnosis: ${item.disease}`, 20, 60);
    doc.text(`Confidence: ${item.confidence}`, 20, 70);
    doc.text(`Crop: ${item.crop}`, 20, 80);

    if (item.treatment) {
      doc.text("Organic Treatment:", 20, 95);
      const organicLines = doc.splitTextToSize(
        item.treatment.organic || "",
        170
      );
      doc.text(organicLines, 20, 105);

      doc.text("Chemical Treatment:", 20, 130);
      const chemicalLines = doc.splitTextToSize(
        item.treatment.chemical || "",
        170
      );
      doc.text(chemicalLines, 20, 140);
    }

    doc.save(`AgriGuard_${item.disease}.pdf`);
  };

  return (
    <>
      <h3>{t.history}</h3>
      {history.length === 0 && (
        <div style={styles.card}>
          <p style={{ margin: 0, fontSize: 13 }}>
            No scans yet. Try scanning your crop from the Scan tab.
          </p>
        </div>
      )}
      {history.map((item) => (
        <div key={item.id} style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <small style={{ color: "#4b5563" }}>{item.date}</small>
            <span
              style={styles.pill("#16a34a", "#f0fdf4")}
            >{`${item.confidence} Match`}</span>
          </div>
          <h4 style={{ margin: "4px 0" }}>{item.disease}</h4>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
            Crop: {item.crop}
          </p>
          <button
            onClick={() => downloadReport(item)}
            style={{
              background: "none",
              border: "1px solid #2d6a4f",
              color: "#2d6a4f",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              marginTop: 10,
            }}
          >
            Re-download PDF
          </button>
        </div>
      ))}
    </>
  );
}

export default History;

