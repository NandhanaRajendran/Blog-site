import { BrowserRouter,Routes,Route } from 'react-router-dom'
import React from 'react'
import Register from './components/Register'
import ViewUsers from './components/ViewUsers'
import Login from './components/Login'
import UserProfile from './components/UserProfile'
import Landing from './components/Landing'
import SingleBlog from './components/SingleBlog'
import AdminProfile from './components/AdminProfile'

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Landing/>} />
          <Route path="/blog/:id" element={<SingleBlog />} />
          <Route path='/register' element={<Register/>} />
          <Route path='/users' element={<ViewUsers/>} />
          <Route path='/login' element={<Login/>} />
          <Route path='/userProfile' element={<UserProfile/>} />
          <Route path='/admin' element={<AdminProfile/>} />
          <Route path='/AdminProfile' element={<AdminProfile/>} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
