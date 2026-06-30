const User = require("../models/userSchema");
const multer = require("multer");

const createUser = async (req, res) => {
  try {
    console.log(req.body);
    
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      // image: req.file.path,
    };

    console.log(user);
    
    await User.create(user);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    // console.log(err);
    // console.log(err.message);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const viewUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(201).json({
      success: true,
      message: users,
    });
  } catch (err) {
    console.log(err);
    console.log(err.message);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const viewByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });

    if (!user) {
      res.json({
        message: "User not found",
      });
    } else {
      res.status(201).json({
        success: true,
        message: user,
      });
    }
  } catch (err) {
    console.log(err);
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const findUsers = async (req, res) => {
  try {
    const users = await User.find({ name: req.params.name });
    console.log(users);

    if (!users) {
      res.json({
        success: false,
        message: "User name not found",
      });
    } else {
      res.status(201).json({
        success: true,
        message: "Users found successfully",
        content: users,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error: users not found",
      err: err.message,
    });
  }
};

// const viewByAge = async(req,res) => {

//     try {
//         const users = await User.find({age:req.params.age});

//         res.status(201).json({
//             success:true,
//             message:users
//         })
//     } catch(err) {

//         console.log(err);
//         console.log(err.message);

//         res.status(500).json({
//             success:false,
//             err:err.message
//         })
//     }
// }

const updateUser = async (req, res) => {
    try {

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            },
            {
                returnDocument: "after"
            }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: "Profile update failed",
            err: err.message
        });

    }
};
const deleteByEmail = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ email: req.params.email });

    res.status(201).json({
      success: true,
      message: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      err: err.message,
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });

    if (!user) {
      res.json({
        message: "User not found",
      });
    } else {
      if (user.password == req.params.password) {
        res.status(201).json({
          success: true,
          message: "Login successfull",
          user: user,
        });
      } else {
        res.json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }
  } catch (err) {
    console.log(err);
    console.log(err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const storage = multer.diskStorage({
  destination: function (req, res, callback) {
    callback(null, "./uploads");
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

const uploads = multer({ storage: storage }).single("image");

module.exports = {
  createUser,
  viewUsers,
  viewByEmail,
  deleteByEmail,
  verifyUser,
  uploads,
  findUsers,
  updateUser
};
