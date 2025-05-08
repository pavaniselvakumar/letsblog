import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlog, Post } from '../contexts/BlogContext';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import { Calendar, Mail, Edit, MapPin, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  joinedDate: string;
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { posts } = useBlog();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        // Normally we would fetch from an API, but we'll use the user from context or mock data
        if (currentUser && currentUser.username === username) {
          setProfile({
            id: currentUser.id,
            username: currentUser.username,
            bio: currentUser.bio || 'No bio yet',
            avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.username}&background=random`,
            joinedDate: new Date().toISOString() // Mock data
          });
        } else {
          // Check if we can find the user from post authors
          const author = posts.find(post => post.author.username === username)?.author;
          
          if (author) {
            setProfile({
              id: author.id,
              username: author.username,
              avatar: author.avatar || `https://ui-avatars.com/api/?name=${author.username}&background=random`,
              bio: 'Writer at LETS BLOG', // Mock data
              joinedDate: new Date().toISOString() // Mock data
            });
          } else {
            // Mock user if we can't find them
            setProfile({
              id: crypto.randomUUID(),
              username: username!,
              avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
              bio: 'Writer at LETS BLOG',
              joinedDate: new Date().toISOString()
            });
          }
        }
        
        // Filter posts by this user
        const filteredPosts = posts.filter(post => post.author.username === username);
        setUserPosts(filteredPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (username) {
      fetchUserProfile();
    }
  }, [username, currentUser, posts]);

  const isCurrentUser = currentUser && profile && currentUser.id === profile.id;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-4">Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {error || `User "${username}" not found`}
          </p>
          <Link
            to="/"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="h-48 bg-gradient-to-r from-teal-500 to-blue-500"></div>
          <div className="relative px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col md:flex-row items-center md:items-end">
              <div className="absolute -top-16 ring-4 ring-white dark:ring-gray-800 rounded-full overflow-hidden">
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full"
                />
              </div>
              <div className="mt-16 md:mt-0 md:ml-40 w-full">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 md:mb-0">
                    {profile.username}
                  </h1>
                  
                  {isCurrentUser && (
                    <Link
                      to="/settings/profile"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  )}
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {profile.bio}
                </p>
                
                <div className="flex flex-wrap items-center text-gray-600 dark:text-gray-400 gap-x-6 gap-y-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Joined {format(new Date(profile.joinedDate), 'MMMM yyyy')}</span>
                  </div>
                  
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  {profile.website && (
                    <div className="flex items-center">
                      <LinkIcon className="w-4 h-4 mr-1" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  
                  {isCurrentUser && currentUser?.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      <span>{currentUser.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts by this user */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Posts by {profile.username}
          </h2>
          
          {userPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isCurrentUser
                  ? "You haven't published any posts yet."
                  : `${profile.username} hasn't published any posts yet.`}
              </p>
              
              {isCurrentUser && (
                <Link
                  to="/create"
                  className="inline-block px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg"
                >
                  Write your first post
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;