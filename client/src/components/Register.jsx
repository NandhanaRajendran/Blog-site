import React from 'react'
import { useState } from 'react'
import axios from "axios";
console.log("Register Rendered");

function Register() {

    const [user,setUser] = useState({
        name:'',
        email:'',
        // age:0
        password:''
    })

    function newUser(e) {
        setUser({...user,[e.target.name]:e.target.value})
    }

    async function createUser(e) {

        e.preventDefault();
        
        try{
            const response = await axios.post(
                'http://localhost:5000/api/createUser',user
            )
            console.log(response.data);
            
        } catch (err) {
            console.log(err);
            
        }
        
    }
    return (
        <main className="register-page">
            <section className="register-shell" aria-labelledby="register-title">
                <div className="register-intro">
                    <p className="register-eyebrow">Welcome</p>
                    <h1 id="register-title">Create your account</h1>
                    <p>Sign up with your details to get started.</p>
                </div>

                <form className="register-form" onSubmit={createUser}>
                    <div className="form-field">
                        <label htmlFor="name">Full name</label>
                        <input
                            type="text"
                            id="name"
                            placeholder="Enter name"
                            name="name"
                            value={user.name}
                            onChange={(e) => newUser(e)}
                            required
                        />
                    </div>

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
                            placeholder="Create a password"
                            value={user.password}
                            onChange={(e) => newUser(e)}
                            required
                        />
                    </div>

                    <button className="register-button" type="submit">Create user</button>
                </form>
            </section>
        </main>
    )
}

export default Register
