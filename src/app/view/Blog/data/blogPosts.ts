// Import JSON data - using type assertion for Turbopack compatibility
import blogPostsData from './blogPosts.json';

export interface BlogPost {
  id: number;
  category: string;
  categoryColor: string;
  title: string;
  description: string;
  readTime: string;
  image: string;
  metaTitle: string;
  metaDescription: string;
  content: any; // Complex nested structure, using any for flexibility
}

export const blogPosts: BlogPost[] = blogPostsData as BlogPost[];

