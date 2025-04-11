import React, { useState, useEffect } from "react";
import { getStudentDashboard, logout, getIssues, createIssue, getCourses } from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  FaTable,
  FaComments,
  FaClipboardList,
  FaTools,
  FaBell,
  FaPlus,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaInfoCircle,
  FaTag,
  FaEye,
  FaPencilAlt
} from "react-icons/fa";
import { BsCheck2Circle, BsClockHistory, BsHourglassSplit } from "react-icons/bs";
import StudentsIssues from "../Issues/StudentsIssues";
import "./admin.css";
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
import { styled } from "@mui/material/styles";
import { Modal, Button, Form } from "react-bootstrap";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ReadNotification = styled(ListItemButton)({
  backgroundColor: "#f0f0f0", // Light gray background
  color: "#6b6b6b", // Dimmed text color
  pointerEvents: "none", // Prevent clicking on already read messages
});

const Student = ({ user }) => {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState([]);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 16) return "Good afternoon";
      return "Good evening";
    };

    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        // Get student's issues
        const issuesData = await getIssues();
        setMyIssues(issuesData);
        
        // Get dashboard data
        const data = await getStudentDashboard();
        setDashboardData(data);
        
        // Fetch notifications - in a real application, this would call an API endpoint
        // For now, we'll just set empty notifications until the API is implemented
        setNotifications([]);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/dashboard");
  };

  // Menu items for the sidebar
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTable /> },
    { id: "issues", label: "My Issues", icon: <FaClipboardList /> },
    { id: "updates", label: "Updates", icon: <FaComments /> },
    { id: "settings", label: "Settings", icon: <FaTools /> },
  ];

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget); // Toggle popper
  };

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

  // Get user initials for the avatar
  const getUserInitials = () => {
    if (!user) return "S";
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "S";
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;
  const open = Boolean(anchorEl);
  const id = open ? "notification-popper" : undefined;

  // Function to render the active content based on menu selection
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardContent user={user} myIssues={myIssues} />;
      case "updates":
        return <Updates />;
      case "issues":
        return <StudentsIssues user={user} />;
      case "settings":
        return <SettingsContent user={user} />;
      default:
        return <DashboardContent user={user} myIssues={myIssues} />;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">Student Dashboard</div>
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
                              <ReadNotification>
                                <ListItemText primary={notif.message} />
                              </ReadNotification>
                            ) : (
                              <ListItemButton
                                onClick={() =>
                                  handleNotificationClick(notif.id)
                                }
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

// Improved DashboardContent component for students
const DashboardContent = ({ user, myIssues }) => {
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    issue_type: 'Missing Marks',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const pendingIssues = myIssues.filter(issue => issue.status === 'Pending').length;
  const inProgressIssues = myIssues.filter(issue => issue.status === 'InProgress').length;
  const resolvedIssues = myIssues.filter(issue => issue.status === 'Solved').length;

  // Get 5 most recent issues
  const recentIssues = [...myIssues]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Data for the pie chart
  const chartData = {
    labels: ['Pending', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [pendingIssues, inProgressIssues, resolvedIssues],
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
    setShowIssueModal(true);
  };

  // Fetch courses when the modal is opened
  useEffect(() => {
    const fetchCourses = async () => {
      if (showCreateIssueModal) {
        setIsLoadingCourses(true);
        try {
          const coursesData = await getCourses();
          console.log('Fetched courses:', coursesData);
          
          // Filter courses if student has a college assigned
          let filteredCourses = coursesData;
          
          // If we need to filter by student's college in the future, 
          // we can uncomment and modify this code
          /*
          if (user.college && user.college.id) {
            filteredCourses = coursesData.filter(course => 
              course.department && 
              course.department.college && 
              course.department.college.id === user.college.id
            );
            console.log('Filtered courses by college:', filteredCourses);
          }
          */
          
          setCourses(filteredCourses);
        } catch (error) {
          console.error('Error fetching courses:', error);
          setError('Unable to load courses. Please try again later.');
        } finally {
          setIsLoadingCourses(false);
        }
      }
    };
    
    fetchCourses();
  }, [showCreateIssueModal, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await createIssue(formData);
      setSuccess('Issue created successfully!');
      setFormData({
        title: '',
        course: '',
        issue_type: 'Missing Marks',
        description: ''
      });

      // Close modal after a short delay
      setTimeout(() => {
        setShowCreateIssueModal(false);
        window.location.reload(); // Refresh to show the new issue
      }, 1500);
    } catch (error) {
      setError('Failed to create issue. Please try again.');
      console.error("Error creating issue:", error);
    }
  };

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
                <h6 className="card-subtitle text-muted">Total Issues</h6>
                <h4 className="card-title mb-0">{myIssues.length}</h4>
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
                <h4 className="card-title mb-0">{inProgressIssues}</h4>
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
                <h4 className="card-title mb-0">{resolvedIssues}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-7">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><FaClipboardList className="me-2" /> My Recent Issues</h5>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowCreateIssueModal(true)}
              >
                <FaPlus className="me-1" /> New Issue
              </Button>
            </div>
            <div className="card-body p-0">
              {recentIssues.length > 0 ? (
                <div className="issue-list">
                  {recentIssues.map(issue => (
                    <div key={issue.id} className="issue-item p-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-start">
  <div>
                          <h5 className="mb-1">{issue.title}</h5>
                          <div className="d-flex align-items-center mb-2">
                            <span className="badge bg-secondary me-2">
                              <FaTag className="me-1" /> {issue.issue_type}
                            </span>
                            <small className="text-muted">
                              <FaCalendarAlt className="me-1" /> {new Date(issue.created_at).toLocaleDateString()}
                            </small>
                          </div>
                          <p className="mb-0 text-muted">
                            {issue.description && issue.description.length > 80 
                              ? issue.description.substring(0, 80) + '...' 
                              : issue.description || 'No description provided.'}
                          </p>
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
                  {myIssues.length > 5 && (
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
                  <h5>No Issues Reported</h5>
                  <p className="text-muted">You haven't reported any issues yet.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowCreateIssueModal(true)}
                  >
                    <FaPlus className="me-1" /> Create Your First Issue
                  </Button>
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
              {myIssues.length > 0 ? (
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
                  <h4>{pendingIssues}</h4>
                </div>
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <BsClockHistory className="text-primary me-1" />
                    <span>In Progress</span>
                  </div>
                  <h4>{inProgressIssues}</h4>
                </div>
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <BsCheck2Circle className="text-success me-1" />
                    <span>Resolved</span>
                  </div>
                  <h4>{resolvedIssues}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Issue Modal */}
      <Modal show={showCreateIssueModal} onHide={() => setShowCreateIssueModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title><FaPlus className="me-2" /> Report New Issue</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label><FaPencilAlt className="me-1" /> Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Brief title describing the issue"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label><FaTable className="me-1" /> Course</Form.Label>
              {isLoadingCourses ? (
                <div className="text-center p-2">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Loading courses...
                </div>
              ) : (
                <Form.Select
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.course_name} ({course.course_code})
                    </option>
                  ))}
                  {courses.length === 0 && (
                    <option value="" disabled>No courses available</option>
                  )}
                </Form.Select>
              )}
              {courses.length === 0 && !isLoadingCourses && (
                <div className="text-danger small mt-1">
                  No courses available. Please contact your administrator.
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label><FaTag className="me-1" /> Issue Type</Form.Label>
              <Form.Select
                name="issue_type"
                value={formData.issue_type}
                onChange={handleInputChange}
                required
              >
                <option value="Missing Marks">Missing Marks</option>
                <option value="Appeals">Appeals</option>
                <option value="Corrections">Corrections</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label><FaInfoCircle className="me-1" /> Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Describe your issue in detail"
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => setShowCreateIssueModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isLoadingCourses || courses.length === 0}
              >
                <FaPlus className="me-1" /> Submit Issue
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Issue Detail Modal */}
      <Modal show={showIssueModal} onHide={() => setShowIssueModal(false)} size="lg">
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
                          <th>Last Updated:</th>
                          <td>{new Date(selectedIssue.updated_at).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-light">
                    <h5 className="mb-0 small text-uppercase">Assignment Information</h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th>Assigned To:</th>
                          <td>
                            {selectedIssue.assigned_to ? (
                              `${selectedIssue.assigned_to.first_name} ${selectedIssue.assigned_to.last_name}`
                            ) : (
                              <span className="text-muted">Not yet assigned</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Department:</th>
                          <td>{selectedIssue.course?.department?.department_name || 'N/A'}</td>
                        </tr>
                        <tr>
                          <th>College:</th>
                          <td>{selectedIssue.course?.department?.college?.name || 'N/A'}</td>
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
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowIssueModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const Updates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      try {
        // In a real application, this would call an API endpoint to get updates
        // For now, we'll just set an empty array until the API is implemented
        setUpdates([]);
        setError(null);
      } catch (err) {
        console.error("Error fetching updates:", err);
        setError("Failed to load updates. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
    <div className="card">
        <div className="card-body text-center p-5">
          <FaComments size={48} className="text-muted mb-3" />
          <h4>No Updates Available</h4>
          <p className="text-muted">There are no updates or announcements at this time.</p>
    </div>
  </div>
);
  }

  return (
  <div>
      {updates.map(update => (
        <div className="card mb-3" key={update.id}>
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{update.title}</h5>
            <span className="badge bg-primary">{update.category}</span>
          </div>
          <div className="card-body">
            <p>{update.content}</p>
            {update.deadline && (
              <div className="alert alert-warning">
                <FaCalendarAlt className="me-2" />
                Deadline: {new Date(update.deadline).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="card-footer text-muted">
            Posted: {new Date(update.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

const SettingsContent = ({ user }) => (
    <div className="card">
    <h2 className="card-title">Profile Settings</h2>
    <div className="p-3">
      <div className="row">
        <div className="col-md-6">
          <h4>Personal Information</h4>
          <form>
            <div className="mb-3">
              <label className="form-label">First Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder={user.first_name} 
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Last Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder={user.last_name} 
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder={user.email} 
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Student ID</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Not Available" 
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label">College</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder={user.college_code || "Not Assigned"} 
                disabled
              />
            </div>
          </form>
        </div>
        <div className="col-md-6">
          <h4>Change Password</h4>
          <form>
            <div className="mb-3">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-control" />
            </div>
            <Button variant="primary">
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  </div>
);

export default Student;
