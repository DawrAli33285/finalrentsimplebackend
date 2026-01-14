const Listing = require('../models/listing');
const Vendor = require('../models/vendor');
const CommunityPost = require('../models/communitypost');
const {cloudinaryUploadImage}=require('../middleware/cloudinary')


exports.createPost = async (req, res) => {
  try {
    const { type, content, linkedListing } = req.body;
    let id = req?.user?._id ? req?.user?._id : req.user.id;

    if (!type || !content) {
      return res.status(400).json({
        error: 'Please provide type and content'
      });
    }


    let imageData = [];
    
    if (req.files && req.files.length > 0) {
    
      for (const file of req.files) {
        const result = await cloudinaryUploadImage(file.path);
        imageData.push({
          url: result.url,
          publicId: result.public_id
        });
      }
    }

    const post = await CommunityPost.create({
      vendor: id,
      type,
      content,
      linkedListing: linkedListing || undefined,
      images: imageData
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      error: 'Failed to create post',
      details: error.message
    });
  }
};




exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'all' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

  
    let query = { isActive: true };
    
   
    const validTypes = ['announcement', 'tip', 'update', 'promotion'];
    if (filter !== 'all' && validTypes.includes(filter)) {
      query.type = filter;
    }

   
    const totalItems = await CommunityPost.countDocuments(query);
    
    
    const totalPages = Math.ceil(totalItems / limitNum);
    const skip = (pageNum - 1) * limitNum;

   
    const posts = await CommunityPost.find(query)
      .populate('vendor', 'name businessName')
      .populate('linkedListing', 'title pricing images')
      .populate('comments.user', 'name businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

   
    const feedItems = posts.map(p => ({
      ...p,
      itemType: 'post'
    }));

   
    const hasMore = pageNum < totalPages;

    res.status(200).json({
      success: true,
      feedItems,
      currentPage: pageNum,
      totalPages,
      totalItems,
      hasMore
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feed'
    });
  }
};

  exports.getPost = async (req, res) => {
    try {
      const { postId } = req.params;
  
      const post = await CommunityPost.findById(postId)
        .populate('vendor', 'businessName profileImage name')
        .populate('linkedListing', 'title category price images')
        .populate('likes.user', 'businessName profileImage name')
        .populate('comments.user', 'businessName profileImage name');
  
      if (!post) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
  
      res.status(200).json({
        success: true,
        post
      });
  
    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({
        error: 'Failed to fetch post',
        details: error.message
      });
    }
  };


  exports.likePost = async (req, res) => {
    try {
      const { postId } = req.params;
      let userId = req?.user?._id ? req?.user?._id : req.user.id;
  
      const post = await CommunityPost.findById(postId);
  
      if (!post) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
  
     
      const alreadyLiked = post.likes.some(like => like.user.toString() === userId.toString());
  
      if (alreadyLiked) {
        return res.status(400).json({
          error: 'You have already liked this post'
        });
      }
  

      post.likes.push({ user: userId });
      await post.save();
  
      res.status(200).json({
        success: true,
        message: 'Post liked successfully',
        likes: post.engagement.likes
      });
  
    } catch (error) {
      console.error('Like post error:', error);
      res.status(500).json({
        error: 'Failed to like post',
        details: error.message
      });
    }
  };
  
  
  exports.unlikePost = async (req, res) => {
    try {
      const { postId } = req.params;
      let userId = req?.user?._id ? req?.user?._id : req.user.id;
  
      const post = await CommunityPost.findById(postId);
  
      if (!post) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
  
     
      post.likes = post.likes.filter(like => like.user.toString() !== userId.toString());
      await post.save();
  
      res.status(200).json({
        success: true,
        message: 'Post unliked successfully',
        likes: post.engagement.likes
      });
  
    } catch (error) {
      console.error('Unlike post error:', error);
      res.status(500).json({
        error: 'Failed to unlike post',
        details: error.message
      });
    }
  };
  

  exports.createComment = async (req, res) => {
    try {
      const { postId } = req.params;
      const { text } = req.body;
      let userId = req?.user?._id ? req?.user?._id : req.user.id;
  
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          error: 'Comment text is required'
        });
      }
  
      if (text.length > 1000) {
        return res.status(400).json({
          error: 'Comment must be less than 1000 characters'
        });
      }
  
      const post = await CommunityPost.findById(postId);
  
      if (!post) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
  
  
      const comment = {
        user: userId,
        text: text.trim()
      };
  
      post.comments.push(comment);
      await post.save();
  
      
      await post.populate('comments.user', 'businessName profileImage');
  
     
      const newComment = post.comments[post.comments.length - 1];
  
      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment: newComment,
        totalComments: post.engagement.comments
      });
  
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({
        error: 'Failed to add comment',
        details: error.message
      });
    }
  };
  

  exports.getComments = async (req, res) => {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 20 } = req.query;
  
      const post = await CommunityPost.findById(postId)
        .populate('comments.user', 'businessName profileImage')
        .select('comments');
  
      if (!post) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
  
    
      const sortedComments = post.comments.sort((a, b) => b.createdAt - a.createdAt);
  
     
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedComments = sortedComments.slice(startIndex, endIndex);
  
      res.status(200).json({
        success: true,
        comments: paginatedComments,
        total: post.comments.length,
        page: parseInt(page),
        totalPages: Math.ceil(post.comments.length / limit)
      });
  
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        error: 'Failed to fetch comments',
        details: error.message
      });
    }
  };
  

  exports.deleteComment = async (req, res) => {
    try {
      const { postId, commentId } = req.params;
      let userId = req?.user?._id ? req?.user?._id : req.user.id;
  
      const post = await CommunityPost.findById(postId);
  
      if (!post) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
  
      const comment = post.comments.id(commentId);
  
      if (!comment) {
        return res.status(404).json({
          error: 'Comment not found'
        });
      }
  
      
      const isCommentOwner = comment.user.toString() === userId.toString();
      const isPostOwner = post.vendor.toString() === userId.toString();
  
      if (!isCommentOwner && !isPostOwner) {
        return res.status(403).json({
          error: 'You are not authorized to delete this comment'
        });
      }
  
      post.comments.pull(commentId);
      await post.save();
  
      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
        totalComments: post.engagement.comments
      });
  
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        error: 'Failed to delete comment',
        details: error.message
      });
    }
  };


  module.exports.deletePost=async(req,res)=>{
    let {id}=req.params;
    try{
await CommunityPost.findByIdAndDelete(id)

return res.status(200).json({
  message:"Post deleted sucessfully"
})

    }catch(e){
      return res.status(400).json({
        error:"Error occured while trying to delete post"
      })
    }
  }