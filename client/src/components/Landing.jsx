import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

function Landing() {
    const [blogs, setBlog] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [category, setCategory] = useState('All');
    const navigate = useNavigate();
    
    const categories = ['All', 'Coding', 'Sports', 'Music', 'Education'];



    // Fetch all blogs on mount
    useEffect(() => {
        axios.get('http://localhost:5000/api/viewAllBlogs')
            .then((response) => {
                setBlog(response.data.content);
            }).catch((err) => {
                console.error("Fetch all error:", err);

            });
    }, []);


    // Search Blogs
    function searchBlog(e) {
        if (e) e.preventDefault();
        axios.get(`http://localhost:5000/api/searchBlog/?query=${searchInput}`)
            .then((response) => {
                setBlog(response.data.content);
                setCategory('All');
            }).catch((err) => {
                console.error("Search error:", err);

            });
    }

    // View Blogs by Category
    function viewByCategory(selectedCategory) {
        setCategory(selectedCategory);
        if (selectedCategory === 'All') {
            axios.get('http://localhost:5000/api/viewAllBlogs')
                .then((response) => {
                    setBlog(response.data.content);
                }).catch((err) => {
                    console.error("Fetch all error:", err);
                });
        } else {
            axios.get(`http://localhost:5000/api/viewByCategory/${selectedCategory}`)
                .then((response) => {
                    setBlog(response.data.content);
                }).catch((err) => {
                    console.error("Filter error:", err);

                });
        }
    }

    function viewSingleBlog(blogId) {
        navigate(`/blog/${blogId}`);
    }

    function incrementLike(blogId) {
        axios.put(`http://localhost:5000/api/incrementLike/${blogId}`)
            .then(() => {
                setBlog(prevBlogs =>
                    prevBlogs.map(b => b._id === blogId ? { ...b, likeCount: (b.likeCount || 0) + 1 } : b)
                );

            }).catch((err) => {
                console.error("Like error:", err);


            });
    }

    // Split backend blogs for Hero structure
    const featuredHero = blogs.length > 0 ? blogs[0] : null;
    const remainingArticles = blogs.length > 1 ? blogs.slice(1) : [];
    const worthReadingArticles = [...blogs]
        .sort((a, b) => ((b.likeCount || 0) + (b.views || 0)) - ((a.likeCount || 0) + (a.views || 0)))
        .slice(0, 3);
    const spotlightBlog = worthReadingArticles[0] || featuredHero;
    const spotlightAuthor = spotlightBlog?.user;
    const spotlightAvatar = spotlightAuthor?.image
        ? spotlightAuthor.image.startsWith('http')
            ? spotlightAuthor.image
            : `http://localhost:5000/${spotlightAuthor.image}`
        : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80';

    return (
        <div>
            { }
            {/* Navbar matching .nav-bar */}
            <div className="nav-bar">
                <div className="logo-container">
                    <h1 className="logo" style={{ cursor: 'pointer' }} onClick={() => viewByCategory('All')}>Meridian</h1>

                    {/* Integrated search form matching layout */}
                    <form className="search-container" onSubmit={searchBlog}>
                        <input
                            type="text"
                            placeholder="Search perspectives..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <button type="submit">🔍</button>
                    </form>
                </div>

                <div className="nav-buttons">
                    <button className="nav-btn" onClick={()=>{navigate('login')}} >Login</button>
                    <button className="subscribe-btn">Subscribe</button>
                </div>
            </div>

            {/* Horizontal premium category filter buttons */}
            <div className="category-navbar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`category-tab ${category === cat ? 'active' : ''}`}
                        onClick={() => viewByCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            { }
            <div className="editorial-container">
                {/* 1. Hero Dynamic Block */}
                {featuredHero ? (
                    <div className="hero-editorial-section">
                        <div className="hero-image-wrapper">
                            <img
                                src={`http://localhost:5000/${featuredHero.image}`}
                                alt={featuredHero.title}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
                                }}
                            />
                        </div>
                        <div className="hero-content">
                            <div className="hero-meta">{featuredHero.category || 'Featured'}</div>
                            <h1 className="hero-title">{featuredHero.title}</h1>
                            <p className="hero-excerpt">
                                {featuredHero.content && featuredHero.content.length > 200
                                    ? featuredHero.content.substring(0, 200) + '...'
                                    : featuredHero.content}
                            <button
                                className="like-button-action"
                                onClick={() => viewSingleBlog(featuredHero._id)}
                            >
                                Read more
                            </button>
                            </p>
                            
                            <div className="hero-author">
                                <span>{featuredHero.user?.name || 'Author name'}</span>
                                <button className="like-button-action" onClick={() => incrementLike(featuredHero._id)}>
                                    <i>❤️</i> {featuredHero.likeCount || 0}
                                </button>
                                <button className="like-button-action" >
                                    <i className="fa-solid fa-eye"></i> {featuredHero.views || 0}
                                </button>
                                {featuredHero.featured && <span className="read-time">⭐ Editor's Choice</span>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <h3>No articles published yet</h3>
                        <p>Begin publishing articles from your administration portal to populate the newsletter.</p>
                    </div>
                )}

                
                {/* 2. Article Grid Block */}
                {remainingArticles.length > 0 && (
                    <div>
                        <h2 className="grid-section-title">Latest Releases</h2>
                        <div className="articles-grid">
                            {remainingArticles.map((blog) => (
                                <div className="article-card" key={blog._id}>
                                    <div className="card-image-wrapper">
                                        <img
                                            src={`http://localhost:5000/${blog.image}`}
                                            alt={blog.title}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80';
                                            }}
                                        />
                                    </div>
                                    <div className="card-meta">{blog.category}</div>
                                    <h3 className="card-title">{blog.title}</h3>
                                    <p className="card-excerpt">{blog.content}</p>
                                    <div className="card-footer">
                                        <span>By {blog.user?.name || 'Staff'}</span>
                                        <button className="like-button-action" onClick={() => viewSingleBlog(blog._id)}>
                                            Read more
                                        </button>
                                        <button className="like-button-action" onClick={() => incrementLike(blog._id)}>
                                            <i>❤️</i> {blog.likeCount || 0}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                { }
                {/* 3. Dynamic Editorial Context Sections (Worth Reading & Contributor Spotlight) */}
                <div className="dual-section-layout">
                    <div>
                        <h3 className="sidebar-title">Also Worth Reading</h3>
                        <div className="worth-reading-list">
                            {worthReadingArticles.length > 0 ? (
                                worthReadingArticles.map((blog, index) => (
                                    <button
                                        key={blog._id}
                                        type="button"
                                        className="worth-reading-item"
                                        onClick={() => viewSingleBlog(blog._id)}
                                    >
                                        <div className="item-left">
                                            <span className="item-number">
                                                {String(index + 1).padStart(2, '0')} / {blog.category || 'Featured'}
                                            </span>
                                            <h4 className="item-title">{blog.title}</h4>
                                            <span className="item-author">
                                                By {blog.user?.name || 'Staff'} · {blog.views || 0} views · {blog.likeCount || 0} likes
                                            </span>
                                        </div>
                                        <i>→</i>
                                    </button>
                                ))
                            ) : (
                                <div className="worth-reading-empty">
                                    Publish more articles to populate this reading list.
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="sidebar-title">Contributor Spotlight</h3>
                        <div className="editor-bio-card">
                            {spotlightBlog ? (
                                <>
                                    <div className="editor-header">
                                        <img
                                            className="editor-avatar"
                                            src={spotlightAvatar}
                                            alt={spotlightAuthor?.name || 'Featured contributor'}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80';
                                            }}
                                        />
                                        <div className="editor-info">
                                            <h4>{spotlightAuthor?.name || 'Staff Contributor'}</h4>
                                            <span>{spotlightAuthor?.role || 'Contributor'}</span>
                                        </div>
                                    </div>
                                    <p className="editor-desc">
                                        Featured for "{spotlightBlog.title}", with {spotlightBlog.views || 0} views and {spotlightBlog.likeCount || 0} reader reactions.
                                    </p>
                                    <div className="editor-social-links">
                                        <button
                                            type="button"
                                            className="social-link"
                                            onClick={() => viewSingleBlog(spotlightBlog._id)}
                                        >
                                            Read spotlight article
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p className="editor-desc">
                                    Contributor details will appear here after the first article is published.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                { }
                {/* 4. Newsletter Subscription Block */}
                <div className="newsletter-banner">
                    <div className="newsletter-text">
                        <span className="newsletter-tag">Our Letters</span>
                        <h2 className="newsletter-headline">Delivered once a week. No noise.</h2>
                        <p className="newsletter-subtext">
                            The best of Meridian — raw perspectives, complete research, and authentic storytelling. Delivered straight to your inbox every Sunday morning. No ads.
                        </p>
                    </div>
                    <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); console.log('Subscribed!'); }}>
                        <div className="newsletter-input-group">
                            <input type="email" placeholder="you@example.com" required />
                        </div>
                        <button type="submit" className="newsletter-submit-btn">Subscribe to Letters →</button>
                    </form>
                </div>
            </div>

            { }
            {/* Premium Footer matching .premium-footer */}
            <footer className="premium-footer">
                <div className="footer-top">
                    <div className="footer-brand">
                        <h2>Meridian</h2>
                        <p>An editorial journal exploring art, technology, culture, and the currents molding our generation.</p>
                    </div>
                    <div className="footer-column">
                        <h5>Perspectives</h5>
                        <ul className="footer-links">
                            <li><a href="#features">Features</a></li>
                            <li><a href="#essays">Essays</a></li>
                            <li><a href="#reviews">Reviews</a></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h5>Company</h5>
                        <ul className="footer-links">
                            <li><a href="#about">About</a></li>
                            <li><a href="#masthead">Masthead</a></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h5>Community</h5>
                        <ul className="footer-links">
                            <li><a href="#submit">Submissions</a></li>
                            <li><a href="#members">Memberships</a></li>
                            <li><a href="#careers">Careers</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Meridian Magazine. All rights reserved.</p>
                    <p>Designed for responsive web viewports.</p>
                </div>
            </footer>


        </div>
    );
}

export default Landing;
