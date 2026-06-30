import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "./ToastContext";

function SingleBlog() {
    const { id: blogId } = useParams();
    const navigate = useNavigate();
    const showToast = useToast();

    const [blog, setBlog] = useState(null);
    const [relatedBlogs, setRelatedBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchedBlogId = useRef(null);

    useEffect(() => {
        if (!blogId || fetchedBlogId.current === blogId) {
            setLoading(false);
            return;
        }

        fetchedBlogId.current = blogId;
        setLoading(true);
        axios.get(`http://localhost:5000/api/viewSingleBlog/${blogId}`)
            .then((response) => {
                const fetchedBlog = response.data.content || response.data;
                setBlog(fetchedBlog);
                setLoading(false);

                // Fetch other blogs in the same category as related recommendations
                if (fetchedBlog && fetchedBlog.category) {
                    axios.get(`http://localhost:5000/api/viewByCategory/${fetchedBlog.category}`)
                        .then((res) => {
                            const list = res.data.content || res.data || [];
                            setRelatedBlogs(list.filter(item => item._id !== blogId).slice(0, 3));
                        })
                        .catch((err) => {
                            console.error("Error fetching related articles", err);
                            showToast("Could not load related articles.");
                        });
                }
            })
            .catch((err) => {
                console.error("Error fetching single blog:", err);
                fetchedBlogId.current = null;
                showToast("Could not retrieve the full article. Showing draft view.");
                setLoading(false);
            });
    }, [blogId, showToast]);

    const handleIncrementLike = () => {
        axios.put(`http://localhost:5000/api/incrementLike/${blogId}`)
            .then(() => {
                setBlog(prev =>
                    prev
                        ? { ...prev, likeCount: (prev.likeCount || 0) + 1 }
                        : null
                );
            })
            .catch((err) => {
                console.error("Like error:", err);
                showToast("Unable to record reaction.");
            });
    };

    const handleBack = () => {
        navigate('/');
    };

    // Sophisticated fallback values when no specific backend item is provided
    const fallbackBlog = {
        title: "The Quiet Revolution in How We Build Knowledge Machines",
        category: "Technology",
        content: "For decades, artificial intelligence research moved in fits and starts — a summer of optimism followed by a long winter of disillusionment. What changed is not the algorithms, but rather the sheer abundance of human language captured on the web. We built machines that don't think like philosophers, but instead memorize like librarians.\n\nTo understand this shift, one must look at the physical architecture underneath. Complex copper pathways and silicon dies hum quietly in server farms located across the cold northern climates. The data flows ceaselessly. What we are witnessing is not the emergence of consciousness, but the industrialization of human thought.\n\nYet, this raises vital cultural questions: who owns the rights to our collective output? When a model speaks, is it expressing insight, or simply reflecting back a compressed average of every blog, forum, and digitised newspaper ever written? The answers will define the next century of digital authorship.",
        user: { name: "Eleanor Marsh" },
        likeCount: 142,
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        createdAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };

    const currentBlog = blog || fallbackBlog;
    const contentSentences = (currentBlog.content || '')
        .split(/(?<=[.!?])\s+/)
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 40);
    const dynamicPullQuote = contentSentences.find(sentence => sentence.length <= 180)
        || contentSentences[0]
        || currentBlog.title;

    if (loading) {
        return (
            <div className="blog-loading-container">
                <div className="blog-loading-text">Opening article...</div>
            </div>
        );
    }

    return (
        <div className="single-blog-view">
            {/* Nav Header */}
            <div className="nav-bar">
                <div className="logo-container">
                    <h1 className="logo" style={{ cursor: 'pointer' }} onClick={handleBack}>Meridian</h1>
                </div>
                <div className="nav-buttons">
                    <button className="nav-btn" onClick={handleBack}>← Back to Journal</button>
                    <button className="subscribe-btn">Subscribe</button>
                </div>
            </div>

            {/* Article Header info */}
            <div className="single-blog-header">
                <div className="single-blog-meta-row">
                    <span className="single-blog-category">
                        {currentBlog.category || 'Perspectives'}
                    </span>
                    <span className="single-blog-separator">|</span>
                    <span className="single-blog-date">
                        {currentBlog.createdAt ? new Date(currentBlog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'June 2026'}
                    </span>
                </div>

                <h1 className="single-blog-title">
                    {currentBlog.title}
                </h1>

                {/* Author Details and Likes Action bar */}
                <div className="author-info-bar">
                    <div className="author-profile-block">
                        <img 
                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" 
                            alt="Author Avatar" 
                            className="author-avatar-img"
                        />
                        <div className="author-info-text">
                            <div className="author-name-text">
                                By {currentBlog.user?.name || 'Staff Writer'}
                            </div>
                            <div className="author-role-text">
                                Senior Columnist & Contributor
                            </div>
                        </div>
                    </div>

                    <div>
                        <button className="header-action-button" onClick={handleIncrementLike}>
                            <span style={{ marginRight: '5px' }}>❤️</span> {currentBlog.likeCount || 0} Likes
                        </button>
                    </div>
                </div>
            </div>

            {/* Massive widescreen display Image */}
            <div className="single-blog-hero-container">
                <div className="single-blog-hero-image-wrapper">
                    <img 
                        src={currentBlog.image?.startsWith('http') ? currentBlog.image : `http://localhost:5000/${currentBlog.image}`} 
                        alt={currentBlog.title} 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
                        }}
                    />
                </div>
            </div>

            {/* Main content read body */}
            <article className="single-blog-article-body">
                <div className="single-blog-main-content">
                    {currentBlog.content}
                </div>

                {/* Pull Quote styled precisely in Meridian theme */}
                <blockquote className="single-blog-pullquote">
                    "{dynamicPullQuote}"
                </blockquote>

                {/* Action footer of article */}
                <div className="single-blog-article-footer">
                    <div className="single-blog-tags">
                        <span className="tag-badge">#Essay</span>
                        <span className="tag-badge">#ThoughtPieces</span>
                    </div>
                    <button className="like-button-action" onClick={handleIncrementLike}>
                        <i>❤️</i> Support this writer
                    </button>
                </div>
            </article>

            {/* Related recommendations block */}
            {relatedBlogs.length > 0 && (
                <div className="related-section-wrapper">
                    <div className="related-content-constrainer">
                        <h3 className="related-section-headline">Related Perspectives</h3>
                        <div className="articles-grid">
                            {relatedBlogs.map((item) => (
                                <div className="article-card related-card-overwrite" key={item._id}>
                                    <div className="card-image-wrapper related-card-image-box">
                                        <img 
                                            src={`http://localhost:5000/${item.image}`} 
                                            alt={item.title} 
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80';
                                            }}
                                        />
                                    </div>
                                    <div className="card-meta">{item.category}</div>
                                    <h4 className="related-card-title">{item.title}</h4>
                                    <div className="card-footer">
                                        <span>By {item.user?.name || 'Staff'}</span>
                                        <button className="like-button-action" onClick={() => handleIncrementLike(item._id)}>
                                            <i>❤️</i> {item.likeCount || 0}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Editorial Footer */}
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

export default SingleBlog;
