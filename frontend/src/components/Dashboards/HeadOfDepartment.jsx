import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaTable,
  FaClipboardList,
  FaTools,
  FaBook,
  FaUserTie,
  FaChartPie,
  FaCheckCircle, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaBell,
  FaUniversity
} from "react-icons/fa";
import { BsCheck2Circle, BsClockHistory, BsListTask, BsPersonBadge, BsPersonCheck } from 'react-icons/bs';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Spinner, 
  Alert, 
  Table, 
  Modal, 
  Button, 
  Form, 
  Badge as BootstrapBadge,
  Tab,
  Tabs,
  ProgressBar,
  Dropdown
} from 'react-bootstrap';
import moment from 'moment';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  getDashboardData, 
  getDepartmentIssues,
  getDepartmentStaff,
  getDepartmentCourses,
  getDepartmentDetails,
  markIssueAsSolved,
  getLecturerIssues,
  logout
} from '../../services/api';
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
import "./admin.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const HeadOfDepartment = ({ user }) => {
  // State variables
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [departmentIssues, setDepartmentIssues] = useState([]);
  const [departmentStaff, setDepartmentStaff] = useState([]);
  const [departmentCourses, setDepartmentCourses] = useState([]);
  const [departmentDetails, setDepartmentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [staffDetailsModalOpen, setStaffDetailsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffIssues, setStaffIssues] = useState([]);
  const [fetchingError, setFetchingError] = useState(null);
  const [markingSolved, setMarkingSolved] = useState(false);
  const [assigningIssue, setAssigningIssue] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [issueStats, setIssueStats] = useState({ 
    total: 0, 
    pending: 0, 
    inProgress: 0, 
    solved: 0,
    unassigned: 0
  });
  const [greeting, setGreeting] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New issue reported in your department", read: false },
    { id: 2, message: "Staff member updated their profile", read: false },
  ]);
  
  const navigate = useNavigate();
  
  // Get greeting based on time of day
  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 16) return "Good afternoon";
      return "Good evening";
    };

    setGreeting(getGreeting());
  }, []);
  
  // Load data when component mounts or refresh is triggered
  useEffect(() => {
    if (user) {
      // Get department ID from user object, checking all possible formats
      let departmentId = 
        typeof user.department === 'object' ? user.department?.id :
        typeof user.department === 'number' || typeof user.department === 'string' ? user.department : 
        null;
      
      // Use the HOD's ID as department ID if not present (temporary workaround)
      if (!departmentId) {
        console.log("No department ID found in user object, using default ID 1");
        departmentId = 1; // Default department ID
      }
      
      console.log("Loading department data for department ID:", departmentId);
      fetchDepartmentData(departmentId);
    } else {
      setError("User information not available");
      setLoading(false);
    }
  }, [user, refreshTrigger]);

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

  const handleLogout = () => {
    logout();
    navigate("/dashboard");
  };

  // Menu items for the sidebar
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTable /> },
    { id: "issues", label: "Department Issues", icon: <FaClipboardList /> },
    { id: "staff", label: "Department Staff", icon: <FaUsers /> },
    { id: "courses", label: "Department Courses", icon: <FaBook /> },
    { id: "settings", label: "Settings", icon: <FaTools /> },
  ];

  const unreadCount = notifications.filter((notif) => !notif.read).length;
  const open = Boolean(anchorEl);
  const id = open ? "notification-popper" : undefined;
  
  // Get user initials for the avatar
  const getUserInitials = () => {
    if (!user) return "U";
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Function to render the active content based on menu selection
  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return renderDashboardContent();
      case "issues":
        return renderIssuesContent();
      case "staff":
        return renderStaffContent();
      case "courses":
        return renderCoursesContent();
      case "settings":
        return renderSettingsContent();
      default:
        return renderDashboardContent();
    }
  };

  // Function to fetch all department data
  const fetchDepartmentData = async (departmentId) => {
    setLoading(true);
    setError(null);
    setFetchingError(null);
    
    try {
      // Fetch general dashboard data - don't await, start all requests in parallel
      const dashboardPromise = getDashboardData().catch(error => {
        console.error("Error fetching dashboard data:", error);
        return null;
      });
      
      // Fetch department details
      const detailsPromise = getDepartmentDetails(departmentId).catch(error => {
        console.error("Error fetching department details:", error);
        return { department: null, error: error.message };
      });
      
      // Fetch department issues
      const issuesPromise = getDepartmentIssues(departmentId).catch(error => {
        console.error("Error fetching department issues:", error);
        return { issues: [], error: error.message };
      });
      
      // Fetch department staff
      const staffPromise = getDepartmentStaff(departmentId).catch(error => {
        console.error("Error fetching department staff:", error);
        return { staff: [], error: error.message };
      });
      
      // Fetch department courses
      const coursesPromise = getDepartmentCourses(departmentId).catch(error => {
        console.error("Error fetching department courses:", error);
        return { courses: [], error: error.message };
      });
      
      // Wait for all promises to resolve
      const [
        dashData, 
        { department, error: deptError }, 
        { issues, error: issuesError }, 
        { staff, error: staffError }, 
        { courses, error: coursesError }
      ] = await Promise.all([
        dashboardPromise,
        detailsPromise,
        issuesPromise,
        staffPromise,
        coursesPromise
      ]);
      
      // Update state with results
      setDashboardData(dashData);
      
      if (deptError) {
        console.error("Error fetching department details:", deptError);
        setFetchingError(prevError => prevError ? `${prevError}; ${deptError}` : deptError);
      } else if (department) {
        setDepartmentDetails(department);
      }
      
      if (issuesError) {
        console.error("Error fetching department issues:", issuesError);
        setFetchingError(prevError => prevError ? `${prevError}; ${issuesError}` : issuesError);
      } else if (issues && Array.isArray(issues)) {
        setDepartmentIssues(issues);
        calculateIssueStats(issues);
      }
      
      if (staffError) {
        console.error("Error fetching department staff:", staffError);
        setFetchingError(prevError => prevError ? `${prevError}; ${staffError}` : staffError);
      } else if (staff && Array.isArray(staff)) {
        setDepartmentStaff(staff);
      }
      
      if (coursesError) {
        console.error("Error fetching department courses:", coursesError);
        setFetchingError(prevError => prevError ? `${prevError}; ${coursesError}` : coursesError);
      } else if (courses && Array.isArray(courses)) {
        setDepartmentCourses(courses);
      }
      
    } catch (err) {
      console.error('Error fetching department data:', err);
      setError(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch issues for a specific staff member
  const fetchStaffIssues = async (staffId) => {
    if (!staffId) return;
    
    try {
      const { issues, error } = await getLecturerIssues(staffId);
      if (error) {
        console.error("Error fetching staff issues:", error);
        return [];
      }
      return issues;
    } catch (err) {
      console.error("Error in fetchStaffIssues:", err);
      return [];
    }
  };

  // Function to view issue details
  const viewIssueDetails = (issue) => {
    setSelectedIssue(issue);
    setDetailsModalOpen(true);
  };

  // Function to view staff details
  const viewStaffDetails = async (staff) => {
    setSelectedStaff(staff);
    setStaffDetailsModalOpen(true);
    
    // Fetch issues assigned to this staff member
    const issues = await fetchStaffIssues(staff.id);
    setStaffIssues(issues || []);
  };

  // Function to mark issue as solved
  const handleMarkAsSolved = async (issueId) => {
    setMarkingSolved(true);
    try {
      await markIssueAsSolved(issueId);
      
      // Refresh the data
      setRefreshTrigger(prev => prev + 1);
      // Close the modal if open
      setDetailsModalOpen(false);
    } catch (err) {
      console.error('Error marking issue as solved:', err);
      alert('Failed to update issue status. Please try again.');
    } finally {
      setMarkingSolved(false);
    }
  };

  // Function to assign issue to staff
  const handleAssignIssue = async (issueId, staffId) => {
    setAssigningIssue(true);
    try {
      // Assume there's an API function to assign an issue
      // await assignIssueToStaff(issueId, staffId);
      
      // For now, let's just log and refresh
      console.log(`Assigning issue ${issueId} to staff ${staffId}`);
      
      // Refresh the data
      setRefreshTrigger(prev => prev + 1);
      // Close the modal if open
      setDetailsModalOpen(false);
    } catch (err) {
      console.error('Error assigning issue:', err);
      alert('Failed to assign issue. Please try again.');
    } finally {
      setAssigningIssue(false);
    }
  };

  // Calculate issue statistics
  const calculateIssueStats = (issues) => {
    const stats = {
      total: Array.isArray(issues) ? issues.length : 0,
      pending: 0,
      inProgress: 0,
      solved: 0,
      unassigned: 0
    };

    if (!Array.isArray(issues)) {
      setIssueStats(stats);
      return;
    }

    issues.forEach(issue => {
      if (!issue) return; // Skip if issue is null/undefined
      
      // Handle different status formats (lowercase with underscore or capitalized with spaces)
      const status = issue.status ? issue.status.toLowerCase() : '';
      
      if (status === 'pending' || status === 'pending approval') {
        stats.pending++;
      } else if (status === 'in_progress' || status === 'in progress') {
        stats.inProgress++;
      } else if (status === 'solved' || status === 'resolved' || status === 'closed') {
        stats.solved++;
      }
      
      // Check if the issue is unassigned
      if (!issue.assigned_to) {
        stats.unassigned++;
      }
    });

    setIssueStats(stats);
  };

  // Helper function to calculate issue statistics for a staff member
  const staffIssueStats = (staffId) => {
    if (!staffId || !Array.isArray(departmentIssues)) {
      return {
        total: 0,
        solved: 0,
        inProgress: 0,
        pending: 0,
        solvedPercentage: 0,
        inProgressPercentage: 0,
        pendingPercentage: 0
      };
    }
    
    const staffIssuesCount = departmentIssues.filter(issue => 
      issue && (issue.assigned_to?.id === staffId || issue.assigned_to === staffId)
    ).length;
    
    const solvedCount = departmentIssues.filter(issue => 
      issue && (issue.assigned_to?.id === staffId || issue.assigned_to === staffId) && 
      issue.status && (issue.status.toLowerCase() === 'solved' || issue.status.toLowerCase() === 'resolved')
    ).length;
    
    const inProgressCount = departmentIssues.filter(issue => 
      issue && (issue.assigned_to?.id === staffId || issue.assigned_to === staffId) && 
      issue.status && (issue.status.toLowerCase() === 'in_progress' || issue.status.toLowerCase() === 'in progress')
    ).length;
    
    const pendingCount = departmentIssues.filter(issue => 
      issue && (issue.assigned_to?.id === staffId || issue.assigned_to === staffId) && 
      issue.status && (issue.status.toLowerCase() === 'pending')
    ).length;
    
    const total = staffIssuesCount;
    const solvedPercentage = total > 0 ? (solvedCount / total) * 100 : 0;
    const inProgressPercentage = total > 0 ? (inProgressCount / total) * 100 : 0;
    const pendingPercentage = total > 0 ? (pendingCount / total) * 100 : 0;
    
    return {
      total,
      solved: solvedCount,
      inProgress: inProgressCount,
      pending: pendingCount,
      solvedPercentage,
      inProgressPercentage,
      pendingPercentage
    };
  };

  // Function to render dashboard content
  const renderDashboardContent = () => {
    // Data for the pie chart - ensure we have valid data even if stats are missing
    const issueStatusChartData = {
      labels: ['Solved', 'In Progress', 'Pending'],
      datasets: [
        {
          data: [
            issueStats?.solved || 0, 
            issueStats?.inProgress || 0, 
            issueStats?.pending || 0
          ],
          backgroundColor: ['#28a745', '#17a2b8', '#ffc107'],
          borderWidth: 0,
        },
      ],
    };

    // Data for the bar chart - issues per course
    const coursesWithIssues = {};
    
    // Ensure departmentIssues is an array before iterating
    if (Array.isArray(departmentIssues)) {
      departmentIssues.forEach(issue => {
        if (issue && issue.course) {
          const courseName = issue.course?.course_name || 'Unknown Course';
          if (!coursesWithIssues[courseName]) {
            coursesWithIssues[courseName] = 0;
          }
          coursesWithIssues[courseName]++;
        }
      });
    }

    const issuesPerCourseChartData = {
      labels: Object.keys(coursesWithIssues),
      datasets: [
        {
          label: 'Issues',
          data: Object.values(coursesWithIssues),
          backgroundColor: '#4e73df',
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    };

    // Recent issues - get the 5 most recent
    const recentIssues = departmentIssues
      ? [...departmentIssues]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
      : [];

    return (
      <div>
       

        {fetchingError && (
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>Warning</Alert.Heading>
            <p>Some data may not be complete: {fetchingError}</p>
            <p>The dashboard will display all available information.</p>
          </Alert>
        )}

        <Row className="mb-4">
          <Col md={3}>
            <Card className="dashboard-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="icon-box bg-primary">
                    <FaClipboardList />
                  </div>
                  <div className="ms-3">
                    <h6 className="card-subtitle text-muted">Total Issues</h6>
                    <h4 className="card-title mb-0">{issueStats.total}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="dashboard-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="icon-box bg-warning">
                    <BsClockHistory />
                  </div>
                  <div className="ms-3">
                    <h6 className="card-subtitle text-muted">Pending Issues</h6>
                    <h4 className="card-title mb-0">{issueStats.pending}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="dashboard-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="icon-box bg-info">
                    <BsPersonCheck />
                  </div>
                  <div className="ms-3">
                    <h6 className="card-subtitle text-muted">Assigned Issues</h6>
                    <h4 className="card-title mb-0">{issueStats.total - issueStats.unassigned}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="dashboard-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="icon-box bg-success">
                    <BsCheck2Circle />
                  </div>
                  <div className="ms-3">
                    <h6 className="card-subtitle text-muted">Solved Issues</h6>
                    <h4 className="card-title mb-0">{issueStats.solved}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={4}>
            <Card>
              <Card.Header>Issue Status Distribution</Card.Header>
              <Card.Body>
                <div style={{ height: '240px' }}>
                  <Pie data={issueStatusChartData} options={chartOptions} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={8}>
            <Card>
              <Card.Header>Issues per Course</Card.Header>
              <Card.Body>
                <div style={{ height: '240px' }}>
                  {Object.keys(coursesWithIssues).length > 0 ? (
                    <Bar 
                      data={issuesPerCourseChartData} 
                      options={{
                        ...chartOptions,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0
                            }
                          }
                        }
                      }} 
                    />
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-muted">No course data available</p>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card>
              <Card.Header>Department Details</Card.Header>
              <Card.Body>
                {departmentDetails ? (
                  <Table bordered>
                    <tbody>
                      <tr>
                        <td width="40%"><strong>Department Name</strong></td>
                        <td>{departmentDetails.name}</td>
                      </tr>
                      <tr>
                        <td><strong>Department Code</strong></td>
                        <td>{departmentDetails.code}</td>
                      </tr>
                      <tr>
                        <td><strong>College</strong></td>
                        <td>{departmentDetails.college?.name || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Staff Count</strong></td>
                        <td>{departmentStaff.length || 0}</td>
                      </tr>
                      <tr>
                        <td><strong>Courses Count</strong></td>
                        <td>{departmentCourses.length || 0}</td>
                      </tr>
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted">No department details available.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header>Recent Issues</Card.Header>
              <Card.Body>
                {recentIssues.length > 0 ? (
                  <div className="recent-issues">
                    {recentIssues.map(issue => (
                      <div 
                        key={issue.id}
                        className="recent-issue-item p-2 mb-2 rounded border"
                        onClick={() => viewIssueDetails(issue)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between">
                          <h6 className="mb-1">{issue.title}</h6>
                          <BootstrapBadge bg={
                            issue.status?.toLowerCase() === 'solved' || issue.status?.toLowerCase() === 'resolved' ? 'success' :
                            issue.status?.toLowerCase() === 'in_progress' || issue.status?.toLowerCase() === 'in progress' ? 'info' :
                            'warning'
                          }>
                            {issue.status}
                          </BootstrapBadge>
                        </div>
                        <div className="text-muted small mb-1">
                          {issue.course?.course_name ? `Course: ${issue.course.course_name}` : 'No course specified'}
                        </div>
                        <div className="text-muted small d-flex justify-content-between">
                          <span>Reported: {moment(issue.created_at).format('MMM D, YYYY')}</span>
                          <span>
                            {issue.assigned_to ? 
                              `Assigned to: ${issue.assigned_to.name || 
                                (issue.assigned_to.first_name && issue.assigned_to.last_name ? 
                                  `${issue.assigned_to.first_name} ${issue.assigned_to.last_name}` : 
                                  'Staff')}` : 
                              'Unassigned'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No recent issues found.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Function to render issues content
  const renderIssuesContent = () => {
    return (
      <div>
        <h3 className="mb-4">Department Issues</h3>
        
        {fetchingError && (
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>Warning</Alert.Heading>
            <p>Some data may not be complete: {fetchingError}</p>
            <p>The dashboard will display all available information.</p>
          </Alert>
        )}

        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center bg-light">
              <Card.Body>
                <h3>{issueStats.total}</h3>
                <p className="mb-0">Total Issues</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-warning text-white">
              <Card.Body>
                <h3>{issueStats.pending}</h3>
                <p className="mb-0">Pending</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-info text-white">
              <Card.Body>
                <h3>{issueStats.inProgress}</h3>
                <p className="mb-0">In Progress</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center bg-success text-white">
              <Card.Body>
                <h3>{issueStats.solved}</h3>
                <p className="mb-0">Solved</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card>
          <Card.Header>All Issues</Card.Header>
          <Card.Body>
            {renderIssuesTable(departmentIssues)}
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Function to render issues table
  const renderIssuesTable = (issues) => {
    if (!Array.isArray(issues) || issues.length === 0) {
      return (
        <Alert variant="info">
          No issues found for this department.
        </Alert>
      );
    }

    return (
      <Table hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Course</th>
            <th>Student</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.map(issue => (
            <tr 
              key={issue.id} 
              onClick={() => viewIssueDetails(issue)}
              style={{ cursor: 'pointer' }}
            >
              <td>{issue.id}</td>
              <td>{issue.title}</td>
              <td>{issue.course?.course_name || 'N/A'}</td>
              <td>
                {issue.student?.name || 
                  (issue.student?.first_name && issue.student?.last_name ? 
                    `${issue.student.first_name} ${issue.student.last_name}` : 
                    'Unknown')}
              </td>
              <td>
                {issue.assigned_to ? 
                  (issue.assigned_to.name || 
                    (issue.assigned_to.first_name && issue.assigned_to.last_name ? 
                      `${issue.assigned_to.first_name} ${issue.assigned_to.last_name}` : 
                      'Staff')) : 
                  <span className="text-danger">Unassigned</span>}
              </td>
              <td>
                <BootstrapBadge bg={
                  issue.status?.toLowerCase() === 'solved' || issue.status?.toLowerCase() === 'resolved' ? 'success' :
                  issue.status?.toLowerCase() === 'in_progress' || issue.status?.toLowerCase() === 'in progress' ? 'info' :
                  'warning'
                }>
                  {issue.status}
                </BootstrapBadge>
              </td>
              <td>{moment(issue.created_at).format('MMM D, YYYY')}</td>
              <td>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    viewIssueDetails(issue);
                  }}
                >
                  View Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  // Function to render staff content
  const renderStaffContent = () => {
    return (
      <div>
        <h3 className="mb-4">Department Staff</h3>
        
        {fetchingError && (
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>Warning</Alert.Heading>
            <p>Some data may not be complete: {fetchingError}</p>
            <p>The dashboard will display all available information.</p>
          </Alert>
        )}

        <Card>
          <Card.Header>Staff Members</Card.Header>
          <Card.Body>
            {Array.isArray(departmentStaff) && departmentStaff.length > 0 ? (
              <Row>
                {departmentStaff.map(staff => {
                  const stats = staffIssueStats(staff.id);
                  
                  return (
                    <Col md={6} lg={4} key={staff.id} className="mb-4">
                      <Card 
                        className="staff-card h-100"
                        onClick={() => viewStaffDetails(staff)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card.Body>
                          <div className="d-flex align-items-start mb-3">
                            <div className="staff-avatar rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white" style={{width: "50px", height: "50px"}}>
                              <FaUserTie />
                            </div>
                            <div className="ms-3">
                              <h5 className="mb-1">{staff.title} {staff.first_name} {staff.last_name}</h5>
                              <span className="text-muted">
                                {staff.role === 'HOD' ? 'Head of Department' : 'Lecturer'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="staff-details mb-3">
                            <p className="mb-1"><strong>Email:</strong> {staff.email}</p>
                            <p className="mb-1"><strong>Phone:</strong> {staff.phone || 'Not provided'}</p>
                          </div>
                          
                          <div className="issue-stats">
                            <h6>Issue Statistics</h6>
                            <div className="d-flex justify-content-between mb-1">
                              <span>Total Issues:</span>
                              <span>{stats.total}</span>
                            </div>
                            
                            <div className="mb-1">
                              <small className="d-flex justify-content-between">
                                <span>Solved ({stats.solved})</span>
                                <span>{stats.solvedPercentage.toFixed(0)}%</span>
                              </small>
                              <ProgressBar 
                                variant="success" 
                                now={stats.solvedPercentage} 
                                className="mb-2"
                                style={{ height: '8px' }}
                              />
                            </div>
                            
                            <div className="mb-1">
                              <small className="d-flex justify-content-between">
                                <span>In Progress ({stats.inProgress})</span>
                                <span>{stats.inProgressPercentage.toFixed(0)}%</span>
                              </small>
                              <ProgressBar 
                                variant="info" 
                                now={stats.inProgressPercentage} 
                                className="mb-2"
                                style={{ height: '8px' }}
                              />
                            </div>
                            
                            <div className="mb-1">
                              <small className="d-flex justify-content-between">
                                <span>Pending ({stats.pending})</span>
                                <span>{stats.pendingPercentage.toFixed(0)}%</span>
                              </small>
                              <ProgressBar 
                                variant="warning" 
                                now={stats.pendingPercentage} 
                                className="mb-2"
                                style={{ height: '8px' }}
                              />
                            </div>
                          </div>
                          
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="mt-3 w-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewStaffDetails(staff);
                            }}
                          >
                            View Details
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <Alert variant="info">
                No staff members found for this department.
              </Alert>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Function to render courses content
  const renderCoursesContent = () => {
    return (
      <div>
        <h3 className="mb-4">Department Courses</h3>
        
        {fetchingError && (
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>Warning</Alert.Heading>
            <p>Some data may not be complete: {fetchingError}</p>
            <p>The dashboard will display all available information.</p>
          </Alert>
        )}

        <Card>
          <Card.Header>Courses</Card.Header>
          <Card.Body>
            {Array.isArray(departmentCourses) && departmentCourses.length > 0 ? (
              <Row>
                {departmentCourses.map(course => {
                  // Count issues for this course
                  const courseIssues = Array.isArray(departmentIssues) 
                    ? departmentIssues.filter(issue => 
                        issue.course?.id === course.id || 
                        issue.course === course.id
                      ).length
                    : 0;
                  
                  return (
                    <Col md={6} lg={4} key={course.id} className="mb-4">
                      <Card className="h-100">
                        <Card.Header>
                          <div className="d-flex justify-content-between align-items-center">
                            <strong>{course.course_code}</strong>
                            <BootstrapBadge bg="primary" pill>
                              {courseIssues} Issue{courseIssues !== 1 ? 's' : ''}
                            </BootstrapBadge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <Card.Title>{course.course_name}</Card.Title>
                          <Card.Text>
                            {course.description || 'No description available.'}
                          </Card.Text>
                        </Card.Body>
                        <Card.Footer className="text-muted">
                          {departmentDetails?.name || 'Department'}
                        </Card.Footer>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <Alert variant="info">
                No courses found for this department.
              </Alert>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Function to render settings content
  const renderSettingsContent = () => {
    return (
      <div>
        <h3 className="mb-4">Settings</h3>
        
        <Card className="mb-4">
          <Card.Header>Profile Details</Card.Header>
          <Card.Body>
            <Row>
              <Col md={4} className="text-center mb-3">
                <div className="staff-avatar rounded-circle bg-primary d-flex align-items-center justify-content-center text-white mx-auto" style={{width: "150px", height: "150px"}}>
                  <FaUserTie size={60} />
                </div>
              </Col>
              <Col md={8}>
                <Table bordered>
                  <tbody>
                    <tr>
                      <td width="30%"><strong>Name</strong></td>
                      <td>{user?.title || ''} {user?.first_name || ''} {user?.last_name || ''}</td>
                    </tr>
                    <tr>
                      <td><strong>Email</strong></td>
                      <td>{user?.email || 'Not available'}</td>
                    </tr>
                    <tr>
                      <td><strong>Role</strong></td>
                      <td>Head of Department</td>
                    </tr>
                    <tr>
                      <td><strong>Department</strong></td>
                      <td>{departmentDetails?.name || 'Not assigned'}</td>
                    </tr>
                    <tr>
                      <td><strong>College</strong></td>
                      <td>{departmentDetails?.college?.name || 'Not available'}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Header>Change Password</Card.Header>
          <Card.Body>
            <Form>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>Current Password</Form.Label>
                <Col sm={9}>
                  <Form.Control type="password" placeholder="Enter current password" />
                </Col>
              </Form.Group>
              
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>New Password</Form.Label>
                <Col sm={9}>
                  <Form.Control type="password" placeholder="Enter new password" />
                </Col>
              </Form.Group>
              
              <Form.Group as={Row} className="mb-4">
                <Form.Label column sm={3}>Confirm New Password</Form.Label>
                <Col sm={9}>
                  <Form.Control type="password" placeholder="Confirm new password" />
                </Col>
              </Form.Group>
              
              <div className="d-flex justify-content-end">
                <Button variant="primary">
                  Update Password
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">HOD Dashboard</div>
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
            {menuItems.find((item) => item.id === activeMenu)?.label || "Dashboard"}
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
        <main className="content">
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : error ? (
            <Alert variant="warning">
              <Alert.Heading>Department Dashboard</Alert.Heading>
              <p>{error}</p>
              <p>Don't worry - you can still use the dashboard with sample data.</p>
              <Button onClick={() => {
                // Force load with default department ID
                fetchDepartmentData(1);
              }}>
                Load Sample Data
              </Button>
            </Alert>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Issue Details Modal */}
      <Modal show={detailsModalOpen} onHide={() => setDetailsModalOpen(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Issue Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIssue && (
            <div>
              <h5>Basic Information</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <td width="30%"><strong>Issue ID</strong></td>
                    <td>{selectedIssue.id}</td>
                  </tr>
                  <tr>
                    <td><strong>Title</strong></td>
                    <td>{selectedIssue.title}</td>
                  </tr>
                  <tr>
                    <td><strong>Status</strong></td>
                    <td>
                      <BootstrapBadge bg={
                        selectedIssue.status?.toLowerCase() === 'solved' || selectedIssue.status?.toLowerCase() === 'resolved' ? 'success' :
                        selectedIssue.status?.toLowerCase() === 'in_progress' || selectedIssue.status?.toLowerCase() === 'in progress' ? 'info' :
                        'warning'
                      }>
                        {selectedIssue.status}
                      </BootstrapBadge>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Type</strong></td>
                    <td>{selectedIssue.issue_type || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Date Created</strong></td>
                    <td>{moment(selectedIssue.created_at).format('MMMM D, YYYY [at] h:mm A')}</td>
                  </tr>
                  <tr>
                    <td><strong>Last Updated</strong></td>
                    <td>{moment(selectedIssue.updated_at || selectedIssue.created_at).format('MMMM D, YYYY [at] h:mm A')}</td>
                  </tr>
                </tbody>
              </Table>
              
              <h5 className="mt-4">People</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <td width="30%"><strong>Student</strong></td>
                    <td>
                      {selectedIssue.student?.name || 
                        (selectedIssue.student?.first_name && selectedIssue.student?.last_name ? 
                          `${selectedIssue.student.first_name} ${selectedIssue.student.last_name}` : 
                          'Not specified')}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Course</strong></td>
                    <td>{selectedIssue.course?.course_name || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td><strong>Assigned To</strong></td>
                    <td>
                      {selectedIssue.assigned_to ? 
                        (selectedIssue.assigned_to.name || 
                          (selectedIssue.assigned_to.first_name && selectedIssue.assigned_to.last_name ? 
                            `${selectedIssue.assigned_to.first_name} ${selectedIssue.assigned_to.last_name}` : 
                            'Unknown staff member')) : 
                        <span className="text-danger">Not assigned</span>}
                    </td>
                  </tr>
                </tbody>
              </Table>
              
              <h5 className="mt-4">Description</h5>
              <div className="p-3 bg-light rounded">
                {selectedIssue.description || 'No description provided.'}
              </div>
              
              <div className="d-flex justify-content-end mt-4 gap-2">
                {selectedIssue.status?.toLowerCase() !== 'solved' && 
                  selectedIssue.status?.toLowerCase() !== 'resolved' && (
                  <Button 
                    variant="success" 
                    onClick={() => handleMarkAsSolved(selectedIssue.id)}
                    disabled={markingSolved}
                  >
                    {markingSolved ? 'Processing...' : 'Mark as Solved'}
                  </Button>
                )}
                {!selectedIssue.assigned_to && (
                  <Dropdown>
                    <Dropdown.Toggle variant="primary" id="assign-staff-dropdown">
                      Assign to Staff
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      {departmentStaff.map(staff => (
                        <Dropdown.Item 
                          key={staff.id} 
                          onClick={() => handleAssignIssue(selectedIssue.id, staff.id)}
                          disabled={assigningIssue}
                        >
                          {staff.name || `${staff.first_name} ${staff.last_name}`}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                )}
                <Button variant="secondary" onClick={() => setDetailsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Staff Details Modal */}
      <Modal show={staffDetailsModalOpen} onHide={() => setStaffDetailsModalOpen(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Staff Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStaff && (
            <div>
              <Row>
                <Col md={4} className="text-center mb-3">
                  <div className="staff-avatar rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white" style={{width: "120px", height: "120px", margin: "0 auto"}}>
                    <FaUserTie size={50} />
                  </div>
                </Col>
                <Col md={8}>
                  <h4>{selectedStaff.title} {selectedStaff.first_name} {selectedStaff.last_name}</h4>
                  <p className="text-muted">{selectedStaff.role === 'HOD' ? 'Head of Department' : 'Lecturer'}</p>
                  <p><strong>Email:</strong> {selectedStaff.email}</p>
                  <p><strong>Phone:</strong> {selectedStaff.phone || 'Not provided'}</p>
                </Col>
              </Row>
              
              <h5 className="mt-4">Assigned Issues</h5>
              {staffIssues && staffIssues.length > 0 ? (
                <>
                  <div className="mb-4">
                    <Row>
                      <Col>
                        <Card className="text-center mb-3">
                          <Card.Body>
                            <h5>{staffIssues.length}</h5>
                            <Card.Text>Total Issues</Card.Text>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col>
                        <Card className="text-center mb-3 bg-warning text-white">
                          <Card.Body>
                            <h5>{staffIssues.filter(issue => issue.status?.toLowerCase() === 'pending').length}</h5>
                            <Card.Text>Pending</Card.Text>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col>
                        <Card className="text-center mb-3 bg-info text-white">
                          <Card.Body>
                            <h5>{staffIssues.filter(issue => 
                              issue.status?.toLowerCase() === 'in_progress' || 
                              issue.status?.toLowerCase() === 'in progress'
                            ).length}</h5>
                            <Card.Text>In Progress</Card.Text>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col>
                        <Card className="text-center mb-3 bg-success text-white">
                          <Card.Body>
                            <h5>{staffIssues.filter(issue => 
                              issue.status?.toLowerCase() === 'solved' || 
                              issue.status?.toLowerCase() === 'resolved'
                            ).length}</h5>
                            <Card.Text>Solved</Card.Text>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffIssues.map(issue => (
                        <tr key={issue.id} onClick={() => viewIssueDetails(issue)} style={{cursor: 'pointer'}}>
                          <td>{issue.id}</td>
                          <td>{issue.title}</td>
                          <td>
                            <BootstrapBadge bg={
                              issue.status?.toLowerCase() === 'solved' || issue.status?.toLowerCase() === 'resolved' ? 'success' :
                              issue.status?.toLowerCase() === 'in_progress' || issue.status?.toLowerCase() === 'in progress' ? 'info' :
                              'warning'
                            }>
                              {issue.status}
                            </BootstrapBadge>
                          </td>
                          <td>{moment(issue.created_at).format('MMM D, YYYY')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              ) : (
                <Alert variant="info">
                  This staff member has no assigned issues.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setStaffDetailsModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HeadOfDepartment;