import { useEffect } from "react";
import { googleLogin } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function GoogleLoginButton() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response) => {
          try {
            const res = await googleLogin(response.credential);
            login(res.accessToken);
            navigate("/home");
          } catch (err) {
            alert(
              err.response?.data?.message ||
              "Google login failed. Try another method."
            );
          }
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-btn"),
        {
          theme: "outline",
          size: "large",
          width: 260,
        }
      );
    };

    setTimeout(initGoogle, 100);

  }, [login, navigate]);

  return <div id="google-btn"></div>;
}

export default GoogleLoginButton;