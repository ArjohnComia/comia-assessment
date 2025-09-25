import { useEffect, useState } from "react";
import axios from "axios";

function RevenueReport() {
  const [rows, setRows] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await axios.get("/library/revenue", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRows(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRevenue();
  }, []);

  return (
    <div className="my-6">
      <h3 className="font-bold text-lg mb-2">💰 Revenue Report (This Year)</h3>
      {rows.length > 0 ? (
        <table className="table-auto border-collapse w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Month</th>
              <th className="p-2">Year</th>
              <th className="p-2">Total Fines</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : ""}>
                <td className="p-2">{r.month}</td>
                <td className="p-2">{r.year}</td>
                <td className="p-2">${r.total_fines}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No revenue recorded yet.</p>
      )}
    </div>
  );
}

export default RevenueReport;

