import { useState, useEffect } from "react";
import { Table, Button as BSButton } from "react-bootstrap";
import { useParams } from "react-router-dom";
import {
  Modal,
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import { FaEye, FaCalendarAlt, FaInfoCircle, FaTag } from "react-icons/fa";
import { BsCheck2Circle, BsClockHistory, BsHourglassSplit } from "react-icons/bs";
import {
  getIssues,
  getCourses,
  createIssue,
  getCurrentUser,
} from "../../services/api";
import "./StudentIssues.css";

const StudentsIssues = ({ user }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issues, setIssues] = useState([]);
  const [courses, setCourses] = useState([]);
  const { course_code } = useParams();
  const [studentDepartment, setStudentDepartment] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    status: "Pending",
    course_code: course_code,
    issue_type: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // if (showModal) {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch both data types in parallel
        const [issuesData, coursesData, studentData] = await Promise.all([
          getIssues(),
          getCourses(),
          getCurrentUser(),
        ]);

        console.log("All issues:", issuesData);
        console.log("Current user:", user);
        
        // Filter issues to only show those created by the current student
        const studentIssues = issuesData.filter(
          (issue) => issue.student && (
            (typeof issue.student === 'object' && issue.student.id === user.id) ||
            (typeof issue.student === 'number' && issue.student === user.id)
          )
        );
        
        console.log("Student's issues:", studentIssues);
        setIssues(studentIssues);
        setCourses(coursesData);
        setStudentDepartment(studentData.department);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Handle error appropriately - maybe set an error state
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const filteredCourses = courses.filter(
    (course) => !studentDepartment || course.college_id === studentDepartment.id
  );

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const NewIssue = createIssue(formData);
      console.log("New issue created:", NewIssue);
    } catch (error) {
      console.error("Error creating issue:", error);
    }
    // Reset the form after submission
    setFormData({
      title: "",
      status: "Pending",
      course_code: "",
      issue_type: "",
      description: "",
    });
    handleClose();
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

  const handleViewDetails = (issue) => {
    setSelectedIssue(issue);
    setShowDetailsModal(true);
  };

  return (
    <div className="card p-4">
      <h2 className="card-title">My Issues</h2>
      <Button
        variant="contained"
        color="primary"
        onClick={handleShow}
        className="mb-3"
        style={{ width: "200px", marginLeft: "auto", display: "block" }}
      >
        Add New Issue
      </Button>

      {isLoading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : issues.length > 0 ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Title</th>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Issue Type</th>
              <th>Date Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} value={issue.id}>
                <td>{issue.title}</td>
                <td>{issue.course?.course_code || "N/A"}</td>
                <td>{issue.course?.course_name || "N/A"}</td>
                <td>{issue.issue_type}</td>
                <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`badge bg-${
                      issue.status === "Pending" ? "warning" : 
                      issue.status === "InProgress" ? "primary" : "success"
                    }`}
                  >
                    {getStatusIcon(issue.status)} {issue.status}
                  </span>
                </td>
                <td>
                  <BSButton
                    variant="outline-info"
                    size="sm"
                    onClick={() => handleViewDetails(issue)}
                  >
                    <FaEye className="me-1" /> View
                  </BSButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="text-center p-5">
          <p>No issues found. Create your first issue by clicking the button above.</p>
        </div>
      )}

      {/* MUI Modal for Adding New Issue */}
      <Modal
        open={showModal}
        onClose={handleClose}
        backdrop="static"
        className="custom-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Log New Issue
          </Typography>

          {/* Issue Title */}
          <TextField
            label="Issue Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            fullWidth
            margin="normal"
            variant="outlined"
            required
          />

          {/* Course Dropdown */}
          <TextField
            select
            label="Course"
            name="course"
            value={formData.course || ""}
            onChange={handleChange}
            fullWidth
            margin="normal"
            variant="outlined"
            required
          >
            <MenuItem value="">Select a course</MenuItem>
            {filteredCourses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.course_code} - {course.course_name}
              </MenuItem>
            ))}
          </TextField>

          {/* Issue Type Dropdown */}
          <TextField
            select
            label="Issue Type"
            name="issue_type"
            value={formData.issue_type}
            onChange={handleChange}
            fullWidth
            margin="normal"
            variant="outlined"
            required
          >
            <MenuItem value="">Select Issue Type</MenuItem>
            <MenuItem value="Missing Marks">Missing Marks</MenuItem>
            <MenuItem value="Appeals">Appeals</MenuItem>
            <MenuItem value="Corrections">Corrections</MenuItem>
          </TextField>

          {/* Issue Description */}
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
            margin="normal"
            variant="outlined"
            required
          />

          {/* Submit Button */}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
          >
            Submit
          </Button>
        </Box>
      </Modal>

      {/* Issue Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        className="custom-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
            maxWidth: "800px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto"
          }}
        >
          {selectedIssue && (
            <>
              <Typography variant="h5" gutterBottom>
                {selectedIssue.title}
              </Typography>
              
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
                      <h6 className="mb-0 small text-uppercase">Issue Information</h6>
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
                      <h6 className="mb-0 small text-uppercase">Assignment Information</h6>
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
                            <th>Updated At:</th>
                            <td>{selectedIssue.updated_at ? new Date(selectedIssue.updated_at).toLocaleString() : 'N/A'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header bg-light">
                  <h6 className="mb-0 small text-uppercase">Description</h6>
                </div>
                <div className="card-body">
                  <p className="mb-0">
                    {selectedIssue.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default StudentsIssues;
