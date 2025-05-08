import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/letsblog')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true },
  coverImage: { type: String },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  tags: [{ type: String }],
  likes: { type: Number, default: 0 },
  comments: [{
    content: { type: String, required: true },
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Create models
const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${username}&background=random`
    });
    
    await user.save();
    
    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// User routes
app.put('/api/users/profile', authenticate, async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { bio, avatar },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Post routes
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');
    
    const formattedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      author: {
        id: post.author._id,
        username: post.author.username,
        avatar: post.author.avatar
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: post.tags,
      likes: post.likes,
      comments: post.comments.map(comment => ({
        id: comment._id,
        content: comment.content,
        author: {
          id: comment.author._id,
          username: comment.author.username,
          avatar: comment.author.avatar
        },
        createdAt: comment.createdAt
      }))
    }));
    
    res.json(formattedPosts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const formattedPost = {
      id: post._id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      author: {
        id: post.author._id,
        username: post.author.username,
        avatar: post.author.avatar
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: post.tags,
      likes: post.likes,
      comments: post.comments.map(comment => ({
        id: comment._id,
        content: comment.content,
        author: {
          id: comment.author._id,
          username: comment.author.username,
          avatar: comment.author.avatar
        },
        createdAt: comment.createdAt
      }))
    };
    
    res.json(formattedPost);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/posts', authenticate, async (req, res) => {
  try {
    const { title, content, excerpt, coverImage, tags } = req.body;
    
    const post = new Post({
      title,
      content,
      excerpt,
      coverImage,
      author: req.user._id,
      tags
    });
    
    await post.save();
    await post.populate('author', 'username avatar');
    
    const formattedPost = {
      id: post._id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      author: {
        id: post.author._id,
        username: post.author.username,
        avatar: post.author.avatar
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: post.tags,
      likes: post.likes,
      comments: []
    };
    
    res.status(201).json(formattedPost);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/posts/:id', authenticate, async (req, res) => {
  try {
    const { title, content, excerpt, coverImage, tags } = req.body;
    
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    
    post.title = title;
    post.content = content;
    post.excerpt = excerpt;
    post.coverImage = coverImage;
    post.tags = tags;
    
    await post.save();
    await post.populate('author', 'username avatar');
    await post.populate('comments.author', 'username avatar');
    
    const formattedPost = {
      id: post._id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      author: {
        id: post.author._id,
        username: post.author.username,
        avatar: post.author.avatar
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      tags: post.tags,
      likes: post.likes,
      comments: post.comments.map(comment => ({
        id: comment._id,
        content: comment.content,
        author: {
          id: comment.author._id,
          username: comment.author.username,
          avatar: comment.author.avatar
        },
        createdAt: comment.createdAt
      }))
    };
    
    res.json(formattedPost);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/posts/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/posts/:id/comments', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comment = {
      content,
      author: req.user._id
    };
    
    post.comments.push(comment);
    await post.save();
    
    // Get the newly created comment
    const newComment = post.comments[post.comments.length - 1];
    await post.populate(`comments.${post.comments.length - 1}.author`, 'username avatar');
    
    const populatedComment = {
      id: newComment._id,
      content: newComment.content,
      author: {
        id: newComment.author._id,
        username: newComment.author.username,
        avatar: newComment.author.avatar
      },
      createdAt: newComment.createdAt
    };
    
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/posts/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // In a real app, we would check if user already liked the post
    // For simplicity, we just increment the like count
    post.likes += 1;
    await post.save();
    
    res.json({ likes: post.likes });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;