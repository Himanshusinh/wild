import { useState } from 'react'
import HomePage from './components/HomePage'
import BlogSection from './components/BlogSection'
import BlogPostDetail from './components/BlogPostDetail'
import CTASection from './components/CTASection'
import { blogPosts } from './data/blogPosts'

function App() {
  const [selectedPost, setSelectedPost] = useState(null)

  // If a post is selected, show the detail page
  if (selectedPost) {
    return (
      <BlogPostDetail 
        post={selectedPost} 
        onBack={() => setSelectedPost(null)} 
      />
    )
  }

  return (
    <>
      <HomePage />
      <BlogSection 
        blogPosts={blogPosts} 
        onPostClick={setSelectedPost}
      />
      <CTASection />
    </>
  )
}

export default App
