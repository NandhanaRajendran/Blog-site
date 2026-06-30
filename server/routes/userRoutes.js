const express = require('express');
const router = express.Router();

const {createUser,viewUsers,viewByEmail, deleteByEmail, verifyUser,uploads, findUsers, updateUser} = require('../controllers/userController');
const { createBlog, updateBlog, viewSingleBlog, deleteBlog, viewByCategory, searchBlog, viewAllBlogs, incrementLike, viewByAuthor,  } = require('../controllers/blogController');
const { dashboard, suspendUser, activateUser, viewReportedBlogs } = require('../controllers/adminController');

router.post('/createUser',uploads,createUser);
router.get('/viewUsers',viewUsers);
router.get('/viewByEmail/:email',viewByEmail);
// router.get('/viewByAge/:age',viewByAge);
router.delete('/deleteByEmail/:email',deleteByEmail);
router.get('/verifyUser/:email/:password',verifyUser);
router.put('/updateUser/:id',updateUser)

router.post('/createBlog/',uploads,createBlog);
router.put('/updateBlog/:id', uploads, updateBlog);
router.get('/viewByAuthor/:id',viewByAuthor);
router.get('/viewSingleBlog/:id',viewSingleBlog);
router.delete('/deleteBlog/:id',deleteBlog);
router.get('/viewByCategory/:category',viewByCategory);
router.get('/searchBlog',searchBlog);
router.get('/viewAllBlogs',viewAllBlogs);
router.put('/incrementLike/:id',incrementLike);
router.get('/findUsers/:name',findUsers);


router.get('/admin/dashboard',dashboard)
router.delete("/admin/deleteUser/:email", deleteByEmail);
router.put('/admin/suspendUser/:id',suspendUser);
router.put('/admin/activateUser/:id',activateUser);
router.get('/admin/viewReportedBlogs',viewReportedBlogs)



module.exports = router;
