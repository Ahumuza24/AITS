import { useEffect, useState } from "react";
import { getDepartments, createDepartment, getColleges } from "../../services/api";
import { Table, Button, Modal, Form } from "react-bootstrap";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    department_name: "",
    department_code: "",
    details: "",
    college_id: ""
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, collegeData] = await Promise.all([
          getDepartments(),
          getColleges()
        ]);
        setDepartments(deptData);
        setColleges(collegeData);
      } catch (err) {
        console.error("Failed to load data", err);
        setError("Failed to load data. Please try again.");
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    if (!formData.department_name || !formData.department_code || !formData.college_id) {
      setError("Please fill all required fields");
      return;
    }

    try {
      const newDepartment = await createDepartment(formData);
      
      // Update the local state with the new department
      setDepartments((prev) => [...prev, newDepartment]);
      
      // Reset form and close modal
      setFormData({
        department_name: "",
        department_code: "",
        details: "",
        college_id: ""
      });
      setSuccess("Department created successfully!");
      
      // Close modal after a short delay to show the success message
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      console.error("Failed to create department", err);
      setError(err.response?.data?.detail || "Failed to create department. Please try again.");
    }
  };

  return (
    <div>
      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">Total Departments</h2>
          <p className="card-value">{departments.length}</p>
        </div>
        <div className="card">
          <h2 className="card-title">Department Courses</h2>
          <p className="card-value">15</p>
        </div>
        <div className="card">
          <h2 className="card-title">Total Colleges</h2>
          <p className="card-value">{colleges.length}</p>
        </div>
      </div>
      <div className="card">
        <div className="card_header d-flex justify-content-between align-items-center mb-3">
          <h2 className="card-title mb-0">Departments</h2>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Add Department
          </Button>
        </div>

        {error && (
          <div className="alert alert-danger mb-3" role="alert">
            {error}
          </div>
        )}

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Department Code</th>
              <th>Department Name</th>
              <th>Details</th>
              <th>College</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id}>
                <td>{department.department_code}</td>
                <td>{department.department_name}</td>
                <td>{department.details || "N/A"}</td>
                <td>{department.college_name}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Add Department Modal */}
        <Modal
          show={isModalOpen}
          onHide={() => {
            setIsModalOpen(false);
            setError(null);
            setSuccess(null);
          }}
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>Add New Department</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formDepartmentName">
                <Form.Label>Department Name</Form.Label>
                <Form.Control
                  type="text"
                  name="department_name"
                  value={formData.department_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter department name"
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formDepartmentCode">
                <Form.Label>Department Code</Form.Label>
                <Form.Control
                  type="text"
                  name="department_code"
                  value={formData.department_code}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter department code (e.g., DCS)"
                  maxLength="10"
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formCollege">
                <Form.Label>College</Form.Label>
                <Form.Select 
                  name="college_id"
                  value={formData.college_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a college</option>
                  {colleges.map(college => (
                    <option key={college.id} value={college.id}>
                      {college.name} ({college.code})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="formDetails">
                <Form.Label>Details</Form.Label>
                <Form.Control
                  as="textarea"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Optional description"
                />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button variant="success" type="submit">
                  Create Department
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default Departments;
