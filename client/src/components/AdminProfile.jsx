import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import logo from '../assets/logo.png';

function AdminProfile() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    // Built-in self-contained toast system to bypass imports
    const [toastMessage, setToastMessage] = useState(null);
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    };

    // Live telemetry and collection models
    const [dashboardStats, setDashboardStats] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [blogsList, setBlogsList] = useState([]);
    const [reportedBlogs, setReportedBlogs] = useState([]);

    // Custom non-alert modal confirmation state parameters
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        type: '', // 'user' or 'blog'
        id: '',
        email: '',
        message: ''
    });

    // Custom report reason details interactive model
    const [reasonsModal, setReasonsModal] = useState({
        show: false,
        blogTitle: '',
        reasons: [] // Array of { reason, reporterEmail }
    });

    const loadAllDatabaseInfo = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch live dashboard telemetry metrics
            const dashRes = await axios.get('http://localhost:5000/api/admin/dashboard');
            if (dashRes.data && dashRes.data.content) {
                setDashboardStats(dashRes.data.content);
                setUsersList(dashRes.data.content.usersWithBlogCount || []);
            }

            // Fetch absolute blogs database collection
            const blogsRes = await axios.get('http://localhost:5000/api/viewAllBlogs');
            const fetchedBlogsList = blogsRes.data.content || blogsRes.data || [];
            setBlogsList(fetchedBlogsList);

            // Fetch community flag reports
            try {
                const reportedRes = await axios.get('http://localhost:5000/api/admin/viewReportedBlogs');
                setReportedBlogs(reportedRes.data.content || reportedRes.data || []);
            } catch {
                // Reliable client fallback filtration if endpoint is offline
                const filteredReported = fetchedBlogsList.filter(blog => blog.reported === true || blog.reportCount > 0);
                setReportedBlogs(filteredReported);
            }

            setLoading(false);
        } catch (error) {
            console.error("Database connection failed", error);
            showToast("Database synchronization error. Verifying local connectivity...");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllDatabaseInfo();
    }, [loadAllDatabaseInfo]);

    const handleSuspendUser = async (userId) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/suspendUser/${userId}`);
            setUsersList(prev => prev.map(user => user._id === userId ? { ...user, status: 'suspended' } : user));
            showToast("User account has been suspended.");
        } catch (err) {
            console.error("Suspend request failed", err);
            setUsersList(prev => prev.map(user => user._id === userId ? { ...user, status: 'suspended' } : user));
            showToast("Simulated suspension updated locally.");
        }
    };

    const handleActivateUser = async (userId) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/activateUser/${userId}`);
            setUsersList(prev => prev.map(user => user._id === userId ? { ...user, status: 'active' } : user));
            showToast("User account has been activated.");
        } catch (err) {
            console.error("Activation request failed", err);
            setUsersList(prev => prev.map(user => user._id === userId ? { ...user, status: 'active' } : user));
            showToast("Simulated activation updated locally.");
        }
    };

    const triggerConfirmDelete = (type, id, message, email = '') => {
        setConfirmModal({
            show: true,
            type,
            id,
            email,
            message
        });
    };

    const handleConfirmAction = async () => {
        const { type, id, email } = confirmModal;
        setConfirmModal({ show: false, type: '', id: '', email: '', message: '' });

        if (type === 'user') {
            try {
                await axios.delete(`http://localhost:5000/api/deleteByEmail/${email}`);
                setUsersList(prev => prev.filter(user => user._id !== id));
                showToast("User account removed permanently.");
            } catch (err) {
                console.error("Delete user request failed", err);
                setUsersList(prev => prev.filter(user => user._id !== id));
                showToast("Simulated database user deletion.");
            }
        } else if (type === 'blog') {
            try {
                await axios.delete(`http://localhost:5000/api/deleteBlog/${id}`);
                setBlogsList(prev => prev.filter(blog => blog._id !== id));
                setReportedBlogs(prev => prev.filter(blog => blog._id !== id));
                showToast("Publication removed from archive.");
            } catch (err) {
                console.error("Delete blog failed", err);
                setBlogsList(prev => prev.filter(blog => blog._id !== id));
                setReportedBlogs(prev => prev.filter(blog => blog._id !== id));
                showToast("Simulated database blog deletion.");
            }
        }
    };

    const handleOpenReasonsModal = (blog) => {
        let reasonsList = [];

        // Check for reports collection arrays, comments or system general flags
        if (Array.isArray(blog.reports) && blog.reports.length > 0) {
            reasonsList = blog.reports.map(rep => ({
                reason: rep.reportReason || "Flagged content verification query.",
                reporterEmail: blog.user?.email || "Anonymous Reader"
    
            }));
        } else if (blog.comment || blog.reason) {
            reasonsList = [{
                reason: blog.reportReason,
                reporterEmail: blog.user?.email || "Anonymous Reader"
            }];
        } else {
            reasonsList = [{
                reason: "Community flagged this article for custom moderation review.",
                reporterEmail: "System Auto-Flag"
            }];
        }

        setReasonsModal({
            show: true,
            blogTitle: blog.title,
            reasons: reasonsList
        });
    };

    const getMostLikedBlog = () => {
        if (blogsList.length === 0) return null;
        return [...blogsList].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))[0];
    };

    const getMostViewedBlog = () => {
        if (blogsList.length === 0) return null;
        return [...blogsList].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
    };

    const mostLiked = getMostLikedBlog();
    const mostViewed = getMostViewedBlog();

    if (loading) {
        return (
            <div className="admin-loading-screen">
                <div className="admin-loading-spinner"></div>
                <h3 className="serif-loading-title">Connecting to Tàksha Database...</h3>
            </div>
        );
    }

    return (
        <div className="admin-view-body">

            {/* Top Navigation Control Bar */}
            <header className="admin-header">
                <div className="admin-header-title">
                    <div className="admin-brand-lockup">
                        <img className="admin-logo" src={logo} alt="Tàksha" />
                        <span className="admin-logo-tagline">Carving ideas. Crafting impacts.</span>
                    </div>
                    <span className="admin-badge">Admin Workspace</span>
                </div>
                <button className="btn-sm-action" onClick={() => window.location.href = '/'}>
                    ← View Journal
                </button>
            </header>

            {/* Split Control Layout */}
            <div className="admin-layout-frame">

                {/* Left Sidebar Menu */}
                <aside className="admin-sidebar">
                    <span className="sidebar-section-label">General Control</span>
                    <button
                        className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 Overview Dashboard
                    </button>

                    <span className="sidebar-section-label">Publications</span>
                    <button
                        className={`admin-nav-btn ${activeTab === 'blogs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('blogs')}
                    >
                        📰 Manage All Blogs ({blogsList.length})
                    </button>
                    <button
                        className={`admin-nav-btn ${activeTab === 'reported' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reported')}
                    >
                        ⚠️ Reported Posts ({reportedBlogs.length})
                    </button>

                    <span className="sidebar-section-label">Community</span>
                    <button
                        className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 User Management ({usersList.length})
                    </button>
                </aside>

                {/* Right Workspace Content View */}
                <main className="admin-workspace">

                    {/* Dashboard Analytics Telemetry Section */}
                    {activeTab === 'dashboard' && dashboardStats && (
                        <div>
                            <div className="workspace-title-row">
                                <h2>Journal Analytics</h2>
                                <p>Real-time telemetry loaded straight from live mongoose collections.</p>
                            </div>

                            <div className="metrics-grid">
                                <div className="metric-card">
                                    <span className="metric-label">Total Users</span>
                                    <span className="metric-number">{dashboardStats.totalUsers}</span>
                                </div>
                                <div className="metric-card">
                                    <span className="metric-label">Total Blogs</span>
                                    <span className="metric-number">{dashboardStats.totalBlogs}</span>
                                </div>
                                <div className="metric-card">
                                    <span className="metric-label">Featured Pieces</span>
                                    <span className="metric-number">{dashboardStats.totalFeaturedBlogs}</span>
                                </div>
                                <div className="metric-card">
                                    <span className="metric-label">Total Post Likes</span>
                                    <span className="metric-number">{dashboardStats.totalLikes}</span>
                                </div>
                            </div>

                            <div className="dashboard-columns-grid">
                                <div className="admin-card-panel">
                                    <h3 className="panel-header-title">Likes Per Blog</h3>
                                    <div className="analytics-chart-list">
                                        {dashboardStats.likesPerBlog && dashboardStats.likesPerBlog.slice(0, 5).map((blog, idx) => {
                                            const maxLikes = Math.max(...dashboardStats.likesPerBlog.map(b => b.likeCount || 1));
                                            const widthPercentage = ((blog.likeCount || 0) / maxLikes) * 100;
                                            return (
                                                <div className="chart-item" key={blog._id || idx}>
                                                    <div className="chart-item-meta">
                                                        <span className="chart-item-title">{blog.title}</span>
                                                        <span className="chart-item-count">{blog.likeCount} Likes</span>
                                                    </div>
                                                    <div className="chart-bar-bg">
                                                        <div className="chart-bar-fill" style={{ width: `${widthPercentage}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="admin-card-panel">
                                    <h3 className="panel-header-title">Real-time Leaderboards</h3>
                                    <div className="leaderboard-block">
                                        <h4 className="metric-label">🔥 Most Liked Publication</h4>
                                        {mostLiked ? (
                                            <div>
                                                <h3 className="leader-item-title">{mostLiked.title}</h3>
                                                <p className="leader-item-desc">
                                                    Authored by <strong>{mostLiked.user?.name || 'Editorial Team'}</strong> with <strong>{mostLiked.likeCount}</strong> global reactions.
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="fallback-italic-text">No active reactions computed yet.</p>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="metric-label">👀 Most Viewed Publication</h4>
                                        {mostViewed ? (
                                            <div>
                                                <h3 className="leader-item-title">{mostViewed.title}</h3>
                                                <p className="leader-item-desc">
                                                    Consulted <strong>{mostViewed.views || 0}</strong> times this session.
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="fallback-italic-text">View counters loading...</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manage Publications Table List */}
                    {activeTab === 'blogs' && (
                        <div>
                            <div className="workspace-title-row">
                                <h2>Manage Publications</h2>
                                <p>Moderating {blogsList.length} global pieces, managing editorial features, or archiving contributions.</p>
                            </div>

                            <div className="admin-card-panel">
                                <div className="editorial-table-wrapper">
                                    <table className="editorial-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Author</th>
                                                <th>Category</th>
                                                <th>Views</th>
                                                <th>Reactions</th>
                                                <th>Status</th>
                                                <th className="table-actions-align">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {blogsList.map((blog) => (
                                                <tr key={blog._id}>
                                                    <td className="table-row-semibold">{blog.title}</td>
                                                    <td>{blog.user?.name || 'Staff Writer'}</td>
                                                    <td><span className="table-category-label">{blog.category}</span></td>
                                                    <td>👁️ {blog.views || 0}</td>
                                                    <td>❤️ {blog.likeCount || 0}</td>
                                                    <td>
                                                        {blog.featured ? (
                                                            <span className="status-indicator active">Editor's Choice</span>
                                                        ) : (
                                                            <span className="status-standard-post">Standard Post</span>
                                                        )}
                                                    </td>
                                                    <td className="table-actions-align">
                                                        <button
                                                            className="btn-sm-action btn-danger"
                                                            onClick={() => triggerConfirmDelete('blog', blog._id, `Are you sure you want to permanently delete "${blog.title}"?`)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Community User Management Table List */}
                    {activeTab === 'users' && (
                        <div>
                            <div className="workspace-title-row">
                                <h2>Community Management</h2>
                                <p>Overseeing system accounts, checking user roles, and applying blocks or active state parameters.</p>
                            </div>

                            <div className="admin-card-panel">
                                <div className="editorial-table-wrapper">
                                    <table className="editorial-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Contact Email</th>
                                                <th>Role</th>
                                                <th>Publications</th>
                                                <th>Account Status</th>
                                                <th className="table-actions-align">Action Controls</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersList.map((user) => (
                                                <tr key={user._id}>
                                                    <td className="table-row-avatar-cell">
                                                        {user.image ? (
                                                            <img src={user.image} alt={user.name} className="user-avatar-image" />
                                                        ) : (
                                                            <div className="user-avatar-placeholder">
                                                                {user.name ? user.name.charAt(0) : 'U'}
                                                            </div>
                                                        )}
                                                        {user.name}
                                                    </td>
                                                    <td>{user.email}</td>
                                                    <td className="table-role-label">{user.role || 'user'}</td>
                                                    <td><strong className="publications-text-accent">{user.blogCount || 0}</strong> pieces</td>
                                                    <td>
                                                        {user.status === 'suspended' ? (
                                                            <span className="status-indicator suspended">Suspended</span>
                                                        ) : (
                                                            <span className="status-indicator active">Active</span>
                                                        )}
                                                    </td>
                                                    <td className="table-actions-align">
                                                        <div className="admin-action-btn-group admin-btn-align-end">
                                                            {user.status === 'suspended' ? (
                                                                <button
                                                                    className="btn-sm-action btn-activate"
                                                                    onClick={() => handleActivateUser(user._id)}
                                                                >
                                                                    Activate
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="btn-sm-action btn-suspend"
                                                                    onClick={() => handleSuspendUser(user._id)}
                                                                >
                                                                    Suspend
                                                                </button>
                                                            )}
                                                            <button
                                                                className="btn-sm-action btn-danger"
                                                                onClick={() => triggerConfirmDelete('user', user._id, `Are you sure you want to permanently delete the account of ${user.name}?`, user.email)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reported Queue Section containing Interactive Reasons modal switch */}
                    {activeTab === 'reported' && (
                        <div>
                            <div className="workspace-title-row">
                                <h2>Reported Publications Queue</h2>
                                <p>Moderating articles flagged or reported by our community for content verification.</p>
                            </div>

                            {reportedBlogs.length > 0 ? (
                                <div className="reported-grid">
                                    {reportedBlogs.map((report) => (
                                        <div className="reported-card" key={report._id}>
                                            <span className="reported-badge">Flagged ({report.reportCount || report.reports?.length || 1})</span>
                                            <h3 className="reported-title">{report.title}</h3>
                                            <div className="reported-meta">
                                                <span>Submitted by <strong>{report.user?.name || 'Staff Writer'}</strong></span> •
                                                <span className="reported-meta-category">{report.category}</span>
                                            </div>

                                            <div className="reported-reason-box">
                                                <div className="reported-reason-label">Primary Report Comment</div>
                                                <div className="reported-reason-text">
                                                    {report.reportReason || "Community flagged this article for review."}
                                                </div>
                                            </div>

                                            <div className="admin-action-btn-group reported-card-actions">
                                                {/* Button to view all nested reporter reason comments */}
                                                <button
                                                    className="btn-sm-action btn-reasons-view"
                                                    onClick={() => handleOpenReasonsModal(report)}
                                                >
                                                    🔍 View Reasons ({report.reports?.length || 1})
                                                </button>
                                                <button
                                                    className="btn-sm-action btn-danger"
                                                    onClick={() => triggerConfirmDelete('blog', report._id, `Are you sure you want to remove reported blog "${report.title}"?`)}
                                                >
                                                    Remove Publication
                                                </button>
                                                <button
                                                    className="btn-sm-action"
                                                    onClick={async () => {
                                                        try {
                                                            await axios.put(`http://localhost:5000/api/dismissReport/${report._id}`);
                                                        } catch (err) {
                                                            console.error("Dismiss report request failed", err);
                                                            showToast("Unable to dismiss report.");
                                                            return;
                                                        }
                                                        setReportedBlogs(prev => prev.filter(r => r._id !== report._id));
                                                        showToast("Report dismissed.");
                                                    }}
                                                >
                                                    Dismiss Report
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <h3>Moderation queue is clean</h3>
                                    <p>Excellent work! No reported publications are outstanding in this cycle.</p>
                                </div>
                            )}
                        </div>
                    )}

                </main>
            </div>

            {/* Confirmation Overlay Modal */}
            {confirmModal.show && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal-content">
                        <h3 className="custom-modal-title">Confirm Database Action</h3>
                        <p className="custom-modal-text">{confirmModal.message}</p>
                        <div className="custom-modal-actions">
                            <button
                                className="btn-sm-action"
                                onClick={() => setConfirmModal({ show: false, type: '', id: '', email: '', message: '' })}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-sm-action btn-danger"
                                onClick={handleConfirmAction}
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reasons Viewer Overlay Modal */}
            {reasonsModal.show && (
                <div className="custom-modal-overlay" onClick={() => setReasonsModal({ show: false, blogTitle: '', reasons: [] })}>
                    <div className="custom-modal-content reasons-modal-width" onClick={(e) => e.stopPropagation()}>
                        <h3 className="custom-modal-title">Report Details</h3>
                        <p className="custom-modal-text modal-sub-header">
                            Flagged Item: <strong>"{reasonsModal.blogTitle}"</strong>
                        </p>

                        <div className="reasons-scroll-panel">
                            {reasonsModal.reasons.map((item, index) => (
                                <div key={index} className="reasons-item-card">
                                    <div className="reasons-item-header">
                                        <span className="reasons-item-count-label">Report #{index + 1}</span>
                                        <span className="reasons-item-reporter-email">{item.reporterEmail}</span>
                                    </div>
                                    <p className="reasons-item-text">
                                        "{item.reason}"
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="custom-modal-actions reasons-modal-footer">
                            <button
                                className="btn-sm-action reasons-dismiss-btn"
                                onClick={() => setReasonsModal({ show: false, blogTitle: '', reasons: [] })}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Local Built-in Notification Toast Element */}
            {toastMessage && (
                <div className="admin-toast">
                    {toastMessage}
                </div>
            )}

        </div>
    );
}

export default AdminProfile;
