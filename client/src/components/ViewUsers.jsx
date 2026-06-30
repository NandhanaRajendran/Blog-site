import axios from 'axios';
import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react'
import { useToast } from './ToastContext';

function ViewUsers() {

  const showToast = useToast();
  const [users, setUser] = useState([]);
  const [email,setEmail] = useState('');
  const [age,setAge] = useState(0);

  useEffect(() => {
    axios.get('http://localhost:5000/api/viewUsers')
      .then((response) => {
        setUser(response.data.message)
        console.log(response.data.message);
        
      }).catch((err) => {
        console.log(err);
        showToast("Unable to load users.");

      })

      

  }, []);

  function filterByEmail() {
    axios.get(`http://localhost:5000/api/viewByEmail/${email}`)
    .then((response)=>{
      setUser([response.data.message]);
      console.log([response.data.message]);
    }) .catch((err) => {
      console.log(err);
      showToast("Unable to find that user.");
      
    })
  }

  // function filterByAge() {

  //   axios.get(`http://localhost:5000/api/viewByAge/${age}`)
  //   .then((response)=> {
  //     setUser(response.data.message);
  //     console.log(response.data.message);
      
  //   }).catch((err)=> {
  //     console.log(err);
      
  //   })

  // }
  
  function deleteByEmail() {
    axios.delete(`http://localhost:5000/api/deleteByEmail/${email}`)
    .then((response)=>{
      setUser(users.filter((user)=>user.email !== email));
      console.log([response.data.message]);
    }) .catch((err) => {
      console.log(err);
      showToast("Unable to delete that user.");
      
    })
  }

  return (

    <div style={{display:'flex',flexDirection:"column"}}>
     
      <div>
        <input type="email" placeholder='Enter email' onChange={(e)=>{setEmail(e.target.value)}} />
        <button onClick={filterByEmail} >Filter by email</button>
        <button onClick={deleteByEmail} >Delete by email</button><br/>
        {/* <input type="number" placeholder='Enter Age' onChange={(e)=>{setAge(e.target.value)}} />
        <button onClick={filterByAge} >Filter by Age</button> */}
      </div>
      <div>


      {
        users.map((user) => {
          return (
            <div key={user._id} style={{width: "30vw",height: "auto",padding: "20px 20px 20px 20px",border:"1px solid blue"}} >
              <p>{user.name}</p>
              <p>{user.email}</p>
              <p>{user.password}</p>
              <p>{user.image}</p>
            </div>
          )
        })
      }
      </div>
    </div>
  )
}

export default ViewUsers
