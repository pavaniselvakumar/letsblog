import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useBlog, Post } from '../contexts/BlogContext';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share, Edit, Trash2, AlertTriangle } from 'lucide-react';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchPostById, deletePost, addComment, toggleLike, isLoading } = useBlog();
  const { user, isAuthenticated } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const getPost = async () => {
      if (!id) return;
      
      try {
        const fetchedPost = await fetchPostById(id);
        setPost(fetchedPost);
        // In a real app, we would check if the user has liked this post
        setIsLiked(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
      }
    };
    
    getPost();
  }, [id, fetchPostById]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/post/${id}` } });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await addComment(id!, comment);
      setComment('');
      
      // Refresh post to get updated comments
      const updatedPost = await fetchPostById(id!);
      setPost(updatedPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnUrl: `/post/${id}` } });
      return;
    }
    
    try {
      await toggleLike(id!);
      setIsLiked(true);
      
      // Update post with incremented like count
      if (post) {
        setPost({
          ...post,
          likes: post.likes + 1
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like post');
    }
  };

  const handleDeletePost = async () => {
    try {
      await deletePost(id!);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  if (isLoading && !post) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Post</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Post Not Found</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = user && post.author.id === user.id;
  const formattedDate = format(new Date(post.createdAt), 'MMMM d, yyyy');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cover image */}
      {post.coverImage && (
        <div className="relative w-full h-96 mb-8 rounded-xl overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Title and metadata */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <img
                src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}&background=random`}
                alt={post.author.username}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <Link 
                  to={`/profile/${post.author.username}`}
                  className="text-gray-900 dark:text-white font-medium hover:text-teal-600 dark:hover:text-teal-400"
                >
                  {post.author.username}
                </Link>
                <p className="text-sm">{formattedDate}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <Link 
                  key={index}
                  to={`/?tag=${tag}`}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none mb-10">
          {post.content.split('\n').map((paragraph, index) => (
            paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-8">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 ${
                isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
              <span>{post.likes}</span>
            </button>
            <button
              onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments.length}</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
              <Share className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>

          {isAuthor && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/edit/${post.id}`}
                className="flex items-center space-x-1 text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
              >
                <Edit className="w-5 h-5" />
                <span>Edit</span>
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Comments section */}
        <div id="comments" className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Comments ({post.comments.length})
          </h3>

          {/* Comment form */}
          <form onSubmit={handleAddComment} className="mb-8">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isAuthenticated ? "Write a comment..." : "Log in to comment"}
              disabled={!isAuthenticated || isSubmitting}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
              rows={3}
            ></textarea>
            
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!isAuthenticated || isSubmitting || !comment.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          {/* Comments list */}
          <div className="space-y-6">
            {post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <img
                      src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.username}&background=random`}
                      alt={comment.author.username}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <div>
                      <Link 
                        to={`/profile/${comment.author.username}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400"
                      >
                        {comment.author.username}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Delete Post
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;