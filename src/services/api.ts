import { Post, Comment } from '../contexts/BlogContext';

// Type for authentication responses
interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
  };
  token: string;
}

// API class to handle all requests
class Api {
  private baseUrl: string;
  private token: string | null = null;
  private useLocalStorage: boolean = true;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    // Try to connect to backend to determine if we should use localStorage fallback
    this.checkBackendConnection();
  }

  private async checkBackendConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        this.useLocalStorage = false;
        console.log('Connected to backend API');
      } else {
        this.useLocalStorage = true;
        console.log('Backend unavailable, using localStorage fallback');
      }
    } catch (error) {
      this.useLocalStorage = true;
      console.log('Backend unavailable, using localStorage fallback');
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthResponse> {
    if (this.useLocalStorage) {
      return this.loginLocal(email, password);
    }

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    if (this.useLocalStorage) {
      return this.registerLocal(username, email, password);
    }

    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  }

  async updateProfile(data: any) {
    if (this.useLocalStorage) {
      return this.updateProfileLocal(data);
    }

    const response = await fetch(`${this.baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  }

  // Post methods
  async getPosts(): Promise<Post[]> {
    if (this.useLocalStorage) {
      return this.getPostsLocal();
    }

    const response = await fetch(`${this.baseUrl}/posts`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    
    return response.json();
  }

  async getPostById(id: string): Promise<Post> {
    if (this.useLocalStorage) {
      return this.getPostByIdLocal(id);
    }

    const response = await fetch(`${this.baseUrl}/posts/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch post with id ${id}`);
    }
    
    return response.json();
  }

  async createPost(postData: Partial<Post>): Promise<Post> {
    if (this.useLocalStorage) {
      return this.createPostLocal(postData);
    }

    const response = await fetch(`${this.baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create post');
    }
    
    return response.json();
  }

  async updatePost(id: string, postData: Partial<Post>): Promise<Post> {
    if (this.useLocalStorage) {
      return this.updatePostLocal(id, postData);
    }

    const response = await fetch(`${this.baseUrl}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(postData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update post with id ${id}`);
    }
    
    return response.json();
  }

  async deletePost(id: string): Promise<void> {
    if (this.useLocalStorage) {
      return this.deletePostLocal(id);
    }

    const response = await fetch(`${this.baseUrl}/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete post with id ${id}`);
    }
  }

  async addComment(postId: string, content: string): Promise<Comment> {
    if (this.useLocalStorage) {
      return this.addCommentLocal(postId, content);
    }

    const response = await fetch(`${this.baseUrl}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add comment to post with id ${postId}`);
    }
    
    return response.json();
  }

  async toggleLike(postId: string): Promise<void> {
    if (this.useLocalStorage) {
      return this.toggleLikeLocal(postId);
    }

    const response = await fetch(`${this.baseUrl}/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to toggle like for post with id ${postId}`);
    }
  }

  // Local storage fallback methods
  private loginLocal(email: string, password: string): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (!user) {
        reject(new Error('Invalid email or password'));
        return;
      }
      
      const { password: _, ...userWithoutPassword } = user;
      const token = `mock-jwt-token-${Date.now()}`;
      
      resolve({
        user: userWithoutPassword,
        token
      });
    });
  }

  private registerLocal(username: string, email: string, password: string): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (users.some((u: any) => u.email === email)) {
        reject(new Error('Email already in use'));
        return;
      }
      
      if (users.some((u: any) => u.username === username)) {
        reject(new Error('Username already taken'));
        return;
      }
      
      const newUser = {
        id: crypto.randomUUID(),
        username,
        email,
        password,
        bio: '',
        avatar: `https://ui-avatars.com/api/?name=${username}&background=random`
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      const { password: _, ...userWithoutPassword } = newUser;
      const token = `mock-jwt-token-${Date.now()}`;
      
      resolve({
        user: userWithoutPassword,
        token
      });
    });
  }

  private updateProfileLocal(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const currentUserStr = localStorage.getItem('user');
        if (!currentUserStr) {
          reject(new Error('User not found'));
          return;
        }
        
        const currentUser = JSON.parse(currentUserStr);
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
        if (userIndex === -1) {
          reject(new Error('User not found'));
          return;
        }
        
        // Update user in users array
        users[userIndex] = { ...users[userIndex], ...data };
        localStorage.setItem('users', JSON.stringify(users));
        
        // Return updated user data without password
        const { password: _, ...updatedUser } = users[userIndex];
        resolve(updatedUser);
      } catch (error) {
        reject(error);
      }
    });
  }

  private getPostsLocal(): Promise<Post[]> {
    return new Promise((resolve) => {
      const posts = JSON.parse(localStorage.getItem('posts') || '[]');
      resolve(posts);
    });
  }

  private getPostByIdLocal(id: string): Promise<Post> {
    return new Promise((resolve, reject) => {
      const posts = JSON.parse(localStorage.getItem('posts') || '[]');
      const post = posts.find((p: Post) => p.id === id);
      
      if (!post) {
        reject(new Error(`Post with id ${id} not found`));
        return;
      }
      
      resolve(post);
    });
  }

  private createPostLocal(postData: Partial<Post>): Promise<Post> {
    return new Promise((resolve, reject) => {
      try {
        const currentUserStr = localStorage.getItem('user');
        if (!currentUserStr) {
          reject(new Error('You must be logged in to create a post'));
          return;
        }
        
        const currentUser = JSON.parse(currentUserStr);
        const posts = JSON.parse(localStorage.getItem('posts') || '[]');
        
        const newPost: Post = {
          id: crypto.randomUUID(),
          title: postData.title || 'Untitled',
          content: postData.content || '',
          excerpt: postData.excerpt || postData.content?.substring(0, 150) || '',
          coverImage: postData.coverImage,
          author: {
            id: currentUser.id,
            username: currentUser.username,
            avatar: currentUser.avatar
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: postData.tags || [],
          likes: 0,
          comments: []
        };
        
        posts.unshift(newPost);
        localStorage.setItem('posts', JSON.stringify(posts));
        
        resolve(newPost);
      } catch (error) {
        reject(error);
      }
    });
  }

  private updatePostLocal(id: string, postData: Partial<Post>): Promise<Post> {
    return new Promise((resolve, reject) => {
      try {
        const currentUserStr = localStorage.getItem('user');
        if (!currentUserStr) {
          reject(new Error('You must be logged in to update a post'));
          return;
        }
        
        const currentUser = JSON.parse(currentUserStr);
        const posts = JSON.parse(localStorage.getItem('posts') || '[]');
        
        const postIndex = posts.findIndex((p: Post) => p.id === id);
        if (postIndex === -1) {
          reject(new Error(`Post with id ${id} not found`));
          return;
        }
        
        if (posts[postIndex].author.id !== currentUser.id) {
          reject(new Error('You can only update your own posts'));
          return;
        }
        
        posts[postIndex] = {
          ...posts[postIndex],
          ...postData,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('posts', JSON.stringify(posts));
        
        resolve(posts[postIndex]);
      } catch (error) {
        reject(error);
      }
    });
  }

  private deletePostLocal(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const currentUserStr = localStorage.getItem('user');
        if (!currentUserStr) {
          reject(new Error('You must be logged in to delete a post'));
          return;
        }
        
        const currentUser = JSON.parse(currentUserStr);
        const posts = JSON.parse(localStorage.getItem('posts') || '[]');
        
        const postIndex = posts.findIndex((p: Post) => p.id === id);
        if (postIndex === -1) {
          reject(new Error(`Post with id ${id} not found`));
          return;
        }
        
        if (posts[postIndex].author.id !== currentUser.id) {
          reject(new Error('You can only delete your own posts'));
          return;
        }
        
        posts.splice(postIndex, 1);
        localStorage.setItem('posts', JSON.stringify(posts));
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addCommentLocal(postId: string, content: string): Promise<Comment> {
    return new Promise((resolve, reject) => {
      try {
        const currentUserStr = localStorage.getItem('user');
        if (!currentUserStr) {
          reject(new Error('You must be logged in to comment'));
          return;
        }
        
        const currentUser = JSON.parse(currentUserStr);
        const posts = JSON.parse(localStorage.getItem('posts') || '[]');
        
        const postIndex = posts.findIndex((p: Post) => p.id === postId);
        if (postIndex === -1) {
          reject(new Error(`Post with id ${postId} not found`));
          return;
        }
        
        const newComment: Comment = {
          id: crypto.randomUUID(),
          content,
          author: {
            id: currentUser.id,
            username: currentUser.username,
            avatar: currentUser.avatar
          },
          createdAt: new Date().toISOString()
        };
        
        posts[postIndex].comments.push(newComment);
        localStorage.setItem('posts', JSON.stringify(posts));
        
        resolve(newComment);
      } catch (error) {
        reject(error);
      }
    });
  }

  private toggleLikeLocal(postId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const currentUserStr = localStorage.getItem('user');
        if (!currentUserStr) {
          reject(new Error('You must be logged in to like a post'));
          return;
        }
        
        const posts = JSON.parse(localStorage.getItem('posts') || '[]');
        
        const postIndex = posts.findIndex((p: Post) => p.id === postId);
        if (postIndex === -1) {
          reject(new Error(`Post with id ${postId} not found`));
          return;
        }
        
        // For simplicity, just increment the like count
        // A real implementation would track which users liked the post
        posts[postIndex].likes += 1;
        localStorage.setItem('posts', JSON.stringify(posts));
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const api = new Api();