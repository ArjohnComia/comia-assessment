import { useState } from "react";
import axios from "axios";
function SearchTaskById() {
  type Task = {
    id: string;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "completed";
    priority: "low" | "medium" | "high";
    created_at: Date;
    updated_at: Date;
    due_date?: Date;
  };
  const [taskId, setTaskId] = useState("");
  const [task, setTask] = useState<Task | null>(null);
  const token = localStorage.getItem("token");

  const handleSearch = async () => {
    try {
      const res = await axios.get(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTask(res.data.task);
    } catch (err) {
      setTask(null);
      console.error(err);
    }
  };

  return (
    <div className="my-6">
      <h3 className="text-lg font-bold mb-2">Search Task by ID</h3>
      <input
        type="text"
        className="border p-2 mr-2"
        placeholder="Enter Task ID"
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
      />
      <button
        onClick={handleSearch}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Search
      </button>

      {task ? (
        <div className="mt-4 border p-4 rounded bg-gray-50">
          <p>
            <strong>ID:</strong> {task.id}
          </p>
          <p>
            <strong>Title:</strong> {task.title}
          </p>
          <p>
            <strong>Description:</strong> {task.description}
          </p>
          <p>
            <strong>Status:</strong> {task.status}
          </p>
          <p>
            <strong>Priority:</strong> {task.priority}
          </p>
          <p>
            <strong>Due Date:</strong>
            {task.due_date ? new Date(task.due_date).toDateString() : "None"}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm">Task Not Found</p>
      )}
    </div>
  );
}

export default SearchTaskById;
