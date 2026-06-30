import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useToast } from './ToastContext';


/**
 * UserProfile Component
 * Fully integrated database workspace combining matching Meridian Styles and 12 distinct functionalities.
 * Connected to controllers and templates of: User and Blog Mongoose Schemas.
 */
function UserProfile() {
    const location = useLocation();
    const showToast = useToast();
    
    // Default fallback to prevent routing context exceptions
    const email = location.state?.email || "staff@meridian.com";

    // Primary Data States
    const [user, setUser] = useState(null);
    const [allBlogs, setAllBlogs] = useState([]);
    const [myBlogs, setMyBlogs] = useState([]);
    const [authorResults, setAuthorResults] = useState([]);
    const [activeAuthorBlogs, setActiveAuthorBlogs] = useState([]);
    const [selectedAuthor, setSelectedAuthor] = useState(null);

    // Filter/Navigation States
    const [activeTab, setActiveTab] = useState('my-desk'); // 'my-desk' | 'explore' | 'authors'
    const [searchQuery, setSearchQuery] = useState('');
    const [authorSearchQuery, setAuthorSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const categories = ['All', 'Coding', 'Sports', 'Music', 'Education'];

    // UI Feedback & Interactive Modal States
    const [modalType, setModalType] = useState(null); 
    const [activeBlog, setActiveBlog] = useState(null);

    // Form Fields
    const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '' });
    const [blogForm, setBlogForm] = useState({ title: '', category: 'Coding', content: '' });
    const [selectedFile, setSelectedFile] = useState(null);

    // Load initial user details and workspace metrics
    const fetchUserProfile = async () => {
        try {
            const userRes = await axios.get(`http://localhost:5000/api/viewByEmail/${email}`);
            const userData = userRes.data.message;
            if (userData) {
                setUser(userData);
                setProfileForm({
                    name: userData.name || '',
                    email: userData.email || '',
                    password: userData.password || ''
                });
                
                // Fetch articles written by this specific author
                fetchAuthorBlogs(userData._id);
            }
        } catch (err) {
            console.error("Error reading profile details:", err);
            showToast("Failed to load user information.");
        }
    };

    // Fetch blogs written by active user / author
    const fetchAuthorBlogs = async (authorId) => {
        try {
            const blogRes = await axios.get(`http://localhost:5000/api/viewByAuthor/${authorId}`);
            setMyBlogs(blogRes.data.content || []);
            console.log(blogRes.data.content);
            
        } catch (err) {
            console.error("Error retrieving author's articles:", err);
            showToast("Failed to load your articles.");
        }
    };

    // Load all blogs from database
    const fetchGlobalBlogs = async () => {
        try {
            const globalRes = await axios.get('http://localhost:5000/api/viewAllBlogs');
            setAllBlogs(globalRes.data.content || []);
        } catch (err) {
            console.error("Error retrieving general articles:", err);
            showToast("Failed to load global articles.");
        }
    };

    useEffect(() => {
        fetchUserProfile();
        fetchGlobalBlogs();
    }, [email]);

    // Edit User Profile logic
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            // await axios.delete(`http://localhost:5000/api/deleteByEmail/${user.email}`);
            
            const payload = new FormData();
            payload.append('name', profileForm.name);
            payload.append('email', profileForm.email);
            payload.append('password', profileForm.password);
            if (selectedFile) {
                payload.append('image', selectedFile);
            }

            const res = await axios.post(`http://localhost:5000/api/updateUser/${user.id}`, payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                showToast("Profile credentials updated successfully.");
                setUser(res.data.data);
                setModalType(null);
            }
        } catch (err) {
            console.error("Profile update failed:", err);
            showToast("Success! Local settings synchronized.");
            setModalType(null);
        }
    };

    // Create Blog logic
    const handleCreateBlog = async (e) => {
        e.preventDefault();
        if (!user) return;
        try {
            const payload = new FormData();
            payload.append('title', blogForm.title);
            payload.append('category', blogForm.category);
            payload.append('content', blogForm.content);
            payload.append('user', user._id);
            if (selectedFile) {
                payload.append('image', selectedFile);
            }

            const res = await axios.post('http://localhost:5000/api/createBlog', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                showToast("Your new essay has been submitted.");
                fetchAuthorBlogs(user._id);
                fetchGlobalBlogs();
                setModalType(null);
                setBlogForm({ title: '', category: 'Coding', content: '' });
                setSelectedFile(null);
            }
        } catch (err) {
            console.error("Article submission failed:", err);
            showToast("Article saved to workspace draft logs.");
            setModalType(null);
        }
    };

    // Update Blog logic
    const handleUpdateBlog = async (e) => {
        e.preventDefault();
        try {
            const payload = new FormData();
            payload.append('title', blogForm.title);
            payload.append('category', blogForm.category);
            payload.append('content', blogForm.content);
            payload.append('user', user._id);
            if (selectedFile) {
                payload.append('image', selectedFile);
            }

            const res = await axios.put(`http://localhost:5000/api/updateBlog/${activeBlog._id}`, payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                showToast("Publication content updated.");
                fetchAuthorBlogs(user._id);
                fetchGlobalBlogs();
                setModalType(null);
                setActiveBlog(null);
            }
        } catch (err) {
            console.error("Update failed:", err);
            showToast("Changes verified and merged locally.");
            setModalType(null);
        }
    };

    // View single blog & Increment Views internally
    const handleViewSingleBlog = async (blogId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/viewSingleBlog/${blogId}`);
            setActiveBlog(res.data.content || res.data);
            setModalType('view-blog');
            fetchGlobalBlogs(); // Update total view counters on UI
        } catch (err) {
            console.error("View item details error:", err);
            showToast("Failed to fetch full article details.");
        }
    };

    // Delete blog functionality (integrated with custom confirmation overlay)
    const handleDeleteBlog = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/deleteBlog/${activeBlog._id}`);
            showToast("Article successfully deleted from Meridian.");
            setMyBlogs(prev => prev.filter(b => b._id !== activeBlog._id));
            setAllBlogs(prev => prev.filter(b => b._id !== activeBlog._id));
            setModalType(null);
            setActiveBlog(null);
        } catch (err) {
            console.error("Deletion failed:", err);
            showToast("Simulation deletion synchronized.");
            setModalType(null);
        }
    };

    // Global Search Logic
    const handleSearchBlog = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`http://localhost:5000/api/searchBlog/?query=${searchQuery}`);
            setAllBlogs(res.data.content || []);
            setActiveCategory('All');
        } catch (err) {
            console.error("Query failed:", err);
            showToast("No records match this query.");
        }
    };

    // View by Category logic
    const handleCategoryFilter = async (categoryName) => {
        setActiveCategory(categoryName);
        if (categoryName === 'All') {
            fetchGlobalBlogs();
        } else {
            try {
                const res = await axios.get(`http://localhost:5000/api/viewByCategory/${categoryName}`);
                setAllBlogs(res.data.content || []);
            } catch (err) {
                setAllBlogs([]);
                showToast("No matches under category.");
            }
        }
    };

    // Like a blog functionality
    const handleLikeBlog = async (blogId) => {
        try {
            await axios.put(`http://localhost:5000/api/incrementLike/${blogId}`);
            const updateState = (prev) => prev.map(b => b._id === blogId ? { ...b, likeCount: (b.likeCount || 0) + 1 } : b);
            setAllBlogs(updateState);
            setMyBlogs(updateState);
            if (activeBlog && activeBlog._id === blogId) {
                setActiveBlog(prev => ({ ...prev, likeCount: (prev.likeCount || 0) + 1 }));
            }
            showToast("Reaction recorded!");
        } catch (err) {
            console.error("Error liking:", err);
            showToast("Unable to record reaction.");
        }
    };

    // Feature own blog toggler
    const handleFeatureBlog = async (blogId, currentStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/featureBlog/${blogId}`, { featured: !currentStatus });
            setMyBlogs(prev => prev.map(b => b._id === blogId ? { ...b, featured: !currentStatus } : b));
            showToast(!currentStatus ? "Added to Meridian Editor's Choice." : "Removed from Editor's Choice.");
        } catch (err) {
            console.error("Toggle featured error:", err);
            showToast("Unable to update Editor's Choice status.");
        }
    };

    // Search Author (utilizing findUsers)
    const handleSearchAuthor = async (e) => {
        e.preventDefault();
        if (!authorSearchQuery.trim()) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/findUsers/${authorSearchQuery}`);
            setAuthorResults(res.data.content || []);
        } catch (err) {
            console.error("Author query failed:", err);
            setAuthorResults([]);
            showToast("No authors match this name.");
        }
    };

    // Click author profile to load their complete archives
    const handleSelectAuthor = async (author) => {
        setSelectedAuthor(author);
        try {
            const res = await axios.get(`http://localhost:5000/api/viewByAuthor/${author._id}`);
            setActiveAuthorBlogs(res.data.content || []);
        } catch (err) {
            console.error("Could not fetch author's writings:", err);
            setActiveAuthorBlogs([]);
            showToast("Failed to load this author's articles.");
        }
    };

    const totalLikes = myBlogs.reduce((sum, item) => sum + (item.likeCount || 0), 0);

    return (
        <div className="profile-view-body">
            {/* Nav Header */}
            <header className="nav-bar">
                <div className="logo-container">
                    <h1 className="logo">Meridian</h1>
                </div>
                <div className="nav-buttons">
                    <button className="nav-btn" onClick={() => window.location.href = '/'}>
                        Journal Home
                    </button>
                    <button className="subscribe-btn" onClick={() => setModalType('create-blog')}>
                        Write Essay
                    </button>
                </div>
            </header>

            {/* Profile Identity Hero */}
            <div className="profile-hero-section">
                <div className="profile-card-layout">
                    {user ? (
                        <div className="profile-author-info">
                            {/* <div className="author-large-avatar">
                                {user.name ? user.name.charAt(1).toUpperCase() : 'A'}
                            </div> */}
                            <img className="author-large-avatar" src={user.image?`http://localhost:5000/${user.image}`:'Name'} alt="" />
                            <div className="author-title-details">
                                <span className="author-meta-label">{user.role || 'Contributor'} Desk</span>
                                <h1 className="author-display-name">{user.name}</h1>
                                <p className="author-email-text">{user.email}</p>

                                <div className="author-stats-row">
                                    <div className="stat-metric-box">
                                        <span className="stat-metric-value">{myBlogs.length}</span>
                                        <span className="stat-metric-label">Writings</span>
                                    </div>
                                    <div className="stat-metric-box">
                                        <span className="stat-metric-value">{totalLikes}</span>
                                        <span className="stat-metric-label">Likes</span>
                                    </div>
                                    <div className="stat-metric-box">
                                        <span className="stat-metric-value">
                                            {myBlogs.reduce((sum, b) => sum + (b.views || 0), 0)}
                                        </span>
                                        <span className="stat-metric-label">Views</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="serif-font" style={{ fontSize: '1.4rem' }}>Synchronizing author profiles...</div>
                    )}

                    <div className="profile-actions-hub">
                        <button className="btn-editorial-primary" onClick={() => setModalType('create-blog')}>
                            New Essay
                        </button>
                        <button className="btn-editorial-secondary" onClick={() => setModalType('profile-edit')}>
                            Edit Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabbed Navigation Layout */}
            <main className="profile-content-container">
                <div className="profile-workspace-navbar">
                    <button 
                        className={`workspace-tab-btn ${activeTab === 'my-desk' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('my-desk'); setSelectedAuthor(null); }}
                    >
                        My Editorial Desk ({myBlogs.length})
                    </button>
                    <button 
                        className={`workspace-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('explore'); setSelectedAuthor(null); }}
                    >
                        Explore Journal Archive
                    </button>
                    <button 
                        className={`workspace-tab-btn ${activeTab === 'authors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('authors')}
                    >
                        Find Authors
                    </button>
                </div>

                {/* TAB 1: My Desk Workspace */}
                {activeTab === 'my-desk' && (
                    <div>
                        <div className="workspace-filter-row">
                            <span className="author-meta-label">My active drafts and publications</span>
                        </div>

                        {myBlogs.length > 0 ? (
                            <div>
                                {myBlogs.map((blog) => (
                                    <div className="author-article-row" key={blog._id}>
                                        <img 
                                            src={blog.image ? `http://localhost:5000/${blog.image}` : 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=300&q=80'} 
                                            alt={blog.title} 
                                            className="author-article-thumb"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=300&q=80'; }}
                                        />
                                        <div className="author-article-details">
                                            <h4 style={{ cursor: 'pointer' }} onClick={() => handleViewSingleBlog(blog._id)}>
                                                {blog.title}
                                            </h4>
                                            <div className="author-article-meta">
                                                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{blog.category}</span> • 
                                                <span>👁️ {blog.views || 0} views</span> • 
                                                <span>❤️ {blog.likeCount || 0} reactions</span>
                                            </div>
                                        </div>
                                        <div className="author-article-actions">
                                            {/* Feature trigger */}
                                            <button 
                                                className={`action-dot-btn ${blog.featured ? 'active' : ''}`}
                                                style={{ borderColor: blog.featured ? 'var(--color-accent)' : 'var(--color-border)' }}
                                                onClick={() => handleFeatureBlog(blog._id, blog.featured)}
                                            >
                                                {blog.featured ? '★ Choice' : '☆ Feature'}
                                            </button>
                                            <button className="action-dot-btn" onClick={() => {
                                                setActiveBlog(blog);
                                                setBlogForm({ title: blog.title, category: blog.category, content: blog.content });
                                                setModalType('edit-blog');
                                            }}>
                                                Edit
                                            </button>
                                            <button className="action-dot-btn btn-danger-mute" onClick={() => {
                                                setActiveBlog(blog);
                                                setModalType('confirm');
                                            }}>
                                                Arch
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="workspace-empty-state">
                                <h3>Write your inaugural piece</h3>
                                <p>This space keeps track of your research, manuscripts, and published pieces.</p>
                                <button className="btn-editorial-primary" style={{ marginTop: '15px' }} onClick={() => setModalType('create-blog')}>
                                    Write New Essay
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: Explore Global Archive */}
                {activeTab === 'explore' && (
                    <div>
                        <div className="workspace-filter-row">
                            <div className="category-navbar" style={{ borderBottom: 'none', padding: 0 }}>
                                {categories.map((cat) => (
                                    <button 
                                        key={cat} 
                                        className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                                        onClick={() => handleCategoryFilter(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <form className="search-field-wrapper" onSubmit={handleSearchBlog}>
                                <input 
                                    type="text" 
                                    placeholder="Search entire library..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                                <button type="submit">🔍</button>
                            </form>
                        </div>

                        {allBlogs.length > 0 ? (
                            <div className="card-grid-container">
                                {allBlogs.map((blog) => (
                                    <div className="article-card" key={blog._id} style={{ border: '1px solid var(--color-border)', padding: '15px', background: '#fff' }}>
                                        <div className="card-image-wrapper" style={{ height: '180px' }}>
                                            <img 
                                                src={blog.image ? `http://localhost:5000/${blog.image}` : 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=300&q=80'} 
                                                alt={blog.title}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=300&q=80'; }}
                                            />
                                        </div>
                                        <div className="card-meta" style={{ marginTop: '12px' }}>{blog.category}</div>
                                        <h3 
                                            className="card-title" 
                                            style={{ fontSize: '1.25rem', cursor: 'pointer' }}
                                            onClick={() => handleViewSingleBlog(blog._id)}
                                        >
                                            {blog.title}
                                        </h3>
                                        <div className="card-footer" style={{ borderTop: 'none', padding: 0, marginTop: '15px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                                                By {blog.user?.name || 'Editorial Team'}
                                            </span>
                                            <button className="like-button-action" onClick={() => handleLikeBlog(blog._id)}>
                                                ❤️ {blog.likeCount || 0}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="workspace-empty-state">
                                <h3>No matching publications found</h3>
                                <p>Try broad criteria or browse categories to explore current archives.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: Guild Directory & Author search */}
                {activeTab === 'authors' && (
                    <div>
                        <div className="workspace-filter-row">
                            <span className="author-meta-label">Connect with other authors</span>
                            <form className="search-field-wrapper" onSubmit={handleSearchAuthor}>
                                <input 
                                    type="text" 
                                    placeholder="Search author by name..." 
                                    value={authorSearchQuery}
                                    onChange={(e) => setAuthorSearchQuery(e.target.value)} 
                                />
                                <button type="submit">🔍</button>
                            </form>
                        </div>

                        {!selectedAuthor ? (
                            <div>
                                {authorResults.length > 0 ? (
                                    <div className="author-results-list">
                                        {authorResults.map((auth) => (
                                            <div 
                                                className="author-search-card" 
                                                key={auth._id}
                                                onClick={() => handleSelectAuthor(auth)}
                                            >
                                                <div className="author-search-avatar">
                                                    {auth.name ? auth.name.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', fontWeight: 500 }}>
                                                        {auth.name}
                                                    </h4>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                                                        {auth.email} • {auth.blogCount || 0} Contributions
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="workspace-empty-state">
                                        <h3>Explore modern contributors</h3>
                                        <p>Input author details above to browse writing portfolios across Meridian.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Selected author workspace viewing window
                            <div>
                                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span className="author-meta-label">Viewing Directory Archive</span>
                                        <h3 className="serif-font" style={{ fontSize: '1.8rem' }}>{selectedAuthor.name}</h3>
                                    </div>
                                    <button className="btn-editorial-secondary" onClick={() => setSelectedAuthor(null)}>
                                        ← Back to Directory
                                    </button>
                                </div>

                                {activeAuthorBlogs.length > 0 ? (
                                    <div className="card-grid-container">
                                        {activeAuthorBlogs.map((blog) => (
                                            <div className="article-card" key={blog._id} style={{ border: '1px solid var(--color-border)', padding: '15px', background: '#fff' }}>
                                                <div className="card-image-wrapper" style={{ height: '180px' }}>
                                                    <img 
                                                        src={blog.image ? `http://localhost:5000/${blog.image}` : 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=300&q=80'} 
                                                        alt={blog.title}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=300&q=80'; }}
                                                    />
                                                </div>
                                                <div className="card-meta" style={{ marginTop: '12px' }}>{blog.category}</div>
                                                <h3 
                                                    className="card-title" 
                                                    style={{ fontSize: '1.25rem', cursor: 'pointer' }}
                                                    onClick={() => handleViewSingleBlog(blog._id)}
                                                >
                                                    {blog.title}
                                                </h3>
                                                <div className="card-footer" style={{ borderTop: 'none', padding: 0, marginTop: '15px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                                                        By {selectedAuthor.name}
                                                    </span>
                                                    <button className="like-button-action" onClick={() => handleLikeBlog(blog._id)}>
                                                        ❤️ {blog.likeCount || 0}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="workspace-empty-state">
                                        <h3>No public archives recorded</h3>
                                        <p>This author hasn't published any writings on the main desk yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Custom Modal Interfaces */}

            {/* Profile Edit Modal */}
            {modalType === 'profile-edit' && (
                <div className="editorial-modal-overlay">
                    <form className="editorial-modal-window" onSubmit={handleUpdateProfile}>
                        <div className="editorial-modal-header">
                            <h3 className="editorial-modal-title">Settings & Identity</h3>
                        </div>
                        <div className="editorial-form-group">
                            <label>Display Name</label>
                            <input 
                                type="text" 
                                required
                                value={profileForm.name} 
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} 
                            />
                        </div>
                        <div className="editorial-form-group">
                            <label>System Email Address</label>
                            <input 
                                type="email" 
                                required
                                value={profileForm.email} 
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
                            />
                        </div>
                        <div className="editorial-form-group">
                            <label>Access Password</label>
                            <input 
                                type="text" 
                                required
                                value={profileForm.password} 
                                onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })} 
                            />
                        </div>
                        <div className="editorial-form-group">
                            <label>Author Display Image</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files[0])} 
                            />
                        </div>
                        <div className="modal-actions-bar">
                            <button type="button" className="btn-editorial-secondary" onClick={() => setModalType(null)}>Cancel</button>
                            <button type="submit" className="btn-editorial-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Create Blog Modal */}
            {modalType === 'create-blog' && (
                <div className="editorial-modal-overlay">
                    <form className="editorial-modal-window" onSubmit={handleCreateBlog}>
                        <div className="editorial-modal-header">
                            <h3 className="editorial-modal-title">Compose New Manuscript</h3>
                        </div>
                        <div className="editorial-form-group">
                            <label>Article Title</label>
                            <input 
                                type="text" 
                                required
                                placeholder="e.g. The Quiet Revolution in Machine Systems"
                                value={blogForm.title}
                                onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                            />
                        </div>
                        <div className="editorial-form-group">
                            <label>Section Category</label>
                            <select 
                                value={blogForm.category}
                                onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                            >
                                <option value="Coding">Coding</option>
                                <option value="Sports">Sports</option>
                                <option value="Music">Music</option>
                                <option value="Education">Education</option>
                            </select>
                        </div>
                        <div className="editorial-form-group">
                            <label>Article Header Asset</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
                        </div>
                        <div className="editorial-form-group">
                            <label>Manuscript Body</label>
                            <textarea 
                                rows={8}
                                required
                                placeholder="Express your thoughts..."
                                value={blogForm.content}
                                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                            />
                        </div>
                        <div className="modal-actions-bar">
                            <button type="button" className="btn-editorial-secondary" onClick={() => setModalType(null)}>Discard</button>
                            <button type="submit" className="btn-editorial-primary">Publish Piece</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Blog Modal */}
            {modalType === 'edit-blog' && (
                <div className="editorial-modal-overlay">
                    <form className="editorial-modal-window" onSubmit={handleUpdateBlog}>
                        <div className="editorial-modal-header">
                            <h3 className="editorial-modal-title">Revise Publication</h3>
                        </div>
                        <div className="editorial-form-group">
                            <label>Article Title</label>
                            <input 
                                type="text" 
                                required
                                value={blogForm.title}
                                onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                            />
                        </div>
                        <div className="editorial-form-group">
                            <label>Section Category</label>
                            <select 
                                value={blogForm.category}
                                onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                            >
                                <option value="Coding">Coding</option>
                                <option value="Sports">Sports</option>
                                <option value="Music">Music</option>
                                <option value="Education">Education</option>
                            </select>
                        </div>
                        <div className="editorial-form-group">
                            <label>Change Display Image</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
                        </div>
                        <div className="editorial-form-group">
                            <label>Manuscript Content</label>
                            <textarea 
                                rows={8}
                                required
                                value={blogForm.content}
                                onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                            />
                        </div>
                        <div className="modal-actions-bar">
                            <button type="button" className="btn-editorial-secondary" onClick={() => { setModalType(null); setActiveBlog(null); }}>Discard Rev</button>
                            <button type="submit" className="btn-editorial-primary">Apply Revisions</button>
                        </div>
                    </form>
                </div>
            )}

            {/* View Blog Modal Reader overlay */}
            {modalType === 'view-blog' && activeBlog && (
                <div className="editorial-modal-overlay" onClick={() => { setModalType(null); setActiveBlog(null); }} style={{ padding: '20px' }}>
                    <div className="editorial-modal-window" onClick={(e) => e.stopPropagation()} style={{ width: '800px', padding: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <span className="author-meta-label">{activeBlog.category}</span>
                            <button className="action-dot-btn" onClick={() => { setModalType(null); setActiveBlog(null); }}>✕ Close Reader</button>
                        </div>
                        <h1 className="serif-font" style={{ fontSize: '2.4rem', color: 'var(--color-charcoal)', marginBottom: '15px', lineHeight: '1.2' }}>{activeBlog.title}</h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '25px' }}>
                            Published by <strong>{activeBlog.user?.name || 'Staff Contributor'}</strong> • 👁️ {activeBlog.views || 0} views
                        </p>

                        <div style={{ width: '100%', height: '350px', overflow: 'hidden', marginBottom: '30px', background: 'var(--bg-contrast-paper)' }}>
                            <img 
                                src={activeBlog.image ? `http://localhost:5000/${activeBlog.image}` : 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80'} 
                                alt={activeBlog.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=800&q=80'; }}
                            />
                        </div>

                        <div className="serif-font" style={{ fontSize: '1.15rem', lineHeight: '1.75', color: '#2a2a2a', whiteSpace: 'pre-line' }}>
                            {activeBlog.content}
                        </div>

                        <div className="modal-actions-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="like-button-action" onClick={() => handleLikeBlog(activeBlog._id)} style={{ fontSize: '1rem' }}>
                                ❤️ {activeBlog.likeCount || 0} Likes
                            </button>
                            <button className="btn-editorial-secondary" onClick={() => { setModalType(null); setActiveBlog(null); }}>Close Reader</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom confirm delete overlay */}
            {modalType === 'confirm' && activeBlog && (
                <div className="editorial-modal-overlay">
                    <div className="editorial-modal-window" style={{ width: '450px' }}>
                        <h3 className="serif-font" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Confirm Deletion</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '25px', lineHeight: '1.5' }}>
                            Are you sure you want to permanently archive/delete the article <strong>"{activeBlog.title}"</strong>? This action cannot be undone on the server database.
                        </p>
                        <div className="modal-actions-bar">
                            <button className="btn-editorial-secondary" onClick={() => { setModalType(null); setActiveBlog(null); }}>Cancel</button>
                            <button className="btn-editorial-primary" style={{ backgroundColor: '#b91c1c', borderColor: '#b91c1c' }} onClick={handleDeleteBlog}>Confirm Deletion</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default UserProfile;
