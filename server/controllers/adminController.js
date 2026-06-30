const User = require("../models/userSchema");
const Blogs = require("../models/blogSchema");

const dashboard = async (req, res) => {
  const totalUsers = await User.countDocuments();

  const totalBlogs = await Blogs.countDocuments();

  const totalFeaturedBlogs = await Blogs.countDocuments({
    featured: true,
  });

  const totalLikes = await Blogs.aggregate([
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: "$likeCount",
        },
      },
    },
  ]);

  const likesPerBlog = await Blogs.find()
    .populate("user", "name")
    .select("title likeCount");

  const mostLikedBlogs = await Blogs.find()
    .populate("user", "name")
    .sort({ likeCount: -1 })
    .limit(5)
    .select("title likeCount");

  const usersWithBlogCount = await User.aggregate([
    {
      $match: {
        role: "user",
      },
    },
    {
      $lookup: {
        from: "blogs",
        localField: "_id",
        foreignField: "user",
        as: "blogs",
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        role: 1,
        blogCount: { $size: "$blogs" },
      },
    },
  ]);

  res.status(201).json({
    success: true,
    message: "Admin dashboard loaded successfully",
    content: {
      totalUsers,
      totalBlogs,
      totalFeaturedBlogs,
      totalLikes: totalLikes.length > 0 ? totalLikes.length : 0,
      likesPerBlog,
      mostLikedBlogs,
      usersWithBlogCount,
    },
  });
};

const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            status: "suspended",
          },
        },
        {
          returnDocument: "after",
        },
      );

      res.status(201).json({
        success: true,
        message: "User updated successfully",
        content: updatedUser,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "User suspension failed",
      err: err.message,
    });
  }
};

const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            status: "active",
          },
        },
        {
          returnDocument: "after",
        },
      );

      res.status(201).json({
        success: true,
        message: "User updated successfully",
        content: updatedUser,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "User suspension failed",
      err: err.message,
    });
  }
};

const viewReportedBlogs = async(req,res) => {
    try{
        const blogs = await Blogs.find({reported:true});

        res.status(201).json({
            success:true,
            message: 'Reported blogs are found',
            content: blogs
        })
    } catch(err) {
        res.status(500).json({
            success:false,
            message:'Error: Blogs not found',
            err:err.message
        })
    }
}


module.exports = {
  dashboard,
  suspendUser,
  activateUser,
  viewReportedBlogs
};
