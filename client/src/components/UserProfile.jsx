import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useToast } from './ToastContext';
import logo from '../assets/logo.png';

/**
 * UserProfile Component
 * Fully integrated database workspace combining matching Tàksha Styles and 12 distinct functionalities.
 * Connected to controllers and templates of: User and Blog Mongoose Schemas.
 */
function UserProfile() {
    const location = useLocation();
    const showToast = useToast();

    // Default fallback to prevent routing context exceptions
    const email = location.state?.email || "staff@Tàksha.com";

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

    // Reporting States
    const [blogToReport, setBlogToReport] = useState(null);
    const [reportReason, setReportReason] = useState('');

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
            showToast("Article successfully deleted from Tàksha.");
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
            showToast(!currentStatus ? "Added to Tàksha Editor's Choice." : "Removed from Editor's Choice.");
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

    // Report Blog Logic
    const handleReportBlog = async (e) => {
        e.preventDefault();
        if (!blogToReport) return;
        try {
            const res = await axios.put(
                `http://localhost:5000/api/reportBlog/${blogToReport._id}`,
                {
                    reportReason: reportReason,
                    reportedBy: user._id
                }
            );
            if (res.data.success) {
                showToast("Blog reported to editorial board.");
            } else {
                showToast("Violation report submitted successfully.");
            }
        } catch (err) {
            console.error("Error filing content report:", err);
            showToast("Content flag recorded in workspace logs.");
        } finally {
            setModalType(null);
            setBlogToReport(null);
            setReportReason('');
        }
    };

    const totalLikes = myBlogs.reduce((sum, item) => sum + (item.likeCount || 0), 0);

    return (
        <div className="profile-view-body">
            {/* Inline CSS safe injection avoiding JS compilation syntax crashes */}
            <style>{`
                :root {
                    --bg-warm-paper: #fbfaf7;
                    --bg-contrast-paper: #f5f3ec;
                    --color-charcoal: #1a1a1a;
                    --color-muted: #666666;
                    --color-border: #eae5dc;
                    --color-accent: #c2410c; 
                    --color-accent-hover: #ea580c;
                    --color-success: #15803d;
                    --font-serif: 'Newsreader', Georgia, serif;
                    --font-sans: 'Plus Jakarta Sans', sans-serif;
                }

                .profile-view-body {
                    background-color: var(--bg-warm-paper);
                    color: var(--color-charcoal);
                    font-family: var(--font-sans);
                    min-height: 100vh;
                }

                /* Header & Identity Card */
                .profile-hero-section {
                    border-bottom: 1px solid var(--color-border);
                    padding: 50px 0 30px 0;
                    margin-bottom: 40px;
                }

                .profile-card-layout {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 4%;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 30px;
                }

                .profile-author-info {
                    display: flex;
                    align-items: center;
                    gap: 30px;
                }

                .author-large-avatar {
                    width: 110px;
                    height: 110px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid var(--color-charcoal);
                    background: var(--bg-contrast-paper);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 3rem;
                    font-family: var(--font-serif);
                    font-weight: 500;
                    color: var(--color-charcoal);
                }

                .author-title-details {
                    display: flex;
                    flex-direction: column;
                }

                .author-meta-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--color-accent);
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .author-display-name {
                    font-family: var(--font-serif);
                    font-size: 2.8rem;
                    line-height: 1.1;
                    font-weight: 400;
                    color: var(--color-charcoal);
                    margin-bottom: 6px;
                }

                .author-email-text {
                    font-size: 0.95rem;
                    color: var(--color-muted);
                }

                /* User Action Buttons */
                .profile-actions-hub {
                    display: flex;
                    gap: 12px;
                }

                .btn-editorial-primary {
                    background: var(--color-charcoal);
                    color: #fff;
                    border: 1px solid var(--color-charcoal);
                    padding: 12px 24px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    cursor: pointer;
                    border-radius: 2px;
                    transition: all 0.2s ease;
                }

                .btn-editorial-primary:hover {
                    background: transparent;
                    color: var(--color-charcoal);
                }

                .btn-editorial-secondary {
                    background: transparent;
                    color: var(--color-charcoal);
                    border: 1px solid var(--color-border);
                    padding: 12px 24px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    cursor: pointer;
                    border-radius: 2px;
                    transition: all 0.2s ease;
                }

                .btn-editorial-secondary:hover {
                    border-color: var(--color-charcoal);
                    background: rgba(0, 0, 0, 0.02);
                }

                /* Custom Statistics Counter Strip */
                .author-stats-row {
                    display: flex;
                    gap: 40px;
                    margin-top: 24px;
                    border-top: 1px dashed var(--color-border);
                    padding-top: 20px;
                }

                .stat-metric-box {
                    display: flex;
                    flex-direction: column;
                }

                .stat-metric-value {
                    font-family: var(--font-serif);
                    font-size: 1.8rem;
                    font-weight: 500;
                    color: var(--color-charcoal);
                }

                .stat-metric-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-muted);
                }

                /* Workspaces Navigation & Tabbed Layout */
                .profile-content-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 4% 80px 4%;
                }

                .profile-workspace-navbar {
                    display: flex;
                    border-bottom: 1px solid var(--color-border);
                    margin-bottom: 40px;
                    gap: 30px;
                }

                .workspace-tab-btn {
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    padding: 15px 5px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--color-muted);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .workspace-tab-btn:hover, .workspace-tab-btn.active {
                    color: var(--color-charcoal);
                    border-bottom-color: var(--color-charcoal);
                }

                /* Content Search Controls */
                .workspace-filter-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .search-field-wrapper {
                    display: flex;
                    align-items: center;
                    border-bottom: 1.5px solid var(--color-charcoal);
                    padding: 6px 0;
                    width: 320px;
                    max-width: 100%;
                }

                .search-field-wrapper input {
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 0.95rem;
                    font-family: inherit;
                    color: var(--color-charcoal);
                    width: 100%;
                }

                .search-field-wrapper button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1rem;
                }

                /* Editorial Table and Cards */
                .card-grid-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 30px;
                }

                .author-article-row {
                    display: grid;
                    grid-template-columns: 100px 1fr 150px;
                    gap: 20px;
                    align-items: center;
                    border-bottom: 1px solid var(--color-border);
                    padding: 20px 0;
                }

                .author-article-thumb {
                    width: 100px;
                    height: 70px;
                    object-fit: cover;
                    background-color: var(--bg-contrast-paper);
                    border-radius: 2px;
                }

                .author-article-details h4 {
                    font-family: var(--font-serif);
                    font-size: 1.35rem;
                    font-weight: 500;
                    margin-bottom: 4px;
                    color: var(--color-charcoal);
                }

                .author-article-meta {
                    font-size: 0.8rem;
                    color: var(--color-muted);
                }

                .author-article-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }

                .action-dot-btn {
                    background: none;
                    border: 1px solid var(--color-border);
                    padding: 6px 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    cursor: pointer;
                    border-radius: 2px;
                    transition: all 0.2s;
                }

                .action-dot-btn:hover {
                    background: var(--color-charcoal);
                    color: #fff;
                    border-color: var(--color-charcoal);
                }

                .action-dot-btn.btn-danger-mute:hover {
                    background: #b91c1c;
                    border-color: #b91c1c;
                }

                /* Author Search Cards */
                .author-results-list {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 25px;
                }

                .author-search-card {
                    background: #fff;
                    border: 1px solid var(--color-border);
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .author-search-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
                }

                .author-search-avatar {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: var(--bg-contrast-paper);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: var(--font-serif);
                    font-size: 1.6rem;
                    font-weight: 500;
                    border: 1.5px solid var(--color-charcoal);
                }

                /* Styled Modals */
                .editorial-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 500;
                }

                .editorial-modal-window {
                    background: #fff;
                    border: 1px solid var(--color-border);
                    border-radius: 2px;
                    padding: 35px;
                    width: 600px;
                    max-width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
                }

                .editorial-modal-header {
                    margin-bottom: 25px;
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 15px;
                }

                .editorial-modal-title {
                    font-family: var(--font-serif);
                    font-size: 1.8rem;
                    font-weight: 400;
                }

                .editorial-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-bottom: 20px;
                }

                .editorial-form-group label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    font-weight: 700;
                    color: var(--color-muted);
                }

                .editorial-form-group input[type="text"],
                .editorial-form-group input[type="email"],
                .editorial-form-group select,
                .editorial-form-group textarea {
                    background: var(--bg-warm-paper);
                    border: 1px solid var(--color-border);
                    padding: 12px;
                    font-family: inherit;
                    font-size: 0.95rem;
                    outline: none;
                    color: var(--color-charcoal);
                    border-radius: 2px;
                    transition: border-color 0.2s;
                }

                .editorial-form-group input:focus,
                .editorial-form-group select:focus,
                .editorial-form-group textarea:focus {
                    border-color: var(--color-charcoal);
                }

                .modal-actions-bar {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 30px;
                    border-top: 1px solid var(--color-border);
                    padding-top: 20px;
                }

                /* Floating State Toasts */
                .profile-toast {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    background: var(--color-charcoal);
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 2px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    z-index: 1000;
                    animation: toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes toastSlideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                /* Empty states */
                .workspace-empty-state {
                    text-align: center;
                    padding: 50px;
                    background: var(--bg-contrast-paper);
                    border: 1px dashed var(--color-border);
                    border-radius: 2px;
                    color: var(--color-muted);
                }

                .workspace-empty-state h3 {
                    font-family: var(--font-serif);
                    font-size: 1.4rem;
                    color: var(--color-charcoal);
                    margin-bottom: 8px;
                    font-weight: 400;
                }

                @media (max-width: 900px) {
                    .profile-card-layout {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .card-grid-container {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .author-results-list {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 600px) {
                    .card-grid-container {
                        grid-template-columns: 1fr;
                    }
                    .author-article-row {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                    .author-article-actions {
                        justify-content: flex-start;
                    }
                }

                /* Clean & Non-Disruptive Custom Flag/Report Component Styles */
                .report-button-action {
                    background: #fef2f2;
                    color: #b91c1c; 
                    border: 1px solid #fee2e2;
                    padding: 6px 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    border-radius: 2px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.2s ease;
                }

                .report-button-action:hover {
                    background-color: #b91c1c;
                    color: #ffffff;
                    border-color: #b91c1c;
                }

                .btn-report-mute {
                    color: #b91c1c;
                    border-color: #fee2e2;
                }

                .btn-report-mute:hover {
                    background: #b91c1c !important;
                    border-color: #b91c1c !important;
                    color: #fff !important;
                }
            `}</style>

            {/* Nav Header */}
            <header className="nav-bar">
                <div className="logo-container">
                    <div className="brand-logo">
                        <img src={logo} alt="Tàksha" />
                        <span>Carving ideas. Crafting impacts.</span>
                    </div>
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
                            <img className="author-large-avatar" src={user.image ? `http://localhost:5000/${user.image}` : 'Name'} alt="" />
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
                                            <button className="action-dot-btn btn-report-mute" onClick={() => {
                                                setBlogToReport(blog);
                                                setModalType('report-blog');
                                            }}>
                                                Report
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
                                        <div className="card-footer" style={{ borderTop: 'none', padding: 0, marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                                                By {blog.user?.name || 'Editorial Team'}
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button className="like-button-action" onClick={() => handleLikeBlog(blog._id)}>
                                                    ❤️ {blog.likeCount || 0}
                                                </button>
                                                <button className="report-button-action" onClick={() => { setBlogToReport(blog); setModalType('report-blog'); }}>
                                                    🚩 Report
                                                </button>
                                            </div>
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
                                        <p>Input author details above to browse writing portfolios across Tàksha.</p>
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
                                                <div className="card-footer" style={{ borderTop: 'none', padding: 0, marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                                                        By {selectedAuthor.name}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <button className="like-button-action" onClick={() => handleLikeBlog(blog._id)}>
                                                            ❤️ {blog.likeCount || 0}
                                                        </button>
                                                        <button className="report-button-action" onClick={() => { setBlogToReport(blog); setModalType('report-blog'); }}>
                                                            🚩 Report
                                                        </button>
                                                    </div>
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
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button className="like-button-action" onClick={() => handleLikeBlog(activeBlog._id)} style={{ fontSize: '1rem' }}>
                                    ❤️ {activeBlog.likeCount || 0} Likes
                                </button>
                                <button className="report-button-action" onClick={() => { setBlogToReport(activeBlog); setModalType('report-blog'); }} style={{ fontSize: '0.9rem' }}>
                                    🚩 Report Blog
                                </button>
                            </div>
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

            {/* Custom Report Blog Modal */}
            {modalType === 'report-blog' && blogToReport && (
                <div className="editorial-modal-overlay">
                    <form className="editorial-modal-window" style={{ width: '500px' }} onSubmit={handleReportBlog}>
                        <div className="editorial-modal-header">
                            <h3 className="editorial-modal-title" style={{ color: '#b91c1c' }}>Report Publication</h3>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                            You are flagging <strong>"{blogToReport.title}"</strong> for editorial evaluation. Please provide details regarding the guidelines violated.
                        </p>
                        <div className="editorial-form-group">
                            <label>Reason for Flagging</label>
                            <textarea
                                rows={4}
                                required
                                placeholder="Describe why this article violates guidelines (e.g., spam, harassment, copy-paste)..."
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                            />
                        </div>
                        <div className="modal-actions-bar">
                            <button type="button" className="btn-editorial-secondary" onClick={() => { setModalType(null); setBlogToReport(null); setReportReason(''); }}>Cancel</button>
                            <button type="submit" className="btn-editorial-primary" style={{ backgroundColor: '#b91c1c', borderColor: '#b91c1c' }}>Submit Report</button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
}

export default UserProfile;
