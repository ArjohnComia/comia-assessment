import { useState } from "react";
import axios from "axios";

function DeleteTaskById() {
  const [taskId, setTaskId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const token = localStorage.getItem("token");

  const handleDelete = async () => {
    try {
      const res = await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setMessage(`Task ${taskId} deleted successfully.`);
      } else {
        setMessage("Failed to delete task. Check ID.");
      }
      
    } catch (err) {
      setMessage("Failed to delete task. Check ID.");
      console.error(err);
    }
  };

  return (
    <div className="my-6">
      <h3 className="text-lg font-bold mb-2">Delete Task by ID</h3>
      <input
        type="text"
        className="border p-2 mr-2"
        placeholder="Enter Task ID"
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
      />
      <button
        onClick={handleDelete}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Delete
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}

export default DeleteTaskById;
