import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { getImageUrl } from '../../HomePage/routes'
import TemplateModal from './TemplateModal'

// Types for items and categories
type CategoryType = 'All' | 'General' | 'Fun' | 'Viral Trend' | 'Architecture' | 'Photography' | 'Fashion' | 'Virtual tryon' | 'Social Media' | 'Film Industry' | 'Branding' | 'Design' | 'Video';

type TemplateItem = {
  id: string
  src: string
  title: string
  category: CategoryType
}

const MOCK_ITEMS: TemplateItem[] = [
  // General Category (8 items)
  { id: '1', src: getImageUrl('recentCreations', 'recent1'), title: 'Creatively Upscale', category: 'General' },
  { id: '2', src: getImageUrl('recentCreations', 'recent2'), title: 'Remove Background', category: 'General' },
  { id: '3', src: getImageUrl('recentCreations', 'recent3'), title: 'Restore Old Photo', category: 'General' },
  { id: '4', src: getImageUrl('recentCreations', 'recent4'), title: 'Photo to line drawing', category: 'General' },
  { id: '5', src: getImageUrl('recentCreations', 'recent5'), title: 'Line Drawing to Photo', category: 'General' },
  { id: '6', src: getImageUrl('recentCreations', 'recent1'), title: 'Remove Element from Image', category: 'General' },
  { id: '7', src: getImageUrl('recentCreations', 'recent2'), title: 'Replace Element', category: 'General' },
  { id: '8', src: getImageUrl('recentCreations', 'recent3'), title: 'Remove Watermark', category: 'General' },
  
  // Fun Category (10 items)
  { id: '9', src: getImageUrl('recentCreations', 'recent4'), title: 'Surprise Me', category: 'Fun' },
  { id: '10', src: getImageUrl('recentCreations', 'recent5'), title: 'People Age (make them small or old)', category: 'Fun' },
  { id: '11', src: getImageUrl('recentCreations', 'recent1'), title: 'Become a celibrity', category: 'Fun' },
  { id: '12', src: getImageUrl('recentCreations', 'recent2'), title: 'Polaroid style Images', category: 'Fun' },
  { id: '13', src: getImageUrl('recentCreations', 'recent3'), title: 'Create custom stickers', category: 'Fun' },
  { id: '14', src: getImageUrl('recentCreations', 'recent4'), title: 'Fusion of Styles', category: 'Fun' },
  { id: '15', src: getImageUrl('recentCreations', 'recent5'), title: 'Vintage Image/ Teleport yourself', category: 'Fun' },
  { id: '16', src: getImageUrl('recentCreations', 'recent1'), title: 'CCTV footage', category: 'Fun' },
  { id: '17', src: getImageUrl('recentCreations', 'recent2'), title: 'Change the Seasons', category: 'Fun' },
  { id: '18', src: getImageUrl('recentCreations', 'recent3'), title: 'Relighting / Change the lighting', category: 'Fun' },
  
  // Viral Trend Category (3 items)
  { id: '19', src: getImageUrl('recentCreations', 'recent4'), title: 'Turn your self into a figurine', category: 'Viral Trend' },
  { id: '20', src: getImageUrl('recentCreations', 'recent5'), title: 'Style Transfer', category: 'Viral Trend' },
  { id: '21', src: getImageUrl('recentCreations', 'recent1'), title: '3D Print', category: 'Viral Trend' },
  
  // Photography Category (8 items)
  { id: '22', src: getImageUrl('recentCreations', 'recent2'), title: 'Pose Control', category: 'Photography' },
  { id: '23', src: getImageUrl('recentCreations', 'recent3'), title: 'character sheet', category: 'Photography' },
  { id: '24', src: getImageUrl('recentCreations', 'recent4'), title: 'Expression sheet', category: 'Photography' },
  { id: '25', src: getImageUrl('recentCreations', 'recent5'), title: 'Automotive', category: 'Photography' },
  { id: '26', src: getImageUrl('recentCreations', 'recent1'), title: 'wold famous photographer style', category: 'Photography' },
  { id: '27', src: getImageUrl('recentCreations', 'recent2'), title: 'Product Photography', category: 'Photography' },
  { id: '28', src: getImageUrl('recentCreations', 'recent3'), title: 'Reimagine Product', category: 'Photography' },
  { id: '29', src: getImageUrl('recentCreations', 'recent4'), title: 'Dynamic Camera Angles', category: 'Photography' },
  
  // Architecture Category (7 items)
  { id: '30', src: getImageUrl('recentCreations', 'recent5'), title: 'Cad plans to 3d render (Int/Ext)', category: 'Architecture' },
  { id: '31', src: getImageUrl('recentCreations', 'recent1'), title: 'Building different angles', category: 'Architecture' },
  { id: '32', src: getImageUrl('recentCreations', 'recent2'), title: 'interior refine', category: 'Architecture' },
  { id: '33', src: getImageUrl('recentCreations', 'recent3'), title: 'Interior product display', category: 'Architecture' },
  { id: '34', src: getImageUrl('recentCreations', 'recent4'), title: '3D Isomatric view', category: 'Architecture' },
  { id: '35', src: getImageUrl('recentCreations', 'recent5'), title: 'Replace texture of an element', category: 'Architecture' },
  { id: '36', src: getImageUrl('recentCreations', 'recent1'), title: 'Generate texture', category: 'Architecture' },
  
  // Fashion Category (6 items)
  { id: '37', src: getImageUrl('recentCreations', 'recent2'), title: 'Hair style', category: 'Fashion' },
  { id: '38', src: getImageUrl('recentCreations', 'recent3'), title: 'Fashion Modeling Poses', category: 'Fashion' },
  { id: '39', src: getImageUrl('recentCreations', 'recent4'), title: 'Rampwalk', category: 'Fashion' },
  { id: '40', src: getImageUrl('recentCreations', 'recent5'), title: 'Makeup', category: 'Fashion' },
  { id: '41', src: getImageUrl('recentCreations', 'recent1'), title: 'Deconstruct an outfit', category: 'Fashion' },
  { id: '42', src: getImageUrl('recentCreations', 'recent2'), title: 'fashion stylist', category: 'Fashion' },
  
  // Virtual tryon Category (6 items)
  { id: '43', src: getImageUrl('recentCreations', 'recent3'), title: 'Shirt, Tshirt, Pent other clothes', category: 'Virtual tryon' },
  { id: '44', src: getImageUrl('recentCreations', 'recent4'), title: 'Neckless, earing and other jewellery', category: 'Virtual tryon' },
  { id: '45', src: getImageUrl('recentCreations', 'recent5'), title: 'Watch', category: 'Virtual tryon' },
  { id: '46', src: getImageUrl('recentCreations', 'recent1'), title: 'Shoe', category: 'Virtual tryon' },
  { id: '47', src: getImageUrl('recentCreations', 'recent2'), title: 'All in one', category: 'Virtual tryon' },
  { id: '48', src: getImageUrl('recentCreations', 'recent3'), title: 'Glasses', category: 'Virtual tryon' },
  
  // Social Media Category (1 item)
  { id: '49', src: getImageUrl('recentCreations', 'recent4'), title: 'Create YouTube Thumbnail', category: 'Social Media' },
  
  // Film Industry Category (3 items)
  { id: '50', src: getImageUrl('recentCreations', 'recent5'), title: 'Storyboard', category: 'Film Industry' },
  { id: '51', src: getImageUrl('recentCreations', 'recent1'), title: 'Comic Book', category: 'Film Industry' },
  { id: '52', src: getImageUrl('recentCreations', 'recent2'), title: 'Titles', category: 'Film Industry' },
  
  // Branding Category (3 items)
  { id: '53', src: getImageUrl('recentCreations', 'recent3'), title: 'Create Logo', category: 'Branding' },
  { id: '54', src: getImageUrl('recentCreations', 'recent4'), title: 'Logo Variation', category: 'Branding' },
  { id: '55', src: getImageUrl('recentCreations', 'recent5'), title: 'Mockups', category: 'Branding' },
  
  // Design Category (3 items)
  { id: '56', src: getImageUrl('recentCreations', 'recent1'), title: 'Edit Text on Image', category: 'Design' },
  { id: '57', src: getImageUrl('recentCreations', 'recent2'), title: 'Add Text on Image', category: 'Design' },
  { id: '58', src: getImageUrl('recentCreations', 'recent3'), title: 'Educational Infographic', category: 'Design' },
  
  // Video Category (3 items)
  { id: '59', src: getImageUrl('recentCreations', 'recent4'), title: 'Timelapse', category: 'Video' },
  { id: '60', src: getImageUrl('recentCreations', 'recent5'), title: 'Hyperlapse', category: 'Video' },
  { id: '61', src: getImageUrl('recentCreations', 'recent1'), title: 'Credit 3D Titles', category: 'Video' },
]

interface TemplateGridProps {
  activeCategory: CategoryType;
}

const TemplateGrid: React.FC<TemplateGridProps> = ({ activeCategory }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return MOCK_ITEMS
    return MOCK_ITEMS.filter((i) => i.category === activeCategory)
  }, [activeCategory])

  const handleCardClick = (item: TemplateItem) => {
    setSelectedTemplate(item);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  return (
    <>
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-10">
        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filtered.map((item) => (
            <article
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="rounded-2xl bg-white/5 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer"
            >
              <div className="relative h-[250px] sm:h-[300px] md:h-[320px] lg:h-[350px] rounded-xl overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Title only */}
              <div className="text-white text-xs sm:text-sm truncate">
                {item.title}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Modal */}
      {selectedTemplate && (
        <TemplateModal
          isOpen={!!selectedTemplate}
          onClose={handleCloseModal}
          title={selectedTemplate.title}
          mainImage={selectedTemplate.src}
          category={selectedTemplate.category}
        />
      )}
    </>
  )
}

export default TemplateGrid
