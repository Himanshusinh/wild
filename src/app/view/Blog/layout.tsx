import './styles.css';
import './blogPage/HomePage.css';
import './blogPage/FeaturedBlogs.css';
import './blogPage/BlogSection.css';
import './blogPage/BlogPostDetail.css';
import './blogPage/CTASection.css';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
