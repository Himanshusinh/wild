export default function HomePage() {
  return (
    <section className="homepage">
      <div className="container">
        <h1 className="main-heading">
          <span className="heading-line heading-line-1">Creative Intelligence</span>
          <span className="heading-line heading-line-2">for Modern Brands</span>
        </h1>
        <p className="description">
          Discover how generative AI is revolutionizing design timelines, brand consistency, and creative workflows.
          Learn from industry leaders and unlock new possibilities for your creative projects.
        </p>
        <div className="cta-buttons">
          <button className="btn-primary">
            Start reading
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="btn-secondary">View latest drop</button>
        </div>
      </div>
    </section>
  );
}
