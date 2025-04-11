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
import axios from "axios";

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
  const [courses, setCourses] = useState([]);

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
        // Get all issues
        const issuesData = await getIssues();
        console.log("All issues:", issuesData);
        console.log("Current user:", user);
        
        // Filter issues to only show those created by the current student
        const studentIssues = issuesData.filter(issue => {
          if (!issue.student) return false;
          
          // Handle different ways the student ID might be represented
          if (typeof issue.student === 'object') {
            return issue.student.id === user.id;
          } else if (typeof issue.student === 'number' || typeof issue.student === 'string') {
            return String(issue.student) === String(user.id);
          }
          return false;
        });
        
        console.log("Student's issues:", studentIssues);
        setMyIssues(studentIssues);
        
        // Get dashboard data
        const data = await getStudentDashboard();
        setDashboardData(data);
        
        // Fetch courses
        const courseData = await getCourses();
        setCourses(courseData);
        
        // Fetch notifications
        fetchNotifications();
      } catch (error) {
        console.error("Error fetching student data:", error);
        // Handle error - possibly redirect to login if unauthorized
        if (error.response && error.response.status === 401) {
          logout();
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchStudentData();
    }
  }, [user, navigate]);

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
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (id) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`http://localhost:8000/api/notifications/${id}/mark_as_read/`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;
  const open = Boolean(anchorEl);
  const id = open ? "notification-popper" : undefined;

  // Function to render the active content based on menu selection
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardContent user={user} myIssues={myIssues} courses={courses} />;
      case "updates":
        return <Updates />;
      case "issues":
        return <StudentsIssues user={user} />;
      case "settings":
        return <SettingsContent user={user} />;
      default:
        return <DashboardContent user={user} myIssues={myIssues} courses={courses} />;
    }
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    } else if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    } else {
      return "U";
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get("http://localhost:8000/api/notifications/", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    }
  };

  return (
    <div className="admin-layout student-dashboard">
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
                <Paper sx={{ p: 2, width: 300, maxHeight: 400, overflow: 'auto', boxShadow: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Notifications</Typography>
                  <List>
                    {notifications.length > 0 ? (
                      notifications.map((notif, index) => (
                        <React.Fragment key={notif.id}>
                          <ListItem disablePadding>
                            {notif.read ? (
                              <ListItemButton disabled sx={{ backgroundColor: '#f5f5f5' }}>
                                <ListItemText 
                                  primary={notif.message} 
                                  secondary={new Date(notif.created_at).toLocaleString()}
                                  sx={{ color: 'text.secondary' }}
                                />
                              </ListItemButton>
                            ) : (
                              <ListItemButton
                                onClick={() => handleNotificationClick(notif.id)}
                                sx={{ backgroundColor: '#e3f2fd' }}
                              >
                                <ListItemText 
                                  primary={notif.message} 
                                  secondary={new Date(notif.created_at).toLocaleString()}
                                />
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
                        No notifications
                      </Typography>
                    )}
                  </List>
                  {notifications.length > 0 && (
                    <Button 
                      variant="text" 
                      size="small" 
                      fullWidth 
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('access_token');
                          await axios.post(`http://localhost:8000/api/notifications/mark_all_as_read/`, {}, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          setNotifications(notifications.map(n => ({...n, read: true})));
                        } catch (error) {
                          console.error("Error marking all notifications as read:", error);
                        }
                      }}
                    >
                      Mark all as read
                    </Button>
                  )}
                </Paper>
              </ClickAwayListener>
            </Popper>
          </div>
        </header>

        <h2 className="welcome">
          {greeting}, {user.last_name} {user.first_name}
        </h2>
        <main className="content">{renderContent()}</main>
      </div>
    </div>
  );
};

// Improved DashboardContent component for students
const DashboardContent = ({ user, myIssues, courses }) => {
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    issue_type: 'Missing Marks',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  const pendingIssues = myIssues.filter(issue => issue.status === 'Pending').length;
  const inProgressIssues = myIssues.filter(issue => issue.status === 'InProgress').length;
  const resolvedIssues = myIssues.filter(issue => issue.status === 'Solved').length;

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

  // Get 5 most recent issues
  const recentIssues = [...myIssues]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Fetch courses when the modal is opened
  useEffect(() => {
    const fetchCourses = async () => {
      if (showCreateIssueModal && (!courses || courses.length === 0)) {
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
          
          // Not needed anymore as we get courses from props
          // setCourses(filteredCourses);
        } catch (error) {
          console.error('Error fetching courses:', error);
          setError('Unable to load courses. Please try again later.');
        } finally {
          setIsLoadingCourses(false);
        }
      }
    };
    
    fetchCourses();
  }, [showCreateIssueModal, user, courses]);

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
            <div className="d-flex justify-content-between align-items-center p-3">
              <h2 className="card-title m-0">My Recent Issues</h2>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setShowCreateIssueModal(true)}
              >
                <FaPlus className="me-1" /> New Issue
              </Button>
            </div>
            <div className="p-3">
              {recentIssues.length > 0 ? (
                <div>
                  {recentIssues.map(issue => (
                    <div key={issue.id} className="issue-item mb-3 p-3 border rounded">
                      <div className="d-flex justify-content-between">
                        <h5>{issue.title}</h5>
                        <span className={`badge bg-${
                          issue.status === 'Pending' ? 'warning' :
                          issue.status === 'InProgress' ? 'primary' : 'success'
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                      <div className="text-muted small mb-2">
                        {issue.issue_type} - {new Date(issue.created_at).toLocaleDateString()}
                      </div>
                      <p className="mb-0">{issue.description.substring(0, 100)}...</p>
                    </div>
                  ))}
                  {myIssues.length > 5 && (
                    <div className="text-center mt-3">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => setActiveMenu("issues")}
                      >
                        View All Issues
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center py-3">You haven't reported any issues yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card">
            <h2 className="card-title p-3">Issue Status</h2>
            <div className="p-3">
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
          <Modal.Title>Report New Issue</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
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
              <Form.Label>Course</Form.Label>
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
              <Form.Label>Issue Type</Form.Label>
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
              <Form.Label>Description</Form.Label>
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

            <div className="d-grid">
              <Button 
                variant="primary" 
                type="submit"
                disabled={isLoadingCourses || courses.length === 0}
              >
                Submit Issue
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

const Updates = () => (
  <div>
    <div className="card">
      <h2 className="card-title">Course Work Results</h2>
      <p>Semester's course work result goes here.</p>
    </div>
    <div className="card">
      <h2 className="card-title">Semester Announcement</h2>
      <p>Announcement goes here.</p>
    </div>
    <div className="card">
      <h2 className="card-title">Upcoming Deadlines</h2>
      <p>Deadlines to met goes here.</p>
    </div>
  </div>
);

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
