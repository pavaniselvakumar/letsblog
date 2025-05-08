import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  tags: string[];
  likes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

interface BlogContextType {
  posts: Post[];
  isLoading: boolean;
  fetchPosts: () => Promise<void>;
  fetchPostById: (id: string) => Promise<Post>;
  createPost: (postData: Partial<Post>) => Promise<Post>;
  updatePost: (id: string, postData: Partial<Post>) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<Comment>;
  toggleLike: (postId: string) => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const fetchedPosts = await api.getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostById = async (id: string) => {
    try {
      setIsLoading(true);
      const post = await api.getPostById(id);
      return post;
    } catch (error) {
      console.error(`Failed to fetch post with id ${id}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async (postData: Partial<Post>) => {
    try {
      setIsLoading(true);
      const newPost = await api.createPost(postData);
      setPosts(prevPosts => [newPost, ...prevPosts]);
      return newPost;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePost = async (id: string, postData: Partial<Post>) => {
    try {
      setIsLoading(true);
      const updatedPost = await api.updatePost(id, postData);
      setPosts(prevPosts => 
        prevPosts.map(post => post.id === id ? updatedPost : post)
      );
      return updatedPost;
    } catch (error) {
      console.error(`Failed to update post with id ${id}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (id: string) => {
    try {
      setIsLoading(true);
      await api.deletePost(id);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
    } catch (error) {
      console.error(`Failed to delete post with id ${id}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addComment = async (postId: string, content: string) => {
    try {
      if (!user) throw new Error('You must be logged in to comment');
      
      const newComment = await api.addComment(postId, content);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, newComment]
            };
          }
          return post;
        })
      );
      
      return newComment;
    } catch (error) {
      console.error(`Failed to add comment to post with id ${postId}:`, error);
      throw error;
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      if (!user) throw new Error('You must be logged in to like a post');
      
      await api.toggleLike(postId);
      
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likes: post.likes + 1 // This is simplified; a proper implementation would track if user already liked
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error(`Failed to toggle like for post with id ${postId}:`, error);
      throw error;
    }
  };

  return (
    <BlogContext.Provider value={{
      posts,
      isLoading,
      fetchPosts,
      fetchPostById,
      createPost,
      updatePost,
      deletePost,
      addComment,
      toggleLike
    }}>
      {children}
    </BlogContext.Provider>
  );
};