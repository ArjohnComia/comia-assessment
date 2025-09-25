import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import TaskForm from "./TaskForm";
import SearchTaskById from "./SearchTaskById";
import DeleteTaskById from "./DeleteTaskById";

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

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    sort: "",
    search: "",
  });
  const [page, setPage] = useState(1);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTasks();
  }, [filters, page]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...filters, page },
      });
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    setPage(1);
    fetchTasks();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Tasks</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <p className="py-2">Sort By: </p>

        <select
          className="select border p-2"
          name="priority"
          onChange={handleChange}
        >
          <option value="">Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          className="select border p-2"
          name="status"
          onChange={handleChange}
        >
          <option value="">Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="select border p-2"
          name="sort"
          onChange={handleChange}
        >
          <option value="">Date</option>
          <option value="date_created">Date Created</option>
          <option value="due_date">Due Date</option>
        </select>

        <input
          type="text"
          className="border p-2"
          name="search"
          placeholder="Search title/description"
          onChange={handleChange}
        />

        <button
          className="bg-gray-800 text-white px-4 py-2 rounded"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>

      {tasks.length !== 0 ? (
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">ID</th>
                <th className="p-2">Title</th>
                <th className="p-2">Description</th>
                <th className="p-2">Priority</th>
                <th className="p-2">Status</th>
                <th className="p-2">Date Created</th>
                <th className="p-2">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : ""}>
                  <td className="p-2">{task.id}</td>
                  <td className="p-2">{task.title}</td>
                  <td className="p-2">{task.description}</td>
                  <td className="p-2">{task.priority}</td>
                  <td className="p-2">{task.status}</td>
                  <td className="p-2">
                    {new Date(task.created_at).toDateString()}
                  </td>
                  <td className="p-2">
                    {task.due_date
                      ? new Date(task.due_date).toDateString()
                      : "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="my-8">
          <h2>No Tasks Found</h2>
        </div>
      )}

      <div className="flex gap-4 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          className="px-3 py-1 bg-gray-500 text-white rounded"
        >
          Next
        </button>
      </div>
      <SearchTaskById />
      <DeleteTaskById />
      <TaskForm type="create"/>
      <TaskForm type="update"/>
    </div>
  );
}

export default Tasks;
