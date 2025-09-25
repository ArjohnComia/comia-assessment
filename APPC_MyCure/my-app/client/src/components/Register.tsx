import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await axios.post("/api/auth/register", { email, password });
      if (res.status === 200) {
        setSuccess("Account created! You can now login.");
      }
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Email already taken");
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-3 rounded">{error}</div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 p-2 mb-3 rounded">
          {success}
        </div>
      )}
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          className="border p-2 mb-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 mb-2 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-500 text-white p-2 w-full rounded"
        >
          Register
        </button>
      </form>
      <p className="mt-2">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600">
          Login
        </Link>
      </p>
    </div>
  );
}

export default Register;
