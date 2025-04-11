import React, { useState, useEffect } from "react";
import { logout, getIssues, getCourses } from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaTable,
  FaClipboardList,
  FaTools,
  FaBell,
  FaBook,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaInfoCircle,
  FaTag,
  FaEye,
  FaUserGraduate,
  FaFileAlt,
  FaCheckCircle,
  FaRedo,
  FaPencilAlt,
  FaSearch,
  FaCog
} from "react-icons/fa";
import { BsCheck2Circle, BsClockHistory, BsHourglassSplit } from "react-icons/bs";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Badge from "@mui/material/Badge";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import axios from "axios";
import { Table, Modal, Button, Form, Badge as BootstrapBadge } from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import "./admin.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Lecturer = ({ user }) => {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");

  const open = Boolean(anchorEl);

  const fetchNotifications = async () => {
    try {
    const res = await axios.get("http://localhost:8000/api/notifications/");
    setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    }
  };

  // Get user initials for the avatar
  const getUserInitials = () => {
    if (!user) return "L";
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "L";
  };

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const id = open ? "notification-popper" : undefined;

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 16) return "Good afternoon";
      return "Good evening";
    };

    setGreeting(getGreeting());
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/dashboard");
  };

  // Menu items for the sidebar - simplified for lecturer
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTable /> },
    { id: "courses", label: "My Courses", icon: <FaBook /> },
    { id: "issues", label: "Assigned Issues", icon: <FaClipboardList /> },
    { id: "settings", label: "Settings", icon: <FaTools /> },
  ];

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  // Function to render the active content based on menu selection
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardContent user={user} />;
      case "courses":
        return <CoursesContent user={user} />;
      case "issues":
        return <Issues user={user} />;
      case "settings":
        return <SettingsContent user={user} />;
      default:
        return <DashboardContent user={user} />;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">Lecturer's Dashboard</div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? "active" : ""}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
          <div className="sidebar-divider"></div>
          <div className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon"><FaExclamationTriangle /></span>
            <span>Logout</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <h1 className="page-title">
            {menuItems.find((item) => item.id === activeMenu)?.label ||
              "Dashboard"}
          </h1>
          <div className="header-actions">
            {/* User Avatar */}
            <div className="user-avatar" title={user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username || "User"}>
              {getUserInitials()}
            </div>

            {/* Notification Button with Badge */}
            <button className="notification-btn" onClick={handleClick}>
              <Badge badgeContent={unreadCount} color="error">
                <FaBell size={20} />
              </Badge>
            </button>
            
            {/* MUI Popper for Notifications */}
            <Popper
              id={id}
              open={open}
              anchorEl={anchorEl}
              placement="bottom-end"
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Paper sx={{ p: 2, width: 250, boxShadow: 3 }}>
                  <Typography variant="h6">Notifications</Typography>
                  <List>
                    {notifications.length > 0 ? (
                      notifications.map((notif, index) => (
                        <React.Fragment key={notif.id}>
                          <ListItem disablePadding>
                            {notif.read ? (
                              <ListItemButton disabled>
                                <ListItemText 
                                  primary={notif.message} 
                                  sx={{ color: 'text.secondary' }}
                                />
                              </ListItemButton>
                            ) : (
                              <ListItemButton
                                onClick={() => handleNotificationClick(notif.id)}
                              >
                                <ListItemText primary={notif.message} />
                              </ListItemButton>
                            )}
                          </ListItem>
                          {index < notifications.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ textAlign: "center", mt: 2 }}
                      >
                        ✅ No new notifications
                      </Typography>
                    )}
                  </List>
                </Paper>
              </ClickAwayListener>
            </Popper>
          </div>
        </header>
        <h2 className="welcome">
          {greeting}, {user?.title || ''} {user?.first_name || ''} {user?.last_name || ''}
        </h2>
        <main className="content">{renderContent()}</main>
      </div>
    </div>
  );
};

// Dashboard content specific to lecturer
const DashboardContent = ({ user }) => {
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pendingIssues: 0,
    resolvedIssues: 0,
    inProgressIssues: 0
  });
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Data for the pie chart
  const chartData = {
    labels: ['Pending', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [stats.pendingIssues, stats.inProgressIssues, stats.resolvedIssues],
        backgroundColor: ['#ffc107', '#0d6efd', '#198754'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Get issue status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending':
        return <BsHourglassSplit className="me-1 text-warning" />;
      case 'InProgress':
        return <BsClockHistory className="me-1 text-primary" />;
      case 'Solved':
        return <BsCheck2Circle className="me-1 text-success" />;
      default:
        return <FaInfoCircle className="me-1" />;
    }
  };

  // View issue details
  const handleViewIssue = (issue) => {
    setSelectedIssue(issue);
    setShowDetailsModal(true);
  };
  
  useEffect(() => {
    const fetchAssignedIssues = async () => {
      setIsLoading(true);
      try {
        const allIssues = await getIssues();
        console.log("All issues:", allIssues);
        console.log("Current user:", user);
        
        // Try a direct API call to get lecturer-specific issues
        try {
          // This could be implemented on the backend for better performance
          const lecturerIssuesResponse = await fetch(`http://localhost:8000/api/issues/?assigned_to=${user.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });
          
          if (lecturerIssuesResponse.ok) {
            const lecturerIssuesData = await lecturerIssuesResponse.json();
            console.log("Direct API call for lecturer issues:", lecturerIssuesData);
            if (Array.isArray(lecturerIssuesData) && lecturerIssuesData.length > 0) {
              setAssignedIssues(lecturerIssuesData);
              
              // Calculate statistics
              setStats({
                totalAssigned: lecturerIssuesData.length,
                pendingIssues: lecturerIssuesData.filter(issue => issue.status === 'Pending').length,
                inProgressIssues: lecturerIssuesData.filter(issue => issue.status === 'InProgress').length,
                resolvedIssues: lecturerIssuesData.filter(issue => issue.status === 'Solved').length
              });
              
              setIsLoading(false);
              return; // Skip the filtering below if we got data from the API
            }
          }
        } catch (directApiError) {
          console.log("Direct API call failed, falling back to client-side filtering:", directApiError);
        }
        
        // Filter issues assigned to this lecturer - handle different possible response formats
        const lecturerIssues = allIssues.filter(issue => {
          // Check the assigned_to field structure and handle different formats
          if (!issue.assigned_to) return false;
          
          // For debugging - log the structure of assigned_to
          console.log("Issue ID:", issue.id, "assigned_to:", JSON.stringify(issue.assigned_to));
          
          // If assigned_to is an object with id
          if (typeof issue.assigned_to === 'object' && issue.assigned_to.id) {
            return issue.assigned_to.id.toString() === user.id.toString();
          }
          
          // If assigned_to is just the ID itself
          if (typeof issue.assigned_to === 'number' || typeof issue.assigned_to === 'string') {
            return issue.assigned_to.toString() === user.id.toString();
          }
          
          return false;
        });
        
        console.log("Filtered lecturer issues:", lecturerIssues);
        setAssignedIssues(lecturerIssues);
        
        // Calculate statistics
        setStats({
          totalAssigned: lecturerIssues.length,
          pendingIssues: lecturerIssues.filter(issue => issue.status === 'Pending').length,
          inProgressIssues: lecturerIssues.filter(issue => issue.status === 'InProgress').length,
          resolvedIssues: lecturerIssues.filter(issue => issue.status === 'Solved').length
        });
      } catch (error) {
        console.error("Error fetching assigned issues:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssignedIssues();
  }, [user.id]);

  const updateIssueStatus = async (issueId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/api/issues/${issueId}/update_status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        // Update the issue in the local state
        const updatedIssues = assignedIssues.map(issue => {
          if (issue.id === issueId) {
            return { ...issue, status: newStatus };
          }
          return issue;
        });
        
        setAssignedIssues(updatedIssues);
        
        // Update statistics
        setStats({
          totalAssigned: updatedIssues.length,
          pendingIssues: updatedIssues.filter(issue => issue.status === 'Pending').length,
          inProgressIssues: updatedIssues.filter(issue => issue.status === 'InProgress').length,
          resolvedIssues: updatedIssues.filter(issue => issue.status === 'Solved').length
        });
        
        // If in detail view, update the selected issue
        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue({...selectedIssue, status: newStatus});
        }
      }
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };
  
  // Get recent issues (last 5)
  const recentIssues = [...assignedIssues]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
  
  return (
  <div>
    <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="icon-box bg-primary">
                <FaClipboardList />
      </div>
              <div className="ms-3">
                <h6 className="card-subtitle text-muted">Total Assigned</h6>
                <h4 className="card-title mb-0">{stats.totalAssigned}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="icon-box bg-warning">
                <BsClockHistory />
              </div>
              <div className="ms-3">
                <h6 className="card-subtitle text-muted">In Progress</h6>
                <h4 className="card-title mb-0">{stats.inProgressIssues}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="icon-box bg-success">
                <BsCheck2Circle />
              </div>
              <div className="ms-3">
                <h6 className="card-subtitle text-muted">Resolved Issues</h6>
                <h4 className="card-title mb-0">{stats.resolvedIssues}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-md-7">
      <div className="card">
            <div className="card-header">
              <h5 className="mb-0"><FaClipboardList className="me-2" /> Recent Assigned Issues</h5>
      </div>
            <div className="card-body p-0">
              {isLoading ? (
                <div className="d-flex justify-content-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : recentIssues.length > 0 ? (
                <div className="issue-list">
                  {recentIssues.map(issue => (
                    <div className="issue-item p-3 border-bottom" key={issue.id}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-1">{issue.title}</h5>
                          <div className="d-flex align-items-center mb-2">
                            <span className="badge bg-secondary me-2">
                              <FaTag className="me-1" /> {issue.issue_type}
                            </span>
                            <small className="text-muted">
                              <FaUserGraduate className="me-1" /> {issue.student?.email || "N/A"}
                            </small>
                            <small className="text-muted ms-2">
                              <FaCalendarAlt className="me-1" /> {new Date(issue.created_at).toLocaleDateString()}
                            </small>
                          </div>
                          <small className="text-muted d-block mb-2">
                            <FaBook className="me-1" /> {issue.course?.course_name || "N/A"}
                          </small>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <span className={`badge mb-2 ${
                            issue.status === 'Pending' ? 'bg-warning' :
                            issue.status === 'InProgress' ? 'bg-primary' : 'bg-success'
                          }`}>
                            {getStatusIcon(issue.status)} {issue.status}
                          </span>
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            onClick={() => handleViewIssue(issue)}
                          >
                            <FaEye className="me-1" /> View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {assignedIssues.length > 5 && (
                    <div className="text-center p-3">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => document.querySelector('.nav-item[data-id="issues"]').click()}
                      >
                        View All Issues
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <FaClipboardList size={48} className="text-muted mb-3" />
                  <h5>No Assigned Issues</h5>
                  <p className="text-muted">No issues have been assigned to you yet.</p>
                  <div className="alert alert-info mx-auto" style={{ maxWidth: "80%" }}>
                    <small>
                      <strong>Note:</strong> Issues will appear here when an administrator assigns them to you.
                      <br />If you believe this is an error, please check with your administrator.
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-5">
      <div className="card">
            <div className="card-header">
              <h5 className="mb-0"><FaInfoCircle className="me-2" /> Issue Status</h5>
      </div>
            <div className="card-body">
              {!isLoading && stats.totalAssigned > 0 ? (
                <div style={{ height: '250px', position: 'relative' }}>
                  <Pie data={chartData} options={chartOptions} />
    </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted">No issues data available</p>
                </div>
              )}
              
              <div className="d-flex justify-content-around mt-3">
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <BsHourglassSplit className="text-warning me-1" />
                    <span>Pending</span>
                  </div>
                  <h4>{stats.pendingIssues}</h4>
                </div>
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <BsClockHistory className="text-primary me-1" />
                    <span>In Progress</span>
                  </div>
                  <h4>{stats.inProgressIssues}</h4>
                </div>
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <BsCheck2Circle className="text-success me-1" />
                    <span>Resolved</span>
                  </div>
                  <h4>{stats.resolvedIssues}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Issue Detail Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title><FaClipboardList className="me-2" /> Issue Details</Modal.Title>
        </Modal.Header>
        {selectedIssue && (
          <Modal.Body>
            <h3 className="mb-2">{selectedIssue.title}</h3>
            <div className="d-flex align-items-center mb-3">
              <span className={`badge me-2 ${
                selectedIssue.status === 'Pending' ? 'bg-warning' :
                selectedIssue.status === 'InProgress' ? 'bg-primary' : 'bg-success'
              }`}>
                {getStatusIcon(selectedIssue.status)} {selectedIssue.status}
              </span>
              <span className="badge bg-secondary me-2">
                <FaTag className="me-1" /> {selectedIssue.issue_type}
              </span>
              <small className="text-muted">
                <FaCalendarAlt className="me-1" /> Created: {new Date(selectedIssue.created_at).toLocaleString()}
              </small>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-light">
                    <h5 className="mb-0 small text-uppercase">Issue Information</h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th>Issue ID:</th>
                          <td>#{selectedIssue.id}</td>
                        </tr>
                        <tr>
                          <th>Course:</th>
                          <td>{selectedIssue.course?.course_name || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Course Code:</th>
                          <td>{selectedIssue.course?.course_code || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Date Created:</th>
                          <td>{new Date(selectedIssue.created_at).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-light">
                    <h5 className="mb-0 small text-uppercase">Student Information</h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th>Name:</th>
                          <td>
                            {selectedIssue.student ? (
                              `${selectedIssue.student.first_name} ${selectedIssue.student.last_name}`
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Email:</th>
                          <td>{selectedIssue.student?.email || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>Department:</th>
                          <td>{selectedIssue.course?.department?.department_name || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

    <div className="card">
              <div className="card-header bg-light">
                <h5 className="mb-0 small text-uppercase">Description</h5>
        </div>
              <div className="card-body">
                <p className="mb-0">
                  {selectedIssue.description || 'No description provided.'}
                </p>
        </div>
        </div>
            
            <div className="d-flex justify-content-end mt-3">
              {selectedIssue.status !== 'Solved' ? (
                <Button 
                  variant="success" 
                  onClick={() => {
                    updateIssueStatus(selectedIssue.id, 'Solved');
                    setShowDetailsModal(false);
                  }}
                >
                  <FaCheckCircle className="me-1" /> Mark as Solved
                </Button>
              ) : (
                <Button 
                  variant="warning" 
                  onClick={() => {
                    updateIssueStatus(selectedIssue.id, 'InProgress');
                    setShowDetailsModal(false);
                  }}
                >
                  <FaRedo className="me-1" /> Reopen Issue
                </Button>
              )}
      </div>
          </Modal.Body>
        )}
      </Modal>
  </div>
);
};

// Courses content
const CoursesContent = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        // In a real application, you would have an API to get courses assigned to this lecturer
        // For now, we'll just get all courses as a placeholder
        const allCourses = await getCourses();
        setCourses(allCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, [user.id]);
  
  return (
  <div>
    <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="icon-box bg-primary">
                <FaBook />
      </div>
              <div className="ms-3">
                <h6 className="card-subtitle text-muted">Total Courses</h6>
                <h4 className="card-title mb-0">{courses.length}</h4>
      </div>
      </div>
    </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h5 className="mb-0"><FaBook className="me-2" /> My Courses</h5>
        </div>
        <div className="card-body">
          {isLoading ? (
            <div className="d-flex justify-content-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : courses.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="border-top">
                <thead className="bg-light">
                  <tr>
                    <th><FaTag className="me-1" /> Course Code</th>
                    <th><FaBook className="me-1" /> Course Name</th>
                    <th><FaInfoCircle className="me-1" /> Department</th>
                    <th><FaFileAlt className="me-1" /> Details</th>
          </tr>
        </thead>
        <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td><strong>{course.course_code}</strong></td>
                      <td>{course.course_name}</td>
                      <td>{course.department?.department_name || "N/A"}</td>
                      <td className="text-truncate" style={{maxWidth: "300px"}}>
                        {course.details || "No details available"}
                      </td>
            </tr>
          ))}
        </tbody>
      </Table>
            </div>
          ) : (
            <div className="p-4 text-center">
              <FaBook size={48} className="text-muted mb-3" />
              <h5>No Courses Available</h5>
              <p className="text-muted">No courses have been assigned to you yet.</p>
              <div className="alert alert-info mx-auto" style={{ maxWidth: "80%" }}>
                <small>
                  <strong>Note:</strong> Courses will appear here when an administrator assigns them to you.
                  <br />If you believe this is an error, please check with your administrator.
                </small>
              </div>
            </div>
          )}
        </div>
    </div>
  </div>
);
};

// Issues component specifically for assigned issues
const Issues = ({ user }) => {
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  
  // Get issue status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending':
        return <BsHourglassSplit className="me-1 text-warning" />;
      case 'InProgress':
        return <BsClockHistory className="me-1 text-primary" />;
      case 'Solved':
        return <BsCheck2Circle className="me-1 text-success" />;
      default:
        return <FaInfoCircle className="me-1" />;
    }
  };
  
  useEffect(() => {
    const fetchAssignedIssues = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use the issues endpoint directly - it will filter based on user permissions
        const response = await fetch('http://localhost:8000/api/issues/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Fetched issues:", data);
        
        // Ensure we have an array of issues
        if (Array.isArray(data)) {
          setAssignedIssues(data);
        } else {
          console.error("Unexpected data format:", data);
          setError("Received unexpected data format from server");
        }
      } catch (error) {
        console.error("Error fetching assigned issues:", error);
        setError("Failed to load assigned issues. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      fetchAssignedIssues();
    }
  }, [user?.id]);
  
  const handleViewDetails = (issue) => {
    setSelectedIssue(issue);
    setShowDetailsModal(true);
  };
  
  const updateIssueStatus = async (issueId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/api/issues/${issueId}/update_status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedIssue = await response.json();
      
      // Update the issue in the local state
      setAssignedIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === issueId ? updatedIssue : issue
        )
      );
      
      setUpdateSuccess('Status updated successfully!');
      
      // If in detail view, update the selected issue
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(updatedIssue);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating issue status:', error);
      setError('Failed to update issue status. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Extract unique issue types for filtering
  const issueTypes = ['all', ...new Set(assignedIssues.map(issue => issue.issue_type))].filter(Boolean);
  
  // Filter issues based on status, type, and search
  const filteredIssues = assignedIssues.filter(issue => {
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesType = typeFilter === 'all' || issue.issue_type === typeFilter;
    const matchesSearch = searchTerm === '' || 
      issue.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.course?.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });
  
  return (
  <div>
    <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="icon-box bg-primary">
                <FaClipboardList />
      </div>
              <div className="ms-3">
                <h6 className="card-subtitle text-muted">Total Assigned</h6>
                <h4 className="card-title mb-0">{assignedIssues.length}</h4>
      </div>
      </div>
    </div>
        </div>
        
        <div className="card dashboard-card">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="icon-box bg-warning">
                <BsClockHistory />
              </div>
              <div className="ms-3">
                <h6 className="card-subtitle text-muted">In Progress</h6>
                <h4 className="card-title mb-0">
                  {assignedIssues.filter(issue => issue.status === 'InProgress').length}
                </h4>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card dashboard-card">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="icon-box bg-success">
                <BsCheck2Circle />
              </div>
              <div className="ms-3">
                <h6 className="card-subtitle text-muted">Resolved</h6>
                <h4 className="card-title mb-0">
                  {assignedIssues.filter(issue => issue.status === 'Solved').length}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mt-4">
        <div className="card-header">
          <h5 className="mb-0"><FaClipboardList className="me-2" /> My Assigned Issues</h5>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {updateSuccess && (
            <div className="alert alert-success">{updateSuccess}</div>
          )}
          
          <div className="row mb-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text"><FaSearch /></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search issues..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="InProgress">In Progress</option>
                <option value="Solved">Resolved</option>
              </select>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {issueTypes.filter(type => type !== 'all').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <span className="badge bg-info p-2 w-100 d-flex align-items-center justify-content-center">
                {filteredIssues.length} Issues
              </span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="d-flex justify-content-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredIssues.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="issue-table border-top">
                <thead className="bg-light">
                  <tr>
                    <th><FaPencilAlt className="me-1" /> Issue Title</th>
                    <th><FaUserGraduate className="me-1" /> Student</th>
                    <th><FaBook className="me-1" /> Course</th>
                    <th><FaTag className="me-1" /> Type</th>
                    <th><FaInfoCircle className="me-1" /> Status</th>
                    <th><FaCalendarAlt className="me-1" /> Date</th>
                    <th><FaCog className="me-1" /> Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map(issue => (
                    <tr key={issue.id} className="issue-row">
                      <td className="text-truncate" style={{maxWidth: "200px"}}>{issue.title}</td>
                      <td className="text-truncate" style={{maxWidth: "150px"}}>
                        {issue.student?.email || "N/A"}
                      </td>
                      <td className="text-truncate" style={{maxWidth: "150px"}}>
                        {issue.course?.course_name || "N/A"}
                      </td>
                      <td>
                        <span className="badge bg-secondary">{issue.issue_type}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          issue.status === 'Pending' ? 'bg-warning' :
                          issue.status === 'InProgress' ? 'bg-primary' : 'bg-success'
                        }`}>
                          {getStatusIcon(issue.status)} {issue.status}
                        </span>
                      </td>
                      <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex">
                          <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="me-1"
                            title="View Details"
                            onClick={() => handleViewDetails(issue)}
                          >
                            <FaEye />
                          </Button>
                          {issue.status !== 'Solved' ? (
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              title="Mark as Solved"
                              onClick={() => updateIssueStatus(issue.id, 'Solved')}
                            >
                              <FaCheckCircle />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline-warning" 
                              size="sm"
                              title="Reopen Issue"
                              onClick={() => updateIssueStatus(issue.id, 'InProgress')}
                            >
                              <FaRedo />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-4">
              <FaClipboardList size={48} className="text-muted mb-3" />
              <h5>No Issues Found</h5>
              <p className="text-muted">
                No issues have been assigned to you
                {statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}
                {typeFilter !== 'all' ? ` and type "${typeFilter}"` : ''}
                {searchTerm ? ` matching "${searchTerm}"` : ''}.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Issue Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title><FaClipboardList className="me-2" /> Issue Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIssue && (
            <div>
              <h3 className="mb-2">{selectedIssue.title}</h3>
              <div className="d-flex align-items-center mb-3">
                <span className={`badge me-2 ${
                  selectedIssue.status === 'Pending' ? 'bg-warning' :
                  selectedIssue.status === 'InProgress' ? 'bg-primary' : 'bg-success'
                }`}>
                  {getStatusIcon(selectedIssue.status)} {selectedIssue.status}
                </span>
                <span className="badge bg-secondary me-2">
                  <FaTag className="me-1" /> {selectedIssue.issue_type}
                </span>
                <small className="text-muted">
                  <FaCalendarAlt className="me-1" /> Created: {new Date(selectedIssue.created_at).toLocaleString()}
                </small>
              </div>
              
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 small text-uppercase">Issue Information</h5>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <th>Issue ID:</th>
                            <td>#{selectedIssue.id}</td>
                          </tr>
                          <tr>
                            <th>Course:</th>
                            <td>{selectedIssue.course?.course_name || 'N/A'}</td>
                          </tr>
                          <tr>
                            <th>Course Code:</th>
                            <td>{selectedIssue.course?.course_code || 'N/A'}</td>
                          </tr>
                          <tr>
                            <th>Date Created:</th>
                            <td>{new Date(selectedIssue.created_at).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 small text-uppercase">Student Information</h5>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <th>Name:</th>
                            <td>
                              {selectedIssue.student ? (
                                `${selectedIssue.student.first_name} ${selectedIssue.student.last_name}`
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Email:</th>
                            <td>{selectedIssue.student?.email || 'N/A'}</td>
                          </tr>
                          <tr>
                            <th>Department:</th>
                            <td>{selectedIssue.course?.department?.department_name || 'N/A'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
    <div className="card">
                <div className="card-header bg-light">
                  <h5 className="mb-0 small text-uppercase">Description</h5>
    </div>
                <div className="card-body">
                  <p className="mb-0">
                    {selectedIssue.description || 'No description provided.'}
                  </p>
                </div>
              </div>
              
              <div className="d-flex justify-content-end mt-3">
                {selectedIssue.status !== 'Solved' ? (
                  <Button 
                    variant="success" 
                    onClick={() => {
                      updateIssueStatus(selectedIssue.id, 'Solved');
                      setShowDetailsModal(false);
                    }}
                  >
                    <FaCheckCircle className="me-1" /> Mark as Solved
                  </Button>
                ) : (
                  <Button 
                    variant="warning" 
                    onClick={() => {
                      updateIssueStatus(selectedIssue.id, 'InProgress');
                      setShowDetailsModal(false);
                    }}
                  >
                    <FaRedo className="me-1" /> Reopen Issue
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
  </div>
);
};

const SettingsContent = ({ user }) => (
  <div className="card">
    <div className="card-header">
      <h5 className="mb-0"><FaTools className="me-2" /> Profile Settings</h5>
    </div>
    <div className="card-body">
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h5 className="mb-0 small text-uppercase">Personal Information</h5>
            </div>
            <div className="card-body">
              <Form>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label><strong>First Name</strong></Form.Label>
                      <Form.Control 
                        type="text" 
                        defaultValue={user.first_name} 
                        disabled 
                        className="bg-light"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Last Name</strong></Form.Label>
                      <Form.Control 
                        type="text" 
                        defaultValue={user.last_name} 
                        disabled 
                        className="bg-light"
                      />
                    </Form.Group>
                  </div>
                </div>
                
                <Form.Group className="mb-3">
                  <Form.Label><strong>Email</strong></Form.Label>
                  <Form.Control 
                    type="email" 
                    defaultValue={user.email} 
                    disabled 
                    className="bg-light"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label><strong>Phone</strong></Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={user.phone || 'Not available'} 
                    disabled 
                    className="bg-light"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label><strong>Role</strong></Form.Label>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-primary me-2">
                      {user.role}
                    </span>
                    <span className="text-muted small">Academic Staff</span>
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label><strong>Department</strong></Form.Label>
                  <Form.Control 
                    type="text" 
                    defaultValue={user.department_code || 'Not assigned'} 
                    disabled 
                    className="bg-light"
                  />
                </Form.Group>
              </Form>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="mb-0 small text-uppercase">Change Password</h5>
            </div>
            <div className="card-body">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Current Password</strong></Form.Label>
                  <Form.Control type="password" placeholder="Enter current password" />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label><strong>New Password</strong></Form.Label>
                  <Form.Control type="password" placeholder="Enter new password" />
                  <Form.Text className="text-muted">
                    Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label><strong>Confirm New Password</strong></Form.Label>
                  <Form.Control type="password" placeholder="Confirm new password" />
                </Form.Group>
                
                <div className="d-grid">
                  <Button variant="primary">
                    Update Password
                  </Button>
                </div>
              </Form>
            </div>
          </div>
          
          <div className="card mt-3">
            <div className="card-header bg-light">
              <h5 className="mb-0 small text-uppercase">Notification Preferences</h5>
            </div>
            <div className="card-body">
              <Form>
                <Form.Check 
                  type="switch"
                  id="email-notifications"
                  label="Email Notifications"
                  defaultChecked
                  className="mb-2"
                />
                <Form.Text className="text-muted d-block mb-3">
                  Receive email notifications when new issues are assigned to you.
                </Form.Text>
                
                <Form.Check 
                  type="switch"
                  id="student-updates"
                  label="Student Update Notifications"
                  defaultChecked
                  className="mb-2"
                />
                <Form.Text className="text-muted d-block mb-3">
                  Receive notifications when students update their issues.
                </Form.Text>
                
                <Form.Check 
                  type="switch"
                  id="admin-notifications"
                  label="Administrative Notifications"
                  defaultChecked
                  className="mb-2"
                />
                <Form.Text className="text-muted d-block mb-3">
                  Receive notifications about system updates and administrative changes.
                </Form.Text>
                
                <div className="d-grid">
                  <Button variant="outline-primary">
                    Save Preferences
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Lecturer;
