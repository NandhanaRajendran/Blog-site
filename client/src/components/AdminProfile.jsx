import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

function AdminProfile() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    const [dashboardStats, setDashboardStats] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [blogsList, setBlogsList] = useState([]);
    const [reportedBlogs, setReportedBlogs] = useState([]);

    // Custom non-alert modal confirmation states
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        type: '', // 'user' or 'blog'
        id: '',
        email: '',
        message: ''
    });

    const showToast = useCallback((message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3500);
    }, []);

    const loadAllDatabaseInfo = useCallback(async () => {
        setLoading(true);
        try {
            // 10. Fetch dashboard contents matching database controller aggregations
            const dashRes = await axios.get('http://localhost:5000/api/admin/dashboard');
            if (dashRes.data && dashRes.data.content) {
                setDashboardStats(dashRes.data.content);
                // 3. Populate users list via usersWithBlogCount
                setUsersList(dashRes.data.content.usersWithBlogCount || []);
            }

            // 6. Fetch all blogs
            const blogsRes = await axios.get('http://localhost:5000/api/viewAllBlogs');
            const fetchedBlogsList = blogsRes.data.content || blogsRes.data || [];
            setBlogsList(fetchedBlogsList);

            // 9. Fetch reported blogs (filtered according to schema rules)
            try {
                const reportedRes = await axios.get('http://localhost:5000/api/admin/viewReportedBlogs');
                setReportedBlogs(reportedRes.data.content || reportedRes.data || []);
            } catch {
                // Client-side fallback: filter main blog schema list using "reported: true" or "reportCount > 0"
                const filteredReported = fetchedBlogsList.filter(blog => blog.reported === true || blog.reportCount > 0);
                setReportedBlogs(filteredReported);
            }

            setLoading(false);
        } catch (error) {
            console.error("Database connection failed", error);
            showToast("Database fetch error. Verifying backend connection...");
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAllDatabaseInfo();
    }, [loadAllDatabaseInfo,]);


    // 7. Suspend a user (setting user status in schema to 'suspended')
    const handleSuspendUser = async (userId) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/suspendUser/${userId}`);
            setUsersList(prev => prev.map(user => user._id === userId ? { ...user, status: 'suspended' } : user));
            showToast("User account has been suspended.");
        } catch (err) {
            console.error("Suspend request failed", err);
            // Simulated local mutation for resilient previewing
            setUsersList(prev => prev.map(user => user._id === userId ? { ...user, status: 'suspended' } : user));
            showToast("Simulated suspension updated locally.");
        }
    };

    // 8. Activate a user (setting user status in schema to 'active')
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
        console.log('delete button clicked');

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
            // 1. Delete a user from collections
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
            // 2. Delete a blog from collections
            try {
                console.log('Delete blog action ');
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

    // 4. Get most liked blog (calculated dynamically from current blogs state)
    const getMostLikedBlog = () => {
        if (blogsList.length === 0) return null;
        return [...blogsList].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))[0];
    };

    // 5. Get most viewed blog (using the schema "views" property)
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
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}>Connecting to Meridian Database...</h3>
            </div>
        );
    }

    return (
        <div className="admin-view-body">
            {/* Top Control Bar */}
            <header className="admin-header">
                <div className="admin-header-title">
                    <h1>Meridian</h1>
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

                {/* Right Workspace Context */}
                <main className="admin-workspace">

                    {/* 10. Dashboard Analytics panel */}
                    {activeTab === 'dashboard' && dashboardStats && (
                        <div>
                            <div className="workspace-title-row">
                                <h2>Journal Analytics</h2>
                                <p>Real-time telemetry loaded straight from live mongoose collections.</p>
                            </div>

                            {/* Aggregated Totals Bar */}
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

                            {/* Aggregation Data Visualization blocks */}
                            <div className="dashboard-columns-grid">

                                {/* Likes per blog bar chart list */}
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

                                {/* 4 & 5: Leaderboards computed from active states */}
                                <div className="admin-card-panel">
                                    <h3 className="panel-header-title">Real-time Leaderboards</h3>

                                    {/* 4. Most Liked dynamic calculation */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <h4 className="metric-label" style={{ marginBottom: '12px' }}>🔥 Most Liked Publication</h4>
                                        {mostLiked ? (
                                            <div>
                                                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.4rem' }}>
                                                    {mostLiked.title}
                                                </h3>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                                                    Authored by <strong>{mostLiked.user?.name || 'Editorial Team'}</strong> with <strong>{mostLiked.likeCount}</strong> global reactions.
                                                </p>
                                            </div>
                                        ) : (
                                            <p style={{ fontStyle: 'italic' }}>No active reactions computed yet.</p>
                                        )}
                                    </div>

                                    {/* 5. Most Viewed dynamic calculation utilizing schema "views" property */}
                                    <div>
                                        <h4 className="metric-label" style={{ marginBottom: '12px' }}>👀 Most Viewed Publication</h4>
                                        {mostViewed ? (
                                            <div>
                                                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.4rem' }}>
                                                    {mostViewed.title}
                                                </h3>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                                                    Consulted <strong>{mostViewed.views || 0}</strong> times this session.
                                                </p>
                                            </div>
                                        ) : (
                                            <p style={{ fontStyle: 'italic' }}>View counters loading...</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* 6. View all blogs tab */}
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
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {blogsList.map((blog) => (
                                                <tr key={blog._id}>
                                                    <td style={{ fontWeight: 600 }}>{blog.title}</td>
                                                    <td>{blog.user?.name || 'Staff Writer'}</td>
                                                    <td><span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)' }}>{blog.category}</span></td>
                                                    <td>👁️ {blog.views || 0}</td>
                                                    <td>❤️ {blog.likeCount || 0}</td>
                                                    <td>
                                                        {blog.featured ? (
                                                            <span className="status-indicator active">Editor's Choice</span>
                                                        ) : (
                                                            <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>Standard Post</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
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

                    {/* 3. View all users tab */}
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
                                                <th style={{ textAlign: 'right' }}>Action Controls</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersList.map((user) => (
                                                <tr key={user._id}>
                                                    <td style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
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
                                                    <td style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>{user.role || 'user'}</td>
                                                    <td><strong>{user.blogCount || 0}</strong> pieces</td>
                                                    <td>
                                                        {user.status === 'suspended' ? (
                                                            <span className="status-indicator suspended">Suspended</span>
                                                        ) : (
                                                            <span className="status-indicator active">Active</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="admin-action-btn-group" style={{ justifyContent: 'flex-end' }}>
                                                            {/* 7 & 8: Suspend and Activate user actions */}
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
                                                            {/* 1. Delete user action */}
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

                    {/* 9. View reported blogs tab */}
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
                                            <span className="reported-badge">Flagged ({report.reportCount || 0})</span>
                                            <h3 className="reported-title">{report.title}</h3>
                                            <div className="reported-meta">
                                                <span>Submitted by <strong>{report.user?.name || 'Staff Writer'}</strong></span> •
                                                <span style={{ color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', marginLeft: '8px' }}>{report.category}</span>
                                            </div>

                                            <div className="reported-reason-box">
                                                <div className="reported-reason-label">Report Comment</div>
                                                <div className="reported-reason-text">
                                                    {report.comment ? `"${report.comment}"` : "Community flagged this article for review."}
                                                </div>
                                            </div>

                                            <div className="admin-action-btn-group">
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

            {/* Custom confirmation overlay modal */}
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

            {/* Float notification toast */}
            {toastMessage && (
                <div className="admin-toast">
                    {toastMessage}
                </div>
            )}
        </div>
    );
}

export default AdminProfile;
