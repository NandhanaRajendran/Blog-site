const Blog = require("../models/blogSchema");
const multer = require("multer");
const synonyms = require("synonyms");


const createBlog = async (req, res) => {
  try {
    const blog = {
      title: req.body.title,
      category: req.body.category,
      content: req.body.content,
      image: req.file ? req.file.path : "",
      user: req.body.user,
    };
    await Blog.create(blog);

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      content: blog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Blog creation failed",
      err: err.message,
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const blog = {
      title: req.body.title,
      category: req.body.category,
      content: req.body.content,
      image: req.file?.path,
      user: req.body.user,
    };
    console.log(req.params.id);

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blog);
    console.log(updatedBlog);

    res.status(201).json({
      success: true,
      message: "Blog updated successfully",
      content: updatedBlog,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Blog updation failed",
      err: err.message,
    });
  }
};

const viewAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate("user");;
    console.log(blogs);

    res.status(201).json({
      success: true,
      message: "Listing all blogs",
      content: blogs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Blog fetching failed",
      err: err.message,
    });
  }
};




const viewByAuthor = async (req, res) => {
  try {
    console.log('Author id: '+req.params.id);

    const blogs = await Blog.find({ user: req.params.id }).populate("user");;
    console.log(blogs);

    res.status(201).json({
      success: true,
      message: "Listing all blogs of a user",
      content: blogs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error in listing blogs",
      err: err.message,
    });
  }
};

const viewSingleBlog = async (req, res) => {
  try {
    // const blog = await Blog.find({ _id: req.params.id }).populate("user");
    const blog = await Blog.findByIdAndUpdate(
    req.params.id,
    {
        $inc: {
            views: 1
        }
    },
    {
        returnDocument: "after"
    }
).populate("user");
    console.log(blog);

    if (!blog) {
      res.json({
        success: false,
        message: "Blog not found",
      });
    } else {
      res.status(201).json({
        success: true,
        message: "Blog found successfully",
        content: blog,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error: Blog not found",
      err: err.message,
    });
  }
};

const viewByCategory = async (req, res) => {
  try {
    const blogs = await Blog.find({ category: req.params.category }).populate("user");;

    if (blogs == "") {
      res.json({
        success: false,
        message: "No blogs found in this category",
      });
    } else {
      res.status(201).json({
        success: true,
        message: "Blogs are found",
        content: blogs,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error: Blogs not found",
      err: err.message,
    });
  }
};



const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete({ _id: req.params.id });
    console.log('Delete blog action ');
    
    if (!blog) {
      res.json({
        success: false,
        message: "Blog not found",
      });
    } else {
      res.status(201).json({
        success: true,
        message: "Blog deleted successfully",
        content: blog,
      });
    }
  } catch (err) {
    res.status(501).json({
      success: true,
      message: "Blog deletion failed",
      err: err.message,
    });
  }
};




const searchBlog = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      res.json({
        success: false,
        message: "Search query is required",
      });
    }

    console.log(req.query);
    const searchWords = query.toLowerCase().trim().split(/\s+/);

    const allWords = new Set();

    searchWords.forEach((word) => {
      allWords.add(word);

      const synonym = synonyms(word);
      console.log("Word:", word);
      console.log("Synonyms:", synonym);

      if (synonym) {
        //Adjective
        if (synonym.a) {
          synonym.a.forEach((w) => allWords.add(w));
        }

        //Noun
        if (synonym.n) {
          synonym.n.forEach((w) => allWords.add(w));
        }

        //Verbs
        if (synonym.v) {
          synonym.v.forEach((w) => allWords.add(w));
        }

        //Adverb

        if (synonym.r) {
          synonym.r.forEach((w) => allWords.add(w));
        }
      }
    });

    const regexConditions = [];

    allWords.forEach((word) => {
      regexConditions.push(
        {
          title: { $regex: word, $options: "i" },
        },
        {
          content: { $regex: word, $options: "i" },
        },
      );
    });

    const blogs = await Blog.find({
      $or: regexConditions,
    });

    if (blogs.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Search not found",
      });
    } else {
      res.status(201).json({
        success: true,
        message: "Blogs matched",
        total: blogs.length,
        content: blogs,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error: Search failed",
      err: err.message,
    });
  }
};



const incrementLike = async (req, res) => {
    try {

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { $inc: { likeCount: 1 } },
            { returnDocument: 'after' }
         
        );

        if (!updatedBlog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Like updated successfully",
            content: updatedBlog
        });

    } catch (err) {
      console.log(err);

        res.status(500).json({
            success: false,
            message: "Like update failed",
            err: err.message
        });
    }
};


const featureBlog = async(req,res)=> {
    try{
        const isFeatured = req.body.featured;
        
        const updatedFeature = Blog.findByIdAndUpdate(req.params.id,isFeatured);

        res.status(201).json({
            success:true,
            message:'Blog added to featured',
            content: updatedFeature
        })
    } catch(err) {
        res.status(500).json({
            success:false,
            message:'Feature updation failed',
            err:err.message
        })
    }
}


const storage = multer.diskStorage({
  destination: function (req, res, callback) {
    callback(null, "./uploads");
  },
  filename: function (req, file, callback) {
    callback(null, Date.now() + "-" + file.originalname);
  },
});

const uploads = multer({ storage: storage }).single("image");

module.exports = {
  createBlog,
  uploads,
  updateBlog,
  viewSingleBlog,
  deleteBlog,
  viewByCategory,
  searchBlog,
  viewAllBlogs,
  incrementLike,
  featureBlog,
  viewByAuthor,
  
};
