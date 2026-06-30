import { useState } from 'react'
import axios from "axios";
import { useNavigate } from 'react-router-dom';
console.log("Login Rendered");

function Login() {

    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: '',
        email: '',
        // age:0
        password: ''
    })

    function newUser(e) {
        setUser({ ...user, [e.target.name]: e.target.value })
    }

    async function verifyUser(e) {

        e.preventDefault();

        try {
            const response = await axios.get(
                `http://localhost:5000/api/verifyUser/${user.email}/${user.password}`
            )
            console.log(response.data);

            if (response.data.success) {
                console.log('Navigate to: ');
                
                if (response.data.user.role === "admin") {
                    console.log('Admin');
                    
                   navigate('/admin', { state: { email: user.email } });
                }
                else {
                    console.log('User');
                    
                    navigate('/userProfile', { state: { email: user.email } });
                }

            }


        } catch (err) {
            console.log(err);

        }

    }
    return (
        <main className="register-page">
            <section className="register-shell" aria-labelledby="register-title">
                <button
                    className="login-register-button"
                    type="button"
                    onClick={() => navigate('/register')}
                >
                    Register
                </button>

                <div className="register-intro">
                    <p className="register-eyebrow">Welcome</p>
                    <h1 id="register-title">Login to your account</h1>

                </div>

                <form className="register-form" onSubmit={verifyUser}>


                    <div className="form-field">
                        <label htmlFor="email">Email address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter email"
                            name="email"
                            value={user.email}
                            onChange={(e) => newUser(e)}
                            required
                        />
                    </div>

                    {/* <input type="number" placeholder='Enter age' name='age' onChange={(e)=>newUser(e)}  />
                <br/> */}
                    <div className="form-field">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="Enter password"
                            value={user.password}
                            onChange={(e) => newUser(e)}
                            required
                        />
                    </div>

                    <button className="register-button" type="submit">Login</button>
                </form>
            </section>
        </main>
    )
}

export default Login
