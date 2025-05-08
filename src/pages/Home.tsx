import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useBlog, Post } from '../contexts/BlogContext';
import PostCard from '../components/PostCard';
import { Bookmark, TrendingUp, Clock, Search, X, Tag } from 'lucide-react';

const Home: React.FC = () => {
  const location = useLocation();
  const { posts, isLoading, fetchPosts } = useBlog();
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [currentTab, setCurrentTab] = useState<'trending' | 'recent' | 'saved'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract search query from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('search');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [location.search]);

  // Filter posts based on search query and selected tag
  useEffect(() => {
    let result = [...posts];
    
    // Filter by search query
    if (searchQuery) {
      result = result.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by tag
    if (selectedTag) {
      result = result.filter(post => 
        post.tags.includes(selectedTag)
      );
    }
    
    // Sort based on current tab
    if (currentTab === 'trending') {
      result = result.sort((a, b) => b.likes - a.likes);
    } else if (currentTab === 'recent') {
      result = result.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (currentTab === 'saved') {
      // For 'saved' tab, we would normally filter saved posts
      // Since we don't have a saved posts feature yet, just use all posts
      result = result;
    }
    
    setFilteredPosts(result);
  }, [posts, searchQuery, selectedTag, currentTab]);

  // Get all unique tags from posts
  const allTags = Array.from(
    new Set(posts.flatMap(post => post.tags))
  );

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
    const params = new URLSearchParams(location.search);
    params.delete('search');
    window.history.replaceState({}, '', `${location.pathname}`);
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Featured post */}
      {posts.length > 0 && !searchQuery && !selectedTag && (
        <section className="mb-12">
          <PostCard post={posts[0]} featured={true} />
        </section>
      )}

      {/* Filter indicators */}
      {(searchQuery || selectedTag) && (
        <div className="mb-8 flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 dark:text-gray-300">Filters:</span>
            {searchQuery && (
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{searchQuery}</span>
              </div>
            )}
            {selectedTag && (
              <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                <Tag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{selectedTag}</span>
              </div>
            )}
          </div>
          <button 
            onClick={clearFilters}
            className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
          >
            <X className="w-4 h-4" />
            <span>Clear filters</span>
          </button>
        </div>
      )}

      {/* Tabs and Tags */}
      <div className="mb-8 flex flex-col md:flex-row justify-between">
        <div className="flex space-x-4 mb-4 md:mb-0 border-b border-gray-200 dark:border-gray-700 pb-2 md:pb-0 md:border-none">
          <button
            onClick={() => setCurrentTab('trending')}
            className={`flex items-center space-x-2 pb-2 ${
              currentTab === 'trending'
                ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Trending</span>
          </button>
          <button
            onClick={() => setCurrentTab('recent')}
            className={`flex items-center space-x-2 pb-2 ${
              currentTab === 'recent'
                ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Recent</span>
          </button>
          <button
            onClick={() => setCurrentTab('saved')}
            className={`flex items-center space-x-2 pb-2 ${
              currentTab === 'saved'
                ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {allTags.slice(0, 6).map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">No posts found</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
            We couldn't find any posts matching your criteria. Try adjusting your search or filters.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;