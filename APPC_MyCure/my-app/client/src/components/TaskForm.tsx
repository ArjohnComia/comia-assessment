import { useState, useEffect } from "react";
import axios from "axios";

function TaskForm({ type }: { type: "create" | "update" }) {
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    status: "",
    priority: "",
    due_date: "",
  });
  const [result, setResult] = useState<any[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = localStorage.getItem("token");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(false);
    setResult([]);

    try {
      let res;
      if (type === "create") {
        res = await axios.post(
          "/api/tasks",
          {
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date
              ? new Date(formData.due_date).toISOString().split("T")[0]
              : undefined,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        res = await axios.put(
          `/api/tasks/${formData.id}`,
          {
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date
              ? new Date(formData.due_date).toISOString().split("T")[0]
              : undefined,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setResult([res.data.task]);
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setIsSuccess(true);
      setResult([]);
    }
  };

  return (
    <div className="h-11/12 my-6">
      <h3 className="font-bold text-lg place-self-center mb-3">
        {type === "update" ? "Update" : "Create New"} Task
      </h3>

      <form className="place-self-center" onSubmit={handleSubmit}>
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
          <legend className="fieldset-legend">Task details</legend>

          {type === "update" && (
            <>
              <label className="label">ID</label>
              <input
                type="text"
                className="input validator"
                pattern="[0-9]+"
                name="id"
                required
                placeholder="Input task ID (number)"
                onChange={handleChange}
              />
            </>
          )}

          <label className="label">Title</label>
          <input
            type="text"
            name="title"
            className="input validator"
            required
            onChange={handleChange}
          />

          <label className="label">Description</label>
          <textarea
            name="description"
            className="textarea h-24 validator"
            required
            onChange={handleChange}
          ></textarea>

          <label className="label">Status</label>
          <select
            name="status"
            className="select validator"
            required
            onChange={handleChange}
          >
            <option disabled selected value="">
              Pick status
            </option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <label className="label">Priority</label>
          <select
            name="priority"
            className="select validator"
            required
            onChange={handleChange}
          >
            <option disabled selected value="">
              Pick priority
            </option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <label className="label">Due Date (Optional)</label>
          <input
            type="date"
            name="due_date"
            className="input validator"
            min={new Date().toISOString().split("T")[0]}
            onChange={handleChange}
          />

          <button type="submit" className="btn btn-neutral mt-4">
            Submit
          </button>
        </fieldset>
      </form>

      {isSuccess && (
        <>
          {result.length === 0 && type === "update" ? (
            <div className="place-self-center my-8">
              <h2>Task with ID {formData.id} not found.</h2>
            </div>
          ) : null}

          {result.length !== 0 && (
            <div className="overflow-x-auto mt-6">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date Created</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {result.map((task, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : ""}>
                      <td>{task.id}</td>
                      <td>{task.title}</td>
                      <td>{task.description}</td>
                      <td>{task.priority}</td>
                      <td>{task.status}</td>
                      <td>{new Date(task.created_at).toDateString()}</td>
                      <td>
                        {task.due_date
                          ? new Date(task.due_date).toDateString()
                          : "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TaskForm;
