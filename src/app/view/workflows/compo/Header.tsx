import React from 'react'

type CategoryType = 'All' | 'General' | 'Fun' | 'Viral Trend' | 'Architecture' | 'Photography' | 'Fashion' | 'Virtual tryon' | 'Social Media' | 'Film Industry' | 'Branding' | 'Design' | 'Video';

interface HeaderProps {
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  onSearch?: (searchTerm: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeCategory, onCategoryChange, onSearch }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const categories: CategoryType[] = [
    'All',
    'General',
    'Fun',
    'Viral Trend',
    'Architecture',
    'Photography',
    'Fashion',
    'Virtual tryon',
    'Social Media',
    'Film Industry',
    'Branding',
    'Design',
    'Video'
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
      {/* Title Section */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-black dark:text-white text-3xl sm:text-4xl md:text-5xl lg:text-4xl font-semibold mb-2 sm:mb-3">
          Coming Soon... 
        </h3>
        <p className="text-black/70 dark:text-white/80 text-base sm:text-lg md:text-xl">
          Explore AI tools that make your creative process easier and better
        </p>
      </div>

      {/* Categories and Search Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Categories */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-black/10 dark:bg-white/10 text-black/70 dark:text-white/80 hover:bg-black/15 dark:hover:bg-white/15 hover:text-black dark:hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-auto lg:min-w-[280px] xl:min-w-[300px]">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 sm:px-6 py-2 sm:py-2.5 bg-black/5 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-full text-black dark:text-white text-sm sm:text-base placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:border-black/30 dark:focus:border-white/40 focus:bg-black/10 dark:focus:bg-white/15 transition-all duration-200"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/50">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

