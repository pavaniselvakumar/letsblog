import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Post } from '../contexts/BlogContext';
import { Heart, MessageCircle, Clock } from 'lucide-react';

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, featured = false }) => {
  const { id, title, excerpt, coverImage, author, createdAt, likes, comments, tags } = post;

  const formattedDate = format(new Date(createdAt), 'MMM d, yyyy');

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.02]">
        <Link to={`/post/${id}`} className="block">
          <div className="relative h-96">
            <img 
              src={coverImage || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
              alt={title}
              className="w-full h-full object-cover brightness-[0.7]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
            
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-xs bg-teal-600/90 text-white px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
                {title}
              </h2>
              
              <p className="text-gray-200 mb-4 line-clamp-2">
                {excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={author.avatar || `https://ui-avatars.com/api/?name=${author.username}&background=random`} 
                    alt={author.username}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                  <span className="text-white">{author.username}</span>
                </div>
                
                <div className="flex items-center space-x-4 text-gray-200">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formattedDate}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{likes}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{comments.length}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-md">
      <Link to={`/post/${id}`} className="block">
        <div className="aspect-w-16 aspect-h-9 overflow-hidden h-48">
          <img 
            src={coverImage || 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        <div className="p-5">
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          
          <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {title}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {excerpt}
          </p>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <img 
                src={author.avatar || `https://ui-avatars.com/api/?name=${author.username}&background=random`}
                alt={author.username}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{author.username}</span>
            </div>
            
            <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400 text-sm">
              <span className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{likes}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{comments.length}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default PostCard;