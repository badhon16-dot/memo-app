
import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { numberToWords } from "./utils";
import * as XLSX from "xlsx";

export default function MemoApp() {
  const [form, setForm] = useState({
    date: "",
    name: "",
    address: "",
    mobile: "",
  });
  const [items, setItems] = useState([]);
  const [memoList, setMemoList] = useState(
    JSON.parse(localStorage.getItem("memos") || "[]")
  );
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const addItem = () => {
    setItems([...items, { description: "", unit: "", rate: "", amount: "" }]);
  };

  const updateItem = (index, key, value) => {
    const newItems = [...items];
    newItems[index][key] = value;
    const unit = parseFloat(newItems[index].unit) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    newItems[index].amount = (unit * rate).toFixed(2);
    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

  useEffect(() => {
    const products = new Set();
    memoList.forEach((memo) => {
      memo.items.forEach((item) => {
        if (item.description) products.add(item.description);
      });
    });
    setProductSuggestions(Array.from(products));
  }, [memoList]);

  useEffect(() => {
    const existing = memoList.find((m) => m.mobile === form.mobile);
    if (existing) {
      setForm((prev) => ({
        ...prev,
        name: existing.name,
        address: existing.address,
      }));
    }
  }, [form.mobile]);

  const saveMemo = () => {
    if (!form.date || !form.name || !form.address || !form.mobile || items.length === 0) {
      alert("Please fill in all fields and add at least one item.");
      return;
    }

    const memo = {
      id: Date.now(),
      ...form,
      items,
      total: totalAmount,
    };
    const updated = [...memoList, memo];
    localStorage.setItem("memos", JSON.stringify(updated));
    setMemoList(updated);
    setForm({ date: "", name: "", address: "", mobile: "" });
    setItems([]);
    setShowPreview(false);
    alert("Memo saved successfully.");
  };

  const exportExcel = () => {
    const data = memoList.map((memo) => ({
      Date: memo.date,
      Name: memo.name,
      Mobile: memo.mobile,
      Address: memo.address,
      Total: memo.total,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Memos");
    XLSX.writeFile(workbook, "All_Memos.xlsx");
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: 20 }}>
      <h2>RAJ TRADERS Cash Memo</h2>
      <input placeholder="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <input placeholder="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
      <br />
      {items.map((item, index) => (
        <div key={index}>
          <input
            list="products"
            placeholder="Description"
            value={item.description}
            onChange={(e) => updateItem(index, "description", e.target.value)}
          />
          <input
            type="number"
            placeholder="Unit"
            value={item.unit}
            onChange={(e) => updateItem(index, "unit", e.target.value)}
          />
          <input
            type="number"
            placeholder="Rate"
            value={item.rate}
            onChange={(e) => updateItem(index, "rate", e.target.value)}
          />
          <input readOnly placeholder="Amount" value={item.amount} />
        </div>
      ))}
      <datalist id="products">
        {productSuggestions.map((p, i) => (
          <option key={i} value={p} />
        ))}
      </datalist>
      <button onClick={addItem}>Add Item</button>
      <p>Total: {totalAmount.toFixed(2)} ({numberToWords(totalAmount)} Taka)</p>
      <button onClick={saveMemo}>Save Memo</button>
      <button onClick={exportExcel}>Export All to Excel</button>
    </div>
  );
}
