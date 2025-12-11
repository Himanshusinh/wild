import './HomePage.css'

function HomePage() {
  return (
    <div className="homepage">
      <div className="container">
        {/* Main Heading */}
        <h1 className="main-heading">
          <span className="heading-line heading-line-1 text-4xl font-semibold text-center">Creative Intelligence</span>
          <span className="heading-line heading-line-2">for Modern Brands</span>
        </h1>

        {/* Descriptive Paragraph */}
        <p className="description">
          Discover how generative AI is revolutionizing design timelines, brand consistency, and creative workflows. Learn from industry leaders and unlock new possibilities for your creative projects.
        </p>
      </div>
    </div>
  )
}

export default HomePage

