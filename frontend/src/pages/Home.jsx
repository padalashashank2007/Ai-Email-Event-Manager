import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutApi } from "../services/authService";
import "./Home.css";

function Home() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi(); 
    } catch (err) {
      console.error(err);
    } finally {
      logout();
      navigate("/");
    }
  };

  return (
    <div className="container">
      <div className="card home-card">
        <h2>Home</h2>
        <p>You are logged in 🎉</p>

        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Home;
