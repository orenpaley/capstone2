import LobsterApi from "../../API/api";
// import "./Login.css";
import { useNavigate } from "react-router-dom";
import { Button } from "reactstrap";
import "./Login.css";
import { initialValuesClear } from "../Invoice/initialValues";
import { useContext } from "react";
import userContext from "../../userContext";

function SignupForm({ handleChange, user, setUser }) {
  const navigate = useNavigate();
  const [context, setContext] = useContext(userContext);
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    const newUser = await LobsterApi.register(
      e.target.email.value,
      e.target.password.value,
      e.target.name.value,
      e.target.address.value
    );
    const loggedInUser = await LobsterApi.login(
      e.target.email.value,
      e.target.password.value
    );
    localStorage.clear();
    localStorage.setItem("curr", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    LobsterApi.token = newUser;
    // localStorage.setItem("token", LobsterApi.token);
    setContext(loggedInUser);
    navigate("/", { state: initialValuesClear });
    window.location.reload();
  };

  return (
    <form onSubmit={handleSignupSubmit} noValidate className="signup_form">
      <div className="signup_inputs">
        <div className="signup_input">
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            onChange={handleChange}
            required
          />
        </div>

        <div className="signup_input">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            onChange={handleChange}
            required
          />
          <div className="valid-feedback">Looks good!</div>
        </div>

        <div className="signup_input">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            onChange={handleChange}
            required
          />
          <div className="valid-feedback">Looks good!</div>
        </div>

        <div className="signup_input">
          <label htmlFor="address" className="form-label">
            Address
          </label>
          <textarea
            type="text"
            id="address"
            name="address"
            onChange={handleChange}
          />
          <div className="valid-feedback">Looks good!</div>
        </div>
        <div className="signup_input">
          <Button color="info" className="button regis-button">
            Register
          </Button>
        </div>
      </div>
    </form>
  );
}

export default SignupForm;
