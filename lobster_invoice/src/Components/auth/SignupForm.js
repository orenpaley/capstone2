import LobsterApi from "../../API/api";
// import "./Login.css";
import { useNavigate } from "react-router-dom";
import { Button } from "reactstrap";
import "./Login.css";

function SignupForm({ handleChange, user, setUser }) {
  const history = useNavigate();
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const newUser = await LobsterApi.register(
      e.target.email.value,
      e.target.password.value,
      e.target.firstName.value,
      e.target.lastName.value,
      e.target.address
    );
    console.log("user Registered", newUser);
    setUser(newUser);
    localStorage.setItem("curr", JSON.stringify(newUser));
    return;
  };
  return (
    <form
      onSubmit={handleSignupSubmit}
      className="row g-3 needs-validation"
      noValidate
    >
      <div>
        <div className="col-md-4">
          <label htmlFor="firstName" className="form-label">
            First Name
          </label>
          <input
            type="text"
            className="form-control"
            id="firstName"
            onChange={handleChange}
            required
          />
          <div className="valid-feedback">Looks good!</div>
        </div>
        <div className="col-md-4">
          <label htmlFor="lastName" className="form-label">
            Last Name
          </label>
          <input
            type="text"
            className="form-control"
            id="lasttName"
            onChange={handleChange}
            required
          />
          <div className="valid-feedback">Looks good!</div>
        </div>
        <div className="col-md-4">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            onChange={handleChange}
            required
          />
          <div className="valid-feedback">Looks good!</div>
        </div>

        <div className="col-md-4">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            onChange={handleChange}
            required
          />
          <div className="valid-feedback">Looks good!</div>
        </div>

        <div className="col-md-4">
          <label htmlFor="address" className="form-label">
            Address
          </label>
          <input
            type="text"
            className="form-control"
            id="address"
            onChange={handleChange}
            required
          />
          <div className="valid-feedback">Looks good!</div>
        </div>
      </div>
      <Button color="info" className="button">
        Register
      </Button>
    </form>
  );
}

export default SignupForm;
